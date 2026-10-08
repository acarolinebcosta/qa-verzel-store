import { createBdd } from 'playwright-bdd';
import { test, expect } from '../fixtures/base.fixture';
import { settings } from '../support/env';
import { produtos, type ProdutoId } from '../pages/vitrine.page';

const { Given, When, Then } = createBdd(test);

export function produtoId(codigo: string): ProdutoId {
  if (!(codigo in produtos)) throw new Error(`Produto não previsto nos dados de UI: ${codigo}`);
  return codigo as ProdutoId;
}

export function reais(valor: string): number {
  const convertido = Number(valor.replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(convertido)) throw new Error(`Valor monetário inválido: ${valor}`);
  return convertido;
}

Given('que possuo uma mochila no carrinho', async ({ carrinhoComProduto }) => {
  await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
});

Given('que o carrinho contém {int} unidades do produto {string}', async ({ vitrinePage, carrinhoPage }, quantidade: number, codigo: string) => {
  await vitrinePage.abrir();
  await vitrinePage.adicionar(produtoId(codigo), quantidade);
  await vitrinePage.irAoCarrinho();
  await carrinhoPage.aguardarCalculo();
});

When('aplico o cupom válido', async ({ carrinhoPage }) => {
  await carrinhoPage.aplicarCupom(settings.cupomValido);
});

When('aplico o cupom de situação {string}', async ({ carrinhoPage }, situacao: string) => {
  const codigos: Record<string, string> = {
    inválido: settings.cupomInvalido, expirado: settings.cupomExpirado,
  };
  if (!(situacao in codigos)) throw new Error(`Situação de cupom desconhecida: ${situacao}`);
  await carrinhoPage.aplicarCupom(codigos[situacao]);
});

When('removo o cupom', async ({ carrinhoPage }) => {
  await carrinhoPage.removerCupom();
});

When('aumento a quantidade de {string} em {int} unidades', async ({ carrinhoPage }, codigo: string, unidades: number) => {
  await carrinhoPage.alterarQuantidade(produtoId(codigo), 'aumentar', unidades);
});

When('diminuo a quantidade de {string} em {int} unidades', async ({ carrinhoPage }, codigo: string, unidades: number) => {
  await carrinhoPage.alterarQuantidade(produtoId(codigo), 'diminuir', unidades);
});

Then('o cupom válido deve estar aplicado', async ({ carrinhoPage }) => {
  await carrinhoPage.esperarCupomAplicado(settings.cupomValido.toUpperCase());
});

Then('devo ver o erro {string}', async ({ carrinhoPage }, mensagem: string) => {
  await carrinhoPage.esperarErroCupom(mensagem);
});

Then('o campo de cupom deve estar disponível', async ({ carrinhoPage }) => {
  await expect(carrinhoPage.campoCupom).toBeVisible();
});

Then('não devo poder informar outro cupom antes de remover o atual', async ({ carrinhoPage }) => {
  await expect(carrinhoPage.campoCupom).toHaveCount(0);
  await expect(carrinhoPage.page.getByRole('button', { name: 'Aplicar cupom', exact: true })).toHaveCount(0);
});

Then('o resumo deve apresentar subtotal {string}, desconto {string}, frete {string} e total {string}', async ({ carrinhoPage, $testInfo }, subtotal: string, desconto: string, frete: string, total: string) => {
  if (reais(subtotal) === settings.valorMinimo && reais(frete) === 0) {
    $testInfo.annotations.push({ type: 'issue', description: 'BUG-001: CA06 exige frete grátis no limite de R$ 200,00, inclusive.' });
  }
  await carrinhoPage.esperarResumo({ subtotal: reais(subtotal), desconto: reais(desconto), frete: reais(frete), total: reais(total) });
});

Then('a quantidade de {string} deve ser {int}', async ({ carrinhoPage }, codigo: string, quantidade: number) => {
  await carrinhoPage.esperarQuantidade(produtoId(codigo), quantidade);
});
