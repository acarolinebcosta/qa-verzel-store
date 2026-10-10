# Charter exploratório — cupom e frete

**Missão:** explorar a interação entre cupom, quantidade e limiar de frete para descobrir inconsistências de cálculo, mensagens ou atualização da interface, sempre comparando com os critérios VZS-142 da documentação 2.3.0.

**Tempo planejado:** 45 minutos. **Tempo real e executor:** sessão conduzida pelo agente Codex em 07/10/2026, iniciada antes de 19h20 e complementada por volta de 19h26; duração exata não coletada. **Ambiente:** [Verzel Store](https://verzel-store.qa-test-verzel-store.workers.dev/), com dados fixos e isolados por aba. **Escopo:** carrinho, cupom, checkout e confirmação fictícia; sem carga, estresse ou testes de segurança.

## Preparação

- Iniciar um contexto de navegador limpo e registrar navegador, versão, sistema, início e fuso America/Sao_Paulo.
- Ler os critérios CA01–CA11 e “Sobre este ambiente”. Usar `BEMVINDO10`, `VERAO2026` e um código inexistente.
- Separar combinações de R$ 100,00, R$ 199,90, R$ 200,00 e R$ 209,40. Não inventar preços nem usar quantidade acima de cinco para criar fronteiras.
- Preparar capturas de tela, console/rede e anotações de requisição/resposta. Usar somente dados de cliente fictícios.

## Áreas e heurísticas

| Área | Explorações propostas | Oráculo |
| --- | --- | --- |
| Fronteiras | Ir de P005×1 para P005×2 e voltar; usar 199,90 e o primeiro subtotal realizável acima de 200 | Frete fixo abaixo de 200; grátis a partir de 200; faltante nunca negativo |
| Estado do cupom | Aplicar, remover, reaplicar, mudar quantidade, remover todos os itens e reconstruir carrinho | Um cupom por vez; desconto corresponde ao subtotal atual |
| Normalização | Maiúsculas/minúsculas, espaços no início/fim, código inexistente e expirado | CA02–CA04 e mensagens documentadas |
| Combinação de regras | Aplicar desconto no subtotal de 200,00 e reduzir total a 180,00; cupom abaixo do limiar | Frete usa subtotal antes do desconto; desconto não incide sobre frete |
| Quantidade | Chegar a cinco via vitrine e via carrinho; tentar adicionar a sexta pelo controle normal | Limite de cinco por produto em UI/API |
| Precisão | Produtos com centavos, vários itens, comparação entre carrinho e confirmação | Duas casas decimais e `subtotal - desconto + frete` |
| Mensagens e foco | Usar teclado, observar foco após aplicar/remover, erros e alteração de totais | Controles identificáveis; feedback compreensível e valores atualizados |
| Checkout | Dados de cliente válidos, nome sem sobrenome, e-mail inválido, CEP com/sem hífen | Validações documentadas e confirmação sem cobrança |
| Isolamento | Comparar aba atual com aba independente/contexto novo | Novo carrinho vazio é simplificação esperada |

Distribuição sugerida: 5 minutos de preparação, 25 de exploração principal, 10 de checkout/acessibilidade e 5 de consolidação. Ajustar se surgir um defeito reproduzível e registrar a alteração do plano.

## Perguntas de investigação

- O desconto continua correto ao atravessar o limiar de frete nos dois sentidos?
- O valor faltante diminui com produtos adicionados e volta ao remover itens?
- Um erro de cupom deixa desconto residual ou mensagem de sucesso antiga?
- A remoção do cupom muda somente o desconto e mantém a elegibilidade baseada no subtotal?
- O resumo da confirmação usa os mesmos valores do carrinho?
- Teclado e feedback de erro permitem completar o fluxo sem adivinhar qual controle mudou?

Essas perguntas são hipóteses de exploração, não relatos de bugs. A afirmação promocional “primeira compra” não introduz uma regra de elegibilidade por histórico: a documentação não define histórico persistente nem autenticação.

## Registro da sessão

| Campo | Resultado |
| --- | --- |
| Data, início/fim e duração real | 07/10/2026, sessão inicial antes de 19h20 e complemento por volta de 19h26, America/Sao_Paulo; duração e início exatos não coletados |
| Executor e ferramentas | Agente Codex executor principal, controle de interface por CUA |
| Navegador/sistema | Chrome em macOS; versão não coletada |
| Combinações e caminhos explorados | P005 com 1, 2, 3 e 5 unidades; cupom inexistente, VERAO2026 e ` bemvindo10 `; remover/reaplicar cupom; diminuir quantidade; outra aba; checkout com dados fictícios |
| Comportamentos confirmados | Mensagens negativas, normalização, desconto de 10%, recálculo do desconto/frete, bloqueio de segundo cupom, limite de cinco unidades na UI, isolamento entre abas e confirmação do pedido de R$ 109,90 |
| Evidências existentes | [Transcrição da sessão](../evidencias/exploracao-manual-2026-10-07.md) |
| Bugs reproduzidos e IDs | BUG-001 — frete indevido exatamente em subtotal 200, com e sem cupom; sondagens separadas de API identificaram BUG-002 — quantidade acima do máximo |
| Dúvidas ou áreas não cobertas | Remoção integral de produto e variantes adicionais de normalização não foram observadas manualmente; remoção e auditoria axe foram verificadas na automação. Fronteiras 199,90/209,40 foram verificadas pela API |
| Próxima ação | Revisão humana da entrega; corrigir BUG-001/BUG-002 no produto e reexecutar os cenários associados |

Ao concluir, atualizar EXP01 e os cenários correspondentes em `docs/02-execucao-testes.md`; inserir somente defeitos reais em `docs/03-bugs.md`. O número fictício de pedido, a ausência de e-mail/estoque/cobrança e a falta de consulta posterior não são bugs.
