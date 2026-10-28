import { defineConfig, devices } from '@playwright/test';
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
if (
  process.env.E2E_EXPECT_CONNECTED === 'true' &&
  !['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseURL).hostname)
) {
  throw new Error('Connected E2E chỉ được chạy với backend/test storefront trên loopback.');
}
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [['list'], ['json', { outputFile: 'test-results/results.json' }]],
  use: {
    baseURL,
    headless: true,
    screenshot: 'only-on-failure',
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  },
  webServer: {
    command: process.env.CI ? 'npm run start' : 'npm run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 90000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
});
