import 'server-only';
import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'store_access';
export const REFRESH_COOKIE = 'store_refresh';
export const MAX_BODY_BYTES = 1_048_576;
export const UPSTREAM_TIMEOUT_MS = 10_000;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const GUID =
  '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}';

export type StoreRoute = { upstream: string; protected: boolean; write: boolean };

/** Explicit storefront/CMS allow-list. It is deliberately not a generic proxy. */
export function resolveStoreRoute(path: string[], method: string): StoreRoute | null {
  if (
    path.length === 0 ||
    path.some((segment) => !segment || segment === '.' || segment === '..' || segment.includes('/'))
  )
    return null;
  const p = path.join('/');
  const m = method.toUpperCase();
  const exact: Record<string, { methods: string[]; protected: boolean }> = {
    'auth/login': { methods: ['POST'], protected: false },
    'auth/register': { methods: ['POST'], protected: false },
    'auth/logout': { methods: ['POST'], protected: false },
    'auth/me': { methods: ['GET'], protected: true },
    'auth/change-password': { methods: ['POST'], protected: true },
    status: { methods: ['GET'], protected: false },
    'gateway/availability': { methods: ['GET'], protected: false },
    'gateway/reconciliation': { methods: ['GET'], protected: true },
    orders: { methods: ['GET'], protected: true },
    'orders/staff': { methods: ['GET'], protected: true },
    'orders/checkout': { methods: ['POST'], protected: true },
    workshops: { methods: ['GET'], protected: false },
    'catalog/products': { methods: ['GET'], protected: false },
    'catalog/categories': { methods: ['GET'], protected: false },
    'shipping/locations/provinces': { methods: ['GET'], protected: true },
    'shipping/locations/wards': { methods: ['GET'], protected: true },
    'shipping/quote': { methods: ['POST'], protected: true },
    cart: { methods: ['GET', 'POST'], protected: true },
    addresses: { methods: ['GET', 'POST'], protected: true },
    bookings: { methods: ['GET'], protected: true },
  };
  const found = exact[p];
  if (found?.methods.includes(m))
    return { upstream: `/api/${p}`, protected: found.protected, write: WRITE_METHODS.has(m) };

  const patterns: Array<{ pattern: RegExp; methods: string[]; protected: boolean }> = [
    { pattern: new RegExp(`^catalog/products/${GUID}$`), methods: ['GET'], protected: false },
    { pattern: new RegExp(`^orders/${GUID}$`), methods: ['GET'], protected: true },
    { pattern: new RegExp(`^gateway/orders/${GUID}/charge$`), methods: ['POST'], protected: true },
    { pattern: new RegExp(`^gateway/orders/${GUID}/balance$`), methods: ['GET'], protected: true },
    {
      pattern: new RegExp(`^gateway/reconciliation/${GUID}/query$`),
      methods: ['POST'],
      protected: true,
    },
    { pattern: new RegExp(`^gateway/reconciliation/${GUID}$`), methods: ['POST'], protected: true },
    {
      pattern: new RegExp(`^orders/${GUID}/deliveries$`),
      methods: ['GET', 'POST'],
      protected: true,
    },
    { pattern: new RegExp(`^orders/${GUID}/cancel$`), methods: ['POST'], protected: true },
    { pattern: new RegExp(`^workshops/${GUID}$`), methods: ['GET'], protected: false },
    { pattern: new RegExp(`^workshops/${GUID}/sessions$`), methods: ['GET'], protected: false },
    // Booking writes intentionally require auth so a user's history is reliable.
    { pattern: new RegExp(`^bookings/sessions/${GUID}$`), methods: ['POST'], protected: true },
    { pattern: new RegExp(`^bookings/${GUID}$`), methods: ['GET'], protected: true },
    { pattern: new RegExp(`^bookings/${GUID}/cancel$`), methods: ['POST'], protected: true },
    { pattern: /^custom-orders$/, methods: ['GET', 'POST'], protected: true },
    { pattern: new RegExp(`^custom-orders/${GUID}$`), methods: ['GET', 'PUT'], protected: true },
    {
      pattern: new RegExp(`^custom-orders/${GUID}/(quote|approve|checkout)$`),
      methods: ['POST'],
      protected: true,
    },
    { pattern: new RegExp(`^cart/${GUID}$`), methods: ['DELETE'], protected: true },
    { pattern: new RegExp(`^addresses/${GUID}$`), methods: ['PUT', 'DELETE'], protected: true },
  ];
  for (const candidate of patterns) {
    if (candidate.pattern.test(p) && candidate.methods.includes(m))
      return { upstream: `/api/${p}`, protected: candidate.protected, write: WRITE_METHODS.has(m) };
  }

  const operational: Array<{ pattern: RegExp; methods: string[] }> = [
    { pattern: new RegExp(`^orders/${GUID}/status$`), methods: ['POST'] },
    { pattern: new RegExp(`^orders/${GUID}/deliveries/${GUID}/status$`), methods: ['POST'] },
    { pattern: new RegExp(`^orders/staff/${GUID}/deliveries$`), methods: ['GET'] },
    { pattern: new RegExp(`^bookings/${GUID}/(check-in|no-show)$`), methods: ['POST'] },
  ];
  for (const candidate of operational) {
    if (candidate.pattern.test(p) && candidate.methods.includes(m))
      return { upstream: `/api/${p}`, protected: true, write: WRITE_METHODS.has(m) };
  }
  // CMS agent routes from the BE OpenAPI contract. IDs are always GUIDs; no arbitrary management proxy.
  const managementExact: Record<string, string[]> = {
    'management/categories': ['GET', 'POST'],
    'management/products': ['GET', 'POST'],
    'management/vouchers': ['GET', 'POST'],
    'management/inventory': [],
    'management/accounts': ['GET', 'POST'],
    'management/notifications': ['GET'],
    'management/permissions': ['GET'],
    'management/audit-logs': ['GET'],
    'management/orders': ['GET'],
    'management/dashboard': ['GET'],
    'management/reports/orders.csv': ['GET'],
    'management/media': ['POST'],
  };
  if (managementExact[p]?.includes(m))
    return { upstream: `/api/${p}`, protected: true, write: WRITE_METHODS.has(m) };
  const managementPatterns: Array<{ pattern: RegExp; methods: string[] }> = [
    {
      pattern: new RegExp(`^management/(categories|products)/${GUID}$`),
      methods: ['GET', 'PUT', 'DELETE'],
    },
    { pattern: new RegExp(`^management/products/${GUID}/images$`), methods: ['GET', 'POST'] },
    { pattern: new RegExp(`^management/products/${GUID}/active$`), methods: ['PATCH'] },
    {
      pattern: new RegExp(`^management/products/${GUID}/images/${GUID}$`),
      methods: ['PUT', 'DELETE'],
    },
    { pattern: new RegExp(`^management/orders/${GUID}$`), methods: ['GET'] },
    { pattern: new RegExp(`^management/vouchers/${GUID}$`), methods: ['PUT'] },
    { pattern: new RegExp(`^management/vouchers/${GUID}/active$`), methods: ['PATCH'] },
    { pattern: new RegExp(`^management/inventory/${GUID}$`), methods: ['PUT'] },
    { pattern: new RegExp(`^management/accounts/${GUID}$`), methods: ['PUT'] },
    { pattern: new RegExp(`^management/accounts/${GUID}/reset-password$`), methods: ['POST'] },
    { pattern: new RegExp(`^management/notifications/${GUID}/reconcile$`), methods: ['POST'] },
  ];
  for (const candidate of managementPatterns) {
    if (candidate.pattern.test(p) && candidate.methods.includes(m))
      return { upstream: `/api/${p}`, protected: true, write: WRITE_METHODS.has(m) };
  }
  const workshopManagement: Array<{ pattern: RegExp; methods: string[] }> = [
    { pattern: /^workshops$/, methods: ['POST'] },
    { pattern: new RegExp(`^workshops/${GUID}$`), methods: ['PUT', 'DELETE'] },
    { pattern: new RegExp(`^workshops/${GUID}/sessions$`), methods: ['POST'] },
    { pattern: new RegExp(`^workshops/sessions/${GUID}/roster$`), methods: ['GET'] },
    { pattern: new RegExp(`^workshops/sessions/${GUID}$`), methods: ['PUT', 'DELETE'] },
    { pattern: new RegExp(`^workshops/sessions/${GUID}/close$`), methods: ['POST'] },
    {
      pattern: new RegExp(`^custom-orders/${GUID}/(production/start|complete)$`),
      methods: ['POST'],
    },
  ];
  for (const candidate of workshopManagement) {
    if (candidate.pattern.test(p) && candidate.methods.includes(m))
      return { upstream: `/api/${p}`, protected: true, write: WRITE_METHODS.has(m) };
  }
  return null;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return Boolean(origin && origin === new URL(request.url).origin);
}

function apiBase(): string {
  const value = process.env.API_BASE_URL?.trim();
  if (!value) throw new Error('API_BASE_URL chưa được cấu hình.');
  return value.replace(/\/$/, '');
}
export function writesEnabled(): boolean {
  return process.env.STOREFRONT_WRITES_ENABLED === 'true';
}
export function publicError(status: number): string {
  return status === 401
    ? 'Yêu cầu đăng nhập.'
    : status === 403
      ? 'Không có quyền thực hiện.'
      : status >= 500
        ? 'Dịch vụ đang tạm thời không khả dụng.'
        : 'Yêu cầu không hợp lệ.';
}

async function boundedBody(request: Request): Promise<Uint8Array<ArrayBuffer> | undefined> {
  if (!request.body) return undefined;
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new Error('REQUEST_BODY_TOO_LARGE');
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}
export async function forward(
  request: Request,
  upstreamPath: string,
  token?: string,
): Promise<{ response: Response; data: unknown }> {
  const headers = new Headers({
    Accept: upstreamPath === '/api/management/reports/orders.csv' ? 'text/csv' : 'application/json',
  });
  const contentType = request.headers.get('content-type');
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    if (contentType) headers.set('Content-Type', contentType);
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > MAX_BODY_BYTES) throw new Error('REQUEST_BODY_TOO_LARGE');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const query = new URL(request.url).search;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
  try {
    const body =
      request.method === 'GET' || request.method === 'HEAD'
        ? undefined
        : await boundedBody(request);
    if (body && body.byteLength > MAX_BODY_BYTES) throw new Error('REQUEST_BODY_TOO_LARGE');
    const response = await fetch(`${apiBase()}${upstreamPath}${query}`, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'error',
      signal: controller.signal,
    });
    const text = await response.text();
    let data: unknown = null;
    if (upstreamPath === '/api/management/reports/orders.csv' && response.ok) data = text;
    else
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
    return { response, data };
  } finally {
    clearTimeout(timer);
  }
}
export async function storeCookies() {
  return cookies();
}
export function cookieOptions(maxAge?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    ...(maxAge !== undefined ? { maxAge } : {}),
  };
}
