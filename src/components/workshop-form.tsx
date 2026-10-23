'use client';
import { useState, useSyncExternalStore, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
const subscribe = () => () => {};
export default function WorkshopForm() {
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const [review, setReview] = useState<{ course: string; date: string; guests: string } | null>(
    null,
  );
  const today = ready ? new Date().toLocaleDateString('en-CA') : undefined;
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    setReview({
      course: String(d.get('course')),
      date: String(d.get('date')),
      guests: String(d.get('guests')),
    });
  }
  return (
    <form id="hen-o-xuong" data-ready={ready} onSubmit={submit} onChange={() => setReview(null)}>
      <h2 className="form-section-title">Phác một buổi hẹn ở xưởng.</h2>
      <div className="form-grid">
        <label className="field full">
          Trải nghiệm bạn muốn thử *
          <select name="course" required>
            <option>Hoa Sáp Cơ Bản</option>
            <option>Bó Quà Tặng</option>
          </select>
        </label>
        <label className="field">
          Ngày bạn mong muốn *<input type="date" name="date" min={today} required />
        </label>
        <label className="field">
          Bạn đi cùng mấy người? *
          <select name="guests" required>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} người
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          Tên của bạn *
          <input
            name="name"
            autoComplete="name"
            required
            maxLength={100}
            placeholder="Tiệm gọi bạn là…"
          />
        </label>
        <label className="field">
          Số điện thoại *
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            pattern="[+0-9 ()\-]{9,20}"
            required
            maxLength={20}
            placeholder="Số liên hệ của bạn"
          />
        </label>
      </div>
      <p className="form-notice">
        Lịch lớp thật chưa được mở. Ngày bạn chọn chỉ là mong muốn, không phải ca còn chỗ. Form này
        chỉ xem trước tại trình duyệt, không gửi đăng ký, không giữ chỗ và không thu cọc.
      </p>
      <button className="button" type="submit" disabled={!ready}>
        Xem trước buổi hẹn <ArrowUpRight size={18} />
      </button>
      {review && (
        <div className="form-status" role="status">
          <span className="eyebrow">BUỔI HẸN DỰ KIẾN — CHƯA ĐẶT CHỖ</span>
          <h3 style={{ margin: '12px 0' }}>{review.course}</h3>
          <p>
            {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long' }).format(
              new Date(`${review.date}T12:00:00`),
            )}{' '}
            · {review.guests} người
          </p>
          <p>
            Tiệm chưa nhận thông tin này. Khi mở lịch chính thức, bạn sẽ chọn một ca thực tế và kiểm
            tra giá, số chỗ, chính sách cọc trước khi xác nhận.
          </p>
        </div>
      )}
    </form>
  );
}
