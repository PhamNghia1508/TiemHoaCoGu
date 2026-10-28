'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { adminPaths, storeRequest } from '@/lib/admin-store';
import {
  AdminDialog,
  AdminEmpty,
  AdminLoading,
  AdminPagination,
  StatusBadge,
  useAdminConfirm,
} from '@/components/admin/primitives';

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

export default function NotificationReconciliation({ readOnly = false }: { readOnly?: boolean }) {
  const [data, setData] = useState<NotificationPage | null>(null);
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<UnknownNotification | null>(null);
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const confirm = useAdminConfirm();

  const refresh = useCallback(() => {
    if (busy) return;
    setError('');
    setData(null);
    setRefreshKey((current) => current + 1);
  }, [busy]);

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
    if (readOnly || busy) return;
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
    const confirmed = await confirm({
      title: 'Xác nhận ghi nhận đối soát thông báo',
      description:
        outcome === 'accepted'
          ? 'Chỉ ghi nhận provider đã chấp nhận/gửi; thao tác này không gửi lại. Bạn đã kiểm tra provider?'
          : 'Xác nhận provider chắc chắn CHƯA tiếp nhận bản tin? Hệ thống sẽ xếp hàng gửi lại nếu kênh hiện tại đang bật.',
      confirmLabel: 'Ghi nhận kết quả',
    });
    if (!confirmed || readOnly || busy) return;

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
      setSelected(null);
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
      {readOnly && (
        <p className="admin-notice" role="note">
          Chế độ chỉ đọc: có thể xem hàng đợi và chi tiết, nhưng không thực hiện POST/PATCH hoặc ghi
          nhận kết quả.
        </p>
      )}
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
        <AdminLoading label="Đang tải bản tin cần đối soát…" />
      ) : data.items.length === 0 ? (
        <AdminEmpty
          title="Hiện không có bản tin nào ở trạng thái Unknown."
          description="Hàng đợi sẽ xuất hiện khi provider chưa trả về kết quả xác định."
        />
      ) : (
        <>
          <p className="admin-muted">
            {data.total} bản tin cần tra cứu · trang {data.page}/
            {Math.max(1, Math.ceil(data.total / data.pageSize))}.
          </p>
          <div className="admin-record-list" aria-label="Hàng đợi thông báo Unknown">
            {data.items.map((item) => (
              <article className="admin-record" key={item.id}>
                <div>
                  <strong>
                    <code>{item.id}</code>
                  </strong>
                  <div className="admin-muted">
                    {item.eventType} · {item.channel === 'Sms' ? 'SMS' : 'Email'}
                  </div>
                  <div className="admin-muted">
                    {dateTime(item.createdAtUtc)} · {item.attempts} lần thử
                  </div>
                </div>
                <div className="admin-actions">
                  <StatusBadge status={item.status} />
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => {
                      setError('');
                      setSelected(item);
                    }}
                    disabled={busy}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </article>
            ))}
          </div>
          {data.total > data.pageSize && (
            <AdminPagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              loading={busy}
              onPage={(nextPage) => {
                setError('');
                setData(null);
                setPage(nextPage);
              }}
            />
          )}
        </>
      )}
      <AdminDialog
        open={!!selected}
        onClose={() => {
          if (!busy) setSelected(null);
        }}
        title="Chi tiết thông báo cần đối soát"
        description="Chỉ hiển thị định danh không nhạy cảm; không hiển thị người nhận hoặc nội dung bản tin."
        wide
      >
        {selected && (
          <form className="admin-form" onSubmit={(event) => void reconcile(event, selected)}>
            <div className="admin-form-section">
              <h3 className="admin-section-heading">Thông tin tra cứu</h3>
              <div className="admin-form-grid">
                <div className="admin-field">
                  <span>Mã bản tin</span>
                  <code>{selected.id}</code>
                </div>
                <div className="admin-field">
                  <span>Sự kiện</span>
                  <strong>{selected.eventType}</strong>
                </div>
                <div className="admin-field">
                  <span>Kênh</span>
                  <strong>{selected.channel === 'Sms' ? 'SMS' : 'Email'}</strong>
                </div>
                <div className="admin-field">
                  <span>Trạng thái</span>
                  <StatusBadge status={selected.status} />
                </div>
                <div className="admin-field">
                  <span>Thời điểm</span>
                  <strong>{dateTime(selected.createdAtUtc)}</strong>
                </div>
                <div className="admin-field">
                  <span>Số lần thử</span>
                  <strong>{selected.attempts}</strong>
                </div>
              </div>
            </div>
            {error && (
              <p className="admin-error" role="alert">
                {error}
              </p>
            )}
            {readOnly ? (
              <p className="admin-muted">
                Chế độ chỉ đọc: biểu mẫu và thao tác ghi nhận đã bị vô hiệu hóa; không có request
                ghi nào được gửi.
              </p>
            ) : (
              <div className="admin-form-section">
                <h3 className="admin-section-heading">Kết quả provider</h3>
                <p className="admin-helper">
                  Evidence bắt buộc để reconcile. “Đã chấp nhận/gửi” không retry; “Chưa tiếp nhận”
                  mô tả đúng việc xếp hàng retry có kiểm soát.
                </p>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Kết quả đã xác minh</span>
                    <select
                      value={outcomes[selected.id] ?? ''}
                      onChange={(event) =>
                        setOutcomes((old) => ({
                          ...old,
                          [selected.id]: event.target.value as Outcome,
                        }))
                      }
                      disabled={busy}
                      required
                    >
                      <option value="" disabled>
                        Chọn sau khi tra cứu provider
                      </option>
                      <option value="accepted">Provider đã chấp nhận/gửi (không gửi lại)</option>
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
                      value={evidence[selected.id] ?? ''}
                      onChange={(event) =>
                        setEvidence((old) => ({ ...old, [selected.id]: event.target.value }))
                      }
                      disabled={busy}
                      autoComplete="off"
                    />
                  </label>
                </div>
              </div>
            )}
            <div className="admin-form-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setSelected(null)}
                disabled={busy}
              >
                Đóng
              </button>
              {!readOnly && (
                <button
                  type="submit"
                  className="button"
                  disabled={
                    busy ||
                    !outcomes[selected.id] ||
                    (evidence[selected.id] ?? '').trim().length < 5
                  }
                >
                  {busy ? 'Đang ghi nhận…' : 'Ghi nhận kết quả'}
                </button>
              )}
            </div>
          </form>
        )}
      </AdminDialog>
    </section>
  );
}
