'use client';
import { useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useStore } from './store-provider';
import { storeRequest } from '@/lib/browser-api';
import type {
  CustomQuote,
  CustomRequest,
  CustomRequestInput,
  CustomCheckout,
} from '@/lib/api/client';

type Palette = { label: string; color: string };
const palettes: Palette[] = [
  { label: 'Kem & hồng phấn', color: '#d4aca0' },
  { label: 'Trắng & xanh lá', color: '#9aab8d' },
  { label: 'Ấm & mộc mạc', color: '#b58f6e' },
  { label: 'Để tiệm gợi ý', color: '#e4d8c6' },
];
type Preview = { name: string; occasion: string; budget: string; message: string; palette: string };

export default function CustomForm() {
  const { mode, products } = useStore();
  const customizable = products.filter((p) =>
    Boolean((p as typeof p & { isCustomizable?: boolean }).isCustomizable),
  );
  const [palette, setPalette] = useState(palettes[0].label);
  const [review, setReview] = useState<Preview | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const checkoutAttempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const [request, setRequest] = useState<CustomRequest | null>(null);
  const [quote, setQuote] = useState<CustomQuote | null>(null);
  const [address, setAddress] = useState('');
  const [completed, setCompleted] = useState<CustomCheckout | null>(null);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const productId = String(form.get('productId') || '');
    const values: Preview = {
      name: String(form.get('name') || ''),
      occasion: String(form.get('occasion') || ''),
      budget: String(form.get('budget') || ''),
      message: String(form.get('message') || ''),
      palette,
    };
    setReview(values);
    if (mode !== 'connected') return;
    if (!productId) {
      setError('Hãy chọn sản phẩm nền.');
      return;
    }
    setError('');
    setPending(true);
    try {
      const body: CustomRequestInput = {
        productId,
        quantity: 1,
        referenceImageUrl: String(form.get('referenceImageUrl') || '') || undefined,
        description: `Liên hệ: ${values.name} — ${String(form.get('phone') || '')}\n${values.occasion}; ngân sách ${values.budget}; bảng màu ${palette}\n${values.message}`,
      };
      const created = await storeRequest<CustomRequest>('custom-orders', body, 'POST');
      setRequest(created);
      setQuote(await storeRequest<CustomQuote>(`custom-orders/${created.id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu.');
    } finally {
      setPending(false);
    }
  }
  async function reloadQuote() {
    if (!request || pending) return;
    setPending(true);
    setError('');
    try {
      setQuote(await storeRequest<CustomQuote>(`custom-orders/${request.id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải báo giá.');
    } finally {
      setPending(false);
    }
  }
  async function approve() {
    if (!quote || !request || pending || quote.status.toLowerCase() !== 'quoted') return;
    setPending(true);
    setError('');
    try {
      setQuote(
        await storeRequest<CustomQuote>(
          `custom-orders/${request.id}/approve`,
          { version: quote.currentRevision },
          'POST',
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể duyệt báo giá.');
    } finally {
      setPending(false);
    }
  }
  async function checkout() {
    if (
      !quote ||
      !request ||
      !address.trim() ||
      pending ||
      quote.status.toLowerCase() !== 'approved'
    ) {
      setError('Chỉ checkout sau khi báo giá đã được duyệt và có địa chỉ giao hàng.');
      return;
    }
    setPending(true);
    setError('');
    const fingerprint = JSON.stringify([request.id, quote.currentRevision, address]);
    if (!checkoutAttempt.current || checkoutAttempt.current.fingerprint !== fingerprint)
      checkoutAttempt.current = { fingerprint, key: crypto.randomUUID() };
    try {
      const out = await storeRequest<CustomCheckout>(
        `custom-orders/${request.id}/checkout`,
        {
          shippingAddress: address,
          note: 'Checkout custom order',
          idempotencyKey: checkoutAttempt.current.key,
        },
        'POST',
      );
      setCompleted(out);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể checkout báo giá.');
    } finally {
      setPending(false);
    }
  }
  return (
    <form
      onSubmit={submit}
      onChange={() => {
        if (!completed) {
          setReview(null);
          if (mode === 'connected') setError('');
        }
      }}
    >
      <h2 className="form-section-title">Kể tiệm nghe một chút.</h2>
      <fieldset
        disabled={pending || Boolean(request)}
        style={{ border: 0, padding: 0, minWidth: 0 }}
      >
        <div className="form-grid">
          {mode === 'connected' && (
            <label className="field full">
              Sản phẩm nền *
              <select name="productId" required defaultValue="" disabled={!customizable.length}>
                <option value="">Chọn sản phẩm nền</option>
                {customizable.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
          )}
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
              placeholder="Người ấy thích gì? Bạn muốn bó hoa mang cảm giác như thế nào?"
            />
          </label>
          <label className="field full">
            Ảnh tham khảo (URL, không bắt buộc)
            <input type="url" name="referenceImageUrl" maxLength={1000} placeholder="https://…" />
          </label>
          <label className="field">
            Tên của bạn *<input required name="name" autoComplete="name" maxLength={100} />
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
            />
          </label>
        </div>
      </fieldset>
      <p className="form-notice">
        {mode === 'preview'
          ? 'Đây là form trải nghiệm. Thông tin chỉ được dùng để xem trước, chưa gửi đến tiệm.'
          : mode === 'connected'
            ? 'Yêu cầu thật cần đăng nhập. Tiệm sẽ báo giá; bạn phải duyệt rõ ràng trước checkout.'
            : 'Catalog chưa sẵn sàng, chưa thể gửi yêu cầu.'}
      </p>
      <button
        type="submit"
        className="button"
        disabled={
          pending ||
          Boolean(request) ||
          mode === 'unavailable' ||
          (mode === 'connected' && !customizable.length)
        }
      >
        {pending
          ? 'Đang xử lý…'
          : mode === 'connected'
            ? 'Gửi yêu cầu báo giá'
            : 'Xem bản nháp yêu cầu'}{' '}
        <ArrowUpRight size={18} />
      </button>
      {mode === 'connected' && (
        <p className="fine-print">
          Chưa đăng nhập? <Link href="/tai-khoan">Đăng nhập</Link>
        </p>
      )}
      {error && (
        <div className="form-status" role="alert">
          {error}
        </div>
      )}
      {review && mode === 'preview' && (
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
        </div>
      )}
      {quote && request && (
        <div className="form-status" role="status">
          <span className="eyebrow">BÁO GIÁ — {quote.status}</span>
          <p>Mã yêu cầu đã gửi: {request.id}.</p>
          <p>
            Phiên bản hiện tại: {quote.currentRevision}.{' '}
            {quote.revisions.at(-1)?.totalAmount !== undefined
              ? `Tổng: ${Number(quote.revisions.at(-1)?.totalAmount).toLocaleString('vi-VN')} ₫.`
              : 'Tiệm chưa phát hành số tiền.'}
          </p>
          {quote.revisions.at(-1) && (
            <div>
              <p>
                Tiền cọc theo báo giá:{' '}
                {Number(quote.revisions.at(-1)?.depositAmount ?? 0).toLocaleString('vi-VN')} ₫ · Dự
                kiến hoàn thiện: {quote.revisions.at(-1)?.completionDate}.
              </p>
              <p>
                Hạn duyệt: {quote.revisions.at(-1)?.expiresAt}. Lưu ý của tiệm:{' '}
                {quote.revisions.at(-1)?.adminNote || 'Không có'}.
              </p>
              <p>
                Duyệt báo giá không phải thanh toán. Checkout chỉ tạo đơn chờ xử lý, chưa thu tiền.
              </p>
            </div>
          )}
          <button
            type="button"
            className="button"
            disabled={pending || quote.status.toLowerCase() !== 'quoted'}
            onClick={approve}
          >
            Duyệt báo giá này
          </button>
          <button type="button" className="text-link" disabled={pending} onClick={reloadQuote}>
            Tải lại báo giá
          </button>
          {quote.status.toLowerCase() === 'approved' && !completed && (
            <>
              <label className="field full" style={{ marginTop: 16 }}>
                Địa chỉ giao hàng *
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} required />
              </label>
              <button type="button" className="button" disabled={pending} onClick={checkout}>
                Tạo đơn đặt riêng
              </button>
            </>
          )}
          {completed && (
            <p>
              Đã tạo đơn <strong>{completed.orderCode}</strong>. Chưa xác nhận thu tiền.{' '}
              <Link href="/tra-cuu">Xem trạng thái đơn trong tra cứu</Link>.
            </p>
          )}
        </div>
      )}
    </form>
  );
}
