'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { adminPaths, storeRequest } from '@/lib/admin-store';

type UnknownNotification = {
  id: string;
  eventType: string;
  channel: 'Email' | 'Sms';
  status: 'Unknown';
  attempts: number;
  createdAtUtc: string;
};

type NotificationPage = {
  items: UnknownNotification[];
  total: number;
  page: number;
  pageSize: number;
};

type Outcome = 'accepted' | 'not-accepted';

const notificationQueue = (page: number) =>
  storeRequest<NotificationPage>(`${adminPaths.notifications}?page=${page}&pageSize=50`);

const dateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Không thể tải hàng đợi thông báo';

export default function NotificationReconciliation() {
  const [data, setData] = useState<NotificationPage | null>(null);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(() => setRefreshKey((current) => current + 1), []);

  useEffect(() => {
    let active = true;
    notificationQueue(page)
      .then((result) => {
        if (active) {
          setData(result);
          setError('');
        }
      })
      .catch((e: unknown) => {
        if (active) setError(errorText(e));
      });
    return () => {
      active = false;
    };
  }, [page, refreshKey]);

  async function reconcile(event: FormEvent, item: UnknownNotification) {
    event.preventDefault();
    if (busy) return;
    const outcome = outcomes[item.id];
    const evidenceReference = (evidence[item.id] ?? '').trim();
    if (!outcome) {
      setError('Chọn kết quả provider đã xác minh trước khi ghi nhận.');
      return;
    }
    if (evidenceReference.length < 5) {
      setError('Nhập mã bằng chứng tra cứu từ provider (ít nhất 5 ký tự).');
      return;
    }
    const confirmation =
      outcome === 'accepted'
        ? 'Chỉ ghi nhận provider đã chấp nhận/gửi; thao tác này không gửi lại. Bạn đã kiểm tra provider?'
        : 'Xác nhận provider chắc chắn CHƯA tiếp nhận bản tin? Hệ thống sẽ xếp hàng gửi lại nếu kênh hiện tại đang bật.';
    if (!window.confirm(confirmation)) return;

    setBusy(true);
    setError('');
    setNotice('');
    try {
      await storeRequest(
        `${adminPaths.notifications}/${item.id}/reconcile`,
        { outcome, evidenceReference },
        'POST',
      );
      setNotice(
        outcome === 'accepted'
          ? 'Đã ghi nhận provider chấp nhận bản tin; hệ thống sẽ không gửi lại bản tin này. Điều này không khẳng định người nhận đã đọc email/SMS.'
          : 'Đã xác nhận provider chưa nhận; bản tin được xếp hàng thử lại có kiểm soát.',
      );
      setEvidence((old) => ({ ...old, [item.id]: '' }));
      if (data && data.page > 1 && data.items.length === 1) {
        setData(null);
        setPage(data.page - 1);
      } else {
        refresh();
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card" aria-labelledby="notification-reconciliation-heading">
      <div className="admin-section-heading">
        <div>
          <h2 id="notification-reconciliation-heading">Đối soát thông báo chưa rõ kết quả</h2>
          <p className="admin-muted">
            Chỉ xem mã bản tin, loại sự kiện và kênh; không hiển thị nội dung hoặc địa chỉ nhận.
          </p>
        </div>
        <button type="button" className="button button-outline" onClick={refresh} disabled={busy}>
          Làm mới
        </button>
      </div>

      <p className="admin-notice" role="note">
        Tra cứu mã bản tin trong provider trước khi chọn kết quả. Chỉ chọn “Chưa tiếp nhận” khi có
        bằng chứng provider chưa nhận; thao tác đó sẽ xếp hàng thử lại. Provider không hỗ trợ
        idempotency vẫn có thể gửi trùng nếu đối soát sai. Không nhập PII vào mã bằng chứng.
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
      {!data ? (
        <p role="status">Đang tải bản tin cần đối soát…</p>
      ) : data.items.length === 0 ? (
        <p role="status">Hiện không có bản tin nào ở trạng thái Unknown.</p>
      ) : (
        <>
          <p className="admin-muted">
            {data.total} bản tin cần tra cứu · trang {data.page}/
            {Math.max(1, Math.ceil(data.total / data.pageSize))}.
          </p>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Mã bản tin</th>
                  <th>Sự kiện / kênh</th>
                  <th>Thời điểm</th>
                  <th>Đã thử</th>
                  <th>Kết quả đối soát</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item) => {
                  const outcome = outcomes[item.id] ?? '';
                  return (
                    <tr key={item.id}>
                      <td>
                        <code>{item.id}</code>
                        <small>Tra cứu đúng ID này trong provider.</small>
                      </td>
                      <td>
                        {item.eventType}
                        <br />
                        <small>
                          {item.channel === 'Sms' ? 'SMS' : 'Email'} · {item.status}
                        </small>
                      </td>
                      <td>{dateTime(item.createdAtUtc)}</td>
                      <td>{item.attempts}</td>
                      <td>
                        <form
                          className="admin-form"
                          onSubmit={(event) => void reconcile(event, item)}
                        >
                          <label className="admin-field">
                            <span>Kết quả đã xác minh</span>
                            <select
                              value={outcome}
                              onChange={(event) =>
                                setOutcomes((old) => ({
                                  ...old,
                                  [item.id]: event.target.value as Outcome,
                                }))
                              }
                              disabled={busy}
                              required
                            >
                              <option value="" disabled>
                                Chọn sau khi tra cứu provider
                              </option>
                              <option value="accepted">
                                Provider đã chấp nhận/gửi (không gửi lại)
                              </option>
                              <option value="not-accepted">
                                Provider xác nhận chưa nhận (xếp hàng gửi lại)
                              </option>
                            </select>
                          </label>
                          <label className="admin-field">
                            <span>Mã bằng chứng provider / ticket</span>
                            <input
                              required
                              minLength={5}
                              maxLength={120}
                              value={evidence[item.id] ?? ''}
                              onChange={(event) =>
                                setEvidence((old) => ({ ...old, [item.id]: event.target.value }))
                              }
                              disabled={busy}
                              autoComplete="off"
                            />
                          </label>
                          <button
                            type="submit"
                            disabled={
                              busy || !outcome || (evidence[item.id] ?? '').trim().length < 5
                            }
                          >
                            Ghi nhận kết quả
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {data.total > data.pageSize && (
            <nav className="admin-pagination" aria-label="Trang thông báo Unknown">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setData(null);
                  setPage((current) => Math.max(1, current - 1));
                }}
                disabled={busy || data.page <= 1}
              >
                Trước
              </button>
              <span>
                Trang {data.page} / {Math.ceil(data.total / data.pageSize)}
              </span>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setData(null);
                  setPage((current) => current + 1);
                }}
                disabled={busy || data.page >= Math.ceil(data.total / data.pageSize)}
              >
                Sau
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
