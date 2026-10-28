'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminPaths, storeRequest } from '@/lib/admin-store';
import {
  AdminDialog,
  AdminEmpty,
  AdminLoading,
  StatusBadge,
  useAdminConfirm,
} from '@/components/admin/primitives';

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

export default function PaymentReconciliation({ readOnly = false }: { readOnly?: boolean }) {
  const [items, setItems] = useState<ReconciliationItem[] | null>(null);
  const [results, setResults] = useState<Record<string, QueryResult>>({});
  const [selected, setSelected] = useState<ReconciliationItem | null>(null);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);
  const confirm = useAdminConfirm();

  const refresh = useCallback(() => {
    if (busyId) return;
    setError('');
    setItems(null);
    setRefreshCount((value) => value + 1);
  }, [busyId]);
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
    if (readOnly || busyId) return;
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
    if (readOnly || busyId) return;
    const result = results[item.id];
    if (!result || !['paid', 'not-charged'].includes(result.outcome)) return;
    if (result.outcome === 'paid' && !/^\d+$/.test(result.transactionCode)) {
      setError('MoMo không trả transId hợp lệ; không ghi sổ.');
      return;
    }
    const choice =
      result.outcome === 'paid' ? 'ghi nhận khoản đã thu' : 'đánh dấu không bị thu tiền';
    const confirmed = await confirm({
      title: 'Xác nhận ghi sổ thanh toán sandbox',
      description: `Xác nhận ${choice}? Backend sẽ truy vấn MoMo sandbox lại ngay trước khi ghi sổ; kết quả mới phải khớp lựa chọn này. Nếu đơn đã hủy/hết hạn, cần tiếp tục xử lý hoàn tiền riêng.`,
      confirmLabel: result.outcome === 'paid' ? 'Ghi nhận đã thu' : 'Ghi nhận chưa thu',
    });
    if (!confirmed || readOnly || busyId) return;
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
      setSelected(null);
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
      {readOnly && (
        <p className="admin-notice" role="note">
          Chế độ chỉ đọc: có thể xem hàng đợi và chi tiết, nhưng không thực hiện POST/PATCH, kể cả
          truy vấn MoMo sandbox, và không ghi sổ.
        </p>
      )}
      <p className="admin-notice" role="note">
        Đây là màn hình sandbox; không dùng với giao dịch production. Chỉ query kết quả cuối cùng
        rồi record khi backend recheck khớp. Pending, authorized hoặc unknown không được ghi sổ và
        không retry charge.
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
        <AdminLoading label="Đang tải hàng đợi thanh toán…" />
      ) : items.length === 0 ? (
        <AdminEmpty
          title="Không có giao dịch đang chờ đối soát."
          description="Hàng đợi chỉ dành cho các giao dịch cần kiểm tra kết quả sandbox."
        />
      ) : (
        <div className="admin-record-list" aria-label="Hàng đợi thanh toán sandbox">
          {items.map((item) => {
            const result = results[item.id];
            return (
              <article className="admin-record" key={item.id}>
                <div>
                  <strong>
                    <code>{item.id}</code>
                  </strong>
                  <div className="admin-muted">
                    Đơn: {item.orderId} · {money(item.amount)}
                  </div>
                  <div className="admin-muted">
                    {item.status} · {item.reconciliationStatus}
                  </div>
                </div>
                <div className="admin-actions">
                  {result && <StatusBadge status={result.outcome} />}
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => {
                      setError('');
                      setSelected(item);
                    }}
                    disabled={Boolean(busyId)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
      <AdminDialog
        open={!!selected}
        onClose={() => {
          if (!busyId) setSelected(null);
        }}
        title="Chi tiết thanh toán MoMo sandbox"
        description="Không có thao tác charge/retry; các kết quả chưa cuối cùng không được ghi sổ."
        wide
      >
        {selected &&
          (() => {
            const result = results[selected.id];
            const finalOutcome = result && ['paid', 'not-charged'].includes(result.outcome);
            return (
              <div className="admin-detail">
                <div className="admin-form-section">
                  <h3 className="admin-section-heading">Giao dịch</h3>
                  <div className="admin-form-grid">
                    <div className="admin-field">
                      <span>Intent</span>
                      <code>{selected.id}</code>
                    </div>
                    <div className="admin-field">
                      <span>Đơn hàng</span>
                      <strong>{selected.orderId}</strong>
                    </div>
                    <div className="admin-field">
                      <span>Số tiền</span>
                      <strong>{money(selected.amount)}</strong>
                    </div>
                    <div className="admin-field">
                      <span>Trạng thái nội bộ</span>
                      <strong>{selected.status}</strong>
                    </div>
                    <div className="admin-field">
                      <span>Đối soát nội bộ</span>
                      <strong>{selected.reconciliationStatus}</strong>
                    </div>
                  </div>
                </div>
                {error && (
                  <p className="admin-error" role="alert">
                    {error}
                  </p>
                )}
                {result ? (
                  <div className="admin-form-section">
                    <h3 className="admin-section-heading">Kết quả query sandbox</h3>
                    <div className="admin-detail">
                      <p>
                        <StatusBadge status={result.outcome} /> · mã {result.resultCode}
                      </p>
                      <p className="admin-muted">MoMo order: {result.providerOrderId}</p>
                      <p className="admin-muted">
                        {result.transactionCode
                          ? `transId: ${result.transactionCode}`
                          : result.message}
                      </p>
                      <p className="admin-muted">Query ID: {result.requestId}</p>
                    </div>
                    {!finalOutcome && (
                      <p className="admin-helper">
                        Chưa đủ căn cứ ghi sổ. Không retry charge; hãy chờ kết quả cuối cùng theo
                        quy trình backend.
                      </p>
                    )}
                  </div>
                ) : readOnly ? (
                  <p className="admin-muted">
                    Chế độ chỉ đọc: query là POST nên đã bị vô hiệu hóa; không có request ghi được
                    gửi.
                  </p>
                ) : (
                  <div className="admin-form-actions">
                    <button
                      type="button"
                      className="button"
                      onClick={() => void queryPayment(selected)}
                      disabled={Boolean(busyId)}
                    >
                      {busyId === selected.id ? 'Đang truy vấn…' : 'Truy vấn MoMo sandbox'}
                    </button>
                  </div>
                )}
                <div className="admin-form-actions">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => setSelected(null)}
                    disabled={Boolean(busyId)}
                  >
                    Đóng
                  </button>
                  {!readOnly && result && finalOutcome && (
                    <button
                      type="button"
                      className="button"
                      onClick={() => void recordResult(selected)}
                      disabled={Boolean(busyId)}
                    >
                      {result.outcome === 'paid' ? 'Ghi nhận đã thu' : 'Ghi nhận chưa thu'}
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
      </AdminDialog>
    </section>
  );
}
