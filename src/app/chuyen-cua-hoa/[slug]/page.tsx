export const dynamicParams = false;
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articles } from '@/lib/catalog';
import { ArrowLink, PageIntro } from '@/components/site';

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  return article
    ? { title: article.title, description: article.excerpt }
    : { title: 'Không tìm thấy bài viết' };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  return (
    <>
      <PageIntro eyebrow={article.category} title={article.title} description={article.excerpt} />
      <article className="article-body narrow-page">
        <div className="article-cover">
          <Image
            src={article.image}
            alt={article.title}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 72vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="article-content">
          {article.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          <div className="article-footer">
            <Link href="/chuyen-cua-hoa" className="underlined">
              ← Tất cả chuyện của hoa
            </Link>
            <ArrowLink href="/cua-tiem">Ghé cửa tiệm</ArrowLink>
          </div>
        </div>
      </article>
    </>
  );
}
