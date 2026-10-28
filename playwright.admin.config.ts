import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL || process.env.ADMIN_UX_BASE_URL || 'http://127.0.0.1:3104';
if (!['127.0.0.1', 'localhost', '[::1]'].includes(new URL(baseURL).hostname))
  throw new Error('Admin UI fixtures chỉ chạy trên loopback, không dùng preview/production.');
const chromiumPath =
  process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);

export default defineConfig({
  testDir: './tests/admin',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  workers: 2,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/admin-results.json' }]],
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    reducedMotion: 'reduce',
    launchOptions: chromiumPath ? { executablePath: chromiumPath } : {},
  },
  webServer: {
    command: 'node scripts/admin-ui-preview.mjs',
    url: `${baseURL}/quan-tri`,
    env: { ADMIN_UI_PORT: new URL(baseURL).port || '3104' },
    reuseExistingServer: false,
    timeout: 90_000,
  },
  projects: [
    {
      name: 'desktop1440x1000',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'tablet834x1112',
      use: { ...devices['Desktop Chrome'], viewport: { width: 834, height: 1112 } },
    },
    {
      name: 'mobile390x844',
      use: { ...devices['Pixel 5'], viewport: { width: 390, height: 844 } },
    },
    {
      name: 'narrow320x740',
      use: { ...devices['Pixel 5'], viewport: { width: 320, height: 740 } },
    },
  ],
});
