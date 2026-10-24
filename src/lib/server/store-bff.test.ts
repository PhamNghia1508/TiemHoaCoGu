import { vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { describe, expect, it } from 'vitest';
import { resolveStoreRoute, sameOrigin } from './store-bff';
describe('store BFF security', () => {
  it('allows only explicit routes and methods', () => {
    expect(resolveStoreRoute(['orders', 'checkout'], 'POST')).not.toBeNull();
    expect(resolveStoreRoute(['admin', 'users'], 'GET')).toBeNull();
    expect(resolveStoreRoute(['orders'], 'POST')).toBeNull();
    expect(resolveStoreRoute(['shipping', 'locations', 'provinces'], 'GET')).toEqual({
      upstream: '/api/shipping/locations/provinces',
      protected: true,
      write: false,
    });
    expect(resolveStoreRoute(['shipping', 'locations', 'wards'], 'GET')).toEqual({
      upstream: '/api/shipping/locations/wards',
      protected: true,
      write: false,
    });
    expect(resolveStoreRoute(['shipping', 'locations', 'wards'], 'POST')).toBeNull();
    expect(resolveStoreRoute(['shipping', 'locations', 'custom'], 'GET')).toBeNull();
  });
  it('allows only public payment readiness and authenticated order-scoped MoMo sandbox routes', () => {
    const id = '00000000-0000-4000-8000-000000000001';
    expect(resolveStoreRoute(['gateway', 'availability'], 'GET')).toEqual({
      upstream: '/api/gateway/availability',
      protected: false,
      write: false,
    });
    expect(resolveStoreRoute(['gateway', 'orders', id, 'charge'], 'POST')).toEqual({
      upstream: `/api/gateway/orders/${id}/charge`,
      protected: true,
      write: true,
    });
    expect(resolveStoreRoute(['gateway', 'orders', id, 'balance'], 'GET')).toEqual({
      upstream: `/api/gateway/orders/${id}/balance`,
      protected: true,
      write: false,
    });
    expect(resolveStoreRoute(['gateway', 'orders', 'anything', 'charge'], 'POST')).toBeNull();
    expect(resolveStoreRoute(['gateway', 'reconciliation'], 'GET')).toEqual({
      upstream: '/api/gateway/reconciliation',
      protected: true,
      write: false,
    });
    expect(resolveStoreRoute(['gateway', 'reconciliation', id, 'query'], 'POST')).toEqual({
      upstream: `/api/gateway/reconciliation/${id}/query`,
      protected: true,
      write: true,
    });
    expect(resolveStoreRoute(['gateway', 'reconciliation', id], 'POST')).toEqual({
      upstream: `/api/gateway/reconciliation/${id}`,
      protected: true,
      write: true,
    });
    expect(resolveStoreRoute(['gateway', 'reconciliation', 'anything'], 'POST')).toBeNull();
    expect(resolveStoreRoute(['gateway', 'reconciliation', id, 'refund'], 'POST')).toBeNull();
  });
  it('allows only the protected notification queue and GUID-scoped reconciliation operation', () => {
    const id = '00000000-0000-4000-8000-000000000001';
    expect(resolveStoreRoute(['management', 'notifications'], 'GET')).toEqual({
      upstream: '/api/management/notifications',
      protected: true,
      write: false,
    });
    expect(resolveStoreRoute(['management', 'notifications', id, 'reconcile'], 'POST')).toEqual({
      upstream: `/api/management/notifications/${id}/reconcile`,
      protected: true,
      write: true,
    });
    expect(resolveStoreRoute(['management', 'notifications'], 'POST')).toBeNull();
    expect(
      resolveStoreRoute(['management', 'notifications', 'anything', 'reconcile'], 'POST'),
    ).toBeNull();
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
