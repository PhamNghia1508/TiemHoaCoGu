import type { Metadata } from 'next';
import Image from 'next/image';
import { ArrowDown, ArrowUpRight, CalendarDays, Clock3, MapPin, Users } from 'lucide-react';
import { PageIntro } from '@/components/site';
import WorkshopForm from '@/components/workshop-form';
import { workshopsApi, type Session, type Workshop } from '@/lib/api/client';
import { getStorefront, type StorefrontWorkshop } from '@/lib/storefront';
import { isOpenFutureSession, remainingSeats } from '@/lib/transaction';

export const metadata: Metadata = { title: 'Workshop — Làm hoa bằng tay' };

type Course = StorefrontWorkshop & { detail?: Workshop };

function durationLabel(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return 'Thời lượng đang cập nhật';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${minutes} phút`;
  return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`;
}

function priceLabel(amount: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(amount)} ₫ / người`;
}

function dateLabel(value: string): string {
  const dateOnly = value.slice(0, 10);
  const [year, month, day] = dateOnly.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}

function timeLabel(value: string): string {
  return value.slice(0, 5);
}

function stringList(value?: string): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  } catch {
    return [];
  }
}

function sessionStatus(session: Session): string {
  if (isOpenFutureSession(session)) return `Còn ${remainingSeats(session)} chỗ`;
  if (session.sessionStatus.toLowerCase() === 'cancelled') return 'Đã hủy';
  const startsAt = new Date(`${session.sessionDate.slice(0, 10)}T${session.startTime}`);
  if (startsAt.getTime() <= Date.now()) return 'Đã qua';
  if (remainingSeats(session) === 0) return 'Đã đủ chỗ';
  return 'Không nhận thêm đăng ký';
}

function WorkshopDetails({ course }: { course: Course }) {
  const detail = course.detail;
  const goals = stringList(detail?.goalsJson);
  const includes = stringList(detail?.includesJson);
  const upcomingSessions = course.sessions.filter((session) => isOpenFutureSession(session));

  return (
    <div className="workshop-detail-body">
      <div className="workshop-detail-intro">
        <p className="workshop-kicker">BÊN TRONG BUỔI HỌC</p>
        <p>
          {detail?.leadContent ||
            course.description ||
            'Nội dung workshop đang được tiệm cập nhật.'}
        </p>
      </div>

      <div className="workshop-detail-grid">
        <section className="workshop-detail-section" aria-labelledby={`what-${course.id}`}>
          <h4 id={`what-${course.id}`}>Bạn sẽ học gì</h4>
          {goals.length ? (
            <ul className="workshop-detail-list">
              {goals.map((goal) => (
                <li key={goal}>{goal}</li>
              ))}
            </ul>
          ) : (
            <p className="workshop-muted">Mục tiêu buổi học chưa được cập nhật.</p>
          )}
        </section>
        <section className="workshop-detail-section" aria-labelledby={`included-${course.id}`}>
          <h4 id={`included-${course.id}`}>Vật liệu & dụng cụ</h4>
          {includes.length ? (
            <ul className="workshop-chip-list">
              {includes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="workshop-muted">Danh sách vật liệu chưa được công bố.</p>
          )}
        </section>
        {detail?.forWho && (
          <section className="workshop-detail-section" aria-labelledby={`forwho-${course.id}`}>
            <h4 id={`forwho-${course.id}`}>Dành cho ai</h4>
            <p>{detail.forWho}</p>
          </section>
        )}
        <section className="workshop-instructor-note" aria-label="Thông tin người hướng dẫn">
          <span className="workshop-instructor-mark" aria-hidden="true">
            G
          </span>
          <div>
            <span className="workshop-kicker">NGƯỜI ĐỒNG HÀNH</span>
            <h4>Hồ sơ người hướng dẫn chưa được kết nối</h4>
            <p>Tên và kinh nghiệm giảng viên chưa có trong dữ liệu công khai của workshop này.</p>
          </div>
        </section>
      </div>

      <section className="workshop-sessions" aria-labelledby={`sessions-${course.id}`}>
        <div className="workshop-session-heading">
          <div>
            <p className="workshop-kicker">LỊCH TẠI XƯỞNG</p>
            <h4 id={`sessions-${course.id}`}>Chọn một buổi vừa với bạn</h4>
          </div>
          <span className="workshop-session-count">
            {upcomingSessions.length ? `${upcomingSessions.length} ca đang mở` : 'Chưa có ca mở'}
          </span>
        </div>
        {course.sessions.length ? (
          <ul className="workshop-session-list">
            {course.sessions.map((session) => {
              const open = isOpenFutureSession(session);
              return (
                <li className={open ? 'is-open' : ''} key={session.id}>
                  <div className="workshop-session-date">
                    <CalendarDays size={17} aria-hidden="true" />
                    <strong>{dateLabel(session.sessionDate)}</strong>
                  </div>
                  <span className="workshop-session-fact">
                    <Clock3 size={16} aria-hidden="true" />
                    {timeLabel(session.startTime)}–{timeLabel(session.endTime)}
                  </span>
                  <span className="workshop-session-fact workshop-session-location">
                    <MapPin size={16} aria-hidden="true" />
                    {session.location || 'Địa điểm chưa cập nhật'}
                  </span>
                  <span className="workshop-session-status">{sessionStatus(session)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="workshop-muted workshop-no-sessions">
            Lịch học chưa được công bố. Tiệm chưa nhận giữ chỗ cho lớp này.
          </p>
        )}
        {upcomingSessions.length ? (
          <a
            className="button workshop-book-link"
            href={`/workshop?workshop=${encodeURIComponent(course.id)}#hen-o-xuong`}
          >
            Chọn ca & tiếp tục <ArrowDown size={17} aria-hidden="true" />
          </a>
        ) : (
          <p className="workshop-muted workshop-book-note">
            Khi có ca mở, bạn sẽ có thể chọn lịch trước khi nhập thông tin.
          </p>
        )}
      </section>
    </div>
  );
}

export default async function WorkshopPage() {
  const storefront = await getStorefront();
  const connected = storefront.mode === 'connected' && storefront.workshops !== undefined;
  const workshopUnavailable =
    storefront.mode === 'unavailable' || (storefront.mode === 'connected' && !storefront.workshops);
  const courses: Course[] =
    connected && storefront.workshops
      ? await Promise.all(
          storefront.workshops.map(async (course) => {
            try {
              return { ...course, detail: await workshopsApi().workshop(course.id) };
            } catch {
              return course;
            }
          }),
        )
      : [];
  const openSessionCount = courses.reduce(
    (count, course) =>
      count + course.sessions.filter((session) => isOpenFutureSession(session)).length,
    0,
  );

  return (
    <div className="workshop-page">
      <PageIntro
        eyebrow="WORKSHOP / SÁPA STUDIO"
        title={
          <>
            Chạm sáp, nở một
            <br className="workshop-title-break" /> bó hoa của riêng bạn.
          </>
        }
        description={
          workshopUnavailable
            ? 'Chưa thể tải workshop từ hệ thống. Trang không thay bằng lịch, giá hay số chỗ giả.'
            : connected
              ? 'Xem điều sẽ làm, vật liệu, thời lượng và từng ca thực tế trước khi chọn một buổi ở xưởng.'
              : 'Một khoảng chậm để tự tay làm hoa. Lịch, giá và chỗ ngồi thật sẽ chỉ xuất hiện khi được kết nối.'
        }
      />

      <section className="workshop-hero" aria-label="Không gian làm hoa tại xưởng">
        <div className="workshop-hero-image">
          <Image
            src="/images/ws-hero.webp"
            alt="Đôi tay đang làm hoa trong một buổi workshop tại xưởng"
            fill
            priority
            sizes="(max-width: 760px) 100vw, 56vw"
          />
          <span className="workshop-image-caption">SÁPA STUDIO · LÀM HOA BẰNG TAY</span>
        </div>
        <div className="workshop-hero-copy">
          <p className="workshop-kicker">
            <span /> MỘT TRẢI NGHIỆM THẬT, KHÔNG VỘI
          </p>
          <h2>
            Không cần khéo tay.
            <br />
            Chỉ cần có mặt.
          </h2>
          <p>
            Tiệm hướng dẫn từ những phần đầu tiên. Bạn chọn màu, làm từng cánh, rồi mang thành quả
            của chính mình về — theo đúng nội dung của từng lớp được công bố.
          </p>
          <div className="workshop-hero-facts" aria-label="Thông tin workshop">
            <span>
              <Users size={17} aria-hidden="true" /> Nhóm học tại xưởng
            </span>
            <span>
              <Clock3 size={17} aria-hidden="true" /> Thời lượng theo từng lớp
            </span>
          </div>
          <a className="button" href="#workshop-list">
            Khám phá workshop <ArrowDown size={18} aria-hidden="true" />
          </a>
          <p className="workshop-hero-note">
            Ảnh gợi không khí làm hoa, không đại diện cho một lớp cụ thể.
          </p>
        </div>
      </section>

      <section
        className="workshop-list-section"
        id="workshop-list"
        aria-labelledby="workshop-list-title"
      >
        <div className="workshop-section-heading">
          <div>
            <p className="workshop-kicker">CHỌN THEO CẢM HỨNG</p>
            <h2 id="workshop-list-title">Một lớp học, một thế giới nhỏ.</h2>
            <p>Mở từng trải nghiệm để đọc nội dung, vật liệu và ca học trước khi gửi yêu cầu.</p>
          </div>
          {connected && (
            <p className="workshop-live-count">
              {courses.length} workshop <span>·</span> {openSessionCount} ca đang mở
            </p>
          )}
        </div>

        {workshopUnavailable ? (
          <div className="workshop-empty-state" role="status">
            <span className="workshop-empty-number">—</span>
            <div>
              <h3>Thông tin workshop chưa tải được.</h3>
              <p>Thử tải lại sau. Không có giá, lịch hoặc sức chứa mẫu thay thế.</p>
            </div>
          </div>
        ) : courses.length ? (
          <div className="workshop-course-grid">
            {courses.map((course, index) => {
              const openSessions = course.sessions.filter((session) =>
                isOpenFutureSession(session),
              );
              return (
                <details
                  className="workshop-course-card"
                  key={course.id}
                  id={`workshop-${course.id}`}
                >
                  <summary>
                    <span className="workshop-course-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="workshop-course-title">
                      <span className="workshop-course-category">
                        {course.category || 'WORKSHOP TẠI XƯỞNG'}
                      </span>
                      <strong>{course.name}</strong>
                      <span className="workshop-course-description">
                        {course.description ||
                          course.detail?.leadContent ||
                          'Nội dung workshop đang được tiệm cập nhật.'}
                      </span>
                    </span>
                    <span className="workshop-course-price">
                      {priceLabel(course.basePrice)}
                      <small>{durationLabel(course.duration)}</small>
                    </span>
                    <span className="workshop-course-toggle">
                      <span>Mở nội dung</span>
                      <ArrowDown size={18} aria-hidden="true" />
                    </span>
                  </summary>
                  <div className="workshop-card-metadata" aria-label={`Tóm tắt ${course.name}`}>
                    <span>
                      <Clock3 size={16} aria-hidden="true" /> {durationLabel(course.duration)}
                    </span>
                    <span>
                      <Users size={16} aria-hidden="true" /> {course.maxCapacity} chỗ tối đa / ca
                    </span>
                    <span>
                      <CalendarDays size={16} aria-hidden="true" />{' '}
                      {openSessions.length ? `${openSessions.length} ca đang mở` : 'Chưa có ca mở'}
                    </span>
                  </div>
                  <WorkshopDetails course={course} />
                </details>
              );
            })}
          </div>
        ) : (
          <div className="workshop-empty-state" role="status">
            <span className="workshop-empty-number">01</span>
            <div>
              <h3>Lịch lớp thật chưa được mở.</h3>
              <p>
                Hiện chưa có workshop kết nối để xem. Bạn có thể gửi mong muốn để tham khảo; thao
                tác này không giữ chỗ và không gửi dữ liệu đi.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="workshop-howto" aria-labelledby="workshop-howto-title">
        <div>
          <p className="workshop-kicker">RÕ RÀNG TỪ ĐẦU</p>
          <h2 id="workshop-howto-title">
            Tìm hiểu trước.
            <br />
            Chọn lịch sau.
          </h2>
        </div>
        <ol>
          <li>
            <strong>01</strong>
            <span>
              <b>Đọc nội dung lớp</b>
              <small>Mục tiêu, vật liệu và đối tượng chỉ hiện khi có dữ liệu thật.</small>
            </span>
          </li>
          <li>
            <strong>02</strong>
            <span>
              <b>Chọn ca phù hợp</b>
              <small>Ngày, giờ, địa điểm và số chỗ lấy từ lịch đang có.</small>
            </span>
          </li>
          <li>
            <strong>03</strong>
            <span>
              <b>Gửi yêu cầu giữ chỗ</b>
              <small>Chỉ khi API được kết nối; giữ chỗ chưa phải vé đã thanh toán.</small>
            </span>
          </li>
        </ol>
      </section>

      <section className="workshop-booking-section" aria-labelledby="booking-title">
        <div className="workshop-booking-heading">
          <p className="workshop-kicker">BƯỚC CUỐI — KHI BẠN ĐÃ SẴN SÀNG</p>
          <h2 id="booking-title">Hẹn một buổi ở xưởng.</h2>
          <p>
            Chọn lớp và ca trước, rồi để lại thông tin cần thiết. Không cần điền một biểu mẫu dài
            ngay từ đầu.
          </p>
        </div>
        <div className="workshop-booking-layout">
          <WorkshopForm />
          <aside className="form-aside workshop-booking-aside">
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
                ? 'Yêu cầu giữ chỗ được gửi tới backend sau khi bạn xác nhận. Website chưa tích hợp thanh toán hoặc phát hành vé từ provider thật.'
                : 'Bản xem trước chỉ chạy trên trình duyệt. Không gửi đăng ký, không giữ chỗ và không thu cọc.'}
            </p>
            <a className="workshop-back-to-list" href="#workshop-list">
              <ArrowUpRight size={16} aria-hidden="true" /> Xem lại các workshop
            </a>
          </aside>
        </div>
      </section>
    </div>
  );
}
