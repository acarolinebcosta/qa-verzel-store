# language: pt
@regression @cupom
Funcionalidade: Cupom de desconto no carrinho
  Como cliente da Verzel Store
  Quero aplicar um único cupom no subtotal dos produtos
  Para pagar o valor definido nas regras da promoção

  Contexto:
    Dado que possuo uma mochila no carrinho

  @smoke
  Cenário: Aplicar cupom válido sem desconto sobre o frete
    Quando aplico o cupom válido
    Então o cupom válido deve estar aplicado
    E o resumo deve apresentar subtotal "100,00", desconto "10,00", frete "19,90" e total "109,90"

  @smoke
  Esquema do Cenário: Rejeitar códigos sem direito ao desconto
    Quando aplico o cupom de situação "<situação>"
    Então devo ver o erro "<mensagem>"
    E o resumo deve apresentar subtotal "100,00", desconto "0,00", frete "19,90" e total "119,90"

    Exemplos:
      | situação | mensagem        |
      | inválido | Cupom inválido. |
      | expirado | Cupom expirado. |

  Esquema do Cenário: Normalizar o código válido
    Quando aplico o cupom válido no formato "<formato>"
    Então o cupom válido deve estar aplicado
    E o resumo deve apresentar subtotal "100,00", desconto "10,00", frete "19,90" e total "109,90"

    Exemplos:
      | formato              |
      | minúsculas           |
      | espaços nas pontas   |
      | caixa mista          |

  Cenário: Remover o cupom aplicado
    Quando aplico o cupom válido
    E removo o cupom
    Então o campo de cupom deve estar disponível
    E o resumo deve apresentar subtotal "100,00", desconto "0,00", frete "19,90" e total "119,90"

  Cenário: Impedir o acúmulo de cupons
    Quando aplico o cupom válido
    Então o cupom válido deve estar aplicado
    E não devo poder informar outro cupom antes de remover o atual
    E o resumo deve apresentar subtotal "100,00", desconto "10,00", frete "19,90" e total "109,90"

  Cenário: Exigir um código preenchido
    Quando informo o código ""
    Então devo ver o erro "Informe um cupom."
    E o resumo deve apresentar subtotal "100,00", desconto "0,00", frete "19,90" e total "119,90"

  Cenário: Recalcular o desconto ao alterar a quantidade
    Quando aplico o cupom válido
    E aumento a quantidade de "P005" em 2 unidades
    Então a quantidade de "P005" deve ser 3
    E o resumo deve apresentar subtotal "300,00", desconto "30,00", frete "0,00" e total "270,00"
    Quando diminuo a quantidade de "P005" em 2 unidades
    Então o resumo deve apresentar subtotal "100,00", desconto "10,00", frete "19,90" e total "109,90"

  Cenário: Aplicar desconto abaixo do limite de frete grátis
    Quando diminuo o carrinho para uma camiseta
    E aplico o cupom válido
    Então o cupom válido deve estar aplicado
    E o resumo deve apresentar subtotal "59,90", desconto "5,99", frete "19,90" e total "73,81"
