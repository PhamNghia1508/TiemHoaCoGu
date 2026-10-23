'use client';

export type AdminMe = {
  id?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  role?: string;
  isAuthenticated?: boolean;
};
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
  shippingWeightGrams?: number;
  isActive: boolean;
  quantityAvailable?: number;
};
export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
export type Voucher = {
  id: string;
  code: string;
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
};
export type Order = {
  id: string;
  orderCode: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  shippingAddress: string;
  note: string;
  createdAt: string;
  items?: {
    id: string;
    productName?: string;
    quantity: number;
    unitPrice: number;
    finalPrice: number;
  }[];
};
export type Dashboard = {
  orderCount: number;
  revenue: number;
  paidAmount: number;
  refundAmount: number;
  netCollected: number;
  customerCount: number;
  productCount: number;
  lowStockCount: number;
  ordersByStatus?: { status: string; count: number }[];
  dailyRevenue?: { date: string; amount: number }[];
  topProducts?: { name: string; quantity: number; revenue: number }[];
};

/** All admin calls go through the parent BFF. The BFF must whitelist the path and enforce STOREFRONT_WRITES_ENABLED. */
export async function storeRequest<T>(path: string, body?: unknown, method = 'GET'): Promise<T> {
  const storePath = path.replace(/^\/api\//, '');
  const response = await fetch(`/api/store/${storePath}`, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store',
  });
  const text = await response.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }
  if (!response.ok) {
    const message =
      typeof data === 'object' && data && 'error' in data
        ? String((data as { error: unknown }).error)
        : `Yêu cầu thất bại (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

export const adminPaths = {
  me: '/api/auth/me',
  categories: '/api/management/categories',
  products: '/api/management/products',
  inventory: (id: string) => `/api/management/inventory/${id}`,
  vouchers: '/api/management/vouchers',
  orders: '/api/management/orders',
  dashboard: '/api/management/dashboard',
  accounts: '/api/management/accounts',
  audit: '/api/management/audit-logs',
};

/** Parent BFF whitelist (exact backend paths used by this page). */
export const adminBffWhitelist = [
  '/api/auth/me',
  '/api/management/categories',
  '/api/management/products',
  '/api/management/inventory/{productId}',
  '/api/management/dashboard',
  '/api/management/orders',
  '/api/management/vouchers',
  '/api/management/accounts',
  '/api/management/audit-logs',
] as const;
