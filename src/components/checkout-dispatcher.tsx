'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Checkout from './checkout';
import WorkshopCheckout from './workshop/workshop-checkout';
import { PageIntro } from './site';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  if (bookingId) {
    return (
      <>
        <PageIntro
          eyebrow="WORKSHOP / THANH TOÁN VÉ"
          title={
            <>
              Xác nhận ca học,
              <br />
              <em>rồi mình hẹn nhau ở xưởng.</em>
            </>
          }
          description="Chỗ ngồi của bạn đang được giữ trong 10 phút. Vui lòng hoàn tất thanh toán để nhận vé điện tử chính thức."
        />
        <WorkshopCheckout bookingId={bookingId} />
      </>
    );
  }

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

export default function CheckoutDispatcher() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: 'center', padding: '100px 20px', color: '#64748b' }}>
          Đang tải trang thanh toán...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
