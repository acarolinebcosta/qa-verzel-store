import { randomUUID } from 'node:crypto';

export interface UsuarioTeste {
  nome: string;
  email: string;
  cep: string;
}

/** Dados fictícios: o domínio reservado .invalid nunca representa um cliente. */
export function criarUsuario(overrides: Partial<UsuarioTeste> = {}): UsuarioTeste {
  return {
    nome: 'Cliente Teste',
    email: `qa.${randomUUID()}@example.invalid`,
    cep: '01310-100',
    ...overrides,
  };
}
