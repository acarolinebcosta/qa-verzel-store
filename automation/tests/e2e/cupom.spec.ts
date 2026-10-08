import { test, expect } from '../../fixtures/base.fixture';
import { settings } from '../../support/env';

test.describe('Cupom de desconto na interface @regression', () => {
  test('aplica 10% no subtotal, sem descontar o frete @smoke', async ({ carrinhoComProduto }, testInfo) => {
    await carrinhoComProduto.aplicarCupom(settings.cupomValido);
    await carrinhoComProduto.esperarCupomAplicado(settings.cupomValido.toUpperCase());
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
    await carrinhoComProduto.anexarEvidencia(testInfo, 'cupom-valido');
  });

  for (const exemplo of [
    { nome: 'inválido', codigo: settings.cupomInvalido, mensagem: 'Cupom inválido.' },
    { nome: 'expirado', codigo: settings.cupomExpirado, mensagem: 'Cupom expirado.' },
  ]) {
    test(`rejeita cupom ${exemplo.nome} sem alterar os valores @smoke`, async ({ carrinhoComProduto }) => {
      await carrinhoComProduto.aplicarCupom(exemplo.codigo);
      await carrinhoComProduto.esperarErroCupom(exemplo.mensagem);
      await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
    });
  }

  for (const codigo of [settings.cupomValido.toLowerCase(), `  ${settings.cupomValido.toLowerCase()}  `]) {
    test(`normaliza maiúsculas e espaços: ${JSON.stringify(codigo)}`, async ({ carrinhoComProduto }) => {
      await carrinhoComProduto.aplicarCupom(codigo);
      await carrinhoComProduto.esperarCupomAplicado(settings.cupomValido.toUpperCase());
      await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
    });
  }

  test('aceita cupom em subtotal abaixo do limite de frete grátis', async ({ vitrinePage, carrinhoPage }) => {
    await vitrinePage.abrir();
    await vitrinePage.adicionar('P004');
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.aplicarCupom(settings.cupomValido);
    // A documentação não exige valor mínimo para o cupom.
    await carrinhoPage.esperarResumo({ subtotal: 49.9, desconto: 4.99, frete: 19.9, total: 64.81 });
  });

  test('remove cupom e restaura o total original', async ({ carrinhoComProduto }, testInfo) => {
    await carrinhoComProduto.aplicarCupom(settings.cupomValido);
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
    await carrinhoComProduto.removerCupom();
    await expect(carrinhoComProduto.campoCupom).toBeVisible();
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
    await carrinhoComProduto.anexarEvidencia(testInfo, 'cupom-removido');
  });

  test('permite somente um cupom por vez', async ({ carrinhoComProduto }) => {
    await carrinhoComProduto.aplicarCupom(settings.cupomValido);
    await carrinhoComProduto.esperarCupomAplicado(settings.cupomValido.toUpperCase());
    await expect(carrinhoComProduto.campoCupom).toHaveCount(0);
    await expect(carrinhoComProduto.page.getByRole('button', { name: 'Aplicar cupom', exact: true })).toHaveCount(0);
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
    await carrinhoComProduto.removerCupom();
    await carrinhoComProduto.aplicarCupom(settings.cupomValido);
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
  });

  test('exige um código ao enviar campo vazio', async ({ carrinhoComProduto }) => {
    await carrinhoComProduto.aplicarCupom('   ');
    await carrinhoComProduto.esperarErroCupom('Informe um cupom.');
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
  });

  test('recalcula desconto ao aumentar e diminuir a quantidade', async ({ vitrinePage, carrinhoPage }) => {
    await vitrinePage.abrir();
    await vitrinePage.adicionar('P008');
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.aplicarCupom(settings.cupomValido);
    await carrinhoPage.esperarResumo({ subtotal: 50, desconto: 5, frete: 19.9, total: 64.9 });
    await carrinhoPage.alterarQuantidade('P008', 'aumentar');
    await carrinhoPage.esperarQuantidade('P008', 2);
    await carrinhoPage.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
    await carrinhoPage.alterarQuantidade('P008', 'diminuir');
    await carrinhoPage.esperarResumo({ subtotal: 50, desconto: 5, frete: 19.9, total: 64.9 });
  });
});
