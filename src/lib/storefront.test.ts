import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { getStorefront, getStorefrontProduct, safeImageUrl } from './storefront';
const productId = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const category = { id: productId(999), name: 'Danh mục thật', code: 'REAL' };
const product = (n: number) => ({
  id: productId(n),
  name: `Hoa backend ${n}`,
  categoryId: category.id,
  price: 123000,
  quantityAvailable: n === 1 ? 0 : 7,
  isPreOrder: false,
  isCustomizable: true,
  thumbnailUrl: '/api/media/0123456789abcdef0123456789abcdef.png',
});
const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  vi.stubEnv('API_BASE_URL', 'http://backend.test');
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe('adapter storefront SSR', () => {
  it('chỉ dùng demo khi hoàn toàn chưa cấu hình API', async () => {
    vi.stubEnv('API_BASE_URL', '');
    const value = await getStorefront();
    expect(value.mode).toBe('preview');
    expect(value.products.length).toBeGreaterThan(0);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('API lỗi không fallback demo và không đưa exception/credential xuống browser', async () => {
    vi.mocked(fetch).mockRejectedValue(
      new Error('http://private-user:private-password@internal.test/database'),
    );
    const value = await getStorefront();
    expect(value.mode).toBe('unavailable');
    expect(value.products).toEqual([]);
    expect(JSON.stringify(value)).not.toMatch(/private-user|private-password|internal\.test/);
  });
  it('tải đầy đủ các trang, map GUID/giá/category và không lấy workshop mẫu khi API workshop lỗi', async () => {
    vi.mocked(fetch).mockImplementation(async (input) => {
      const url = new URL(String(input));
      if (url.pathname.endsWith('/categories')) return json([category]);
      if (url.pathname.endsWith('/products')) {
        const page = Number(url.searchParams.get('page'));
        return json({
          items:
            page === 1 ? Array.from({ length: 100 }, (_, i) => product(i + 1)) : [product(101)],
          total: 101,
          page,
          pageSize: 100,
        });
      }
      return json({ error: 'Unavailable' }, 503);
    });
    const value = await getStorefront();
    expect(value.mode).toBe('connected');
    expect(value.products).toHaveLength(101);
    expect(value.products.at(-1)).toMatchObject({
      id: productId(101),
      backendId: productId(101),
      price: 123000,
      category: category.id,
      isCustomizable: true,
      quantityAvailable: 7,
    });
    expect(value.products[0].quantityAvailable).toBe(0);
    expect(value.workshops).toBeUndefined();
  });
  it('detail 404 trả null thay vì sản phẩm mẫu', async () => {
    vi.mocked(fetch).mockImplementation(async () => json({ error: 'Not found' }, 404));
    expect(await getStorefrontProduct(productId(1))).toBeNull();
  });
  it('ảnh chỉ cho local hợp lệ hoặc HTTP(S) không userinfo, không URL proxy tùy ý', () => {
    for (const value of [
      'javascript:alert(1)',
      'data:image/svg+xml,test',
      '//evil.test/x.png',
      '/api/media/../../secret',
      '/images/../secret',
      'https://user:password@host.test/a.png',
    ])
      expect(safeImageUrl(value)).toBe('/images/prod-bouquet.webp');
    expect(safeImageUrl('/api/media/0123456789abcdef0123456789abcdef.png')).toBe(
      '/api/media/0123456789abcdef0123456789abcdef.png',
    );
    expect(safeImageUrl('https://cdn.example.test/a.png')).toBe('https://cdn.example.test/a.png');
  });
});
