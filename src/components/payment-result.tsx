'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, ArrowRight, RotateCcw, ShoppingBag, ShieldCheck } from 'lucide-react';
import { money } from '@/lib/catalog';
import { storeRequest } from '@/lib/browser-api';

type PaymentBalance = {
  orderId: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  remainingAmount: number;
  minimumNextPayment: number;
  canPay: boolean;
};
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function PaymentResult() {
  const search = useSearchParams();
  const orderId = search.get('orderId') ?? '';
  const responseCode = search.get('vnp_ResponseCode') ?? search.get('resultCode') ?? '';
  const bankCode = search.get('vnp_BankCode') ?? 'NCB';

  const [balance, setBalance] = useState<PaymentBalance | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  async function handleRetryPay() {
    if (!balance) return;
    setRetrying(true);
    setError('');
    try {
      const returnUrl = new URL('/thanh-toan/ket-qua', window.location.origin);
      returnUrl.searchParams.set('orderId', balance.orderId);
      const charge = await storeRequest<{ redirectUrl?: string }>(
        `gateway/orders/${balance.orderId}/charge`,
        {
          amount: balance.remainingAmount || balance.totalAmount,
          returnUrl: returnUrl.toString(),
          idempotencyKey: crypto.randomUUID(),
        },
        'POST',
      );
      if (charge.redirectUrl) {
        window.location.assign(charge.redirectUrl);
      }
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

  const confirmed = Boolean(
    (balance && balance.paidAmount > 0 && balance.remainingAmount <= 0) || responseCode === '00',
  );
  const canceled = responseCode === '24';
  const waiting = Boolean(
    balance && !confirmed && !canceled && (balance.pendingAmount > 0 || balance.remainingAmount > 0),
  );

  return (
    <section className="form-layout">
      <div
        className="form-status"
        role={confirmed ? 'status' : 'alert'}
        style={{
          borderLeft: confirmed
            ? '4px solid #16a34a'
            : canceled
              ? '4px solid #d97706'
              : '4px solid #2563eb',
        }}
      >
        <span className="eyebrow" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {confirmed ? (
            <>
              <ShieldCheck size={16} color="#16a34a" /> CỔNG VNPAY SANDBOX · ĐÃ XÁC NHẬN
            </>
          ) : canceled ? (
            <>
              <XCircle size={16} color="#d97706" /> CỔNG VNPAY SANDBOX · GIAO DỊCH ĐÃ HỦY
            </>
          ) : (
            <>
              <Clock size={16} color="#2563eb" /> CỔNG VNPAY SANDBOX · ĐANG CHỜ THANH TOÁN
            </>
          )}
        </span>

        {pending ? (
          <p>Đang đọc trạng thái giao dịch từ hệ thống…</p>
        ) : error ? (
          <p>{error}</p>
        ) : confirmed ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <CheckCircle2 size={32} color="#16a34a" />
              <h2 style={{ margin: 0, fontSize: '24px', color: '#15803d' }}>
                Thanh toán thành công!
              </h2>
            </div>
            <p style={{ marginTop: '8px', fontSize: '15px', color: '#334155' }}>
              Hệ thống Backend đã xác nhận giao dịch qua thẻ <strong>{bankCode}</strong>.
              {balance && (
                <> Đã ghi nhận thanh toán <strong>{money(balance.paidAmount || balance.totalAmount)}</strong>.</>
              )}
            </p>
            <p style={{ fontSize: '13.5px', color: '#64748b' }}>
              Đơn hàng của bạn đã chuyển sang trạng thái <strong>Đã thanh toán (Paid)</strong> và đang được xưởng chuẩn bị hoa.
            </p>
          </>
        ) : canceled ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <XCircle size={32} color="#d97706" />
              <h2 style={{ margin: 0, fontSize: '24px', color: '#b45309' }}>
                Giao dịch đã được hủy.
              </h2>
            </div>
            <p style={{ marginTop: '8px', fontSize: '15px', color: '#334155' }}>
              Khách hàng đã hủy yêu cầu thanh toán trên cổng VNPAY (Mã phản hồi: <strong>24</strong>).
            </p>
            <p style={{ fontSize: '13.5px', color: '#64748b' }}>
              Đơn hàng của bạn vẫn được lưu an toàn trong hệ thống ở trạng thái <strong>Chưa thanh toán (Unpaid)</strong>. Bạn có thể thanh toán lại bất cứ lúc nào.
            </p>
          </>
        ) : balance && waiting ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <Clock size={32} color="#2563eb" />
              <h2 style={{ margin: 0, fontSize: '24px', color: '#1d4ed8' }}>
                Đơn hàng đang chờ thanh toán.
              </h2>
            </div>
            <p style={{ marginTop: '8px', fontSize: '15px', color: '#334155' }}>
              Đã ghi nhận {money(balance.paidAmount)}; còn lại <strong>{money(balance.remainingAmount)}</strong>.
              {balance.pendingAmount > 0 ? ` Có ${money(balance.pendingAmount)} đang chờ xử lý.` : ''}
            </p>
            <p style={{ fontSize: '13.5px', color: '#64748b' }}>
              Nếu bạn vừa thực hiện thao tác ở cổng thanh toán, vui lòng bấm &ldquo;Cập nhật trạng thái&rdquo; bên dưới để đối chiếu kết quả mới nhất.
            </p>
          </>
        ) : (
          <p>Không tìm thấy thông tin trạng thái thanh toán.</p>
        )}

        {balance && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '13.5px',
            }}
          >
            Mã đơn: <strong style={{ fontFamily: 'monospace' }}>{balance.orderId}</strong> · Tổng tiền:{' '}
            <strong style={{ color: '#0f172a' }}>{money(balance.totalAmount)}</strong>
          </div>
        )}

        {error && <p>Đăng nhập lại nếu phiên tài khoản đã hết hạn, rồi mở lại liên kết này.</p>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
          {(!confirmed || canceled) && balance && balance.remainingAmount > 0 && (
            <button
              type="button"
              className="button"
              style={{
                backgroundColor: '#005ba9',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
              disabled={retrying}
              onClick={() => void handleRetryPay()}
            >
              <RotateCcw size={16} /> {retrying ? 'Đang chuyển sang VNPAY…' : 'Thử thanh toán lại ngay'}
            </button>
          )}

          <button
            type="button"
            className="button"
            style={{ backgroundColor: confirmed ? '#005ba9' : undefined }}
            disabled={pending || !GUID.test(orderId)}
            onClick={() => {
              setPending(true);
              setRefreshCount((n) => n + 1);
            }}
          >
            Cập nhật trạng thái
          </button>

          <Link href="/tra-cuu" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Xem đơn trong lịch sử <ArrowRight size={15} />
          </Link>

          <Link href="/cua-tiem" className="text-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <ShoppingBag size={15} /> Tiếp tục chọn hoa
          </Link>
        </div>
      </div>
    </section>
  );
}
