import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { PageIntro } from '@/components/site';
import CustomForm from '@/components/custom-form';

export const metadata: Metadata = { title: 'Hoa theo ý bạn — Bạn chọn gu' };
export default function CustomPage() {
  return (
    <div className="studio-shell">
      <PageIntro
        eyebrow="HOA THEO Ý BẠN / CUSTOM ORDER"
        title={<>Bạn chọn gu. Tiệm làm phần còn lại.</>}
        description={
          process.env.API_BASE_URL
            ? 'Chọn sản phẩm có thể tùy biến và gửi yêu cầu sau khi đăng nhập. Chỉ báo giá do tiệm phát hành mới có giá trị; gửi yêu cầu không phải thanh toán hay cam kết hoàn thiện.'
            : 'Kể tiệm nghe về người nhận, màu sắc và cảm giác bạn muốn gửi. Đây là bản trải nghiệm để phác ý tưởng — chưa nhận yêu cầu thật, chưa báo giá hay thanh toán.'
        }
      />
      <section className="studio-grid-2 studio-block" aria-labelledby="custom-intro">
        <div className="studio-media">
          <Image
            src="/images/hero-lifestyle.webp"
            alt="Một góc quà hoa sáp được gói thủ công"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
        <div className="studio-copy">
          <p className="studio-kicker">MỘT MÓN QUÀ ĐÚNG NGƯỜI</p>
          <h2 id="custom-intro">Ý tưởng của bạn không cần hoàn hảo ngay từ đầu.</h2>
          <p>
            Bạn chỉ cần đưa ra một manh mối: màu áo người ấy hay mặc, căn phòng họ thích, một ngày
            bình thường đáng nhớ. Tiệm sẽ dùng nó để gợi ý hướng đi.
          </p>
          <a className="button" href="#custom-form">
            Bắt đầu kể <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <section className="studio-block studio-block--lilac" aria-labelledby="custom-steps">
        <div className="studio-heading">
          <p className="studio-kicker">QUY TRÌNH</p>
          <h2 id="custom-steps">Rõ từng bước, không hứa trước phần chưa có.</h2>
        </div>
        <ol className="studio-process studio-process--four">
          <li>
            <strong>01</strong>
            <h3>Bạn kể</h3>
            <p>Chọn sản phẩm nền, số lượng, dịp, ngân sách, bảng màu và điều bạn muốn gửi gắm.</p>
          </li>
          <li>
            <strong>02</strong>
            <h3>Tiệm báo giá</h3>
            <p>
              Tiệm xem yêu cầu và phát hành báo giá riêng: tổng tiền, tiền cọc, ngày hoàn thiện dự
              kiến.
            </p>
          </li>
          <li>
            <strong>03</strong>
            <h3>Bạn duyệt & đặt cọc</h3>
            <p>
              Bạn duyệt đúng phiên bản báo giá, tạo đơn với người nhận và thanh toán tiền cọc qua
              cổng sandbox.
            </p>
          </li>
          <li>
            <strong>04</strong>
            <h3>Tiệm làm & giao</h3>
            <p>
              Tiệm bắt đầu làm sau khi cọc được ghi nhận, rồi bàn giao và hoàn tất khi giao xong.
            </p>
          </li>
        </ol>
      </section>
      <section className="studio-form-wrap" id="custom-form">
        <CustomForm />
        <aside className="studio-form-aside">
          <Image
            src="/images/workshop-hands.webp"
            alt="Đôi tay đang nắn cánh hoa"
            width={700}
            height={520}
          />
          <span className="eyebrow">
            {process.env.API_BASE_URL ? 'YÊU CẦU & BÁO GIÁ' : 'ĐÂY LÀ BẢN XEM TRƯỚC'}
          </span>
          <h2>Trang này chỉ gửi yêu cầu.</h2>
          <p>
            {process.env.API_BASE_URL
              ? 'Yêu cầu được lưu vào tài khoản của bạn và theo dõi ở trang tra cứu. Báo giá, duyệt, tạo đơn và đặt cọc diễn ra ở đó; trang này không thu tiền.'
              : 'Thông tin chỉ được dùng để tạo bản nháp ngay trong trình duyệt. Chưa lưu máy chủ, chưa có báo giá, cam kết hoàn thiện hay thanh toán.'}
          </p>
        </aside>
      </section>
    </div>
  );
}
