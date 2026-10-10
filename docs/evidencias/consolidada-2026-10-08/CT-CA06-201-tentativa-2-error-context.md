# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: api/carrinho.spec.ts >> Frete e cálculo do carrinho na API @regression >> CT-CA06-201 fronteira de subtotal R$ 200.00 sem cupom @smoke
- Location: tests/api/carrinho.spec.ts:31:9

# Error details

```
Error: Valor financeiro de frete

expect(received).toBeCloseTo(expected, precision)

Expected: 0
Received: 19.9

Expected precision:    2
Expected difference: < 0.005
Received difference:   19.9
```

# Test source

```ts
  1  | import { expect } from '@playwright/test';
  2  | import type { ResumoCarrinho } from '../schemas/api.schema';
  3  | 
  4  | const camposFinanceiros = ['subtotal', 'desconto', 'frete', 'valorFaltanteFreteGratis', 'total'] as const;
  5  | 
  6  | /** Recebe o resumo já validado pelo Zod e compara reais numericamente em centavos. */
  7  | export function esperarResumoAPI(resumo: ResumoCarrinho, esperado: Record<string, unknown>): void {
  8  |   const demaisCampos = { ...esperado };
  9  |   for (const campo of camposFinanceiros) {
  10 |     const valorEsperado = esperado[campo];
  11 |     if (typeof valorEsperado === 'number') {
> 12 |       expect(resumo[campo], `Valor financeiro de ${campo}`).toBeCloseTo(valorEsperado, 2);
     |                                                             ^ Error: Valor financeiro de frete
  13 |       delete demaisCampos[campo];
  14 |     }
  15 |   }
  16 |   expect(resumo).toMatchObject(demaisCampos);
  17 | }
  18 | 
```