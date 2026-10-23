import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.INTEGRATION_BASE_URL || 'http://localhost:3100';
const apiURL = process.env.INTEGRATION_API_URL;
const isLoopback = (value: string) =>
  ['localhost', '127.0.0.1', '::1'].includes(new URL(value).hostname);
if (!isLoopback(baseURL) || (apiURL && !isLoopback(apiURL))) {
  if (process.env.INTEGRATION_ALLOW_NON_LOOPBACK !== 'true')
    throw new Error('Integration tests chỉ chạy trên loopback; không có demo/production fallback.');
}

export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/integration.json' }]],
  use: {
    baseURL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
