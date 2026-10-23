import type { Metadata } from 'next';
import { PageIntro } from '@/components/site';
import Checkout from '@/components/checkout';
export const metadata: Metadata = {
  title: 'Xem lại đơn hoa',
  robots: { index: false, follow: false },
};
export default function CheckoutPage() {
  return (
    <>
      <PageIntro
        eyebrow="TÚI HOA / XEM LẠI MỘT CHÚT"
        title={
          <>
            Gói ghém xong,
            <br />
            <em>gửi thương đi.</em>
          </>
        }
        description="Kiểm tra những điều bạn đã chọn. Một món quà đẹp bắt đầu từ sự để tâm đến từng chi tiết."
      />
      <Checkout />
    </>
  );
}
