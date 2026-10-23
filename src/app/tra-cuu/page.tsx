import type { Metadata } from 'next';
import { PageIntro } from '@/components/site';
import Lookup from '@/components/lookup';
export const metadata: Metadata = {
  title: 'Tra cứu đơn & đặt chỗ',
  robots: { index: false, follow: false },
};
export default function LookupPage() {
  return (
    <>
      <PageIntro
        eyebrow="TRA CỨU / NHỮNG ĐIỀU BẠN ĐANG CHỜ"
        title={
          <>
            Món quà của bạn,
            <br />
            <em>đang ở đâu?</em>
          </>
        }
        description="Một nơi để kiểm tra đơn hoa hoặc buổi hẹn ở xưởng. Chức năng tra cứu thật sẽ mở sau khi backend và tài khoản khách hàng được kết nối."
      />
      <Lookup />
    </>
  );
}
