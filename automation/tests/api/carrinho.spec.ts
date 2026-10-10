import { test, expect } from '@playwright/test';
import { CarrinhoService, type ItemCarrinho } from '../../services/carrinho.service';
import { schemaErro, schemaResumoCarrinho } from '../../schemas/api.schema';
import { settings } from '../../support/env';
import { esperarResumoAPI } from '../../support/monetary';

test.describe('Frete e cálculo do carrinho na API @regression', () => {
  const fronteiras: { id: string; subtotal: number; itens: ItemCarrinho[]; frete: number; faltante: number }[] = [
    { id: 'CT-CA07-203', subtotal: 100, itens: [{ produtoId: 'P005', quantidade: 1 }], frete: 19.9, faltante: 100 },
    { id: 'CT-CA07-201', subtotal: 199.8, itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P002', quantidade: 1 }], frete: 19.9, faltante: 0.2 },
    {
      id: 'CT-CA07-202', subtotal: 199.9,
      itens: [
        { produtoId: 'P005', quantidade: 1 },
        { produtoId: 'P004', quantidade: 1 },
        { produtoId: 'P008', quantidade: 1 },
      ],
      frete: 19.9, faltante: 0.1,
    },
    { id: 'CT-CA06-201', subtotal: 200, itens: [{ produtoId: 'P005', quantidade: 2 }], frete: 0, faltante: 0 },
    // R$ 200,10 não pode ser formado pelos preços fixos com até 5 unidades.
    // R$ 209,40 é o menor subtotal permitido acima do limite.
    {
      id: 'CT-CA06-202', subtotal: 209.4,
      itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P006', quantidade: 5 }],
      frete: 0, faltante: 0,
    },
  ];

  for (const { id, subtotal, itens, frete, faltante } of fronteiras) {
    test(`${id} fronteira de subtotal R$ ${subtotal.toFixed(2)} sem cupom @smoke`, async ({ request }) => {
      if (subtotal === 200) test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
      expect(settings.valorMinimo).toBe(200);
      const response = await new CarrinhoService(request).calcular(itens);
      expect(response.status()).toBe(200);
      esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
        subtotal, desconto: 0, frete, freteGratis: frete === 0,
        valorFaltanteFreteGratis: faltante,
        total: Number((subtotal + frete).toFixed(2)), cupom: null,
      });
    });
  }

  const fronteirasComCupom = [
    { ...fronteiras.find(({ subtotal }) => subtotal === 200)!, id: 'CT-CA08-201' },
    { ...fronteiras.find(({ subtotal }) => subtotal === 209.4)!, id: 'CT-CA08-202' },
    { ...fronteiras.find(({ subtotal }) => subtotal === 199.9)!, id: 'CT-CA08-204' },
  ];
  for (const { id, subtotal, itens, frete, faltante } of fronteirasComCupom) {
    test(`${id} CA08: cupom preserva regra de frete sobre subtotal R$ ${subtotal.toFixed(2)}`, async ({ request }) => {
      if (subtotal === 200) test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
      const response = await new CarrinhoService(request).calcular(itens, settings.cupomValido);
      expect(response.status()).toBe(200);
      const desconto = Number((subtotal * 0.1).toFixed(2));
      esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
        subtotal, desconto, frete, freteGratis: frete === 0,
        valorFaltanteFreteGratis: faltante,
        total: Number((subtotal - desconto + frete).toFixed(2)),
      });
    });
  }

  test('CT-CA04-202 cupom expirado no limite mantém cálculo 200 sem desconto', async ({ request }) => {
    test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
    const response = await new CarrinhoService(request).calcular([{ produtoId: 'P005', quantidade: 2 }], settings.cupomExpirado);
    expect(response.status()).toBe(200);
    esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
      subtotal: 200, desconto: 0, frete: 0, total: 200, freteGratis: true,
      cupom: { aplicado: false, mensagem: 'Cupom expirado.' },
    });
  });

  test('CT-CA10-201 CA10: aceita exatamente cinco unidades por produto', async ({ request }) => {
    const response = await new CarrinhoService(request).calcular([{ produtoId: 'P006', quantidade: 5 }]);
    expect(response.status()).toBe(200);
    const resumo = schemaResumoCarrinho.parse(await response.json());
    esperarResumoAPI(resumo, {
      itens: [expect.objectContaining({ produtoId: 'P006', quantidade: 5 })],
      subtotal: 149.5, frete: 19.9, total: 169.4,
    });
    expect(resumo.itens[0].precoUnitario).toBeCloseTo(29.9, 2);
    expect(resumo.itens[0].total).toBeCloseTo(149.5, 2);
  });

  test('CT-CA11-201 CA11: arredonda subtotal, desconto e total para centavos', async ({ request }) => {
    const response = await new CarrinhoService(request).calcular([
      { produtoId: 'P002', quantidade: 1 }, { produtoId: 'P004', quantidade: 2 },
    ], settings.cupomValido);
    expect(response.status()).toBe(200);
    const resumo = schemaResumoCarrinho.parse(await response.json());
    esperarResumoAPI(resumo, { subtotal: 239.7, desconto: 23.97, frete: 0, total: 215.73 });
    expect(resumo.itens).toHaveLength(2);
    expect(resumo.itens[0]).toMatchObject({ produtoId: 'P002', quantidade: 1 });
    expect(resumo.itens[0].precoUnitario).toBeCloseTo(139.9, 2);
    expect(resumo.itens[0].total).toBeCloseTo(139.9, 2);
    expect(resumo.itens[1]).toMatchObject({ produtoId: 'P004', quantidade: 2 });
    expect(resumo.itens[1].precoUnitario).toBeCloseTo(49.9, 2);
    expect(resumo.itens[1].total).toBeCloseTo(99.8, 2);
  });

  const entradasInvalidas: { id: string; nome: string; payload: unknown; codigo: string }[] = [
    { id: 'CT-API-002', nome: 'itens ausentes', payload: {}, codigo: 'ITENS_OBRIGATORIOS' },
    { id: 'CT-API-003', nome: 'carrinho vazio', payload: { itens: [] }, codigo: 'ITENS_OBRIGATORIOS' },
    { id: 'CT-API-004', nome: 'itens nulos', payload: { itens: null }, codigo: 'ITENS_OBRIGATORIOS' },
    { id: 'CT-API-005', nome: 'item sem produtoId', payload: { itens: [{ quantidade: 1 }] }, codigo: 'ITEM_INVALIDO' },
    { id: 'CT-API-006', nome: 'item sem quantidade', payload: { itens: [{ produtoId: 'P001' }] }, codigo: 'ITEM_INVALIDO' },
    { id: 'CT-API-012', nome: 'item sem objeto', payload: { itens: [null] }, codigo: 'ITEM_INVALIDO' },
    { id: 'CT-API-007', nome: 'produto inexistente', payload: { itens: [{ produtoId: 'P999', quantidade: 1 }] }, codigo: 'PRODUTO_NAO_ENCONTRADO' },
    { id: 'CT-CA10-206', nome: 'CA10: seis unidades', payload: { itens: [{ produtoId: 'P001', quantidade: 6 }] }, codigo: 'QUANTIDADE_MAXIMA_EXCEDIDA' },
    { id: 'CT-CA10-207', nome: 'quantidade zero', payload: { itens: [{ produtoId: 'P001', quantidade: 0 }] }, codigo: 'QUANTIDADE_INVALIDA' },
    { id: 'CT-CA10-208', nome: 'quantidade negativa', payload: { itens: [{ produtoId: 'P001', quantidade: -1 }] }, codigo: 'QUANTIDADE_INVALIDA' },
    { id: 'CT-CA10-209', nome: 'quantidade fracionária', payload: { itens: [{ produtoId: 'P001', quantidade: 1.5 }] }, codigo: 'QUANTIDADE_INVALIDA' },
    { id: 'CT-CA10-210', nome: 'quantidade textual', payload: { itens: [{ produtoId: 'P001', quantidade: '3' }] }, codigo: 'QUANTIDADE_INVALIDA' },
    {
      id: 'CT-API-008', nome: 'produto duplicado',
      payload: { itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }] },
      codigo: 'ITEM_DUPLICADO',
    },
  ];

  for (const { id, nome, payload, codigo } of entradasInvalidas) {
    test(`${id} rejeita ${nome} com erro documentado`, async ({ request }) => {
      if (codigo === 'QUANTIDADE_MAXIMA_EXCEDIDA') {
        test.info().annotations.push({ type: 'issue', description: 'BUG-002' });
      }
      const response = await new CarrinhoService(request).calcularPayload(payload);
      expect(response.status()).toBe(422);
      expect(schemaErro.parse(await response.json()).erro.codigo).toBe(codigo);
    });
  }

  test('CT-API-001 JSON malformado responde 400', async ({ request }) => {
    const response = await request.post('/api/carrinho/calcular', {
      data: '{"itens":', headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('JSON_INVALIDO');
  });
});
