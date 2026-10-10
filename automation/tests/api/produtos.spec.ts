import { test, expect } from '@playwright/test';
import { schemaErro, schemaProduto, schemaProdutos } from '../../schemas/api.schema';

test.describe('Catálogo público', () => {
  test('CT-CA11-290 lista o catálogo sem credenciais @smoke @regression', async ({ request }) => {
    const response = await request.get('/api/produtos');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const produtos = schemaProdutos.parse(await response.json());
    expect(produtos).toHaveLength(8);
    const precosEsperados: Record<string, number> = {
      P001: 59.9, P002: 139.9, P003: 189.9, P004: 49.9,
      P005: 100, P006: 29.9, P007: 229.9, P008: 50,
    };
    expect(produtos.map(({ id }) => id).sort()).toEqual(Object.keys(precosEsperados).sort());
    for (const produto of produtos) expect(produto.preco).toBeCloseTo(precosEsperados[produto.id], 2);
  });

  test('CT-CA11-291 consulta um produto público pelo ID @regression', async ({ request }) => {
    const response = await request.get('/api/produtos/P001');
    expect(response.status()).toBe(200);
    const produto = schemaProduto.parse(await response.json());
    expect(produto).toMatchObject({ id: 'P001', nome: 'Camiseta Essencial' });
    expect(produto.preco).toBeCloseTo(59.9, 2);
  });

  test('CT-API-009 produto inexistente responde 404 com contrato de erro @regression', async ({ request }) => {
    const response = await request.get('/api/produtos/P999');
    expect(response.status()).toBe(404);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('PRODUTO_NAO_ENCONTRADO');
  });

  test('CT-API-010 método POST no catálogo responde 405 @regression', async ({ request }) => {
    const response = await request.post('/api/produtos', { data: {} });
    expect(response.status()).toBe(405);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('METODO_NAO_PERMITIDO');
  });

  test('CT-API-011 rota inexistente responde 404 @regression', async ({ request }) => {
    const response = await request.get('/api/rota-inexistente');
    expect(response.status()).toBe(404);
    expect(schemaErro.parse(await response.json()).erro.codigo).toBe('ROTA_NAO_ENCONTRADA');
  });
});
