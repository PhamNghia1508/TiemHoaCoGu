'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, ShoppingBag, PencilLine } from 'lucide-react';
import { useStore } from './store-provider';
import { money } from '@/lib/catalog';
import { storeRequest } from '@/lib/browser-api';
import { payloadFingerprint, type CheckoutPayload, type ShippingQuote } from '@/lib/transaction';

type OrderResult = {
  id?: string;
  orderCode?: string;
  totalAmount?: number;
  paymentStatus?: string;
  orderStatus?: string;
};
type GatewayAvailability = { provider: string; ready: boolean; sandbox: boolean };
type ShippingArea = { id: number; name: string; parentId?: number | null };
type GatewayCharge = {
  orderId: string;
  amount: number;
  transactionCode: string;
  redirectUrl?: string | null;
};

export default function Checkout() {
  const { cart, total, openCart, products, mode } = useStore();
  const [reviewed, setReviewed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [result, setResult] = useState<OrderResult | null>(null);
  const [provinces, setProvinces] = useState<ShippingArea[]>([]);
  const [wards, setWards] = useState<ShippingArea[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [wardId, setWardId] = useState('');
  const [wardsLoading, setWardsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const attempt = useRef<{ fingerprint: string; payload: CheckoutPayload } | null>(null);
  const lines = cart
    .map((line) => ({ line, product: products.find((p) => p.id === line.id) }))
    .filter((x): x is { line: (typeof cart)[number]; product: NonNullable<typeof x.product> } =>
      Boolean(x.product),
    );

  const selectedProvince = provinces.find((area) => String(area.id) === provinceId);
  const selectedWard = wards.find((area) => String(area.id) === wardId);

  useEffect(() => {
    if (mode !== 'connected') return;
    let active = true;
    storeRequest<ShippingArea[]>('shipping/locations/provinces')
      .then((areas) => {
        if (!active) return;
        setProvinces(areas);
        if (!areas.length) setLocationError('Danh mục tỉnh GHN staging hiện chưa sẵn sàng.');
      })
      .catch(() => {
        if (active) setLocationError('Không tải được danh mục tỉnh GHN staging.');
      });
    return () => {
      active = false;
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== 'connected' || !provinceId) return;
    let active = true;
    const query = new URLSearchParams({ provinceId });
    storeRequest<ShippingArea[]>(`shipping/locations/wards?${query.toString()}`)
      .then((areas) => {
        if (!active) return;
        setWards(areas);
        if (!areas.length) setLocationError('GHN không trả danh mục phường cho tỉnh đã chọn.');
      })
      .catch(() => {
        if (active) setLocationError('Không tải được danh mục phường GHN staging.');
      })
      .finally(() => {
        if (active) setWardsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [mode, provinceId]);

  function buildPayload(form: FormData, shippingQuoteId?: string): CheckoutPayload {
    const streetAddress = String(form.get('streetAddress') || '').trim();
    const items = lines.map(({ line, product }) => ({
      productId: product.id,
      quantity: line.quantity,
    }));
    return {
      shippingAddress: [streetAddress, selectedWard?.name, selectedProvince?.name]
        .filter(Boolean)
        .join(', '),
      receiverName: String(form.get('name') || ''),
      receiverPhone: String(form.get('phone') || ''),
      receiverEmail: String(form.get('email') || '') || undefined,
      note: String(form.get('note') || '') || undefined,
      items,
      shippingQuoteId,
      idempotencyKey: '',
    };
  }

  async function requestQuote(form: FormData) {
    const draft = buildPayload(form);
    if (!selectedProvince || !selectedWard)
      throw new Error('Hãy chọn tỉnh và phường trong danh mục GHN staging.');
    const response = await storeRequest<ShippingQuote>(
      'shipping/quote',
      {
        streetAddress: String(form.get('streetAddress') || '').trim(),
        provinceId: selectedProvince.id,
        wardId: selectedWard.id,
        items: draft.items,
      },
      'POST',
    );
    if (!response.id) throw new Error('Báo giá giao hàng không hợp lệ.');
    setQuote(response);
    setError('');
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    if (mode !== 'connected') {
      setReviewed(true);
      return;
    }
    if (result) return;
    const form = new FormData(e.currentTarget);
    setPending(true);
    try {
      if (!quote) {
        await requestQuote(form);
        return;
      }
      const availability = await storeRequest<GatewayAvailability>('gateway/availability');
      if (!availability.ready || availability.provider !== 'MomoSandbox' || !availability.sandbox)
        throw new Error('MoMo sandbox chưa được cấu hình. Chưa tạo đơn hoặc gửi yêu cầu thu tiền.');
      if (!attempt.current && quote.expiresAt && new Date(quote.expiresAt).getTime() <= Date.now())
        throw new Error(
          'Báo phí đã hết hạn. Hãy kiểm tra lịch sử nếu đã gửi đơn, rồi bắt đầu báo phí mới.',
        );
      const draft = buildPayload(form, quote.id);
      const fingerprint = payloadFingerprint(draft);
      if (!attempt.current || attempt.current.fingerprint !== fingerprint) {
        attempt.current = {
          fingerprint,
          payload: { ...draft, idempotencyKey: crypto.randomUUID() },
        };
      }
      const order = await storeRequest<OrderResult>(
        'orders/checkout',
        attempt.current.payload,
        'POST',
      );
      setResult(order);
      if (!order.id || order.totalAmount === undefined)
        throw new Error(
          'Đơn đã tạo nhưng thiếu mã/tổng tiền trả về; không gửi yêu cầu thanh toán.',
        );
      if (
        !Number.isInteger(order.totalAmount) ||
        order.totalAmount < 1_000 ||
        order.totalAmount > 50_000_000
      )
        throw new Error(
          'Đơn đã tạo nhưng tổng tiền ngoài giới hạn MoMo sandbox (1.000–50.000.000 ₫); chưa chuyển sang thanh toán.',
        );
      const returnUrl = new URL('/thanh-toan/ket-qua', window.location.origin);
      returnUrl.searchParams.set('orderId', order.id);
      const charge = await storeRequest<GatewayCharge>(
        `gateway/orders/${order.id}/charge`,
        {
          amount: order.totalAmount,
          returnUrl: returnUrl.toString(),
          idempotencyKey: crypto.randomUUID(),
        },
        'POST',
      );
      const redirect = charge.redirectUrl ? new URL(charge.redirectUrl) : null;
      if (
        !redirect ||
        redirect.protocol !== 'https:' ||
        redirect.hostname !== 'test-payment.momo.vn'
      )
        throw new Error(
          'MoMo sandbox chưa trả về đường dẫn kiểm thử hợp lệ. Đừng gửi lại đơn; hãy kiểm tra trạng thái đơn.',
        );
      window.location.assign(redirect.toString());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Không thể tạo đơn. Bạn có thể thử lại cùng báo giá.',
      );
    } finally {
      setPending(false);
    }
  }

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
  const shippingAmount = quote?.amount ?? quote?.shippingFee;
  return (
    <div className="form-layout">
      <form
        onSubmit={submit}
        onChange={() => {
          setReviewed(false);
          if (!result) {
            setError('');
            setQuote(null);
            attempt.current = null;
          }
        }}
      >
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
              placeholder="Để nhận thông tin đơn"
            />
          </label>
          {mode === 'connected' ? (
            <>
              <label className="field full">
                Số nhà, tên đường *
                <textarea
                  name="streetAddress"
                  autoComplete="shipping street-address"
                  required
                  maxLength={500}
                  placeholder="Số nhà, tên đường"
                  style={{ minHeight: 85 }}
                />
              </label>
              <label className="field">
                Tỉnh/thành phố *
                <select
                  name="provinceId"
                  value={provinceId}
                  required
                  disabled={provinces.length === 0}
                  onChange={(event) => {
                    const selected = event.currentTarget.value;
                    setProvinceId(selected);
                    setWardId('');
                    setWards([]);
                    setWardsLoading(Boolean(selected));
                    setLocationError('');
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
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Phường/xã *
                <select
                  name="wardId"
                  value={wardId}
                  required
                  disabled={!provinceId || wardsLoading || wards.length === 0}
                  onChange={(event) => setWardId(event.currentTarget.value)}
                >
                  <option value="">{wardsLoading ? 'Đang tải phường…' : 'Chọn phường/xã'}</option>
                  {wards.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </label>
              {locationError && (
                <p className="field full form-status" role="alert">
                  {locationError}
                </p>
              )}
            </>
          ) : (
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
          )}
          <label className="field full">
            Một lời nhắn gửi cùng hoa
            <textarea
              name="note"
              maxLength={500}
              placeholder="Có những điều, bạn vẫn muốn tự mình viết…"
            />
          </label>
        </div>
        {mode === 'preview' ? (
          <div className="form-notice">
            Bản trải nghiệm chưa kết nối backend, chưa xác minh tồn kho, phí giao hoặc thời gian
            nhận. Thông tin trong form chỉ ở trang này; chưa được gửi hay dùng để thu tiền.
          </div>
        ) : mode === 'unavailable' ? (
          <div className="form-notice">Catalog chưa sẵn sàng. Chưa thể đặt đơn lúc này.</div>
        ) : (
          <div className="form-notice">
            {quote
              ? `Phí giao được báo từ hệ thống: ${shippingAmount === undefined ? 'đang cập nhật' : money(shippingAmount)}${quote.expiresAt ? ` · hết hạn ${quote.expiresAt}` : ''}. Bước tiếp theo chỉ dùng MoMo sandbox; không chuyển sang cổng thanh toán thật.`
              : 'Trước hết hãy lấy báo giá giao hàng thật; chưa tạo đơn.'}
          </div>
        )}
        {mode === 'preview' && (
          <label className="check-field">
            <input type="checkbox" required /> Tôi hiểu đây là bước kiểm tra giao diện, chưa đặt đơn
            và chưa thanh toán.
          </label>
        )}
        <button
          type="submit"
          className="button"
          disabled={
            pending ||
            mode === 'unavailable' ||
            Boolean(result) ||
            (mode === 'connected' &&
              (wardsLoading || !selectedProvince || !selectedWard || Boolean(locationError)))
          }
        >
          {pending
            ? 'Đang xử lý…'
            : mode === 'connected'
              ? quote
                ? 'Tạo đơn & mở MoMo sandbox'
                : 'Báo phí giao hàng'
              : 'Kiểm tra thông tin'}{' '}
          <ArrowUpRight size={18} />
        </button>
        {mode === 'connected' && quote && !result && (
          <button
            type="button"
            className="text-link"
            disabled={pending}
            onClick={() => {
              setQuote(null);
              attempt.current = null;
              setError(
                'Nếu lần gửi trước bị gián đoạn, hãy xem lịch sử trước khi tạo lần đặt mới để tránh trùng đơn.',
              );
            }}
          >
            Bắt đầu báo phí mới
          </button>
        )}
        {mode === 'connected' && (
          <p className="fine-print">
            Chưa đăng nhập? <Link href="/tai-khoan">Đăng nhập để tiếp tục</Link>
          </p>
        )}
        {error && (
          <div className="form-status" role="alert">
            {error}
          </div>
        )}
        {result && (
          <div className="form-status" role="status">
            <span className="eyebrow">ĐƠN ĐÃ TẠO</span>
            <p>
              Mã đơn: <strong>{result.orderCode || result.id}</strong>. Trạng thái thanh toán chỉ
              được xác nhận từ backend sau IPN, không dựa vào trang chuyển hướng MoMo.
            </p>
            <p>
              Trạng thái: {result.orderStatus || 'Đang cập nhật'} · Thanh toán:{' '}
              {result.paymentStatus || 'Chưa xác nhận'}.
            </p>
            {result.totalAmount !== undefined && (
              <p>
                Tổng do backend xác nhận: <strong>{money(result.totalAmount)}</strong>.
              </p>
            )}
            <Link href="/tra-cuu" className="text-link">
              Xem đơn trong lịch sử tài khoản
            </Link>
            {result.id && (
              <p>
                <Link
                  href={`/thanh-toan/ket-qua?orderId=${encodeURIComponent(result.id)}`}
                  className="text-link"
                >
                  Kiểm tra trạng thái thanh toán
                </Link>
              </p>
            )}
          </div>
        )}
        {reviewed && (
          <div className="form-status" role="status">
            <span className="eyebrow">THÔNG TIN ĐÃ ĐỦ CHO BẢN XEM TRƯỚC</span>
            <p style={{ marginTop: 10 }}>
              Chưa có đơn hàng nào được tạo. Túi hoa vẫn được giữ trên trình duyệt.
            </p>
          </div>
        )}
      </form>
      <aside className="form-aside">
        <div className="dialog-heading">
          <h2 style={{ fontSize: 34, margin: 0 }}>Túi hoa của bạn</h2>
          <button type="button" className="icon-button" aria-label="Sửa túi hoa" onClick={openCart}>
            <PencilLine size={18} />
          </button>
        </div>
        {lines.map(({ line, product }) => (
          <div key={product.id} className="checkout-summary">
            <Image
              src={product.image}
              alt={product.name}
              width={56}
              height={68}
              unoptimized={/^https?:/.test(product.image)}
            />
            <div>
              <h3>{product.name}</h3>
              <p>Số lượng: {line.quantity}</p>
            </div>
            <span>{money(line.quantity * product.price)}</span>
          </div>
        ))}
        <div className="checkout-totals">
          <div>
            <span>Tạm tính</span>
            <span>{money(total)}</span>
          </div>
          <div>
            <span>Phí giao hoa</span>
            <span>{shippingAmount === undefined ? 'Chưa xác định' : money(shippingAmount)}</span>
          </div>
          <div className="grand-total">
            <span>Tổng tạm tính</span>
            <strong>
              {shippingAmount === undefined ? 'Chưa xác định' : money(total + shippingAmount)}
            </strong>
          </div>
        </div>
        <p className="fine-print">
          Giá và tổng cuối được backend kiểm tra lại khi tạo đơn. Báo phí giao hàng không giữ hàng.
        </p>
        <Link href="/cua-tiem" className="text-link">
          Chọn thêm một chút <ArrowUpRight size={16} />
        </Link>
      </aside>
    </div>
  );
}
