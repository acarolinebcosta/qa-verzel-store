import { test, expect } from '@playwright/test';
import { criarCliente } from '../../factories/cliente.factory';
import { CarrinhoService } from '../../services/carrinho.service';
import { schemaErro, schemaPedido } from '../../schemas/api.schema';
import { settings } from '../../support/env';

test.describe('Confirmação fictícia de pedidos na API @regression', () => {
  const itens = [{ produtoId: 'P005', quantidade: 1 }];

  test('CT-CA01-203 confirma pedido válido com cliente fictício e CEP normalizado @smoke', async ({ request }) => {
    const cliente = criarCliente();
    const response = await new CarrinhoService(request).criarPedido({ cliente, itens, cupom: settings.cupomValido });
    expect(response.status()).toBe(201);
    const pedido = schemaPedido.parse(await response.json());
    expect(pedido).toMatchObject({
      cliente: { nome: cliente.nome, email: cliente.email, cep: '01310100' },
      subtotal: 100, desconto: 10, frete: 19.9, total: 109.9,
      cupom: { aplicado: true, codigo: settings.cupomValido.toUpperCase() },
    });
    // O número é fictício e o pedido não é armazenado; não existe GET de pedidos.
  });

  test('CT-CA09-202 confirma pedido sem cupom', async ({ request }) => {
    const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente({ cep: '01310100' }), itens });
    expect(response.status()).toBe(201);
    expect(schemaPedido.parse(await response.json())).toMatchObject({ desconto: 0, total: 119.9, cupom: null });
  });

  test('CT-CA08-203 CA06/CA08: pedido de R$ 200 com cupom confirma com frete grátis', async ({ request }) => {
    test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
    const response = await new CarrinhoService(request).criarPedido({
      cliente: criarCliente(), itens: [{ produtoId: 'P005', quantidade: 2 }], cupom: settings.cupomValido,
    });
    expect(response.status()).toBe(201);
    expect(schemaPedido.parse(await response.json())).toMatchObject({
      subtotal: 200, desconto: 20, frete: 0, freteGratis: true, total: 180,
    });
  });

  for (const [cupom, codigo] of [
    [settings.cupomInvalido, 'CUPOM_INVALIDO'],
    [settings.cupomExpirado, 'CUPOM_EXPIRADO'],
  ]) {
    test(`CT-${codigo === 'CUPOM_EXPIRADO' ? 'CA04' : 'CA03'}-220 pedido com ${cupom} responde 422 ${codigo}`, async ({ request }) => {
      const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente(), itens, cupom });
      expect(response.status()).toBe(422);
      expect(schemaErro.parse(await response.json()).erro.codigo).toBe(codigo);
    });
  }

  for (const [indice, { campo, override }] of [
    { campo: 'cliente.nome', override: { nome: 'Cliente' } },
    { campo: 'cliente.email', override: { email: 'email-invalido' } },
    { campo: 'cliente.cep', override: { cep: '123' } },
  ].entries()) {
    test(`CT-CA10-${222 + indice} rejeita ${campo} inválido com detalhe do campo`, async ({ request }) => {
      const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente(override), itens });
      expect(response.status()).toBe(422);
      const erro = schemaErro.parse(await response.json()).erro;
      expect(erro.codigo).toBe('DADOS_INVALIDOS');
      expect(erro.campos).toEqual(expect.arrayContaining([expect.objectContaining({ campo })]));
    });
  }

  test('CT-CA10-220 CA10: pedido rejeita seis unidades do mesmo produto', async ({ request }) => {
    test.info().annotations.push({ type: 'issue', description: 'BUG-002' });
    const response = await new CarrinhoService(request).criarPedido({
      cliente: criarCliente(), itens: [{ produtoId: 'P001', quantidade: 6 }],
    });
    expect(response.status()).toBe(422);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('QUANTIDADE_MAXIMA_EXCEDIDA');
  });

  test('CT-CA10-221 pedido rejeita produto duplicado', async ({ request }) => {
    const response = await new CarrinhoService(request).criarPedido({
      cliente: criarCliente(), itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }],
    });
    expect(response.status()).toBe(422);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('ITEM_DUPLICADO');
  });
});
