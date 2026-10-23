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
        description={
          process.env.API_BASE_URL
            ? 'Đăng nhập để xem đơn hoa, yêu cầu đặt riêng và các lần giữ chỗ của chính bạn. Trạng thái được lấy từ hệ thống, không phải xác nhận đã thanh toán hay giao hàng.'
            : 'Một nơi để kiểm tra đơn hoa hoặc buổi hẹn ở xưởng. Chức năng tra cứu thật sẽ mở sau khi backend và tài khoản khách hàng được kết nối.'
        }
      />
      <Lookup />
    </>
  );
}
