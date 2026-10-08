import { test, expect } from '@playwright/test';
import { politicaAutenticacao } from '../../services/auth.service';
import { schemaErro, schemaProduto, schemaProdutos } from '../../schemas/api.schema';

test.describe('API pública — autenticação fora do escopo documentado', () => {
  test('lista o catálogo sem credenciais @smoke @regression', async ({ request }) => {
    expect(politicaAutenticacao.exigeAutenticacao).toBe(false);
    const response = await request.get('/api/produtos');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const produtos = schemaProdutos.parse(await response.json());
    expect(produtos).toHaveLength(8);
    expect(Object.fromEntries(produtos.map(({ id, preco }) => [id, preco]))).toEqual({
      P001: 59.9, P002: 139.9, P003: 189.9, P004: 49.9,
      P005: 100, P006: 29.9, P007: 229.9, P008: 50,
    });
  });

  test('consulta um produto público pelo ID @regression', async ({ request }) => {
    const response = await request.get('/api/produtos/P001');
    expect(response.status()).toBe(200);
    expect(schemaProduto.parse(await response.json())).toMatchObject({
      id: 'P001', nome: 'Camiseta Essencial', preco: 59.9,
    });
  });

  test('produto inexistente responde 404 com contrato de erro @regression', async ({ request }) => {
    const response = await request.get('/api/produtos/P999');
    expect(response.status()).toBe(404);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('PRODUTO_NAO_ENCONTRADO');
  });
});
