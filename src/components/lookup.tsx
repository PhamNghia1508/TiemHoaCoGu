'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
export default function Lookup() {
  const [checked, setChecked] = useState(false);
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setChecked(true);
  }
  return (
    <form className="lookup-card" onSubmit={submit} onChange={() => setChecked(false)}>
      <label className="field">
        Bạn muốn tra cứu
        <select name="type">
          <option>Đơn hoa</option>
          <option>Đặt chỗ workshop</option>
        </select>
      </label>
      <label className="field">
        Mã đơn / mã đặt chỗ *
        <input
          required
          name="code"
          maxLength={64}
          placeholder="Nhập mã bạn nhận được từ tiệm"
          autoComplete="off"
        />
      </label>
      <label className="field">
        Số điện thoại *
        <input
          required
          type="tel"
          name="phone"
          autoComplete="tel"
          pattern="[+0-9 ()\-]{9,20}"
          maxLength={20}
          placeholder="Số dùng khi đặt"
        />
      </label>
      <button type="submit" className="button full">
        Kiểm tra tra cứu <ArrowUpRight size={18} />
      </button>
      {checked && (
        <div className="form-status" role="status">
          Chưa thể tra cứu vì backend chưa được kết nối. Không có yêu cầu nào được gửi và không có
          kết quả giả lập. Backend hiện yêu cầu đăng nhập để xem đơn/đặt chỗ; luồng tài khoản sẽ cần
          hoàn thiện trước khi mở bán.
        </div>
      )}
      <p className="fine-print">
        Bản trải nghiệm chưa phát hành mã đơn hoặc vé workshop thật. Thông tin bạn nhập không được
        gửi hay lưu.
      </p>
      <Link href="/hoi-dap" className="text-link">
        Có một câu hỏi khác? <ArrowUpRight size={16} />
      </Link>
    </form>
  );
}
