import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { expectAvailableProduct, expectCatalogProducts } from './catalog-helpers';

test('gợi ý quà chuyển đúng danh mục thật và ngân sách sang cửa tiệm', async ({ page }) => {
  await page.goto('/');
  const category = page.getByLabel('Kiểu quà bạn đang nghĩ đến');
  const firstCategory = category.locator('option').nth(1);
  const categoryId = await firstCategory.getAttribute('value');
  const categoryLabel = (await firstCategory.textContent())?.trim();
  expect(categoryId).toBeTruthy();
  expect(categoryLabel).toBeTruthy();
  await category.selectOption(categoryId!);
  await page.getByLabel('Ngân sách của bạn').selectOption('under300');
  await page.getByRole('button', { name: 'Tìm đúng gu' }).click();
  await expect(page).toHaveURL(/\/cua-tiem\?/);
  const currentUrl = new URL(page.url());
  expect(currentUrl.pathname).toBe('/cua-tiem');
  expect(currentUrl.searchParams.get('category')).toBe(categoryId);
  expect(currentUrl.searchParams.get('budget')).toBe('under300');
  await expect(page.locator('.commerce-category-tabs button[aria-pressed="true"]')).toHaveText(
    categoryLabel!,
  );
  await expect(page.locator('.commerce-chips')).toContainText('Dưới 300.000đ');
  await page.locator('.commerce-chips').getByRole('button', { name: 'Xóa tất cả' }).click();
  await expectCatalogProducts(page);
  await expect(page.locator('.commerce-chips')).toHaveCount(0);
});

test('thêm nhanh có feedback và lưu giỏ mà không bật drawer ngoài ý muốn', async ({ page }) => {
  await page.goto('/cua-tiem');
  const product = await expectAvailableProduct(page);
  await page.getByRole('button', { name: `Thêm ${product.name} vào túi`, exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mở túi hoa, 1 sản phẩm' })).toBeVisible();
  await expect(page.getByRole('dialog', { name: /Túi hoa/ })).not.toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Mở túi hoa, 1 sản phẩm' }).click();
  await expect(page.getByRole('dialog', { name: /Túi hoa/ })).toContainText(product.name);
});

test('lọc giá hoạt động trên desktop và mobile, có reset rõ ràng', async ({ page }) => {
  await page.goto('/cua-tiem');
  const products = await expectCatalogProducts(page);
  const bands = [
    { label: 'Dưới 300.000đ', matches: (price: number) => price < 300000 },
    { label: '300.000–500.000đ', matches: (price: number) => price >= 300000 && price <= 500000 },
    { label: 'Trên 500.000đ', matches: (price: number) => price > 500000 },
  ];
  const chosen =
    bands
      .map((band) => ({
        ...band,
        count: products.filter((product) => band.matches(product.price)).length,
      }))
      .find((band) => band.count > 0 && band.count < products.length) ??
    bands
      .map((band) => ({
        ...band,
        count: products.filter((product) => band.matches(product.price)).length,
      }))
      .find((band) => band.count > 0);
  expect(chosen, 'catalog cần có ít nhất một sản phẩm thuộc một mức giá').toBeDefined();

  await page.locator('.commerce-filter-trigger').click();
  const dialog = page.getByRole('dialog', { name: 'Bộ lọc', exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('radio', { name: chosen!.label, exact: true }).check();
  await dialog.getByRole('button', { name: `Xem ${chosen!.count} món quà`, exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator('.product-card')).toHaveCount(chosen!.count);
  await expect(page.locator('.commerce-chips')).toContainText(chosen!.label);
  await page.locator('.commerce-chips').getByRole('button', { name: 'Xóa tất cả' }).click();
  await expect(page.locator('.product-card')).toHaveCount(products.length);
});

test('ảnh zoom đúng sản phẩm; nhãn bối cảnh chỉ xuất hiện khi có ảnh bối cảnh', async ({
  page,
}) => {
  await page.goto('/cua-tiem');
  const [product] = await expectCatalogProducts(page);
  await page.goto(product.href);
  await expect(page.locator('main h1')).toHaveText(product.name);
  const detailImage = page.locator('.detail-image img');
  await expect(detailImage).toBeVisible();
  const source = await detailImage.getAttribute('src');
  await page.getByRole('button', { name: 'Phóng to ảnh sản phẩm' }).click();
  const zoom = page.getByRole('dialog', { name: 'Ảnh sản phẩm phóng to' });
  await expect(zoom).toBeVisible();
  await expect(zoom.locator('img')).toHaveAttribute('src', source!);
  await page.keyboard.press('Escape');
  await expect(zoom).not.toBeVisible();

  const experienceLabel = page.locator('.detail-copy > .eyebrow');
  const contextImage = page.getByRole('button', {
    name: `Ảnh bối cảnh tham khảo cho ${product.name}`,
    exact: true,
  });
  if ((await experienceLabel.innerText()).includes('BẢN TRẢI NGHIỆM')) {
    await contextImage.click();
    await expect(page.locator('.commerce-image-caption')).toContainText(
      'không phải góc chụp sản phẩm',
    );
  } else {
    await expect(experienceLabel).toContainText('DỮ LIỆU API');
    await expect(page.locator('.commerce-image-caption')).toContainText(
      /Ảnh (minh họa|sản phẩm từ hệ thống)/,
    );
  }
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
  await page.goto('/cua-tiem');
  const [product] = await expectCatalogProducts(page);
  for (const route of ['/cua-tiem', product.href, '/workshop']) {
    await page.goto(route);
    await expect(page.locator('main h1')).toBeVisible();
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
