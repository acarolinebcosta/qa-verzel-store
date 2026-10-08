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

  @hipotese
  Cenário: CT-HIP-002 Observar descarte do cupom ao esvaziar carrinho
    Dado que possuo uma mochila no carrinho
    Quando aplico o cupom válido
    E esvazio o carrinho
    Então o carrinho deve estar vazio
    Quando adiciono uma mochila ao carrinho vazio
    Então o campo de cupom deve estar disponível
    E o resumo deve apresentar subtotal "100,00", desconto "0,00", frete "19,90" e total "119,90"

  Cenário: CT-CA07-101 Remover produto com cupom reavalia desconto e frete
    Dado que o carrinho contém 2 unidades do produto "P005" e 1 unidades do produto "P008"
    Quando aplico o cupom válido
    Então o resumo deve apresentar subtotal "250,00", desconto "25,00", frete "0,00" e total "225,00"
    Quando removo o produto "P005"
    Então o resumo deve apresentar subtotal "50,00", desconto "5,00", frete "19,90" e total "64,90"
    E deve faltar "150,00" para o frete grátis
