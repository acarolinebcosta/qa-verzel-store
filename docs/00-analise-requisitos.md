# Análise de requisitos e hipóteses — VZS-142

Referência: [documentação oficial da Verzel Store](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao), versão **2.3.0**, publicada em **30/09/2026**, e prompt consolidado da revisão. Análise preparada em **08/10/2026**.

Este documento separa regras explícitas de interpretações e hipóteses. As hipóteses abaixo têm observações reais da rodada consolidada, separando API, automação de interface e exploração manual por agente. Observar o comportamento não o transforma em requisito oficial. Resultados anteriores permanecem identificados por data.

## Requisitos confirmados

| Critério | Regra e interpretação |
| --- | --- |
| CA01 / CA09 | `BEMVINDO10` concede 10% sobre o subtotal dos produtos. O desconto não inclui o frete. Um teste de CA09 precisa de cupom válido e frete maior que zero. |
| CA02 | Maiúsculas/minúsculas e espaços nas extremidades do código não alteram sua validade. Espaços internos não fazem parte da normalização documentada; `"  BeMvInDo10  "` é um dado adequado, `"bemvindo 10"` não é equivalente ao código válido. |
| CA03 / CA04 | Cupom inexistente exibe `"Cupom inválido."`; cupom expirado exibe `"Cupom expirado."`. Em ambos os casos, não há desconto. `VERAO2026` está expirado desde 31/03/2026. |
| CA05 | Há apenas um cupom aplicado por vez. Para trocar, é necessário remover o atual. A documentação define a regra, mas não fixa o mecanismo visual usado para impedi-la. |
| CA06 / CA07 | Subtotal igual ou superior a R$ 200,00 dá frete grátis. Abaixo disso, o frete é R$ 19,90 e o faltante é `max(200 - subtotal, 0)`. |
| CA08 | A elegibilidade do frete considera o subtotal anterior ao desconto, mesmo quando o valor dos produtos depois do desconto fica abaixo de R$ 200,00. |
| CA10 | Cada produto aceita no máximo cinco unidades na UI e na API. A quantidade enviada à API deve ser inteira e maior ou igual a um. |
| CA11 | Valores monetários têm precisão de centavos. Na API, são números; na UI, têm apresentação brasileira com duas casas decimais. |

Não existe valor mínimo para o desconto do cupom nem cupom exclusivo de frete grátis. O limite de R$ 200,00 pertence ao frete. A fórmula esperada é `total = subtotal - desconto + frete`.

## Contrato HTTP por endpoint

| Entrada / condição | `/api/carrinho/calcular` | `/api/pedidos` |
| --- | --- | --- |
| Itens e dados válidos, sem cupom ou com cupom válido | 200 com resumo | 201 com resumo e número fictício `VZ-000000` |
| Cupom inexistente, demais entradas válidas | 200, sem desconto e motivo em `cupom.mensagem` | 422 `CUPOM_INVALIDO` |
| Cupom expirado, demais entradas válidas | 200, sem desconto e motivo em `cupom.mensagem` | 422 `CUPOM_EXPIRADO` |
| Itens ausentes ou vazios | 422 `ITENS_OBRIGATORIOS` | Mesmo erro estrutural documentado |
| Item inválido, produto inexistente ou duplicado | 422 com `ITEM_INVALIDO`, `PRODUTO_NAO_ENCONTRADO` ou `ITEM_DUPLICADO` | Mesmo erro estrutural documentado |
| Quantidade inválida ou acima de cinco | 422 `QUANTIDADE_INVALIDA` ou `QUANTIDADE_MAXIMA_EXCEDIDA` | Mesmo erro estrutural documentado |
| Dados de cliente inválidos | Não recebe cliente para calcular | 422 `DADOS_INVALIDOS`, com detalhes em `campos` |
| JSON malformado | 400 `JSON_INVALIDO` | Erro `JSON_INVALIDO` conforme o contrato geral de erros |

Portanto, o cálculo **não retorna sempre 200**. A resposta 200 para cupom recusado pressupõe itens e corpo válidos. O contrato de sucesso e o contrato de erro devem ser validados separadamente.

## Correções de interpretação do prompt

### CA08: escolher um caso que distingue a ordem

O racional do prompt afirma que R$ 199,90 com cupom detectaria a inversão da ordem do cálculo. Isso não ocorre: o subtotal de R$ 199,90 e o valor de R$ 179,91 depois do desconto são ambos inferiores a R$ 200,00. As duas ordens cobrariam frete. Esse caso continua útil para verificar o lado cobrado e os valores, mas não demonstra sozinho CA08.

| Dados | Resultado esperado | O que o caso distingue |
| --- | --- | --- |
| Subtotal 199,90, desconto 19,99 | Frete 19,90; total 199,81 | Lado abaixo do limiar; não diferencia usar subtotal antes ou depois do desconto |
| Subtotal 200,00, sem cupom | Frete 0,00; total 200,00 | Inclusão do valor exato de R$ 200,00 em CA06, sem interferência de desconto |
| Subtotal 209,40, desconto 20,94 | Valor dos produtos após desconto 188,46; frete 0,00; total 188,46 | CA08: o subtotal antes do desconto é elegível, mas o valor após desconto não é |

O terceiro carrinho usa P001×1 + P006×5. Caso o frete fosse decidido sobre R$ 188,46, seriam cobrados R$ 19,90 e o total seria R$ 208,36. Já o carrinho de R$ 200,00 com cupom verifica conjuntamente CA06 e CA08; uma falha nele não permite atribuir a causa à ordem sem os casos de controle.

A cobrança exatamente em R$ 200,00 deve ser descrita como violação da regra inclusiva, sem afirmar uma comparação específica no código. Um resultado correto em 209,40 → 188,46 restringe a conclusão: não sustenta uma falha geral de cálculo do frete após o desconto.

### CA09: manter frete maior que zero

P005×1 + P008×1 produz subtotal de R$ 150,00. Com `BEMVINDO10`, são esperados desconto de R$ 15,00, frete de R$ 19,90 e total de R$ 154,90. Aplicar 10% indevidamente sobre produtos mais frete produziria desconto de R$ 16,99 e total de R$ 152,91. Com frete zero, essa implementação incorreta coincidiria com a correta e não seria detectada.

### Regras explícitas versus mecanismo da interface

A seção de ambiguidades do prompt também menciona a mensagem do cupom expirado e a tentativa de um segundo cupom. A própria lista de critérios, assim como a documentação oficial, já define `"Cupom expirado."` e a remoção antes da troca. Esses dois requisitos não são indefinidos.

O que permanece em investigação é o mecanismo concreto: ocultar o campo, desabilitar um controle ou rejeitar uma tentativa são maneiras de preservar um único cupom. A observação de uma dessas maneiras não a transforma em requisito exclusivo para futuras versões.

## Hipóteses e observações reais

As sondagens de API ocorreram em **08/10/2026, 04:01:47–04:01:48**, America/Sao_Paulo, e estão em [requisições/respostas](evidencias/consolidada-2026-10-08/sondagens-api.json). A suíte consolidada ocorreu às 04:03:09–04:03:35. “EXECUTADO — observado” fecha a investigação desta versão, sem aprovar um requisito inexistente.

| ID | Hipótese / entrada | Interpretação e resultado observado | Status | Evidência |
| --- | --- | --- | --- | --- |
| HIP-001 | Cupom vazio, somente espaços ou null | API: vazio/null → 200, cupom null, desconto 0 e total 119,90; espaços → 200, código vazio, aplicado false e “Cupom inválido.”. UI com espaços → “Informe um cupom.”, desconto 0 e total 119,90. Não equiparar feedback API/UI nem exigir mensagem de CA03 para código vazio. | EXECUTADO — observado; CT-HIP-001 PASSOU como caracterização UI | [API](evidencias/consolidada-2026-10-08/sondagens-api.json), [UI](evidencias/consolidada-2026-10-08/execucao.md#ct-hip-001) |
| HIP-002 | produtoId minúsculo, literal p005 | API → 422 PRODUTO_NAO_ENCONTRADO em itens[0].produtoId. A normalização documentada de CA02 vale para cupom; não é estendida ao ID. | EXECUTADO — observado, sem bug presumido | [API](evidencias/consolidada-2026-10-08/sondagens-api.json) |
| HIP-003 | CEP com espaço interno, literal 01310 100 | API → 422 DADOS_INVALIDOS em cliente.cep. A regra garante oito dígitos com/sem hífen e a ajuda da UI descreve somente números ou 00000-000; espaço interno fica fora desses formatos. Essa interpretação foi explicitada antes de executar CT-CLI-005. | EXECUTADO — CT-CLI-005 PASSOU | [API](evidencias/consolidada-2026-10-08/sondagens-api.json), [teste](evidencias/consolidada-2026-10-08/execucao.md#ct-cli-005) |
| HIP-004 | Esvaziar carrinho descarta cupom | Automação BDD esvaziou e readicionou P005: campo de cupom disponível, desconto 0 e total 119,90. É comportamento observado, não requisito próprio CA05. Se mudar, investigar a hipótese antes de reportar bug. | EXECUTADO — CT-HIP-002 PASSOU como caracterização | [BDD](evidencias/consolidada-2026-10-08/execucao.md#ct-hip-002) |
| HIP-005 | Mecanismo visual de impedir segundo cupom | A regra de CA05 é explícita; o controle visual é implementação. A exploração por agente às 03:35 observou campo e botão Aplicar ausentes, só Remover disponível. BDD consolidado confirmou a indisponibilidade e que remover permite tentar VERAO2026. | EXECUTADO — observado; CT-CA05-101 PASSOU | [Sessão manual](evidencias/exploracao-manual-2026-10-08.md), [BDD](evidencias/consolidada-2026-10-08/execucao.md#ct-ca05-101) |

Não se inferiu uma sessão persistente de cupons na API. Duas chamadas independentes com cupom não acumulam desconto entre si; uma string concatenada é um único código inexistente. A necessidade de remover o cupom ativo é verificada na UI.

## Divergência confirmada do contrato estrutural

A tabela pública de erros descreve ITEM_INVALIDO para item que não é objeto com produtoId e quantidade. O consolidado também especifica explicitamente esse código para cada propriedade ausente. Portanto, manter 422 ITEM_INVALIDO nesses testes é uma expectativa documentada, não hipótese.

CT-API-005 recebeu 422 PRODUTO_NAO_ENCONTRADO para item sem produtoId; CT-API-006 recebeu 422 QUANTIDADE_INVALIDA para item sem quantidade. O status HTTP está correto, mas o código está divergente. As sondagens e duas tentativas automatizadas por caso reproduziram o resultado. A ocorrência está consolidada em [BUG-003](03-bugs.md#bug-003--códigos-incorretos-para-propriedades-obrigatórias-ausentes), sem atribuir causa ao código do servidor.

## Validação monetária

O contrato Zod pode verificar que valores numéricos finitos representam centavos, permitindo o resíduo de ponto flutuante binário dessa verificação. As comparações `toBeCloseTo(valorEsperado, 2)` avaliam o cálculo esperado com tolerância. As duas verificações são compatíveis: a validação de precisão rejeita valores que não correspondem a centavos; a comparação numérica evita falhas por representação binária.

Não se exige texto específico no JSON: `100`, `100.0` e `100.00` representam o mesmo número. Na interface, a apresentação deve ser verificada separadamente, como `R$ 215,73`, com prefixo, vírgula e duas casas decimais.

## Escopo e classificação de resultados

Login, cadastro, pagamento online, consulta de pedidos, estoque, envio de e-mail, cobrança e persistência não são entregas ausentes a reportar. Carrinho por aba, API sem estado e pedido fictício são simplificações oficiais. Carga, estresse e segurança permanecem fora do escopo.

Resultados devem distinguir **PASSOU**, **FALHOU — produto**, **FALHOU — automação**, **BLOQUEADO — ambiente** e **NÃO EXECUTADO**, com justificativa e evidência. Uma hipótese divergente não é automaticamente falha de produto. O histórico dos bugs confirmados fica em [docs/03-bugs.md](03-bugs.md); os resultados e a rastreabilidade da nova rodada estão consolidados em [docs/02-execucao-testes.md](02-execucao-testes.md) e [docs/01-cenarios-teste.md](01-cenarios-teste.md).
