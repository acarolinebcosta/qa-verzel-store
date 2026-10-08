import { test as base } from 'playwright-bdd';
import { CarrinhoPage } from '../pages/carrinho.page';
import { VitrinePage } from '../pages/vitrine.page';

type Fixtures = {
  vitrinePage: VitrinePage;
  carrinhoPage: CarrinhoPage;
  carrinhoComProduto: CarrinhoPage;
};

export const test = base.extend<Fixtures>({
  vitrinePage: async ({ page }, use) => {
    await use(new VitrinePage(page));
  },
  carrinhoPage: async ({ page }, use) => {
    await use(new CarrinhoPage(page));
  },
  carrinhoComProduto: async ({ vitrinePage, carrinhoPage }, use) => {
    // Cada teste recebe uma aba/contexto novo, conforme a simplificação documentada.
    await vitrinePage.abrir();
    await vitrinePage.adicionar('P005');
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.aguardarCalculo();
    await use(carrinhoPage);
  },
});

export { expect } from '@playwright/test';
