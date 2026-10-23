import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageIntro } from '@/components/site';
import Shop from '@/components/shop';
export const metadata: Metadata = { title: 'Cửa tiệm — Những món quà có gu' };
export default function ShopPage() {
  return (
    <div className="commerce-page">
      <PageIntro
        eyebrow="CỬA TIỆM / HOA SÁP & QUÀ TẶNG"
        title={
          <>
            Chọn quà <em>đúng gu.</em>
          </>
        }
        description="Một bó hoa, một góc nhỏ hay một món quà tự tay làm. Lọc theo kiểu quà và ngân sách để tìm điều bạn thích."
      />
      <Suspense fallback={<div className="section">Đang sắp hoa lên kệ…</div>}>
        <Shop />
      </Suspense>
    </div>
  );
}
