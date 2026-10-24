import { test, expect, type APIRequestContext } from '@playwright/test';
import { BASE_URL, authenticatedContext, closeAll, listOf, login } from './helpers';

type Product = { id: string; isCustomizable?: boolean; name?: string };
type Workshop = { id: string };
type Session = { id: string; capacity: number; bookedSlots: number; sessionDate: string };
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const origin = { Origin: BASE_URL };
const json = (value: unknown) => value as Record<string, unknown>;

async function products(request: APIRequestContext): Promise<Product[]> {
  const response = await request.get('/api/store/catalog/products');
  expect(response.status(), await response.text()).toBe(200);
  return listOf<Product>(await response.json(), ['items', 'data', 'products']);
}

async function openSession(api: APIRequestContext): Promise<{ id: string; ticketCount: number }> {
  const workshopResponse = await api.get('/api/store/workshops');
  expect(workshopResponse.status(), await workshopResponse.text()).toBe(200);
  const workshops = listOf<Workshop>(await workshopResponse.json(), ['items', 'data', 'workshops']);
  for (const workshop of workshops) {
    const sessionsResponse = await api.get(`/api/store/workshops/${workshop.id}/sessions`);
    expect(sessionsResponse.status(), await sessionsResponse.text()).toBe(200);
    const sessions = listOf<Session>(await sessionsResponse.json(), ['items', 'data', 'sessions']);
    const session = sessions.find((item) => item.capacity - item.bookedSlots > 0);
    if (session) return { id: session.id, ticketCount: 1 };
  }
  throw new Error('Seed contract requires one open workshop session.');
}

test('catalog BFF trả product GUID thật và detail SSR không dùng dữ liệu demo', async ({
  request,
  page,
}) => {
  const catalog = await products(request);
  expect(catalog.length).toBeGreaterThanOrEqual(2);
  const product = catalog.find((item) => guid.test(item.id));
  expect(product).toBeDefined();
  const detail = await request.get(`/api/store/catalog/products/${product!.id}`);
  expect(detail.status(), await detail.text()).toBe(200);
  expect(json(await detail.json()).id).toBe(product!.id);
  const pageResponse = await page.goto(`/cua-tiem/${product!.id}`);
  expect(pageResponse?.status()).toBe(200);
  await expect(page.locator('body')).not.toContainText(/Dữ liệu mẫu|Trăng Non/);
});

test('custom order: customer create/list/detail, admin quote, customer approve và checkout unpaid', async ({
  browser,
}) => {
  const customer = await authenticatedContext(browser);
  const adminFile = process.env.ADMIN_TEST_CREDENTIALS_FILE;
  expect(adminFile, 'ADMIN_TEST_CREDENTIALS_FILE phải trỏ admin.json').toBeTruthy();
  const adminCredentials = (await import('node:fs/promises')).readFile(adminFile!, 'utf8');
  const admin = JSON.parse(await adminCredentials) as { email: string; password: string };
  const adminContext = await browser.newContext({ baseURL: BASE_URL });
  const adminApi = adminContext.request;
  const adminLogin = await login(adminApi, admin);
  expect(adminLogin).toBeDefined();
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const categoryResponse = await adminApi.post('/api/store/management/categories', {
    data: {
      code: `INT-${suffix}`.slice(0, 40),
      name: `Integration ${suffix}`,
      description: 'Synthetic integration category',
    },
    headers: origin,
  });
  expect(categoryResponse.status(), await categoryResponse.text()).toBe(200);
  const category = json(await categoryResponse.json());
  const productResponse = await adminApi.post('/api/store/management/products', {
    data: {
      categoryId: category.id,
      code: `INT-P-${suffix}`.slice(0, 80),
      name: `Integration Custom ${suffix}`,
      price: 250000,
      originalPrice: 300000,
      description: 'Synthetic customizable integration product',
      isCustomizable: true,
      isPreOrder: false,
      shippingWeightGrams: 500,
      isActive: true,
    },
    headers: origin,
  });
  expect(productResponse.status(), await productResponse.text()).toBe(200);
  const product = json(await productResponse.json()) as Product;
  expect(product.isCustomizable).toBeTruthy();
  const create = await customer.api.post('/api/store/custom-orders', {
    data: {
      productId: product!.id,
      quantity: 1,
      description: 'Integration custom order with exact contract',
      requestedCompletionDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    },
    headers: origin,
  });
  expect(create.status(), await create.text()).toBe(200);
  const created = json(await create.json());
  const id = created.id;
  expect(typeof id).toBe('string');
  expect(guid.test(String(id))).toBeTruthy();
  const list = await customer.api.get('/api/store/custom-orders');
  expect(list.status(), await list.text()).toBe(200);
  expect(listOf<Record<string, unknown>>(await list.json(), ['items', 'data'])).toEqual(
    expect.arrayContaining([expect.objectContaining({ id })]),
  );
  const adminQuote = await adminApi.post(`/api/store/custom-orders/${id}/quote`, {
    data: {
      unitPrice: 250000,
      depositPercent: 50,
      completionDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      adminNote: 'Integration quote',
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    },
    headers: origin,
  });
  expect(adminQuote.status(), await adminQuote.text()).toBe(200);
  const quote = json(
    await customer.api.get(`/api/store/custom-orders/${id}`).then((response) => response.json()),
  );
  expect(quote.currentRevision).toBe(1);
  const approve = await customer.api.post(`/api/store/custom-orders/${id}/approve`, {
    data: { version: 1 },
    headers: origin,
  });
  expect(approve.status(), await approve.text()).toBe(200);
  const checkout = await customer.api.post(`/api/store/custom-orders/${id}/checkout`, {
    data: {
      shippingAddress: '12 Integration Street, District 1, Ho Chi Minh City',
      note: 'unpaid integration checkout',
      idempotencyKey: `custom-${Date.now()}`,
    },
    headers: origin,
  });
  expect(checkout.status(), await checkout.text()).toBe(200);
  expect(json(await checkout.json()).paymentStatus).toMatch(/Unpaid|Pending|Chưa/i);
  await Promise.all([closeAll(customer.context), adminContext.close()]);
});

test('booking hold dùng ticketCount/customer fields, idempotency replay exact count, mine và ownership', async ({
  browser,
}) => {
  const first = await authenticatedContext(browser);
  const second = await authenticatedContext(browser);
  const session = await openSession(first.api);
  const payload = {
    ticketCount: session.ticketCount,
    customerName: first.user.fullName,
    customerPhone: first.user.phoneNumber,
    customerEmail: first.user.email,
    idempotencyKey: `booking-${Date.now()}-${first.user.email}`,
  };
  const hold = await first.api.post(`/api/store/bookings/sessions/${session.id}`, {
    data: payload,
    headers: origin,
  });
  expect(hold.status(), await hold.text()).toBe(200);
  const booking = json(await hold.json());
  expect(booking.ticketCount).toBe(1);
  expect(booking.sessionId).toBe(session.id);
  const replay = await first.api.post(`/api/store/bookings/sessions/${session.id}`, {
    data: payload,
    headers: origin,
  });
  expect(replay.status(), await replay.text()).toBe(200);
  expect(json(await replay.json()).id).toBe(booking.id);
  const mine = await first.api.get('/api/store/bookings');
  expect(mine.status(), await mine.text()).toBe(200);
  expect(listOf<Record<string, unknown>>(await mine.json(), ['items', 'data'])).toEqual(
    expect.arrayContaining([expect.objectContaining({ id: booking.id })]),
  );
  const other = await second.api.get(`/api/store/bookings/${booking.id}`);
  expect(other.status(), await other.text()).toBe(404);
  await Promise.all([closeAll(first.context), closeAll(second.context)]);
});

test('cart và address CRUD dùng payload thực, customer khác không đọc được', async ({
  browser,
}) => {
  const first = await authenticatedContext(browser);
  const second = await authenticatedContext(browser);
  const product = (await products(first.api))[0];
  const add = await first.api.post('/api/store/cart', {
    data: { productId: product.id, quantity: 1 },
    headers: origin,
  });
  expect(add.status(), await add.text()).toBe(204);
  const cart = await first.api.get('/api/store/cart');
  expect(cart.status()).toBe(200);
  const lines = listOf<Record<string, unknown>>(await cart.json(), ['items', 'data']);
  expect(lines).toEqual(
    expect.arrayContaining([expect.objectContaining({ productId: product.id, quantity: 1 })]),
  );
  const lineId = String(lines[0].id);
  const addressPayload = {
    receiverName: 'Integration Customer',
    receiverPhone: first.user.phoneNumber,
    detailAddress: '12 Integration Street',
    province: 'Ho Chi Minh City',
    district: 'District 1',
    ward: 'Ben Nghe',
    isDefault: false,
  };
  const create = await first.api.post('/api/store/addresses', {
    data: addressPayload,
    headers: origin,
  });
  expect(create.status()).toBe(201);
  const address = json(await create.json());
  expect(guid.test(String(address.id))).toBeTruthy();
  const update = await first.api.put(`/api/store/addresses/${address.id}`, {
    data: { ...addressPayload, detailAddress: '14 Integration Street' },
    headers: origin,
  });
  expect(update.status()).toBe(200);
  const otherAddresses = await second.api.get('/api/store/addresses');
  expect(otherAddresses.status(), await otherAddresses.text()).toBe(200);
  expect(
    listOf<Record<string, unknown>>(await otherAddresses.json(), ['items', 'data']),
  ).not.toEqual(expect.arrayContaining([expect.objectContaining({ id: address.id })]));
  expect((await first.api.delete(`/api/store/cart/${lineId}`, { headers: origin })).status()).toBe(
    204,
  );
  expect(
    (await first.api.delete(`/api/store/addresses/${address.id}`, { headers: origin })).status(),
  ).toBe(204);
  await Promise.all([closeAll(first.context), closeAll(second.context)]);
});

test('SKU seed chưa xác nhận đóng gói bị từ chối báo phí với 503', async ({ browser }) => {
  const { context, api } = await authenticatedContext(browser);
  const product = (await products(api))[0];
  const response = await api.post('/api/store/shipping/quote', {
    data: {
      streetAddress: '12 Integration Street',
      provinceId: 1000001,
      wardId: 1003580,
      items: [{ productId: product.id, quantity: 1 }],
    },
    headers: origin,
  });
  expect(response.status(), await response.text()).toBe(503);
  await context.close();
});

test('backend unreachable không fallback catalog/demo', async ({ request }) => {
  const unavailable = process.env.INTEGRATION_UNAVAILABLE_BASE_URL;
  test.skip(!unavailable, 'Explicit unavailable backend URL required for isolated fallback check.');
  const response = await request.get(
    `${unavailable!.replace(/\/$/, '')}/api/store/catalog/products`,
  );
  expect([502, 503, 504]).toContain(response.status());
  expect(await response.text()).not.toMatch(/Trăng Non|demo|fake/i);
});
