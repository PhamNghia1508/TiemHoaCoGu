import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('trang chủ không tràn ngang và không lỗi accessibility nghiêm trọng', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Có những điều');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
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

test('mọi route chính và 404 đều hoạt động', async ({ page }) => {
  for (const route of [
    '/cua-tiem',
    '/cua-tiem/trang-non',
    '/dat-rieng',
    '/workshop',
    '/cau-chuyen',
    '/chuyen-cua-hoa',
    '/chuyen-cua-hoa/giu-mot-mua-hoa',
    '/hoi-dap',
    '/chinh-sach',
    '/tra-cuu',
    '/thanh-toan',
  ]) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator('main h1')).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      route,
    ).toBe(true);
  }
  expect((await page.goto('/cua-tiem/khong-ton-tai'))?.status()).toBe(404);
  expect((await page.goto('/chuyen-cua-hoa/khong-ton-tai'))?.status()).toBe(404);
});

test('tìm không dấu, lọc, sắp xếp và lưu yêu thích', async ({ page }) => {
  await page.goto('/cua-tiem');
  await expect(page.locator('.product-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Bó hoa sáp', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
  await page.getByRole('textbox', { name: 'Tìm trong cửa tiệm' }).fill('suong');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card h3')).toContainText('Sương Sớm');
  await page.getByRole('button', { name: 'Lưu sản phẩm', exact: true }).click();
  await page.getByRole('textbox', { name: 'Tìm trong cửa tiệm' }).fill('');
  await page.getByRole('button', { name: 'Chỉ xem sản phẩm đã lưu' }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: 'Chỉ xem sản phẩm đã lưu' }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.getByRole('button', { name: 'Chỉ xem sản phẩm đã lưu' }).click();
  await page.getByLabel('Sắp xếp sản phẩm').selectOption('price-up');
  await expect(page.locator('.product-card h3').first()).toContainText('Gói Ghém');
});

test('giỏ hàng tăng giảm, lưu sau reload và chuyển bước xem lại', async ({ page }) => {
  await page.goto('/cua-tiem/trang-non');
  await page.getByRole('button', { name: 'Tăng số lượng', exact: true }).click();
  await page.getByRole('button', { name: 'Thêm vào túi hoa' }).click();
  const cart = page.getByRole('dialog', { name: /Túi hoa/ });
  await expect(cart).toBeVisible();
  await expect(cart).toContainText('840.000');
  await cart.getByRole('button', { name: 'Tăng số lượng Trăng Non' }).click();
  await expect(cart).toContainText('1.260.000');
  await cart.getByRole('button', { name: 'Giảm số lượng Trăng Non' }).click();
  await expect(cart).toContainText('840.000');
  await page.keyboard.press('Escape');
  await expect(cart).not.toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Mở túi hoa, 2 sản phẩm' }).click();
  await expect(cart).toContainText('840.000');
  await cart.getByRole('link', { name: 'Xem lại đơn hoa' }).click();
  await expect(page).toHaveURL(/thanh-toan/);
  await expect(page.locator('.form-aside')).toContainText('840.000');
  await page.getByRole('button', { name: 'Sửa túi hoa' }).click();
  await cart.getByRole('button', { name: 'Xóa Trăng Non' }).click();
  await expect(cart).toContainText('Một chiếc túi đang chờ hoa');
});

test('tìm kiếm dialog và Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tìm kiếm sản phẩm', exact: true }).click();
  const search = page.getByRole('dialog', { name: 'Bạn đang tìm điều gì?' });
  await expect(search).toBeVisible();
  await search.getByRole('textbox', { name: 'Tìm sản phẩm' }).fill('trang non');
  await expect(search.locator('.search-results a')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(search).not.toBeVisible();
});

test('form đặt riêng chỉ tạo bản nháp, không gửi API', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', (r) => {
    if (r.method() === 'POST') writes.push(r.url());
  });
  await page.goto('/dat-rieng');
  await page.getByLabel('Bạn muốn tặng ai?').selectOption('Sinh nhật');
  await page.getByLabel('Khoảng ngân sách').selectOption('400.000 – 700.000 ₫');
  await page.getByLabel('Điều bạn muốn gửi gắm').fill('Một bó hoa màu kem nhẹ nhàng.');
  await page.getByLabel('Tên của bạn').fill('Khách kiểm thử');
  await page.getByLabel('Số điện thoại').fill('0901234567');
  await page.getByRole('button', { name: 'Xem bản nháp yêu cầu' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'BẢN NHÁP' })).toBeVisible();
  expect(writes).toEqual([]);
  await page.getByLabel('Điều bạn muốn gửi gắm').fill('Đổi màu xanh.');
  await expect(page.locator('.form-status')).toHaveCount(0);
});

test('workshop không giữ chỗ giả và tra cứu không tạo kết quả giả', async ({ page }) => {
  await page.goto('/workshop');
  await page.getByLabel('Ngày bạn mong muốn').fill('2027-01-30');
  await page.getByLabel('Tên của bạn').fill('Khách kiểm thử');
  await page.getByLabel('Số điện thoại').fill('0901234567');
  await page.getByRole('button', { name: 'Xem trước buổi hẹn' }).click();
  await expect(page.locator('.form-status')).toContainText('CHƯA ĐẶT CHỖ');
  await page.goto('/tra-cuu');
  await page.getByLabel('Mã đơn / mã đặt chỗ').fill('TEST-123');
  await page.getByLabel('Số điện thoại').fill('0901234567');
  await page.getByRole('button', { name: 'Kiểm tra tra cứu' }).click();
  await expect(page.locator('.form-status')).toContainText('Chưa thể tra cứu');
});

test('không tràn ngang ở các breakpoint trung gian', async ({ page }) => {
  for (const width of [320, 375, 600, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
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
