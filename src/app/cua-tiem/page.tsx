import type { Metadata } from 'next';
import { PageIntro } from '@/components/site';
import Shop from '@/components/shop';
export const metadata: Metadata = { title: 'Cửa tiệm — Một chút hoa, nhiều chút thương' };
export default function ShopPage() {
  return (
    <>
      <PageIntro
        eyebrow="CỬA TIỆM / NHỮNG MÓN QUÀ CÓ GU"
        title={
          <>
            Một chút hoa.
            <br />
            <em>Nhiều chút thương.</em>
          </>
        }
        description="Một bó hoa cho lời thương chưa nói. Một chiếc lọ cho góc nhà bình yên. Hay một chút khéo tay dành riêng cho bạn?"
      />
      <Shop />
    </>
  );
}
