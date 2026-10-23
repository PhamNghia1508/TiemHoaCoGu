'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState, type FormEvent } from 'react';
import { ArrowUpRight, ShoppingBag, PencilLine } from 'lucide-react';
import { useStore } from './store-provider';
import { money, products } from '@/lib/catalog';
export default function Checkout() {
  const { cart, total, openCart } = useStore();
  const [reviewed, setReviewed] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setReviewed(true);
  };
  if (!cart.length)
    return (
      <div className="empty-state" style={{ paddingTop: 0 }}>
        <ShoppingBag size={38} strokeWidth={1} />
        <h2 style={{ fontSize: 43 }}>Chọn hoa trước nhé.</h2>
        <p>Túi hoa của bạn đang trống. Một món quà dịu dàng vẫn đang chờ ở cửa tiệm.</p>
        <Link href="/cua-tiem" className="button">
          Ghé cửa tiệm <ArrowUpRight size={18} />
        </Link>
      </div>
    );
  return (
    <div className="form-layout">
      <form onSubmit={submit} onChange={() => setReviewed(false)}>
        <h2 className="form-section-title">Món quà này sẽ đến với ai?</h2>
        <div className="form-grid">
          <label className="field">
            Tên người nhận *
            <input
              name="name"
              autoComplete="shipping name"
              required
              maxLength={100}
              placeholder="Tên người nhận hoa"
            />
          </label>
          <label className="field">
            Số điện thoại *
            <input
              name="phone"
              type="tel"
              autoComplete="shipping tel"
              pattern="[+0-9 ()\-]{9,20}"
              required
              maxLength={20}
              placeholder="Số liên hệ giao hoa"
            />
          </label>
          <label className="field full">
            Email của bạn
            <input
              type="email"
              name="email"
              autoComplete="email"
              maxLength={150}
              placeholder="Để nhận thông tin đơn khi mở bán"
            />
          </label>
          <label className="field full">
            Địa chỉ giao hoa *
            <textarea
              name="address"
              autoComplete="shipping street-address"
              required
              maxLength={500}
              placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố"
              style={{ minHeight: 85 }}
            />
          </label>
          <label className="field full">
            Một lời nhắn gửi cùng hoa
            <textarea
              name="note"
              maxLength={500}
              placeholder="Có những điều, bạn vẫn muốn tự mình viết…"
            />
          </label>
        </div>
        <div className="form-notice">
          Bản trải nghiệm chưa kết nối backend, chưa xác minh tồn kho, phí giao hoặc thời gian nhận.
          Thông tin trong form chỉ ở trang này; không được gửi, lưu máy chủ hay dùng để thu tiền.
        </div>
        <label className="check-field">
          <input type="checkbox" required />
          Tôi hiểu đây là bước kiểm tra giao diện, chưa đặt đơn và chưa thanh toán.
        </label>
        <button type="submit" className="button">
          Kiểm tra thông tin <ArrowUpRight size={18} />
        </button>
        {reviewed && (
          <div className="form-status" role="status">
            <span className="eyebrow">THÔNG TIN ĐÃ ĐỦ CHO BẢN XEM TRƯỚC</span>
            <p style={{ marginTop: 10 }}>
              Chưa có đơn hàng nào được tạo. Túi hoa vẫn được giữ trên trình duyệt để bạn tiếp tục
              chỉnh sửa. Đặt hàng & thanh toán thật chỉ mở sau khi backend và quy trình xác nhận
              được kết nối.
            </p>
          </div>
        )}
      </form>
      <aside className="form-aside">
        <div className="dialog-heading">
          <h2 style={{ fontSize: 34, margin: 0 }}>Túi hoa của bạn</h2>
          <button className="icon-button" aria-label="Sửa túi hoa" onClick={openCart}>
            <PencilLine size={18} />
          </button>
        </div>
        {cart.map((line) => {
          const p = products.find((p) => p.id === line.id)!;
          return (
            <div key={p.id} className="checkout-summary">
              <Image src={p.image} alt={p.name} width={56} height={68} />
              <div>
                <h3>{p.name}</h3>
                <p>Số lượng: {line.quantity}</p>
              </div>
              <span>{money(line.quantity * p.price)}</span>
            </div>
          );
        })}
        <div className="checkout-totals">
          <div>
            <span>Tạm tính</span>
            <span>{money(total)}</span>
          </div>
          <div>
            <span>Phí giao hoa</span>
            <span>Chưa xác định</span>
          </div>
          <div className="grand-total">
            <span>Tổng tạm tính</span>
            <strong>{money(total)}</strong>
          </div>
        </div>
        <p className="fine-print">
          Giá tham khảo từ dữ liệu trải nghiệm, không phải báo giá thanh toán. Chưa áp dụng khuyến
          mãi hay phí giao hàng.
        </p>
        <Link href="/cua-tiem" className="text-link">
          Chọn thêm một chút <ArrowUpRight size={16} />
        </Link>
      </aside>
    </div>
  );
}
