import { expect, type Locator, type Page } from '@playwright/test';

/** Produtos fixos publicados na documentação v2.3.0 da loja. */
export const produtos = {
  P001: { nome: 'Camiseta Essencial', preco: 59.9 },
  P004: { nome: 'Boné Aba Curva', preco: 49.9 },
  P005: { nome: 'Mochila Urbana 20L', preco: 100 },
  P006: { nome: 'Kit 3 Pares de Meias', preco: 29.9 },
  P008: { nome: 'Garrafa Térmica 750ml', preco: 50 },
} as const;

export type ProdutoId = keyof typeof produtos;
export type ItemVitrine = { produtoId: ProdutoId; quantidade: number };

export class VitrinePage {
  constructor(readonly page: Page) {}

  async abrir() {
    await this.page.goto('/');
    await expect(this.page.getByRole('heading', { name: 'Produtos', exact: true })).toBeVisible();
  }

  produto(produtoId: ProdutoId): Locator {
    return this.page.getByRole('article', { name: produtos[produtoId].nome, exact: true });
  }

  async adicionar(produtoId: ProdutoId, quantidade = 1) {
    const produto = this.produto(produtoId);
    const adicionar = produto.getByRole('button', { name: 'Adicionar ao carrinho', exact: true });
    for (let unidade = 0; unidade < quantidade; unidade += 1) {
      await adicionar.click();
    }
  }

  async adicionarItens(itens: readonly ItemVitrine[]) {
    for (const item of itens) await this.adicionar(item.produtoId, item.quantidade);
  }

  async irAoCarrinho() {
    await this.page.getByRole('link', { name: /^Carrinho/ }).click();
    await expect(this.page.getByRole('heading', { name: 'Carrinho', exact: true })).toBeVisible();
  }
}
