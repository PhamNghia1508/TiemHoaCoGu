import { vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { describe, expect, it } from 'vitest';
import { resolveStoreRoute, sameOrigin } from './store-bff';
describe('store BFF security', () => {
  it('allows only explicit routes and methods', () => {
    expect(resolveStoreRoute(['orders', 'checkout'], 'POST')).not.toBeNull();
    expect(resolveStoreRoute(['admin', 'users'], 'GET')).toBeNull();
    expect(resolveStoreRoute(['orders'], 'POST')).toBeNull();
  });
  it('requires exact request URL origin', () => {
    expect(
      sameOrigin(
        new Request('https://shop.test/api/store/orders', {
          method: 'POST',
          headers: { origin: 'https://shop.test' },
        }),
      ),
    ).toBe(true);
    expect(
      sameOrigin(
        new Request('https://shop.test/api/store/orders', {
          method: 'POST',
          headers: { origin: 'https://evil.test' },
        }),
      ),
    ).toBe(false);
    expect(sameOrigin(new Request('https://shop.test/api/store/orders', { method: 'POST' }))).toBe(
      false,
    );
  });
});
