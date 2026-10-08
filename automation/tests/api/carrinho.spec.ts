import { test, expect } from '@playwright/test';
import { CarrinhoService, type ItemCarrinho } from '../../services/carrinho.service';
import { schemaErro, schemaResumoCarrinho } from '../../schemas/api.schema';
import { settings } from '../../support/env';

test.describe('Frete e cálculo do carrinho na API @regression', () => {
  const fronteiras: { id: string; subtotal: number; itens: ItemCarrinho[]; frete: number; faltante: number }[] = [
    { id: 'CT-CA09-201', subtotal: 100, itens: [{ produtoId: 'P005', quantidade: 1 }], frete: 19.9, faltante: 100 },
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
      expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
        subtotal, desconto: 0, frete, freteGratis: frete === 0,
        valorFaltanteFreteGratis: faltante,
        total: Number((subtotal + frete).toFixed(2)), cupom: null,
      });
    });
  }

  for (const [indice, { subtotal, itens, frete, faltante }] of fronteiras.filter(({ subtotal }) => subtotal >= 200).entries()) {
    test(`CT-CA08-${201 + indice} CA08: cupom preserva regra de frete sobre subtotal R$ ${subtotal.toFixed(2)}`, async ({ request }) => {
      if (subtotal === 200) test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
      const response = await new CarrinhoService(request).calcular(itens, settings.cupomValido);
      expect(response.status()).toBe(200);
      const desconto = Number((subtotal * 0.1).toFixed(2));
      expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
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
    expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
      subtotal: 200, desconto: 0, frete: 0, total: 200, freteGratis: true,
      cupom: { aplicado: false, mensagem: 'Cupom expirado.' },
    });
  });

  test('CT-CA10-201 CA10: aceita exatamente cinco unidades por produto', async ({ request }) => {
    const response = await new CarrinhoService(request).calcular([{ produtoId: 'P006', quantidade: 5 }]);
    expect(response.status()).toBe(200);
    expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
      itens: [expect.objectContaining({ produtoId: 'P006', quantidade: 5, total: 149.5 })],
      subtotal: 149.5, frete: 19.9, total: 169.4,
    });
  });

  test('CT-CA11-201 CA11: arredonda subtotal, desconto e total para centavos', async ({ request }) => {
    const response = await new CarrinhoService(request).calcular([
      { produtoId: 'P002', quantidade: 1 }, { produtoId: 'P004', quantidade: 2 },
    ], settings.cupomValido);
    expect(response.status()).toBe(200);
    const resumo = schemaResumoCarrinho.parse(await response.json());
    expect(resumo).toMatchObject({ subtotal: 239.7, desconto: 23.97, frete: 0, total: 215.73 });
    expect(resumo.itens.map(({ total }) => total)).toEqual([139.9, 99.8]);
  });

  const entradasInvalidas: { nome: string; payload: unknown; codigo: string }[] = [
    { nome: 'itens ausentes', payload: {}, codigo: 'ITENS_OBRIGATORIOS' },
    { nome: 'carrinho vazio', payload: { itens: [] }, codigo: 'ITENS_OBRIGATORIOS' },
    { nome: 'item sem objeto', payload: { itens: [null] }, codigo: 'ITEM_INVALIDO' },
    { nome: 'produto inexistente', payload: { itens: [{ produtoId: 'P999', quantidade: 1 }] }, codigo: 'PRODUTO_NAO_ENCONTRADO' },
    { nome: 'CA10: seis unidades', payload: { itens: [{ produtoId: 'P001', quantidade: 6 }] }, codigo: 'QUANTIDADE_MAXIMA_EXCEDIDA' },
    { nome: 'quantidade zero', payload: { itens: [{ produtoId: 'P001', quantidade: 0 }] }, codigo: 'QUANTIDADE_INVALIDA' },
    { nome: 'quantidade negativa', payload: { itens: [{ produtoId: 'P001', quantidade: -1 }] }, codigo: 'QUANTIDADE_INVALIDA' },
    { nome: 'quantidade fracionária', payload: { itens: [{ produtoId: 'P001', quantidade: 1.5 }] }, codigo: 'QUANTIDADE_INVALIDA' },
    { nome: 'quantidade textual', payload: { itens: [{ produtoId: 'P001', quantidade: '1' }] }, codigo: 'QUANTIDADE_INVALIDA' },
    {
      nome: 'produto duplicado',
      payload: { itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }] },
      codigo: 'ITEM_DUPLICADO',
    },
  ];

  for (const [indice, { nome, payload, codigo }] of entradasInvalidas.entries()) {
    test(`CT-CA10-${202 + indice} rejeita ${nome} com erro documentado`, async ({ request }) => {
      if (codigo === 'QUANTIDADE_MAXIMA_EXCEDIDA') {
        test.info().annotations.push({ type: 'issue', description: 'BUG-002' });
      }
      const response = await new CarrinhoService(request).calcularPayload(payload);
      expect(response.status()).toBe(422);
      expect(schemaErro.parse(await response.json()).erro.codigo).toBe(codigo);
    });
  }

  test('CT-CA10-212 JSON malformado responde 400', async ({ request }) => {
    const response = await request.post('/api/carrinho/calcular', {
      data: '{"itens":', headers: { 'Content-Type': 'application/json' },
    });
    expect(response.status()).toBe(400);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('JSON_INVALIDO');
  });
});
