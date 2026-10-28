import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  expectAvailableProduct,
  expectCatalogProducts,
  normalizeSearch,
  priceValue,
  readVisibleProducts,
} from './catalog-helpers';

const connectedMode = process.env.E2E_EXPECT_CONNECTED === 'true';

test('trang chủ không tràn ngang và không lỗi accessibility nghiêm trọng', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('TẶNG HOA.');
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    ),
  ).toBe(true);
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
  ).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: `artifacts/home-${info.project.name}.png`, fullPage: true });
});

test('mọi route chính, sản phẩm lấy từ catalog và 404 đều hoạt động', async ({ page }) => {
  for (const route of [
    '/cua-tiem',
    '/dat-rieng',
    '/workshop',
    '/cau-chuyen',
    '/chuyen-cua-hoa',
    '/chuyen-cua-hoa/giu-mot-mua-hoa',
    '/chuyen-cua-hoa/mon-qua-co-gu',
    '/chuyen-cua-hoa/mot-buoi-chieu-cham',
    '/hoi-dap',
    '/chinh-sach',
    '/tra-cuu',
    '/thanh-toan',
  ]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
      route,
    ).toBe(true);
  }
  await page.goto('/cua-tiem');
  const [product] = await expectCatalogProducts(page);
  expect(product.href).toMatch(/^\/cua-tiem\//);
  const detailResponse = await page.goto(product.href);
  expect(detailResponse?.status(), product.href).toBe(200);
  await expect(page.locator('main h1')).toHaveText(product.name);
  expect((await page.goto('/cua-tiem/khong-ton-tai'))?.status()).toBe(404);
  expect((await page.goto('/chuyen-cua-hoa/khong-ton-tai'))?.status()).toBe(404);
});

test('tìm không dấu, lọc danh mục, sắp xếp và lưu yêu thích theo catalog hiện hành', async ({
  page,
}) => {
  await page.goto('/cua-tiem');
  const initialProducts = await expectCatalogProducts(page);
  expect(initialProducts.length).toBeGreaterThan(1);
  const cards = page.locator('.product-card');
  const categoryButtons = page.locator('.commerce-category-tabs button');
  await expect.poll(() => categoryButtons.count()).toBeGreaterThan(1);
  const categoryId = initialProducts[0].categoryId;
  expect(categoryId).toBeTruthy();
  const categoryButton = page.locator(
    `.commerce-category-tabs button[data-category-id="${categoryId}"]`,
  );
  const categoryLabel = (await categoryButton.innerText()).trim();
  const expectedCategoryProducts = initialProducts.filter(
    (product) => product.categoryId === categoryId,
  );
  await categoryButton.click();
  await expect(categoryButton).toHaveAttribute('aria-pressed', 'true');
  await expect(cards).toHaveCount(expectedCategoryProducts.length);
  expect((await readVisibleProducts(page)).map((product) => product.href)).toEqual(
    expectedCategoryProducts.map((product) => product.href),
  );
  if (connectedMode) {
    await expect(cards.locator('.product-kind')).toHaveText(
      expectedCategoryProducts.map(() => categoryLabel),
    );
  }
  await page
    .locator('.commerce-category-tabs')
    .getByRole('button', { name: 'Tất cả', exact: true })
    .click();
  await expect(cards).toHaveCount(initialProducts.length);

  const candidate =
    initialProducts.find(
      (product) => normalizeSearch(product.name) !== product.name.toLowerCase(),
    ) ?? initialProducts[0];
  const query = normalizeSearch(candidate.name);
  const expectedMatches = initialProducts.filter((product) =>
    normalizeSearch(`${product.name} ${product.subtitle}`).includes(query),
  ).length;
  await page.getByRole('textbox', { name: 'Tìm trong cửa tiệm' }).fill(query);
  await expect(cards).toHaveCount(expectedMatches);
  await expect(cards.filter({ hasText: candidate.name }).first()).toBeVisible();
  await cards
    .filter({ hasText: candidate.name })
    .first()
    .getByRole('button', { name: 'Lưu sản phẩm', exact: true })
    .click();
  await page.getByRole('textbox', { name: 'Tìm trong cửa tiệm' }).fill('');
  await page.getByRole('button', { name: 'Chỉ xem sản phẩm đã lưu' }).click();
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toContainText(candidate.name);
  await page.reload();
  await page.getByRole('button', { name: 'Chỉ xem sản phẩm đã lưu' }).click();
  await expect(cards).toHaveCount(1);
  await page.getByRole('button', { name: 'Chỉ xem sản phẩm đã lưu' }).click();
  await page.locator('main').getByLabel('Sắp xếp sản phẩm').selectOption('price-up');
  await expect(cards).toHaveCount(initialProducts.length);
  const sortedPrices = (await readVisibleProducts(page)).map((product) => product.price);
  expect(sortedPrices.every((price) => price > 0)).toBe(true);
  expect(sortedPrices).toEqual([...sortedPrices].sort((a, b) => a - b));
});

test('giỏ hàng tăng giảm, lưu sau reload và chuyển bước xem lại', async ({ page }) => {
  await page.goto('/cua-tiem');
  const product = await expectAvailableProduct(page);
  await page.goto(product.href);
  await expect(page.locator('main h1')).toHaveText(product.name);
  await page.getByRole('button', { name: 'Tăng số lượng', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm vào túi hoa' }).click();
  const cart = page.getByRole('dialog', { name: /Túi hoa/ });
  await expect(cart).toBeVisible();
  const cartTotal = cart.locator('.total-line strong');
  await expect.poll(async () => priceValue(await cartTotal.innerText())).toBe(product.price * 2);
  await cart.getByRole('button', { name: `Tăng số lượng ${product.name}` }).click();
  await expect.poll(async () => priceValue(await cartTotal.innerText())).toBe(product.price * 3);
  await cart.getByRole('button', { name: `Giảm số lượng ${product.name}` }).click();
  await expect.poll(async () => priceValue(await cartTotal.innerText())).toBe(product.price * 2);
  await page.keyboard.press('Escape');
  await expect(cart).not.toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Mở túi hoa/ }).click();
  await expect(cart).toContainText(product.name);
  await expect.poll(async () => priceValue(await cartTotal.innerText())).toBe(product.price * 2);
  await cart.getByRole('link', { name: 'Xem lại đơn hoa' }).click();
  await expect(page).toHaveURL(/thanh-toan/);
  const checkoutLineTotal = page.locator('.checkout-summary span');
  await expect
    .poll(async () => priceValue(await checkoutLineTotal.innerText()))
    .toBe(product.price * 2);
  await page.getByRole('button', { name: 'Sửa túi hoa' }).click();
  await cart.getByRole('button', { name: `Xóa ${product.name}` }).click();
  await expect(cart).toContainText('Một chiếc túi đang chờ hoa');
});

test('tìm kiếm dialog dùng tên sản phẩm thật và Escape', async ({ page }) => {
  await page.goto('/cua-tiem');
  const products = await expectCatalogProducts(page);
  const candidate = products[0];
  const query = normalizeSearch(candidate.name);
  const expectedResults = products.filter((product) =>
    normalizeSearch(`${product.name} ${product.subtitle}`).includes(query),
  ).length;
  await page.getByRole('button', { name: 'Tìm kiếm sản phẩm', exact: true }).click();
  const search = page.getByRole('dialog', { name: 'Bạn đang tìm điều gì?' });
  await expect(search).toBeVisible();
  await search.getByRole('textbox', { name: 'Tìm sản phẩm' }).fill(query);
  await expect(search.locator('.search-results a')).toHaveCount(expectedResults);
  await expect(
    search.locator('.search-results a').filter({ hasText: candidate.name }).first(),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(search).not.toBeVisible();
});

test('đặt riêng: preview không gửi API, chế độ thật yêu cầu đăng nhập', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST') writes.push(r.url());
  });
  await page.goto('/dat-rieng');
  await page.locator('main').getByLabel('Bạn muốn tặng ai?').selectOption('Sinh nhật');
  await page.locator('main').getByLabel('Khoảng ngân sách').selectOption('400.000 – 700.000 ₫');
  await page
    .locator('main')
    .getByLabel('Điều bạn muốn gửi gắm')
    .fill('Một bó hoa màu kem nhẹ nhàng.');
  await page.locator('main').getByLabel('Tên của bạn').fill('Khách kiểm thử');
  await page.locator('main').getByLabel('Số điện thoại').fill('0901234567');
  if (connectedMode) {
    await expect(page.locator('main .form-notice')).toContainText('Yêu cầu thật cần đăng nhập');
    const baseProduct = page.locator('select[name="productId"]');
    await expect.poll(() => baseProduct.locator('option').count()).toBeGreaterThan(1);
    await baseProduct.selectOption({ index: 1 });
    const response = page.waitForResponse(
      (r) => r.url().endsWith('/api/store/custom-orders') && r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Gửi yêu cầu báo giá' }).click();
    expect((await response).status()).toBe(401);
    await expect(page.locator('main [role="alert"]')).toContainText(/đăng nhập/i);
    await expect(page.locator('main .form-status[role="status"]')).toHaveCount(0);
    expect(writes).toEqual([`${new URL(page.url()).origin}/api/store/custom-orders`]);
  } else {
    await expect(page.locator('main .form-notice')).toContainText('form trải nghiệm');
    await page.getByRole('button', { name: 'Xem bản nháp yêu cầu' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'BẢN NHÁP' })).toBeVisible();
    expect(writes).toEqual([]);
    await page.locator('main').getByLabel('Điều bạn muốn gửi gắm').fill('Đổi màu xanh.');
    await expect(page.locator('.form-status')).toHaveCount(0);
  }
});

test('workshop không giữ chỗ giả và tra cứu không tạo kết quả giả', async ({ page }) => {
  const bookingPosts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') bookingPosts.push(request.url());
  });
  await page.goto('/workshop');
  const form = page.locator('main #hen-o-xuong');
  let isConnected = false;
  if ((await form.count()) > 0) {
    await expect(form).toHaveAttribute('data-ready', 'true');
    const connected = (await form.getByLabel('Trải nghiệm bạn muốn thử').count()) > 0;
    isConnected = connected;
    await page.locator('main').getByLabel('Tên của bạn').fill('Khách kiểm thử');
    await page.locator('main').getByLabel('Số điện thoại').fill('0901234567');
    if (connected) {
      await expect(form.locator('.form-notice')).toContainText('chưa có thanh toán');
      const session = form.getByLabel('Ca thực tế');
      await expect.poll(() => session.locator('option').count()).toBeGreaterThan(1);
      await session.selectOption({ index: 1 });
      await page.route('**/api/store/bookings/sessions/**', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Đăng nhập để tiếp tục.' }),
          });
          return;
        }
        await route.continue();
      });
      const response = page.waitForResponse(
        (r) =>
          /\/api\/store\/bookings\/sessions\//.test(r.url()) && r.request().method() === 'POST',
      );
      await form.getByRole('button', { name: 'Giữ chỗ tạm thời' }).click();
      expect((await response).status()).toBe(401);
      await expect(form.getByRole('alert')).toContainText(/đăng nhập/i);
      await expect(form.locator('.form-status[role="status"]')).toHaveCount(0);
      expect(bookingPosts).toHaveLength(1);
      expect(bookingPosts[0]).toMatch(/\/api\/store\/bookings\/sessions\//);
    } else {
      await expect(page.locator('.workshop-course-card')).toHaveCount(0);
      await expect(page.getByText('Lịch lớp thật chưa được mở.')).toBeVisible();
      await form.getByLabel('Workshop bạn quan tâm').fill('Một buổi làm hoa cùng bạn bè');
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      await page.locator('main').getByLabel('Ngày bạn mong muốn').fill(tomorrow);
      await page.getByRole('button', { name: 'Xem trước buổi hẹn' }).click();
      await expect(page.locator('.form-status')).toContainText('CHƯA ĐẶT CHỖ');
      expect(bookingPosts).toEqual([]);
    }
  } else {
    // Redesigned interactive workshop catalog
    await expect(page.locator('.workshop-page')).toBeVisible();
    await expect(page.locator('#danh-sach-workshop')).toBeVisible();
    const bookButtons = page.locator('.ws-btn-book');
    if ((await bookButtons.count()) > 0) {
      isConnected = true;
      await bookButtons.first().click();
      const drawer = page.locator('.ws-drawer-card');
      await expect(drawer).toBeVisible();
      await page.locator('#drawer-phone').fill('0901234567');
      await page.route('**/api/store/bookings/sessions/**', async (route) => {
        if (route.request().method() === 'POST') {
          await route.fulfill({
            status: 401,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Đăng nhập để tiếp tục.' }),
          });
          return;
        }
        await route.continue();
      });
      const response = page.waitForResponse(
        (r) =>
          /\/api\/store\/bookings\/sessions\//.test(r.url()) && r.request().method() === 'POST',
      );
      await drawer.getByRole('button', { name: /Xác nhận giữ chỗ/i }).click();
      expect((await response).status()).toBe(401);
      expect(bookingPosts).toHaveLength(1);
    } else {
      expect(bookingPosts).toEqual([]);
    }
  }
  await page.goto('/tra-cuu');
  if (isConnected) {
    await expect(page.getByLabel('Mã đơn / mã đặt chỗ')).toHaveCount(0);
    await expect(page.locator('.lookup-card .form-notice')).toContainText(
      'không tra cứu công khai',
    );
    const response = page.waitForResponse(
      (r) => r.url().endsWith('/api/store/orders') && r.request().method() === 'GET',
    );
    await page.getByRole('button', { name: 'Xem lịch sử tài khoản' }).click();
    expect((await response).status()).toBe(401);
    await expect(page.locator('.lookup-card [role="alert"]')).toContainText(/đăng nhập/i);
    await expect(page.locator('.lookup-card .eyebrow')).toHaveCount(0);
  } else {
    await page.locator('main').getByLabel('Mã đơn / mã đặt chỗ').fill('TEST-123');
    await page.locator('main').getByLabel('Số điện thoại').fill('0901234567');
    await page.getByRole('button', { name: 'Kiểm tra tra cứu' }).click();
    await expect(page.locator('.form-status')).toContainText('Chưa thể tra cứu');
  }
});

test('không tràn ngang ở các breakpoint trung gian', async ({ page }) => {
  for (const width of [320, 375, 600, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
      `width=${width}`,
    ).toBe(true);
  }
});

test('menu mobile đóng sau khi chọn trang; storage hỏng không làm hỏng giao diện', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.addInitScript(() => {
    localStorage.setItem('cogu-cart-v1', '{bad json');
    localStorage.setItem('cogu-favorites-v1', '["unknown-product"]');
  });
  await page.goto('/');
  await page.locator('.mobile-nav summary').click();
  await expect(page.locator('.mobile-nav')).toHaveAttribute('open', '');
  await page
    .getByRole('navigation', { name: 'Điều hướng điện thoại' })
    .getByRole('link', { name: 'Cửa tiệm', exact: true })
    .click();
  await expect(page).toHaveURL(/cua-tiem/);
  await expect(page.locator('.mobile-nav')).not.toHaveAttribute('open', '');
  await page.getByRole('button', { name: 'Mở túi hoa, 0 sản phẩm' }).click();
  await expect(page.getByRole('dialog', { name: /Túi hoa/ })).toContainText(
    'Một chiếc túi đang chờ hoa',
  );
});
