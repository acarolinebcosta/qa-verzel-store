import { randomUUID } from 'node:crypto';

export interface ClienteTeste {
  nome: string;
  email: string;
  cep: string;
}

/** Dados fictícios: o domínio reservado .invalid nunca representa um cliente. */
export function criarCliente(overrides: Partial<ClienteTeste> = {}): ClienteTeste {
  return {
    nome: 'Cliente Teste',
    email: `qa.${randomUUID()}@example.invalid`,
    cep: '01310-100',
    ...overrides,
  };
}
