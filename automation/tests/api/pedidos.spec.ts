import { test, expect } from '@playwright/test';
import { criarUsuario } from '../../factories/usuario.factory';
import { CarrinhoService } from '../../services/carrinho.service';
import { schemaErro, schemaPedido } from '../../schemas/api.schema';
import { settings } from '../../support/env';

test.describe('Confirmação fictícia de pedidos na API @regression', () => {
  const itens = [{ produtoId: 'P005', quantidade: 1 }];

  test('confirma pedido válido com cliente fictício e CEP normalizado @smoke', async ({ request }) => {
    const cliente = criarUsuario();
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

  test('confirma pedido sem cupom', async ({ request }) => {
    const response = await new CarrinhoService(request).criarPedido({ cliente: criarUsuario({ cep: '01310100' }), itens });
    expect(response.status()).toBe(201);
    expect(schemaPedido.parse(await response.json())).toMatchObject({ desconto: 0, total: 119.9, cupom: null });
  });

  test('CA06/CA08: pedido de R$ 200 com cupom confirma com frete grátis', async ({ request }) => {
    test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
    const response = await new CarrinhoService(request).criarPedido({
      cliente: criarUsuario(), itens: [{ produtoId: 'P005', quantidade: 2 }], cupom: settings.cupomValido,
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
    test(`pedido com ${cupom} responde 422 ${codigo}`, async ({ request }) => {
      const response = await new CarrinhoService(request).criarPedido({ cliente: criarUsuario(), itens, cupom });
      expect(response.status()).toBe(422);
      expect(schemaErro.parse(await response.json()).erro.codigo).toBe(codigo);
    });
  }

  for (const { campo, override } of [
    { campo: 'cliente.nome', override: { nome: 'Cliente' } },
    { campo: 'cliente.email', override: { email: 'email-invalido' } },
    { campo: 'cliente.cep', override: { cep: '123' } },
  ]) {
    test(`rejeita ${campo} inválido com detalhe do campo`, async ({ request }) => {
      const response = await new CarrinhoService(request).criarPedido({ cliente: criarUsuario(override), itens });
      expect(response.status()).toBe(422);
      const erro = schemaErro.parse(await response.json()).erro;
      expect(erro.codigo).toBe('DADOS_INVALIDOS');
      expect(erro.campos).toEqual(expect.arrayContaining([expect.objectContaining({ campo })]));
    });
  }

  test('CA10: pedido rejeita seis unidades do mesmo produto', async ({ request }) => {
    test.info().annotations.push({ type: 'issue', description: 'BUG-002' });
    const response = await new CarrinhoService(request).criarPedido({
      cliente: criarUsuario(), itens: [{ produtoId: 'P001', quantidade: 6 }],
    });
    expect(response.status()).toBe(422);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('QUANTIDADE_MAXIMA_EXCEDIDA');
  });

  test('pedido rejeita produto duplicado', async ({ request }) => {
    const response = await new CarrinhoService(request).criarPedido({
      cliente: criarUsuario(), itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }],
    });
    expect(response.status()).toBe(422);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('ITEM_DUPLICADO');
  });
});
