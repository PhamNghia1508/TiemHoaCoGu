import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import {
  ApiError,
  apiFetch,
  bookingsApi,
  catalogApi,
  cmsApi,
  ordersApi,
  workshopsApi,
} from './client';

const jsonResponse = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });

const request = () => vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit;

beforeEach(() => {
  process.env.API_BASE_URL = ' https://api.example.test/ ';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ ok: true }))),
  );
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  delete process.env.API_BASE_URL;
});

describe('apiFetch', () => {
  it('normalizes the base URL/path and sends JSON, auth, and no-store headers', async () => {
    const result = await apiFetch<{ ok: boolean }>(
      'orders',
      {
        method: 'POST',
        body: JSON.stringify({ hello: 'world' }),
        headers: { 'X-Request': 'test' },
      },
      { token: 'secret-token' },
    );

    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.test/orders',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ hello: 'world' }),
        cache: 'no-store',
        signal: expect.any(AbortSignal),
      }),
    );
    const headers = new Headers(request().headers);
    expect(headers.get('Accept')).toBe('application/json');
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBe('Bearer secret-token');
    expect(headers.get('X-Request')).toBe('test');
  });

  it('preserves an explicitly supplied content type', async () => {
    await apiFetch('/raw', {
      method: 'POST',
      body: 'raw',
      headers: { 'Content-Type': 'text/plain' },
    });
    expect(new Headers(request().headers).get('Content-Type')).toBe('text/plain');
  });

  it('parses JSON and plain-text successful responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({ value: 3 }));
    await expect(apiFetch('/json')).resolves.toEqual({ value: 3 });
    vi.mocked(fetch).mockResolvedValueOnce(new Response('created', { status: 201 }));
    await expect(apiFetch('/text')).resolves.toBe('created');
  });

  it('surfaces API errors with status, message, and parsed details', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse({ message: 'Không tìm thấy' }, { status: 404 }),
    );
    const error = await apiFetch('/missing').catch((value) => value);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 404,
      message: 'Không tìm thấy',
      details: { message: 'Không tìm thấy' },
    });

    vi.mocked(fetch).mockResolvedValueOnce(new Response('bad gateway', { status: 502 }));
    await expect(apiFetch('/failure')).rejects.toMatchObject({
      status: 502,
      message: 'API request failed (502)',
      details: 'bad gateway',
    });
  });

  it('wraps network failures and reports a missing API base URL', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));
    await expect(apiFetch('/network')).rejects.toMatchObject({ status: 0, message: 'offline' });
    delete process.env.API_BASE_URL;
    await expect(apiFetch('/without-base')).rejects.toMatchObject({
      status: 0,
      message: 'API_BASE_URL chưa được cấu hình (server-only).',
    });
  });

  it('converts an aborted request into a 408 timeout and clears its timer', async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );
    const pending = apiFetch('/slow', {}, { timeoutMs: 25 });
    const assertion = expect(pending).rejects.toMatchObject({
      status: 408,
      message: 'API request timeout',
    });
    await vi.advanceTimersByTimeAsync(25);
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('API endpoint helpers', () => {
  it('builds catalog and CMS routes with defaults and encoded query values', async () => {
    await catalogApi({ token: 'catalog-token' }).products({
      search: 'hoa hồng',
      categoryId: 'bo/1',
      section: 'new',
      page: 2,
      pageSize: 5,
    });
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api.example.test/api/catalog/products?page=2&pageSize=5&search=hoa+h%E1%BB%93ng&categoryId=bo%2F1&section=new',
      expect.anything(),
    );
    expect(new Headers(request().headers).get('Authorization')).toBe('Bearer catalog-token');

    await catalogApi().categories();
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api.example.test/api/catalog/categories',
      expect.anything(),
    );
    await cmsApi().products({ isActive: false });
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api.example.test/api/management/products?isActive=false&page=1&pageSize=20',
      expect.anything(),
    );
  });

  it('builds order, workshop, booking, and CMS request methods correctly', async () => {
    const checkout = {
      shippingAddress: '12 Nguyễn Huệ',
      items: [{ productId: 'p1', quantity: 2 }],
    };
    await ordersApi().checkout(checkout);
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api.example.test/api/orders/checkout',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(checkout) }),
    );
    await ordersApi().mine();
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api.example.test/api/orders',
      expect.anything(),
    );
    await ordersApi().deliveries('order/1');
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api.example.test/api/orders/order/1/deliveries',
      expect.anything(),
    );

    await workshopsApi().sessions('w1');
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api.example.test/api/workshops/w1/sessions',
      expect.anything(),
    );
    const booking = {
      ticketCount: 2,
      customerName: 'An',
      customerPhone: '0900',
      idempotencyKey: 'key',
    };
    await bookingsApi().hold('session-1', booking);
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api.example.test/api/bookings/sessions/session-1',
      expect.objectContaining({ method: 'POST', body: JSON.stringify(booking) }),
    );
    await cmsApi().categories();
    expect(fetch).toHaveBeenLastCalledWith(
      'https://api.example.test/api/management/categories',
      expect.anything(),
    );
  });
});
