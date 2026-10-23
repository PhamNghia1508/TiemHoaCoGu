'use client';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
const palettes = [
  { label: 'Kem & hồng phấn', color: '#d4aca0' },
  { label: 'Trắng & xanh lá', color: '#9aab8d' },
  { label: 'Ấm & mộc mạc', color: '#b58f6e' },
  { label: 'Để tiệm gợi ý', color: '#e4d8c6' },
];
export default function CustomForm() {
  const [palette, setPalette] = useState(palettes[0].label);
  const [review, setReview] = useState<Record<string, string> | null>(null);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setReview({
      name: String(form.get('name')),
      occasion: String(form.get('occasion')),
      budget: String(form.get('budget')),
      message: String(form.get('message')),
      palette,
    });
  };
  return (
    <form onSubmit={submit} onChange={() => setReview(null)}>
      <h2 className="form-section-title">Kể tiệm nghe một chút.</h2>
      <div className="form-grid">
        <label className="field">
          Bạn muốn tặng ai? *
          <select name="occasion" required>
            <option value="">Chọn một dịp, hoặc không cần dịp</option>
            <option>Sinh nhật</option>
            <option>Kỷ niệm & lời thương</option>
            <option>Tốt nghiệp & chúc mừng</option>
            <option>Tặng chính mình</option>
            <option>Một ngày bình thường</option>
          </select>
        </label>
        <label className="field">
          Khoảng ngân sách *
          <select name="budget" required>
            <option value="">Khoảng bạn thấy thoải mái</option>
            <option>Dưới 400.000 ₫</option>
            <option>400.000 – 700.000 ₫</option>
            <option>700.000 – 1.000.000 ₫</option>
            <option>Trên 1.000.000 ₫</option>
          </select>
        </label>
        <div className="field full">
          <span>Bảng màu bạn thích</span>
          <div className="palette-options" role="group" aria-label="Chọn bảng màu">
            {palettes.map((p) => (
              <button
                key={p.label}
                type="button"
                className={`palette-option ${palette === p.label ? 'selected' : ''}`}
                aria-pressed={palette === p.label}
                onClick={() => {
                  setPalette(p.label);
                  setReview(null);
                }}
              >
                <i style={{ background: p.color }} />
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <label className="field full">
          Điều bạn muốn gửi gắm *
          <textarea
            required
            name="message"
            maxLength={1500}
            placeholder="Người ấy thích gì? Bạn muốn bó hoa mang cảm giác như thế nào? Hay có một câu chuyện muốn kể…"
          />
        </label>
        <label className="field">
          Tên của bạn *
          <input
            required
            name="name"
            autoComplete="name"
            maxLength={100}
            placeholder="Tiệm gọi bạn là…"
          />
        </label>
        <label className="field">
          Số điện thoại *
          <input
            required
            name="phone"
            autoComplete="tel"
            type="tel"
            pattern="[+0-9 ()\-]{9,20}"
            maxLength={20}
            placeholder="Số để tiệm liên hệ khi mở bán"
          />
        </label>
      </div>
      <p className="form-notice">
        Đây là form trải nghiệm. Thông tin chỉ được dùng để xem trước ngay trên trang, không lưu vào
        máy chủ và chưa được gửi đến tiệm. Chưa có báo giá, cam kết hoàn thiện hay thanh toán.
      </p>
      <button type="submit" className="button">
        Xem bản nháp yêu cầu <ArrowUpRight size={18} />
      </button>
      {review && (
        <div className="form-status" role="status">
          <span className="eyebrow">
            <Check size={12} /> BẢN NHÁP — CHƯA GỬI
          </span>
          <h3 style={{ margin: '12px 0', fontSize: 30 }}>Một bó hoa dành cho {review.name}.</h3>
          <p>
            {review.occasion} · {review.budget}
            <br />
            Bảng màu: {review.palette}
          </p>
          <p style={{ marginTop: 10, whiteSpace: 'pre-wrap' }}>{review.message}</p>
          <p style={{ marginTop: 12 }}>
            Bạn có thể sửa các lựa chọn bên trên. Yêu cầu thật chỉ mở khi backend, tài khoản khách
            hàng và quy trình báo giá được kết nối.
          </p>
        </div>
      )}
    </form>
  );
}
