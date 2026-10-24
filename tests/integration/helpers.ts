import {
  expect,
  request as playwrightRequest,
  type APIRequestContext,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { randomUUID } from 'node:crypto';

export const BASE_URL = process.env.INTEGRATION_BASE_URL || 'http://localhost:3100';
export const API_URL = process.env.INTEGRATION_API_URL || '';

export function assertSafeLoopback(url: string, name: string) {
  const parsed = new URL(url);
  const loopback =
    parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';
  if (!loopback && process.env.INTEGRATION_ALLOW_NON_LOOPBACK !== 'true') {
    throw new Error(
      `${name} phải là loopback; đặt INTEGRATION_ALLOW_NON_LOOPBACK=true chỉ khi chủ động cho phép.`,
    );
  }
}

export function syntheticUser() {
  const id = randomUUID().slice(0, 8);
  const phoneNumber = `09${Date.now().toString().slice(-8)}`;
  return {
    email: `integration.${Date.now()}.${id}@example.invalid`,
    password: `TiemHoa!${randomUUID()}a1`,
    fullName: `Integration ${id}`,
    phoneNumber,
  };
}

export async function newApi(): Promise<APIRequestContext> {
  assertSafeLoopback(BASE_URL, 'INTEGRATION_BASE_URL');
  if (!API_URL) throw new Error('Thiếu INTEGRATION_API_URL (phải trỏ backend local).');
  assertSafeLoopback(API_URL, 'INTEGRATION_API_URL');
  return playwrightRequest.newContext({
    baseURL: API_URL,
    extraHTTPHeaders: { Accept: 'application/json' },
  });
}

export function listOf<T>(value: unknown, keys: string[]): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value !== 'object' || value === null) return [];
  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) return candidate as T[];
  }
  return [];
}

export async function register(ctx: APIRequestContext, user = syntheticUser()) {
  const response = await ctx.post('/api/store/auth/register', {
    data: user,
    headers: { Origin: BASE_URL },
  });
  expect(response.status(), await response.text()).toBeGreaterThanOrEqual(200);
  expect(response.status()).toBeLessThan(300);
  const body = await response.json();
  expect(body).not.toHaveProperty('accessToken');
  expect(body).not.toHaveProperty('refreshToken');
  return { user, body };
}

export async function login(ctx: APIRequestContext, user: { email: string; password: string }) {
  const response = await ctx.post('/api/store/auth/login', {
    data: user,
    headers: { Origin: BASE_URL },
  });
  expect(response.ok(), await response.text()).toBeTruthy();
  const body = await response.json();
  expect(body).not.toHaveProperty('accessToken');
  expect(body).not.toHaveProperty('refreshToken');
  return body;
}

export async function authenticatedContext(browser: Browser) {
  const context = await browser.newContext({ baseURL: BASE_URL });
  const api = await context.request;
  const registration = await register(api);
  return { context, api, ...registration };
}

export async function expectNoClientToken(page: Page) {
  const values = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    body: document.body.innerText,
  }));
  expect(JSON.stringify(values)).not.toMatch(/accessToken|refreshToken|Bearer\s/i);
}

export async function closeAll(context: BrowserContext | APIRequestContext) {
  if ('dispose' in context) await context.dispose();
  else await context.close();
}
