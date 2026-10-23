import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { articles } from '@/lib/catalog';
import { PageIntro, SectionHeading } from '@/components/site';

export const metadata = {
  title: 'Chuyện của hoa',
  description: 'Những bài viết ngắn về hoa sáp, tặng quà và những khoảng thời gian làm chậm.',
};

export default function JournalPage() {
  return (
    <>
      <PageIntro
        eyebrow="CHUYỆN NHỎ ĐỌC CHẬM"
        title={
          <>
            Một góc <em>của hoa.</em>
          </>
        }
        description="Vài câu chuyện để đọc cùng một tách trà — về cách chăm hoa, chọn quà và dành cho đôi tay một khoảng nghỉ."
      />
      <section className="section journal-section">
        <SectionHeading
          number="01"
          eyebrow="TỪ SÁPA STUDIO"
          title={
            <>
              Những điều nhỏ
              <br />
              <em>đáng để lưu lại.</em>
            </>
          }
        />
        <div className="journal-grid">
          {articles.map((article, index) => (
            <Link
              href={`/chuyen-cua-hoa/${article.slug}`}
              className="journal-card"
              key={article.slug}
            >
              <div className="journal-image">
                <Image
                  src={article.image}
                  alt={article.title}
                  fill
                  sizes="(max-width: 650px) 90vw, 30vw"
                  style={{ objectFit: 'cover' }}
                />
                <span>0{index + 1}</span>
              </div>
              <span className="eyebrow">
                {article.category} <span>· 3 PHÚT ĐỌC</span>
              </span>
              <h3>
                {article.title}
                <ArrowUpRight size={20} />
              </h3>
              <p>{article.excerpt}</p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
