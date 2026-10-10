# Cenários e rastreabilidade — VZS-142

Fonte: [documentação oficial 2.3.0](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao), publicada 30/09/2026 e conferida 08/10/2026.

## Regras e dados concretos

| CA | Regra |
| --- | --- |
| CA01 | Cupom válido aplica 10% ao subtotal |
| CA02 | Normalizar caixa e espaços nas extremidades |
| CA03 | Cupom inválido sem desconto e mensagem correta |
| CA04 | Cupom expirado sem desconto e mensagem correta |
| CA05 | Somente um cupom por vez |
| CA06 | Frete grátis com subtotal ≥ 200 inclusive |
| CA07 | Frete 19,90 abaixo de 200 e faltante correto |
| CA08 | Frete usa subtotal anterior ao desconto |
| CA09 | Desconto não incide sobre frete |
| CA10 | Até cinco unidades por produto na UI/API |
| CA11 | Arredondamento de valores a duas casas decimais |

`BEMVINDO10`:10%; `VERAO2026`:15%, expirado 31/03/2026; negativo:`CUPOM_INEXISTENTE_999`. Frete fixo 19,90; mínimo de frete 200,00. Não há mínimo para cupom nem cupom exclusivo de frete. Total=subtotal−desconto+frete.

R$ 199,80 é P001×1+P002×1 e foi preservado da revisão anterior. O consolidado exige também 150,00 com cupom e 199,90 com/sem cupom. O maior subtotal alcançável abaixo de 200 é 199,90 (P005+P004+P008); o menor acima é 209,40 (P001+P006×5). Mantemos essas fronteiras na API e não simulamos 200,01/200,10.

## Matriz de decisão frete × cupom

| Subtotal | Cupom | Desconto | Frete | Total | Composição |
| ---: | --- | ---: | ---: | ---: | --- |
|100,00|Nenhum|0,00|19,90|119,90|P005×1|
|100,00|BEMVINDO10|10,00|19,90|109,90|P005×1|
|150,00|BEMVINDO10|15,00|19,90|154,90|P005+P008|
|199,80|Nenhum|0,00|19,90|219,70|P001+P002|
|199,90|Nenhum|0,00|19,90|219,80|P005+P004+P008|
|199,90|BEMVINDO10|19,99|19,90|199,81|P005+P004+P008|
|200,00|Nenhum|0,00|0,00|200,00|P005×2|
|200,00|BEMVINDO10|20,00|0,00|180,00|P005×2|
|200,00|VERAO2026|0,00|0,00|200,00|P005×2|
|209,40|BEMVINDO10|20,94|0,00|188,46|P001+P006×5|
|239,70|BEMVINDO10|23,97|0,00|215,73|P002+P004×2|

A linha expirada corresponde ao cálculo HTTP 200 com mensagem “Cupom expirado.”. `/api/pedidos` rejeita o mesmo cupom com 422 `CUPOM_EXPIRADO`. Cálculo não é sempre 200: dados/itens inválidos têm 422 e JSON malformado 400 na documentação oficial. Cupom inválido/expirado em itens válidos mantém 200.


## Estratégia baseada em risco

A seleção de cenários prioriza a possibilidade de encontrar defeitos com impacto no valor cobrado e nas regras da promoção. A quantidade de testes não é o critério de qualidade: cada caso deve ter um objetivo distinto, um oráculo documentado e evidência de execução.

### Matriz de risco — probabilidade × impacto

| Área | Probabilidade | Impacto | Risco | Prioridade |
| --- | --- | --- | --- | --- |
| Cálculo de desconto — CA01 | Média | Alto | Alto | P0 |
| Fronteira de R$ 200,00 — CA06/CA07 | Alta | Alto | Alto | P0 |
| Ordem do cálculo: frete antes do desconto — CA08 | Alta | Alto | Alto | P0 |
| Desconto incidindo sobre frete — CA09 | Média | Alto | Alto | P0 |
| Cupom expirado aceito — CA04 | Média | Alto | Alto | P0 |
| Limite de cinco unidades burlado — CA10 | Média | Médio | Médio | P1 |
| Normalização de caixa e espaços nas extremidades — CA02 | Alta | Baixo | Médio | P1 |
| Arredondamento de centavos — CA11 | Média | Médio | Médio | P1 |
| Apenas um cupom por vez — CA05 | Baixa | Médio | Baixo | P1 |
| Validações de cliente | Baixa | Baixo | Baixo | P2 |

A avaliação é qualitativa, conforme o prompt consolidado. Prioridade ordena a execução e a investigação; severidade descreve o impacto de um defeito constatado. A mesma possibilidade de impacto financeiro não torna automaticamente todo caso P0: CA05 e CA11 permanecem P1 na matriz solicitada, e validações de cliente permanecem P2.

### Racional da priorização e dos dados

- **P0 — desconto e rejeição de promoção inválida:** CA01 confirma os 10% sobre produtos. CA04 impede concessão fora da validade. A assimetria de cupom inválido/expirado entre cálculo HTTP 200 e pedido HTTP 422 é verificada nos dois endpoints, sem confundir cupom recusado com erro estrutural do corpo.
- **P0 — limite inclusivo de frete:** R$ 199,90 testa o lado cobrado; R$ 200,00 sem cupom isola a inclusão do limiar; um subtotal real acima dele testa o lado gratuito. R$ 199,80 pode continuar como caso complementar já existente, mas não substitui a fronteira real mais próxima de R$ 199,90.
- **P0 — ordem do frete, CA08:** R$ 199,90 com desconto resulta em R$ 179,91 nos produtos, e ambos ficam abaixo do limiar. Portanto, esse caso não detecta sozinho uma inversão da ordem. P001×1 + P006×5 produz R$ 209,40; após desconto de R$ 20,94, ficam R$ 188,46. O frete deve continuar zero: calcular a elegibilidade depois do desconto produziria frete de R$ 19,90 e total de R$ 208,36. O caso de R$ 200,00 sem cupom controla separadamente a regra inclusiva de CA06, impedindo atribuir toda falha em 200 à ordem do desconto.
- **P0 — desconto fora do frete, CA09:** usar P005×1 + P008×1, subtotal de R$ 150,00 e frete de R$ 19,90. O desconto correto de R$ 15,00 produz total de R$ 154,90; desconto indevido sobre produtos e frete produziria R$ 152,91. Com frete zero, os dois cálculos coincidiriam.
- **P1 — normalização:** `"bemvindo10"`, `"  BEMVINDO10  "` e `"  BeMvInDo10  "` distinguem normalização de caixa, espaços periféricos e combinação. Não inserir espaço entre `bemvindo` e `10`: esse é outro código, fora da equivalência documentada.
- **P1 — quantidade:** analisar cinco como válido e seis como inválido em UI/API. Zero, negativo, fracionário e texto verificam partições de entrada e parsing. Na UI, o controle pode impedir a sexta unidade; a API deve rejeitar diretamente a quantidade seis.
- **P1 — centavos:** P002×1 + P004×2 produz subtotal de R$ 239,70, desconto de R$ 23,97 e total de R$ 215,73. Validar números e precisão de centavos na API, tolerando resíduo binário nas comparações, e formatação brasileira na UI. Não exigir uma representação textual específica do número JSON.
- **P1 — estados de cupom e contratos:** aplicar, remover e reaplicar verifica ausência de desconto residual ou acumulado. Quantidade e remoção de item verificam atualização do carrinho. A regra de um cupom e remoção antes da troca é explícita; controles visuais exatos são mecanismos observados. Erros estruturais de API recebem P1.
- **P2 — cliente e exploração:** nome, e-mail e CEP são regras preexistentes de menor risco na entrega. Cupom vazio/espaços/null, IDs de produto minúsculos, retenção do cupom ao esvaziar e CEP com espaço interno são hipóteses registradas em `docs/00-analise-requisitos.md`, com observações reais registradas, sem transformá-las em requisitos. Acessibilidade complementar permanece P2.

### Técnicas, suficiência e rastreabilidade

Particionamento de equivalência separa cupons e entradas válidas/inválidas. Análise de valores-limite cobre 199,90/200,00/209,40 e cinco/seis unidades. Tabela de decisão cruza frete e cupom. Testes negativos distinguem os status e códigos dos endpoints. Transição de estados cobre aplicação, remoção e mudanças do carrinho.

A cobertura é suficiente quando todos os CA01–CA11 têm cenário rastreável, os casos discriminantes de CA08/CA09 estão cobertos, os três E2E prioritários do prompt foram efetivamente executados e as demais execuções/hipóteses têm status real. Um mesmo ID pode cobrir vários CAs. Não repetir o mesmo caso em BDD e `.spec.ts` apenas para aumentar a contagem.

Os três E2E mínimos do prompt consolidado são `CT-CA01-001` (subtotal 100,00 com cupom), `CT-CA08-001` (subtotal 200,00 com cupom) e `CT-CA09-001` (subtotal 150,00 com cupom e frete positivo). Casos legados com outros IDs devem permanecer identificados como histórico ou ter migração explicitamente registrada. A rodada consolidada executou os 70 casos, incluindo os três mínimos. Não há casos bloqueados ou ignorados nesta execução.

## Matriz de rastreabilidade — execução consolidada

70 IDs únicos, gerados a partir do JSON real de execução. Um ID pode cobrir vários CAs. CT-API e CT-CLI identificam contratos estruturais e cliente; CT-HIP caracteriza hipóteses sem CA próprio. Catálogo e acessibilidade mantêm IDs legados, mas são complementares. A cobertura funcional de CA05 não inclui CT-CA05-090.

Na API sem estado, enviar dois códigos concatenados verifica um código inexistente, sem simular uma sessão de dois cupons. A troca do cupom ativo é comprovada pela UI/BDD. Não há duplicação integral entre features e specs E2E; a repetição dos valores em API e UI verifica camadas diferentes.

| ID | CA | Objetivo | Risco | Prioridade (P0/P1/P2) | Técnica | Tipo | Status | Evidência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CT-CA07-203 | CA07 | fronteira de subtotal R$ 100.00 sem cupom | Frete/faltante incorreto | P0 | Análise de valores-limite | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca07-203) |
| CT-CA07-201 | CA07 | fronteira de subtotal R$ 199.80 sem cupom | Frete/faltante incorreto | P0 | Análise de valores-limite | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca07-201) |
| CT-CA07-202 | CA07 | fronteira de subtotal R$ 199.90 sem cupom | Frete/faltante incorreto | P0 | Análise de valores-limite | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca07-202) |
| CT-CA06-201 | CA06 | fronteira de subtotal R$ 200.00 sem cupom | Frete cobrado indevidamente | P0 | Análise de valores-limite | API | FALHOU — produto, BUG-001 | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca06-201) |
| CT-CA06-202 | CA06 | fronteira de subtotal R$ 209.40 sem cupom | Frete cobrado indevidamente | P0 | Análise de valores-limite | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca06-202) |
| CT-CA08-201 | CA01, CA06, CA08 | CA08: cupom preserva regra de frete sobre subtotal R$ 200.00 | Elegibilidade decidida após desconto | P0 | Análise de valores-limite + tabela de decisão | API | FALHOU — produto, BUG-001 | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca08-201) |
| CT-CA08-202 | CA01, CA06, CA08 | CA08: cupom preserva regra de frete sobre subtotal R$ 209.40 | Elegibilidade decidida após desconto | P0 | Análise de valores-limite + tabela de decisão | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca08-202) |
| CT-CA08-204 | CA01, CA07, CA08 | CA08: cupom preserva regra de frete sobre subtotal R$ 199.90 | Elegibilidade decidida após desconto | P0 | Análise de valores-limite + tabela de decisão | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca08-204) |
| CT-CA04-202 | CA04, CA06 | cupom expirado no limite mantém cálculo 200 sem desconto | Promoção vencida aceita | P0 | Particionamento de equivalência + testes negativos | API | FALHOU — produto, BUG-001 | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca04-202) |
| CT-CA10-201 | CA10 | CA10: aceita exatamente cinco unidades por produto | Quantidade fora do limite | P1 | Análise de valores-limite | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca10-201) |
| CT-CA11-201 | CA11 | CA11: arredonda subtotal, desconto e total para centavos | Diferença de centavos ou formatação incorreta | P1 | Tabela de decisão | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca11-201) |
| CT-API-002 | Complementar | rejeita itens ausentes com erro documentado | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-002) |
| CT-API-003 | Complementar | rejeita carrinho vazio com erro documentado | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-003) |
| CT-API-004 | Complementar | rejeita itens nulos com erro documentado | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-004) |
| CT-API-005 | Complementar | rejeita item sem produtoId com erro documentado | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | FALHOU — produto, BUG-003 | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-005) |
| CT-API-006 | Complementar | rejeita item sem quantidade com erro documentado | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | FALHOU — produto, BUG-003 | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-006) |
| CT-API-012 | Complementar | rejeita item sem objeto com erro documentado | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-012) |
| CT-API-007 | Complementar | rejeita produto inexistente com erro documentado | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-007) |
| CT-CA10-206 | CA10 | rejeita CA10: seis unidades com erro documentado | Quantidade fora do limite | P1 | Análise de valores-limite | API | FALHOU — produto, BUG-002 | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca10-206) |
| CT-CA10-207 | CA10 | rejeita quantidade zero com erro documentado | Quantidade fora do limite | P1 | Análise de valores-limite | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca10-207) |
| CT-CA10-208 | CA10 | rejeita quantidade negativa com erro documentado | Quantidade fora do limite | P1 | Análise de valores-limite | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca10-208) |
| CT-CA10-209 | CA10 | rejeita quantidade fracionária com erro documentado | Quantidade fora do limite | P1 | Análise de valores-limite | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca10-209) |
| CT-CA10-210 | CA10 | rejeita quantidade textual com erro documentado | Quantidade fora do limite | P1 | Análise de valores-limite | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca10-210) |
| CT-API-008 | Complementar | rejeita produto duplicado com erro documentado | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-008) |
| CT-API-001 | Complementar | JSON malformado responde 400 | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-001) |
| CT-CA01-201 | CA01, CA07, CA09 | CA01/CA09: 10% sobre produtos mantém frete de R$ 19,90 | Desconto/total incorreto | P0 | Tabela de decisão | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca01-201) |
| CT-CA02-201 | CA02 | CA02: normaliza caixa e espaços em "bemvindo10" | Código válido recusado | P1 | Particionamento de equivalência | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca02-201) |
| CT-CA02-202 | CA02 | CA02: normaliza caixa e espaços em "  BEMVINDO10  " | Código válido recusado | P1 | Particionamento de equivalência | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca02-202) |
| CT-CA02-203 | CA02 | CA02: normaliza caixa e espaços em "\tbemvindo10\n" | Código válido recusado | P1 | Particionamento de equivalência | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca02-203) |
| CT-CA02-204 | CA02 | CA02: normaliza caixa e espaços em "  BeMvInDo10  " | Código válido recusado | P1 | Particionamento de equivalência | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca02-204) |
| CT-CA03-201 | CA03 | CA03: CUPOM_INEXISTENTE_999 calcula sem desconto e informa o motivo | Cupom inexistente conceder desconto | P0 | Particionamento de equivalência + testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca03-201) |
| CT-CA04-201 | CA04 | CA04: VERAO2026 calcula sem desconto e informa o motivo | Promoção vencida aceita | P0 | Particionamento de equivalência + testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca04-201) |
| CT-CA05-201 | CA05 | CA05: requisições independentes removem e reaplicam o cupom sem acumular desconto entre chamadas | Desconto acumulado ou residual | P1 | Transição de estados | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca05-201) |
| CT-CA05-202 | CA05 | CA05: dois códigos em um campo não acumulam cupons | Desconto acumulado ou residual | P1 | Particionamento de equivalência | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca05-202) |
| CT-CA01-202 | CA01, CA07 | cupom não exige valor mínimo para desconto | Desconto/total incorreto | P0 | Tabela de decisão | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca01-202) |
| CT-CA09-203 | CA01, CA07, CA09 | desconto exclui frete cobrado em subtotal de R$ 150,00 | Desconto incidir sobre frete | P0 | Tabela de decisão | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca09-203) |
| CT-CLI-004 | Complementar | confirma pedido válido com cupom e CEP normalizado | Validação/normalização de cliente | P2 | Particionamento de equivalência | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-cli-004) |
| CT-CLI-006 | Complementar | confirma pedido sem cupom e CEP sem hífen | Validação/normalização de cliente | P2 | Particionamento de equivalência | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-cli-006) |
| CT-CA08-203 | CA01, CA06, CA08 | CA06/CA08: pedido de R$ 200 com cupom confirma com frete grátis | Elegibilidade decidida após desconto | P0 | Análise de valores-limite + tabela de decisão | API | FALHOU — produto, BUG-001 | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca08-203) |
| CT-CA03-220 | CA03 | pedido com CUPOM_INEXISTENTE_999 responde 422 CUPOM_INVALIDO | Cupom inexistente conceder desconto | P0 | Particionamento de equivalência + testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca03-220) |
| CT-CA04-220 | CA04 | pedido com VERAO2026 responde 422 CUPOM_EXPIRADO | Promoção vencida aceita | P0 | Particionamento de equivalência + testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca04-220) |
| CT-CLI-001 | Complementar | rejeita cliente.nome inválido {"nome":"Maria"} com detalhe do campo | Validação/normalização de cliente | P2 | Particionamento de equivalência + testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-cli-001) |
| CT-CLI-002 | Complementar | rejeita cliente.email inválido {"email":"maria@exemplo"} com detalhe do campo | Validação/normalização de cliente | P2 | Particionamento de equivalência + testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-cli-002) |
| CT-CLI-003 | Complementar | rejeita cliente.cep inválido {"cep":"0131010"} com detalhe do campo | Validação/normalização de cliente | P2 | Particionamento de equivalência + testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-cli-003) |
| CT-CLI-005 | Complementar | rejeita cliente.cep inválido {"cep":"01310 100"} com detalhe do campo | Validação/normalização de cliente | P2 | Particionamento de equivalência + testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-cli-005) |
| CT-CA10-220 | CA10 | CA10: pedido rejeita seis unidades do mesmo produto | Quantidade fora do limite | P1 | Análise de valores-limite | API | FALHOU — produto, BUG-002 | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca10-220) |
| CT-API-013 | Complementar | pedido rejeita produto duplicado | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-013) |
| CT-CA11-290 | Complementar | lista o catálogo sem credenciais | Catálogo/contrato público inconsistente | P1 | Tabela de decisão | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca11-290) |
| CT-CA11-291 | Complementar | consulta um produto público pelo ID | Catálogo/contrato público inconsistente | P1 | Tabela de decisão | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca11-291) |
| CT-API-009 | Complementar | produto inexistente responde 404 com contrato de erro | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-009) |
| CT-API-010 | Complementar | método POST no catálogo responde 405 | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-010) |
| CT-API-011 | Complementar | rota inexistente responde 404 | Contrato estrutural de API inconsistente | P1 | Testes negativos | API | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-api-011) |
| CT-CA05-090 | Complementar | carrinho sem violações críticas de acessibilidade | Barreira crítica de acessibilidade (complementar) | P2 | Particionamento de equivalência | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca05-090) |
| CT-CA01-001 | CA01, CA07, CA09 | cupom válido abaixo do limite | Desconto/total incorreto | P0 | Tabela de decisão | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca01-001) |
| CT-CA03-001 | CA03 | rejeita cupom sem alterar o total | Cupom inexistente conceder desconto | P0 | Particionamento de equivalência + testes negativos | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca03-001) |
| CT-CA04-001 | CA04 | rejeita cupom sem alterar o total | Promoção vencida aceita | P0 | Particionamento de equivalência + testes negativos | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca04-001) |
| CT-CA02-001 | CA02 | normaliza caixa mista e espaços | Código válido recusado | P1 | Particionamento de equivalência | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca02-001) |
| CT-CA05-001 | CA05 | remove cupom e permite reaplicar | Desconto acumulado ou residual | P1 | Transição de estados | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca05-001) |
| CT-HIP-001 | Hipótese | observa resposta ao campo só com espaços | Premissa exploratória sem requisito explícito | P2 | Caracterização exploratória | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-hip-001) |
| CT-CA09-001 | CA01, CA07, CA09 | desconto exclui frete no subtotal de R$ 150 | Desconto incidir sobre frete | P0 | Tabela de decisão | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca09-001) |
| CT-CA11-002 | CA11 | apresenta centavos com formatação brasileira | Diferença de centavos ou formatação incorreta | P1 | Tabela de decisão | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca11-002) |
| CT-CA08-001 | CA01, CA06, CA08 | frete grátis em R$ 200 antes e depois do cupom | Elegibilidade decidida após desconto | P0 | Análise de valores-limite + tabela de decisão | E2E | FALHOU — produto, BUG-001 | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca08-001) |
| CT-CA07-001 | CA07, CA11 | R$ 199,80 sem cupom informa faltante de R$ 0,20 | Frete/faltante incorreto | P0 | Análise de valores-limite | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca07-001) |
| CT-CA07-002 | CA06, CA07 | remoção de produto recalcula frete e faltante | Frete/faltante incorreto | P0 | Transição de estados | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca07-002) |
| CT-CA10-001 | CA10 | limita cinco unidades na vitrine e carrinho | Quantidade fora do limite | P1 | Análise de valores-limite | E2E | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca10-001) |
| CT-CA05-101 | CA04, CA05 | Impedir segundo cupom antes de remover o atual | Desconto acumulado ou residual | P1 | Transição de estados | BDD | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca05-101) |
| CT-CA11-101 | CA01, CA11 | Recalcular centavos ao alterar quantidade com cupom | Diferença de centavos ou formatação incorreta | P1 | Transição de estados | BDD | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca11-101) |
| CT-CA08-101 | CA01, CA06, CA07, CA08 | Atravessar o limite nos dois sentidos com cupom | Elegibilidade decidida após desconto | P0 | Transição de estados | BDD | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca08-101) |
| CT-HIP-002 | Hipótese | Observar descarte do cupom ao esvaziar carrinho | Premissa exploratória sem requisito explícito | P2 | Transição de estados | BDD | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-hip-002) |
| CT-CA07-101 | CA01, CA06, CA07, CA08 | Remover produto com cupom reavalia desconto e frete | Frete/faltante incorreto | P0 | Transição de estados | BDD | PASSOU | [Execução](evidencias/consolidada-2026-10-08/execucao.md#ct-ca07-101) |

### Cobertura por critério

| CA | IDs executados |
| --- | --- |
| CA01 | CT-CA08-201, CT-CA08-202, CT-CA08-204, CT-CA01-201, CT-CA01-202, CT-CA09-203, CT-CA08-203, CT-CA01-001, CT-CA09-001, CT-CA08-001, CT-CA11-101, CT-CA08-101, CT-CA07-101 |
| CA02 | CT-CA02-201, CT-CA02-202, CT-CA02-203, CT-CA02-204, CT-CA02-001 |
| CA03 | CT-CA03-201, CT-CA03-220, CT-CA03-001 |
| CA04 | CT-CA04-202, CT-CA04-201, CT-CA04-220, CT-CA04-001, CT-CA05-101 |
| CA05 | CT-CA05-201, CT-CA05-202, CT-CA05-001, CT-CA05-101 |
| CA06 | CT-CA06-201, CT-CA06-202, CT-CA08-201, CT-CA08-202, CT-CA04-202, CT-CA08-203, CT-CA08-001, CT-CA07-002, CT-CA08-101, CT-CA07-101 |
| CA07 | CT-CA07-203, CT-CA07-201, CT-CA07-202, CT-CA08-204, CT-CA01-201, CT-CA01-202, CT-CA09-203, CT-CA01-001, CT-CA09-001, CT-CA07-001, CT-CA07-002, CT-CA08-101, CT-CA07-101 |
| CA08 | CT-CA08-201, CT-CA08-202, CT-CA08-204, CT-CA08-203, CT-CA08-001, CT-CA08-101, CT-CA07-101 |
| CA09 | CT-CA01-201, CT-CA09-203, CT-CA01-001, CT-CA09-001 |
| CA10 | CT-CA10-201, CT-CA10-206, CT-CA10-207, CT-CA10-208, CT-CA10-209, CT-CA10-210, CT-CA10-220, CT-CA10-001 |
| CA11 | CT-CA11-201, CT-CA11-002, CT-CA07-001, CT-CA11-101 |

## Cenários em Gherkin


Os três prioritários são implementados nos `.spec.ts`; as cinco transições executáveis ficam em `automation/features/`. Os roteiros abaixo descrevem valores esperados, mesmo quando o produto falha.

```gherkin
# language: pt
Funcionalidade: Cupom e frete da promoção VZS-142
  Cenário: CT-CA01-001 Cupom válido abaixo do limiar
    Dado que o carrinho contém P005 com quantidade 1 e subtotal 100,00
    Quando aplico "BEMVINDO10"
    Então o desconto deve ser 10,00
    E o frete deve ser 19,90
    E o total deve ser 109,90

  Cenário: CT-CA08-001 Frete no mínimo antes e depois do desconto
    Dado que o carrinho contém P005 com quantidade 2
    Então o subtotal deve ser 200,00, o frete 0,00 e o total 200,00
    Quando aplico "BEMVINDO10"
    Então o desconto deve ser 20,00
    E o frete deve continuar 0,00
    E o total deve ser 180,00

  Cenário: CT-CA07-001 Subtotal 199,80 sem cupom
    Dado que adiciono P001 e P002 com quantidade 1 cada
    Quando abro o carrinho sem cupom
    Então o subtotal deve ser 199,80
    E o desconto deve ser 0,00, o frete 19,90 e o total 219,70
    E deve faltar 0,20 para frete grátis

  Esquema do Cenário: Recusar cupom na UI sem desconto
    Dado que possuo P005 com quantidade 1
    Quando aplico "<cupom>"
    Então devo ver "<mensagem>"
    E o desconto deve ser 0,00 e o total 119,90
    Exemplos:
      | ID          | cupom                  | mensagem        |
      | CT-CA03-001 | CUPOM_INEXISTENTE_999   | Cupom inválido. |
      | CT-CA04-001 | VERAO2026              | Cupom expirado. |

  Cenário: CT-CA02-001 Normalizar cupom
    Dado que possuo P005 com quantidade 1
    Quando aplico o código literal "  BeMvInDo10  "
    Então BEMVINDO10 deve estar aplicado com desconto 10,00 e total 109,90

  Cenário: CT-CA05-001 Remover e reaplicar
    Dado que BEMVINDO10 está aplicado em subtotal 100,00
    Quando removo o cupom
    Então o desconto deve ser 0,00 e o total 119,90
    Quando reaplico BEMVINDO10
    Então deve haver um desconto 10,00 e total 109,90

  Cenário: CT-CA07-002 Remover produto reavalia frete
    Dado que possuo P005 com quantidade 2 e P008 com quantidade 1
    E o subtotal é 250,00 e o frete é 0,00
    Quando removo o produto P005
    Então o subtotal deve ser 50,00, o frete 19,90 e o total 69,90
    E deve faltar 150,00 para frete grátis

  Cenário: CT-CA10-001 Limitar quantidade na UI
    Dado que adiciono 5 unidades de P008
    Então adicionar na vitrine e aumentar no carrinho devem estar desabilitados
    E a quantidade deve ser 5 e o subtotal 250,00

  Cenário: CT-CA11-201 Arredondar valores da API
    Dado que envio P002 com quantidade 1 e P004 com quantidade 2
    Quando calculo com BEMVINDO10
    Então devo receber 200 com subtotal 239,70, desconto 23,97, frete 0,00 e total 215,73

  Esquema do Cenário: Rejeitar quantidade 6 em cálculo e pedido
    Dado que envio P001 com quantidade 6 e dados fictícios válidos
    Quando faço POST em "<rota>"
    Então devo receber 422 QUANTIDADE_MAXIMA_EXCEDIDA
    Exemplos:
      | ID          | rota                  |
      | CT-CA10-206 | /api/carrinho/calcular |
      | CT-CA10-220 | /api/pedidos           |

  Esquema do Cenário: Diferenciar cupom recusado no cálculo e pedido
    Dado que envio P005 com quantidade 1 e cliente fictício válido
    Quando envio o cupom "<cupom>"
    Então calcular deve retornar 200 sem desconto e mensagem "<mensagem>"
    E pedidos deve retornar 422 com "<codigo>"
    Exemplos:
      | cupom                | mensagem        | codigo         |
      | CUPOM_INEXISTENTE_999 | Cupom inválido. | CUPOM_INVALIDO |
      | VERAO2026            | Cupom expirado. | CUPOM_EXPIRADO |

  Cenário: CT-CLI-004 Confirmar pedido e normalizar CEP
    Dado que possuo P005 com quantidade 1 e cupom BEMVINDO10
    E envio nome/sobrenome, e-mail fictício válido e CEP 01310-100
    Quando confirmo o pedido
    Então devo receber 201, número no formato VZ-000000 e CEP 01310100
    E o total deve ser 109,90
```

Validações negativas adicionais estão individualizadas na matriz e nos testes: itens ausentes/vazios, itemnão objeto, inexistente/duplicado, quantidade 0/negativa/fracionária/textual, JSON malformado, nome/e-mail/CEP inválidos. Não há login, cadastro, estoque ou consulta de pedidos.

## Roteiros negativos e catálogo

```gherkin
# language: pt
Funcionalidade: Contratos públicos e entradas inválidas
  Esquema do Cenário: Validar catálogo sem credenciais
    Quando consulto "<rota>"
    Então devo receber "<status>" e o contrato "<contrato>"
    Exemplos:
      | ID          | rota               | status | contrato                       |
      | CT-CA11-290 | /api/produtos      | 200    | 8 produtos com preços oficiais |
      | CT-CA11-291 | /api/produtos/P001 | 200    | produto P001 com preço 59,90    |
      | CT-API-009 | /api/produtos/P999 | 404    | PRODUTO_NAO_ENCONTRADO          |

  Esquema do Cenário: Rejeitar dados inválidos de cálculo
    Quando envio "<entrada>" para calcular
    Então devo receber 422 e "<codigo>"
    Exemplos:
      | ID          | entrada             | codigo                 |
      | CT-API-002 | itens ausentes      | ITENS_OBRIGATORIOS     |
      | CT-API-003 | itens vazios        | ITENS_OBRIGATORIOS     |
      | CT-API-012 | item nulo           | ITEM_INVALIDO          |
      | CT-API-007 | produto P999        | PRODUTO_NAO_ENCONTRADO |
      | CT-CA10-207 | quantidade zero     | QUANTIDADE_INVALIDA   |
      | CT-CA10-208 | quantidade negativa | QUANTIDADE_INVALIDA   |
      | CT-CA10-209 | quantidade 1,5      | QUANTIDADE_INVALIDA   |
      | CT-CA10-210 | quantidade textual  | QUANTIDADE_INVALIDA   |
      | CT-API-008 | P001 duplicado      | ITEM_DUPLICADO         |

  Cenário: CT-API-001 Rejeitar JSON malformado
    Quando envio JSON incompleto para calcular
    Então devo receber 400 JSON_INVALIDO

  Esquema do Cenário: Rejeitar dados de cliente no pedido
    Dado que possuo um carrinho válido
    Quando envio "<entrada>" como dado do cliente
    Então devo receber 422 DADOS_INVALIDOS com detalhe de "<campo>"
    Exemplos:
      | ID          | entrada        | campo         |
      | CT-CLI-001 | Maria          | cliente.nome  |
      | CT-CLI-002 | maria@exemplo  | cliente.email |
      | CT-CLI-003 | CEP 0131010    | cliente.cep   |

  Cenário: CT-API-013 Rejeitar duplicação no pedido
    Dado que envio cliente fictício válido
    E dois itens separados com produto P001
    Quando confirmo o pedido
    Então devo receber 422 ITEM_DUPLICADO
```


## Roteiros adicionais do consolidado

```gherkin
# language: pt
Funcionalidade: Desconto com frete e centavos
  Cenário: CT-CA09-001 Desconto não incide sobre frete
    Dado que possuo P005 e P008 com quantidade 1 cada
    E o subtotal é 150,00 e o frete 19,90
    Quando aplico "BEMVINDO10"
    Então o desconto deve ser 15,00 e o frete 19,90
    E o total deve ser 154,90

  Cenário: CT-CA08-204 Fronteira cobrada com cupom na API
    Dado que envio P005, P008 e P004 com quantidade 1 cada
    Quando calculo com "BEMVINDO10"
    Então devo receber 200 com subtotal 199,90 e desconto 19,99
    E o frete deve ser 19,90, o faltante 0,10 e o total 199,81

  Cenário: CT-CA11-002 Formatação brasileira na UI
    Dado que possuo P002 com quantidade 1 e P004 com quantidade 2
    Quando aplico "BEMVINDO10"
    Então devo ver subtotal "R$ 239,70" e desconto "- R$ 23,97"
    E o frete deve ser "Grátis" e o total "R$ 215,73"

  Esquema do Cenário: Propriedade obrigatória do item ausente
    Quando envio "<entrada>" para calcular
    Então devo receber 422 ITEM_INVALIDO
    Exemplos:
      | ID         | entrada                     |
      | CT-API-005 | item sem produtoId          |
      | CT-API-006 | item sem quantidade         |

  Cenário: CT-API-004 Itens nulos
    Quando envio itens null para calcular
    Então devo receber 422 ITENS_OBRIGATORIOS

  Cenário: CT-API-010 Método não permitido
    Quando envio POST para /api/produtos
    Então devo receber 405 METODO_NAO_PERMITIDO

  Cenário: CT-API-011 Rota inexistente
    Quando consulto /api/rota-inexistente
    Então devo receber 404 ROTA_NAO_ENCONTRADA

  Cenário: CT-CLI-005 CEP com espaço interno
    Dado que envio um pedido com dados fictícios válidos
    Quando informo o CEP "01310 100"
    Então devo receber 422 DADOS_INVALIDOS em cliente.cep
```

Os roteiros Gherkin deste documento descrevem a intenção dos specs, sem adicioná-los ao projeto BDD. As cinco transições executáveis são [cupom.feature](../automation/features/cupom.feature) e [frete-gratis.feature](../automation/features/frete-gratis.feature). A hipótese de descarte do cupom ao esvaziar usa CT-HIP-002 e não é um requisito CA05. A evolução dos IDs de cliente/estrutura preserva os relatórios históricos com seus IDs originais.
