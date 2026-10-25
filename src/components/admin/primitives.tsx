'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Check, Inbox, X } from 'lucide-react';

export function AdminDialog({
  open,
  onClose,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const node = dialog.current;
    if (open && node && !node.open) node.showModal();
    if (!open && node?.open) node.close();
  }, [open]);
  return (
    <dialog
      ref={dialog}
      className={`admin-dialog${wide ? ' admin-dialog-wide' : ''}`}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const nodes = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]',
          ),
        ).filter((node) => node.getClientRects().length > 0 && node.tabIndex >= 0);
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (!first) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first || document.activeElement === event.currentTarget)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="admin-dialog-heading">
        <div>
          <p className="admin-overline">TIỆM HOA CÓ GU / QUẢN TRỊ</p>
          <h2 id={titleId}>{title}</h2>
          {description && <p className="admin-muted">{description}</p>}
        </div>
        <button
          type="button"
          className="admin-icon-button"
          aria-label={`Đóng ${title}`}
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="admin-dialog-body">{children}</div>
    </dialog>
  );
}

type ConfirmOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
};
const ConfirmContext = createContext<((options: ConfirmOptions) => Promise<boolean>) | null>(null);
export function AdminConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolve = useRef<((value: boolean) => void) | null>(null);
  const confirm = useCallback(
    (next: ConfirmOptions) =>
      new Promise<boolean>((done) => {
        resolve.current?.(false);
        resolve.current = done;
        setOptions(next);
      }),
    [],
  );
  const finish = (value: boolean) => {
    resolve.current?.(value);
    resolve.current = null;
    setOptions(null);
  };
  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AdminDialog
        open={!!options}
        onClose={() => finish(false)}
        title={options?.title || 'Xác nhận thao tác'}
        description={options?.description}
      >
        <div className="admin-form-actions">
          <button
            className="button button-outline"
            type="button"
            autoFocus
            onClick={() => finish(false)}
          >
            Quay lại
          </button>
          <button
            className={`button${options?.destructive ? ' button-danger' : ''}`}
            type="button"
            onClick={() => finish(true)}
          >
            {options?.confirmLabel || 'Xác nhận'}
          </button>
        </div>
      </AdminDialog>
    </ConfirmContext.Provider>
  );
}
export function useAdminConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('Thiếu AdminConfirmProvider');
  return confirm;
}
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}
export function AdminEmpty({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="admin-empty-state">
      <Inbox size={26} strokeWidth={1.5} aria-hidden="true" />
      <h3>{title}</h3>
      {description && <p className="admin-muted">{description}</p>}
      {children}
    </div>
  );
}
export function AdminLoading({ label = 'Đang tải dữ liệu…' }: { label?: string }) {
  return (
    <div className="admin-loading" role="status">
      <span className="admin-loading-line" />
      <span className="admin-loading-line" />
      <span>{label}</span>
    </div>
  );
}
const labels: Record<string, string> = {
  Confirmed: 'Chờ xử lý',
  New: 'Mới nhận',
  Quoted: 'Đã báo giá',
  Accepted: 'Đã chấp nhận',
  Rejected: 'Đã từ chối',
  Expired: 'Hết hạn',
  Draft: 'Bản nháp',
  Scheduled: 'Đã xếp lịch',
  InProduction: 'Đang làm',
  Ready: 'Sẵn sàng',
  CheckedIn: 'Đã check-in',
  Open: 'Đang mở',
  Closed: 'Đã đóng',
  Full: 'Hết chỗ',
  Succeeded: 'Thành công',
  Failed: 'Thất bại',
  succeeded: 'Thành công',
  failed: 'Thất bại',
  pending: 'Đang chờ',
  authorized: 'Đã ủy quyền',
  unknown: 'Chưa rõ kết quả',
  Processing: 'Đang chuẩn bị',
  Delivering: 'Đang giao',
  Completed: 'Hoàn tất',
  Cancelled: 'Đã hủy',
  Unpaid: 'Chưa thanh toán',
  Paid: 'Đã thanh toán',
  PartiallyPaid: 'Thanh toán một phần',
  Refunded: 'Đã hoàn tiền',
  Preparing: 'Đang chuẩn bị',
  Shipped: 'Đã gửi',
  Delivered: 'Đã giao',
  Pending: 'Đang chờ',
  Unknown: 'Chưa rõ kết quả',
  Active: 'Đang bật',
  Inactive: 'Đang tắt',
  attended: 'Đã check-in',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
};
export function statusLabel(status: string) {
  return labels[status] || status;
}
export function StatusBadge({ status }: { status: string }) {
  const lower = status.toLowerCase();
  const tone =
    status === 'Confirmed'
      ? 'info'
      : ['paid', 'completed', 'delivered', 'active', 'attended', 'confirmed'].includes(lower)
        ? 'success'
        : ['cancelled', 'inactive', 'failed', 'refunded'].includes(lower)
          ? 'neutral'
          : ['unknown', 'unpaid', 'pending', 'partiallypaid'].includes(lower)
            ? 'warning'
            : 'info';
  return (
    <span className={`admin-status admin-status-${tone}`}>
      {tone === 'success' ? (
        <Check size={12} aria-hidden="true" />
      ) : (
        <span aria-hidden="true" className="admin-status-dot" />
      )}
      {statusLabel(status)}
    </span>
  );
}
export function AdminPagination({
  page,
  pageSize,
  total,
  onPage,
  loading = false,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
  loading?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="admin-pagination">
      <span>
        {total
          ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} trong ${total}`
          : '0 kết quả'}
      </span>
      <div className="admin-actions">
        <button
          className="button button-outline"
          type="button"
          disabled={loading || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Trước
        </button>
        <span>
          Trang {page}/{pages}
        </span>
        <button
          className="button button-outline"
          type="button"
          disabled={loading || page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Sau
        </button>
      </div>
    </div>
  );
}
