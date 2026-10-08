# language: pt
@regression @frete
Funcionalidade: Reavaliar a elegibilidade do frete

  Cenário: CT-CA08-101 Atravessar o limite nos dois sentidos com cupom
    Dado que possuo uma mochila no carrinho
    Quando aplico o cupom válido
    E aumento a quantidade de "P005" em 2 unidades
    Então a quantidade de "P005" deve ser 3
    E o resumo deve apresentar subtotal "300,00", desconto "30,00", frete "0,00" e total "270,00"
    Quando diminuo a quantidade de "P005" em 2 unidades
    Então o resumo deve apresentar subtotal "100,00", desconto "10,00", frete "19,90" e total "109,90"
    E deve faltar "100,00" para o frete grátis

  Cenário: CT-CA05-102 Esvaziar carrinho descarta o cupom aplicado
    Dado que possuo uma mochila no carrinho
    Quando aplico o cupom válido
    E esvazio o carrinho
    Então o carrinho deve estar vazio
    Quando adiciono uma mochila ao carrinho vazio
    Então o campo de cupom deve estar disponível
    E o resumo deve apresentar subtotal "100,00", desconto "0,00", frete "19,90" e total "119,90"
