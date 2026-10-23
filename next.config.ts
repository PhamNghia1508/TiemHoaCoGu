import type { NextConfig } from 'next';
const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  async redirects() {
    const legacy: Record<string, string> = {
      index: '/',
      shop: '/cua-tiem',
      product: '/cua-tiem/trang-non',
      workshop: '/workshop',
      'workshop-detail': '/workshop',
      'cau-chuyen': '/cau-chuyen',
      've-xuong': '/cau-chuyen',
      blog: '/chuyen-cua-hoa',
      faq: '/hoi-dap',
      'tra-cuu': '/tra-cuu',
      'lien-he': '/dat-rieng',
      gallery: '/cua-tiem',
      studio: '/workshop',
    };
    return Object.entries(legacy).map(([source, destination]) => ({
      source: `/${source}.html`,
      destination,
      permanent: true,
    }));
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};
export default config;
