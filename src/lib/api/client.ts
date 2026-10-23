import 'server-only';

export type ApiClientOptions = { token?: string; timeoutMs?: number };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function baseUrl(): string {
  const value = process.env.API_BASE_URL?.trim();
  if (!value) throw new Error('API_BASE_URL chưa được cấu hình (server-only).');
  return value.replace(/\/$/, '');
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options: ApiClientOptions = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 10_000);
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (options.token) headers.set('Authorization', `Bearer ${options.token}`);
  try {
    const response = await fetch(`${baseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
      signal: controller.signal,
      cache: 'no-store',
    });
    const text = await response.text();
    let data: unknown = undefined;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
    if (!response.ok) {
      const message =
        typeof data === 'object' && data && 'message' in data
          ? String((data as { message: unknown }).message)
          : `API request failed (${response.status})`;
      throw new ApiError(response.status, message, data);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError')
      throw new ApiError(408, 'API request timeout');
    throw new ApiError(0, error instanceof Error ? error.message : 'Không thể kết nối API', error);
  } finally {
    clearTimeout(timeout);
  }
}

const qs = (params: Record<string, string | number | boolean | undefined>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && search.set(k, String(v)));
  return search.toString() ? `?${search}` : '';
};
const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

export type PageResult<T> = { items: T[]; page: number; pageSize: number; total: number };
export type Category = {
  id: string;
  code: string;
  name: string;
  description?: string;
  imageUrl?: string;
};
export type Product = {
  id: string;
  categoryId: string;
  code: string;
  name: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl?: string;
  description?: string;
  badge?: string;
  section?: string;
  isCustomizable: boolean;
  isPreOrder: boolean;
  isActive: boolean;
};
export type ProductDetail = Product & {
  quantityAvailable: number;
  images: { id: string; imageUrl: string; displayOrder: number }[];
};
export type CatalogQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  categoryId?: string;
  section?: string;
};
export type OrderLine = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  finalPrice: number;
  shippedQuantity: number;
  customNote?: string;
  referenceImageUrl?: string;
};
export type Order = {
  id: string;
  orderCode: string;
  subTotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  shippingAddress: string;
  createdAt: string;
  items: OrderLine[];
};
export type CheckoutRequest = {
  shippingAddress: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverEmail?: string;
  note?: string;
  voucherCode?: string;
  idempotencyKey?: string;
  items: { productId: string; quantity: number; customNote?: string; referenceImageUrl?: string }[];
  shippingQuoteId?: string;
};
export type Delivery = {
  id: string;
  deliveryCode: string;
  shipperUnit?: string;
  trackingNumber?: string;
  deliveryStatus: string;
  items: { orderItemId: string; quantity: number }[];
};
export type CustomRequest = {
  id: string;
  productId: string;
  quantity: number;
  description: string;
  referenceImageUrl: string;
  requestedCompletionDate?: string;
  status: string;
  createdAt: string;
};
export type CustomQuote = {
  id: string;
  requestId: string;
  currentRevision: number;
  status: string;
  expiresAt?: string;
  revisions: CustomQuoteRevision[];
  orderId?: string;
  paidAmount: number;
  balanceAmount: number;
};
export type CustomQuoteRevision = {
  version: number;
  unitPrice?: number;
  totalAmount?: number;
  depositAmount?: number;
  paidAmount: number;
  balanceAmount: number;
  completionDate: string;
  expiresAt: string;
  adminNote: string;
  createdAt: string;
  status: string;
};
export type CustomRequestInput = {
  productId: string;
  quantity: number;
  description: string;
  referenceImageUrl?: string;
  requestedCompletionDate?: string;
};
export type CustomCheckout = {
  orderId: string;
  orderCode: string;
  quoteVersion: number;
  totalAmount: number;
  depositAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentStatus: string;
};
export type WorkshopList = {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  category?: string;
  basePrice: number;
  duration: number;
  maxCapacity: number;
  description?: string;
  isFeatured: boolean;
  isActive: boolean;
};
export type Workshop = WorkshopList & {
  leadContent?: string;
  goalsJson?: string;
  includesJson?: string;
  forWho?: string;
  instructorId?: string;
};
export type Session = {
  id: string;
  workshopId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  bookedSlots: number;
  sessionStatus: string;
};
export type Booking = {
  id: string;
  sessionId: string;
  bookingCode: string;
  customerName: string;
  ticketCount: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  bookingStatus: string;
  holdExpiresAt: string;
  checkedInAt?: string;
  createdAt: string;
};

export const catalogApi = (o?: ApiClientOptions) => ({
  products: (q: CatalogQuery = {}) =>
    apiFetch<PageResult<Product>>(
      `/api/catalog/products${qs({ page: q.page ?? 1, pageSize: q.pageSize ?? 20, search: q.search, categoryId: q.categoryId, section: q.section })}`,
      {},
      o,
    ),
  product: (id: string) => apiFetch<ProductDetail>(`/api/catalog/products/${id}`, {}, o),
  categories: () => apiFetch<Category[]>('/api/catalog/categories', {}, o),
});

export const ordersApi = (o?: ApiClientOptions) => ({
  checkout: (body: CheckoutRequest) =>
    apiFetch<Order>('/api/orders/checkout', json('POST', body), o),
  mine: () => apiFetch<Order[]>('/api/orders', {}, o),
  order: (id: string) => apiFetch<Order>(`/api/orders/${id}`, {}, o),
  deliveries: (id: string) => apiFetch<Delivery[]>(`/api/orders/${id}/deliveries`, {}, o),
});
export const customOrdersApi = (o?: ApiClientOptions) => ({
  create: (body: CustomRequestInput) =>
    apiFetch<CustomRequest>('/api/custom-orders', json('POST', body), o),
  revise: (id: string, body: CustomRequestInput) =>
    apiFetch<CustomRequest>(`/api/custom-orders/${id}`, json('PUT', body), o),
  mine: () => apiFetch<CustomRequest[]>('/api/custom-orders', {}, o),
  quote: (id: string) => apiFetch<CustomQuote>(`/api/custom-orders/${id}`, {}, o),
  approve: (id: string, version: number) =>
    apiFetch<CustomQuote>(`/api/custom-orders/${id}/approve`, json('POST', { version }), o),
  checkout: (
    id: string,
    body: { shippingAddress: string; note?: string; idempotencyKey: string },
  ) => apiFetch<CustomCheckout>(`/api/custom-orders/${id}/checkout`, json('POST', body), o),
});
export const workshopsApi = (o?: ApiClientOptions) => ({
  list: () => apiFetch<WorkshopList[]>('/api/workshops', {}, o),
  workshop: (id: string) => apiFetch<Workshop>(`/api/workshops/${id}`, {}, o),
  sessions: (id: string) => apiFetch<Session[]>(`/api/workshops/${id}/sessions`, {}, o),
});
export const bookingsApi = (o?: ApiClientOptions) => ({
  hold: (
    sessionId: string,
    body: {
      ticketCount: number;
      customerName: string;
      customerPhone: string;
      customerEmail?: string;
      idempotencyKey?: string;
    },
  ) => apiFetch<Booking>(`/api/bookings/sessions/${sessionId}`, json('POST', body), o),
  mine: () => apiFetch<Booking[]>('/api/bookings', {}, o),
  booking: (id: string) => apiFetch<Booking>(`/api/bookings/${id}`, {}, o),
});
export const cmsApi = (o?: ApiClientOptions) => ({
  categories: () => apiFetch<Category[]>('/api/management/categories', {}, o),
  products: (
    q: {
      search?: string;
      categoryId?: string;
      isActive?: boolean;
      page?: number;
      pageSize?: number;
    } = {},
  ) =>
    apiFetch<PageResult<Product>>(
      `/api/management/products${qs({ search: q.search, categoryId: q.categoryId, isActive: q.isActive, page: q.page ?? 1, pageSize: q.pageSize ?? 20 })}`,
      {},
      o,
    ),
});
