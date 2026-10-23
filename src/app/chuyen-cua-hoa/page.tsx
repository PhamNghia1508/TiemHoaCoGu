import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { articles } from '@/lib/catalog';
import { PageIntro, SectionHeading } from '@/components/site';

export const metadata: Metadata = {
  title: 'Chuyện của hoa',
  description: 'Những bài viết ngắn về hoa sáp, tặng quà và những khoảng thời gian làm chậm.',
};
export default function JournalPage() {
  return (
    <div className="studio-shell">
      <PageIntro
        eyebrow="JOURNAL / ĐỌC CHẬM"
        title={<>Chuyện của hoa, chuyện của người tặng.</>}
        description="Những ghi chú ngắn về chăm hoa, chọn quà và việc dành cho đôi tay một khoảng nghỉ."
      />
      <section className="studio-block" aria-labelledby="journal-heading">
        <SectionHeading
          number="01"
          eyebrow="TỪ SÁPA STUDIO"
          title={
            <>
              Đọc một bài. <br />
              Mang một ý về nhà.
            </>
          }
        />
        <div className="studio-journal-grid" id="journal-heading">
          {articles.map((article, index) => (
            <Link
              href={`/chuyen-cua-hoa/${article.slug}`}
              className="studio-journal-card"
              key={article.slug}
            >
              <div className="studio-journal-image">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 760px) 100vw, 33vw"
                />
                <span className="studio-status">0{index + 1}</span>
              </div>
              <div className="studio-journal-body">
                <span className="eyebrow">{article.category} · 3 PHÚT ĐỌC</span>
                <h3>
                  {article.title}
                  <ArrowUpRight size={20} aria-hidden="true" />
                </h3>
                <p>{article.excerpt}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
