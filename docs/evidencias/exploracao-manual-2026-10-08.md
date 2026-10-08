# Exploração manual — 08/10/2026

Executor: agente Codex operando a interface por CUA no Chrome/macOS. Não é execução humana. Marca de controle 03:35:01; encerramento 03:36:36 America/Sao_Paulo. Início exato e versão do Chrome não coletados; duração exata não declarada. Interações iniciais ocorreram antes da marca de controle.

1. Aba nova da loja; adicionar P005×1. Carrinho exibiu subtotal 100,00, desconto 0,00, frete 19,90, total 119,90 e faltante 100,00.
2. Aplicar código literal ` bemvindo10 `. UI exibiu BEMVINDO10 aplicado, desconto 10,00, total 109,90 e frete 19,90.
3. Aumentar P005 para 2. Subtotal 200,00, desconto 20,00, frete 19,90, total 199,90 e faltante 0,00. Esperado: frete 0,00 e total 180,00. BUG-001 reproduzido.
4. Aumentar para 3. Subtotal 300,00, desconto 30,00, frete Grátis e total 270,00.
5. Com cupom ativo, contagem do campo “Cupom de desconto” = 0 e botão “Aplicar cupom” = 0; somente “Remover cupom” disponível. Não há controle normal para inserir segundo código.
6. Diminuir para 1, em dois cliques. Subtotal 100,00, desconto 10,00, frete 19,90, total 109,90 e faltante 100,00.
7. Remover cupom. Campo reapareceu, desconto 0,00 e total 119,90.
8. Aplicar VERAO2026. Mensagem “Cupom expirado.”, desconto 0,00 e total 119,90.
9. Ir a Produtos, adicionar P008×1, voltar ao Carrinho e aumentar P005 para 2. Cupom não aplicado: subtotal 250,00, desconto 0,00, frete Grátis e total 250,00.
10. Remover o produto P005 (duas unidades). P008×1 permaneceu: subtotal 50,00, desconto 0,00, frete 19,90, total 69,90 e faltante 150,00. CT-CA07-002 aprovado manualmente.

Nenhuma cobrança ou persistência foi exigida. Descoberta: a falha de frete é reproduzível na fronteira exata; subtotal 300 e o retorno a 100 se comportaram corretamente. A causa no código do produto não foi investigada.

Evidência desta sessão: transcrição das observações de interface acima. Screenshots e traces versionados de 08/10 são da execução automatizada independente, identificada no relatório; não são apresentados como capturas desta sessão manual.
