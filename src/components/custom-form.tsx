'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useStore } from './store-provider';
import { storeRequest } from '@/lib/browser-api';
import type { CustomRequest, CustomRequestInput } from '@/lib/api/client';

const occasions = ['Sinh nhật', 'Kỷ niệm', 'Cảm ơn', 'Xin lỗi', 'Chúc mừng', 'Không cần dịp'];
const budgets = [
  'Dưới 300.000 ₫',
  '300.000 – 500.000 ₫',
  '500.000 – 1.000.000 ₫',
  'Trên 1.000.000 ₫',
  'Để tiệm gợi ý',
];
const palettes = [
  { label: 'Xanh & hồng phấn', colors: ['#bfd7f2', '#f5c9d3', '#8fa6e8'] },
  { label: 'Trắng & xanh lá', colors: ['#fff', '#cfe3c8', '#a3c79a'] },
  { label: 'Ấm & mộc mạc', colors: ['#e8b88c', '#f7efa8', '#c98f6b'] },
  { label: 'Để tiệm gợi ý', colors: ['#ece6f5', '#e6f27a', '#f5c9d3'] },
];
const initial = {
  occasion: '',
  budget: '',
  palette: '',
  productId: '',
  quantity: '1',
  date: '',
  message: '',
  name: '',
  phone: '',
};
type Fields = typeof initial;
type ShippingArea = { id: number; name: string; parentId?: number | null };

function tomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function IdeaBouquet({ colors }: { colors: string[] }) {
  const flowers = [
    [68, 103],
    [117, 78],
    [164, 105],
    [92, 141],
    [145, 145],
  ];
  return (
    <svg viewBox="0 0 240 270" role="img" aria-label="Minh họa bảng màu đã chọn">
      <path
        d="M64 120 Q100 215 120 235 Q143 215 179 120 L157 200 Q121 248 83 200Z"
        fill="#e8dcc9"
        stroke="#2433b5"
        strokeWidth="2"
      />
      <path
        d="M120 226 Q110 155 68 103 M120 226 Q120 145 117 78 M120 226 Q145 150 164 105"
        fill="none"
        stroke="#86a684"
        strokeWidth="4"
      />
      {flowers.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((angle) => (
            <ellipse
              key={angle}
              cx="0"
              cy="-16"
              rx="11"
              ry="18"
              transform={`rotate(${angle})`}
              fill={colors[i % colors.length]}
              stroke="#2433b5"
              strokeWidth="1"
            />
          ))}
          <circle r="8" fill="#f7efa8" stroke="#2433b5" strokeWidth="1" />
        </g>
      ))}
      <path
        d="M119 219 C80 194 81 232 119 225 C154 194 164 229 123 225"
        fill="#f5c9d3"
        stroke="#2433b5"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function CustomForm() {
  const { mode, products } = useStore();
  const router = useRouter();
  const customizable = products.filter((p) =>
    Boolean((p as typeof p & { isCustomizable?: boolean }).isCustomizable),
  );
  const [fields, setFields] = useState<Fields>(initial);
  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const [step, setStep] = useState(0);
  const [review, setReview] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [minDate] = useState(tomorrow);
  const [provinces, setProvinces] = useState<ShippingArea[]>([]);
  const [wards, setWards] = useState<ShippingArea[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [wardId, setWardId] = useState('');
  const [wardsLoading, setWardsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const submitting = useRef(false);
  const uploaded = useRef<{ file: File; url: string } | null>(null);
  useEffect(
    () => () => {
      if (image) URL.revokeObjectURL(image.url);
    },
    [image],
  );
  // Danh mục GHN chỉ tải khi khách tới bước liên hệ và đang chạy với backend thật.
  useEffect(() => {
    if (mode !== 'connected' || step !== 3) return;
    let active = true;
    setLocationError('');
    storeRequest<ShippingArea[]>('shipping/locations/provinces')
      .then((areas) => {
        if (!active) return;
        setProvinces(areas);
        if (!areas.length) setLocationError('Danh mục tỉnh GHN staging hiện chưa sẵn sàng.');
      })
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : '';
        setLocationError(
          message.includes('đăng nhập')
            ? 'Đăng nhập để chọn khu vực giao hoa, hoặc để tiệm hỏi lại khi báo giá.'
            : 'Không tải được danh mục tỉnh GHN staging.',
        );
      });
    return () => {
      active = false;
    };
  }, [mode, step]);
  useEffect(() => {
    if (!provinceId) {
      setWards([]);
      return;
    }
    let active = true;
    setWardsLoading(true);
    setLocationError('');
    storeRequest<ShippingArea[]>(`shipping/locations/wards?provinceId=${provinceId}`)
      .then((areas) => {
        if (!active) return;
        setWards(areas);
        if (!areas.length) setLocationError('GHN không trả danh mục phường cho tỉnh đã chọn.');
      })
      .catch(() => {
        if (!active) return;
        setLocationError('Không tải được danh mục phường GHN staging.');
      })
      .finally(() => {
        if (active) setWardsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [provinceId]);
  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
      file.size === 0 ||
      file.size > 900 * 1024
    ) {
      setImage(null);
      setError('Chọn ảnh JPG, PNG hoặc WebP có dung lượng tối đa 900 KiB.');
      return;
    }
    uploaded.current = null;
    setImage({ file, url: URL.createObjectURL(file) });
    setError('');
  }
  const palette = palettes.find((p) => p.label === fields.palette) ?? palettes[0];
  const selectedProvince = provinces.find((area) => String(area.id) === provinceId);
  const selectedWard = wards.find((area) => String(area.id) === wardId);
  const deliveryArea =
    selectedWard && selectedProvince ? `${selectedWard.name}, ${selectedProvince.name}` : '';
  function update(key: keyof Fields, value: string) {
    setFields((previous) => ({ ...previous, [key]: value }));
    setError('');
  }
  function validate(current: number) {
    if (current === 0 && (!fields.occasion || !fields.budget))
      return 'Hãy chọn dịp và khoảng ngân sách nhé.';
    if (current === 1 && !fields.palette) return 'Hãy chọn bảng màu hoặc để tiệm gợi ý nhé.';
    if (current === 1 && mode === 'connected' && !fields.productId)
      return 'Hãy chọn sản phẩm nền có thể tùy biến.';
    if (
      current === 1 &&
      (!Number.isInteger(Number(fields.quantity)) ||
        Number(fields.quantity) < 1 ||
        Number(fields.quantity) > 1000)
    )
      return 'Số lượng phải là số nguyên từ 1 đến 1000.';
    if (current === 1 && fields.date && fields.date < minDate)
      return 'Hãy chọn ngày mong nhận từ ngày mai.';
    if (current === 2 && !fields.message.trim()) return 'Kể tiệm nghe điều bạn muốn gửi gắm nhé.';
    if (current === 3 && !fields.name.trim()) return 'Hãy cho tiệm biết tên của bạn.';
    if (current === 3 && !/^[+0-9 ()-]{9,20}$/.test(fields.phone.trim()))
      return 'Số điện thoại chưa hợp lệ, bạn kiểm tra lại nhé.';
    if (current === 3 && provinces.length > 0 && (!provinceId || !wardId))
      return 'Chọn tỉnh và phường nhận hoa để tiệm báo đúng phí giao.';
    return '';
  }
  function next() {
    const message = validate(step);
    if (message) {
      setError(message);
      return;
    }
    setError('');
    if (step < 3) setStep(step + 1);
    else setReview(true);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!review) {
      next();
      return;
    }
    if (mode !== 'connected' || submitting.current) return;
    const wish = fields.date ? new Date(`${fields.date}T12:00:00`).toISOString() : undefined;
    const body: CustomRequestInput = {
      productId: fields.productId,
      quantity: Number(fields.quantity),
      requestedCompletionDate: wish,
      provinceId: provinceId ? Number(provinceId) : undefined,
      wardId: wardId ? Number(wardId) : undefined,
      description: `Liên hệ: ${fields.name.trim()} — ${fields.phone.trim()}\n${fields.occasion}; ngân sách ${fields.budget}; bảng màu ${fields.palette}\n${fields.message.trim()}`,
    };
    submitting.current = true;
    setPending(true);
    setError('');
    try {
      if (image) {
        if (uploaded.current?.file !== image.file) {
          const form = new FormData();
          form.append('file', image.file);
          const response = await fetch('/api/store/custom-orders/reference-images', {
            method: 'POST',
            body: form,
            credentials: 'same-origin',
            cache: 'no-store',
          });
          const data = await response.json().catch(() => null);
          if (!response.ok) throw new Error(data?.error || 'Không thể tải ảnh lên.');
          if (
            typeof data?.path !== 'string' ||
            !/^\/api\/reference-images\/[a-f0-9]{32}\/[a-f0-9]{32}\.(png|jpg|webp)$/.test(data.path)
          )
            throw new Error('Đường dẫn ảnh không hợp lệ.');
          uploaded.current = {
            file: image.file,
            url: new URL(data.path, window.location.origin).toString(),
          };
        }
        body.referenceImageUrl = uploaded.current.url;
      }
      const result = await storeRequest<CustomRequest>('custom-orders', body, 'POST');
      router.push(`/tra-cuu?yeu-cau=${encodeURIComponent(result.id)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <div className="x-build">
      <div className="x-panel">
        <form onSubmit={submit} noValidate>
          <div
            className="custom-progress"
            aria-live="polite"
            aria-label={`Bước ${step + 1} trên 4`}
          >
            {[0, 1, 2, 3].map((n) => (
              <span className={n <= step ? 'is-active' : ''} key={n} aria-hidden="true">
                ✿
              </span>
            ))}
            <strong>Bước {step + 1}/4</strong>
          </div>
          {review ? (
            <div className="custom-review">
              <p className="x-eyebrow">BẢN NHÁP YÊU CẦU</p>
              <h3 className="x-q">Ý tưởng của bạn</h3>
              <dl>
                <div>
                  <dt>Dịp</dt>
                  <dd>{fields.occasion}</dd>
                </div>
                <div>
                  <dt>Ngân sách</dt>
                  <dd>{fields.budget}</dd>
                </div>
                <div>
                  <dt>Bảng màu</dt>
                  <dd>{fields.palette}</dd>
                </div>
                <div>
                  <dt>Điều gửi gắm</dt>
                  <dd>{fields.message}</dd>
                </div>
                <div>
                  <dt>Số lượng</dt>
                  <dd>{fields.quantity}</dd>
                </div>
                <div>
                  <dt>Ngày mong nhận</dt>
                  <dd>{fields.date || 'Chưa chọn'}</dd>
                </div>
                <div>
                  <dt>Khu vực giao</dt>
                  <dd>{deliveryArea || 'Chưa chọn'}</dd>
                </div>
                {mode === 'connected' && (
                  <div>
                    <dt>Sản phẩm nền</dt>
                    <dd>{customizable.find((p) => p.id === fields.productId)?.name}</dd>
                  </div>
                )}
                {image && (
                  <div>
                    <dt>Ảnh tham khảo</dt>
                    <dd>{image.file.name}</dd>
                  </div>
                )}
                <div>
                  <dt>Liên hệ</dt>
                  <dd>
                    {fields.name} · {fields.phone}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="idea-step-content" key={step}>
              {step === 0 && (
                <>
                  <h3 className="x-q">Món quà dành cho dịp nào?</h3>
                  <div className="x-chips" role="group" aria-label="Chọn dịp">
                    {occasions.map((item) => (
                      <button
                        type="button"
                        className={`custom-chip ${fields.occasion === item ? 'selected' : ''}`}
                        aria-pressed={fields.occasion === item}
                        onClick={() => update('occasion', item)}
                        key={item}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                  <h3 className="x-q x-q--sm">Khoảng ngân sách</h3>
                  <div className="x-chips" role="group" aria-label="Chọn ngân sách">
                    {budgets.map((item) => (
                      <button
                        type="button"
                        className={`custom-chip ${fields.budget === item ? 'selected' : ''}`}
                        aria-pressed={fields.budget === item}
                        onClick={() => update('budget', item)}
                        key={item}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {step === 1 && (
                <>
                  <h3 className="x-q">Bảng màu bạn thích</h3>
                  <div className="x-swatches">
                    {palettes.map((p) => (
                      <button
                        type="button"
                        className={`custom-swatch ${fields.palette === p.label ? 'selected' : ''}`}
                        aria-pressed={fields.palette === p.label}
                        onClick={() => update('palette', p.label)}
                        key={p.label}
                      >
                        <i
                          style={{
                            background: `conic-gradient(${p.colors.join(',')}, ${p.colors[0]})`,
                          }}
                        />
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {mode === 'connected' && (
                    <label className="custom-field">
                      Sản phẩm nền *
                      <select
                        className="x-in"
                        value={fields.productId}
                        onChange={(e) => update('productId', e.target.value)}
                      >
                        <option value="">Chọn sản phẩm nền</option>
                        {customizable.map((p) => (
                          <option value={p.id} key={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {!customizable.length && (
                        <span>Hiện chưa có sản phẩm nền có thể tùy biến.</span>
                      )}
                    </label>
                  )}
                  <div className="custom-fields">
                    <label className="custom-field">
                      Số lượng *
                      <input
                        className="x-in"
                        type="number"
                        min="1"
                        max="1000"
                        value={fields.quantity}
                        onChange={(e) => update('quantity', e.target.value)}
                      />
                    </label>
                    <label className="custom-field">
                      Ngày bạn mong nhận
                      <input
                        className="x-in"
                        type="date"
                        min={minDate}
                        value={fields.date}
                        onChange={(e) => update('date', e.target.value)}
                      />
                    </label>
                  </div>
                </>
              )}
              {step === 2 && (
                <>
                  <label className="custom-field">
                    <span className="x-q">Điều bạn muốn gửi gắm *</span>
                    <textarea
                      className="x-in"
                      maxLength={1500}
                      value={fields.message}
                      onChange={(e) => update('message', e.target.value)}
                      placeholder="Người ấy thích gì? Bạn muốn bó hoa mang cảm giác như thế nào?"
                    />
                  </label>
                  <div className="custom-field">
                    <label htmlFor="custom-reference-image">Ảnh tham khảo (không bắt buộc)</label>
                    <p className="custom-upload-hint" id="custom-image-hint">
                      Chọn ảnh JPG, PNG hoặc WebP, tối đa 900 KiB.
                    </p>
                    <input
                      id="custom-reference-image"
                      className="x-in custom-file"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-label="Ảnh tham khảo (không bắt buộc)"
                      aria-describedby="custom-image-hint"
                      onChange={selectImage}
                    />
                    <div className="custom-file-row">
                      <label htmlFor="custom-reference-image" className="custom-file-button">
                        Chọn ảnh từ máy
                      </label>
                      {!image && <span>Chưa chọn ảnh</span>}
                    </div>
                    {image && (
                      <div className="custom-upload-preview">
                        {/* Ảnh được xem trực tiếp từ máy của người dùng. */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={image.url} alt="Ảnh tham khảo đã chọn" />
                        <div>
                          <span>{image.file.name}</span>
                          <button
                            type="button"
                            className="custom-remove-image"
                            onClick={() => {
                              setImage(null);
                              setError('');
                            }}
                          >
                            Bỏ ảnh
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              {step === 3 && (
                <>
                  <h3 className="x-q">Tiệm có thể gọi bạn là gì?</h3>
                  <label className="custom-field">
                    Tên của bạn *
                    <input
                      className="x-in"
                      autoComplete="name"
                      maxLength={100}
                      value={fields.name}
                      onChange={(e) => update('name', e.target.value)}
                    />
                  </label>
                  <label className="custom-field">
                    Số điện thoại *
                    <input
                      className="x-in"
                      type="tel"
                      autoComplete="tel"
                      maxLength={20}
                      value={fields.phone}
                      onChange={(e) => update('phone', e.target.value)}
                    />
                  </label>
                  {mode === 'connected' && (
                    <>
                      <h3 className="x-q x-q--sm">Khu vực nhận hoa</h3>
                      <p className="custom-upload-hint">
                        Chọn đúng tỉnh và phường theo danh mục GHN để tiệm báo phí giao chính xác.
                      </p>
                      <div className="custom-fields">
                        <label className="custom-field">
                          Tỉnh/thành phố
                          <select
                            className="x-in"
                            value={provinceId}
                            disabled={provinces.length === 0}
                            onChange={(e) => {
                              setProvinceId(e.target.value);
                              setWardId('');
                              setError('');
                            }}
                          >
                            <option value="">
                              {provinces.length === 0
                                ? locationError
                                  ? 'Danh mục tỉnh chưa sẵn sàng'
                                  : 'Đang tải tỉnh…'
                                : 'Chọn tỉnh/thành phố'}
                            </option>
                            {provinces.map((area) => (
                              <option value={area.id} key={area.id}>
                                {area.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="custom-field">
                          Phường/xã
                          <select
                            className="x-in"
                            value={wardId}
                            disabled={!provinceId || wardsLoading || wards.length === 0}
                            onChange={(e) => {
                              setWardId(e.target.value);
                              setError('');
                            }}
                          >
                            <option value="">
                              {wardsLoading ? 'Đang tải phường…' : 'Chọn phường/xã'}
                            </option>
                            {wards.map((area) => (
                              <option value={area.id} key={area.id}>
                                {area.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      {locationError && (
                        <p className="custom-upload-hint" role="status">
                          {locationError}
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
          <p className="x-note">
            ✿{' '}
            {mode === 'preview'
              ? 'Bản trải nghiệm: thông tin chỉ dùng để xem bản nháp, chưa gửi đến tiệm.'
              : mode === 'connected'
                ? 'Gửi yêu cầu chưa phải đặt hàng hay thanh toán. Tiệm sẽ gửi báo giá riêng để bạn duyệt.'
                : 'Catalog chưa sẵn sàng, chưa thể gửi yêu cầu.'}
          </p>
          {error && (
            <p className="custom-error" role="alert">
              {error} {error.includes('đăng nhập') && <Link href="/tai-khoan">Đăng nhập</Link>}
            </p>
          )}
          <div className="x-nav">
            {(step > 0 || review) && (
              <button
                type="button"
                className="x-btn x-btn--ghost"
                onClick={() => {
                  if (review) setReview(false);
                  else setStep(step - 1);
                  setError('');
                }}
              >
                ← {review ? 'Sửa lại' : 'Quay lại'}
              </button>
            )}
            <span />
            {!review ? (
              <button type="submit" className="x-btn">
                {step === 3 ? 'Xem bản nháp' : 'Tiếp theo'} →
              </button>
            ) : mode === 'connected' ? (
              <button type="submit" className="x-btn" disabled={pending || !customizable.length}>
                {pending ? 'Đang gửi…' : 'Gửi yêu cầu báo giá'} ↗
              </button>
            ) : (
              <span className="custom-draft">Bản nháp chưa được gửi</span>
            )}
          </div>
        </form>
      </div>
      <aside className="x-side">
        <div className="x-side__note">
          <b>{mode === 'connected' ? 'YÊU CẦU & BÁO GIÁ' : 'ĐÂY LÀ BẢN XEM TRƯỚC'}</b>
          {mode === 'connected'
            ? 'Tiệm sẽ xem ý tưởng và gửi báo giá để bạn cân nhắc trong trang tra cứu.'
            : 'Thông tin chưa được gửi hay lưu trên máy chủ. Chưa có báo giá hoặc thanh toán.'}
        </div>
        <figure className="x-prev custom-preview">
          <figcaption className="x-prev__t">Ý tưởng đang nở hoa</figcaption>
          <IdeaBouquet colors={palette.colors} />
          <div className="custom-preview-text">
            <strong>{fields.palette || 'Chọn bảng màu bạn thích'}</strong>
            <p>{fields.message || 'Một chút về người ấy, một chút về điều bạn muốn gửi…'}</p>
          </div>
          <small>Hình minh họa màu sắc, không phải thiết kế thành phẩm.</small>
        </figure>
      </aside>
    </div>
  );
}
