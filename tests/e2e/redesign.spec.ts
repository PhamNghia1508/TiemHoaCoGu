import { test, expect } from '@playwright/test';

test('gợi ý quà chuyển đúng loại và ngân sách sang cửa tiệm', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Kiểu quà bạn đang nghĩ đến').selectOption('lo');
  await page.getByLabel('Ngân sách của bạn').selectOption('under300');
  await page.getByRole('button', { name: 'Tìm đúng gu' }).click();
  await expect(page).toHaveURL(/category=lo.*budget=under300/);
  await expect(page.locator('.product-card')).toHaveCount(2);
  await expect(
    page.locator('.commerce-category-tabs').getByRole('button', { name: 'Hoa & góc nhỏ' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.commerce-chips').getByRole('button', { name: 'Xóa tất cả' }).click();
  await expect(page.locator('.product-card')).toHaveCount(6);
});

test('thêm nhanh có feedback và lưu giỏ mà không bật drawer ngoài ý muốn', async ({ page }) => {
  await page.goto('/cua-tiem');
  await page.getByRole('button', { name: 'Thêm Trăng Non vào túi', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mở túi hoa, 1 sản phẩm' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: /Túi hoa/ })).not.toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Mở túi hoa, 1 sản phẩm' }).click();
  await expect(page.getByRole('dialog', { name: /Túi hoa/ })).toContainText('Trăng Non');
});

test('lọc giá hoạt động trên desktop và mobile, có reset rõ ràng', async ({ page }) => {
  await page.goto('/cua-tiem');
  await page.locator('.commerce-filter-trigger').click();
  const dialog = page.getByRole('dialog', { name: 'Bộ lọc', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('radio', { name: 'Dưới 300.000đ', exact: true }).check();
  await dialog.getByRole('button', { name: 'Xem 3 món quà', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(3);
  await expect(page.locator('.commerce-chips')).toContainText('Dưới 300.000đ');
  await page.locator('.commerce-chips').getByRole('button', { name: 'Xóa tất cả' }).click();
  await expect(page.locator('.product-card')).toHaveCount(6);
});

test('ảnh zoom đúng sản phẩm và ảnh bối cảnh được ghi nhãn trung thực', async ({ page }) => {
  await page.goto('/cua-tiem/trang-non');
  await page.getByRole('button', { name: 'Phóng to ảnh sản phẩm' }).click();
  const zoom = page.getByRole('dialog', { name: 'Ảnh sản phẩm phóng to' });
  await expect(zoom).toBeVisible();
  await expect(zoom.locator('img')).toHaveAttribute('src', /prod-bouquet/);
  await page.keyboard.press('Escape');
  await expect(zoom).not.toBeVisible();
  await page
    .getByRole('button', { name: 'Ảnh bối cảnh tham khảo cho Trăng Non', exact: true })
    .click();
  await expect(page.locator('.commerce-image-caption')).toContainText(
    'không phải góc chụp sản phẩm',
  );
});

test('reduced motion và vùng thao tác chính vẫn dùng được bằng bàn phím', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe(
    'auto',
  );
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Đến nội dung chính' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#noi-dung$/);
});

test('các trang commerce và workshop không có lỗi WCAG A/AA', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  for (const route of ['/cua-tiem', '/cua-tiem/trang-non', '/workshop']) {
    await page.goto(route);
    await expect(page.locator('main h1')).toBeVisible();
    if (route === '/cua-tiem') await expect(page.locator('.product-card')).toHaveCount(6);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => n.target),
      })),
      route,
    ).toEqual([]);
  }
});
