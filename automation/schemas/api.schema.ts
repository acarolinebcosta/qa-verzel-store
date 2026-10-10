import { z } from 'zod';

/** Usa tolerância apenas para representação binária; continua exigindo centavos. */
export const schemaValorMonetario = z.number().finite().nonnegative().refine(
  (valor) => Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-7,
  'Valor monetário deve ter no máximo duas casas decimais.',
);

export const schemaProduto = z.object({
  id: z.string().regex(/^P\d{3}$/),
  nome: z.string().min(1),
  descricao: z.string().min(1),
  categoria: z.string().min(1),
  preco: schemaValorMonetario,
}).passthrough();

export const schemaProdutos = z.array(schemaProduto).min(1).refine(
  (produtos) => new Set(produtos.map(({ id }) => id)).size === produtos.length,
  'O catálogo não deve duplicar IDs de produto.',
);

const schemaItemResumo = z.object({
  produtoId: z.string().regex(/^P\d{3}$/),
  nome: z.string().min(1),
  precoUnitario: schemaValorMonetario,
  quantidade: z.number().int().min(1).max(5),
  total: schemaValorMonetario,
}).passthrough();

const schemaCupom = z.object({
  codigo: z.string().min(1),
  aplicado: z.boolean(),
  mensagem: z.string().min(1),
}).passthrough().nullable();

const resumoShape = {
  itens: z.array(schemaItemResumo).min(1),
  subtotal: schemaValorMonetario,
  desconto: schemaValorMonetario,
  frete: schemaValorMonetario,
  freteGratis: z.boolean(),
  valorFaltanteFreteGratis: schemaValorMonetario,
  total: schemaValorMonetario,
  cupom: schemaCupom,
};

export const schemaResumoCarrinho = z.object(resumoShape).passthrough();

export const schemaPedido = z.object({
  ...resumoShape,
  numero: z.string().regex(/^VZ-\d{6}$/),
  criadoEm: z.string().datetime({ offset: true }),
  cliente: z.object({
    nome: z.string().min(3),
    email: z.string().email(),
    cep: z.string().regex(/^\d{8}$/),
  }).passthrough(),
}).passthrough();

export const schemaErro = z.object({
  erro: z.object({
    codigo: z.enum([
      'JSON_INVALIDO', 'ROTA_NAO_ENCONTRADA', 'PRODUTO_NAO_ENCONTRADO',
      'METODO_NAO_PERMITIDO', 'ITENS_OBRIGATORIOS', 'ITEM_INVALIDO',
      'ITEM_DUPLICADO', 'QUANTIDADE_INVALIDA', 'QUANTIDADE_MAXIMA_EXCEDIDA',
      'DADOS_INVALIDOS', 'CUPOM_INVALIDO', 'CUPOM_EXPIRADO',
    ]),
    mensagem: z.string().min(1),
    campo: z.string().min(1).optional(),
    campos: z.array(z.object({
      campo: z.string().min(1),
      mensagem: z.string().min(1),
    }).passthrough()).min(1).optional(),
  }).passthrough(),
}).passthrough();

export type ResumoCarrinho = z.infer<typeof schemaResumoCarrinho>;
