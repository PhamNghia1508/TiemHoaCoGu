export const dynamicParams = false;
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { products } from '@/lib/catalog';
import { ProductDetail } from '@/components/product-detail';
import { ProductCard, SectionHeading } from '@/components/site';
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = products.find((p) => p.id === slug);
  return { title: p?.name || 'Không tìm thấy sản phẩm', description: p?.description };
}
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = products.find((p) => p.id === slug);
  if (!p) notFound();
  return (
    <>
      <div className="breadcrumb">
        <Link href="/">Tiệm</Link>
        <span>/</span>
        <Link href="/cua-tiem">Cửa tiệm</Link>
        <span>/</span>
        <span>{p.name}</span>
      </div>
      <ProductDetail product={p} />
      <section className="section">
        <SectionHeading
          number=""
          eyebrow="CÓ THỂ BẠN CŨNG THÍCH"
          title={
            <>
              Thêm một chút <em>dịu dàng.</em>
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
