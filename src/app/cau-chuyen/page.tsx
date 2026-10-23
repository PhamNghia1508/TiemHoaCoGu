import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { ArrowLink, PageIntro, SectionHeading } from '@/components/site';

export const metadata: Metadata = {
  title: 'Câu chuyện của tiệm',
  description: 'Một góc nhìn thật hơn về cách Tiệm Hoa Có Gu làm hoa sáp và những món quà có gu.',
};

export default function StoryPage() {
  return (
    <div className="studio-shell">
      <PageIntro
        eyebrow="CÂU CHUYỆN / SÁPA STUDIO"
        title={<>Làm hoa bằng tay. Giữ lại điều bạn muốn nói.</>}
        description="Tiệm Hoa Có Gu là một tiệm hoa sáp và góc làm đồ thủ công. Không thêm thắt tiểu sử — chỉ bắt đầu từ chất liệu, bảng màu và từng món quà cụ thể."
      />
      <section className="studio-grid-2 studio-block" aria-labelledby="story-process">
        <div className="studio-media">
          <Image
            src="/images/workshop-hands.webp"
            alt="Đôi tay đang làm hoa sáp tại bàn làm việc"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
        <div className="studio-copy">
          <p className="studio-kicker">01 / BÀN LÀM VIỆC</p>
          <h2 id="story-process">Mỗi món bắt đầu từ một câu hỏi nhỏ.</h2>
          <p>
            Người nhận thích gì? Màu nào sẽ vừa với căn phòng? Món quà cần nói thay điều gì? Từ đó,
            tiệm chọn chất liệu, thử sắc độ, rồi làm từng phần bằng tay.
          </p>
          <p>
            Hoa sáp không phải hoa tươi được giữ nguyên. Nó là một vật thể mới: có dấu tay, có độ
            lệch nhẹ, và được làm để ở lại lâu hơn một mùa.
          </p>
          <ArrowLink href="/dat-rieng">Kể tiệm nghe gu của bạn</ArrowLink>
        </div>
      </section>
      <section className="studio-block studio-block--lilac" aria-labelledby="how-we-work">
        <SectionHeading
          number="02"
          eyebrow="SÁPA STUDIO / PROCESS"
          title={
            <>
              Chất liệu trước. <br />
              Lời hay để sau.
            </>
          }
        />
        <ol className="studio-process" id="how-we-work">
          <li>
            <strong>01</strong>
            <h3>Chọn bảng màu</h3>
            <p>Nhìn vào dịp tặng, người nhận và không gian để chọn cảm giác phù hợp.</p>
          </li>
          <li>
            <strong>02</strong>
            <h3>Thử bằng tay</h3>
            <p>
              Nắn cánh, dựng nhành, đặt cạnh nhau. Những khác biệt nhỏ là một phần của đồ thủ công.
            </p>
          </li>
          <li>
            <strong>03</strong>
            <h3>Gói để trao đi</h3>
            <p>Hoàn thiện bó, hộp hoặc bộ DIY với phần nhắn gửi dành riêng cho người nhận.</p>
          </li>
        </ol>
      </section>
      <section className="studio-grid-2 studio-block" aria-labelledby="come-by">
        <div className="studio-copy">
          <p className="studio-kicker">03 / GÓC XƯỞNG</p>
          <h2 id="come-by">Bạn có thể bắt đầu bằng một buổi workshop.</h2>
          <p>
            Không cần biết trước mình sẽ làm thật khéo. Một buổi ở xưởng là cách đơn giản nhất để
            chạm vào chất liệu và xem đôi tay muốn đi đâu.
          </p>
          <ArrowLink href="/workshop">Xem các trải nghiệm</ArrowLink>
        </div>
        <div className="studio-media">
          <Image
            src="/images/ws-studio.webp"
            alt="Không gian studio với bàn làm hoa"
            fill
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
      </section>
      <div className="studio-block studio-block--cobalt studio-footerline">
        <span>Tiệm làm chậm, nhưng không làm mơ hồ.</span>
        <ArrowLink href="/chuyen-cua-hoa" className="light">
          Đọc chuyện của hoa <ArrowUpRight size={16} />
        </ArrowLink>
      </div>
    </div>
  );
}
