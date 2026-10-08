# QA Verzel Store

Suíte de testes da entrega **VZS-142 — Cupom de desconto e frete grátis**, baseada na documentação da Verzel Store **2.3.0**, publicada em **30/09/2026**. Reúne cenários em português, testes de API e interface com Playwright, BDD executável, exploração documentada e relatórios de execução.

- [Loja](https://verzel-store.qa-test-verzel-store.workers.dev/)
- [Documentação e critérios de aceite](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao)
- [API — catálogo](https://verzel-store.qa-test-verzel-store.workers.dev/api/produtos)

## Entregas

| Entrega | Local |
| --- | --- |
| Cenários em Gherkin e dados concretos | [docs/01-cenarios-teste.md](docs/01-cenarios-teste.md) |
| Registro de execução manual, exploratória e API | [docs/02-execucao-testes.md](docs/02-execucao-testes.md) |
| Bugs e exemplo ilustrativo | [docs/03-bugs.md](docs/03-bugs.md) |
| Evidências | [docs/evidencias/](docs/evidencias/) |
| Execução automatizada auditada | [Relatório de 07/10/2026](docs/evidencias/execucao-2026-10-07.md) |
| Charter exploratório | [docs/exploratorio/charter-cupom-frete.md](docs/exploratorio/charter-cupom-frete.md) |
| Automação TypeScript | [automation/](automation/) |
| Integração contínua | [.github/workflows/playwright.yml](.github/workflows/playwright.yml) |

O registro de execução identifica o que foi efetivamente verificado. Cenários ainda não executados ficam como **Pendente**. O exemplo em bugs é explicitamente ilustrativo e não representa um defeito encontrado.

A execução auditada em **07/10/2026** teve **77 testes: 68 aprovados e 9 falhas**, sem testes ignorados ou instáveis. As falhas reproduzem dois defeitos: cobrança de frete exatamente no subtotal de R$ 200,00 e aceitação de seis unidades por produto na API. A verificação TypeScript e a auditoria automática de acessibilidade crítica do carrinho passaram. A suíte mantém os valores esperados da documentação e, enquanto os defeitos persistirem no ambiente, termina com falha.

## Como rodar a automação

Requisitos: Node.js 20 ou superior, npm e acesso ao ambiente público.

```bash
cd automation
npm install
npx playwright install
cp .env.example .env
npm test
```

Em Linux/CI, instale também as dependências do navegador com `npx playwright install --with-deps chromium`. O arquivo `.env` é local e não deve ser versionado. Confira os valores de `.env.example` antes de executar em outro ambiente.

O script `pretest` gera os testes a partir das features com `bddgen`. Os scripts `test:headed`, `test:smoke`, `test:regression` e `test:bdd` também preparam o BDD antes da execução. Os testes de API usam os endpoints documentados; os testes de interface usam Chromium e contextos isolados.

```bash
npm run test:smoke
npm run test:regression
npm run test:headed
npm run typecheck
```

Para executar uma camada isolada, use `npm run test:api`, `npm run test:e2e` ou `npm run test:bdd`.

## Relatório

Após executar os testes:

```bash
npm run report
```

O relatório HTML fica em `automation/playwright-report/`. O reporter customizado gera `docs/execucao-automatica.md`, com o resultado real de cada teste. O arquivo é regenerado em cada execução e ignorado pelo Git. Screenshots, vídeos e traces de falhas ficam em `automation/test-results/`; a configuração captura screenshot apenas na falha, mantém vídeo de falhas e trace na primeira repetição.

O workflow publica os relatórios e evidências como artefatos do GitHub Actions mesmo quando testes falham. Falhas de comportamento continuam causando falha da suíte; defeitos conhecidos não são marcados como resultado esperado para tornar o CI verde. As evidências selecionadas para a entrega ficam em `docs/evidencias/`, com [relatório datado](docs/evidencias/execucao-2026-10-07.md), JSON, log, screenshots e traces de API. O [manifesto SHA-256](docs/evidencias/manifesto-sha256.json) permite conferir os arquivos exportados.

## Estrutura da suíte

```mermaid
flowchart LR
  Dados[Dados e factories] --> Servicos[Serviços de API]
  Servicos --> API[Testes API e contratos Zod]
  Fixtures[Fixtures de carrinho] --> BDD[Features e steps BDD]
  Fixtures --> E2E[Testes E2E e acessibilidade]
  API --> Reporter[Reporter Markdown e HTML]
  BDD --> Reporter
  E2E --> Reporter
  CI[GitHub Actions] --> API
  CI --> BDD
  CI --> E2E
```

As features em `automation/features/` são a parte executável do Gherkin. O documento de cenários amplia o roteiro para execução manual, API e exploração; nem todo cenário descrito nele implica um teste automatizado individual.

## Decisões e ambiguidades

1. **A documentação do ambiente é a fonte das regras.** Os valores sugeridos no prompt eram exemplos. Foram substituídos por `BEMVINDO10` (10%), `VERAO2026` (expirado em 31/03/2026), limiar de frete de R$ 200,00 e frete fixo de R$ 19,90.
2. **Não existe valor mínimo de cupom.** O cenário “cupom abaixo do valor mínimo” verifica que um cupom válido continua aplicando desconto abaixo do mínimo de **frete grátis**. Com subtotal de R$ 100,00, são esperados desconto de R$ 10,00, frete de R$ 19,90 e total de R$ 109,90.
3. **Não existe cupom exclusivo de frete grátis.** “Frete grátis com cupom” significa usar `BEMVINDO10` em um carrinho cujo subtotal antes do desconto seja pelo menos R$ 200,00. Com subtotal de R$ 200,00, desconto de R$ 20,00 e total de R$ 180,00, o frete permanece grátis.
4. **O cupom não incide sobre o frete.** A fórmula é `total = subtotal - desconto + frete`; todos os valores são comparados com duas casas decimais. A elegibilidade de frete usa o subtotal antes do desconto e é recalculada ao alterar o carrinho.
5. **Cupons não acumulam.** Há um único campo de cupom. A interface exige remover o cupom atual antes de uma nova aplicação; a API aceita um único código. Concatenar códigos não é um mecanismo de acumulação documentado.
6. **A API diferencia cálculo e confirmação.** `POST /api/carrinho/calcular` retorna HTTP 200 para cupom inválido ou expirado, sem desconto e com o motivo em `cupom.mensagem`. `POST /api/pedidos` rejeita esses cupons com HTTP 422 e `CUPOM_INVALIDO` ou `CUPOM_EXPIRADO`. Não há endpoint independente de autenticação, validação ou aplicação de cupom.
7. **Fronteiras usam o catálogo real.** R$ 199,90 é produzido por P005×1 + P004×1 + P008×1; R$ 200,00 por P005×2; o menor subtotal acima do limiar permitido pelo catálogo e limite de cinco unidades por produto é R$ 209,40, produzido por P006×5 + P001×1. R$ 200,01 e R$ 200,10 não são produzíveis com os dados fixos sem alterar preços ou exceder limites. Esses valores não são simulados como se o ambiente os aceitasse.
8. **Isolamento e simplificações são esperados.** O carrinho pertence à aba do navegador; outra aba/navegador/janela anônima começa vazio. API e pedidos não persistem dados entre chamadas. Número de pedido é fictício. Não há estoque, envio de e-mail ou cobrança. Login, cadastro de clientes, pagamento online e consulta de pedidos estão fora do escopo. Arquivos de autenticação exigidos na estrutura apenas documentam essa ausência; não inventam endpoints.
9. **Escopo.** A suíte cobre regras funcionais, contratos e violações críticas de acessibilidade. Não executa carga, estresse ou testes de segurança. A auditoria automática de acessibilidade não substitui uma avaliação humana completa.

## Uso de IA

Codex apoiou o planejamento, a implementação, a execução e a revisão da suíte. Os resultados têm evidências; a validação final humana permanece pendente. O processo está descrito em [docs/04-uso-de-ia.md](docs/04-uso-de-ia.md).

## Fluxo de branches e PRs

A organização adota `main` para a versão estável, com proteção contra alterações diretas, e `develop` para integrar o trabalho. Cada branch temática parte de `develop` e abre um PR para ela. Os sete PRs são integrados na ordem abaixo para respeitar as dependências entre as entregas.

| PR temático | Branch → destino | Escopo | Exemplo de commit |
| --- | --- | --- | --- |
| 1 — Estrutura | `chore/setup` → `develop` | Pastas, dependências e configuração inicial | `chore: configurar estrutura da automação` |
| 2 — Cenários | `docs/cenarios` → `develop` | Gherkin e planejamento de testes | `docs: documentar cenários de cupom e frete` |
| 3 — Serviços | `feature/services` → `develop` | Serviços de API, contratos, dados e fixtures | `feat: adicionar serviços e fixtures` |
| 4 — Interface | `test/e2e` → `develop` | Testes E2E, steps BDD e acessibilidade | `test: automatizar fluxos de interface` |
| 5 — API | `test/api` → `develop` | Testes funcionais e contratos da API | `test: validar regras e contratos da API` |
| 6 — CI e relatório | `ci/reporter` → `develop` | Reporter Markdown e GitHub Actions | `chore(ci): configurar pipeline e reporter` |
| 7 — Entrega final | `docs/final` → `develop` | README, resultados, bugs e evidências | `docs: consolidar a documentação da entrega` |

Depois da integração dos sete PRs, um PR de release promove `develop` para `main`. A tag `v1.0.0` identifica o commit publicado na `main`. A branch `ci/reporter` usa `chore(ci)` nos commits: `ci` é o escopo, e o tipo é `chore`.

A reorganização está em andamento; a criação, os merges, a proteção e a tag devem ser confirmados no GitHub. A release preserva os resultados reais da suíte e os dois bugs documentados.

## Publicação

Repositório público: [acarolinebcosta/qa-verzel-store](https://github.com/acarolinebcosta/qa-verzel-store). A entrega fica na raiz, com `docs/`, `automation/` e `.github/` no mesmo nível, e a organização por PRs está em curso. Acompanhe as execuções e baixe os relatórios em [GitHub Actions](https://github.com/acarolinebcosta/qa-verzel-store/actions). O CI falha enquanto os dois defeitos documentados permanecerem na loja.
