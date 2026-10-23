import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { PageIntro } from '@/components/site';
import WorkshopForm from '@/components/workshop-form';
export const metadata: Metadata = { title: 'Workshop — Hẹn nhau một ngày thật chậm' };
export default function WorkshopPage() {
  return (
    <>
      <PageIntro
        eyebrow="WORKSHOP / HẸN NHAU Ở XƯỞNG"
        title={
          <>
            Cho đôi tay bận.
            <br />
            <em>Cho tâm trí nghỉ.</em>
          </>
        }
        description="Một buổi làm hoa, một tách trà, vài câu chuyện nhỏ. Không cần khéo tay, không cần vội. Chỉ cần bạn có mặt."
      />
      <div className="editorial-split">
        <div className="editorial-photo">
          <Image
            src="/images/workshop-hands.webp"
            alt="Tự tay nắn hoa sáp tại bàn gỗ trong xưởng"
            fill
            priority
            sizes="(max-width: 600px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
        </div>
        <div className="editorial-copy">
          <span className="eyebrow">MỘT BUỔI CHIỀU KHÁC ĐI</span>
          <h2>
            Bông hoa đẹp nhất
            <br />
            là bông hoa
            <br />
            <em>bạn tự tay làm.</em>
          </h2>
          <p>
            Không có hai bàn tay giống nhau. Cũng không có hai bông hoa giống hệt. Ở xưởng, tiệm
            không tìm sự hoàn hảo — tiệm muốn bạn tìm được niềm vui từ một việc nhỏ.
          </p>
          <a href="#cac-trai-nghiem" className="text-link">
            Chọn một trải nghiệm <ArrowDown size={18} />
          </a>
        </div>
      </div>
      <section className="section workshop-list" id="cac-trai-nghiem">
        {[
          {
            name: 'Hoa Sáp Cơ Bản',
            tag: '01 / CHO LẦN ĐẦU CHẠM SÁP',
            duration: '2,5 giờ',
            price: '450.000 ₫ / người',
            img: '/images/prod-kit.webp',
            description:
              'Làm quen chất liệu, nắn những cánh hoa đầu tiên và cắm vào lọ nhỏ mang về. Từng bước một, theo nhịp riêng của bạn.',
            takeaway: '3 bông hoa & lọ mini',
          },
          {
            name: 'Bó Quà Tặng',
            tag: '02 / GÓI MỘT CHÚT THƯƠNG',
            duration: '3 giờ',
            price: '690.000 ₫ / người',
            img: '/images/prod-bouquet.webp',
            description:
              'Phối một bảng màu, làm 7–9 bông hoa, học cách gói kraft và thắt nơ. Mang về một món quà do chính bạn tạo ra.',
            takeaway: 'Một bó hoa gói hoàn chỉnh',
          },
        ].map((w) => (
          <article className="workshop-card" key={w.name}>
            <div className="workshop-card-image">
              <Image
                src={w.img}
                alt={w.name}
                fill
                sizes="(max-width: 600px) 100vw, 45vw"
                style={{ objectFit: 'cover' }}
              />
            </div>
            <div>
              <span className="eyebrow">{w.tag}</span>
              <h2>{w.name}</h2>
              <p>{w.description}</p>
              <div className="workshop-meta">
                <span>{w.duration}</span>
                <i />
                <span>{w.price}</span>
              </div>
              <p>Mang về: {w.takeaway}</p>
              <a href="#hen-o-xuong" className="button outline">
                Phác một buổi hẹn <ArrowUpRight size={18} />
              </a>
            </div>
          </article>
        ))}
        <p className="fine-print">
          Nội dung & giá tham khảo được chuyển từ repository. Lịch, địa điểm và điều kiện tham gia
          chính thức sẽ được xác nhận khi mở lớp.
        </p>
        <div className="workshop-facts">
          <div>
            <h3>Không cần khéo tay.</h3>
            <p>Tiệm hướng dẫn từ những cánh hoa đầu tiên. Bạn chỉ cần mang sự tò mò.</p>
          </div>
          <div>
            <h3>Chậm, mà vui.</h3>
            <p>Một khoảng thời gian dành cho chất liệu, màu sắc và những câu chuyện nhỏ.</p>
          </div>
          <div>
            <h3>Mang điều đẹp về.</h3>
            <p>Thành phẩm do chính bạn làm, cùng một chút tự hào rất riêng.</p>
          </div>
        </div>
      </section>
      <div className="form-layout">
        <WorkshopForm />
        <aside className="form-aside">
          <span className="eyebrow">MỘT LỜI NHẮC NHỎ</span>
          <h2 style={{ marginTop: 15 }}>
            Không cần làm đẹp.
            <br />
            <em>Cứ làm bằng lòng.</em>
          </h2>
          <p>
            Đây là phần xem trước trải nghiệm đặt chỗ. Chưa có ca lớp thật, vé, mã đặt chỗ hay thanh
            toán cọc.
          </p>
          <p>Khi backend hoạt động, lịch sẽ lấy từ ca lớp thực tế thay vì dựng lịch mẫu.</p>
        </aside>
      </div>
    </>
  );
}
