# Execução de testes

Ambiente: [Verzel Store](https://verzel-store.qa-test-verzel-store.workers.dev/). Referência: documentação 2.3.0, VZS-142, publicada em 30/09/2026. Data de preparação do roteiro: 07/10/2026, fuso America/Sao_Paulo.

Os resultados preenchidos abaixo correspondem à exploração real da interface conduzida pelo agente Codex em 07/10/2026. Cenários sem observação suficiente continuam **Pendentes**; nenhum resultado fictício é apresentado como execução. Execuções automáticas ficam também no relatório gerado `docs/execucao-automatica.md` e no HTML do Playwright.

| ID | Cenário | Tipo (Manual/Exploratório/API) | Resultado | Evidência | Bug |
| --- | --- | --- | --- | --- | --- |
| CT01 | Cupom válido em subtotal de R$ 100,00 | Manual | Passou | [Transcrição, etapa 4](evidencias/exploracao-manual-2026-10-07.md) e [cupom válido](evidencias/cupom-valido.png) | — |
| CT02 | Cupom inexistente | Manual | Passou | [Transcrição, etapa 2](evidencias/exploracao-manual-2026-10-07.md) | — |
| CT03 | Cupom expirado | Manual | Passou | [Transcrição, etapa 3](evidencias/exploracao-manual-2026-10-07.md) | — |
| CT04 | Cupom válido abaixo do mínimo de frete | Manual | Passou | [Transcrição, etapa 4](evidencias/exploracao-manual-2026-10-07.md) | — |
| CT05 | Remover cupom aplicado | Manual | Falhou — remoção correta, frete indevido em 200,00 | [Transcrição, etapa 7](evidencias/exploracao-manual-2026-10-07.md) | [BUG-001](03-bugs.md#bug-001--frete-cobrado-exatamente-no-subtotal-de-r-20000) |
| CT06 | Frete grátis com cupom e subtotal de R$ 200,00 | Manual | Falhou | [Transcrição, etapa 6](evidencias/exploracao-manual-2026-10-07.md) | [BUG-001](03-bugs.md#bug-001--frete-cobrado-exatamente-no-subtotal-de-r-20000) |
| CT07 | Frete sem cupom: R$ 199,90 / R$ 200,00 / R$ 209,40 | API | Falhou em 200,00; 199,90 e 209,40 passaram | [Relatório automático](evidencias/execucao-2026-10-07.md) e [sondagem API](evidencias/api-bugs-2026-10-07.json) | BUG-001 |
| CT08 | Impedir aplicação de segundo cupom | Manual | Passou — controle bloqueia segunda aplicação | [Transcrição, etapa 5](evidencias/exploracao-manual-2026-10-07.md) | — |
| CT09 | Normalização de minúsculas e espaços nas extremidades | Manual | Passou — demais variantes aguardam execução | [Transcrição, etapa 4](evidencias/exploracao-manual-2026-10-07.md) | — |
| CT10 | Recalcular desconto após aumentar quantidade | Manual | Passou — desconto de 10,00 para 20,00 | [Transcrição, etapa 6](evidencias/exploracao-manual-2026-10-07.md) | Frete avaliado separadamente em BUG-001 |
| CT11 | Desconto apenas no subtotal dos produtos | API | Passou | [Relatório automático](evidencias/execucao-2026-10-07.md) | — |
| CT12 | Precisão de subtotal, desconto e total | API | Passou | [Relatório automático](evidencias/execucao-2026-10-07.md) | — |
| CT13 | Frete com cupom nas três fronteiras realizáveis | API | Falhou em 200,00; 199,90 e 209,40 passaram | [Relatório automático](evidencias/execucao-2026-10-07.md) e [sondagem API](evidencias/api-bugs-2026-10-07.json) | BUG-001 |
| CT14 | Reavaliar frete após reduzir quantidade | Manual | Passou | [Transcrição, etapa 10](evidencias/exploracao-manual-2026-10-07.md) | — |
| CT15 | Aceitar cinco unidades e impedir a sexta na UI | Manual | Passou | [Transcrição, etapa 9](evidencias/exploracao-manual-2026-10-07.md) | — |
| CT16 | Rejeitar seis unidades pela API de cálculo e pedido | API | Falhou — HTTP 200/201 em vez de 422 | [Sondagem API](evidencias/api-bugs-2026-10-07.json) | BUG-002 |
| CT17 | Itens ausentes, duplicados e quantidades inválidas | API | Passou nos dados automatizados; variação sem produtoId pendente | [Relatório automático](evidencias/execucao-2026-10-07.md) | — |
| CT18 | Cálculo com cupom recusado retorna HTTP 200 | API | Passou | [Relatório automático](evidencias/execucao-2026-10-07.md) | — |
| CT19 | Pedido de R$ 200,00 com cupom: HTTP 201 e totais | API | Falhou — confirmação aceita, mas frete/total incorretos | [Relatório automático](evidencias/execucao-2026-10-07.md) | BUG-001 |
| CT20 | Pedido com cupom inválido/expirado retorna HTTP 422 | API | Passou | [Relatório automático](evidencias/execucao-2026-10-07.md) | — |
| CT21 | Pedido com dados de cliente inválidos | API | Passou | [Relatório automático](evidencias/execucao-2026-10-07.md) | — |
| CT22 | Confirmação de compra na interface | Manual | Passou — subtotal 100,00, total 109,90 | [Transcrição, etapas 12–14](evidencias/exploracao-manual-2026-10-07.md) | — |
| CT23 | Isolamento do carrinho em outra aba | Exploratório | Passou | [Transcrição, etapa 11](evidencias/exploracao-manual-2026-10-07.md) | — |
| CT24 | Auditoria de acessibilidade crítica no carrinho | Exploratório (axe automatizado) | Passou — zero violações críticas | [Relatório automático](evidencias/execucao-2026-10-07.md) e [JSON axe](evidencias/axe-carrinho.json) | — |
| CT25 | Remover produto e reavaliar frete | Manual | Pendente manual; variação automatizada passou | [Relatório automático](evidencias/execucao-2026-10-07.md) | — |
| EXP01 | Sessão do charter de cupom e frete | Exploratório | Executada; missões primárias concluídas e defeito de frete reproduzido | [Transcrição da sessão](evidencias/exploracao-manual-2026-10-07.md) | BUG-001 |

## Como preencher após executar

1. Registre data/hora em America/Sao_Paulo, executor, navegador/versão, sistema e versão da documentação. Para testes automáticos, registre também Node.js, versão do Playwright e comando utilizado.
2. Execute os passos do cenário com os produtos e cupons reais. Compare subtotal, desconto, frete, faltante e total; uma mensagem de sucesso isolada não valida o cálculo.
3. Use **Passou**, **Falhou**, **Bloqueado** ou **Pendente**. Uma execução de API não prova, por si só, o resultado manual da interface. Exploração conduzida por agente deve identificar o agente executor.
4. Salve a evidência em `docs/evidencias/`, com nome como `CT01-cupom-valido.png` ou `CT20-pedido-expirado.json`. Para API, capture método, caminho, corpo, status e resposta com dados de cliente fictícios.
5. Substitua `—` por um link relativo para a evidência existente. Em falhas confirmadas, associe um ID de `docs/03-bugs.md`. Dúvidas de requisito ou simplificações documentadas não devem virar bugs.
6. Se um comportamento mudar, preserve o histórico por execução em vez de apagar o resultado anterior. Reexecução deve referenciar o mesmo bug e identificar o commit ou versão avaliada.

## Resumo de execução

| Campo | Registro |
| --- | --- |
| Início e fim reais | Sessão inicial em 07/10/2026 antes de 19h20 e complemento por volta de 19h26, America/Sao_Paulo; início exato não coletado |
| Executor | Agente Codex executor principal, operando a interface por CUA |
| Navegador e sistema | Chrome no ambiente desktop macOS; versão não coletada |
| Comandos e versões | `npm test`; Node.js 26.6.0, Playwright 1.64.0, TypeScript 5.9.3, Chromium 156.0.8078.4; `npm run typecheck` aprovado |
| Resultado da suíte automática | Execução auditada: 77 testes, 68 aprovados, 9 falhas, 0 instáveis e 0 ignorados |
| Resultado da exploração | Missões primárias concluídas; cupons, normalização, quantidade, frete, isolamento e confirmação verificados |
| Bugs confirmados | BUG-001 — limite inclusivo de frete (UI/API); BUG-002 — quantidade acima de cinco (API) |
| Revisão humana | Pendente |

A geração dos arquivos e a escrita dos cenários não contam como execução. Um teste que falha por indisponibilidade ou dependência do ambiente deve ser identificado como bloqueado, com o motivo. O exemplo de bug em `docs/03-bugs.md` não deve ser associado a nenhuma linha desta tabela.

## Execução automatizada auditada

Executada com `npm test` em 07/10/2026, de **19h22min59s a 19h24min02s**, America/Sao_Paulo, conforme timestamps do reporter. Node.js 26.6.0, Playwright 1.64.0, Chromium 156.0.8078.4 e macOS arm64; duração de 63,51 segundos. A verificação TypeScript (`npm run typecheck`) passou com TypeScript 5.9.3. Resultado global dos testes: **falha**, com 77 testes e 9 falhas inesperadas relacionadas a dois bugs do ambiente.

| Camada | Total | Aprovados | Falhas |
| --- | ---: | ---: | ---: |
| API | 41 | 36 | 5 |
| Interface E2E | 18 | 16 | 2 |
| BDD em Chromium | 18 | 16 | 2 |
| Total | 77 | 68 | 9 |

Evidências auditadas: [relatório completo com 77 resultados](evidencias/execucao-2026-10-07.md), [JSON original](evidencias/resultados-2026-10-07.json), [log](evidencias/execucao-2026-10-07.log), [axe](evidencias/axe-carrinho.json) e [manifesto SHA-256](evidencias/manifesto-sha256.json). Os anexos negativos de cupom estão comprovados no JSON e na transcrição; não foram exportados screenshots próprios para cupom inválido/expirado.

Não houve teste ignorado nem resultado instável. As falhas de frete ocorrem no cálculo, confirmação e interface/BDD; a falha de quantidade ocorre nos endpoints de cálculo e pedido. Os cenários usam expectativas da documentação e não convertem esses defeitos em falhas esperadas.

A primeira execução completa, de 19h20min23s a 19h21min30s, teve a mesma distribuição de resultados; a execução auditada confirmou os defeitos após ajustes de rastreabilidade dos bugs e compatibilidade TypeScript/ts-node. CT25 permanece pendente na exploração manual, com variação automatizada aprovada. A auditoria axe passou no critério de violações **críticas**; outras verificações e avaliação humana não são inferidas desse resultado.
