# Cenários de teste — VZS-142

Fonte: [documentação 2.3.0](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao), publicada em 30/09/2026. Os exemplos do pedido inicial foram ajustados às regras disponíveis no ambiente. Os cenários abaixo servem como roteiro; as features executáveis ficam em `automation/features/`.

## Dados e placeholders

| Placeholder | Valor concreto e interpretação |
| --- | --- |
| `<CUPOM_VALIDO>` | `BEMVINDO10`, desconto de 10% nos produtos |
| `<CUPOM_INVALIDO>` | `CUPOM_INVALIDO`, código inexistente usado como dado negativo |
| `<CUPOM_EXPIRADO>` | `VERAO2026`, validade encerrada em 31/03/2026 |
| `<VALOR_MINIMO>` | R$ 200,00, mínimo de frete grátis; não é mínimo de cupom |
| `<FRETE_FIXO>` | R$ 19,90 abaixo do mínimo de frete grátis |
| `<CUPOM_FRETE_GRATIS>` | Não existe no contrato; usar `<CUPOM_VALIDO>` com subtotal ≥ R$ 200,00 |

Os placeholders devem ser ajustados se a documentação ou o ambiente mudarem. Nas features executáveis, os exemplos usam dados concretos. Valores em tabelas representam reais com duas casas decimais.

| Carrinho | Composição | Subtotal |
| --- | --- | ---: |
| Abaixo do mínimo | P005×1 | 100,00 |
| Imediatamente abaixo | P005×1 + P004×1 + P008×1 | 199,90 |
| No mínimo | P005×2 | 200,00 |
| Acima do mínimo mais próximo possível | P006×5 + P001×1 | 209,40 |
| Com centavos para desconto | P002×1 + P004×2 | 239,70 |

R$ 200,01 e R$ 200,10 não podem ser montados com o catálogo fixo e a restrição de até cinco unidades de cada produto. A fronteira superior usa R$ 209,40. Não se altera preço nem se envia um subtotal artificial: a API calcula o subtotal pelos itens.

## Cupons e cálculo

```gherkin
# language: pt
Funcionalidade: Cupom de desconto no carrinho
  Como cliente da Verzel Store
  Quero aplicar ou remover um cupom
  Para pagar o valor correto pelos produtos e pelo frete

  Cenário: CT01 - Aplicar cupom válido
    Dado que o carrinho contém 1 unidade de P005 e subtotal de 100,00
    Quando aplico o cupom "<CUPOM_VALIDO>"
    Então o cupom deve ser aplicado com desconto de 10,00
    E o frete deve ser 19,90
    E o total deve ser 109,90

  Cenário: CT02 - Recusar cupom inválido
    Dado que o carrinho contém 1 unidade de P005
    Quando aplico o cupom "<CUPOM_INVALIDO>"
    Então devo ver a mensagem "Cupom inválido."
    E nenhum cupom deve ser aplicado
    E o desconto deve ser 0,00
    E o total deve ser 119,90

  Cenário: CT03 - Recusar cupom expirado
    Dado que o carrinho contém 1 unidade de P005
    Quando aplico o cupom "<CUPOM_EXPIRADO>"
    Então devo ver a mensagem "Cupom expirado."
    E nenhum cupom deve ser aplicado
    E o desconto deve ser 0,00

  Cenário: CT04 - Aplicar cupom abaixo do mínimo de frete grátis
    Dado que o subtotal dos produtos é 100,00
    E esse valor é menor que "<VALOR_MINIMO>"
    Quando aplico o cupom "<CUPOM_VALIDO>"
    Então o desconto deve ser 10,00
    E o frete deve ser "<FRETE_FIXO>"
    E o carrinho deve informar que faltam 100,00 para o frete grátis

  Cenário: CT05 - Remover cupom aplicado
    Dado que o carrinho contém 2 unidades de P005
    E o cupom "<CUPOM_VALIDO>" está aplicado
    Quando removo o cupom
    Então o desconto deve ser 0,00
    E o subtotal deve continuar sendo 200,00
    E o frete deve continuar grátis
    E o total deve ser 200,00

  Cenário: CT08 - Impedir tentativa de acumular cupons na interface
    Dado que o cupom "<CUPOM_VALIDO>" está aplicado
    Quando verifico os controles de cupom
    Então não deve ser possível aplicar um segundo cupom enquanto o atual estiver aplicado
    Quando removo o cupom atual
    E aplico novamente o cupom "<CUPOM_VALIDO>"
    Então deve haver apenas um desconto de 10% sobre o subtotal

  Esquema do Cenário: CT09 - Normalizar maiúsculas, minúsculas e espaços nas extremidades
    Dado que o carrinho contém 1 unidade de P005
    Quando aplico o código "<codigo>"
    Então o cupom "BEMVINDO10" deve ser aplicado
    E o desconto deve ser 10,00
    Exemplos:
      | codigo          |
      | BEMVINDO10      |
      | bemvindo10      |
      | BeMvInDo10      |
      |   BEMVINDO10    |

  Cenário: CT10 - Recalcular desconto após alterar quantidade
    Dado que o carrinho contém 1 unidade de P005
    E o cupom "<CUPOM_VALIDO>" está aplicado
    Quando aumento a quantidade de P005 para 2
    Então o subtotal deve ser 200,00
    E o desconto deve ser 20,00

  Cenário: CT11 - Aplicar desconto apenas aos produtos
    Dado que o carrinho contém 1 unidade de P005
    Quando aplico o cupom "<CUPOM_VALIDO>"
    Então o desconto deve ser 10% de 100,00
    E o frete de 19,90 não deve receber desconto
    E o total deve ser 109,90

  Cenário: CT12 - Preservar precisão monetária
    Dado que o carrinho contém 1 unidade de P002 e 2 unidades de P004
    Quando aplico o cupom "<CUPOM_VALIDO>"
    Então o subtotal deve ser 239,70
    E o desconto deve ser 23,97
    E o frete deve ser 0,00
    E o total deve ser 215,73
    E a interface deve exibir os valores com duas casas decimais
```

Para CT09, digite também literalmente `"  BEMVINDO10  "`: tabelas Gherkin removem espaços periféricos de células, portanto a verificação de espaços exige esse dado explícito na automação ou na execução manual. A regra de normalização é das extremidades; não se presume aceitação de espaços internos ao código.

## Frete grátis

```gherkin
# language: pt
Funcionalidade: Frete calculado pelo subtotal antes do desconto

  Cenário: CT06 - Manter frete grátis com cupom quando o total cai abaixo do mínimo
    Dado que o carrinho contém 2 unidades de P005 e subtotal de 200,00
    Quando aplico o cupom "<CUPOM_VALIDO>"
    Então o desconto deve ser 20,00
    E o total deve ser 180,00
    E o frete deve ser grátis
    E o valor faltante para frete grátis deve ser 0,00

  Esquema do Cenário: CT07 - Avaliar as fronteiras do mínimo sem cupom
    Dado que o carrinho tem a composição "<itens>"
    Quando calculo o carrinho sem cupom
    Então o subtotal deve ser <subtotal>
    E o frete deve ser <frete>
    E o valor faltante para frete grátis deve ser <faltante>
    E o total deve ser <total>
    Exemplos:
      | itens             | subtotal | frete | faltante | total  |
      | P005x1 P004x1 P008x1 | 199,90 | 19,90 | 0,10    | 219,80 |
      | P005x2            | 200,00   | 0,00  | 0,00     | 200,00 |
      | P006x5 P001x1     | 209,40   | 0,00  | 0,00     | 209,40 |

  Esquema do Cenário: CT13 - Avaliar as fronteiras com cupom válido
    Dado que o carrinho tem a composição "<itens>"
    Quando calculo o carrinho com o cupom "<CUPOM_VALIDO>"
    Então o desconto deve ser <desconto>
    E o frete deve ser <frete>
    E o total deve ser <total>
    Exemplos:
      | itens               | desconto | frete | total  |
      | P005x1 P004x1 P008x1 | 19,99    | 19,90 | 199,81 |
      | P005x2              | 20,00    | 0,00  | 180,00 |
      | P006x5 P001x1       | 20,94    | 0,00  | 188,46 |

  Cenário: CT14 - Reavaliar o frete após reduzir quantidade
    Dado que o carrinho contém 5 unidades de P005 sem cupom
    E o subtotal é 500,00 e o frete é grátis
    Quando reduzo a quantidade de P005 para 1
    Então o subtotal deve ser 100,00
    E o frete deve ser 19,90
    E o total deve ser 119,90
    E o carrinho deve informar que faltam 100,00 para o frete grátis

  Cenário: CT25 - Reavaliar o frete após remover um produto
    Dado que o carrinho contém 2 unidades de P005 e 1 unidade de P008 sem cupom
    E o subtotal é 250,00 e o frete é grátis
    Quando reduzo a quantidade de P005 para 1
    Então o subtotal deve ser 150,00 e o frete deve ser 19,90
    Quando removo o produto P008
    Então o subtotal deve ser 100,00
    E o frete deve ser 19,90
    E o total deve ser 119,90
    E o carrinho deve informar que faltam 100,00 para o frete grátis
```

## Quantidades, contrato e pedido

```gherkin
# language: pt
Funcionalidade: Integridade do carrinho e confirmação do pedido

  Cenário: CT15 - Aceitar o máximo de cinco unidades por produto
    Dado que o carrinho contém 5 unidades de P005
    Quando calculo o carrinho
    Então a API deve aceitar o cálculo
    E a quantidade deve ser 5
    E a interface deve impedir adicionar a sexta unidade

  Cenário: CT16 - Rejeitar quantidade acima do máximo na API
    Quando envio 6 unidades de P001 para calcular o carrinho
    Então a resposta deve ter status 422
    E o código de erro deve ser "QUANTIDADE_MAXIMA_EXCEDIDA"

  Esquema do Cenário: CT17 - Rejeitar itens inválidos sem calcular totais
    Quando envio um carrinho com "<entrada>"
    Então a resposta deve ter status 422
    E o código de erro deve ser "<erro>"
    Exemplos:
      | entrada                         | erro                   |
      | lista vazia                     | ITENS_OBRIGATORIOS     |
      | item sem produtoId              | ITEM_INVALIDO         |
      | produto inexistente             | PRODUTO_NAO_ENCONTRADO |
      | P005 repetido em dois itens      | ITEM_DUPLICADO         |
      | quantidade zero                 | QUANTIDADE_INVALIDA   |
      | quantidade negativa             | QUANTIDADE_INVALIDA   |
      | quantidade fracionária           | QUANTIDADE_INVALIDA   |
      | quantidade como texto            | QUANTIDADE_INVALIDA   |

  Esquema do Cenário: CT18 - Informar erro de cupom no cálculo com HTTP 200
    Dado que o carrinho contém 1 unidade de P005
    Quando envio o cupom "<codigo>" para "/api/carrinho/calcular"
    Então a resposta deve ter status 200
    E cupom.aplicado deve ser falso
    E cupom.mensagem deve ser "<mensagem>"
    E o desconto deve ser 0,00
    Exemplos:
      | codigo         | mensagem        |
      | CUPOM_INVALIDO | Cupom inválido. |
      | VERAO2026      | Cupom expirado. |

  Cenário: CT19 - Confirmar pedido com cupom válido
    Dado um cliente com nome e sobrenome, e-mail válido e CEP de oito dígitos
    E um carrinho com 2 unidades de P005 e cupom "<CUPOM_VALIDO>"
    Quando envio o pedido para "/api/pedidos"
    Então a resposta deve ter status 201
    E o número do pedido deve seguir o formato "VZ-000000"
    E o CEP deve estar normalizado sem hífen
    E o resumo deve manter subtotal de 200,00, desconto de 20,00 e frete de 0,00
    E o total deve ser 180,00

  Esquema do Cenário: CT20 - Rejeitar cupom inválido ou expirado na confirmação
    Dado um cliente com dados válidos e um carrinho com 1 unidade de P005
    Quando envio um pedido com o cupom "<codigo>"
    Então a resposta deve ter status 422
    E o código de erro deve ser "<erro>"
    Exemplos:
      | codigo         | erro           |
      | CUPOM_INVALIDO | CUPOM_INVALIDO |
      | VERAO2026      | CUPOM_EXPIRADO |

  Esquema do Cenário: CT21 - Validar os dados do cliente no pedido
    Dado um carrinho válido
    Quando envio um pedido com "<entrada>"
    Então a resposta deve ter status 422
    E o código de erro deve ser "DADOS_INVALIDOS"
    E o erro deve identificar o campo inválido
    Exemplos:
      | entrada                     |
      | nome sem sobrenome          |
      | e-mail sem formato válido   |
      | CEP com três dígitos        |

  Cenário: CT22 - Concluir compra pela interface
    Dado um carrinho com 1 unidade de P005 e cupom "<CUPOM_VALIDO>"
    Quando preencho nome e sobrenome, e-mail válido e CEP válido
    E confirmo a compra
    Então devo ver a confirmação com número de pedido fictício
    E o subtotal confirmado deve ser 100,00
    E o desconto deve ser 10,00 e o frete deve ser 19,90
    E o total confirmado deve ser 109,90
    E o carrinho deve estar vazio ao iniciar uma nova compra

  Cenário: CT23 - Começar outra aba sem carrinho
    Dado que uma aba tem um carrinho com produtos
    Quando inicio uma aba independente da loja
    Então o carrinho dessa aba deve começar vazio

  Cenário: CT24 - Verificar acessibilidade crítica do carrinho
    Dado um carrinho com produto e controles de cupom visíveis
    Quando executo a auditoria automática de acessibilidade
    Então não deve haver violações classificadas como críticas
    E cada violação deve identificar os elementos afetados na evidência
```

CT23 segue a simplificação documentada de armazenamento por aba; ausência de estoque, e-mail, pagamento online e consulta posterior de pedidos não são defeitos. A acessibilidade automática de CT24 cobre somente as regras verificadas pelo axe; teclado, foco e leitura por tecnologia assistiva também fazem parte do charter.

## Rastreabilidade

| Critério | Cenários |
| --- | --- |
| CA01 — desconto de 10% | CT01, CT04, CT06, CT10, CT12, CT13, CT19 |
| CA02 — normalização | CT09 |
| CA03 — cupom inexistente | CT02, CT18, CT20 |
| CA04 — cupom expirado | CT03, CT18, CT20 |
| CA05 — um cupom por vez | CT05, CT08 |
| CA06/CA07 — limiar e frete fixo | CT04, CT06, CT07, CT13, CT14, CT25 |
| CA08 — subtotal antes do desconto | CT06, CT13 |
| CA09 — desconto fora do frete | CT01, CT04, CT11 |
| CA10 — máximo de cinco unidades | CT15, CT16, CT17 |
| CA11 — duas casas decimais | CT07, CT12, CT13 |
| Regras existentes de cliente e pedido | CT19, CT20, CT21, CT22 |
| Simplificações e acessibilidade | CT23, CT24 |
