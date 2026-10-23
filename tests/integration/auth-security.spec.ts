import { test, expect } from '@playwright/test';
import {
  API_URL,
  BASE_URL,
  assertSafeLoopback,
  authenticatedContext,
  closeAll,
  expectNoClientToken,
  login,
} from './helpers';
import { readFile } from 'node:fs/promises';

test.beforeAll(() => {
  assertSafeLoopback(BASE_URL, 'INTEGRATION_BASE_URL');
  assertSafeLoopback(API_URL, 'INTEGRATION_API_URL');
});

test('status phản ánh cấu hình thật, không dùng demo', async ({ request }) => {
  const response = await request.get('/api/store/status');
  expect(response.status()).toBe(200);
  await expect(response.json()).resolves.toEqual({ configured: true, writesEnabled: true });
});

test('register/login không trả token JSON hoặc lưu token browser; cookie HttpOnly', async ({
  browser,
}) => {
  const { context, api, user } = await authenticatedContext(browser);
  const cookies = await context.cookies();
  expect(
    cookies.filter((cookie) => ['store_access', 'store_refresh'].includes(cookie.name)),
  ).toHaveLength(2);
  for (const cookie of cookies.filter((item) => item.name.startsWith('store_'))) {
    expect(cookie.httpOnly).toBeTruthy();
    expect(cookie.sameSite).toBe('Lax');
    expect(cookie.path).toBe('/');
  }
  const me = await api.get('/api/store/auth/me');
  expect(me.ok()).toBeTruthy();
  expect(await me.json()).not.toHaveProperty('accessToken');
  const page = await context.newPage();
  await page.goto('/tai-khoan');
  await expectNoClientToken(page);
  await api.post('/api/store/auth/logout', { headers: { Origin: BASE_URL } });
  await login(api, user);
  expect((await context.cookies()).some((cookie) => cookie.name === 'store_access')).toBeTruthy();
  await closeAll(context);
});

test('POST cross-origin bị chặn trước upstream', async ({ request }) => {
  const response = await request.post('/api/store/auth/login', {
    data: { email: 'nobody@example.invalid', password: 'never' },
    headers: { Origin: 'https://evil.example' },
  });
  expect(response.status()).toBe(403);
  expect(await response.json()).toEqual({ error: 'Origin không hợp lệ.' });
});

test('route protected từ chối khi chưa đăng nhập và payments bị allow-list từ chối', async ({
  request,
}) => {
  const [orders, bookings, custom, payments] = await Promise.all([
    request.get('/api/store/orders'),
    request.get('/api/store/bookings'),
    request.get('/api/store/custom-orders'),
    request.post('/api/store/payments', { data: {}, headers: { Origin: BASE_URL } }),
  ]);
  expect(orders.status()).toBe(401);
  expect(bookings.status()).toBe(401);
  expect(custom.status()).toBe(401);
  expect(payments.status()).toBe(404);
});

test('logout xoá cookie và revoke session; user thứ hai không đọc được tài nguyên user một', async ({
  browser,
}) => {
  const first = await authenticatedContext(browser);
  const second = await authenticatedContext(browser);
  const firstMe = await first.api.get('/api/store/auth/me');
  expect(firstMe.ok()).toBeTruthy();
  const meData = await firstMe.json();
  const firstId = meData.id || meData.userId;
  const secondOwn = await second.api.get('/api/store/auth/me');
  expect(secondOwn.ok()).toBeTruthy();
  expect((await secondOwn.json()).id || '').not.toBe(firstId);
  const logout = await first.api.post('/api/store/auth/logout', { headers: { Origin: BASE_URL } });
  expect(logout.ok()).toBeTruthy();
  const revoked = await first.api.get('/api/store/auth/me');
  expect(revoked.status()).toBe(401);
  expect(
    (await first.context.cookies()).filter((cookie) => cookie.name.startsWith('store_')),
  ).toHaveLength(0);
  await Promise.all([closeAll(first.context), closeAll(second.context)]);
});

test('customer không có quyền management (403), nếu có admin credentials thì xác nhận admin đọc được', async ({
  browser,
}) => {
  const customer = await authenticatedContext(browser);
  const forbidden = await customer.api.get('/api/store/management/products');
  expect(forbidden.status()).toBe(403);
  await customer.context.close();
  const file = process.env.ADMIN_TEST_CREDENTIALS_FILE;
  test.skip(!file, 'Thiếu ADMIN_TEST_CREDENTIALS_FILE; không hardcode secret.');
  const raw = JSON.parse(await readFile(file!, 'utf8')) as { email: string; password: string };
  const admin = await browser.newContext({ baseURL: BASE_URL });
  await login(admin.request, raw);
  const products = await admin.request.get('/api/store/management/products');
  expect(products.status()).toBe(200);
  await admin.close();
});
