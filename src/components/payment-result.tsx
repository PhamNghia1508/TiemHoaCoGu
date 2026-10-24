'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
  const [balance, setBalance] = useState<PaymentBalance | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);

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

  const confirmed = Boolean(balance && balance.paidAmount > 0 && balance.remainingAmount <= 0);
  const waiting = Boolean(
    balance && !confirmed && (balance.pendingAmount > 0 || balance.remainingAmount > 0),
  );

  return (
    <section className="form-layout">
      <div className="form-status" role={confirmed ? 'status' : 'alert'}>
        <span className="eyebrow">MOMO SANDBOX · TRẠNG THÁI TỪ BACKEND</span>
        {pending ? (
          <p>Đang đọc trạng thái giao dịch từ hệ thống…</p>
        ) : error ? (
          <p>{error}</p>
        ) : balance && confirmed ? (
          <>
            <h2>Backend đã ghi nhận thanh toán.</h2>
            <p>
              Đã thanh toán {money(balance.paidAmount)} trên tổng {money(balance.totalAmount)}.
            </p>
          </>
        ) : balance && waiting ? (
          <>
            <h2>Chưa có xác nhận thanh toán hoàn tất.</h2>
            <p>
              Đã ghi nhận {money(balance.paidAmount)}; còn lại {money(balance.remainingAmount)}.
              {balance.pendingAmount > 0
                ? ` Có ${money(balance.pendingAmount)} đang chờ xử lý.`
                : ''}
            </p>
            <p>
              Nếu vừa hoàn tất ở MoMo, hãy cập nhật trạng thái sau ít phút. Đừng tạo đơn mới hoặc
              thanh toán lại khi chưa đối chiếu.
            </p>
          </>
        ) : (
          <p>Không tìm thấy thông tin trạng thái thanh toán.</p>
        )}
        {balance && (
          <p>
            Mã đơn: <strong>{balance.orderId}</strong> · Tổng: {money(balance.totalAmount)}
          </p>
        )}
        {error && <p>Đăng nhập lại nếu phiên tài khoản đã hết hạn, rồi mở lại liên kết này.</p>}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
          <button
            type="button"
            className="button"
            disabled={pending || !GUID.test(orderId)}
            onClick={() => {
              setPending(true);
              setRefreshCount((n) => n + 1);
            }}
          >
            Cập nhật trạng thái
          </button>
          <Link href="/tra-cuu" className="text-link">
            Mở lịch sử đơn
          </Link>
        </div>
      </div>
    </section>
  );
}
