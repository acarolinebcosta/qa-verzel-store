# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/carrinho.spec.ts >> Frete e cálculo do carrinho na API @regression >> CT-CA10-206 rejeita CA10: seis unidades com erro documentado
- Location: tests/api/carrinho.spec.ts:104:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 422
Received: 200
```

# Test source

```ts
  9   |     { id: 'CT-CA07-201', subtotal: 199.8, itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P002', quantidade: 1 }], frete: 19.9, faltante: 0.2 },
  10  |     {
  11  |       id: 'CT-CA07-202', subtotal: 199.9,
  12  |       itens: [
  13  |         { produtoId: 'P005', quantidade: 1 },
  14  |         { produtoId: 'P004', quantidade: 1 },
  15  |         { produtoId: 'P008', quantidade: 1 },
  16  |       ],
  17  |       frete: 19.9, faltante: 0.1,
  18  |     },
  19  |     { id: 'CT-CA06-201', subtotal: 200, itens: [{ produtoId: 'P005', quantidade: 2 }], frete: 0, faltante: 0 },
  20  |     // R$ 200,10 não pode ser formado pelos preços fixos com até 5 unidades.
  21  |     // R$ 209,40 é o menor subtotal permitido acima do limite.
  22  |     {
  23  |       id: 'CT-CA06-202', subtotal: 209.4,
  24  |       itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P006', quantidade: 5 }],
  25  |       frete: 0, faltante: 0,
  26  |     },
  27  |   ];
  28  | 
  29  |   for (const { id, subtotal, itens, frete, faltante } of fronteiras) {
  30  |     test(`${id} fronteira de subtotal R$ ${subtotal.toFixed(2)} sem cupom @smoke`, async ({ request }) => {
  31  |       if (subtotal === 200) test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
  32  |       expect(settings.valorMinimo).toBe(200);
  33  |       const response = await new CarrinhoService(request).calcular(itens);
  34  |       expect(response.status()).toBe(200);
  35  |       expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
  36  |         subtotal, desconto: 0, frete, freteGratis: frete === 0,
  37  |         valorFaltanteFreteGratis: faltante,
  38  |         total: Number((subtotal + frete).toFixed(2)), cupom: null,
  39  |       });
  40  |     });
  41  |   }
  42  | 
  43  |   for (const [indice, { subtotal, itens, frete, faltante }] of fronteiras.filter(({ subtotal }) => subtotal >= 200).entries()) {
  44  |     test(`CT-CA08-${201 + indice} CA08: cupom preserva regra de frete sobre subtotal R$ ${subtotal.toFixed(2)}`, async ({ request }) => {
  45  |       if (subtotal === 200) test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
  46  |       const response = await new CarrinhoService(request).calcular(itens, settings.cupomValido);
  47  |       expect(response.status()).toBe(200);
  48  |       const desconto = Number((subtotal * 0.1).toFixed(2));
  49  |       expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
  50  |         subtotal, desconto, frete, freteGratis: frete === 0,
  51  |         valorFaltanteFreteGratis: faltante,
  52  |         total: Number((subtotal - desconto + frete).toFixed(2)),
  53  |       });
  54  |     });
  55  |   }
  56  | 
  57  |   test('CT-CA04-202 cupom expirado no limite mantém cálculo 200 sem desconto', async ({ request }) => {
  58  |     test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
  59  |     const response = await new CarrinhoService(request).calcular([{ produtoId: 'P005', quantidade: 2 }], settings.cupomExpirado);
  60  |     expect(response.status()).toBe(200);
  61  |     expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
  62  |       subtotal: 200, desconto: 0, frete: 0, total: 200, freteGratis: true,
  63  |       cupom: { aplicado: false, mensagem: 'Cupom expirado.' },
  64  |     });
  65  |   });
  66  | 
  67  |   test('CT-CA10-201 CA10: aceita exatamente cinco unidades por produto', async ({ request }) => {
  68  |     const response = await new CarrinhoService(request).calcular([{ produtoId: 'P006', quantidade: 5 }]);
  69  |     expect(response.status()).toBe(200);
  70  |     expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
  71  |       itens: [expect.objectContaining({ produtoId: 'P006', quantidade: 5, total: 149.5 })],
  72  |       subtotal: 149.5, frete: 19.9, total: 169.4,
  73  |     });
  74  |   });
  75  | 
  76  |   test('CT-CA11-201 CA11: arredonda subtotal, desconto e total para centavos', async ({ request }) => {
  77  |     const response = await new CarrinhoService(request).calcular([
  78  |       { produtoId: 'P002', quantidade: 1 }, { produtoId: 'P004', quantidade: 2 },
  79  |     ], settings.cupomValido);
  80  |     expect(response.status()).toBe(200);
  81  |     const resumo = schemaResumoCarrinho.parse(await response.json());
  82  |     expect(resumo).toMatchObject({ subtotal: 239.7, desconto: 23.97, frete: 0, total: 215.73 });
  83  |     expect(resumo.itens.map(({ total }) => total)).toEqual([139.9, 99.8]);
  84  |   });
  85  | 
  86  |   const entradasInvalidas: { nome: string; payload: unknown; codigo: string }[] = [
  87  |     { nome: 'itens ausentes', payload: {}, codigo: 'ITENS_OBRIGATORIOS' },
  88  |     { nome: 'carrinho vazio', payload: { itens: [] }, codigo: 'ITENS_OBRIGATORIOS' },
  89  |     { nome: 'item sem objeto', payload: { itens: [null] }, codigo: 'ITEM_INVALIDO' },
  90  |     { nome: 'produto inexistente', payload: { itens: [{ produtoId: 'P999', quantidade: 1 }] }, codigo: 'PRODUTO_NAO_ENCONTRADO' },
  91  |     { nome: 'CA10: seis unidades', payload: { itens: [{ produtoId: 'P001', quantidade: 6 }] }, codigo: 'QUANTIDADE_MAXIMA_EXCEDIDA' },
  92  |     { nome: 'quantidade zero', payload: { itens: [{ produtoId: 'P001', quantidade: 0 }] }, codigo: 'QUANTIDADE_INVALIDA' },
  93  |     { nome: 'quantidade negativa', payload: { itens: [{ produtoId: 'P001', quantidade: -1 }] }, codigo: 'QUANTIDADE_INVALIDA' },
  94  |     { nome: 'quantidade fracionária', payload: { itens: [{ produtoId: 'P001', quantidade: 1.5 }] }, codigo: 'QUANTIDADE_INVALIDA' },
  95  |     { nome: 'quantidade textual', payload: { itens: [{ produtoId: 'P001', quantidade: '1' }] }, codigo: 'QUANTIDADE_INVALIDA' },
  96  |     {
  97  |       nome: 'produto duplicado',
  98  |       payload: { itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }] },
  99  |       codigo: 'ITEM_DUPLICADO',
  100 |     },
  101 |   ];
  102 | 
  103 |   for (const [indice, { nome, payload, codigo }] of entradasInvalidas.entries()) {
  104 |     test(`CT-CA10-${202 + indice} rejeita ${nome} com erro documentado`, async ({ request }) => {
  105 |       if (codigo === 'QUANTIDADE_MAXIMA_EXCEDIDA') {
  106 |         test.info().annotations.push({ type: 'issue', description: 'BUG-002' });
  107 |       }
  108 |       const response = await new CarrinhoService(request).calcularPayload(payload);
> 109 |       expect(response.status()).toBe(422);
      |                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  110 |       expect(schemaErro.parse(await response.json()).erro.codigo).toBe(codigo);
  111 |     });
  112 |   }
  113 | 
  114 |   test('CT-CA10-212 JSON malformado responde 400', async ({ request }) => {
  115 |     const response = await request.post('/api/carrinho/calcular', {
  116 |       data: '{"itens":', headers: { 'Content-Type': 'application/json' },
  117 |     });
  118 |     expect(response.status()).toBe(400);
  119 |     expect(schemaErro.parse(await response.json()).erro.codigo).toBe('JSON_INVALIDO');
  120 |   });
  121 | });
  122 | 
```