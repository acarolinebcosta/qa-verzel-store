# QA Verzel Store

Suíte de testes da entrega **VZS-142 — Cupom de desconto e frete grátis**, baseada na [documentação oficial 2.3.0](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao), publicada em 30/09/2026. Testa a [loja pública](https://verzel-store.qa-test-verzel-store.workers.dev/) e sua API real, com TypeScript, Playwright, BDD, contratos Zod e evidências versionadas.

**Execução consolidada de 08/10/2026: 70 testes, 61 PASSOU e 9 FALHOU**, sem bloqueados, ignorados, instáveis ou timeout. As nove falhas reproduzem três defeitos do produto; as expectativas oficiais foram mantidas. A implementação local está pronta para revisão. A suíte atual ainda não foi publicada no repositório público, e a pipeline remota não foi executada.

## Entregáveis

| Entrega | Arquivo |
| --- | --- |
| Requisitos, interpretações e hipóteses investigadas | [Análise](docs/00-analise-requisitos.md) |
| Gherkin, estratégia por risco e matriz CA01–CA11 | [Cenários e rastreabilidade](docs/01-cenarios-teste.md) |
| Resultados automáticos, manuais e exploratórios | [Execução](docs/02-execucao-testes.md) |
| Três defeitos confirmados, passos e evidências | [Bugs](docs/03-bugs.md) |
| Apoio de IA e revisão humana pendente | [Uso de IA](docs/04-uso-de-ia.md) |
| Inventário do que está pronto e do que falta | [Revisão final](docs/05-revisao-final.md) |
| Missão, risco, RCRCRC e tempo real da exploração | [Charter](docs/exploratorio/charter-cupom-frete.md) |
| Resultado individual dos 70 casos | [Relatório consolidado](docs/evidencias/consolidada-2026-10-08/execucao.md) |
| HTML, traces, vídeos e resultados completos | [Artefatos da rodada](docs/evidencias/consolidada-2026-10-08/artefatos-completos.zip) |
| Integridade de evidências e código executado | [Manifesto SHA-256](docs/evidencias/consolidada-2026-10-08/manifesto.json), [código](docs/evidencias/consolidada-2026-10-08/codigo.json) |
| Integração contínua configurada | [GitHub Actions](.github/workflows/playwright.yml) |

## Execução e resultado

| Camada | Executados | PASSOU | FALHOU |
| --- | ---: | ---: | ---: |
| API | 52 | 44 | 8 |
| E2E | 13 | 12 | 1 |
| BDD | 5 | 5 | 0 |
| Total | 70 | 61 | 9 |

Os três cenários mínimos foram implementados e efetivamente executados:

| ID | Critérios | Esperado | Resultado |
| --- | --- | --- | --- |
| CT-CA01-001 | CA01, CA07, CA09 | P005×1; desconto 10,00; frete 19,90; total 109,90 | PASSOU |
| CT-CA08-001 | CA01, CA06, CA08 | P005×2; total 200,00 sem cupom e 180,00 com cupom; frete zero | FALHOU — BUG-001; total 219,90/199,90 |
| CT-CA09-001 | CA01, CA07, CA09 | P005+P008; desconto 15,00; frete 19,90; total 154,90 | PASSOU |

**BUG-001:** frete cobrado exatamente em subtotal 200,00. **BUG-002:** API aceita seis unidades por produto. **BUG-003:** propriedades obrigatórias ausentes retornam códigos diferentes de ITEM_INVALIDO. Código de saída 1 da suíte é o resultado real desses defeitos.

Também foram executados normalização isolada de caixa/trim e combinada, cupom inválido/expirado em cálculo/pedido, fronteira 199,90 com cupom, limite 5/6, negativos estruturais, erros 400/404/405/422, cliente/CEP e centavos 239,70→215,73. BDD cobre cinco transições diferentes das specs E2E. A acessibilidade crítica do carrinho é complementar e passou; não substitui avaliação humana completa.

## Como executar

Requisitos: Node.js 20+, npm e acesso à loja/API públicas. O CI usa Node 22 e Ubuntu; a execução local auditada usa Node 26.6.0 em macOS arm64.

```bash
cd automation
npm ci
npx playwright install chromium
cp .env.example .env
npm run typecheck
npm test
npm run report
```

Em Linux, use `npx playwright install --with-deps chromium`. O arquivo `.env` é local e ignorado pelo Git. Os valores padrão de [.env.example](automation/.env.example) correspondem ao contrato público; não contêm credenciais.

`pretest` executa bddgen antes de Playwright. Os comandos `test:smoke`, `test:regression`, `test:headed` e `test:bdd` também preparam BDD. Para uma camada, execute `npm run test:api`, `npm run test:e2e` ou `npm run test:bdd`. Não há mocks, sleeps arbitrários, testes ignorados ou falhas marcadas como esperadas.

## Arquitetura

| Camada | Responsabilidade |
| --- | --- |
| automation/pages | Localizadores e comportamento de interface |
| automation/services | Chamadas aos endpoints HTTP documentados |
| automation/fixtures | Contexto isolado e preparação de carrinho |
| automation/data e factories | Cupons, catálogo e cliente fictício de pedido |
| automation/schemas | Contratos separados de sucesso/erro e precisão de centavos |
| automation/support | Ambiente e comparação monetária numérica |
| automation/features e steps | Gherkin executável e transições BDD |
| automation/tests | Specs funcionais de API, E2E e acessibilidade complementar |
| automation/reporters | Resultados Markdown, IDs, hipóteses e anexos |

AuthService sem função foi removido; AuthSpec foi adaptado para catálogo em produtos.spec.ts; UsuarioFactory foi renomeada para cliente.factory.ts. Não há login, cadastro, estoque, pagamento online nem consulta/persistência de pedido. Carrinho por aba, API sem estado, número fictício, ausência de cobrança/e-mail são simplificações oficiais.

## Regras e decisões de QA

- BEMVINDO10 aplica 10% sobre produtos; VERAO2026 expirou em 31/03/2026. Não há mínimo de cupom ou cupom exclusivo de frete.
- Frete grátis considera subtotal antes do desconto, inclusive 200,00. Abaixo disso: 19,90 e faltante para 200. Fórmula: total = subtotal - desconto + frete.
- 199,90 com desconto 19,99 é útil para o lado cobrado, mas não diferencia a ordem do cálculo. O caso discriminante usa 209,40→188,46, que deve manter frete zero e passou. A falha em 200 não prova inversão geral da ordem.
- CA09 usa frete positivo: 150 com desconto 15 e frete 19,90 resulta em 154,90. Desconto indevido também sobre frete resultaria em 152,91.
- Cupom inválido/expirado: cálculo 200 sem desconto e mensagem; pedido 422. Itens inválidos: 422; JSON malformado: 400.
- API compara números com `toBeCloseTo(..., 2)` após Zod. UI verifica prefixo R$, vírgula e duas casas decimais. Não se exige representação textual do número JSON.
- Hipóteses de cupom vazio/null/espaços, ID minúsculo e descarte ao esvaziar têm observação real separada, sem bugs presumidos. [Interpretações e dados](docs/00-analise-requisitos.md).

## Evidências e CI

Playwright produz HTML em `automation/playwright-report/`, JSON e anexos em `automation/test-results/`. O reporter gera `docs/execucao-automatica.md`, ignorado e regenerado em cada rodada. Configuração: trace na primeira repetição, screenshot de falha e vídeo retido em falha; os três mínimos também têm capturas explícitas.

A pasta [consolidada-2026-10-08](docs/evidencias/consolidada-2026-10-08/) preserva 49 evidências mais o próprio manifesto SHA-256 (50 arquivos): JSON, log, sondagens, código, screenshots, traces, vídeos e ZIP com o HTML completo. As execuções anteriores de [07/10](docs/evidencias/execucao-2026-10-07.md) e [08/10 às 03:35](docs/evidencias/execucao-2026-10-08.md) permanecem intactas; suas contagens não são somadas.

O workflow executa npm ci, instala Chromium, verifica TypeScript e executa a suíte. O upload inclui todos os relatórios e evidências mesmo quando testes falham, sem mascarar o status. **Pipeline remota: NÃO EXECUTADO**; arquivo configurado não é evidência de um run bem-sucedido.

## Git e publicação

Repositório público criado: [acarolinebcosta/qa-verzel-store](https://github.com/acarolinebcosta/qa-verzel-store). No último estado verificado, main e develop remotos contêm somente o commit inicial. **A suíte atual permanece local em fix/qa-final; não há PR, tag ou proteção concluída.** [GitHub Actions](https://github.com/acarolinebcosta/qa-verzel-store/actions) ainda não executou esta suíte.

O histórico original foi preservado. O plano autorizado de sete branches temáticas (chore/setup, docs/cenarios, feature/services, test/e2e, test/api, ci/reporter, docs/final) está preparado localmente, seguido das correções em fix/qa-final. PRs devem integrar develop antes de promover a release para main. A proteção de main e a tag v1.0.0 são pendências, sem alegação de terem sido criadas.

Publicação está BLOQUEADA pela ausência de integração com escrita e pelas permissões pendentes do navegador/extensão; a proteção também aguarda confirmação de identidade GitHub. Revisão humana: NÃO EXECUTADO. Os bugs precisam de correção no produto e reteste. [Estado completo da entrega](docs/05-revisao-final.md).

Codex apoiou planejamento, implementação, execução e documentação; as sessões são identificadas por executor e evidências. [Uso de IA](docs/04-uso-de-ia.md).
