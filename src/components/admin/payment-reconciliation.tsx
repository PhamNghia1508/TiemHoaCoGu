'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminPaths, storeRequest } from '@/lib/admin-store';

type ReconciliationItem = {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  reconciliationStatus: string;
  transactionCode: string;
  evidenceReference: string;
};
type QueryResult = {
  outcome: 'paid' | 'not-charged' | 'authorized' | 'pending' | 'unknown';
  resultCode: number;
  providerOrderId: string;
  requestId: string;
  amount: number;
  transactionCode: string;
  message: string;
  responseTime: number;
};
const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Không thể đối soát MoMo sandbox.';
const queue = () => storeRequest<ReconciliationItem[]>(adminPaths.gatewayReconciliation);
const query = (id: string) =>
  storeRequest<QueryResult>(`${adminPaths.gatewayReconciliation}/${id}/query`, {}, 'POST');

export default function PaymentReconciliation() {
  const [items, setItems] = useState<ReconciliationItem[] | null>(null);
  const [results, setResults] = useState<Record<string, QueryResult>>({});
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  const refresh = useCallback(() => setRefreshCount((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    queue()
      .then((value) => {
        if (active) {
          setItems(value);
          setError('');
        }
      })
      .catch((reason: unknown) => {
        if (active) setError(errorText(reason));
      });
    return () => {
      active = false;
    };
  }, [refreshCount]);

  async function queryPayment(item: ReconciliationItem) {
    if (busyId) return;
    setBusyId(item.id);
    setError('');
    setNotice('');
    try {
      const result = await query(item.id);
      setResults((old) => ({ ...old, [item.id]: result }));
      setNotice(`MoMo sandbox trả mã ${result.resultCode}: ${result.outcome}.`);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusyId('');
    }
  }

  async function recordResult(item: ReconciliationItem) {
    const result = results[item.id];
    if (!result || !['paid', 'not-charged'].includes(result.outcome)) return;
    if (result.outcome === 'paid' && !/^\d+$/.test(result.transactionCode)) {
      setError('MoMo không trả transId hợp lệ; không ghi sổ.');
      return;
    }
    const choice =
      result.outcome === 'paid' ? 'ghi nhận khoản đã thu' : 'đánh dấu không bị thu tiền';
    if (
      !window.confirm(
        `Xác nhận ${choice}? Backend sẽ truy vấn MoMo sandbox lại ngay trước khi ghi sổ; kết quả mới phải khớp lựa chọn này. Nếu đơn đã hủy/hết hạn, cần tiếp tục xử lý hoàn tiền riêng.`,
      )
    )
      return;
    setBusyId(item.id);
    setError('');
    setNotice('');
    try {
      await storeRequest(
        `${adminPaths.gatewayReconciliation}/${item.id}`,
        { outcome: result.outcome },
        'POST',
      );
      setNotice(
        result.outcome === 'paid'
          ? 'Đã ghi nhận khoản thu sau khi backend xác minh lại với MoMo sandbox.'
          : 'Đã ghi nhận chưa thu tiền sau khi backend xác minh lại với MoMo sandbox; đơn có thể nhận một lần thanh toán mới nếu trạng thái đơn cho phép.',
      );
      setResults((old) => {
        const next = { ...old };
        delete next[item.id];
        return next;
      });
      refresh();
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusyId('');
    }
  }

  return (
    <section className="admin-card" aria-labelledby="payment-reconciliation-heading">
      <div className="admin-section-heading">
        <div>
          <h2 id="payment-reconciliation-heading">Thanh toán MoMo sandbox cần đối soát</h2>
          <p className="admin-muted">
            Chỉ truy vấn giao dịch đã lưu; không gửi lại yêu cầu thu tiền. Khi Admin xác nhận,
            backend truy vấn MoMo sandbox lần nữa và chỉ ghi sổ nếu kết quả mới khớp.
          </p>
        </div>
        <button
          type="button"
          className="button button-outline"
          onClick={refresh}
          disabled={Boolean(busyId)}
        >
          Làm mới
        </button>
      </div>
      <p className="admin-notice" role="note">
        Mã 0: thanh toán thành công; các mã cuối cùng được MoMo xác nhận thất bại có thể đánh dấu
        chưa thu. Mã đang xử lý, mã 9000 (ủy quyền) hoặc kết quả không rõ không được tự ghi nhận.
        Không dùng màn này với giao dịch production.
      </p>
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {!items ? (
        <p role="status">Đang tải hàng đợi thanh toán…</p>
      ) : items.length === 0 ? (
        <p role="status">Không có giao dịch đang chờ đối soát.</p>
      ) : (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Intent / đơn</th>
                <th>Số tiền</th>
                <th>Trạng thái nội bộ</th>
                <th>Tra cứu MoMo</th>
                <th>Ghi sổ</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const result = results[item.id];
                const finalOutcome = result && ['paid', 'not-charged'].includes(result.outcome);
                return (
                  <tr key={item.id}>
                    <td>
                      <code>{item.id}</code>
                      <small>Đơn: {item.orderId}</small>
                    </td>
                    <td>{money(item.amount)}</td>
                    <td>
                      {item.status}
                      <small>{item.reconciliationStatus}</small>
                    </td>
                    <td>
                      {result ? (
                        <>
                          <strong>
                            {result.outcome} · mã {result.resultCode}
                          </strong>
                          <small>MoMo order: {result.providerOrderId}</small>
                          <small>
                            {result.transactionCode
                              ? `transId: ${result.transactionCode}`
                              : result.message}
                          </small>
                          <small>Query ID: {result.requestId}</small>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={Boolean(busyId)}
                          onClick={() => void queryPayment(item)}
                        >
                          {busyId === item.id ? 'Đang truy vấn…' : 'Truy vấn MoMo sandbox'}
                        </button>
                      )}
                    </td>
                    <td>
                      {result &&
                        (finalOutcome ? (
                          <button
                            type="button"
                            disabled={Boolean(busyId)}
                            onClick={() => void recordResult(item)}
                          >
                            {result.outcome === 'paid' ? 'Ghi nhận đã thu' : 'Ghi nhận chưa thu'}
                          </button>
                        ) : (
                          <small>Chưa đủ căn cứ ghi sổ. Không retry.</small>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
