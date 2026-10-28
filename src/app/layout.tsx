import type { Metadata, Viewport } from 'next';
import '@fontsource/cormorant-garamond/latin-400.css';
import '@fontsource/cormorant-garamond/vietnamese-400.css';
import '@fontsource/cormorant-garamond/latin-500.css';
import '@fontsource/cormorant-garamond/vietnamese-500.css';
import '@fontsource/cormorant-garamond/latin-400-italic.css';
import '@fontsource/cormorant-garamond/vietnamese-400-italic.css';
import '@fontsource/be-vietnam-pro/latin-400.css';
import '@fontsource/be-vietnam-pro/vietnamese-400.css';
import '@fontsource/be-vietnam-pro/latin-500.css';
import '@fontsource/be-vietnam-pro/vietnamese-500.css';
import '@fontsource/be-vietnam-pro/latin-700.css';
import '@fontsource/be-vietnam-pro/vietnamese-700.css';
import '@fontsource/be-vietnam-pro/latin-800.css';
import '@fontsource/be-vietnam-pro/vietnamese-800.css';
import './globals.css';
import './commerce.css';
import './studio.css';
import { StoreProvider } from '@/components/store-provider';
import { Header, Footer } from '@/components/site';
import { getStorefront } from '@/lib/storefront';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Tiệm Hoa Có Gu — Tặng hoa. Tặng gu.',
    template: '%s · Tiệm Hoa Có Gu',
  },
  description:
    'Hoa sáp thủ công, quà tặng có gu và những buổi workshop chậm rãi. Một tiệm hoa nhỏ dành cho những điều bạn muốn gửi gắm.',
  openGraph: {
    title: 'Tiệm Hoa Có Gu',
    description: 'Có những điều, để hoa nói.',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: '/images/hero-wax.webp',
        width: 1536,
        height: 1024,
        alt: 'Bó hoa sáp thủ công Tiệm Hoa Có Gu',
      },
    ],
  },
  robots: { index: false, follow: true },
};
export const viewport: Viewport = { themeColor: '#243db5', width: 'device-width', initialScale: 1 };
export const dynamic = 'force-dynamic';
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const storefront = await getStorefront();
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <StoreProvider
          initialProducts={storefront.products}
          initialCategories={storefront.categories}
          mode={storefront.mode}
          error={storefront.error}
        >
          <Header />
          <main id="noi-dung">{children}</main>
          <Footer />
        </StoreProvider>
      </body>
    </html>
  );
}
