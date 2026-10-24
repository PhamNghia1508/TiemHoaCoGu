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
    // Synthetic measurements exist only to exercise the Admin API contract.
    shippingWeightGrams: 500,
    packageLengthCm: 30,
    packageWidthCm: 20,
    packageHeightCm: 10,
    packagingSpecsConfirmed: true,
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
  ).json()) as {
    isCustomizable: boolean;
    isPreOrder: boolean;
    quantityAvailable: number;
    shippingWeightGrams: number;
    packageLengthCm: number;
    packageWidthCm: number;
    packageHeightCm: number;
    packagingSpecsConfirmed: boolean;
  };
  expect(detail).toMatchObject({
    isCustomizable: false,
    isPreOrder: false,
    quantityAvailable: 7,
    shippingWeightGrams: 500,
    packageLengthCm: 30,
    packageWidthCm: 20,
    packageHeightCm: 10,
    packagingSpecsConfirmed: true,
  });
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

test('CMS CSV và staff delivery read, payment provider không được mở', async ({
  request,
  browser,
}) => {
  await admin(request);
  const customer = await authenticatedContext(browser);
  try {
    // Provision through real business APIs: this test must also pass on a fresh DB.
    const key = randomUUID().slice(0, 8);
    const category = (await (
      await ok(
        await request.post('/api/store/management/categories', {
          headers,
          data: { code: `CSV-C-${key}`, name: `CSV ${key}` },
        }),
      )
    ).json()) as { id: string };
    const product = (await (
      await ok(
        await request.post('/api/store/management/products', {
          headers,
          data: {
            categoryId: category.id,
            code: `CSV-P-${key}`,
            name: `CSV product ${key}`,
            price: 125000,
            isCustomizable: true,
            isPreOrder: false,
            isActive: true,
            // This product is only used for custom-order tests and remains unconfirmed for shipping.
            shippingWeightGrams: 500,
          },
        }),
      )
    ).json()) as { id: string };
    const custom = (await (
      await ok(
        await customer.api.post('/api/store/custom-orders', {
          headers,
          data: { productId: product.id, quantity: 1, description: 'Synthetic CSV setup' },
        }),
      )
    ).json()) as { id: string };
    await ok(
      await request.post(`/api/store/custom-orders/${custom.id}/quote`, {
        headers,
        data: {
          unitPrice: 125000,
          depositPercent: 50,
          completionDate: new Date(Date.now() + 14 * 86400000).toISOString(),
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          adminNote: 'Synthetic CSV quote',
        },
      }),
    );
    const quote = (await (
      await ok(await customer.api.get(`/api/store/custom-orders/${custom.id}`))
    ).json()) as { currentRevision: number };
    await ok(
      await customer.api.post(`/api/store/custom-orders/${custom.id}/approve`, {
        headers,
        data: { version: quote.currentRevision },
      }),
    );
    const created = (await (
      await ok(
        await customer.api.post(`/api/store/custom-orders/${custom.id}/checkout`, {
          headers,
          data: {
            shippingAddress: '12 Synthetic CSV Street',
            note: 'Unpaid integration setup; no payment provider',
            idempotencyKey: randomUUID(),
          },
        }),
      )
    ).json()) as { orderId: string; orderCode: string; paymentStatus: string };
    expect(created.paymentStatus).toBe('Unpaid');
    const stored = await (
      await ok(await customer.api.get(`/api/store/orders/${created.orderId}`))
    ).json();
    expect(stored).toMatchObject({
      id: created.orderId,
      paymentStatus: 'Unpaid',
      totalAmount: 125000,
    });

    const search = encodeURIComponent(created.orderCode);
    const csv = await ok(
      await request.get(`/api/store/management/reports/orders.csv?search=${search}`),
    );
    expect(csv.headers()['content-type']).toContain('text/csv');
    expect(csv.headers()['content-disposition']).toContain('attachment');
    const text = await csv.text();
    expect(text).toContain(created.orderCode);
    expect(text).toContain('Unpaid');
    expect(text).toContain('125000.00');
    const orders = (await (
      await ok(
        await request.get(`/api/store/management/orders?search=${search}&page=1&pageSize=50`),
      )
    ).json()) as { items: { id: string; paymentStatus: string }[] };
    expect(orders.items).toContainEqual(
      expect.objectContaining({ id: created.orderId, paymentStatus: 'Unpaid' }),
    );
    const deliveries = await ok(
      await request.get(`/api/store/orders/staff/${created.orderId}/deliveries`),
    );
    expect(await deliveries.json()).toEqual([]);
    expect((await request.post('/api/store/payments', { headers, data: {} })).status()).toBe(404);
  } finally {
    await customer.context.close();
  }
});
