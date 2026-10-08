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

R$ 199,80 é P001×1+P002×1 e é o caso prioritário solicitado. O maior subtotal alcançável abaixo de 200 é 199,90 (P005+P004+P008); o menor acima é 209,40 (P001+P006×5). Mantemos essas fronteiras na API e não simulamos 200,01/200,10.

## Matriz de decisão frete × cupom

| Subtotal | Cupom | Desconto | Frete | Total | Composição |
| ---: | --- | ---: | ---: | ---: | --- |
|100,00|Nenhum|0,00|19,90|119,90|P005×1|
|100,00|BEMVINDO10|10,00|19,90|109,90|P005×1|
|199,80|Nenhum|0,00|19,90|219,70|P001+P002|
|200,00|Nenhum|0,00|0,00|200,00|P005×2|
|200,00|BEMVINDO10|20,00|0,00|180,00|P005×2|
|200,00|VERAO2026|0,00|0,00|200,00|P005×2|
|239,70|BEMVINDO10|23,97|0,00|215,73|P002+P004×2|

A linha expirada corresponde ao cálculo HTTP 200 com mensagem “Cupom expirado.”. `/api/pedidos` rejeita o mesmo cupom com 422 `CUPOM_EXPIRADO`. Cálculo não é sempre 200: dados/itens inválidos têm 422 e JSON malformado 400 na documentação oficial. Cupom inválido/expirado em itens válidos mantém 200.

## Racional da priorização

P0 cobre risco financeiro e regras centrais: desconto, frete, centavos, mensagem de cupom recusado e acúmulo. P1 cobre normalização, limite de quantidade e contratos/validações de API. P2 cobre acessibilidade complementar e investigação exploratória. Severidade mede impacto; prioridade define ordem de análise/correção.

Particionamento separa cupons válidos/inexistentes/expirados e entradas válidas/inválidas. Valores-limite cobrem 199,80/199,90/200/209,40 e quantidades 5/6. A tabela de decisão cruza cupom e frete; testes negativos exercitam rejeição; transição de estados cobre aplicar/remover, quantidade e carrinho vazio.

A API cobre combinações financeiras e validações. A UI confirma mensagens, controles e os três fluxos prioritários. BDD cobre quatro transições distintas, evitando repetir os cenários E 2 E. Asserções de valores semelhantes entre API e UI verificam contratos e apresentação em camadas diferentes.

## Matriz de rastreabilidade — execução final

Cada ID identifica um caso concreto. Sufixos 001–090: UI;101–102: BDD;201–291: API. Casos complementares conservam a convenção de IDs, mas a coluna CA declara “Complementar”: catálogo, acessibilidade e validação de cliente não são critérios oficiais adicionais. Não inferimos execução humana a partir da automação.

| ID | CA | Objetivo | Risco | Prioridade (P0/P1/P2) | Técnica | Tipo | Resultado obtido | Evidência |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CT-CA09-201 | CA09 | CT-CA09-201 fronteira de subtotal R$  100.00 sem cupom @smoke | Desconto incorreto sobre frete | P0 | Tabela de decisão | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca09-201) |
| CT-CA07-201 | CA07 | CT-CA07-201 fronteira de subtotal R$  199.80 sem cupom @smoke | Frete/faltante incorretos | P0 | Análise de valores-limite | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca07-201) |
| CT-CA07-202 | CA07 | CT-CA07-202 fronteira de subtotal R$  199.90 sem cupom @smoke | Frete/faltante incorretos | P0 | Análise de valores-limite | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca07-202) |
| CT-CA06-201 | CA06 | CT-CA06-201 fronteira de subtotal R$  200.00 sem cupom @smoke | Cobrança indevida de frete | P0 | Análise de valores-limite | API | REPROVADO — BUG-001 | [Execução](evidencias/execucao-2026-10-08.md#ct-ca06-201) |
| CT-CA06-202 | CA06 | CT-CA06-202 fronteira de subtotal R$  209.40 sem cupom @smoke | Cobrança indevida de frete | P0 | Análise de valores-limite | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca06-202) |
| CT-CA08-201 | CA08 | CT-CA08-201 CA08: cupom preserva regra de frete sobre subtotal R$  200.00 | Elegibilidade calculada sobre total errado | P0 | Tabela de decisão | API | REPROVADO — BUG-001 | [Execução](evidencias/execucao-2026-10-08.md#ct-ca08-201) |
| CT-CA08-202 | CA08 | CT-CA08-202 CA08: cupom preserva regra de frete sobre subtotal R$  209.40 | Elegibilidade calculada sobre total errado | P0 | Tabela de decisão | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca08-202) |
| CT-CA04-202 | CA04,CA06 | CT-CA04-202 cupom expirado no limite mantém cálculo 200 sem desconto | Promoção vencida aceita | P0 | Particionamento de equivalência + testes negativos | API | REPROVADO — BUG-001 | [Execução](evidencias/execucao-2026-10-08.md#ct-ca04-202) |
| CT-CA10-201 | CA10 | CT-CA10-201 CA10: aceita exatamente cinco unidades por produto | Pedido fora do limite de quantidade | P1 | Análise de valores-limite | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-201) |
| CT-CA11-201 | CA11 | CT-CA11-201 CA11: arredonda subtotal, desconto e total para centavos | Diferença financeira de centavos | P0 | Tabela de decisão | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca11-201) |
| CT-CA10-202 | Complementar | CT-CA10-202 rejeita itens ausentes com erro documentado | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-202) |
| CT-CA10-203 | Complementar | CT-CA10-203 rejeita carrinho vazio com erro documentado | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-203) |
| CT-CA10-204 | Complementar | CT-CA10-204 rejeita item sem objeto com erro documentado | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-204) |
| CT-CA10-205 | Complementar | CT-CA10-205 rejeita produto inexistente com erro documentado | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-205) |
| CT-CA10-206 | CA10 | CT-CA10-206 rejeita CA10: seis unidades com erro documentado | Pedido fora do limite de quantidade | P1 | Análise de valores-limite + testes negativos | API | REPROVADO — BUG-002 | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-206) |
| CT-CA10-207 | CA10 | CT-CA10-207 rejeita quantidade zero com erro documentado | Pedido fora do limite de quantidade | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-207) |
| CT-CA10-208 | CA10 | CT-CA10-208 rejeita quantidade negativa com erro documentado | Pedido fora do limite de quantidade | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-208) |
| CT-CA10-209 | CA10 | CT-CA10-209 rejeita quantidade fracionária com erro documentado | Pedido fora do limite de quantidade | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-209) |
| CT-CA10-210 | CA10 | CT-CA10-210 rejeita quantidade textual com erro documentado | Pedido fora do limite de quantidade | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-210) |
| CT-CA10-211 | Complementar | CT-CA10-211 rejeita produto duplicado com erro documentado | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-211) |
| CT-CA10-212 | Complementar | CT-CA10-212 JSON malformado responde 400 | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-212) |
| CT-CA01-201 | CA01,CA09 | CT-CA01-201 CA01/CA09: 10% sobre produtos mantém frete de R$  19,90 @smoke | Desconto/total incorretos | P0 | Tabela de decisão | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca01-201) |
| CT-CA02-201 | CA02 | CT-CA02-201 CA02: normaliza caixa e espaços em "bemvindo 10" | Código válido recusado | P1 | Particionamento de equivalência | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca02-201) |
| CT-CA02-202 | CA02 | CT-CA02-202 CA02: normaliza caixa e espaços em "  bemvindo 10  " | Código válido recusado | P1 | Particionamento de equivalência | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca02-202) |
| CT-CA02-203 | CA02 | CT-CA02-203 CA02: normaliza caixa e espaços em "\tbemvindo 10\n" | Código válido recusado | P1 | Particionamento de equivalência | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca02-203) |
| CT-CA03-201 | CA03 | CT-CA03-201 CA03: CUPOM_INEXISTENTE_999 calcula sem desconto e informa o motivo | Desconto indevido | P0 | Particionamento de equivalência + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca03-201) |
| CT-CA04-201 | CA04 | CT-CA04-201 CA04: VERAO2026 calcula sem desconto e informa o motivo | Promoção vencida aceita | P0 | Particionamento de equivalência + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca04-201) |
| CT-CA05-201 | CA05 | CT-CA05-201 CA05: requisições independentes removem e reaplicam o cupom sem acumular desconto entre chamadas | Desconto duplicado ou residual | P0 | Transição de estados | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca05-201) |
| CT-CA05-202 | CA05 | CT-CA05-202 CA05: dois códigos em um campo não acumulam cupons | Desconto duplicado ou residual | P0 | Particionamento de equivalência | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca05-202) |
| CT-CA01-202 | CA01 | CT-CA01-202 cupom não exige valor mínimo para desconto | Desconto/total incorretos | P0 | Tabela de decisão | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca01-202) |
| CT-CA01-203 | CA01 | CT-CA01-203 confirma pedido válido com cliente fictício e CEP normalizado @smoke | Desconto/total incorretos | P0 | Tabela de decisão | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca01-203) |
| CT-CA09-202 | CA09 | CT-CA09-202 confirma pedido sem cupom | Desconto incorreto sobre frete | P0 | Tabela de decisão | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca09-202) |
| CT-CA08-203 | CA01,CA06,CA08 | CT-CA08-203 CA06/CA08: pedido de R$  200 com cupom confirma com frete grátis | Elegibilidade calculada sobre total errado | P0 | Tabela de decisão | API | REPROVADO — BUG-001 | [Execução](evidencias/execucao-2026-10-08.md#ct-ca08-203) |
| CT-CA03-220 | CA03 | CT-CA03-220 pedido com CUPOM_INEXISTENTE_999 responde 422 CUPOM_INVALIDO | Desconto indevido | P0 | Particionamento de equivalência + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca03-220) |
| CT-CA04-220 | CA04 | CT-CA04-220 pedido com VERAO2026 responde 422 CUPOM_EXPIRADO | Promoção vencida aceita | P0 | Particionamento de equivalência + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca04-220) |
| CT-CA10-222 | Complementar | CT-CA10-222 rejeita cliente.nome inválido com detalhe do campo | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-222) |
| CT-CA10-223 | Complementar | CT-CA10-223 rejeita cliente.email inválido com detalhe do campo | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-223) |
| CT-CA10-224 | Complementar | CT-CA10-224 rejeita cliente.cep inválido com detalhe do campo | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-224) |
| CT-CA10-220 | CA10 | CT-CA10-220 CA10: pedido rejeita seis unidades do mesmo produto | Pedido fora do limite de quantidade | P1 | Análise de valores-limite + testes negativos | API | REPROVADO — BUG-002 | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-220) |
| CT-CA10-221 | Complementar | CT-CA10-221 pedido rejeita produto duplicado | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite + testes negativos | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-221) |
| CT-CA11-290 | Complementar | CT-CA11-290 lista o catálogo sem credenciais @smoke @regression | Contrato/catálogo/checkout impedem concluir a compra | P1 | Tabela de decisão | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca11-290) |
| CT-CA11-291 | Complementar | CT-CA11-291 consulta um produto público pelo ID @regression | Contrato/catálogo/checkout impedem concluir a compra | P1 | Tabela de decisão | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca11-291) |
| CT-CA10-290 | Complementar | CT-CA10-290 produto inexistente responde 404 com contrato de erro @regression | Contrato/catálogo/checkout impedem concluir a compra | P1 | Análise de valores-limite | API | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-290) |
| CT-CA05-090 | Complementar | CT-CA05-090 carrinho sem violações críticas de acessibilidade @regression | Contrato/catálogo/checkout impedem concluir a compra | P2 | Particionamento de equivalência | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca05-090) |
| CT-CA01-001 | CA01,CA07,CA09 | CT-CA01-001 cupom válido abaixo do limite @smoke | Desconto/total incorretos | P0 | Tabela de decisão | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca01-001) |
| CT-CA03-001 | CA03 | CT-CA03-001 rejeita cupom sem alterar o total @smoke | Desconto indevido | P0 | Particionamento de equivalência + testes negativos | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca03-001) |
| CT-CA04-001 | CA04 | CT-CA04-001 rejeita cupom sem alterar o total @smoke | Promoção vencida aceita | P0 | Particionamento de equivalência + testes negativos | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca04-001) |
| CT-CA02-001 | CA02 | CT-CA02-001 normaliza caixa e espaços | Código válido recusado | P1 | Particionamento de equivalência | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca02-001) |
| CT-CA05-001 | CA05 | CT-CA05-001 remove cupom e permite reaplicar | Desconto duplicado ou residual | P0 | Transição de estados | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca05-001) |
| CT-CA03-002 | CA03 | CT-CA03-002 exige código preenchido | Desconto indevido | P0 | Particionamento de equivalência + testes negativos | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca03-002) |
| CT-CA06-001 | CA06,CA08 | CT-CA06-001 frete grátis em R$  200 antes e depois do cupom @smoke | Cobrança indevida de frete | P0 | Análise de valores-limite | E 2 E | REPROVADO — BUG-001 | [Execução](evidencias/execucao-2026-10-08.md#ct-ca06-001) |
| CT-CA07-001 | CA07,CA11 | CT-CA07-001 R$  199,80 sem cupom informa faltante de R$  0,20 @smoke | Frete/faltante incorretos | P0 | Análise de valores-limite | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca07-001) |
| CT-CA07-002 | CA07 | CT-CA07-002 remoção de produto recalcula frete e faltante | Frete/faltante incorretos | P0 | Transição de estados | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca07-002) |
| CT-CA10-001 | CA10 | CT-CA10-001 limita cinco unidades na vitrine e carrinho | Pedido fora do limite de quantidade | P1 | Análise de valores-limite | E 2 E | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca10-001) |
| CT-CA05-101 | CA05 | CT-CA05-101 Impedir segundo cupom antes de remover o atual | Desconto duplicado ou residual | P0 | Transição de estados | BDD | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca05-101) |
| CT-CA11-101 | CA01,CA11 | CT-CA11-101 Recalcular centavos ao alterar quantidade com cupom | Diferença financeira de centavos | P0 | Transição de estados | BDD | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca11-101) |
| CT-CA08-101 | CA01,CA07,CA08 | CT-CA08-101 Atravessar o limite nos dois sentidos com cupom | Elegibilidade calculada sobre total errado | P0 | Transição de estados | BDD | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca08-101) |
| CT-CA05-102 | CA05 | CT-CA05-102 Esvaziar carrinho descarta o cupom aplicado | Desconto duplicado ou residual | P0 | Transição de estados | BDD | APROVADO | [Execução](evidencias/execucao-2026-10-08.md#ct-ca05-102) |

### Cobertura por critério

| CA | Casos automatizados relacionados |
| --- | --- |
| CA01 | CT-CA01-201, CT-CA01-202, CT-CA01-203, CT-CA08-203, CT-CA01-001, CT-CA11-101, CT-CA08-101 |
| CA02 | CT-CA02-201, CT-CA02-202, CT-CA02-203, CT-CA02-001 |
| CA03 | CT-CA03-201, CT-CA03-220, CT-CA03-001, CT-CA03-002 |
| CA04 | CT-CA04-202, CT-CA04-201, CT-CA04-220, CT-CA04-001 |
| CA05 | CT-CA05-201, CT-CA05-202, CT-CA05-001, CT-CA05-101, CT-CA05-102 |
| CA06 | CT-CA06-201, CT-CA06-202, CT-CA04-202, CT-CA08-203, CT-CA06-001 |
| CA07 | CT-CA07-201, CT-CA07-202, CT-CA01-001, CT-CA07-001, CT-CA07-002, CT-CA08-101 |
| CA08 | CT-CA08-201, CT-CA08-202, CT-CA08-203, CT-CA06-001, CT-CA08-101 |
| CA09 | CT-CA09-201, CT-CA01-201, CT-CA09-202, CT-CA01-001 |
| CA10 | CT-CA10-201, CT-CA10-206, CT-CA10-207, CT-CA10-208, CT-CA10-209, CT-CA10-210, CT-CA10-220, CT-CA10-001 |
| CA11 | CT-CA11-201, CT-CA07-001, CT-CA11-101 |

## Cenários em Gherkin

Os três prioritários são implementados nos `.spec.ts`; as quatro transições executáveis ficam em `automation/features/`. Os roteiros abaixo descrevem valores esperados, mesmo quando o produto falha.

```gherkin
# language: pt
Funcionalidade: Cupom e frete da promoção VZS-142
  Cenário: CT-CA01-001 Cupom válido abaixo do limiar
    Dado que o carrinho contém P005 com quantidade 1 e subtotal 100,00
    Quando aplico "BEMVINDO10"
    Então o desconto deve ser 10,00
    E o frete deve ser 19,90
    E o total deve ser 109,90

  Cenário: CT-CA06-001 Frete no mínimo antes e depois do desconto
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
    Quando aplico o código literal "  bemvindo 10  "
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

  Cenário: CT-CA01-203 Confirmar pedido e normalizar CEP
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
      | CT-CA10-290 | /api/produtos/P999 | 404    | PRODUTO_NAO_ENCONTRADO          |

  Esquema do Cenário: Rejeitar dados inválidos de cálculo
    Quando envio "<entrada>" para calcular
    Então devo receber 422 e "<codigo>"
    Exemplos:
      | ID          | entrada             | codigo                 |
      | CT-CA10-202 | itens ausentes      | ITENS_OBRIGATORIOS     |
      | CT-CA10-203 | itens vazios        | ITENS_OBRIGATORIOS     |
      | CT-CA10-204 | item nulo           | ITEM_INVALIDO          |
      | CT-CA10-205 | produto P999        | PRODUTO_NAO_ENCONTRADO |
      | CT-CA10-207 | quantidade zero     | QUANTIDADE_INVALIDA   |
      | CT-CA10-208 | quantidade negativa | QUANTIDADE_INVALIDA   |
      | CT-CA10-209 | quantidade 1,5      | QUANTIDADE_INVALIDA   |
      | CT-CA10-210 | quantidade textual  | QUANTIDADE_INVALIDA   |
      | CT-CA10-211 | P001 duplicado      | ITEM_DUPLICADO         |

  Cenário: CT-CA10-212 Rejeitar JSON malformado
    Quando envio JSON incompleto para calcular
    Então devo receber 400 JSON_INVALIDO

  Esquema do Cenário: Rejeitar dados de cliente no pedido
    Dado que possuo um carrinho válido
    Quando envio "<entrada>" como dado do cliente
    Então devo receber 422 DADOS_INVALIDOS com detalhe de "<campo>"
    Exemplos:
      | ID          | entrada        | campo         |
      | CT-CA10-222 | Cliente        | cliente.nome  |
      | CT-CA10-223 | email-invalido | cliente.email |
      | CT-CA10-224 | CEP 123        | cliente.cep   |

  Cenário: CT-CA10-221 Rejeitar duplicação no pedido
    Dado que envio cliente fictício válido
    E dois itens separados com produto P001
    Quando confirmo o pedido
    Então devo receber 422 ITEM_DUPLICADO
```
