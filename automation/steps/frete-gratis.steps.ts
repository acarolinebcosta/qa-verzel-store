import { createBdd } from 'playwright-bdd';
import { test, expect } from '../fixtures/base.fixture';
import { produtoId, reais } from './cupom.steps';

const { Given, When, Then } = createBdd(test);

Given('que o carrinho contém {int} unidades do produto {string} e {int} unidades do produto {string}', async ({ vitrinePage, carrinhoPage }, quantidade1: number, codigo1: string, quantidade2: number, codigo2: string) => {
  await vitrinePage.abrir();
  await vitrinePage.adicionarItens([
    { produtoId: produtoId(codigo1), quantidade: quantidade1 },
    { produtoId: produtoId(codigo2), quantidade: quantidade2 },
  ]);
  await vitrinePage.irAoCarrinho();
  await carrinhoPage.aguardarCalculo();
});

When('removo o produto {string}', async ({ carrinhoPage }, codigo: string) => {
  await carrinhoPage.removerProduto(produtoId(codigo));
  await carrinhoPage.aguardarCalculo();
});

Then('deve faltar {string} para o frete grátis', async ({ carrinhoPage }, faltante: string) => {
  await carrinhoPage.esperarFaltante(reais(faltante));
});

When('esvazio o carrinho', async ({ page, $testInfo }) => {
  $testInfo.annotations.push({ type: 'hypothesis', description: 'HIP-004: descarte do cupom ao esvaziar é observação exploratória, sem CA próprio.' });
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
