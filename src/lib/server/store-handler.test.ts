import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
const { values } = vi.hoisted(() => ({ values: new Map<string, string>() }));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (key: string) => (values.has(key) ? { value: values.get(key) } : undefined),
  }),
}));
import { GET, POST, DELETE } from '@/app/api/store/[...path]/route';

const origin = 'https://shop.test';
const uuid = '3ff507d7-d720-4146-82dd-b7539e858f11';
const context = (path: string) => ({ params: Promise.resolve({ path: path.split('/') }) });
function writeRequest(path: string, body: unknown = {}, method = 'POST', from = origin) {
  return new Request(`${origin}/api/store/${path}`, {
    method,
    headers: { Origin: from, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  values.clear();
  vi.stubEnv('API_BASE_URL', 'http://localhost:5085');
  vi.stubEnv('STOREFRONT_WRITES_ENABLED', 'true');
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: true }), {
          headers: { 'Content-Type': 'application/json' },
        }),
    ),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('BFF handler', () => {
  it('multipart chỉ hợp lệ ở media, có xác thực và write gate', async () => {
    const form = new FormData();
    form.set('file', new Blob(['test'], { type: 'image/png' }), 'test.png');
    const upload = () =>
      new Request(`${origin}/api/store/management/media`, {
        method: 'POST',
        headers: { Origin: origin },
        body: form,
      });
    expect((await POST(upload(), context('management/media'))).status).toBe(401);
    values.set('store_access', 'test-token');
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ url: '/api/media/abc.png' }), { status: 201 }),
    );
    expect((await POST(upload(), context('management/media'))).status).toBe(201);
    const other = new Request(`${origin}/api/store/auth/register`, {
      method: 'POST',
      headers: { Origin: origin },
      body: form,
    });
    expect((await POST(other, context('auth/register'))).status).toBe(415);
  });
  it('CSV yêu cầu phiên và trả file no-store, không biến nội dung thành JSON null', async () => {
    const url = `${origin}/api/store/management/reports/orders.csv`;
    expect((await GET(new Request(url), context('management/reports/orders.csv'))).status).toBe(
      401,
    );
    values.set('store_access', 'test-token');
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response('OrderCode,Total\nTEST,100\n', { headers: { 'Content-Type': 'text/csv' } }),
    );
    const response = await GET(new Request(url), context('management/reports/orders.csv'));
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/csv');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).toContain('TEST,100');
  });
  it('giữ query phân trang, không yêu cầu cookie cho catalog/workshop công khai', async () => {
    const response = await GET(
      new Request(`${origin}/api/store/catalog/products?page=2&pageSize=5`),
      context('catalog/products'),
    );
    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:5085/api/catalog/products?page=2&pageSize=5',
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(
      (await GET(new Request(`${origin}/api/store/workshops`), context('workshops'))).status,
    ).toBe(200);
  });
  it('chặn write gate, Origin khác và truy cập đơn không đăng nhập', async () => {
    vi.stubEnv('STOREFRONT_WRITES_ENABLED', 'false');
    expect((await POST(writeRequest('orders/checkout'), context('orders/checkout'))).status).toBe(
      503,
    );
    vi.stubEnv('STOREFRONT_WRITES_ENABLED', 'true');
    expect(
      (
        await POST(
          writeRequest('orders/checkout', {}, 'POST', 'https://evil.test'),
          context('orders/checkout'),
        )
      ).status,
    ).toBe(403);
    expect((await GET(new Request(`${origin}/api/store/orders`), context('orders'))).status).toBe(
      401,
    );
    expect(fetch).not.toHaveBeenCalled();
  });
  it('đăng ký chỉ trả user, token giữ trong cookie HttpOnly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          user: { id: uuid, role: 'Customer' },
          accessToken: 'access-secret',
          refreshToken: 'refresh-secret',
          expiresAt: new Date(Date.now() + 600000).toISOString(),
        }),
        { status: 201 },
      ),
    );
    const response = await POST(writeRequest('auth/register'), context('auth/register'));
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ id: uuid, role: 'Customer' });
    const cookies = response.headers.get('set-cookie');
    expect(cookies).toContain('HttpOnly');
    expect(cookies).toContain('SameSite=lax');
    expect(cookies).toContain('store_access=');
    expect(cookies).toContain('store_refresh=');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });
  it('204 địa chỉ không bị biến thành lỗi 503', async () => {
    values.set('store_access', 'test-token');
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 204 }));
    const response = await DELETE(
      new Request(`${origin}/api/store/addresses/${uuid}`, {
        method: 'DELETE',
        headers: { Origin: origin },
      }),
      context(`addresses/${uuid}`),
    );
    expect(response.status).toBe(204);
    expect(await response.text()).toBe('');
  });
  it('logout vẫn xóa cookie khi backend offline và access đã hết hạn', async () => {
    values.set('store_refresh', 'test-refresh');
    vi.mocked(fetch).mockRejectedValueOnce(new Error('internal host unreachable'));
    const response = await POST(writeRequest('auth/logout'), context('auth/logout'));
    expect(response.status).toBe(503);
    expect(response.headers.get('set-cookie')).toContain('store_access=;');
    expect(response.headers.get('set-cookie')).toContain('store_refresh=;');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    expect(await response.text()).not.toContain('internal host');
  });
  it('chặn thanh toán chưa có provider, path lạ và body quá lớn', async () => {
    expect((await POST(writeRequest('payments'), context('payments'))).status).toBe(404);
    expect((await GET(new Request(`${origin}/api/store/secrets`), context('secrets'))).status).toBe(
      404,
    );
    const request = writeRequest('auth/login');
    request.headers.set('content-length', '2000000');
    expect((await POST(request, context('auth/login'))).status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });
});
