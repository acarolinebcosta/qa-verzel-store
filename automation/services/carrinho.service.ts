import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { ClienteTeste } from '../factories/cliente.factory';

export interface ItemCarrinho {
  produtoId: string;
  quantidade: number;
}

export interface PedidoEntrada {
  cliente: ClienteTeste;
  itens: ItemCarrinho[];
  cupom?: string;
}

/** A API é stateless: cada chamada recebe todos os itens do carrinho. */
export class CarrinhoService {
  constructor(private readonly request: APIRequestContext) {}

  calcular(itens: ItemCarrinho[], cupom?: string): Promise<APIResponse> {
    return this.calcularPayload({ itens, ...(cupom === undefined ? {} : { cupom }) });
  }

  /** Aceita dados brutos para verificar as validações de entrada documentadas. */
  calcularPayload(payload: unknown): Promise<APIResponse> {
    return this.request.post('/api/carrinho/calcular', { data: payload });
  }

  removerCupom(itens: ItemCarrinho[]): Promise<APIResponse> {
    return this.calcular(itens);
  }

  criarPedido(pedido: PedidoEntrada): Promise<APIResponse> {
    return this.request.post('/api/pedidos', { data: pedido });
  }
}
