# language: pt
@regression @cupom
Funcionalidade: Transições do estado do cupom

  Cenário: CT-CA05-101 Impedir segundo cupom antes de remover o atual
    Dado que possuo uma mochila no carrinho
    Quando aplico o cupom válido
    Então o cupom válido deve estar aplicado
    E não devo poder informar outro cupom antes de remover o atual
    Quando removo o cupom
    E aplico o cupom de situação "expirado"
    Então devo ver o erro "Cupom expirado."
    E o resumo deve apresentar subtotal "100,00", desconto "0,00", frete "19,90" e total "119,90"

  Cenário: CT-CA11-101 Recalcular centavos ao alterar quantidade com cupom
    Dado que o carrinho contém 1 unidades do produto "P001"
    Quando aplico o cupom válido
    Então o resumo deve apresentar subtotal "59,90", desconto "5,99", frete "19,90" e total "73,81"
    Quando aumento a quantidade de "P001" em 1 unidades
    Então o resumo deve apresentar subtotal "119,80", desconto "11,98", frete "19,90" e total "127,72"
    Quando diminuo a quantidade de "P001" em 1 unidades
    Então o resumo deve apresentar subtotal "59,90", desconto "5,99", frete "19,90" e total "73,81"
