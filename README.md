# QA Verzel Store

Estrutura inicial da suíte QA para a entrega VZS-142: cupom de desconto e frete grátis da Verzel Store, conforme documentação 2.3.0.

- [Loja](https://verzel-store.qa-test-verzel-store.workers.dev/)
- [Documentação](https://verzel-store.qa-test-verzel-store.workers.dev/documentacao)

## Preparar o ambiente

Requisitos: Node.js 20 ou superior, npm e acesso à loja pública.

```bash
cd automation
npm ci
npx playwright install chromium
cp .env.example .env
npm run typecheck
```

O arquivo `.env` é local. `.env.example` registra os cupons e o limite de frete reais do ambiente.

## Integração da suíte

Esta etapa adiciona dependências, configuração TypeScript/Playwright e parâmetros de ambiente. Serviços, fixtures, features, testes e reporter entram nos próximos PRs para `develop`. A configuração já referencia esses módulos; os comandos Playwright e `bddgen` exigem a integração do reporter antes de executar a suíte completa.

Os cenários, resultados, bugs e evidências serão documentados nas próximas etapas. A documentação final explicará a execução completa e a estrutura da entrega.
