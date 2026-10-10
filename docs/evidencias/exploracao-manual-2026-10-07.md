# Evidência — exploração da interface em 07/10/2026

**Origem:** transcrição dos resultados observados pelo agente Codex executor principal ao operar a loja por CUA no Chrome. **Horários relatados:** sessão inicial antes de 19h20 e complemento por volta de 19h26, America/Sao_Paulo; início exato não coletado. **Versão do Chrome:** não coletada. **Ambiente:** https://verzel-store.qa-test-verzel-store.workers.dev/. **Referência:** documentação VZS-142, versão 2.3.0.

Esta é uma evidência textual da sessão real, não uma execução humana. Capturas retornadas pela ferramenta de navegação foram inspecionadas durante a sessão; este arquivo não representa uma imagem exportada. Screenshots/relatórios posteriores da automação devem ser consultados separadamente quando disponíveis.

| Ordem | Ação observada | Resultado observado |
| --- | --- | --- |
| 1 | Adicionar uma Mochila Urbana 20L (P005) pela vitrine e abrir o carrinho | Subtotal R$ 100,00; frete R$ 19,90; total R$ 119,90 |
| 2 | Aplicar um código inexistente | Alerta “Cupom inválido.”; desconto R$ 0,00 |
| 3 | Aplicar VERAO2026 | Alerta “Cupom expirado.”; desconto R$ 0,00 |
| 4 | Aplicar literalmente ` bemvindo10 ` | Código normalizado para BEMVINDO10; desconto R$ 10,00; total R$ 109,90 |
| 5 | Inspecionar os controles após aplicação | Formulário de aplicação desapareceu; somente “Remover cupom” ficou disponível; não havia controle para aplicar segundo cupom |
| 6 | Aumentar P005 de uma para duas unidades mantendo o cupom | Subtotal R$ 200,00; desconto R$ 20,00; frete R$ 19,90; total R$ 199,90; interface informou que faltavam R$ 0,00 para frete grátis |
| 7 | Remover o cupom no carrinho de duas unidades de P005 | Subtotal R$ 200,00; desconto R$ 0,00; frete R$ 19,90; total R$ 219,90 |
| 8 | Aumentar P005 para três unidades | Subtotal R$ 300,00; frete exibido como grátis |
| 9 | Continuar aumentando P005 até cinco unidades | Botão de aumentar ficou desabilitado e a interface exibiu o limite de cinco unidades |
| 10 | Sem cupom, diminuir P005 de cinco para uma unidade | Subtotal de R$ 500,00 com frete grátis passou a subtotal de R$ 100,00, frete de R$ 19,90 e total de R$ 119,90 |
| 11 | Abrir `/carrinho` em uma nova aba independente | Nova aba exibiu “Seu carrinho está vazio”; aba original continuou com uma unidade de P005 |
| 12 | Na aba original, aplicar novamente BEMVINDO10 | Desconto de R$ 10,00 e total de R$ 109,90 |
| 13 | Ir a “Finalizar compra”, informar Pessoa Testadora, qa.manual@example.test e CEP 01310-100, e confirmar o pedido | Interface exibiu a confirmação “Pedido VZ-619077” |
| 14 | Inspecionar o resumo confirmado | P005×1, subtotal R$ 100,00, desconto R$ 10,00, frete R$ 19,90 e total R$ 109,90; contador do carrinho passou a zero |

## Comparação com o requisito

As etapas 1–5 confirmam o cálculo abaixo do limiar, mensagens negativas, normalização do código e o bloqueio de segundo cupom pela interface. A etapa 6 confirma o recálculo do desconto de R$ 10,00 para R$ 20,00 ao aumentar a quantidade, embora o frete falhe. A etapa 9 confirma o limite na interface. As etapas 10–14 confirmam recálculo de frete ao diminuir quantidade, isolamento entre abas e finalização fictícia com totais corretos em subtotal de R$ 100,00.

A etapa 6 reproduz **BUG-001**: em subtotal de R$ 200,00, o cupom deveria reduzir o total para R$ 180,00 com frete grátis segundo CA06 e CA08. O observado foi cobrança de R$ 19,90 e total de R$ 199,90.

A etapa 7 reproduz a condição sem cupom do mesmo **BUG-001**: o subtotal de R$ 200,00 também deveria ter frete grátis segundo CA06; o observado foi total de R$ 219,90 em vez de R$ 200,00. As duas condições são reunidas em um único defeito de limite inclusivo; não se conclui pela interface qual é a causa no código.

O relato manual não confirma remoção integral de um produto, normalização de todas as variantes nem acessibilidade. A automação tem registros próprios para remoção de produto e auditoria axe. Nenhum resultado de autenticação, estoque, envio de e-mail ou persistência de pedidos é inferido desta sessão.
