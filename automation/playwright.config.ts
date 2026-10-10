import { defineConfig, devices } from '@playwright/test';
import { defineBddConfig } from 'playwright-bdd';
import { settings } from './support/env';

const bddTestDir = defineBddConfig({
  features: 'features/*.feature',
  steps: ['steps/*.steps.ts', 'fixtures/base.fixture.ts'],
  outputDir: '.features-gen',
});

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 1,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  outputDir: './test-results',
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['./reporters/markdown-reporter.ts'],
  ],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: settings.baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', testDir: './tests' },
    { name: 'chromium-bdd', testDir: bddTestDir },
  ],
});
