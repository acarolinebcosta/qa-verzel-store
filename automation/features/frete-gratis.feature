# language: pt
@regression @frete
Funcionalidade: Frete calculado sobre o subtotal anterior ao desconto
  Como cliente da Verzel Store
  Quero frete grátis a partir de R$ 200,00 inclusive
  Para receber o benefício mesmo quando aplico um cupom

  Esquema do Cenário: Verificar valores na fronteira de frete grátis
    Dado que o carrinho está "<posição>" do limite de frete grátis
    Então o resumo deve apresentar subtotal "<subtotal>", desconto "0,00", frete "<frete>" e total "<total>"

    Exemplos:
      | posição    | subtotal | frete | total  |
      | abaixo     | 199,90   | 19,90 | 219,80 |
      | exatamente | 200,00   | 0,00  | 200,00 |
      | acima      | 300,00   | 0,00  | 300,00 |

  Cenário: Informar o valor faltante abaixo do limite
    Dado que o carrinho está "abaixo" do limite de frete grátis
    Então deve faltar "0,10" para o frete grátis

  @smoke @bug-001
  Cenário: Preservar frete grátis com cupom no subtotal de R$ 200,00
    Dado que o carrinho está "exatamente" do limite de frete grátis
    Quando aplico o cupom válido
    Então o resumo deve apresentar subtotal "200,00", desconto "20,00", frete "0,00" e total "180,00"

  Cenário: Recalcular frete ao reduzir a quantidade
    Dado que o carrinho contém 2 unidades do produto "P005"
    Quando diminuo a quantidade de "P005" em 1 unidades
    Então a quantidade de "P005" deve ser 1
    E o resumo deve apresentar subtotal "100,00", desconto "0,00", frete "19,90" e total "119,90"
    E deve faltar "100,00" para o frete grátis

  Cenário: Respeitar o limite de cinco unidades por produto
    Dado que o carrinho contém 5 unidades do produto "P008"
    Então a quantidade de "P008" deve ser 5
    E o aumento de quantidade de "P008" deve estar indisponível
    E o resumo deve apresentar subtotal "250,00", desconto "0,00", frete "0,00" e total "250,00"
