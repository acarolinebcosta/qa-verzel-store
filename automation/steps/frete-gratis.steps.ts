import { createBdd } from 'playwright-bdd';
import { test, expect } from '../fixtures/base.fixture';
import { reais } from './cupom.steps';

const { When, Then } = createBdd(test);

Then('deve faltar {string} para o frete grátis', async ({ carrinhoPage }, faltante: string) => {
  await carrinhoPage.esperarFaltante(reais(faltante));
});

When('esvazio o carrinho', async ({ page }) => {
  await page.getByRole('button', { name: 'Esvaziar carrinho', exact: true }).click();
});

Then('o carrinho deve estar vazio', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Seu carrinho está vazio', exact: true })).toBeVisible();
});

When('adiciono uma mochila ao carrinho vazio', async ({ vitrinePage }) => {
  await vitrinePage.abrir();
  await vitrinePage.adicionar('P005');
  await vitrinePage.irAoCarrinho();
});
