# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/pedidos.spec.ts >> Confirmação fictícia de pedidos na API @regression >> CT-CA10-220 CA10: pedido rejeita seis unidades do mesmo produto
- Location: tests/api/pedidos.spec.ts:69:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 422
Received: 201
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { criarCliente } from '../../factories/cliente.factory';
  3  | import { CarrinhoService } from '../../services/carrinho.service';
  4  | import { schemaErro, schemaPedido } from '../../schemas/api.schema';
  5  | import { settings } from '../../support/env';
  6  | import { esperarResumoAPI } from '../../support/monetary';
  7  | 
  8  | test.describe('Confirmação fictícia de pedidos na API @regression', () => {
  9  |   const itens = [{ produtoId: 'P005', quantidade: 1 }];
  10 | 
  11 |   test('CT-CLI-004 confirma pedido válido com cupom e CEP normalizado @smoke', async ({ request }) => {
  12 |     const cliente = criarCliente();
  13 |     const response = await new CarrinhoService(request).criarPedido({ cliente, itens, cupom: settings.cupomValido });
  14 |     expect(response.status()).toBe(201);
  15 |     const pedido = schemaPedido.parse(await response.json());
  16 |     esperarResumoAPI(pedido, {
  17 |       cliente: { nome: cliente.nome, email: cliente.email, cep: '01310100' },
  18 |       subtotal: 100, desconto: 10, frete: 19.9, total: 109.9,
  19 |       cupom: { aplicado: true, codigo: settings.cupomValido.toUpperCase() },
  20 |     });
  21 |     // O número é fictício e o pedido não é armazenado; não existe GET de pedidos.
  22 |   });
  23 | 
  24 |   test('CT-CLI-006 confirma pedido sem cupom e CEP sem hífen', async ({ request }) => {
  25 |     const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente({ cep: '01310100' }), itens });
  26 |     expect(response.status()).toBe(201);
  27 |     esperarResumoAPI(schemaPedido.parse(await response.json()), {
  28 |       cliente: { cep: '01310100' }, subtotal: 100, desconto: 0, frete: 19.9, total: 119.9, cupom: null,
  29 |     });
  30 |   });
  31 | 
  32 |   test('CT-CA08-203 CA06/CA08: pedido de R$ 200 com cupom confirma com frete grátis', async ({ request }) => {
  33 |     test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
  34 |     const response = await new CarrinhoService(request).criarPedido({
  35 |       cliente: criarCliente(), itens: [{ produtoId: 'P005', quantidade: 2 }], cupom: settings.cupomValido,
  36 |     });
  37 |     expect(response.status()).toBe(201);
  38 |     esperarResumoAPI(schemaPedido.parse(await response.json()), {
  39 |       subtotal: 200, desconto: 20, frete: 0, freteGratis: true, total: 180,
  40 |     });
  41 |   });
  42 | 
  43 |   for (const { id, cupom, codigo } of [
  44 |     { id: 'CT-CA03-220', cupom: settings.cupomInvalido, codigo: 'CUPOM_INVALIDO' },
  45 |     { id: 'CT-CA04-220', cupom: settings.cupomExpirado, codigo: 'CUPOM_EXPIRADO' },
  46 |   ]) {
  47 |     test(`${id} pedido com ${cupom} responde 422 ${codigo}`, async ({ request }) => {
  48 |       const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente(), itens, cupom });
  49 |       expect(response.status()).toBe(422);
  50 |       expect(schemaErro.parse(await response.json()).erro.codigo).toBe(codigo);
  51 |     });
  52 |   }
  53 | 
  54 |   for (const { id, campo, override } of [
  55 |     { id: 'CT-CLI-001', campo: 'cliente.nome', override: { nome: 'Maria' } },
  56 |     { id: 'CT-CLI-002', campo: 'cliente.email', override: { email: 'maria@exemplo' } },
  57 |     { id: 'CT-CLI-003', campo: 'cliente.cep', override: { cep: '0131010' } },
  58 |     { id: 'CT-CLI-005', campo: 'cliente.cep', override: { cep: '01310 100' } },
  59 |   ]) {
  60 |     test(`${id} rejeita ${campo} inválido ${JSON.stringify(override)} com detalhe do campo`, async ({ request }) => {
  61 |       const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente(override), itens });
  62 |       expect(response.status()).toBe(422);
  63 |       const erro = schemaErro.parse(await response.json()).erro;
  64 |       expect(erro.codigo).toBe('DADOS_INVALIDOS');
  65 |       expect(erro.campos).toEqual(expect.arrayContaining([expect.objectContaining({ campo })]));
  66 |     });
  67 |   }
  68 | 
  69 |   test('CT-CA10-220 CA10: pedido rejeita seis unidades do mesmo produto', async ({ request }) => {
  70 |     test.info().annotations.push({ type: 'issue', description: 'BUG-002' });
  71 |     const response = await new CarrinhoService(request).criarPedido({
  72 |       cliente: criarCliente(), itens: [{ produtoId: 'P001', quantidade: 6 }],
  73 |     });
> 74 |     expect(response.status()).toBe(422);
     |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  75 |     expect(schemaErro.parse(await response.json()).erro.codigo).toBe('QUANTIDADE_MAXIMA_EXCEDIDA');
  76 |   });
  77 | 
  78 |   test('CT-API-013 pedido rejeita produto duplicado', async ({ request }) => {
  79 |     const response = await new CarrinhoService(request).criarPedido({
  80 |       cliente: criarCliente(), itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }],
  81 |     });
  82 |     expect(response.status()).toBe(422);
  83 |     expect(schemaErro.parse(await response.json()).erro.codigo).toBe('ITEM_DUPLICADO');
  84 |   });
  85 | });
  86 | 
```