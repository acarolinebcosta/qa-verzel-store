# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/carrinho.spec.ts >> Frete e cálculo do carrinho na API @regression >> CT-API-005 rejeita item sem produtoId com erro documentado
- Location: tests/api/carrinho.spec.ts:122:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "ITEM_INVALIDO"
Received: "PRODUTO_NAO_ENCONTRADO"
```

# Test source

```ts
  28  |   ];
  29  | 
  30  |   for (const { id, subtotal, itens, frete, faltante } of fronteiras) {
  31  |     test(`${id} fronteira de subtotal R$ ${subtotal.toFixed(2)} sem cupom @smoke`, async ({ request }) => {
  32  |       if (subtotal === 200) test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
  33  |       expect(settings.valorMinimo).toBe(200);
  34  |       const response = await new CarrinhoService(request).calcular(itens);
  35  |       expect(response.status()).toBe(200);
  36  |       esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
  37  |         subtotal, desconto: 0, frete, freteGratis: frete === 0,
  38  |         valorFaltanteFreteGratis: faltante,
  39  |         total: Number((subtotal + frete).toFixed(2)), cupom: null,
  40  |       });
  41  |     });
  42  |   }
  43  | 
  44  |   const fronteirasComCupom = [
  45  |     { ...fronteiras.find(({ subtotal }) => subtotal === 200)!, id: 'CT-CA08-201' },
  46  |     { ...fronteiras.find(({ subtotal }) => subtotal === 209.4)!, id: 'CT-CA08-202' },
  47  |     { ...fronteiras.find(({ subtotal }) => subtotal === 199.9)!, id: 'CT-CA08-204' },
  48  |   ];
  49  |   for (const { id, subtotal, itens, frete, faltante } of fronteirasComCupom) {
  50  |     test(`${id} CA08: cupom preserva regra de frete sobre subtotal R$ ${subtotal.toFixed(2)}`, async ({ request }) => {
  51  |       if (subtotal === 200) test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
  52  |       const response = await new CarrinhoService(request).calcular(itens, settings.cupomValido);
  53  |       expect(response.status()).toBe(200);
  54  |       const desconto = Number((subtotal * 0.1).toFixed(2));
  55  |       esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
  56  |         subtotal, desconto, frete, freteGratis: frete === 0,
  57  |         valorFaltanteFreteGratis: faltante,
  58  |         total: Number((subtotal - desconto + frete).toFixed(2)),
  59  |       });
  60  |     });
  61  |   }
  62  | 
  63  |   test('CT-CA04-202 cupom expirado no limite mantém cálculo 200 sem desconto', async ({ request }) => {
  64  |     test.info().annotations.push({ type: 'issue', description: 'BUG-001' });
  65  |     const response = await new CarrinhoService(request).calcular([{ produtoId: 'P005', quantidade: 2 }], settings.cupomExpirado);
  66  |     expect(response.status()).toBe(200);
  67  |     esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
  68  |       subtotal: 200, desconto: 0, frete: 0, total: 200, freteGratis: true,
  69  |       cupom: { aplicado: false, mensagem: 'Cupom expirado.' },
  70  |     });
  71  |   });
  72  | 
  73  |   test('CT-CA10-201 CA10: aceita exatamente cinco unidades por produto', async ({ request }) => {
  74  |     const response = await new CarrinhoService(request).calcular([{ produtoId: 'P006', quantidade: 5 }]);
  75  |     expect(response.status()).toBe(200);
  76  |     const resumo = schemaResumoCarrinho.parse(await response.json());
  77  |     esperarResumoAPI(resumo, {
  78  |       itens: [expect.objectContaining({ produtoId: 'P006', quantidade: 5 })],
  79  |       subtotal: 149.5, frete: 19.9, total: 169.4,
  80  |     });
  81  |     expect(resumo.itens[0].precoUnitario).toBeCloseTo(29.9, 2);
  82  |     expect(resumo.itens[0].total).toBeCloseTo(149.5, 2);
  83  |   });
  84  | 
  85  |   test('CT-CA11-201 CA11: arredonda subtotal, desconto e total para centavos', async ({ request }) => {
  86  |     const response = await new CarrinhoService(request).calcular([
  87  |       { produtoId: 'P002', quantidade: 1 }, { produtoId: 'P004', quantidade: 2 },
  88  |     ], settings.cupomValido);
  89  |     expect(response.status()).toBe(200);
  90  |     const resumo = schemaResumoCarrinho.parse(await response.json());
  91  |     esperarResumoAPI(resumo, { subtotal: 239.7, desconto: 23.97, frete: 0, total: 215.73 });
  92  |     expect(resumo.itens).toHaveLength(2);
  93  |     expect(resumo.itens[0]).toMatchObject({ produtoId: 'P002', quantidade: 1 });
  94  |     expect(resumo.itens[0].precoUnitario).toBeCloseTo(139.9, 2);
  95  |     expect(resumo.itens[0].total).toBeCloseTo(139.9, 2);
  96  |     expect(resumo.itens[1]).toMatchObject({ produtoId: 'P004', quantidade: 2 });
  97  |     expect(resumo.itens[1].precoUnitario).toBeCloseTo(49.9, 2);
  98  |     expect(resumo.itens[1].total).toBeCloseTo(99.8, 2);
  99  |   });
  100 | 
  101 |   const entradasInvalidas: { id: string; nome: string; payload: unknown; codigo: string }[] = [
  102 |     { id: 'CT-API-002', nome: 'itens ausentes', payload: {}, codigo: 'ITENS_OBRIGATORIOS' },
  103 |     { id: 'CT-API-003', nome: 'carrinho vazio', payload: { itens: [] }, codigo: 'ITENS_OBRIGATORIOS' },
  104 |     { id: 'CT-API-004', nome: 'itens nulos', payload: { itens: null }, codigo: 'ITENS_OBRIGATORIOS' },
  105 |     { id: 'CT-API-005', nome: 'item sem produtoId', payload: { itens: [{ quantidade: 1 }] }, codigo: 'ITEM_INVALIDO' },
  106 |     { id: 'CT-API-006', nome: 'item sem quantidade', payload: { itens: [{ produtoId: 'P001' }] }, codigo: 'ITEM_INVALIDO' },
  107 |     { id: 'CT-API-012', nome: 'item sem objeto', payload: { itens: [null] }, codigo: 'ITEM_INVALIDO' },
  108 |     { id: 'CT-API-007', nome: 'produto inexistente', payload: { itens: [{ produtoId: 'P999', quantidade: 1 }] }, codigo: 'PRODUTO_NAO_ENCONTRADO' },
  109 |     { id: 'CT-CA10-206', nome: 'CA10: seis unidades', payload: { itens: [{ produtoId: 'P001', quantidade: 6 }] }, codigo: 'QUANTIDADE_MAXIMA_EXCEDIDA' },
  110 |     { id: 'CT-CA10-207', nome: 'quantidade zero', payload: { itens: [{ produtoId: 'P001', quantidade: 0 }] }, codigo: 'QUANTIDADE_INVALIDA' },
  111 |     { id: 'CT-CA10-208', nome: 'quantidade negativa', payload: { itens: [{ produtoId: 'P001', quantidade: -1 }] }, codigo: 'QUANTIDADE_INVALIDA' },
  112 |     { id: 'CT-CA10-209', nome: 'quantidade fracionária', payload: { itens: [{ produtoId: 'P001', quantidade: 1.5 }] }, codigo: 'QUANTIDADE_INVALIDA' },
  113 |     { id: 'CT-CA10-210', nome: 'quantidade textual', payload: { itens: [{ produtoId: 'P001', quantidade: '3' }] }, codigo: 'QUANTIDADE_INVALIDA' },
  114 |     {
  115 |       id: 'CT-API-008', nome: 'produto duplicado',
  116 |       payload: { itens: [{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P001', quantidade: 1 }] },
  117 |       codigo: 'ITEM_DUPLICADO',
  118 |     },
  119 |   ];
  120 | 
  121 |   for (const { id, nome, payload, codigo } of entradasInvalidas) {
  122 |     test(`${id} rejeita ${nome} com erro documentado`, async ({ request }) => {
  123 |       if (codigo === 'QUANTIDADE_MAXIMA_EXCEDIDA') {
  124 |         test.info().annotations.push({ type: 'issue', description: 'BUG-002' });
  125 |       }
  126 |       const response = await new CarrinhoService(request).calcularPayload(payload);
  127 |       expect(response.status()).toBe(422);
> 128 |       expect(schemaErro.parse(await response.json()).erro.codigo).toBe(codigo);
      |                                                                   ^ Error: expect(received).toBe(expected) // Object.is equality
  129 |     });
  130 |   }
  131 | 
  132 |   test('CT-API-001 JSON malformado responde 400', async ({ request }) => {
  133 |     const response = await request.post('/api/carrinho/calcular', {
  134 |       data: '{"itens":', headers: { 'Content-Type': 'application/json' },
  135 |     });
  136 |     expect(response.status()).toBe(400);
  137 |     expect(schemaErro.parse(await response.json()).erro.codigo).toBe('JSON_INVALIDO');
  138 |   });
  139 | });
  140 | 
```