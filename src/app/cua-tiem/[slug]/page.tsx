export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStorefront, getStorefrontProduct } from '@/lib/storefront';
import { ProductDetail } from '@/components/product-detail';
import { ProductCard, SectionHeading } from '@/components/site';
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = await getStorefrontProduct(slug);
  if (!p) notFound();
  return { title: p?.name || 'Không tìm thấy sản phẩm', description: p?.description };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getStorefrontProduct(slug);
  if (!p) notFound();
  const storefront = await getStorefront();
  const products = storefront.products;
  return (
    <>
      <nav className="breadcrumb commerce-breadcrumb" aria-label="Đường dẫn">
        <Link href="/">Tiệm</Link>
        <span aria-hidden="true">/</span>
        <Link href="/cua-tiem">Cửa tiệm</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{p.name}</span>
      </nav>
      <ProductDetail product={p} />
      <section className="section">
        <SectionHeading
          number=""
          eyebrow="XEM THÊM"
          title={
            <>
              Thêm một chút <em>màu vui.</em>
            </>
          }
        />
        <div className="product-grid">
          {products
            .filter((x) => x.id !== p.id)
            .slice(0, 3)
            .map((x, i) => (
              <ProductCard key={x.id} product={x} index={i} />
            ))}
        </div>
      </section>
    </>
  );
}
