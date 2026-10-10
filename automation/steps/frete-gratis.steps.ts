import { createBdd } from 'playwright-bdd';
import { test, expect } from '../fixtures/base.fixture';
import { produtos, type ItemVitrine } from '../pages/vitrine.page';
import { produtoId, reais } from './cupom.steps';
import { settings } from '../support/env';

const { Given, Then } = createBdd(test);

Given('que o carrinho está {string} do limite de frete grátis', async ({ vitrinePage, carrinhoPage }, posicao: string) => {
  const carrinhos: Record<string, ItemVitrine[]> = {
    abaixo: [
      { produtoId: 'P005', quantidade: 1 }, { produtoId: 'P008', quantidade: 1 },
      { produtoId: 'P004', quantidade: 1 },
    ],
    exatamente: [{ produtoId: 'P005', quantidade: 2 }],
    acima: [{ produtoId: 'P005', quantidade: 3 }],
  };
  if (!(posicao in carrinhos)) throw new Error(`Posição desconhecida: ${posicao}`);
  if (settings.valorMinimo !== 200) {
    throw new Error('Os dados fixos da documentação v2.3.0 usam VALOR_MINIMO=200; atualize os cenários se a regra mudar.');
  }
  await vitrinePage.abrir();
  await vitrinePage.adicionarItens(carrinhos[posicao]);
  await vitrinePage.irAoCarrinho();
  await carrinhoPage.aguardarCalculo();
});

Then('deve faltar {string} para o frete grátis', async ({ carrinhoPage }, faltante: string) => {
  await carrinhoPage.esperarFaltante(reais(faltante));
});

Then('o aumento de quantidade de {string} deve estar indisponível', async ({ carrinhoPage }, codigo: string) => {
  const id = produtoId(codigo);
  await expect(carrinhoPage.grupoQuantidade(id).getByRole('button', {
    name: `Aumentar quantidade de ${produtos[id].nome}`, exact: true,
  })).toBeDisabled();
});
