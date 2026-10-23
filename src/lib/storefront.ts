import 'server-only';

import { cache } from 'react';

import {
  ApiError,
  catalogApi,
  workshopsApi,
  type Category,
  type Product as ApiProduct,
  type ProductDetail,
  type Session,
  type WorkshopList,
} from '@/lib/api/client';
import {
  products as sampleProducts,
  categories as sampleCategories,
  type Product,
} from '@/lib/catalog';

export type StorefrontMode = 'preview' | 'connected' | 'unavailable';
export type StorefrontWorkshop = WorkshopList & { sessions: Session[] };
export type Storefront = {
  products: Product[];
  categories: { id: string; label: string }[];
  workshops?: StorefrontWorkshop[];
  mode: StorefrontMode;
  error?: string;
};

const FALLBACK_IMAGE = '/images/prod-bouquet.webp';
const PAGE_SIZE = 100;
const MAX_PRODUCTS = 1000;

/** Only local relative paths and http(s) URLs are allowed into the image layer. */
export function safeImageUrl(value: unknown, fallback = FALLBACK_IMAGE): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const source = value.trim();
  if (source.startsWith('/')) {
    if (/^\/api\/media\/[0-9a-fA-F]{32}\.(png|jpg|webp)$/.test(source)) return source;
    if (
      source.startsWith('/images/') &&
      !source.includes('..') &&
      !/[\\\u0000-\u001f\u007f]/.test(source)
    )
      return source;
    return fallback;
  }
  try {
    const url = new URL(source);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return fallback;
    if (url.username || url.password || /[\\\u0000-\u001f\u007f]/.test(source)) return fallback;
    return url.toString();
  } catch {
    return fallback;
  }
}

function categoryLabel(category: Category): string {
  return category.name || category.code || category.id;
}
function mapProduct(item: ApiProduct | ProductDetail, cats: Category[]): Product {
  const category = cats.find((c) => c.id === item.categoryId);
  const image = safeImageUrl(item.thumbnailUrl);
  const images = 'images' in item ? item.images.map((x) => safeImageUrl(x.imageUrl)) : [];
  const imageIsFallback = !item.thumbnailUrl || safeImageUrl(item.thumbnailUrl, '') === '';
  return {
    id: item.id,
    name: item.name,
    subtitle: category ? categoryLabel(category) : item.section || 'Hoa & quà tặng',
    category: item.categoryId,
    price: Number(item.price) || 0,
    image,
    alternate: images.find((x) => x !== image) || image,
    images: [...new Set([image, ...images])],
    imageIsFallback,
    isPreOrder: item.isPreOrder,
    ...('quantityAvailable' in item ? { quantityAvailable: item.quantityAvailable } : {}),
    palette: ['#e9d9bd', '#d9afa0', '#8f9b85'],
    description: item.description || 'Thông tin sản phẩm đang được tiệm cập nhật.',
    tag: item.badge,
    ...(item.isCustomizable !== undefined ? { isCustomizable: item.isCustomizable } : {}),
    ...(item.id ? { backendId: item.id } : {}),
  };
}
function preview(): Storefront {
  return {
    products: sampleProducts,
    categories: sampleCategories,
    mode: 'preview',
  };
}

export const getStorefront = cache(async (): Promise<Storefront> => {
  if (!process.env.API_BASE_URL?.trim()) return preview();
  try {
    const [productPage, apiCategories] = await Promise.all([
      catalogApi().products({ page: 1, pageSize: PAGE_SIZE }),
      catalogApi().categories(),
    ]);
    if (productPage.total > MAX_PRODUCTS)
      throw new Error(
        `Catalog có ${productPage.total} sản phẩm, vượt giới hạn tải an toàn ${MAX_PRODUCTS}.`,
      );
    const pages = Math.ceil(productPage.total / PAGE_SIZE);
    const rest = await Promise.all(
      Array.from({ length: Math.max(0, pages - 1) }, (_, i) =>
        catalogApi().products({ page: i + 2, pageSize: PAGE_SIZE }),
      ),
    );
    const allProducts = [productPage, ...rest].flatMap((page) => page.items || []);
    const categories = [
      { id: 'all', label: 'Tất cả' },
      ...apiCategories.map((c) => ({ id: c.id, label: categoryLabel(c) })),
    ];
    const workshops = await workshopsApi()
      .list()
      .then(async (items) =>
        Promise.all(
          items.map(async (item) => ({
            ...item,
            sessions: await workshopsApi().sessions(item.id),
          })),
        ),
      )
      .catch(() => undefined);
    return {
      products: allProducts.map((p) => mapProduct(p, apiCategories)),
      categories,
      workshops,
      mode: 'connected',
    };
  } catch {
    return {
      products: [],
      categories: [{ id: 'all', label: 'Tất cả' }],
      mode: 'unavailable',
      error: 'Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.',
    };
  }
});

export const getStorefrontProduct = cache(async (id: string): Promise<Product | null> => {
  if (!process.env.API_BASE_URL?.trim()) return sampleProducts.find((p) => p.id === id) || null;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null;
  try {
    const [detail, cats] = await Promise.all([catalogApi().product(id), catalogApi().categories()]);
    return mapProduct(detail, cats);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw new Error('Không thể tải sản phẩm từ hệ thống. Vui lòng thử lại sau.');
  }
});
