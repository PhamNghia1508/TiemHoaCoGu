import { test, expect, type APIRequestContext, type APIResponse } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { BASE_URL, login, syntheticUser, authenticatedContext } from './helpers';
const headers = { Origin: BASE_URL };
async function ok(response: APIResponse) {
  expect(response.ok(), await response.text()).toBeTruthy();
  return response;
}
async function admin(api: APIRequestContext) {
  await login(
    api,
    JSON.parse(await readFile(process.env.ADMIN_TEST_CREDENTIALS_FILE!, 'utf8')) as {
      email: string;
      password: string;
    },
  );
}

test('CMS voucher CRUD, account role/reset, permission và customer guard', async ({
  request,
  browser,
}) => {
  await admin(request);
  const key = randomUUID().slice(0, 8);
  const voucher = {
    code: `TEST-${key}`,
    description: 'Synthetic test',
    discountType: 'Percentage',
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: null,
    startDate: new Date(Date.now() - 86400000).toISOString(),
    endDate: new Date(Date.now() + 86400000).toISOString(),
    usageLimit: 10,
  };
  const created = (await (
    await ok(await request.post('/api/store/management/vouchers', { headers, data: voucher }))
  ).json()) as { id: string };
  await ok(
    await request.put(`/api/store/management/vouchers/${created.id}`, {
      headers,
      data: { ...voucher, discountValue: 15 },
    }),
  );
  await ok(
    await request.patch(`/api/store/management/vouchers/${created.id}/active?value=false`, {
      headers,
      data: {},
    }),
  );
  const list = (await (
    await ok(await request.get(`/api/store/management/vouchers?search=${voucher.code}`))
  ).json()) as { items: { id: string; discountValue: number; isActive: boolean }[] };
  expect(list.items.find((x) => x.id === created.id)).toMatchObject({
    discountValue: 15,
    isActive: false,
  });
  const user = syntheticUser();
  const account = (await (
    await ok(
      await request.post('/api/store/management/accounts', {
        headers,
        data: { ...user, role: 'Customer' },
      }),
    )
  ).json()) as { id: string };
  await ok(
    await request.put(`/api/store/management/accounts/${account.id}`, {
      headers,
      data: { ...user, role: 'Staff', isActive: true },
    }),
  );
  await ok(
    await request.post(`/api/store/management/accounts/${account.id}/reset-password`, {
      headers,
      data: { newPassword: `Changed!${randomUUID()}Aa1` },
    }),
  );
  const permissions = (await (
    await ok(await request.get('/api/store/management/permissions'))
  ).json()) as { roles: { role: string }[] };
  expect(permissions.roles.map((x) => x.role)).toContain('Admin');
  const customer = await authenticatedContext(browser);
  expect((await customer.api.get('/api/store/management/accounts')).status()).toBe(403);
  expect(
    (
      await customer.api.patch(`/api/store/management/vouchers/${created.id}/active?value=true`, {
        headers,
        data: {},
      })
    ).status(),
  ).toBe(403);
  await customer.context.close();
});

test('CMS media upload, gallery CRUD và inventory dùng đúng contract', async ({ request }) => {
  await admin(request);
  const key = randomUUID().slice(0, 8);
  const category = (await (
    await ok(
      await request.post('/api/store/management/categories', {
        headers,
        data: { code: `CAT-${key}`, name: `Test ${key}` },
      }),
    )
  ).json()) as { id: string };
  const body = {
    categoryId: category.id,
    code: `PRODUCT-${key}`,
    name: `Synthetic ${key}`,
    price: 100000,
    isCustomizable: false,
    isPreOrder: false,
    isActive: true,
    shippingWeightGrams: 500,
  };
  const product = (await (
    await ok(await request.post('/api/store/management/products', { headers, data: body }))
  ).json()) as { id: string };
  await ok(
    await request.put(`/api/store/management/inventory/${product.id}?quantity=7`, {
      headers,
      data: {},
    }),
  );
  await ok(
    await request.put(`/api/store/management/products/${product.id}`, { headers, data: body }),
  );
  const detail = (await (
    await ok(await request.get(`/api/store/management/products/${product.id}`))
  ).json()) as { isCustomizable: boolean; isPreOrder: boolean; quantityAvailable: number };
  expect(detail).toMatchObject({ isCustomizable: false, isPreOrder: false, quantityAvailable: 7 });
  const image = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+yGZkAAAAASUVORK5CYII=',
    'base64',
  );
  const media = (await (
    await ok(
      await request.post('/api/store/management/media', {
        headers,
        multipart: { file: { name: 'test.png', mimeType: 'image/png', buffer: image } },
      }),
    )
  ).json()) as { url: string };
  expect(media.url).toMatch(/^\/api\/media\/[a-f0-9]{32}\.png$/);
  const proxy = await request.get(media.url);
  expect(proxy.status()).toBe(200);
  expect(proxy.headers()['content-type']).toContain('image/png');
  const gallery = (await (
    await ok(
      await request.post(`/api/store/management/products/${product.id}/images`, {
        headers,
        data: { imageUrl: media.url, displayOrder: 0 },
      }),
    )
  ).json()) as { id: string };
  await ok(
    await request.put(`/api/store/management/products/${product.id}/images/${gallery.id}`, {
      headers,
      data: { imageUrl: media.url, displayOrder: 1 },
    }),
  );
  await ok(
    await request.delete(`/api/store/management/products/${product.id}/images/${gallery.id}`, {
      headers,
    }),
  );
  await ok(await request.delete(`/api/store/management/products/${product.id}`, { headers }));
  await ok(await request.delete(`/api/store/management/categories/${category.id}`, { headers }));
});

test('CMS CSV và staff delivery read, payment provider không được mở', async ({ request }) => {
  await admin(request);
  const csv = await ok(await request.get('/api/store/management/reports/orders.csv'));
  expect(csv.headers()['content-type']).toContain('text/csv');
  expect(csv.headers()['content-disposition']).toContain('attachment');
  expect(await csv.text()).not.toBe('null');
  const orders = (await (
    await ok(await request.get('/api/store/management/orders?page=1&pageSize=50'))
  ).json()) as { items: { id: string }[] };
  expect(orders.items.length).toBeGreaterThan(0);
  for (const order of orders.items.slice(0, 3))
    await ok(await request.get(`/api/store/orders/staff/${order.id}/deliveries`));
  expect((await request.post('/api/store/payments', { headers, data: {} })).status()).toBe(404);
});
