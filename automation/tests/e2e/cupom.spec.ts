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

  test('CT-CA02-001 normaliza caixa mista e espaços', async ({ carrinhoComProduto }) => {
    const misto = [...settings.cupomValido].map((letra, indice) => indice % 2 ? letra.toLowerCase() : letra.toUpperCase()).join('');
    await carrinhoComProduto.aplicarCupom(`  ${misto}  `);
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

  test('CT-HIP-001 observa resposta ao campo só com espaços', async ({ carrinhoComProduto }, testInfo) => {
    testInfo.annotations.push({ type: 'hypothesis', description: 'HIP-001: feedback para cupom vazio na UI é comportamento observado, sem CA próprio.' });
    await carrinhoComProduto.aplicarCupom('   ');
    await carrinhoComProduto.esperarErroCupom('Informe um cupom.');
    await carrinhoComProduto.esperarResumo({ subtotal: 100, desconto: 0, frete: 19.9, total: 119.9 });
  });

  test('CT-CA09-001 desconto exclui frete no subtotal de R$ 150 @smoke', async ({ vitrinePage, carrinhoPage }, testInfo) => {
    await vitrinePage.abrir();
    await vitrinePage.adicionarItens([{ produtoId: 'P005', quantidade: 1 }, { produtoId: 'P008', quantidade: 1 }]);
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.esperarResumo({ subtotal: 150, desconto: 0, frete: 19.9, total: 169.9 });
    await carrinhoPage.aplicarCupom(settings.cupomValido);
    await carrinhoPage.esperarResumo({ subtotal: 150, desconto: 15, frete: 19.9, total: 154.9 });
    await carrinhoPage.anexarEvidencia(testInfo, 'CT-CA09-001');
  });

  test('CT-CA11-002 apresenta centavos com formatação brasileira', async ({ vitrinePage, carrinhoPage }, testInfo) => {
    await vitrinePage.abrir();
    await vitrinePage.adicionarItens([{ produtoId: 'P002', quantidade: 1 }, { produtoId: 'P004', quantidade: 2 }]);
    await vitrinePage.irAoCarrinho();
    await carrinhoPage.aplicarCupom(settings.cupomValido);
    await carrinhoPage.esperarResumo({ subtotal: 239.7, desconto: 23.97, frete: 0, total: 215.73 });
    await carrinhoPage.anexarEvidencia(testInfo, 'CT-CA11-002');
  });
});
