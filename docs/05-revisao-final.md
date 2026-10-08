# Revisão final da suíte

Correções e execução locais concluídas em 08/10/2026. Publicação da versão atual e CI remoto ainda pendentes.

## Problemas encontrados e ajustes

- AuthService era apenas uma declaração de escopo; AuthSpec executava catálogo. Serviço removido e testes movidos para produtos.spec.ts.
- UsuarioFactory criava dados de pedido, sem cadastro. Renomeada para ClienteFactory e imports atualizados.
- Dependência ts-node sem uso removida; npm ci, TypeScript e bddgen conferidos.
- Cenário solicitado de 199,80 sem cupom ausente; adicionado com P001+P002, frete 19,90, faltante 0,20 e total 219,70.
- BDD repetia testes E2E: reduzido a quatro transições distintas, mantendo 11 E2E e 43 API.
- IDs legados não rastreavam CA/risco/técnica: matriz atual com58 IDs únicos e racional P0/P1/P2.
- Cálculo “sempre 200” não se aplica a entradas inválidas: documentos registram200 para cupom recusado, 422 para itens inválidos, 400 paraJSON malformado.
- Exemplo fictício de bug retirado. Apenas BUG-001/BUG-002 reais permanecem.
- Pré-validação detectou timeout da automação nas assertions suaves; ajuste para 1s após estado estável permitiu executar as duas etapas. Rodada final sem timeout.

## Execução e evidências

**58 executados,51 aprovados,7 reprovados,0 bloqueados,0 ignorados,0 instáveis.** API 43/37/6; E2E 11/10/1; BDD 4/4/0. CA01–CA11 cobertos na matriz; cenários prioritários001 deCA01/CA06/CA07 executados. Apenas CA06 prioritário falhou por frete indevido.

[Matriz](01-cenarios-teste.md) · [Execução](02-execucao-testes.md) · [Bugs](03-bugs.md) · [Relatório58casos](evidencias/execucao-2026-10-08.md) · [Artefatos completos](evidencias/execucao-completa-2026-10-08.zip).

Exploração manual por agente registrada separadamente. Screenshots, traces deAPI/UI,vídeos,HTML,JSON, log, sondagens independentes e 43 arquivos no manifesto desta rodada. Fonte e hashes de execução preservados; histórico de 07/10 mantido.

## Git e publicação

Histórico original e sete branches preservados. Correções na branch fix/qa-final; main continua no commit inicial. Repositório público: https://github.com/acarolinebcosta/qa-verzel-store . Atualmente contém somente estrutura inicial; arquivos desta suíte não foram enviados. Nenhum PR ou tag da entrega foi publicado.

GitHub Actions: NÃO EXECUTADO. Workflow versionado com npm ci, Chromium, TypeScript, suíte e upload completo mesmo em falha. Publicação/proteção/tag: BLOQUEADOS por acesso à escrita, permissões da extensão e autenticação de identidade GitHub. Revisão humana: NÃO EXECUTADA.

## Inventário desta correção

| Estado antes do commit | Arquivo |
| --- | --- |
| M | `.github/workflows/playwright.yml` |
| M | `README.md` |
| M | `automation/.env.example` |
| M | `automation/data/cupons.json` |
| D | `automation/factories/usuario.factory.ts` |
| M | `automation/features/cupom.feature` |
| M | `automation/features/frete-gratis.feature` |
| M | `automation/package-lock.json` |
| M | `automation/package.json` |
| M | `automation/pages/carrinho.page.ts` |
| M | `automation/pages/vitrine.page.ts` |
| D | `automation/services/auth.service.ts` |
| M | `automation/services/carrinho.service.ts` |
| M | `automation/services/cupom.service.ts` |
| M | `automation/steps/cupom.steps.ts` |
| M | `automation/steps/frete-gratis.steps.ts` |
| M | `automation/support/env.ts` |
| D | `automation/tests/api/auth.spec.ts` |
| M | `automation/tests/api/carrinho.spec.ts` |
| M | `automation/tests/api/cupom.spec.ts` |
| M | `automation/tests/api/pedidos.spec.ts` |
| M | `automation/tests/e2e/acessibilidade.spec.ts` |
| M | `automation/tests/e2e/cupom.spec.ts` |
| M | `automation/tests/e2e/frete-gratis.spec.ts` |
| M | `docs/01-cenarios-teste.md` |
| M | `docs/02-execucao-testes.md` |
| M | `docs/03-bugs.md` |
| M | `docs/04-uso-de-ia.md` |
| M | `docs/exploratorio/charter-cupom-frete.md` |
| ?? | `automation/factories/cliente.factory.ts` |
| ?? | `automation/tests/api/produtos.spec.ts` |
| ?? | `docs/evidencias/CT-CA01-001-tentativa-1-CT-CA01-001-1032a84ba50ccefe2f51719435e9b4ecca718333.png` |
| ?? | `docs/evidencias/CT-CA03-001-tentativa-1-CT-CA03-001-e3f020fbee670808b658a41e3eb16537ed626d2a.png` |
| ?? | `docs/evidencias/CT-CA04-001-tentativa-1-CT-CA04-001-627f3287014d6fa76e84eefd1372bd6ab9e9e03c.png` |
| ?? | `docs/evidencias/CT-CA04-202-tentativa-1-error-context.md` |
| ?? | `docs/evidencias/CT-CA04-202-tentativa-2-error-context.md` |
| ?? | `docs/evidencias/CT-CA04-202-tentativa-2-trace.zip` |
| ?? | `docs/evidencias/CT-CA05-001-tentativa-1-cupom-removido-9e4ed6b5161ab202c7d6dbecc6e21a0ece9574c4.png` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-1-CT-CA06-001-com-cupom-c648bf47892e9ba9b87f1f388f14ce8e97681cfb.png` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-1-CT-CA06-001-sem-cupom-155affb712f597090f7d6a5b5e79e8a39917eddc.png` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-1-error-context.md` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-1-test-failed-1.png` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-1-video.webm` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-2-CT-CA06-001-com-cupom-edc8fd97f15ec91d30978e59fd51c78837080bee.png` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-2-CT-CA06-001-sem-cupom-90e71a38f51817c2d574cbad099b0279a5e80195.png` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-2-error-context.md` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-2-test-failed-1.png` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-2-trace.zip` |
| ?? | `docs/evidencias/CT-CA06-001-tentativa-2-video.webm` |
| ?? | `docs/evidencias/CT-CA06-201-tentativa-1-error-context.md` |
| ?? | `docs/evidencias/CT-CA06-201-tentativa-2-error-context.md` |
| ?? | `docs/evidencias/CT-CA06-201-tentativa-2-trace.zip` |
| ?? | `docs/evidencias/CT-CA07-001-tentativa-1-CT-CA07-001-2adac37a888a48dbfdad4020f6db535f56b1d34a.png` |
| ?? | `docs/evidencias/CT-CA07-002-tentativa-1-produto-removido-765fe32554653a3efcf50eea36d47ed8e7676b84.png` |
| ?? | `docs/evidencias/CT-CA08-201-tentativa-1-error-context.md` |
| ?? | `docs/evidencias/CT-CA08-201-tentativa-2-error-context.md` |
| ?? | `docs/evidencias/CT-CA08-201-tentativa-2-trace.zip` |
| ?? | `docs/evidencias/CT-CA08-203-tentativa-1-error-context.md` |
| ?? | `docs/evidencias/CT-CA08-203-tentativa-2-error-context.md` |
| ?? | `docs/evidencias/CT-CA08-203-tentativa-2-trace.zip` |
| ?? | `docs/evidencias/CT-CA10-206-tentativa-1-error-context.md` |
| ?? | `docs/evidencias/CT-CA10-206-tentativa-2-error-context.md` |
| ?? | `docs/evidencias/CT-CA10-206-tentativa-2-trace.zip` |
| ?? | `docs/evidencias/CT-CA10-220-tentativa-1-error-context.md` |
| ?? | `docs/evidencias/CT-CA10-220-tentativa-2-error-context.md` |
| ?? | `docs/evidencias/CT-CA10-220-tentativa-2-trace.zip` |
| ?? | `docs/evidencias/api-2026-10-08.json` |
| ?? | `docs/evidencias/codigo-2026-10-08.json` |
| ?? | `docs/evidencias/execucao-2026-10-08.log` |
| ?? | `docs/evidencias/execucao-2026-10-08.md` |
| ?? | `docs/evidencias/execucao-completa-2026-10-08.zip` |
| ?? | `docs/evidencias/exploracao-manual-2026-10-08.md` |
| ?? | `docs/evidencias/manifesto-2026-10-08.json` |
| ?? | `docs/evidencias/prevalidacao-2026-10-08.json` |
| ?? | `docs/evidencias/resultados-2026-10-08.json` |

R renomeado não é obrigatório no status anterior ao stage: arquivos antigos aparecem D, novos aparecem ??. O Git detecta as renomeações ao comparar o commit.

## Como executar

```bash
cd automation
npm ci
npx playwright install chromium
npm run typecheck
npm test
npm run report
```

A suíte retorna código 1 enquanto os dois defeitos do produto persistirem. Esse resultado preserva as regras oficiais.
