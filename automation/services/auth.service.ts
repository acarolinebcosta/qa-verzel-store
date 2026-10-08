/**
 * Login e cadastro estão explicitamente fora do escopo da Verzel Store.
 * Os endpoints documentados são públicos; não existem credenciais de teste
 * ou endpoints de autenticação a chamar.
 */
export interface PoliticaAutenticacao {
  exigeAutenticacao: false;
  endpointsPublicos: readonly string[];
}

export const politicaAutenticacao: PoliticaAutenticacao = {
  exigeAutenticacao: false,
  endpointsPublicos: ['/api/produtos', '/api/produtos/{id}', '/api/carrinho/calcular', '/api/pedidos'],
};
