import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageIntro } from '@/components/site';
import PaymentResult from '@/components/payment-result';

export const metadata: Metadata = {
  title: 'Trạng thái thanh toán',
  robots: { index: false, follow: false },
};

export default function PaymentResultPage() {
  return (
    <>
      <PageIntro
        eyebrow="MO MO SANDBOX / ĐỐI CHIẾU"
        title={
          <>
            Để hệ thống xác nhận,
            <br />
            <em>rồi mình yên tâm.</em>
          </>
        }
        description="Trang này đọc số tiền đã ghi sổ từ tài khoản của bạn. Tham số quay về từ MoMo không được xem là biên nhận thanh toán."
      />
      <Suspense
        fallback={
          <section className="form-layout">
            <p>Đang tải trạng thái…</p>
          </section>
        }
      >
        <PaymentResult />
      </Suspense>
    </>
  );
}
