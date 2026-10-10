import { test, expect } from '@playwright/test';
import cupons from '../../data/cupons.json';
import { CupomService } from '../../services/cupom.service';
import { CarrinhoService } from '../../services/carrinho.service';
import { schemaResumoCarrinho } from '../../schemas/api.schema';
import { settings } from '../../support/env';
import { esperarResumoAPI } from '../../support/monetary';

const itens = [{ produtoId: 'P005', quantidade: 1 }];

test.describe('Cupons na API @regression', () => {
  test('CT-CA01-201 CA01/CA09: 10% sobre produtos mantém frete de R$ 19,90 @smoke', async ({ request }) => {
    const response = await new CupomService(request).aplicar(settings.cupomValido, itens);
    expect(response.status()).toBe(200);
    const resumo = schemaResumoCarrinho.parse(await response.json());
    esperarResumoAPI(resumo, {
      subtotal: 100, desconto: 10, frete: 19.9, total: 109.9,
      freteGratis: false, valorFaltanteFreteGratis: 100,
      cupom: { codigo: settings.cupomValido.toUpperCase(), aplicado: true },
    });
  });

  const cupomCaixaMista = settings.cupomValido.split('').map((letra, indice) => (
    indice % 2 === 0 ? letra.toUpperCase() : letra.toLowerCase()
  )).join('');
  const normalizacoes = [
    { id: 'CT-CA02-201', codigo: settings.cupomValido.toLowerCase() },
    { id: 'CT-CA02-202', codigo: `  ${settings.cupomValido.toUpperCase()}  ` },
    { id: 'CT-CA02-203', codigo: `\t${settings.cupomValido.toLowerCase()}\n` },
    { id: 'CT-CA02-204', codigo: `  ${cupomCaixaMista}  ` },
  ];
  for (const { id, codigo } of normalizacoes) {
    test(`${id} CA02: normaliza caixa e espaços em ${JSON.stringify(codigo)}`, async ({ request }) => {
      const response = await new CupomService(request).aplicar(codigo, itens);
      expect(response.status()).toBe(200);
      const resumo = schemaResumoCarrinho.parse(await response.json());
      esperarResumoAPI(resumo, {
        subtotal: 100, desconto: 10, frete: 19.9, total: 109.9,
        cupom: { codigo: settings.cupomValido.toUpperCase(), aplicado: true },
      });
    });
  }

  const cuponsRejeitados = cupons.filter(({ esperado }) => esperado === 'erro').map(({ codigo, mensagem }) => ({
    codigo: codigo === 'VERAO2026' ? settings.cupomExpirado : settings.cupomInvalido,
    criterio: codigo === 'VERAO2026' ? 'CA04' : 'CA03',
    id: codigo === 'VERAO2026' ? 'CT-CA04-201' : 'CT-CA03-201',
    mensagem,
  }));
  for (const { id, codigo, criterio, mensagem } of cuponsRejeitados) {
    test(`${id} ${criterio}: ${codigo} calcula sem desconto e informa o motivo`, async ({ request }) => {
      const response = await new CupomService(request).aplicar(codigo, itens);
      expect(response.status()).toBe(200);
      esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
        subtotal: 100, desconto: 0, frete: 19.9, total: 119.9,
        cupom: { aplicado: false, mensagem },
      });
    });
  }

  test('CT-CA05-201 CA05: requisições independentes removem e reaplicam o cupom sem acumular desconto entre chamadas', async ({ request }) => {
    const carrinho = new CarrinhoService(request);
    const aplicar = async () => {
      const response = await carrinho.calcular(itens, settings.cupomValido);
      expect(response.status()).toBe(200);
      return schemaResumoCarrinho.parse(await response.json());
    };
    esperarResumoAPI(await aplicar(), { desconto: 10, total: 109.9 });
    const removido = await carrinho.removerCupom(itens);
    expect(removido.status()).toBe(200);
    esperarResumoAPI(schemaResumoCarrinho.parse(await removido.json()), {
      desconto: 0, total: 119.9, cupom: null,
    });
    esperarResumoAPI(await aplicar(), { desconto: 10, total: 109.9 });
  });

  test('CT-CA05-202 CA05: dois códigos em um campo não acumulam cupons', async ({ request }) => {
    // A API aceita um único código, não uma lista ou uma sessão de cupons.
    const response = await new CupomService(request).aplicar(
      `${settings.cupomValido},${settings.cupomExpirado}`, itens,
    );
    expect(response.status()).toBe(200);
    esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
      desconto: 0, cupom: { aplicado: false, mensagem: 'Cupom inválido.' },
    });
  });

  test('CT-CA01-202 cupom não exige valor mínimo para desconto', async ({ request }) => {
    const response = await new CupomService(request).aplicar(
      settings.cupomValido, [{ produtoId: 'P006', quantidade: 1 }],
    );
    expect(response.status()).toBe(200);
    esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
      subtotal: 29.9, desconto: 2.99, frete: 19.9, total: 46.81,
    });
  });

  test('CT-CA09-203 desconto exclui frete cobrado em subtotal de R$ 150,00', async ({ request }) => {
    const response = await new CupomService(request).aplicar(settings.cupomValido, [
      { produtoId: 'P005', quantidade: 1 }, { produtoId: 'P008', quantidade: 1 },
    ]);
    expect(response.status()).toBe(200);
    esperarResumoAPI(schemaResumoCarrinho.parse(await response.json()), {
      subtotal: 150, desconto: 15, frete: 19.9, freteGratis: false,
      valorFaltanteFreteGratis: 50, total: 154.9,
      cupom: { codigo: settings.cupomValido.toUpperCase(), aplicado: true },
    });
  });

});
