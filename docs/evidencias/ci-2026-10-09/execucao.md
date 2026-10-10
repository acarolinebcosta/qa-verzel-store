# Execução real no GitHub Actions — 09/10/2026

Consulta dos jobs e logs reais. Horários em America/Sao_Paulo (UTC−03); os logs originais usam UTC e, por isso, mostram 10/10/2026. Cada resultado pertence ao commit indicado; as rodadas não são somadas.

| PR / versão | Commit | Início–fim dos testes | Executados | PASSOU | FALHOU | Run |
| --- | --- | --- | --- | --- | --- | --- |
| #2 — consolidada | 39a123c37c3a1accaebc819fad2ac652fc209209 | 09/10, 23:38:06–23:38:28 | 70 | 61 | 9 | [38017644876](https://github.com/acarolinebcosta/qa-verzel-store/actions/runs/38017644876) |
| #5 — intermediária | c4dc54aee4baa2e3d5adeb6dfe182faa97094b67 | 09/10, 23:39:13–23:40:15 | 77 | 68 | 9 | [38017714035](https://github.com/acarolinebcosta/qa-verzel-store/actions/runs/38017714035) |
| #7 — intermediária | e01b9bb1a237a747e849f06e44b2ac97a0a68bbc | 09/10, 23:40:07–23:41:08 | 77 | 68 | 9 | [38017762921](https://github.com/acarolinebcosta/qa-verzel-store/actions/runs/38017762921) |

Nos três runs, checkout, Node, npm ci, instalação do Chromium, TypeScript e upload de evidências passaram. npm test retornou código 1 por divergências nas assertions. Ambiente consolidado: Ubuntu, Node 22.23.3 e npm 10.9.9; resumo Playwright: 22,6 s.

## Falhas da versão consolidada

| Bug | Testes | Divergência observada |
| --- | --- | --- |
| BUG-001 | CT-CA06-201, CT-CA08-201, CT-CA04-202, CT-CA08-203, CT-CA08-001 | Frete 19,90 quando o subtotal é exatamente 200,00 |
| BUG-002 | CT-CA10-206, CT-CA10-220 | API aceita seis unidades, acima do limite de cinco |
| BUG-003 | CT-API-005, CT-API-006 | Propriedades obrigatórias ausentes retornam códigos diferentes de ITEM_INVALIDO |

As nove falhas se repetiram no retry e correspondem aos defeitos documentados localmente. O timeout de 1 s mostrado na assertion E2E é a espera pelo valor financeiro esperado após a tela estabilizar; não é timeout de execução do teste. Não há evidência de falha de instalação, configuração ou TypeScript. As versões intermediárias de 77 testes preservam seus próprios IDs e resultados históricos.

## Evidências

- [Metadados dos runs e etapas](runs.json).
- [Log npm test da versão consolidada](run-38017644876-npm-test.log).
- [Log npm test do PR #5](run-38017714035-npm-test.log).
- [Log npm test do PR #7](run-38017762921-npm-test.log).
- [Artefato completo consolidado: playwright-report-1](https://github.com/acarolinebcosta/qa-verzel-store/actions/runs/38017644876/artifacts/11656449884).
- [Artefato intermediário: playwright-report-2](https://github.com/acarolinebcosta/qa-verzel-store/actions/runs/38017714035/artifacts/11656987874).
- [Artefato intermediário: playwright-report-3](https://github.com/acarolinebcosta/qa-verzel-store/actions/runs/38017762921/artifacts/11657415210).
- [Manifesto SHA-256 dos arquivos desta pasta](manifesto.json).

Os logs versionados são a seção npm test extraída dos jobs; os timestamps e o conteúdo dessa seção foram preservados. Os ZIPs completos estão nos artefatos do GitHub, sujeitos à retenção configurada de 14 dias. As evidências completas da execução local continuam em [consolidada-2026-10-08](../consolidada-2026-10-08/execucao.md).

**Estado do CI: FALHOU por defeitos do produto.** As expectativas oficiais foram mantidas. A pipeline não foi mascarada para indicar aprovação.
