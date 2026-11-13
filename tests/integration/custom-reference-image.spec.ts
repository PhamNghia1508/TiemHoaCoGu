import { test, expect } from '@playwright/test';
import { authenticatedContext } from './helpers';

test('khách gửi ảnh tham khảo cùng yêu cầu, người khác không xem được', async ({ browser }) => {
  const owner = await authenticatedContext(browser);
  const other = await authenticatedContext(browser);
  const page = await owner.context.newPage();
  await page.goto('/dat-rieng');
  await page.getByRole('button', { name: 'Sinh nhật' }).click();
  await page.getByRole('button', { name: '300.000 – 500.000 ₫' }).click();
  await page.getByRole('button', { name: 'Tiếp theo' }).click();
  await page.getByRole('button', { name: 'Trắng & xanh lá' }).click();
  await page.getByLabel('Sản phẩm nền').selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Tiếp theo' }).click();
  await page.getByLabel('Điều bạn muốn gửi gắm').fill('Ảnh tham khảo kiểm thử');
  await page.getByLabel('Ảnh tham khảo (không bắt buộc)').setInputFiles({
    name: 'hoa.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP1sAAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await page.getByRole('button', { name: 'Tiếp theo' }).click();
  await page.getByLabel('Tên của bạn').fill('Khách kiểm thử');
  await page.getByLabel('Số điện thoại').fill('0901234567');
  await page.getByRole('button', { name: 'Xem bản nháp' }).click();
  const created = page.waitForResponse(
    (r) => r.url().endsWith('/api/store/custom-orders') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Gửi yêu cầu báo giá' }).click();
  const response = await created;
  expect(response.status(), await response.text()).toBe(200);
  const request = await response.json();
  expect(request.referenceImageUrl).toMatch(
    /^http:\/\/localhost:3100\/api\/reference-images\/[a-f0-9]{32}\/[a-f0-9]{32}\.png$/,
  );
  expect((await owner.api.get(request.referenceImageUrl)).status()).toBe(200);
  expect((await other.api.get(request.referenceImageUrl)).status()).toBe(404);
  await Promise.all([owner.context.close(), other.context.close()]);
});
