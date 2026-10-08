import { expect } from '@playwright/test';
import type { ResumoCarrinho } from '../schemas/api.schema';

const camposFinanceiros = ['subtotal', 'desconto', 'frete', 'valorFaltanteFreteGratis', 'total'] as const;

/** Recebe o resumo já validado pelo Zod e compara reais numericamente em centavos. */
export function esperarResumoAPI(resumo: ResumoCarrinho, esperado: Record<string, unknown>): void {
  const demaisCampos = { ...esperado };
  for (const campo of camposFinanceiros) {
    const valorEsperado = esperado[campo];
    if (typeof valorEsperado === 'number') {
      expect(resumo[campo], `Valor financeiro de ${campo}`).toBeCloseTo(valorEsperado, 2);
      delete demaisCampos[campo];
    }
  }
  expect(resumo).toMatchObject(demaisCampos);
}
