'use client';
import { useEffect } from 'react';
import { FlowerMark } from '@/components/site';
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {}, []);
  return (
    <section className="error-page">
      <FlowerMark />
      <p className="eyebrow">MỘT NÚT THẮT NHỎ</p>
      <h1>
        Trang chưa thể
        <br />
        <em>nở ngay lúc này.</em>
      </h1>
      <p>Có lỗi khi mở nội dung. Bạn thử lại một lần nhé.</p>
      <button className="button" onClick={() => reset()}>
        Thử lại
      </button>
    </section>
  );
}
