import fs from 'node:fs';
import path from 'node:path';
import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

const clean = (value: string): string => value
  .replace(/\u001b\[[0-9;]*m/g, '')
  .replace(/\|/g, '\\|')
  .replace(/[\r\n]+/g, '<br>');

export default class MarkdownReporter implements Reporter {
  private suite!: Suite;
  private config!: FullConfig;
  private started = new Date();
  private reportPath = path.resolve(__dirname, '../../docs/execucao-automatica.md');
  private fatalErrors: string[] = [];

  onBegin(config: FullConfig, suite: Suite): void {
    this.config = config;
    this.suite = suite;
    this.started = new Date();
  }

  onError(error: { message?: string }): void {
    this.fatalErrors.push(error.message || 'Erro global sem mensagem.');
  }

  private attachments(test: TestCase): string {
    return test.results.flatMap((result: TestResult) => result.attachments
      .filter(attachment => attachment.path)
      .map(attachment => {
        const relative = path.relative(path.dirname(this.reportPath), attachment.path!).split(path.sep).join('/');
        return `[${clean(attachment.name)} (tentativa ${result.retry + 1})](<${relative}>)`;
      })).join('<br>') || '—';
  }

  onEnd(result: FullResult): void {
    const tests = this.suite?.allTests() || [];
    const counts = { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
    const rows = tests.map(test => {
      const outcome = test.outcome();
      counts[outcome]++;
      const final = test.results.at(-1);
      const title = test.titlePath().filter(Boolean).join(' › ');
      const id = title.match(/CT-(?:CA\d{2}|API|CLI|HIP)-\d{3}/)?.[0] || '—';
      const errors = test.results.flatMap(attempt => attempt.errors.map(error => error.message || '')).filter(Boolean);
      const annotation = [...new Set([
        ...test.annotations.filter(item => item.type === 'issue').map(item => item.description || ''),
        ...test.annotations.filter(item => item.type === 'hypothesis').map(item => item.description || ''),
        ...test.tags.filter(tag => /^@bug-\d+$/i.test(tag)).map(tag => tag.slice(1).toUpperCase()),
      ])].filter(Boolean).join(', ');
      const hipotese = test.annotations.some(item => item.type === 'hypothesis') || test.tags.includes('@hipotese');
      const classificacao = outcome === 'expected' ? 'PASSOU' : hipotese && outcome === 'unexpected'
        ? 'FALHOU — investigar hipótese; não comprova bug' : final?.status === 'skipped' ? 'NÃO EXECUTADO' : 'FALHOU';
      return `| ${id} | ${clean(title)} | ${classificacao}: ${outcome} / ${final?.status || 'não executado'} | ${test.results.length} | ${test.results.reduce((sum, attempt) => sum + attempt.duration, 0)} ms | ${this.attachments(test)} | ${clean(annotation || '—')} | ${clean(errors.at(-1) || '—')} |`;
    });
    const content = [
      '# Execução automática — Verzel Store', '',
      `Início: ${this.started.toISOString()}. Fim: ${new Date().toISOString()}. Estado global: **${result.status}**.`, '',
      `Playwright ${this.config?.version || '—'}; ${tests.length} testes; ${counts.expected} resultados esperados; ${counts.unexpected} falhas inesperadas; ${counts.flaky} instáveis; ${counts.skipped} ignorados.`, '',
      'Resultado esperado não significa necessariamente aprovação: uma falha marcada como esperada aparece com seu status real na tabela. A suíte mantém os defeitos encontrados como falhas inesperadas.', '',
      '| ID | Teste | Resultado / status final | Tentativas | Duração acumulada | Evidências | Bug / hipótese | Erro da última tentativa com falha |',
      '| --- | --- | --- | --- | --- | --- | --- | --- |', ...rows, '',
      ...this.fatalErrors.map(error => `Erro global: ${clean(error)}`), '',
      'Os anexos e o HTML ficam em automation/test-results/ e automation/playwright-report/. Este relatório é regenerado e ignorado pelo Git; uma cópia datada da execução auditada fica em docs/evidencias/.', '',
    ].join('\n');
    fs.mkdirSync(path.dirname(this.reportPath), { recursive: true });
    fs.writeFileSync(this.reportPath, content, 'utf8');
  }
}
