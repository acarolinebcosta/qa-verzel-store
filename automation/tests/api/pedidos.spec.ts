import { test, expect } from '@playwright/test';
import { criarCliente } from '../../factories/cliente.factory';
import { CarrinhoService } from '../../services/carrinho.service';
import { schemaErro, schemaPedido } from '../../schemas/api.schema';
import { settings } from '../../support/env';
import { esperarResumoAPI } from '../../support/monetary';

test.describe('Confirmação fictícia de pedidos na API @regression', () => {
  const itens = [{ produtoId: 'P005', quantidade: 1 }];

  test('CT-CLI-004 confirma pedido válido com cupom e CEP normalizado @smoke', async ({ request }) => {
    const cliente = criarCliente();
    const response = await new CarrinhoService(request).criarPedido({ cliente, itens, cupom: settings.cupomValido });
    expect(response.status()).toBe(201);
    const pedido = schemaPedido.parse(await response.json());
    esperarResumoAPI(pedido, {
      cliente: { nome: cliente.nome, email: cliente.email, cep: '01310100' },
      subtotal: 100, desconto: 10, frete: 19.9, total: 109.9,
      cupom: { aplicado: true, codigo: settings.cupomValido.toUpperCase() },
    });
    // O número é fictício e o pedido não é armazenado; não existe GET de pedidos.
  });

  test('CT-CLI-006 confirma pedido sem cupom e CEP sem hífen', async ({ request }) => {
    const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente({ cep: '01310100' }), itens });
    expect(response.status()).toBe(201);
    esperarResumoAPI(schemaPedido.parse(await response.json()), {
      cliente: { cep: '01310100' }, subtotal: 100, desconto: 0, frete: 19.9, total: 119.9, cupom: null,
    });
  });

  test('CT-CA08-203 CA06/CA08: pedido de R$ 200 com cupom confirma com frete grátis', async ({ request }) => {
    test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
    const response = await new CarrinhoService(request).criarPedido({
      cliente: criarCliente(), itens: [{ produtoId: 'P005', quantidade: 2 }], cupom: settings.cupomValido,
    });
    expect(response.status()).toBe(201);
    esperarResumoAPI(schemaPedido.parse(await response.json()), {
      subtotal: 200, desconto: 20, frete: 0, freteGratis: true, total: 180,
    });
  });

  for (const { id, cupom, codigo } of [
    { id: 'CT-CA03-220', cupom: settings.cupomInvalido, codigo: 'CUPOM_INVALIDO' },
    { id: 'CT-CA04-220', cupom: settings.cupomExpirado, codigo: 'CUPOM_EXPIRADO' },
  ]) {
    test(`${id} pedido com ${cupom} responde 422 ${codigo}`, async ({ request }) => {
      const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente(), itens, cupom });
      expect(response.status()).toBe(422);
      expect(schemaErro.parse(await response.json()).erro.codigo).toBe(codigo);
    });
  }

  for (const { id, campo, override } of [
    { id: 'CT-CLI-001', campo: 'cliente.nome', override: { nome: 'Maria' } },
    { id: 'CT-CLI-002', campo: 'cliente.email', override: { email: 'maria@exemplo' } },
    { id: 'CT-CLI-003', campo: 'cliente.cep', override: { cep: '0131010' } },
    { id: 'CT-CLI-005', campo: 'cliente.cep', override: { cep: '01310 100' } },
  ]) {
    test(`${id} rejeita ${campo} inválido ${JSON.stringify(override)} com detalhe do campo`, async ({ request }) => {
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

  test('CT-API-013 pedido rejeita produto duplicado', async ({ request }) => {
    const response = await new CarrinhoService(request).criarPedido({
      cliente: criarCliente(), itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }],
    });
    expect(response.status()).toBe(422);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('ITEM_DUPLICADO');
  });
});
