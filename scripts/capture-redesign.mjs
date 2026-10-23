import { chromium } from '@playwright/test';
import fs from 'node:fs';
const base = process.env.PREVIEW_URL || 'http://localhost:3100';
(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  });
  fs.mkdirSync('artifacts', { recursive: true });
  for (const shot of [
    { name: 'redesign-desktop', path: '/', width: 1440, height: 1000 },
    { name: 'redesign-mobile', path: '/', width: 390, height: 844 },
    { name: 'redesign-shop', path: '/cua-tiem/', width: 1440, height: 1080 },
    { name: 'redesign-product', path: '/cua-tiem/trang-non/', width: 1440, height: 1080 },
    { name: 'redesign-workshop', path: '/workshop/', width: 1440, height: 1080 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 1,
    });
    await page.goto(new URL(shot.path, base).toString(), {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    await page.locator('main h1').waitFor({ state: 'visible' });
    await page.evaluate(() =>
      Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 5000))]),
    );
    await page.waitForLoadState('load', { timeout: 10000 }).catch(() => {});
    await page.screenshot({ path: `artifacts/${shot.name}.png`, animations: 'disabled' });
    console.log(`${shot.name}: ${page.url()}`);
    await page.close();
  }
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
