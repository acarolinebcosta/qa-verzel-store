# Registro de bugs

Fonte de comportamento esperado: [documentação VZS-142, versão 2.3.0](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao), publicada em 30/09/2026.

Somente defeitos reproduzidos contra os critérios oficiais são registrados. As falhas financeiras e de quantidade abaixo são do produto; não há falha de automação ou indisponibilidade na rodada final de 08/10.

## Bugs constatados

### BUG-001 — Frete cobrado exatamente no subtotal de R$  200,00

| Campo | Registro |
| --- | --- |
| ID | BUG-001 |
| Título | Subtotal de R$  200,00 resulta em cobrança indevida de frete, com e sem cupom |
| Severidade | Alta — aumenta o total da compra em R$  19,90 contra a regra da promoção |
| Prioridade | P0 — impacto financeiro na regra central; quebra o limite inclusivo de CA06 na entrega principal de cupom e frete |
| Ambiente | Loja pública, VZS-142/documentação 2.3.0; Chrome no macOS, versão não coletada; sessão inicial antes de 19 h 20 em 07/10/2026, America/Sao_Paulo |
| Pré-condições | P005×2, subtotal de R$  200,00; testar com BEMVINDO10 e sem cupom |
| Cenário associado | CT-CA06-001,CT-CA06-201,CT-CA08-201,CT-CA04-202,CT-CA08-203 |
| Status | Aberto — reproduzido na interface e na API |

**Passos para reproduzir**

1. Adicionar duas unidades de Mochila Urbana 20 L (P005) ao carrinho.
2. Sem cupom, observar subtotal, frete e total.
3. Aplicar `BEMVINDO10` e observar novamente subtotal, desconto, frete e total.
4. Alternativamente, enviar `POST /api/carrinho/calcular` com `{"itens":[{"produtoId":"P005","quantidade":2}]}`; repetir incluindo `"cupom":"BEMVINDO10"`.

**Resultado esperado:** frete de R$  0,00 e `freteGratis: true` nos dois casos. Sem cupom, total de R$  200,00; com cupom, desconto de R$  20,00 e total de R$  180,00. CA06 inclui exatamente R$  200,00; CA08 preserva a referência ao subtotal antes do desconto.

**Resultado atual:** frete de R$  19,90 e `freteGratis: false`. Sem cupom, total de R$  219,90; com cupom, desconto de R$  20,00 e total de R$  199,90. A interface informa que faltam R$  0,00 para frete grátis enquanto cobra frete.

**Evidência:** [exploração real da interface, etapas 6–7](evidencias/exploracao-manual-2026-10-07.md), screenshots [com cupom](evidencias/bug-001-com-cupom.png) e [sem cupom](evidencias/bug-001-sem-cupom.png), [sondagem API](evidencias/api-bugs-2026-10-07.json), [trace de API](evidencias/bug-001-trace.zip) e [execução auditada](evidencias/execucao-2026-10-07.md).

**Limite da conclusão:** a sondagem com subtotal de R$  209,40, cupom aplicado e total de R$  188,46 retornou corretamente frete grátis. Portanto, os resultados não sustentam a hipótese de que o frete usa o total após desconto. A falha constatada é o limite inclusivo de R$  200,00; a causa no código não foi investigada.

### BUG-002 — API aceita seis unidades do mesmo produto

| Campo | Registro |
| --- | --- |
| ID | BUG-002 |
| Título | Cálculo e confirmação aceitam quantidade 6, acima do máximo de 5 |
| Severidade | Média — viola a integridade da regra de quantidade e cria pedido fictício fora do limite |
| Prioridade | P1 — CA10 exige o mesmo limite na interface e na API |
| Ambiente | API pública, VZS-142/documentação 2.3.0; sondagem em 07/10/2026 às 19 h 21, America/Sao_Paulo |
| Pré-condições | Requisição com P001×6; dados de cliente fictícios válidos para confirmação |
| Cenário associado | CT-CA10-206 eCT-CA10-220 |
| Status | Aberto — reproduzido nos dois endpoints de API |

**Passos para reproduzir**

1. Enviar `POST /api/carrinho/calcular` com o corpo `{"itens":[{"produtoId":"P001","quantidade":6}]}`.
2. Observar status e quantidade na resposta.
3. Enviar `POST /api/pedidos` com os mesmos itens e `cliente` contendo nome e sobrenome, e-mail válido e CEP de oito dígitos.
4. Observar status e confirmação fictícia do pedido.

**Resultado esperado:** HTTP 422 nos dois endpoints, com `erro.codigo: "QUANTIDADE_MAXIMA_EXCEDIDA"`, sem confirmação de pedido. CA10 estabelece máximo de cinco unidades por produto tanto na interface quanto na API.

**Resultado atual:** cálculo retorna HTTP 200, quantidade 6 e subtotal/total de R$  359,40. A confirmação retorna HTTP 201 com número fictício `VZ-559803` na sondagem registrada, quantidade 6 e total de R$  359,40.

**Evidência:** [requisições/respostas reais da sondagem API](evidencias/api-bugs-2026-10-07.json), [trace de API](evidencias/bug-002-trace.zip) e [execução auditada](evidencias/execucao-2026-10-07.md). O número de pedido varia por execução e não permite consulta posterior, conforme a simplificação documentada.

Esses comportamentos não são simplificações previstas na documentação. A interface bloqueou a sexta unidade durante a exploração; BUG-002 registra a inconsistência na API, sem alegar falha desse bloqueio na interface.

## Comportamentos que não devem ser reportados

A seção “Sobre este ambiente” define como esperados: carrinho limitado à aba, pedidos sem persistência, número fictício, ausência de e-mail/cobrança/estoque e API sem estado. Login, cadastro, pagamento online e consulta de pedidos estão fora do escopo. Também não é defeito um cupom válido funcionar abaixo de R$  200,00, nem o frete continuar grátis quando o desconto reduz o total para menos de R$  200,00: o limiar usa o subtotal antes do desconto.

## Reteste de 08/10/2026

BUG-001 permanece aberto: frete 19,90 na fronteira 200, inclusive com cupom expirado no cálculo. BUG-002 permanece aberto: cálculo 200 e pedido 201 aceitam 6 unidades. [Sondagens completas](evidencias/api-2026-10-08.json),[resultado58testes](evidencias/execucao-2026-10-08.md),[sessão deinterface](evidencias/exploracao-manual-2026-10-08.md). Ambas as tentativas automatizadas de cada falha reproduziram o resultado. Nenhum novo bug foi criado.
