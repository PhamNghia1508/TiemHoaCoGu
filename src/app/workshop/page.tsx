import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { PageIntro } from '@/components/site';
import WorkshopForm from '@/components/workshop-form';

export const metadata: Metadata = { title: 'Workshop — Làm hoa bằng tay' };
const courses = [
  {
    name: 'Hoa Sáp Cơ Bản',
    tag: '01 / LẦN ĐẦU CHẠM SÁP',
    duration: '2,5 giờ',
    price: '450.000 ₫ / người',
    img: '/images/prod-kit.webp',
    description: 'Làm quen chất liệu, nắn những cánh hoa đầu tiên và cắm vào lọ nhỏ mang về.',
    takeaway: '3 bông hoa & lọ mini',
  },
  {
    name: 'Bó Quà Tặng',
    tag: '02 / TỰ TAY GÓI MỘT MÓN QUÀ',
    duration: '3 giờ',
    price: '690.000 ₫ / người',
    img: '/images/prod-bouquet.webp',
    description: 'Phối bảng màu, làm 7–9 bông hoa, học cách gói kraft và thắt nơ.',
    takeaway: 'Một bó hoa gói hoàn chỉnh',
  },
];
export default function WorkshopPage() {
  return (
    <div className="studio-shell">
      <PageIntro
        eyebrow="WORKSHOP / SÁPA STUDIO"
        title={<>Một buổi chiều để đôi tay làm việc.</>}
        description="Hai trải nghiệm tham khảo, cho người mới bắt đầu hoặc người muốn tự làm một món quà. Lịch chính thức chưa mở — không có ngày hay số chỗ được dựng sẵn."
      />
      <section className="studio-grid-2 studio-block" aria-labelledby="workshop-intro">
        <div className="studio-media">
          <Image
            src="/images/ws-hero.webp"
            alt="Bàn workshop làm hoa sáp"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 50vw"
          />
        </div>
        <div className="studio-copy">
          <p className="studio-kicker">MỘT TRẢI NGHIỆM THẬT, KHÔNG VỘI</p>
          <h2 id="workshop-intro">Không cần khéo tay. Chỉ cần có mặt.</h2>
          <p>
            Tiệm hướng dẫn từ những phần đầu tiên. Bạn chọn màu, làm từng cánh, rồi mang thành quả
            của chính mình về.
          </p>
          <a className="button" href="#cac-trai-nghiem">
            Chọn trải nghiệm <ArrowDown size={18} />
          </a>
        </div>
      </section>
      <section
        className="studio-block studio-block--lilac"
        id="cac-trai-nghiem"
        aria-labelledby="course-heading"
      >
        <div className="studio-heading">
          <p className="studio-kicker">CÁC TRẢI NGHIỆM</p>
          <h2 id="course-heading">Chọn một nhịp làm phù hợp.</h2>
          <p>
            Thời lượng và giá dưới đây là thông tin tham khảo kế thừa từ bản trải nghiệm, chưa phải
            báo giá hoặc vé.
          </p>
        </div>
        <div className="studio-grid-2">
          {courses.map((course) => (
            <article className="studio-card" key={course.name}>
              <div className="studio-card-image">
                <Image
                  src={course.img}
                  alt={course.name}
                  fill
                  sizes="(max-width: 760px) 100vw, 50vw"
                />
              </div>
              <div className="studio-card-body">
                <span className="eyebrow">{course.tag}</span>
                <h3>{course.name}</h3>
                <p>{course.description}</p>
                <div className="studio-meta">
                  <span>{course.duration}</span>
                  <span>{course.price}</span>
                </div>
                <p>
                  <strong>Mang về:</strong> {course.takeaway}
                </p>
                <span className="studio-status">Lịch chưa mở</span>
                <p>
                  <a className="button outline" href="#hen-o-xuong">
                    Để lại mong muốn <ArrowUpRight size={17} />
                  </a>
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="studio-block" aria-labelledby="steps">
        <div className="studio-heading">
          <p className="studio-kicker">TỪ Ý MUỐN ĐẾN BUỔI LÀM</p>
          <h2 id="steps">Ba bước, không có bước nào giả vờ là đã đặt.</h2>
        </div>
        <ol className="studio-process">
          <li>
            <strong>01</strong>
            <h3>Chọn trải nghiệm</h3>
            <p>Đọc nội dung, thời lượng và mức giá tham khảo.</p>
          </li>
          <li>
            <strong>02</strong>
            <h3>Gửi ngày mong muốn</h3>
            <p>Form chỉ tạo bản xem trước ngay trên trình duyệt.</p>
          </li>
          <li>
            <strong>03</strong>
            <h3>Chờ lịch thật mở</h3>
            <p>Ngày, chỗ và điều kiện sẽ chỉ được xác nhận khi có dữ liệu thực tế.</p>
          </li>
        </ol>
      </section>
      <section className="studio-form-wrap">
        <WorkshopForm />
        <aside className="studio-form-aside">
          <span className="eyebrow">MINH BẠCH TỪ ĐẦU</span>
          <h2>Lịch chưa mở.</h2>
          <p>
            Ngày bạn chọn là mong muốn, không phải ca còn chỗ. Form không gửi đăng ký, không giữ chỗ
            và không thu cọc.
          </p>
        </aside>
      </section>
    </div>
  );
}
