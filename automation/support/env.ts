import path from 'node:path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });

const baseURL = process.env.BASE_URL || 'https://verzel-store.qa-test-verzel-store.workers.dev';
const url = new URL(baseURL);
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('BASE_URL deve usar HTTP ou HTTPS.');
const valorMinimo = Number(process.env.VALOR_MINIMO || 200);
if (valorMinimo !== 200) {
  throw new Error('A documentação v2.3.0 fixa o limite do frete em R$ 200,00. Atualize dados e oráculos antes de mudar VALOR_MINIMO.');
}

export const settings = Object.freeze({
  baseURL: baseURL.replace(/\/$/, ''),
  cupomValido: process.env.CUPOM_VALIDO || 'BEMVINDO10',
  cupomInvalido: process.env.CUPOM_INVALIDO || 'CUPOM_INVALIDO',
  cupomExpirado: process.env.CUPOM_EXPIRADO || 'VERAO2026',
  valorMinimo,
});
