import type { Metadata } from 'next';
import Image from 'next/image';
import { PageIntro } from '@/components/site';
import CustomForm from '@/components/custom-form';
export const metadata: Metadata = { title: 'Hoa theo ý bạn — Gu của bạn, đôi tay của tiệm' };
export default function CustomPage() {
  return (
    <>
      <PageIntro
        eyebrow="HOA THEO Ý BẠN / MỖI NGƯỜI MỘT GU"
        title={
          <>
            Gu của bạn.
            <br />
            <em>Đôi tay của tiệm.</em>
          </>
        }
        description="Một màu sắc, một kỷ niệm, một người rất riêng. Cứ kể tiệm nghe — để món quà này không giống bất kỳ món quà nào khác."
      />
      <div className="form-layout">
        <CustomForm />
        <aside className="form-aside">
          <Image
            src="/images/workshop-hands.webp"
            alt="Nắn cánh hoa thủ công tại xưởng"
            width={500}
            height={350}
          />
          <span className="eyebrow">TỪ MỘT Ý TƯỞNG NHỎ</span>
          <h2 style={{ marginTop: 15 }}>
            Một món quà
            <br />
            <em>thật đúng người.</em>
          </h2>
          <p>01 — Bạn kể về người nhận & cảm hứng.</p>
          <p>02 — Tiệm gợi ý bảng màu, kiểu dáng & báo giá.</p>
          <p>03 — Chỉ khi bạn đồng ý, đôi tay mới bắt đầu.</p>
          <p className="fine-print">
            Quy trình dự kiến khi mở bán. Bản trải nghiệm chưa nhận yêu cầu thật.
          </p>
        </aside>
      </div>
    </>
  );
}
