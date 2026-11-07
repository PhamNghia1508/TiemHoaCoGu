'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw, ShoppingBag } from 'lucide-react';
import { money } from '@/lib/catalog';
import { storeRequest } from '@/lib/browser-api';
import type { PaymentBalance } from '@/lib/api/client';

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MIN_CHARGE = 1_000;
const MAX_CHARGE = 50_000_000;

export default function PaymentResult() {
  const search = useSearchParams();
  const orderId = search.get('orderId') ?? '';
  const requestId = search.get('yeu-cau') ?? '';
  const responseCode = search.get('vnp_ResponseCode') ?? search.get('resultCode') ?? '';

  const [balance, setBalance] = useState<PaymentBalance | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const retryAttempt = useRef<{ fingerprint: string; key: string } | null>(null);

  async function handleRetryPay() {
    if (!balance || retrying || !balance.canPay) return;
    const amount = balance.minimumNextPayment;
    if (!Number.isInteger(amount) || amount < MIN_CHARGE || amount > MAX_CHARGE) {
      setError(
        `Khoản thanh toán tối thiểu phải trong khoảng ${money(MIN_CHARGE)} – ${money(MAX_CHARGE)} theo giới hạn cổng sandbox.`,
      );
      return;
    }
    setRetrying(true);
    setError('');
    try {
      const returnUrl = new URL('/thanh-toan/ket-qua', window.location.origin);
      returnUrl.searchParams.set('orderId', balance.orderId);
      if (GUID.test(requestId)) returnUrl.searchParams.set('yeu-cau', requestId);
      const fingerprint = `${balance.orderId}:${amount}`;
      if (!retryAttempt.current || retryAttempt.current.fingerprint !== fingerprint)
        retryAttempt.current = { fingerprint, key: crypto.randomUUID() };
      const charge = await storeRequest<{ redirectUrl?: string }>(
        `gateway/orders/${balance.orderId}/charge`,
        {
          amount,
          returnUrl: returnUrl.toString(),
          idempotencyKey: retryAttempt.current.key,
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
          'Cổng thanh toán sandbox chưa trả về đường dẫn kiểm thử hợp lệ. Kiểm tra lại trạng thái đơn trước khi thử tiếp.',
        );
      window.location.assign(redirect.toString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể chuyển sang cổng thanh toán.');
      setRetrying(false);
    }
  }

  useEffect(() => {
    let active = true;
    if (!GUID.test(orderId)) {
      Promise.resolve().then(() => {
        if (active) {
          setError('Thiếu hoặc sai mã đơn; không thể đối chiếu trạng thái thanh toán.');
          setPending(false);
        }
      });
      return () => {
        active = false;
      };
    }
    Promise.resolve().then(() => {
      if (active) setPending(true);
    });
    storeRequest<PaymentBalance>(`gateway/orders/${orderId}/balance`)
      .then((result) => {
        if (active) {
          setBalance(result);
          setError('');
        }
      })
      .catch((err: unknown) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Không thể đọc trạng thái thanh toán.');
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, [orderId, refreshCount]);

  // The BE balance is the only source of truth: a provider return code can never mark a payment paid.
  const confirmed = Boolean(balance && balance.paidAmount > 0 && balance.remainingAmount <= 0);
  const partial = Boolean(balance && balance.paidAmount > 0 && balance.remainingAmount > 0);
  const waiting = Boolean(balance && balance.pendingAmount > 0);
  const providerHint =
    responseCode && responseCode !== '00' ? 'Cổng thanh toán báo giao dịch chưa hoàn tất.' : '';
  const stateLabel = error
    ? 'KHÔNG ĐỌC ĐƯỢC TRẠNG THÁI'
    : pending && !balance
      ? 'ĐANG ĐỐI CHIẾU'
      : confirmed
        ? 'ĐÃ THANH TOÁN ĐỦ'
        : partial
          ? 'ĐÃ GHI NHẬN MỘT PHẦN'
          : 'CHƯA GHI NHẬN THANH TOÁN';

  return (
    <section className="form-layout">
      <div
        className="form-status"
        role={error ? 'alert' : 'status'}
        style={{
          borderLeft: confirmed
            ? '4px solid var(--olive)'
            : partial
              ? '4px solid var(--accent)'
              : '4px solid var(--line)',
        }}
      >
        <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {confirmed ? (
            <>
              <CheckCircle2 size={16} color="var(--olive)" /> CỔNG THANH TOÁN SANDBOX · {stateLabel}
            </>
          ) : partial ? (
            <>
              <Clock size={16} color="var(--accent)" /> CỔNG THANH TOÁN SANDBOX · {stateLabel}
            </>
          ) : (
            <>
              <XCircle size={16} color="var(--muted)" /> CỔNG THANH TOÁN SANDBOX · {stateLabel}
            </>
          )}
        </span>

        {pending ? (
          <p>Đang đọc trạng thái giao dịch từ hệ thống…</p>
        ) : error ? (
          <p>{error}</p>
        ) : confirmed && balance ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <CheckCircle2 size={32} color="var(--olive)" />
              <h2 style={{ margin: 0, fontSize: '24px' }}>Đã thanh toán đủ.</h2>
            </div>
            <p style={{ marginTop: '8px', fontSize: '15px' }}>
              Hệ thống đã ghi nhận <strong>{money(balance.paidAmount)}</strong> cho đơn này; không
              còn khoản nào phải trả.
            </p>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
              Trạng thái lấy từ số dư do hệ thống ghi sổ, không phải từ tham số trên đường dẫn cổng
              thanh toán.
            </p>
          </>
        ) : partial && balance ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <Clock size={32} color="var(--accent)" />
              <h2 style={{ margin: 0, fontSize: '24px' }}>
                Đã ghi nhận {money(balance.paidAmount)}, còn lại {money(balance.remainingAmount)}.
              </h2>
            </div>
            <p style={{ marginTop: '8px', fontSize: '15px' }}>
              Khoản tối thiểu cho lần thanh toán tiếp theo là{' '}
              <strong>{money(balance.minimumNextPayment)}</strong>.
              {waiting ? ` Có ${money(balance.pendingAmount)} đang chờ xử lý.` : ''}
            </p>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
              Nếu bạn vừa thao tác ở cổng thanh toán, hãy bấm &ldquo;Cập nhật trạng thái&rdquo; để
              đối chiếu kết quả mới nhất.
            </p>
          </>
        ) : balance ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <XCircle size={32} color="var(--muted)" />
              <h2 style={{ margin: 0, fontSize: '24px' }}>Chưa ghi nhận thanh toán.</h2>
            </div>
            <p style={{ marginTop: '8px', fontSize: '15px' }}>
              Hệ thống chưa ghi nhận khoản nào cho đơn này; còn lại{' '}
              <strong>{money(balance.remainingAmount)}</strong>.
              {waiting ? ` Có ${money(balance.pendingAmount)} đang chờ xử lý.` : ''}
            </p>
            <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
              Đơn chưa thanh toán sẽ hết hạn sau 30 phút kể từ khi tạo. Bạn có thể mở lại yêu cầu để
              thanh toán khi cổng cho phép.
            </p>
          </>
        ) : (
          <p>Không tìm thấy thông tin trạng thái thanh toán.</p>
        )}

        {providerHint && !pending && !error && !confirmed && (
          <p className="fine-print" role="status">
            {providerHint}
          </p>
        )}

        {balance && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: 'var(--paper)',
              borderRadius: '12px',
              border: '1px solid var(--line)',
              fontSize: '13.5px',
            }}
          >
            Mã đơn: <strong style={{ fontFamily: 'monospace' }}>{balance.orderId}</strong> · Tổng
            tiền: <strong>{money(balance.totalAmount)}</strong> · Đã ghi nhận:{' '}
            <strong>{money(balance.paidAmount)}</strong> · Còn lại:{' '}
            <strong>{money(balance.remainingAmount)}</strong>
          </div>
        )}

        {error && <p>Đăng nhập lại nếu phiên tài khoản đã hết hạn, rồi mở lại liên kết này.</p>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
          {balance?.canPay && (
            <button
              type="button"
              className="button"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              disabled={retrying}
              onClick={() => void handleRetryPay()}
            >
              <RotateCcw size={16} />{' '}
              {retrying
                ? 'Đang chuyển sang cổng thanh toán…'
                : `Thanh toán ${money(balance.minimumNextPayment)}`}
            </button>
          )}

          <button
            type="button"
            className="button button-outline"
            disabled={pending || !GUID.test(orderId)}
            onClick={() => {
              setPending(true);
              setRefreshCount((n) => n + 1);
            }}
          >
            Cập nhật trạng thái
          </button>

          {GUID.test(requestId) ? (
            <Link
              href={`/tra-cuu?yeu-cau=${encodeURIComponent(requestId)}`}
              className="text-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Quay lại yêu cầu đặt riêng <ArrowRight size={15} />
            </Link>
          ) : (
            <Link
              href="/tra-cuu"
              className="text-link"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Xem đơn trong lịch sử <ArrowRight size={15} />
            </Link>
          )}

          <Link
            href="/cua-tiem"
            className="text-link"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <ShoppingBag size={15} /> Tiếp tục chọn hoa
          </Link>
        </div>
      </div>
    </section>
  );
}
