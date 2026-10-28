import { expect, test, type Page, type Route } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const category = {
  id: '11111111-1111-1111-1111-111111111111',
  code: 'HOA',
  name: 'Hoa tươi',
  description: 'Hoa theo mùa',
};
const categoryTwo = {
  id: '22222222-2222-2222-2222-222222222222',
  code: 'QUA',
  name: 'Quà tặng',
  description: 'Quà nhỏ',
};
const product = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  categoryId: category.id,
  code: 'SP-001',
  name: 'Bó hoa nắng',
  price: 450000,
  originalPrice: 500000,
  thumbnailUrl: '',
  description: 'Hoa vàng',
  badge: 'Mới',
  section: 'Trang chủ',
  isCustomizable: false,
  isPreOrder: true,
  shippingWeightGrams: 500,
  packageLengthCm: 20,
  packageWidthCm: 15,
  packageHeightCm: 12,
  packagingSpecsConfirmed: true,
  isActive: true,
  quantityAvailable: 7,
};
const productTwo = {
  ...product,
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  categoryId: categoryTwo.id,
  code: 'SP-002',
  name: 'Hộp quà nhỏ',
  isPreOrder: false,
  quantityAvailable: 2,
};
const order = {
  id: '33333333-3333-3333-3333-333333333333',
  orderCode: 'DH-0001',
  customerName: 'Khách tổng hợp',
  customerEmail: 'fixture@example.test',
  customerPhone: '0900000000',
  subtotal: 450000,
  discountAmount: 0,
  shippingFee: 30000,
  totalAmount: 480000,
  orderStatus: 'Confirmed',
  paymentStatus: 'Unpaid',
  shippingAddress: 'Địa chỉ fixture',
  note: '',
  createdAt: '2026-01-02T09:00:00Z',
  items: [
    {
      id: '44444444-4444-4444-4444-444444444444',
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: 450000,
      finalPrice: 450000,
    },
  ],
};
const dashboard = {
  orderCount: 4,
  revenue: 1800000,
  paidAmount: 1200000,
  refundAmount: 0,
  netCollected: 1200000,
  customerCount: 8,
  productCount: 2,
  lowStockCount: 1,
  ordersByStatus: [{ status: 'Confirmed', count: 2 }],
  dailyRevenue: [],
  topProducts: [],
};
const workshop = {
  id: '55555555-5555-5555-5555-555555555555',
  code: 'WS-01',
  name: 'Cắm hoa cơ bản',
  shortName: 'Cắm hoa',
  category: 'Hoa',
  basePrice: 350000,
  duration: 120,
  maxCapacity: 12,
  description: 'Lớp fixture',
  isFeatured: false,
  isActive: true,
};

type State = {
  products: (typeof product)[];
  productRequests: number;
  mutations: { method: string; path: string; body: unknown }[];
  delayProducts: number;
  failProducts: boolean;
  emptyProducts: boolean;
};

function pageData(state: State, path: string) {
  if (path === 'auth/me')
    return {
      id: 'admin-1',
      email: 'admin@example.test',
      fullName: 'Admin Fixture',
      role: 'Admin',
      isAuthenticated: true,
    };
  if (path === 'management/dashboard') return dashboard;
  if (path.startsWith('management/products')) {
    state.productRequests += 1;
    if (state.emptyProducts) return { items: [], total: 0, page: 1, pageSize: 20 };
    return { items: state.products, total: state.products.length, page: 1, pageSize: 20 };
  }
  if (path === 'management/categories') return [category, categoryTwo];
  if (path === 'management/orders' || path.startsWith('management/orders?'))
    return { items: [order], total: 1, page: 1, pageSize: 20 };
  if (path === `management/orders/${order.id}`) return order;
  if (path === `orders/staff/${order.id}/deliveries`) return [];
  if (path === 'workshops') return [workshop];
  if (path === 'custom-orders') return [];
  if (path === 'management/permissions') return { roles: [], cms: {} };
  if (/^workshops\/[^/]+\/sessions$/.test(path)) return [];
  if (path.startsWith('management/vouchers')) return { items: [], total: 0, page: 1, pageSize: 20 };
  if (path.startsWith('management/accounts')) return { items: [], total: 0, page: 1, pageSize: 20 };
  if (path.startsWith('management/notifications'))
    return { items: [], total: 0, page: 1, pageSize: 20 };
  if (path.startsWith('gateway/reconciliation')) return [];
  if (path.startsWith('management/audit-logs'))
    return { items: [], total: 0, page: 1, pageSize: 20 };
  return undefined;
}

async function fulfill(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function mockStore(page: Page, overrides: Partial<State> = {}) {
  const state: State = {
    products: [product, productTwo],
    productRequests: 0,
    mutations: [],
    delayProducts: 0,
    failProducts: false,
    emptyProducts: false,
    ...overrides,
  };
  await page.route('**/api/store/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.split('/api/store/')[1] || '';
    if (path === 'auth/me') return fulfill(route, 200, pageData(state, path));
    if (state.delayProducts && path.startsWith('management/products'))
      await new Promise((resolve) => setTimeout(resolve, state.delayProducts));
    if (state.failProducts && path.startsWith('management/products'))
      return fulfill(route, 503, { error: 'Catalog fixture unavailable' });
    if (request.method() !== 'GET') {
      let body: unknown;
      try {
        body = request.postDataJSON();
      } catch {
        body = undefined;
      }
      state.mutations.push({ method: request.method(), path, body });
      return fulfill(
        route,
        200,
        path.includes('products') ? { ...product, ...(body as object) } : {},
      );
    }
    const data = pageData(state, path);
    return data === undefined
      ? fulfill(route, 500, { error: `Unknown fixture route: ${path}` })
      : fulfill(route, 200, data);
  });
  return state;
}

async function openAdmin(page: Page, view?: string) {
  await page.goto(view ? `/quan-tri?view=${view}` : '/quan-tri');
  await expect(page.locator('.admin-app')).toBeVisible();
}
async function goView(page: Page, label: string, value: string) {
  const select = page.getByLabel('Khu vực làm việc');
  if (await select.isVisible()) await select.selectOption(value);
  else
    await page
      .getByRole('navigation', { name: 'Điều hướng quản trị' })
      .getByRole('link', { name: label, exact: true })
      .click();
  await expect(page).toHaveURL(new RegExp(`[?&]view=${value}$`));
  await expect(page.locator('.admin-app')).toBeVisible();
}
async function noHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  ).toBeTruthy();
}

test.beforeEach(async ({ page }) => {
  await mockStore(page);
});

test('dashboard navigation keeps URL, back and reload stable', async ({ page }) => {
  await openAdmin(page);
  await goView(page, 'Sản phẩm', 'catalog');
  await expect(page.getByRole('heading', { name: /Danh sách sản phẩm/ })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/quan-tri(?:\?view=dashboard)?$/);
  await page.reload();
  await expect(page.locator('.admin-app')).toBeVisible();
});

test('catalog product dialog uses category select and keyboard semantics', async ({ page }) => {
  await openAdmin(page, 'catalog');
  await page.getByRole('button', { name: 'Sửa', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Danh mục')).toHaveJSProperty('tagName', 'SELECT');
  await expect(dialog.getByLabel('Nhãn nổi bật')).toHaveValue('Mới');
  for (let i = 0; i < 24; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Sửa', exact: true }).first()).toBeFocused();
});

test('catalog measurement change clears confirmation and save preserves false flags', async ({
  page,
}) => {
  const state = await mockStore(page);
  await openAdmin(page, 'catalog');
  await page.getByRole('button', { name: 'Sửa', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByLabel('Xác nhận số đo đóng gói thực tế')).toBeChecked();
  await dialog.getByLabel('Chiều dài (cm)').fill('21');
  await expect(dialog.getByLabel('Xác nhận số đo đóng gói thực tế')).not.toBeChecked();
  await dialog.getByRole('button', { name: 'Lưu sản phẩm' }).click();
  await expect.poll(() => state.mutations.filter((item) => item.method === 'PUT').length).toBe(1);
  const mutation = state.mutations.find(
    (item) => item.method === 'PUT' && item.path.includes(product.id),
  );
  expect(mutation).toBeTruthy();
  expect(mutation?.body).toMatchObject({
    isCustomizable: false,
    isPreOrder: true,
    packagingSpecsConfirmed: false,
  });
  await expect(dialog).not.toBeVisible();
});

test('catalog destructive delete cancel is side-effect free, confirm sends one DELETE', async ({
  page,
}) => {
  const state = await mockStore(page);
  await openAdmin(page, 'catalog');
  await page.getByRole('button', { name: 'Xóa', exact: true }).first().click();
  const confirmation = page.getByRole('dialog');
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Quay lại' }).click();
  expect(state.mutations.filter((item) => item.method === 'DELETE')).toHaveLength(0);
  await page.getByRole('button', { name: 'Xóa', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect
    .poll(() => state.mutations.filter((item) => item.method === 'DELETE').length)
    .toBe(1);
});

test('catalog loading, explicit error retry and empty states are visible', async ({ page }) => {
  const state = await mockStore(page, { delayProducts: 250 });
  await page.goto('/quan-tri?view=catalog');
  await expect(page.getByRole('status').filter({ hasText: 'Đang tải sản phẩm' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Danh sách sản phẩm/ })).toBeVisible();
  state.failProducts = true;
  await page.reload();
  await expect(page.locator('.admin-app [role=alert]')).toContainText(
    'Catalog fixture unavailable',
  );
  await expect(page.getByRole('button', { name: 'Thử lại' })).toBeVisible();
  state.failProducts = false;
  state.emptyProducts = true;
  await page.getByRole('button', { name: 'Thử lại' }).click();
  await expect(page.getByRole('heading', { name: 'Chưa có sản phẩm phù hợp' })).toBeVisible();
});

test('orders support grouped status filter, detail, cancel confirmation and distinct payment', async ({
  page,
}) => {
  const state = await mockStore(page);
  await openAdmin(page, 'orders');
  const group = page.getByRole('group', { name: 'Lọc trạng thái đơn hàng' });
  await expect(group).toBeVisible();
  await group.getByRole('button', { name: 'Chờ xử lý' }).click();
  await page.getByRole('button', { name: /DH-0001/ }).click();
  const dialog = page.getByRole('dialog', { name: /Chi tiết DH-0001/ });
  await expect(dialog).toContainText('Thanh toán');
  await expect(dialog).toContainText('Chưa thanh toán');
  await dialog.getByRole('button', { name: 'Hủy đơn', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Hủy đơn hàng?' })
    .getByRole('button', { name: 'Quay lại' })
    .click();
  expect(state.mutations.filter((item) => item.path.endsWith('/status'))).toHaveLength(0);
  await dialog.getByRole('button', { name: 'Hủy đơn', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Hủy đơn hàng?' })
    .getByRole('button', { name: 'Hủy đơn', exact: true })
    .click();
  await expect
    .poll(() => state.mutations.filter((item) => item.path.endsWith('/status')).length)
    .toBe(1);
});

test('responsive workspace uses mobile select and stays free of horizontal overflow', async ({
  page,
}) => {
  await openAdmin(page);
  await noHorizontalOverflow(page);
  await goView(page, 'Đơn hàng', 'orders');
  await noHorizontalOverflow(page);
  for (const view of [
    'catalog',
    'orders',
    'workshops',
    'custom',
    'vouchers',
    'accounts',
    'payments',
    'notifications',
    'audit',
  ]) {
    await goView(
      page,
      (
        {
          catalog: 'Sản phẩm',
          orders: 'Đơn hàng',
          workshops: 'Workshop',
          custom: 'Hoa đặt riêng',
          vouchers: 'Voucher',
          accounts: 'Tài khoản',
          payments: 'Thanh toán thử nghiệm',
          notifications: 'Thông báo',
          audit: 'Nhật ký thay đổi',
        } as Record<string, string>
      )[view],
      view,
    );
    await noHorizontalOverflow(page);
  }
});

test('workshop, custom, voucher, account, reconciliation and audit views have explicit empty states', async ({
  page,
}) => {
  await openAdmin(page);
  for (const [label, value] of [
    ['Workshop', 'workshops'],
    ['Hoa đặt riêng', 'custom'],
    ['Voucher', 'vouchers'],
    ['Tài khoản', 'accounts'],
    ['Thông báo', 'notifications'],
    ['Thanh toán thử nghiệm', 'payments'],
    ['Nhật ký thay đổi', 'audit'],
  ]) {
    await goView(page, label, value);
    await expect(page.locator('#admin-content')).toBeVisible();
    await expect(page.locator('.admin-empty-state').first()).toBeVisible();
    await expect(page.locator('.admin-app [role=alert]')).toHaveCount(0);
  }
});

test('reduced motion and serious/critical accessibility violations are absent on dashboard', async ({
  page,
}) => {
  await openAdmin(page);
  await expect(page.locator('.admin-panel')).toHaveCSS('animation-name', 'none');
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) =>
    ['serious', 'critical'].includes(violation.impact || ''),
  );
  expect(
    serious.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
    serious.map((violation) => `${violation.id}: ${violation.help}`).join('\n'),
  ).toEqual([]);
});

test('401 guard offers the account login link and customer role is forbidden without management fetch', async ({
  page,
}) => {
  await page.unroute('**/api/store/**');
  const requested: string[] = [];
  await page.route('**/api/store/**', async (route) => {
    const path = new URL(route.request().url()).pathname.split('/api/store/')[1] || '';
    requested.push(path);
    if (path === 'auth/me') return fulfill(route, 401, { error: 'Unauthorized' });
    return fulfill(route, 500, { error: 'management route must not be fetched' });
  });
  await page.goto('/quan-tri');
  await expect(page.getByRole('link', { name: /Đến trang đăng nhập/ })).toHaveAttribute(
    'href',
    '/tai-khoan',
  );
  expect(requested.filter((path) => path !== 'auth/me')).toHaveLength(0);

  await page.unroute('**/api/store/**');
  await page.route('**/api/store/**', async (route) => {
    const path = new URL(route.request().url()).pathname.split('/api/store/')[1] || '';
    requested.push(path);
    if (path === 'auth/me')
      return fulfill(route, 200, { role: 'Customer', fullName: 'Customer Fixture' });
    return fulfill(route, 500, { error: 'forbidden management fetch' });
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Không có quyền truy cập' })).toBeVisible();
  expect(requested.filter((path) => path !== 'auth/me')).toHaveLength(0);
});
