import { test, expect } from '../../fixtures/base.fixture';
import { produtos, type ItemVitrine } from '../../pages/vitrine.page';
import { settings } from '../../support/env';

test.describe('Frete e limites do carrinho @regression', () => {
  const limites: { nome: string; itens: ItemVitrine[]; subtotal: number; frete: number }[] = [
    { nome: 'abaixo', itens: [
      { produtoId: 'P005', quantidade: 1 }, { produtoId: 'P008', quantidade: 1 },
      { produtoId: 'P004', quantidade: 1 },
    ], subtotal: 199.9, frete: 19.9 },
    { nome: 'exatamente', itens: [{ produtoId: 'P005', quantidade: 2 }], subtotal: 200, frete: 0 },
    { nome: 'acima', itens: [{ produtoId: 'P005', quantidade: 3 }], subtotal: 300, frete: 0 },
  ];

  for (const exemplo of limites) {
    test(`subtotal ${exemplo.nome} de R$ ${settings.valorMinimo}: frete conforme CA06/CA07`, async ({ vitrinePage, carrinhoPage }, testInfo) => {
      if (exemplo.subtotal === settings.valorMinimo && exemplo.frete === 0) {
        testInfo.annotations.push({ type: 'issue', description: 'BUG-001: CA06 exige frete grátis no limite de R$ 200,00, inclusive.' });
      }
      await vitrinePage.abrir();
      await vitrinePage.adicionarItens(exemplo.itens);
      await vitrinePage.irAoCarrinho();
      await carrinhoPage.esperarResumo({
        subtotal: exemplo.subtotal, desconto: 0, frete: exemplo.frete,
        total: Number((exemplo.subtotal + exemplo.frete).toFixed(2)),
      });
      if (exemplo.frete > 0) {
        await carrinhoPage.esperarFaltante(Number((settings.valorMinimo - exemplo.subtotal).toFixed(2)));
      }
    });
  }

  test('mantém frete grátis com cupom no limite de R$ 200 @smoke', async ({ vitrinePage, carrinhoPage }, testInfo) => {
    testInfo.annotations.push({ type: 'issue', description: 'BUG-001: CA06 exige frete grátis no limite de R$ 200,00, inclusive.' });
    await vitrinePage.abrir();
    await vitrinePage.adicionar('P005', 2);
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.aplicarCupom(settings.cupomValido);
    // CA08: R$ 180 após desconto continua elegível, pois o subtotal é R$ 200.
    await carrinhoPage.esperarResumo({ subtotal: 200, desconto: 20, frete: 0, total: 180 });
    await carrinhoPage.anexarEvidencia(testInfo, 'frete-gratis-com-cupom');
  });

  test('volta a cobrar frete quando remoção reduz o subtotal', async ({ vitrinePage, carrinhoPage }) => {
    await vitrinePage.abrir();
    await vitrinePage.adicionar('P005', 2);
    await vitrinePage.adicionar('P008');
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.esperarResumo({ subtotal: 250, desconto: 0, frete: 0, total: 250 });
    await carrinhoPage.alterarQuantidade('P005', 'diminuir');
    await carrinhoPage.esperarResumo({ subtotal: 150, desconto: 0, frete: 19.9, total: 169.9 });
    await carrinhoPage.removerProduto('P008');
    await carrinhoPage.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
    await carrinhoPage.esperarFaltante(settings.valorMinimo - 100);
  });

  test('limita a cinco unidades na vitrine e no carrinho', async ({ vitrinePage, carrinhoPage }) => {
    await vitrinePage.abrir();
    await vitrinePage.adicionar('P008', 5);
    await expect(vitrinePage.produto('P008').getByRole('button', { name: 'Adicionar ao carrinho' })).toBeDisabled();
    await expect(vitrinePage.produto('P008').getByText('Limite de 5 unidades atingido.', { exact: true })).toBeVisible();
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.esperarQuantidade('P008', 5);
    await expect(carrinhoPage.grupoQuantidade('P008').getByRole('button', {
      name: `Aumentar quantidade de ${produtos.P008.nome}`, exact: true,
    })).toBeDisabled();
    await carrinhoPage.esperarResumo({ subtotal: 250, desconto: 0, frete: 0, total: 250 });
  });

  test('esvazia o carrinho e remove o cupom', async ({ carrinhoComProduto }) => {
    await carrinhoComProduto.aplicarCupom(settings.cupomValido);
    await carrinhoComProduto.page.getByRole('button', { name: 'Esvaziar carrinho', exact: true }).click();
    await expect(carrinhoComProduto.page.getByRole('heading', { name: 'Seu carrinho está vazio' })).toBeVisible();
    await expect(carrinhoComProduto.resumo).toHaveCount(0);
    await carrinhoComProduto.page.getByRole('link', { name: 'Ver produtos', exact: true }).click();
    await carrinhoComProduto.page.getByRole('article', { name: produtos.P005.nome, exact: true })
      .getByRole('button', { name: 'Adicionar ao carrinho', exact: true }).click();
    await carrinhoComProduto.page.getByRole('link', { name: /^Carrinho/ }).click();
    await expect(carrinhoComProduto.campoCupom).toBeVisible();
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
  });
});
