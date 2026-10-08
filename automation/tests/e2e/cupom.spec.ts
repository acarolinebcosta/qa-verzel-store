import { test, expect } from '../../fixtures/base.fixture';
import { settings } from '../../support/env';

test.describe('Cupom na interface @regression', () => {
  test('CT-CA01-001 cupom válido abaixo do limite @smoke', async ({ carrinhoComProduto }, testInfo) => {
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
    await carrinhoComProduto.aplicarCupom(settings.cupomValido);
    await carrinhoComProduto.esperarCupomAplicado(settings.cupomValido.toUpperCase());
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
    await carrinhoComProduto.anexarEvidencia(testInfo, 'CT-CA01-001');
  });

  for (const exemplo of [
    { id: 'CT-CA03-001', codigo: settings.cupomInvalido, mensagem: 'Cupom inválido.' },
    { id: 'CT-CA04-001', codigo: settings.cupomExpirado, mensagem: 'Cupom expirado.' },
  ]) {
    test(`${exemplo.id} rejeita cupom sem alterar o total @smoke`, async ({ carrinhoComProduto }, testInfo) => {
      await carrinhoComProduto.aplicarCupom(exemplo.codigo);
      await carrinhoComProduto.esperarErroCupom(exemplo.mensagem);
      await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
      await carrinhoComProduto.anexarEvidencia(testInfo, exemplo.id);
    });
  }

  test('CT-CA02-001 normaliza caixa e espaços', async ({ carrinhoComProduto }) => {
    await carrinhoComProduto.aplicarCupom(`  ${settings.cupomValido.toLowerCase()}  `);
    await carrinhoComProduto.esperarCupomAplicado(settings.cupomValido.toUpperCase());
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
  });

  test('CT-CA05-001 remove cupom e permite reaplicar', async ({ carrinhoComProduto }, testInfo) => {
    await carrinhoComProduto.aplicarCupom(settings.cupomValido);
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
    await carrinhoComProduto.removerCupom();
    await expect(carrinhoComProduto.campoCupom).toBeVisible();
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
    await carrinhoComProduto.anexarEvidencia(testInfo, 'cupom-removido');
    await carrinhoComProduto.aplicarCupom(settings.cupomValido);
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 10, frete: 19.9, total: 109.9 });
  });

  test('CT-CA03-002 exige código preenchido', async ({ carrinhoComProduto }) => {
    await carrinhoComProduto.aplicarCupom('   ');
    await carrinhoComProduto.esperarErroCupom('Informe um cupom.');
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
  });
});
