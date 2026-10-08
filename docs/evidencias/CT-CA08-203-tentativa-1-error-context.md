# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/pedidos.spec.ts >> Confirmação fictícia de pedidos na API @regression >> CT-CA08-203 CA06/CA08: pedido de R$ 200 com cupom confirma com frete grátis
- Location: tests/api/pedidos.spec.ts:29:7

# Error details

```
Error: expect(received).toMatchObject(expected)

- Expected  - 3
+ Received  + 3

  Object {
    "desconto": 20,
-   "frete": 0,
-   "freteGratis": true,
+   "frete": 19.9,
+   "freteGratis": false,
    "subtotal": 200,
-   "total": 180,
+   "total": 199.9,
  }
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { criarCliente } from '../../factories/cliente.factory';
  3  | import { CarrinhoService } from '../../services/carrinho.service';
  4  | import { schemaErro, schemaPedido } from '../../schemas/api.schema';
  5  | import { settings } from '../../support/env';
  6  | 
  7  | test.describe('Confirmação fictícia de pedidos na API @regression', () => {
  8  |   const itens = [{ produtoId: 'P005', quantidade: 1 }];
  9  | 
  10 |   test('CT-CA01-203 confirma pedido válido com cliente fictício e CEP normalizado @smoke', async ({ request }) => {
  11 |     const cliente = criarCliente();
  12 |     const response = await new CarrinhoService(request).criarPedido({ cliente, itens, cupom: settings.cupomValido });
  13 |     expect(response.status()).toBe(201);
  14 |     const pedido = schemaPedido.parse(await response.json());
  15 |     expect(pedido).toMatchObject({
  16 |       cliente: { nome: cliente.nome, email: cliente.email, cep: '01310100' },
  17 |       subtotal: 100, desconto: 10, frete: 19.9, total: 109.9,
  18 |       cupom: { aplicado: true, codigo: settings.cupomValido.toUpperCase() },
  19 |     });
  20 |     // O número é fictício e o pedido não é armazenado; não existe GET de pedidos.
  21 |   });
  22 | 
  23 |   test('CT-CA09-202 confirma pedido sem cupom', async ({ request }) => {
  24 |     const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente({ cep: '01310100' }), itens });
  25 |     expect(response.status()).toBe(201);
  26 |     expect(schemaPedido.parse(await response.json())).toMatchObject({ desconto: 0, total: 119.9, cupom: null });
  27 |   });
  28 | 
  29 |   test('CT-CA08-203 CA06/CA08: pedido de R$ 200 com cupom confirma com frete grátis', async ({ request }) => {
  30 |     test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
  31 |     const response = await new CarrinhoService(request).criarPedido({
  32 |       cliente: criarCliente(), itens: [{ produtoId: 'P005', quantidade: 2 }], cupom: settings.cupomValido,
  33 |     });
  34 |     expect(response.status()).toBe(201);
> 35 |     expect(schemaPedido.parse(await response.json())).toMatchObject({
     |                                                       ^ Error: expect(received).toMatchObject(expected)
  36 |       subtotal: 200, desconto: 20, frete: 0, freteGratis: true, total: 180,
  37 |     });
  38 |   });
  39 | 
  40 |   for (const [cupom, codigo] of [
  41 |     [settings.cupomInvalido, 'CUPOM_INVALIDO'],
  42 |     [settings.cupomExpirado, 'CUPOM_EXPIRADO'],
  43 |   ]) {
  44 |     test(`CT-${codigo === 'CUPOM_EXPIRADO' ? 'CA04' : 'CA03'}-220 pedido com ${cupom} responde 422 ${codigo}`, async ({ request }) => {
  45 |       const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente(), itens, cupom });
  46 |       expect(response.status()).toBe(422);
  47 |       expect(schemaErro.parse(await response.json()).erro.codigo).toBe(codigo);
  48 |     });
  49 |   }
  50 | 
  51 |   for (const [indice, { campo, override }] of [
  52 |     { campo: 'cliente.nome', override: { nome: 'Cliente' } },
  53 |     { campo: 'cliente.email', override: { email: 'email-invalido' } },
  54 |     { campo: 'cliente.cep', override: { cep: '123' } },
  55 |   ].entries()) {
  56 |     test(`CT-CA10-${222 + indice} rejeita ${campo} inválido com detalhe do campo`, async ({ request }) => {
  57 |       const response = await new CarrinhoService(request).criarPedido({ cliente: criarCliente(override), itens });
  58 |       expect(response.status()).toBe(422);
  59 |       const erro = schemaErro.parse(await response.json()).erro;
  60 |       expect(erro.codigo).toBe('DADOS_INVALIDOS');
  61 |       expect(erro.campos).toEqual(expect.arrayContaining([expect.objectContaining({ campo })]));
  62 |     });
  63 |   }
  64 | 
  65 |   test('CT-CA10-220 CA10: pedido rejeita seis unidades do mesmo produto', async ({ request }) => {
  66 |     test.info().annotations.push({ type: 'issue', description: 'BUG-002' });
  67 |     const response = await new CarrinhoService(request).criarPedido({
  68 |       cliente: criarCliente(), itens: [{ produtoId: 'P001', quantidade: 6 }],
  69 |     });
  70 |     expect(response.status()).toBe(422);
  71 |     expect(schemaErro.parse(await response.json()).erro.codigo).toBe('QUANTIDADE_MAXIMA_EXCEDIDA');
  72 |   });
  73 | 
  74 |   test('CT-CA10-221 pedido rejeita produto duplicado', async ({ request }) => {
  75 |     const response = await new CarrinhoService(request).criarPedido({
  76 |       cliente: criarCliente(), itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }],
  77 |     });
  78 |     expect(response.status()).toBe(422);
  79 |     expect(schemaErro.parse(await response.json()).erro.codigo).toBe('ITEM_DUPLICADO');
  80 |   });
  81 | });
  82 | 
```