import { test, expect } from '@playwright/test';
import cupons from '../../data/cupons.json';
import { CupomService } from '../../services/cupom.service';
import { CarrinhoService } from '../../services/carrinho.service';
import { schemaResumoCarrinho } from '../../schemas/api.schema';
import { settings } from '../../support/env';

const itens = [{ produtoId: 'P005', quantidade: 1 }];

test.describe('Cupons na API @regression', () => {
  test('CA01/CA09: 10% sobre produtos mantém frete de R$ 19,90 @smoke', async ({ request }) => {
    const response = await new CupomService(request).aplicar(settings.cupomValido, itens);
    expect(response.status()).toBe(200);
    const resumo = schemaResumoCarrinho.parse(await response.json());
    expect(resumo).toMatchObject({
      subtotal: 100, desconto: 10, frete: 19.9, total: 109.9,
      freteGratis: false, valorFaltanteFreteGratis: 100,
      cupom: { codigo: settings.cupomValido.toUpperCase(), aplicado: true },
    });
  });

  for (const codigo of [
    settings.cupomValido.toLowerCase(),
    `  ${settings.cupomValido.toLowerCase()}  `,
    `\t${settings.cupomValido.toLowerCase()}\n`,
  ]) {
    test(`CA02: normaliza caixa e espaços em ${JSON.stringify(codigo)}`, async ({ request }) => {
      const response = await new CupomService(request).validar(codigo, itens);
      expect(response.status()).toBe(200);
      const resumo = schemaResumoCarrinho.parse(await response.json());
      expect(resumo.desconto).toBe(10);
      expect(resumo.cupom).toMatchObject({ codigo: settings.cupomValido.toUpperCase(), aplicado: true });
    });
  }

  const cuponsRejeitados = cupons.filter(({ esperado }) => esperado === 'erro').map(({ codigo, mensagem }) => ({
    codigo: codigo === 'VERAO2026' ? settings.cupomExpirado : settings.cupomInvalido,
    criterio: codigo === 'VERAO2026' ? 'CA04' : 'CA03',
    mensagem,
  }));
  for (const { codigo, criterio, mensagem } of cuponsRejeitados) {
    test(`${criterio}: ${codigo} calcula sem desconto e informa o motivo`, async ({ request }) => {
      const response = await new CupomService(request).aplicar(codigo, itens);
      expect(response.status()).toBe(200);
      expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
        subtotal: 100, desconto: 0, frete: 19.9, total: 119.9,
        cupom: { aplicado: false, mensagem },
      });
    });
  }

  test('CA05: remove e reaplica o cupom sem acumular desconto entre chamadas', async ({ request }) => {
    const carrinho = new CarrinhoService(request);
    const aplicar = async () => {
      const response = await carrinho.calcular(itens, settings.cupomValido);
      expect(response.status()).toBe(200);
      return schemaResumoCarrinho.parse(await response.json());
    };
    expect((await aplicar()).desconto).toBe(10);
    const removido = await carrinho.removerCupom(itens);
    expect(removido.status()).toBe(200);
    expect(schemaResumoCarrinho.parse(await removido.json())).toMatchObject({
      desconto: 0, total: 119.9, cupom: null,
    });
    expect((await aplicar()).desconto).toBe(10);
  });

  test('CA05: dois códigos em um campo não acumulam cupons', async ({ request }) => {
    // A API aceita um único código, não uma lista ou uma sessão de cupons.
    const response = await new CupomService(request).aplicar(
      `${settings.cupomValido},${settings.cupomExpirado}`, itens,
    );
    expect(response.status()).toBe(200);
    expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
      desconto: 0, cupom: { aplicado: false, mensagem: 'Cupom inválido.' },
    });
  });

  test('cupom não exige valor mínimo para desconto', async ({ request }) => {
    const response = await new CupomService(request).aplicar(
      settings.cupomValido, [{ produtoId: 'P006', quantidade: 1 }],
    );
    expect(response.status()).toBe(200);
    expect(schemaResumoCarrinho.parse(await response.json())).toMatchObject({
      subtotal: 29.9, desconto: 2.99, frete: 19.9, total: 46.81,
    });
  });

});
