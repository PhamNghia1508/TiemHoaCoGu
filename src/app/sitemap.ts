import type { MetadataRoute } from 'next';
import { products, articles } from '@/lib/catalog';
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL || 'http://localhost:3000';
  const routes = [
    '',
    '/cua-tiem',
    '/dat-rieng',
    '/workshop',
    '/cau-chuyen',
    '/chuyen-cua-hoa',
    '/hoi-dap',
    '/chinh-sach',
    ...products.map((p) => `/cua-tiem/${p.id}`),
    ...articles.map((a) => `/chuyen-cua-hoa/${a.slug}`),
  ];
  return routes.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: 'monthly',
    priority: route === '' ? 1 : 0.7,
  }));
}
