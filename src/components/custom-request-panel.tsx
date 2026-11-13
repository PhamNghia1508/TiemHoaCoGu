'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight, CheckCircle2, Clock, History, RefreshCw } from 'lucide-react';
import { money } from '@/lib/catalog';
import { storeRequest } from '@/lib/browser-api';
import {
  bouquetSummary,
  CUSTOM_STEPS,
  customStatusLabel,
  customStatusTone,
  customStepIndex,
  safeHttpUrl,
} from '@/lib/custom-order-status';
import type {
  CustomCheckoutInput,
  CustomQuote,
  CustomRequest,
  CustomRequestInput,
  PaymentBalance,
} from '@/lib/api/client';

const MIN_CHARGE = 1_000;
const MAX_CHARGE = 50_000_000;
const ACTIVE_STATUSES = ['requested', 'quoted', 'approved'];
const lower = (s?: string) => (s ?? '').toLowerCase();
const moneyOrDash = (n?: number) => (typeof n === 'number' ? money(n) : '—');
const dateOnly = (s?: string) => (s ? new Date(s).toLocaleDateString('vi-VN') : '—');
const dateTime = (s?: string) => (s ? new Date(s).toLocaleString('vi-VN') : '—');
const revisionLabels: Record<string, string> = {
  sent: 'Tiệm đã gửi',
  approved: 'Bạn đã duyệt',
  superseded: 'Đã thay thế',
};
const revisionLabel = (status: string) => revisionLabels[lower(status)] ?? status;
type ShippingArea = { id: number; name: string; parentId?: number | null };

function toDateInput(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function wishDateToIso(value: string): string | undefined {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return undefined;
  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export default function CustomRequestPanel({
  request,
  onChanged,
}: {
  request: CustomRequest;
  onChanged: (fresh: CustomRequest) => void;
}) {
  const [quote, setQuote] = useState<CustomQuote | null>(null);
  const [balance, setBalance] = useState<PaymentBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [payError, setPayError] = useState('');
  const [reviseOpen, setReviseOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [revise, setRevise] = useState({
    quantity: String(request.quantity),
    requestedCompletionDate: toDateInput(request.requestedCompletionDate),
    description: request.description,
    referenceImageUrl: request.referenceImageUrl ?? '',
  });
  const [receiver, setReceiver] = useState({ name: '', phone: '', address: '' });
  const [provinces, setProvinces] = useState<ShippingArea[]>([]);
  const [wards, setWards] = useState<ShippingArea[]>([]);
  const [provinceId, setProvinceId] = useState('');
  const [wardId, setWardId] = useState('');
  const [wardsLoading, setWardsLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const checkoutAttempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const payAttempt = useRef<{ fingerprint: string; key: string } | null>(null);

  const load = useCallback(
    async (quiet = false) => {
      if (!quiet) setLoading(true);
      try {
        const nextQuote = await storeRequest<CustomQuote>(`custom-orders/${request.id}`);
        setQuote(nextQuote);
        if (nextQuote.orderId) {
          try {
            const nextBalance = await storeRequest<PaymentBalance>(
              `gateway/orders/${nextQuote.orderId}/balance`,
            );
            setBalance(nextBalance);
            setPayError('');
          } catch (err) {
            setBalance(null);
            setPayError(
              err instanceof Error ? err.message : 'Không thể đọc số dư thanh toán của đơn.',
            );
          }
        } else setBalance(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải báo giá.');
      } finally {
        setLoading(false);
      }
    },
    [request.id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!checkoutOpen) return;
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
            ? 'Phiên đăng nhập đã hết hạn (sau 15 phút). Vui lòng đăng nhập lại.'
            : 'Không tải được danh mục tỉnh GHN staging.',
        );
      });
    return () => {
      active = false;
    };
  }, [checkoutOpen]);

  useEffect(() => {
    if (!checkoutOpen || !provinceId) {
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
      .catch((err) => {
        if (!active) return;
        const message = err instanceof Error ? err.message : '';
        setLocationError(
          message.includes('đăng nhập')
            ? 'Phiên đăng nhập đã hết hạn (sau 15 phút). Vui lòng đăng nhập lại.'
            : 'Không tải được danh mục phường GHN staging.',
        );
      })
      .finally(() => {
        if (active) setWardsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [checkoutOpen, provinceId]);

  // Điền sẵn khu vực khách đã chọn lúc gửi yêu cầu, đúng một lần, để khách vẫn xóa/chọn lại được.
  const prefilledArea = useRef(false);
  useEffect(() => {
    if (!checkoutOpen || prefilledArea.current) return;
    prefilledArea.current = true;
    if (request.deliveryProvinceId) setProvinceId(String(request.deliveryProvinceId));
    if (request.deliveryWardId) setWardId(String(request.deliveryWardId));
  }, [checkoutOpen, request.deliveryProvinceId, request.deliveryWardId]);

  async function refreshRequest(): Promise<CustomRequest | null> {
    const list = await storeRequest<CustomRequest[]>('custom-orders');
    const fresh = list.find((item) => item.id === request.id) ?? null;
    if (fresh) onChanged(fresh);
    return fresh;
  }

  const currentRevision =
    quote?.revisions.find((revision) => revision.version === quote.currentRevision) ??
    quote?.revisions.at(-1);
  const expired = currentRevision
    ? new Date(currentRevision.expiresAt).getTime() <= Date.now()
    : false;
  const active = ACTIVE_STATUSES.includes(lower(request.status)) && !request.orderId;
  const canApprove =
    lower(quote?.status) === 'quoted' && Boolean(currentRevision) && !expired && !request.orderId;
  const canCheckout = lower(quote?.status) === 'approved' && !quote?.orderId && !request.orderId;
  const referenceUrl = safeHttpUrl(request.referenceImageUrl);

  async function approve() {
    if (!quote || pending || !canApprove) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      setQuote(
        await storeRequest<CustomQuote>(
          `custom-orders/${request.id}/approve`,
          { version: quote.currentRevision },
          'POST',
        ),
      );
      await refreshRequest();
      setNotice('Đã duyệt báo giá. Bước tiếp theo: tạo đơn và thanh toán tiền cọc.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể duyệt báo giá.');
    } finally {
      setPending(false);
    }
  }

  async function submitRevise(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const quantity = Number(revise.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      setError('Số lượng phải là số nguyên từ 1 đến 1000.');
      return;
    }
    const requestedCompletionDate = revise.requestedCompletionDate
      ? wishDateToIso(revise.requestedCompletionDate)
      : undefined;
    if (revise.requestedCompletionDate && !requestedCompletionDate) {
      setError('Ngày bạn mong nhận không hợp lệ.');
      return;
    }
    setPending(true);
    setError('');
    setNotice('');
    try {
      const body: CustomRequestInput = {
        productId: request.productId,
        quantity,
        description: revise.description.trim(),
        referenceImageUrl: revise.referenceImageUrl.trim() || undefined,
        requestedCompletionDate,
        quoteVersion: quote?.currentRevision,
      };
      const fresh = await storeRequest<CustomRequest>(`custom-orders/${request.id}`, body, 'PUT');
      onChanged(fresh);
      setReviseOpen(false);
      await load(true);
      setNotice('Đã gửi thay đổi. Báo giá cũ đã bị hủy; tiệm sẽ báo giá lại.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật yêu cầu.');
    } finally {
      setPending(false);
    }
  }

  async function cancelRequest() {
    if (pending || !active) return;
    if (
      !window.confirm(
        'Hủy yêu cầu này? Báo giá hiện tại cũng sẽ bị hủy và thao tác không thể hoàn tác.',
      )
    )
      return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      onChanged(
        await storeRequest<CustomRequest>(`custom-orders/${request.id}/cancel`, {}, 'POST'),
      );
      await load(true);
      setNotice('Đã hủy yêu cầu.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hủy yêu cầu.');
    } finally {
      setPending(false);
    }
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote || pending || !canCheckout) return;
    const name = receiver.name.trim();
    const phone = receiver.phone.trim();
    const address = receiver.address.trim();
    if (!name || !phone || !address) {
      setError('Hãy nhập tên người nhận, số điện thoại và địa chỉ giao hoa.');
      return;
    }
    const selectedProvince = provinces.find((area) => String(area.id) === provinceId);
    const selectedWard = wards.find((area) => String(area.id) === wardId);
    if (!selectedProvince || !selectedWard) {
      setError('Hãy chọn tỉnh/thành phố và phường/xã theo danh mục GHN trước khi tạo đơn.');
      return;
    }
    const fingerprint = JSON.stringify([
      request.id,
      quote.currentRevision,
      name,
      phone,
      address,
      selectedProvince.id,
      selectedWard.id,
    ]);
    if (!checkoutAttempt.current || checkoutAttempt.current.fingerprint !== fingerprint)
      checkoutAttempt.current = { fingerprint, key: crypto.randomUUID() };
    setPending(true);
    setError('');
    setNotice('');
    try {
      const body: CustomCheckoutInput = {
        shippingAddress: address,
        quoteVersion: quote.currentRevision,
        provinceId: selectedProvince.id,
        wardId: selectedWard.id,
        receiverName: name,
        receiverPhone: phone,
        note: 'Checkout custom order',
        idempotencyKey: checkoutAttempt.current.key,
      };
      const out = await storeRequest<{ orderCode: string; paymentStatus: string }>(
        `custom-orders/${request.id}/checkout`,
        body,
        'POST',
      );
      setCheckoutOpen(false);
      await refreshRequest();
      await load(true);
      setNotice(
        `Đã tạo đơn ${out.orderCode}. Đơn chưa thanh toán sẽ hết hạn sau 30 phút; hãy thanh toán tiền cọc.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tạo đơn từ báo giá.');
    } finally {
      setPending(false);
    }
  }

  async function pay(amount: number) {
    if (!balance || pending) return;
    if (!balance.canPay) {
      setPayError(
        'Đang có giao dịch chờ xử lý. Chưa thể tạo khoản thu mới; hãy cập nhật trạng thái thanh toán trước.',
      );
      return;
    }
    if (!Number.isInteger(amount) || amount < MIN_CHARGE || amount > MAX_CHARGE) {
      setPayError(
        `Số tiền thanh toán phải trong khoảng ${money(MIN_CHARGE)} – ${money(MAX_CHARGE)} theo giới hạn cổng sandbox.`,
      );
      return;
    }
    const fingerprint = `${balance.orderId}:${amount}`;
    if (!payAttempt.current || payAttempt.current.fingerprint !== fingerprint)
      payAttempt.current = { fingerprint, key: crypto.randomUUID() };
    setPending(true);
    setPayError('');
    try {
      const returnUrl = new URL('/thanh-toan/ket-qua', window.location.origin);
      returnUrl.searchParams.set('orderId', balance.orderId);
      returnUrl.searchParams.set('yeu-cau', request.id);
      const charge = await storeRequest<{ redirectUrl?: string }>(
        `gateway/orders/${balance.orderId}/charge`,
        {
          amount,
          returnUrl: returnUrl.toString(),
          idempotencyKey: payAttempt.current.key,
        },
        'POST',
      );
      const redirect = charge.redirectUrl ? new URL(charge.redirectUrl) : null;
      if (
        !redirect ||
        redirect.protocol !== 'https:' ||
        (redirect.hostname !== 'test-payment.momo.vn' &&
          redirect.hostname !== 'sandbox.vnpayment.vn')
      )
        throw new Error(
          'Cổng thanh toán sandbox chưa trả về đường dẫn kiểm thử hợp lệ. Kiểm tra trạng thái đơn trước khi thử lại.',
        );
      window.location.assign(redirect.toString());
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Không thể kết nối cổng thanh toán.');
    } finally {
      setPending(false);
    }
  }

  const stepIndex = customStepIndex(request.status);

  return (
    <section className="custom-panel" aria-labelledby="custom-panel-title">
      <header className="custom-panel-head">
        <div>
          <p className="eyebrow">YÊU CẦU ĐẶT RIÊNG · #{request.id.slice(0, 8)}</p>
          <h3 id="custom-panel-title">{request.productName || 'Hoa theo yêu cầu'}</h3>
          <p className="custom-panel-meta">
            Số lượng {request.quantity} · Gửi lúc {dateTime(request.createdAt)}
          </p>
        </div>
        <span className={`custom-chip custom-chip--${customStatusTone(request.status)}`}>
          {customStatusLabel(request.status)}
        </span>
      </header>

      <ol className="custom-steps" aria-label="Tiến trình yêu cầu">
        {CUSTOM_STEPS.map((label, index) => (
          <li
            key={label}
            className={`custom-step${stepIndex > index ? ' is-done' : ''}${
              stepIndex === index ? ' is-current' : ''
            }`}
            aria-current={stepIndex === index ? 'step' : undefined}
          >
            <span className="custom-step-index">{index + 1}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      {error && (
        <div className="form-status" role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className="form-status" role="status">
          <CheckCircle2 size={14} /> {notice}
        </div>
      )}

      <section className="custom-panel-section" aria-labelledby="custom-details-title">
        <h4 id="custom-details-title">Yêu cầu của bạn</h4>
        <dl className="custom-panel-details">
          <div>
            <dt>Ngày bạn mong nhận</dt>
            <dd>
              {request.requestedCompletionDate
                ? dateOnly(request.requestedCompletionDate)
                : 'Không đặt ngày cụ thể'}
            </dd>
          </div>
          <div>
            <dt>Mô tả</dt>
            <dd style={{ whiteSpace: 'pre-wrap' }}>{request.description || '—'}</dd>
          </div>
          {request.bouquet && (
            <div>
              <dt>Cấu hình bó hoa</dt>
              <dd>
                {request.bouquet.lines
                  .map(
                    (line) =>
                      `${line.name}${line.color ? ` · ${line.color}` : ''} × ${line.quantity}`,
                  )
                  .join(', ')}{' '}
                · {request.bouquet.wrapName}
              </dd>
            </div>
          )}
          <div>
            <dt>Ảnh tham khảo</dt>
            <dd>
              {referenceUrl ? (
                <a
                  className="text-link"
                  href={referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mở ảnh tham khảo
                </a>
              ) : (
                'Không có'
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="custom-panel-section" aria-labelledby="custom-quote-title">
        <h4 id="custom-quote-title">Báo giá hiện tại</h4>
        {loading && !quote ? (
          <p className="fine-print">Đang tải báo giá…</p>
        ) : !currentRevision ? (
          <p>Tiệm chưa phát hành báo giá. Bạn sẽ thấy báo giá ở đây khi tiệm gửi.</p>
        ) : (
          <>
            <p className="custom-panel-meta">
              Phiên bản {currentRevision.version} · {revisionLabel(currentRevision.status)}
            </p>
            {currentRevision.bouquet && <p>{bouquetSummary(currentRevision.bouquet)}</p>}
            <dl className="custom-money">
              <div>
                <dt>Tổng (đã gồm giao hàng)</dt>
                <dd>{moneyOrDash(currentRevision.totalAmount)}</dd>
              </div>
              <div>
                <dt>Tiền cọc</dt>
                <dd>{moneyOrDash(currentRevision.depositAmount)}</dd>
              </div>
              <div>
                <dt>Ngày hoàn thiện dự kiến</dt>
                <dd>{dateOnly(currentRevision.completionDate)}</dd>
              </div>
              <div>
                <dt>Hạn duyệt</dt>
                <dd>{dateTime(currentRevision.expiresAt)}</dd>
              </div>
            </dl>
            <p className="fine-print">Ghi chú của tiệm: {currentRevision.adminNote || '—'}</p>
            <p className="fine-print">
              Duyệt báo giá chưa phải thanh toán. Đơn chỉ được tạo khi bạn xác nhận người nhận và
              địa chỉ.
            </p>
          </>
        )}
        {quote && quote.revisions.length > 0 && (
          <details className="custom-history">
            <summary>
              <History size={14} /> Lịch sử báo giá ({quote.revisions.length} phiên bản)
            </summary>
            <ul>
              {quote.revisions.map((revision) => (
                <li key={revision.version}>
                  <strong>Phiên bản {revision.version}</strong> · {revisionLabel(revision.status)} ·
                  Tổng {moneyOrDash(revision.totalAmount)} · Cọc{' '}
                  {moneyOrDash(revision.depositAmount)} · Hoàn thiện{' '}
                  {dateOnly(revision.completionDate)} · Gửi {dateTime(revision.createdAt)}
                  {revision.adminNote ? <p>{revision.adminNote}</p> : null}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {active && (
        <section className="custom-panel-section" aria-labelledby="custom-actions-title">
          <h4 id="custom-actions-title">Bạn muốn làm gì tiếp?</h4>
          <div className="custom-actions">
            {lower(request.status) === 'quoted' && (
              <button
                type="button"
                className="button"
                disabled={pending || !canApprove}
                onClick={() => void approve()}
              >
                Duyệt báo giá này <ArrowUpRight size={18} />
              </button>
            )}
            {lower(request.status) === 'quoted' && expired && (
              <p className="fine-print">
                Báo giá đã hết hạn duyệt. Hãy gửi thay đổi để tiệm báo giá lại.
              </p>
            )}
            <button
              type="button"
              className="text-link"
              disabled={pending}
              aria-expanded={reviseOpen}
              onClick={() => setReviseOpen((open) => !open)}
            >
              {reviseOpen ? 'Đóng phần sửa yêu cầu' : 'Yêu cầu chỉnh sửa'}
            </button>
            <button
              type="button"
              className="text-link"
              disabled={pending}
              onClick={() => void cancelRequest()}
            >
              Hủy yêu cầu
            </button>
          </div>
          {reviseOpen && (
            <form className="custom-subform" onSubmit={submitRevise}>
              <p className="form-notice">Sửa yêu cầu sẽ hủy báo giá hiện tại; tiệm báo giá lại.</p>
              <div className="form-grid">
                <label className="field">
                  Số lượng *
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    step={1}
                    required
                    value={revise.quantity}
                    onChange={(e) => setRevise({ ...revise, quantity: e.target.value })}
                  />
                </label>
                <label className="field">
                  Ngày bạn mong nhận
                  <input
                    type="date"
                    value={revise.requestedCompletionDate}
                    onChange={(e) =>
                      setRevise({ ...revise, requestedCompletionDate: e.target.value })
                    }
                  />
                </label>
                <label className="field full">
                  Mô tả *
                  <textarea
                    required
                    maxLength={4000}
                    value={revise.description}
                    onChange={(e) => setRevise({ ...revise, description: e.target.value })}
                  />
                </label>
              </div>
              <button type="submit" className="button" disabled={pending}>
                Gửi thay đổi <ArrowUpRight size={18} />
              </button>
            </form>
          )}
          {canCheckout && (
            <div className="custom-subform">
              {!checkoutOpen ? (
                <button
                  type="button"
                  className="button"
                  disabled={pending}
                  onClick={() => setCheckoutOpen(true)}
                >
                  Tạo đơn từ báo giá đã duyệt <ArrowUpRight size={18} />
                </button>
              ) : (
                <form onSubmit={submitCheckout}>
                  <p className="form-notice">
                    Tạo đơn chưa thu tiền. Sau khi tạo, bạn thanh toán tiền cọc qua cổng sandbox;
                    đơn chưa thanh toán sẽ hết hạn sau 30 phút.
                  </p>
                  <div className="form-grid">
                    <label className="field">
                      Tên người nhận *
                      <input
                        required
                        autoComplete="shipping name"
                        maxLength={100}
                        value={receiver.name}
                        onChange={(e) => setReceiver({ ...receiver, name: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Số điện thoại người nhận *
                      <input
                        required
                        type="tel"
                        autoComplete="shipping tel"
                        pattern={'[+0-9 \\(\\)\\-]{9,20}'}
                        maxLength={20}
                        value={receiver.phone}
                        onChange={(e) => setReceiver({ ...receiver, phone: e.target.value })}
                      />
                    </label>
                    <label className="field full">
                      Số nhà, tên đường *
                      <textarea
                        required
                        maxLength={500}
                        autoComplete="shipping street-address"
                        placeholder="Số nhà, tên đường (phường/xã và tỉnh/thành phố chọn bên dưới)"
                        value={receiver.address}
                        onChange={(e) => setReceiver({ ...receiver, address: e.target.value })}
                      />
                    </label>
                    <label className="field">
                      Tỉnh/thành phố *
                      <select
                        required
                        value={provinceId}
                        disabled={provinces.length === 0}
                        onChange={(event) => {
                          setProvinceId(event.currentTarget.value);
                          setWardId('');
                          setWards([]);
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
                        required
                        value={wardId}
                        disabled={!provinceId || wardsLoading || wards.length === 0}
                        onChange={(event) => setWardId(event.currentTarget.value)}
                      >
                        <option value="">
                          {wardsLoading ? 'Đang tải phường…' : 'Chọn phường/xã'}
                        </option>
                        {wards.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    {locationError && (
                      <div className="field full form-status" role="alert">
                        <p>{locationError}</p>
                      </div>
                    )}
                  </div>
                  <button type="submit" className="button" disabled={pending}>
                    Tạo đơn <ArrowUpRight size={18} />
                  </button>
                </form>
              )}
            </div>
          )}
        </section>
      )}

      {(quote?.orderId || request.orderId) && (
        <section className="custom-panel-section" aria-labelledby="custom-payment-title">
          <h4 id="custom-payment-title">Thanh toán</h4>
          <p>
            Đơn{' '}
            <strong>{request.orderCode || (quote?.orderId ?? request.orderId)?.slice(0, 8)}</strong>{' '}
            đã được tạo.
            {balance && balance.paidAmount === 0 && lower(request.status) === 'checkedout'
              ? ' Đơn chưa thanh toán sẽ hết hạn sau 30 phút kể từ khi tạo.'
              : null}
          </p>
          {!balance ? (
            payError ? (
              <div className="form-status" role="alert">
                {payError}
              </div>
            ) : (
              <p className="fine-print">
                <Clock size={14} /> Đang đọc số dư thanh toán từ hệ thống…
              </p>
            )
          ) : (
            <>
              <dl className="custom-money">
                <div>
                  <dt>Tổng đơn</dt>
                  <dd>{moneyOrDash(balance.totalAmount)}</dd>
                </div>
                <div>
                  <dt>Đã ghi nhận</dt>
                  <dd>{moneyOrDash(balance.paidAmount)}</dd>
                </div>
                <div>
                  <dt>Đang chờ xử lý</dt>
                  <dd>{moneyOrDash(balance.pendingAmount)}</dd>
                </div>
                <div>
                  <dt>Còn lại</dt>
                  <dd>{moneyOrDash(balance.remainingAmount)}</dd>
                </div>
                {balance.remainingAmount > 0 && (
                  <div>
                    <dt>Khoản tối thiểu tiếp theo</dt>
                    <dd>{moneyOrDash(balance.minimumNextPayment)}</dd>
                  </div>
                )}
              </dl>
              {balance.canPay ? (
                <div className="custom-actions">
                  {balance.paidAmount <= 0 && balance.minimumNextPayment > 0 && (
                    <button
                      type="button"
                      className="button"
                      disabled={pending}
                      onClick={() => void pay(balance.minimumNextPayment)}
                    >
                      Thanh toán cọc · {money(balance.minimumNextPayment)}{' '}
                      <ArrowUpRight size={18} />
                    </button>
                  )}
                  {balance.paidAmount > 0 && balance.remainingAmount > 0 && (
                    <button
                      type="button"
                      className="button"
                      disabled={pending}
                      onClick={() => void pay(balance.remainingAmount)}
                    >
                      Thanh toán phần còn lại · {money(balance.remainingAmount)}{' '}
                      <ArrowUpRight size={18} />
                    </button>
                  )}
                </div>
              ) : balance.remainingAmount <= 0 ? (
                <p className="fine-print">Đã thanh toán đủ.</p>
              ) : (
                <p className="fine-print">
                  Đang có giao dịch chờ xử lý hoặc đơn không thể thu thêm. Chưa tạo khoản thu mới.
                </p>
              )}
              {payError && (
                <div className="form-status" role="alert">
                  {payError}
                </div>
              )}
              <p className="fine-print">
                Chỉ số dư do hệ thống ghi nhận mới xác nhận thanh toán; trang cổng thanh toán chỉ là
                nơi chuyển hướng.
              </p>
              <Link
                className="text-link"
                href={`/thanh-toan/ket-qua?orderId=${encodeURIComponent(
                  balance.orderId,
                )}&yeu-cau=${encodeURIComponent(request.id)}`}
              >
                Kiểm tra trạng thái thanh toán <ArrowUpRight size={16} />
              </Link>
            </>
          )}
        </section>
      )}

      <div className="custom-actions">
        <button
          type="button"
          className="text-link"
          disabled={pending || loading}
          onClick={() => void load()}
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Tải lại trạng thái
        </button>
      </div>
    </section>
  );
}
