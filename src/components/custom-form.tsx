'use client';
import { useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from './store-provider';
import { storeRequest } from '@/lib/browser-api';
import { safeHttpUrl } from '@/lib/custom-order-status';
import type { CustomRequest, CustomRequestInput } from '@/lib/api/client';

type Palette = { label: string; color: string };
const palettes: Palette[] = [
  { label: 'Kem & hồng phấn', color: '#d4aca0' },
  { label: 'Trắng & xanh lá', color: '#9aab8d' },
  { label: 'Ấm & mộc mạc', color: '#b58f6e' },
  { label: 'Để tiệm gợi ý', color: '#e4d8c6' },
];
type Preview = { name: string; occasion: string; budget: string; message: string; palette: string };

/** Local calendar date → ISO at 12:00 local time, as the BE expects a wish date, not a slot. */
function wishDateToIso(value: string): string | undefined {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return undefined;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
function tomorrowInputValue(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function CustomForm() {
  const { mode, products } = useStore();
  const router = useRouter();
  const customizable = products.filter((p) =>
    Boolean((p as typeof p & { isCustomizable?: boolean }).isCustomizable),
  );
  const [palette, setPalette] = useState(palettes[0].label);
  const [review, setReview] = useState<Preview | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<CustomRequest | null>(null);
  const [minWishDate] = useState(tomorrowInputValue);
  const submitting = useRef(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending || submitting.current) return;
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
    const quantity = Number(form.get('quantity') || 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      setError('Số lượng phải là số nguyên từ 1 đến 1000.');
      return;
    }
    const wishDate = String(form.get('requestedCompletionDate') || '');
    const requestedCompletionDate = wishDate ? wishDateToIso(wishDate) : undefined;
    if (wishDate && !requestedCompletionDate) {
      setError('Ngày bạn mong nhận không hợp lệ.');
      return;
    }
    const referenceImageUrl = String(form.get('referenceImageUrl') || '').trim();
    if (referenceImageUrl && !safeHttpUrl(referenceImageUrl)) {
      setError('Ảnh tham khảo phải là đường dẫn http hoặc https.');
      return;
    }
    submitting.current = true;
    setPending(true);
    setError('');
    setCreated(null);
    try {
      const body: CustomRequestInput = {
        productId,
        quantity,
        referenceImageUrl: referenceImageUrl || undefined,
        requestedCompletionDate,
        description: `Liên hệ: ${values.name} — ${String(form.get('phone') || '')}\n${values.occasion}; ngân sách ${values.budget}; bảng màu ${palette}\n${values.message}`,
      };
      const result = await storeRequest<CustomRequest>('custom-orders', body, 'POST');
      setCreated(result);
      router.push(`/tra-cuu?yeu-cau=${encodeURIComponent(result.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      onChange={() => {
        if (!created) {
          setReview(null);
          if (mode === 'connected') setError('');
        }
      }}
    >
      <h2 className="form-section-title">Kể tiệm nghe một chút.</h2>
      <fieldset disabled={pending || Boolean(created)} style={{ border: 0, padding: 0, minWidth: 0 }}>
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
          <label className="field">
            Số lượng *
            <input
              type="number"
              name="quantity"
              min={1}
              max={1000}
              step={1}
              defaultValue={1}
              required
            />
          </label>
          <label className="field">
            Ngày bạn mong nhận
            <input type="date" name="requestedCompletionDate" min={minWishDate} />
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
              pattern={'[+0-9 \\(\\)\\-]{9,20}'}
              maxLength={20}
            />
          </label>
        </div>
      </fieldset>
      <p className="form-notice">
        {mode === 'preview'
          ? 'Đây là form trải nghiệm. Thông tin chỉ được dùng để xem trước, chưa gửi đến tiệm.'
          : mode === 'connected'
            ? 'Gửi yêu cầu chưa phải đặt hàng hay thanh toán. Tiệm sẽ báo giá riêng; bạn duyệt báo giá, tạo đơn và đặt cọc ở bước sau trong trang tra cứu.'
            : 'Catalog chưa sẵn sàng, chưa thể gửi yêu cầu.'}
      </p>
      {mode === 'connected' && !customizable.length && (
        <div className="form-status" role="status">
          Hiện chưa có sản phẩm nền nào có thể tùy biến. Vui lòng quay lại sau hoặc chọn sản phẩm
          khác ở cửa tiệm.
        </div>
      )}
      <button
        type="submit"
        className="button"
        disabled={
          pending ||
          Boolean(created) ||
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
          {error.includes('đăng nhập') && (
            <>
              {' '}
              <Link href="/tai-khoan" className="text-link">
                Đăng nhập lại
              </Link>
            </>
          )}
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
      {created && (
        <div className="form-status" role="status">
          <span className="eyebrow">
            <Check size={12} /> ĐÃ GỬI YÊU CẦU
          </span>
          <p>
            Mã yêu cầu: <strong>{created.id.slice(0, 8)}</strong>. Tiệm sẽ xem và báo giá; bạn
            theo dõi và duyệt báo giá trong trang tra cứu.
          </p>
          <Link href={`/tra-cuu?yeu-cau=${encodeURIComponent(created.id)}`} className="text-link">
            Xem tiến độ yêu cầu <ArrowUpRight size={16} />
          </Link>
        </div>
      )}
    </form>
  );
}
