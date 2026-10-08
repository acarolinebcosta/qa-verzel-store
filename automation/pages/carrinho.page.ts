import { expect, type Locator, type Page, type TestInfo } from '@playwright/test';
import { produtos, type ProdutoId } from './vitrine.page';

export type ResumoEsperado = {
  subtotal: number;
  desconto: number;
  frete: number;
  total: number;
};

export function moeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(valor).replace(/\u00a0/g, ' ');
}

export class CarrinhoPage {
  constructor(readonly page: Page) {}

  get resumo(): Locator {
    return this.page.getByRole('region', { name: 'Resumo do pedido', exact: true });
  }

  get campoCupom(): Locator {
    return this.page.getByLabel('Cupom de desconto', { exact: true });
  }

  valor(rotulo: 'Subtotal' | 'Desconto' | 'Frete' | 'Total'): Locator {
    const nome = rotulo === 'Desconto' ? /^Desconto(?: \(.+\))?$/ : new RegExp(`^${rotulo}$`);
    return this.resumo.getByRole('term').filter({ hasText: nome })
      .locator('..').getByRole('definition');
  }

  async aguardarCalculo() {
    await expect(this.resumo).toBeVisible();
    // A API calcula de forma assíncrona; o marcador faz parte da UI real.
    await expect(this.resumo.locator('..')).toHaveAttribute('aria-busy', 'false');
  }

  async aplicarCupom(codigo: string) {
    await this.campoCupom.fill(codigo);
    await this.page.getByRole('button', { name: 'Aplicar cupom', exact: true }).click();
    // No sucesso, a UI troca Aplicar por Remover; no erro, reabilita Aplicar.
    await expect(this.page.getByRole('button', { name: 'Aplicar cupom', exact: true })
      .or(this.page.getByRole('button', { name: 'Remover cupom', exact: true }))).toBeEnabled();
    await this.aguardarCalculo();
  }

  async esperarCupomAplicado(codigo: string) {
    await expect(this.page.getByText(`Cupom ${codigo} aplicado.`, { exact: true })).toBeVisible();
    await expect(this.page.getByRole('button', { name: 'Remover cupom', exact: true })).toBeVisible();
  }

  async esperarErroCupom(mensagem: string) {
    await expect(this.page.getByRole('alert')).toHaveText(mensagem);
    await expect(this.campoCupom).toHaveAttribute('aria-invalid', 'true');
    await expect(this.page.getByRole('button', { name: 'Remover cupom', exact: true })).toHaveCount(0);
  }

  async removerCupom() {
    await this.page.getByRole('button', { name: 'Remover cupom', exact: true }).click();
    await expect(this.campoCupom).toBeVisible();
    await this.aguardarCalculo();
  }

  async esperarResumo(esperado: ResumoEsperado) {
    await this.aguardarCalculo();
    await expect(this.valor('Subtotal')).toHaveText(moeda(esperado.subtotal));
    await expect(this.valor('Desconto')).toHaveText(
      esperado.desconto > 0 ? `- ${moeda(esperado.desconto)}` : moeda(0),
    );
    await expect(this.valor('Frete')).toHaveText(esperado.frete === 0 ? 'Grátis' : moeda(esperado.frete));
    await expect(this.valor('Total')).toHaveText(moeda(esperado.total));
  }

  async esperarFaltante(valor: number) {
    await expect(this.page.getByText(`Faltam ${moeda(valor)} para o frete grátis.`, { exact: true })).toBeVisible();
  }

  grupoQuantidade(produtoId: ProdutoId): Locator {
    return this.page.getByRole('group', { name: `Quantidade de ${produtos[produtoId].nome}`, exact: true });
  }

  async alterarQuantidade(produtoId: ProdutoId, direcao: 'aumentar' | 'diminuir', vezes = 1) {
    const verbo = direcao === 'aumentar' ? 'Aumentar' : 'Diminuir';
    const botao = this.grupoQuantidade(produtoId).getByRole('button', {
      name: `${verbo} quantidade de ${produtos[produtoId].nome}`, exact: true,
    });
    for (let passo = 0; passo < vezes; passo += 1) await botao.click();
    await this.aguardarCalculo();
  }

  async esperarQuantidade(produtoId: ProdutoId, quantidade: number) {
    await expect(this.grupoQuantidade(produtoId).getByRole('status')).toHaveText(String(quantidade));
  }

  async removerProduto(produtoId: ProdutoId) {
    await this.page.getByRole('button', {
      name: `Remover ${produtos[produtoId].nome} do carrinho`, exact: true,
    }).click();
  }

  async anexarEvidencia(testInfo: TestInfo, nome: string) {
    const caminho = testInfo.outputPath(`${nome}.png`);
    await this.page.screenshot({ path: caminho, fullPage: true });
    await testInfo.attach(nome, { path: caminho, contentType: 'image/png' });
  }
}
