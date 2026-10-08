import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../../fixtures/base.fixture';

test('carrinho sem violações críticas de acessibilidade @regression', async ({ carrinhoComProduto }, testInfo) => {
  const resultado = await new AxeBuilder({ page: carrinhoComProduto.page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  await testInfo.attach('axe-carrinho', {
    body: JSON.stringify(resultado, null, 2), contentType: 'application/json',
  });
  const criticas = resultado.violations.filter((violacao) => violacao.impact === 'critical');
  expect(criticas, 'Violações críticas; o relatório JSON contém também os demais impactos').toEqual([]);
});
