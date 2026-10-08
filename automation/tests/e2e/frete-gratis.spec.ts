import { test, expect } from '../../fixtures/base.fixture';
import { produtos } from '../../pages/vitrine.page';
import { settings } from '../../support/env';

test.describe('Frete e quantidade @regression', () => {
  test('CT-CA08-001 frete grátis em R$ 200 antes e depois do cupom @smoke', async ({ vitrinePage, carrinhoPage }, testInfo) => {
    testInfo.annotations.push({ type: 'issue', description: 'BUG-001' });
    await vitrinePage.abrir();
    await vitrinePage.adicionar('P005', 2);
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.aguardarCalculo();
    await carrinhoPage.anexarEvidencia(testInfo, 'CT-CA08-001-sem-cupom');
    // As duas etapas são verificadas mesmo quando o frete inicial falha.
    await carrinhoPage.esperarResumo({ subtotal: 200, desconto: 0, frete: 0, total: 200 }, true);
    await carrinhoPage.aplicarCupom(settings.cupomValido);
    await carrinhoPage.esperarCupomAplicado(settings.cupomValido.toUpperCase());
    await carrinhoPage.anexarEvidencia(testInfo, 'CT-CA08-001-com-cupom');
    await carrinhoPage.esperarResumo({ subtotal: 200, desconto: 20, frete: 0, total: 180 }, true);
  });

  test('CT-CA07-001 R$ 199,80 sem cupom informa faltante de R$ 0,20 @smoke', async ({ vitrinePage, carrinhoPage }, testInfo) => {
    await vitrinePage.abrir();
    await vitrinePage.adicionarItens([{ produtoId: 'P001', quantidade: 1 }, { produtoId: 'P002', quantidade: 1 }]);
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.esperarResumo({ subtotal: 199.8, desconto: 0, frete: 19.9, total: 219.7 });
    await carrinhoPage.esperarFaltante(0.2);
    await carrinhoPage.anexarEvidencia(testInfo, 'CT-CA07-001');
  });

  test('CT-CA07-002 remoção de produto recalcula frete e faltante', async ({ vitrinePage, carrinhoPage }, testInfo) => {
    await vitrinePage.abrir();
    await vitrinePage.adicionar('P005', 2);
    await vitrinePage.adicionar('P008');
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.esperarResumo({ subtotal: 250, desconto: 0, frete: 0, total: 250 });
    await carrinhoPage.removerProduto('P005');
    await carrinhoPage.esperarResumo({ subtotal: 50, desconto: 0, frete: 19.9, total: 69.9 });
    await carrinhoPage.esperarFaltante(150);
    await carrinhoPage.anexarEvidencia(testInfo, 'produto-removido');
  });

  test('CT-CA10-001 limita cinco unidades na vitrine e carrinho', async ({ vitrinePage, carrinhoPage }) => {
    await vitrinePage.abrir();
    await vitrinePage.adicionar('P008', 5);
    await expect(vitrinePage.produto('P008').getByRole('button', { name: 'Adicionar ao carrinho' })).toBeDisabled();
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.esperarQuantidade('P008', 5);
    await expect(carrinhoPage.grupoQuantidade('P008').getByRole('button', {
      name: `Aumentar quantidade de ${produtos.P008.nome}`, exact: true,
    })).toBeDisabled();
    await carrinhoPage.esperarResumo({ subtotal: 250, desconto: 0, frete: 0, total: 250 });
  });
});
