import type { APIRequestContext, APIResponse } from '@playwright/test';
import { CarrinhoService, type ItemCarrinho } from './carrinho.service';

/** A documentação não oferece cadastro ou endpoint dedicado de cupons. */
export class CupomService {
  private readonly carrinho: CarrinhoService;

  constructor(request: APIRequestContext) {
    this.carrinho = new CarrinhoService(request);
  }

  aplicar(codigo: string, itens: ItemCarrinho[]): Promise<APIResponse> {
    return this.carrinho.calcular(itens, codigo);
  }
}
