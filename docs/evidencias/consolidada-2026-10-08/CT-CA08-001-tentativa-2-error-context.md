# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/frete-gratis.spec.ts >> Frete e quantidade @regression >> CT-CA08-001 frete grátis em R$ 200 antes e depois do cupom @smoke
- Location: tests/e2e/frete-gratis.spec.ts:6:7

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Frete$/ }).locator('..').getByRole('definition')
Expected: "Grátis"
Received: "R$ 19,90"
Timeout:  1000ms

Call log:
  - Expect "soft toHaveText" getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Frete$/ }).locator('..').getByRole('definition') with timeout 1000ms
  - waiting for getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Frete$/ }).locator('..').getByRole('definition')
    11 × locator resolved to <dd data-valor="frete">R$ 19,90</dd>
       - unexpected value "R$ 19,90"

```

```yaml
- definition: R$ 19,90
```

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Total$/ }).locator('..').getByRole('definition')
Expected: "R$ 200,00"
Received: "R$ 219,90"
Timeout:  1000ms

Call log:
  - Expect "soft toHaveText" getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Total$/ }).locator('..').getByRole('definition') with timeout 1000ms
  - waiting for getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Total$/ }).locator('..').getByRole('definition')
    12 × locator resolved to <dd data-valor="total">R$ 219,90</dd>
       - unexpected value "R$ 219,90"

```

```yaml
- definition: R$ 219,90
```

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Frete$/ }).locator('..').getByRole('definition')
Expected: "Grátis"
Received: "R$ 19,90"
Timeout:  1000ms

Call log:
  - Expect "soft toHaveText" getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Frete$/ }).locator('..').getByRole('definition') with timeout 1000ms
  - waiting for getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Frete$/ }).locator('..').getByRole('definition')
    11 × locator resolved to <dd data-valor="frete">R$ 19,90</dd>
       - unexpected value "R$ 19,90"

```

```yaml
- definition: R$ 19,90
```

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Total$/ }).locator('..').getByRole('definition')
Expected: "R$ 180,00"
Received: "R$ 199,90"
Timeout:  1000ms

Call log:
  - Expect "soft toHaveText" getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Total$/ }).locator('..').getByRole('definition') with timeout 1000ms
  - waiting for getByRole('region', { name: 'Resumo do pedido', exact: true }).getByRole('term').filter({ hasText: /^Total$/ }).locator('..').getByRole('definition')
    11 × locator resolved to <dd data-valor="total">R$ 199,90</dd>
       - unexpected value "R$ 199,90"

```

```yaml
- definition: R$ 199,90
```

# Test source

```ts
  1   | import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
  2   | import { produtos, type ProdutoId } from './vitrine.page';
  3   | 
  4   | export type ResumoEsperado = {
  5   |   subtotal: number;
  6   |   desconto: number;
  7   |   frete: number;
  8   |   total: number;
  9   | };
  10  | 
  11  | export function moeda(valor: number): string {
  12  |   return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
  13  |     .format(valor).replace(/\u00a0/g, ' ');
  14  | }
  15  | 
  16  | export class CarrinhoPage {
  17  |   constructor(readonly page: Page) {}
  18  | 
  19  |   get resumo(): Locator {
  20  |     return this.page.getByRole('region', { name: 'Resumo do pedido', exact: true });
  21  |   }
  22  | 
  23  |   get campoCupom(): Locator {
  24  |     return this.page.getByLabel('Cupom de desconto', { exact: true });
  25  |   }
  26  | 
  27  |   valor(rotulo: 'Subtotal' | 'Desconto' | 'Frete' | 'Total'): Locator {
  28  |     const nome = rotulo === 'Desconto' ? /^Desconto(?: \(.+\))?$/ : new RegExp(`^${rotulo}$`);
  29  |     return this.resumo.getByRole('term').filter({ hasText: nome })
  30  |       .locator('..').getByRole('definition');
  31  |   }
  32  | 
  33  |   async aguardarCalculo() {
  34  |     await expect(this.resumo).toBeVisible();
  35  |     // A API calcula de forma assíncrona; o marcador faz parte da UI real.
  36  |     await expect(this.resumo.locator('..')).toHaveAttribute('aria-busy', 'false');
  37  |   }
  38  | 
  39  |   async aplicarCupom(codigo: string) {
  40  |     await this.campoCupom.fill(codigo);
  41  |     await this.page.getByRole('button', { name: 'Aplicar cupom', exact: true }).click();
  42  |     // No sucesso, a UI troca Aplicar por Remover; no erro, reabilita Aplicar.
  43  |     await expect(this.page.getByRole('button', { name: 'Aplicar cupom', exact: true })
  44  |       .or(this.page.getByRole('button', { name: 'Remover cupom', exact: true }))).toBeEnabled();
  45  |     await this.aguardarCalculo();
  46  |   }
  47  | 
  48  |   async esperarCupomAplicado(codigo: string) {
  49  |     await expect(this.page.getByText(`Cupom ${codigo} aplicado.`, { exact: true })).toBeVisible();
  50  |     await expect(this.page.getByRole('button', { name: 'Remover cupom', exact: true })).toBeVisible();
  51  |   }
  52  | 
  53  |   async esperarErroCupom(mensagem: string) {
  54  |     await expect(this.page.getByRole('alert')).toHaveText(mensagem);
  55  |     await expect(this.campoCupom).toHaveAttribute('aria-invalid', 'true');
  56  |     await expect(this.page.getByRole('button', { name: 'Remover cupom', exact: true })).toHaveCount(0);
  57  |   }
  58  | 
  59  |   async removerCupom() {
  60  |     await this.page.getByRole('button', { name: 'Remover cupom', exact: true }).click();
  61  |     await expect(this.campoCupom).toBeVisible();
  62  |     await this.aguardarCalculo();
  63  |   }
  64  | 
  65  |   async esperarResumo(esperado: ResumoEsperado, suave = false) {
  66  |     const verificar = suave ? expect.configure({ soft: true, timeout: 1_000 }) : expect;
  67  |     await this.aguardarCalculo();
  68  |     await verificar(this.valor('Subtotal')).toHaveText(moeda(esperado.subtotal));
  69  |     await verificar(this.valor('Desconto')).toHaveText(
  70  |       esperado.desconto > 0 ? `- ${moeda(esperado.desconto)}` : moeda(0),
  71  |     );
  72  |     await verificar(this.valor('Frete')).toHaveText(esperado.frete === 0 ? 'Grátis' : moeda(esperado.frete));
> 73  |     await verificar(this.valor('Total')).toHaveText(moeda(esperado.total));
      |                                          ^ Error: expect(locator).toHaveText(expected) failed
  74  |   }
  75  | 
  76  |   async esperarFaltante(valor: number) {
  77  |     await expect(this.page.getByText(`Faltam ${moeda(valor)} para o frete grátis.`, { exact: true })).toBeVisible();
  78  |   }
  79  | 
  80  |   grupoQuantidade(produtoId: ProdutoId): Locator {
  81  |     return this.page.getByRole('group', { name: `Quantidade de ${produtos[produtoId].nome}`, exact: true });
  82  |   }
  83  | 
  84  |   async alterarQuantidade(produtoId: ProdutoId, direcao: 'aumentar' | 'diminuir', vezes = 1) {
  85  |     const verbo = direcao === 'aumentar' ? 'Aumentar' : 'Diminuir';
  86  |     const botao = this.grupoQuantidade(produtoId).getByRole('button', {
  87  |       name: `${verbo} quantidade de ${produtos[produtoId].nome}`, exact: true,
  88  |     });
  89  |     for (let passo = 0; passo < vezes; passo += 1) await botao.click();
  90  |     await this.aguardarCalculo();
  91  |   }
  92  | 
  93  |   async esperarQuantidade(produtoId: ProdutoId, quantidade: number) {
  94  |     await expect(this.grupoQuantidade(produtoId).getByRole('status')).toHaveText(String(quantidade));
  95  |   }
  96  | 
  97  |   async removerProduto(produtoId: ProdutoId) {
  98  |     await this.page.getByRole('button', {
  99  |       name: `Remover ${produtos[produtoId].nome} do carrinho`, exact: true,
  100 |     }).click();
  101 |   }
  102 | 
  103 |   async anexarEvidencia(testInfo: TestInfo, nome: string) {
  104 |     const caminho = testInfo.outputPath(`${nome}.png`);
  105 |     await this.page.screenshot({ path: caminho, fullPage: true });
  106 |     await testInfo.attach(nome, { path: caminho, contentType: 'image/png' });
  107 |   }
  108 | }
  109 | 
```