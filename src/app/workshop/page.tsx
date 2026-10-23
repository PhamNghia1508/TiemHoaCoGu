import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { PageIntro } from '@/components/site';
import WorkshopForm from '@/components/workshop-form';
import { getStorefront } from '@/lib/storefront';

export const metadata: Metadata = { title: 'Workshop — Làm hoa bằng tay' };

export default async function WorkshopPage() {
  const storefront = await getStorefront();
  const connected = storefront.mode === 'connected' && storefront.workshops !== undefined;
  const workshopUnavailable =
    storefront.mode === 'unavailable' || (storefront.mode === 'connected' && !storefront.workshops);
  const courses =
    storefront.workshops?.map((w, index) => ({
      name: w.name,
      tag: `${String(index + 1).padStart(2, '0')} / WORKSHOP`,
      duration: `${w.duration} phút`,
      price: `${new Intl.NumberFormat('vi-VN').format(w.basePrice)} ₫ / người`,
      img: '/images/prod-kit.webp',
      description: w.description || 'Thông tin workshop đang được tiệm cập nhật.',
      takeaway: 'Thành phẩm của riêng bạn',
      sessions: w.sessions,
    })) || [];
  return (
    <div className="studio-shell">
      <PageIntro
        eyebrow="WORKSHOP / SÁPA STUDIO"
        title={<>Một buổi chiều để đôi tay làm việc.</>}
        description={
          workshopUnavailable
            ? 'Chưa thể tải workshop hoặc phiên học từ API. Không có lịch mẫu thay thế.'
            : connected
              ? 'Workshop và phiên học được lấy từ hệ thống. Chọn một ca mở để yêu cầu giữ chỗ; giữ chỗ chưa có nghĩa đã mua vé hoặc đã thanh toán.'
              : 'Bản xem trước chưa có lịch, số chỗ hoặc vé thật. Form chỉ giúp bạn xem lại mong muốn trên trình duyệt.'
        }
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
            {connected
              ? 'Thời lượng và giá từ API. Số chỗ chỉ được kiểm tra lại khi backend nhận yêu cầu giữ chỗ.'
              : 'Chưa có dữ liệu workshop đã kết nối; không hiển thị giá hoặc số chỗ mẫu như thông tin thật.'}
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
                <p className="fine-print">Ảnh minh họa trải nghiệm, không phải ảnh từng lớp học.</p>
                <span className="studio-status">
                  {course.sessions?.length
                    ? `${course.sessions.length} phiên từ API`
                    : 'Chưa có phiên mở'}
                </span>
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
            <h3>{connected ? 'Chọn ca đang mở' : 'Gửi ngày mong muốn'}</h3>
            <p>
              {connected
                ? 'Đăng nhập, kiểm tra thông tin và chủ động gửi yêu cầu giữ chỗ.'
                : 'Form chỉ tạo bản xem trước ngay trên trình duyệt.'}
            </p>
          </li>
          <li>
            <strong>03</strong>
            <h3>{connected ? 'Đọc thời hạn giữ chỗ' : 'Chờ lịch thật mở'}</h3>
            <p>
              {connected
                ? 'Backend trả trạng thái và hạn giữ chỗ. Provider thanh toán chưa được kết nối; không coi hold là vé đã thanh toán.'
                : 'Ngày, chỗ và điều kiện chỉ được xác nhận khi có dữ liệu thực tế.'}
            </p>
          </li>
        </ol>
      </section>
      <section className="studio-form-wrap">
        <WorkshopForm />
        <aside className="studio-form-aside">
          <span className="eyebrow">MINH BẠCH TỪ ĐẦU</span>
          <h2>
            {connected
              ? 'Giữ chỗ không phải mua vé.'
              : workshopUnavailable
                ? 'Lịch chưa tải được.'
                : 'Lịch chưa mở.'}
          </h2>
          <p>
            {connected
              ? 'Yêu cầu được gửi tới backend sau khi bạn xác nhận. Kiểm tra trạng thái và hạn giữ chỗ trả về; website chưa tích hợp thu tiền hoặc phát hành vé từ provider thật.'
              : 'Ngày bạn chọn là mong muốn, không phải ca còn chỗ. Preview không gửi đăng ký, không giữ chỗ và không thu cọc.'}
          </p>
        </aside>
      </section>
    </div>
  );
}
