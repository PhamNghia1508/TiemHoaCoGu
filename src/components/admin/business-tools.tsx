/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { storeRequest } from '@/lib/browser-api';
import {
  AdminDialog,
  AdminEmpty,
  AdminLoading,
  StatusBadge,
  useAdminConfirm,
  useDebouncedValue,
} from './primitives';

type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
type Voucher = {
  id: string;
  code: string;
  description: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startDate: string;
  endDate: string;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
};
type Account = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'Admin' | 'Staff' | 'Customer';
  isActive: boolean;
  isGuest: boolean;
  createdAt: string;
};
type Product = { id: string; code: string; name: string };
type ProductImage = { id: string; imageUrl: string; displayOrder: number };
type Permissions = { roles: { role: string; description: string }[]; cms: Record<string, string> };
type VoucherForm = Omit<Voucher, 'id' | 'usedCount' | 'isActive'>;
type AccountForm = Pick<Account, 'fullName' | 'email' | 'phoneNumber' | 'role' | 'isActive'>;
type ImageForm = Pick<ProductImage, 'imageUrl' | 'displayOrder'>;

const blankVoucher: VoucherForm = {
  code: '',
  description: '',
  discountType: 'Percentage',
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscountAmount: null,
  startDate: '',
  endDate: '',
  usageLimit: 1,
};
const blankAccount: AccountForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  role: 'Customer',
  isActive: true,
};
const blankImage: ImageForm = { imageUrl: '', displayOrder: 0 };
const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Không thể thực hiện yêu cầu.');
const localDateTime = (value: string) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function Feedback({ error, notice }: { error: string; notice: string }) {
  return (
    <>
      {error && (
        <p role="alert" className="admin-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="admin-notice">
          {notice}
        </p>
      )}
    </>
  );
}
function Pager({
  page,
  pageSize,
  total,
  busy,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  busy?: boolean;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="admin-pagination">
      <button type="button" disabled={busy || page <= 1} onClick={() => onPage(page - 1)}>
        Trước
      </button>
      <span aria-live="polite">
        Trang {page}/{pages} · {total}
      </span>
      <button type="button" disabled={busy || page >= pages} onClick={() => onPage(page + 1)}>
        Sau
      </button>
    </div>
  );
}

export function VoucherManager({ readOnly = false }: { readOnly?: boolean }) {
  const [data, setData] = useState<Page<Voucher>>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [form, setForm] = useState(blankVoucher);
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Voucher | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [active, setActive] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const confirm = useAdminConfirm();
  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      try {
        const q = new URLSearchParams({ page: String(page), pageSize: String(data.pageSize) });
        if (debouncedSearch.trim()) q.set('search', debouncedSearch.trim());
        if (active) q.set('isActive', active);
        setData(await storeRequest<Page<Voucher>>(`management/vouchers?${q}`));
      } catch (e) {
        setError(errorText(e));
      } finally {
        setLoading(false);
      }
    },
    [active, data.pageSize, debouncedSearch],
  );
  useEffect(() => {
    void load(1);
  }, [load]);
  const openEdit = (v: Voucher) => {
    setSelected(v);
    setEditing(v.id);
    setForm({
      code: v.code,
      description: v.description,
      discountType: v.discountType,
      discountValue: v.discountValue,
      minOrderAmount: v.minOrderAmount,
      maxDiscountAmount: v.maxDiscountAmount,
      startDate: localDateTime(v.startDate),
      endDate: localDateTime(v.endDate),
      usageLimit: v.usageLimit,
    });
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly || busy) return;
    setBusy(true);
    setError('');
    try {
      await storeRequest<Voucher>(
        editing ? `management/vouchers/${editing}` : 'management/vouchers',
        {
          ...form,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          maxDiscountAmount:
            form.maxDiscountAmount === null || Number.isNaN(form.maxDiscountAmount)
              ? null
              : form.maxDiscountAmount,
        },
        editing ? 'PUT' : 'POST',
      );
      setNotice(editing ? 'Đã cập nhật voucher.' : 'Đã tạo voucher.');
      setEditing(null);
      setSelected(null);
      setForm(blankVoucher);
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (v: Voucher) => {
    if (
      readOnly ||
      busy ||
      !(await confirm({
        title: `${v.isActive ? 'Tắt' : 'Bật'} voucher ${v.code}?`,
        description: 'Backend sẽ kiểm tra điều kiện nghiệp vụ.',
        confirmLabel: v.isActive ? 'Tắt voucher' : 'Bật voucher',
        destructive: v.isActive,
      }))
    )
      return;
    setBusy(true);
    try {
      await storeRequest<void>(
        `management/vouchers/${v.id}/active?value=${!v.isActive}`,
        undefined,
        'PATCH',
      );
      setNotice('Đã cập nhật trạng thái voucher.');
      await load(data.page);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="admin-card">
      <div className="admin-section-heading">
        <div>
          <h2>Voucher</h2>
          <p className="admin-muted">Danh sách voucher và trạng thái sử dụng.</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="button"
            onClick={() => {
              setEditing('');
              setSelected(null);
              setForm(blankVoucher);
            }}
          >
            Tạo voucher
          </button>
        )}
      </div>
      {!editing && <Feedback error={error} notice={notice} />}
      <div className="admin-toolbar">
        <input
          aria-label="Tìm voucher"
          placeholder="Tìm mã hoặc mô tả"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Trạng thái voucher"
          value={active}
          onChange={(e) => setActive(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="true">Đang bật</option>
          <option value="false">Đang tắt</option>
        </select>
      </div>
      {loading ? (
        <AdminLoading />
      ) : data.items.length === 0 ? (
        <AdminEmpty title="Chưa có voucher phù hợp" description="Thử đổi từ khóa hoặc bộ lọc." />
      ) : (
        <div className="admin-record-list">
          {data.items.map((v) => (
            <article
              className={`admin-record ${selected?.id === v.id ? 'is-selected' : ''}`}
              key={v.id}
            >
              <div>
                <strong>{v.code}</strong>
                <p className="admin-muted">
                  {v.description || 'Không có mô tả'} ·{' '}
                  {v.discountType === 'Percentage' ? `${v.discountValue}%` : `${v.discountValue} đ`}{' '}
                  · dùng {v.usedCount}/{v.usageLimit}
                </p>
              </div>
              <StatusBadge status={v.isActive ? 'Đang bật' : 'Đang tắt'} />
              <div className="admin-actions">
                <button type="button" className="button button-outline" onClick={() => openEdit(v)}>
                  Chi tiết
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    className="button"
                    disabled={busy}
                    onClick={() => void toggle(v)}
                  >
                    {v.isActive ? 'Tắt' : 'Bật'}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <Pager {...data} busy={loading || busy} onPage={(p) => void load(p)} />
      <AdminDialog
        open={editing !== null}
        onClose={() => {
          setEditing(null);
          setSelected(null);
          setForm(blankVoucher);
        }}
        title={editing ? (readOnly ? 'Xem voucher' : 'Sửa voucher') : 'Tạo voucher'}
        description={readOnly ? 'Chế độ chỉ đọc: các thao tác ghi đang bị vô hiệu hóa.' : undefined}
        wide
      >
        <form onSubmit={submit} className="admin-form" aria-busy={busy}>
          <Feedback error={error} notice={notice} />
          <div className="admin-form-section">
            <h4>Thông tin voucher</h4>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Mã voucher</span>
                <input
                  required
                  maxLength={40}
                  value={form.code}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Mô tả voucher</span>
                <input
                  maxLength={1000}
                  value={form.description}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Loại giảm giá</span>
                <select
                  value={form.discountType}
                  disabled={readOnly || busy}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discountType: e.target.value as VoucherForm['discountType'],
                    })
                  }
                >
                  <option value="Percentage">Phần trăm</option>
                  <option value="FixedAmount">Số tiền</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Giá trị giảm</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.discountValue}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
                />
              </label>
            </div>
          </div>
          <div className="admin-form-section">
            <h4>Điều kiện và thời hạn</h4>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Giá trị đơn tối thiểu</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minOrderAmount}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
                />
              </label>
              <label className="admin-field">
                <span>Mức giảm tối đa (không bắt buộc)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxDiscountAmount ?? ''}
                  disabled={readOnly || busy}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      maxDiscountAmount: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
              <label className="admin-field">
                <span>Bắt đầu</span>
                <input
                  required
                  type="datetime-local"
                  value={form.startDate}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Kết thúc</span>
                <input
                  required
                  type="datetime-local"
                  value={form.endDate}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Giới hạn lượt dùng</span>
                <input
                  required
                  type="number"
                  min="1"
                  value={form.usageLimit}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
                />
              </label>
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="button" disabled={busy || readOnly}>
              {editing ? 'Lưu voucher' : 'Tạo voucher'}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                setEditing(null);
                setSelected(null);
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      </AdminDialog>
    </section>
  );
}

export function AccountManager({ readOnly = false }: { readOnly?: boolean }) {
  const [data, setData] = useState<Page<Account>>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [form, setForm] = useState(blankAccount);
  const [password, setPassword] = useState('');
  const [resetTarget, setResetTarget] = useState<Account | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [selected, setSelected] = useState<Account | null>(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const confirm = useAdminConfirm();
  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      setError('');
      try {
        const q = new URLSearchParams({ page: String(page), pageSize: String(data.pageSize) });
        if (debouncedSearch.trim()) q.set('search', debouncedSearch.trim());
        if (role) q.set('role', role);
        if (isActive) q.set('isActive', isActive);
        setData(await storeRequest<Page<Account>>(`management/accounts?${q}`));
      } catch (e) {
        setError(errorText(e));
      } finally {
        setLoading(false);
      }
    },
    [data.pageSize, debouncedSearch, isActive, role],
  );
  useEffect(() => {
    void load(1);
    void storeRequest<Permissions>('management/permissions')
      .then(setPermissions)
      .catch((e) => setError(errorText(e)));
  }, [load]);
  const openEdit = (a: Account) => {
    setSelected(a);
    setEditing(a.id);
    setForm({
      fullName: a.fullName,
      email: a.email,
      phoneNumber: a.phoneNumber,
      role: a.role,
      isActive: a.isActive,
    });
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (
      readOnly ||
      busy ||
      (editing &&
        !(await confirm({
          title: 'Xác nhận cập nhật tài khoản?',
          description: 'Thay đổi quyền và trạng thái truy cập sẽ có hiệu lực ngay.',
          confirmLabel: 'Cập nhật',
        })))
    )
      return;
    setBusy(true);
    try {
      if (editing) await storeRequest<Account>(`management/accounts/${editing}`, form, 'PUT');
      else await storeRequest<Account>('management/accounts', { ...form, password }, 'POST');
      setNotice(editing ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản.');
      setForm(blankAccount);
      setPassword('');
      setEditing(null);
      setSelected(null);
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const reset = async (a: Account) => {
    if (
      readOnly ||
      busy ||
      !resetPassword ||
      !(await confirm({
        title: `Reset mật khẩu cho ${a.email}?`,
        description:
          'Các phiên đăng nhập sẽ bị thu hồi. Mật khẩu mới chỉ gửi một lần và không được lưu trong giao diện.',
        confirmLabel: 'Reset mật khẩu',
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    try {
      await storeRequest<void>(
        `management/accounts/${a.id}/reset-password`,
        { newPassword: resetPassword },
        'POST',
      );
      setNotice('Đã reset mật khẩu.');
      setResetTarget(null);
      setResetPassword('');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="admin-card">
      <div className="admin-section-heading">
        <div>
          <h2>Tài khoản</h2>
          <p className="admin-muted">Quản lý hồ sơ, quyền và trạng thái truy cập.</p>
        </div>
        {!readOnly && (
          <button
            type="button"
            className="button"
            onClick={() => {
              setEditing('');
              setSelected(null);
              setForm(blankAccount);
            }}
          >
            Tạo tài khoản
          </button>
        )}
      </div>
      {!editing && !resetTarget && <Feedback error={error} notice={notice} />}
      <div className="admin-toolbar">
        <input
          aria-label="Tìm tài khoản"
          placeholder="Tìm tên, email, số điện thoại"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Lọc quyền tài khoản"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="">Tất cả quyền</option>
          <option>Admin</option>
          <option>Staff</option>
          <option>Customer</option>
        </select>
        <select
          aria-label="Trạng thái tài khoản"
          value={isActive}
          onChange={(e) => setIsActive(e.target.value)}
        >
          <option value="">Tất cả hoạt động</option>
          <option value="true">Đang hoạt động</option>
          <option value="false">Đã khóa</option>
        </select>
      </div>
      {loading ? (
        <AdminLoading />
      ) : data.items.length === 0 ? (
        <AdminEmpty title="Chưa có tài khoản phù hợp" description="Thử đổi từ khóa hoặc bộ lọc." />
      ) : (
        <div className="admin-record-list">
          {data.items.map((a) => (
            <article
              className={`admin-record ${selected?.id === a.id ? 'is-selected' : ''}`}
              key={a.id}
            >
              <div>
                <strong>{a.fullName}</strong>
                <p className="admin-muted">
                  {a.email} · {a.phoneNumber} · {a.role}
                </p>
              </div>
              <StatusBadge status={a.isActive ? 'Hoạt động' : 'Đã khóa'} />
              <div className="admin-actions">
                <button type="button" className="button button-outline" onClick={() => openEdit(a)}>
                  Chi tiết
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    className="button button-outline"
                    disabled={busy}
                    onClick={() => {
                      setResetTarget(a);
                      setResetPassword('');
                    }}
                  >
                    Reset mật khẩu
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <Pager {...data} busy={busy || loading} onPage={(p) => void load(p)} />
      <AdminDialog
        open={editing !== null}
        onClose={() => {
          setEditing(null);
          setSelected(null);
        }}
        title={editing ? (readOnly ? 'Xem tài khoản' : 'Sửa tài khoản') : 'Tạo tài khoản'}
        description={
          readOnly
            ? 'Chế độ chỉ đọc: biểu mẫu chỉ để xem, mọi thao tác ghi đã bị vô hiệu hóa.'
            : undefined
        }
      >
        <form onSubmit={submit} className="admin-form" aria-busy={busy}>
          <Feedback error={error} notice={notice} />
          <div className="admin-form-section">
            <h4>Thông tin tài khoản</h4>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Họ tên</span>
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.fullName}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Email tài khoản</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Số điện thoại</span>
                <input
                  required
                  pattern="[+]?[0-9]{9,15}"
                  value={form.phoneNumber}
                  disabled={readOnly || busy}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Quyền tài khoản</span>
                <select
                  value={form.role}
                  disabled={readOnly || busy}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value as AccountForm['role'] })
                  }
                >
                  <option>Customer</option>
                  <option>Staff</option>
                  <option>Admin</option>
                </select>
              </label>
              {!editing && (
                <label className="admin-field">
                  <span>Mật khẩu (ít nhất 10 ký tự)</span>
                  <input
                    required
                    minLength={10}
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    disabled={readOnly || busy}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <small className="admin-helper">
                    Không hiển thị lại và không lưu trong giao diện.
                  </small>
                </label>
              )}
              <label className="admin-field">
                <span>Trạng thái</span>
                <span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    disabled={readOnly || busy}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />{' '}
                  Hoạt động
                </span>
              </label>
            </div>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="button" disabled={busy || readOnly}>
              {editing ? 'Lưu tài khoản' : 'Tạo tài khoản'}
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => setEditing(null)}
            >
              Hủy
            </button>
          </div>
        </form>
      </AdminDialog>
      <AdminDialog
        open={Boolean(resetTarget)}
        onClose={() => {
          setResetTarget(null);
          setResetPassword('');
        }}
        title="Đặt lại mật khẩu"
        description={
          resetTarget
            ? `Tài khoản đích: ${resetTarget.fullName} · ${resetTarget.email}. Mật khẩu không được lưu hoặc hiển thị lại.`
            : undefined
        }
      >
        <form
          className="admin-form"
          aria-busy={busy}
          onSubmit={(e) => {
            e.preventDefault();
            if (resetTarget) void reset(resetTarget);
          }}
        >
          <Feedback error={error} notice={notice} />
          <label className="admin-field">
            <span>Mật khẩu mới (ít nhất 10 ký tự, có chữ hoa, chữ thường và số)</span>
            <input
              required
              minLength={10}
              maxLength={128}
              type="password"
              autoComplete="new-password"
              value={resetPassword}
              disabled={readOnly || busy}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </label>
          <div className="admin-form-actions">
            <button type="submit" className="button button-danger" disabled={busy || readOnly}>
              Xác nhận đặt lại mật khẩu
            </button>
            <button
              type="button"
              className="button button-outline"
              onClick={() => {
                setResetTarget(null);
                setResetPassword('');
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      </AdminDialog>
      <details className="admin-detail">
        <summary>Quyền hệ thống (chi tiết phụ)</summary>
        {permissions ? (
          permissions.roles.map((r) => (
            <p key={r.role}>
              <strong>{r.role}</strong>: {r.description}
            </p>
          ))
        ) : (
          <AdminLoading label="Đang tải quyền…" />
        )}
      </details>
    </section>
  );
}

export function ProductMediaManager({
  productId,
  readOnly = false,
}: {
  productId?: string;
  readOnly?: boolean;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState(productId ?? '');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [form, setForm] = useState(blankImage);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const loadId = useRef(0);
  const confirm = useAdminConfirm();
  useEffect(() => {
    setSelected(productId ?? '');
    setImages([]);
    setEditing(null);
    setForm(blankImage);
    if (productId) return;
    storeRequest<Page<Product>>('management/products?page=1&pageSize=100')
      .then((r) => setProducts(r.items))
      .catch((e) => setError(errorText(e)));
  }, [productId]);
  const load = useCallback(async () => {
    if (!selected) return;
    const requestId = ++loadId.current;
    const productAtStart = selected;
    setLoading(true);
    try {
      const result = await storeRequest<ProductImage[]>(
        `management/products/${productAtStart}/images`,
      );
      if (requestId === loadId.current && productAtStart === selected) setImages(result);
    } catch (e) {
      if (requestId === loadId.current && productAtStart === selected) setError(errorText(e));
    } finally {
      if (requestId === loadId.current && productAtStart === selected) setLoading(false);
    }
  }, [selected]);
  useEffect(() => {
    void load();
  }, [load]);
  const upload = async (file: File) => {
    if (readOnly || busy) return;
    if (file.size > 900 * 1024) {
      setError('Ảnh không quá 900 KiB.');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setBusy(true);
    try {
      const response = await fetch('/api/store/management/media', {
        method: 'POST',
        credentials: 'same-origin',
        body: fd,
      });
      const body: unknown = await response.json().catch(() => null);
      if (!response.ok)
        throw new Error(
          typeof body === 'object' &&
            body !== null &&
            'error' in body &&
            typeof body.error === 'string'
            ? body.error
            : 'Tải ảnh thất bại.',
        );
      if (
        typeof body !== 'object' ||
        body === null ||
        !('url' in body) ||
        typeof body.url !== 'string'
      )
        throw new Error('Phản hồi media không hợp lệ.');
      const uploadedUrl = body.url;
      setForm((f) => ({ ...f, imageUrl: uploadedUrl }));
      setNotice('Đã tải ảnh; hãy bấm lưu để áp dụng vào gallery.');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (readOnly || busy || !selected) return;
    setBusy(true);
    try {
      await storeRequest<ProductImage>(
        `management/products/${selected}/images${editing ? `/${editing}` : ''}`,
        form,
        editing ? 'PUT' : 'POST',
      );
      setNotice(editing ? 'Đã sửa ảnh.' : 'Đã thêm ảnh vào gallery.');
      setForm(blankImage);
      setEditing(null);
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (image: ProductImage) => {
    if (
      readOnly ||
      busy ||
      !(await confirm({
        title: 'Xóa ảnh khỏi gallery?',
        description: 'Ảnh sẽ bị gỡ khỏi sản phẩm này.',
        confirmLabel: 'Xóa ảnh',
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    try {
      await storeRequest<void>(
        `management/products/${selected}/images/${image.id}`,
        undefined,
        'DELETE',
      );
      setNotice('Đã xóa ảnh khỏi gallery.');
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const selectedProduct = products.find((p) => p.id === selected);
  return (
    <section className="admin-card">
      <div className="admin-section-heading">
        <div>
          <h2>Ảnh sản phẩm</h2>
          <p className="admin-muted">Gallery theo sản phẩm, không dùng ảnh hoặc dữ liệu giả.</p>
        </div>
        {selected && !readOnly && (
          <button
            type="button"
            className="button"
            onClick={() => {
              setEditing('');
              setForm(blankImage);
            }}
          >
            Thêm ảnh
          </button>
        )}
      </div>
      {!editing && <Feedback error={error} notice={notice} />}
      {!productId && (
        <label className="admin-field">
          <span>Chọn sản phẩm</span>
          <select
            aria-label="Chọn sản phẩm quản lý ảnh"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Chọn sản phẩm</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} · {p.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {selected && (
        <>
          <div className="admin-detail">
            <strong>
              {selectedProduct
                ? `${selectedProduct.code} · ${selectedProduct.name}`
                : 'Sản phẩm đã chọn'}
            </strong>
            <span className="admin-muted"> · {images.length} ảnh trong gallery</span>
          </div>
          {loading ? (
            <AdminLoading />
          ) : images.length === 0 ? (
            <AdminEmpty
              title="Sản phẩm chưa có ảnh"
              description="Thêm ảnh để xây dựng gallery chính thức."
            />
          ) : (
            <div className="admin-record-list">
              {images.map((image) => (
                <article className="admin-record" key={image.id}>
                  <div>
                    <a href={image.imageUrl} target="_blank" rel="noreferrer">
                      {image.imageUrl}
                    </a>
                    <p className="admin-muted">Thứ tự {image.displayOrder}</p>
                  </div>
                  <div className="admin-actions">
                    <button
                      type="button"
                      className="button button-outline"
                      onClick={() => {
                        setEditing(image.id);
                        setForm({ imageUrl: image.imageUrl, displayOrder: image.displayOrder });
                      }}
                    >
                      Chi tiết
                    </button>
                    {!readOnly && (
                      <button
                        type="button"
                        className="button button-danger"
                        disabled={busy}
                        onClick={() => void remove(image)}
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
          <AdminDialog
            open={editing !== null}
            onClose={() => {
              setEditing(null);
              setForm(blankImage);
            }}
            title={editing ? (readOnly ? 'Xem ảnh' : 'Sửa ảnh') : 'Thêm ảnh vào gallery'}
            description={
              readOnly
                ? 'Chế độ chỉ đọc: upload, lưu và xóa đã bị vô hiệu hóa.'
                : 'Giới hạn upload: PNG/JPEG/WebP, tối đa 900 KiB.'
            }
          >
            <form onSubmit={save} className="admin-form" aria-busy={busy}>
              <Feedback error={error} notice={notice} />
              <div className="admin-form-section">
                <h4>Thông tin ảnh</h4>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>URL ảnh</span>
                    <input
                      required
                      maxLength={2000}
                      value={form.imageUrl}
                      disabled={readOnly || busy}
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    <span>Thứ tự ảnh</span>
                    <input
                      required
                      min="0"
                      type="number"
                      value={form.displayOrder}
                      disabled={readOnly || busy}
                      onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
                    />
                  </label>
                </div>
              </div>
              <label className="admin-field">
                <span>Upload (PNG/JPEG/WebP, tối đa 900 KiB)</span>
                <input
                  disabled={busy || readOnly}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="button"
                  disabled={busy || readOnly || !form.imageUrl}
                >
                  {editing ? 'Lưu ảnh' : 'Thêm vào gallery'}
                </button>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => {
                    setEditing(null);
                    setForm(blankImage);
                  }}
                >
                  Hủy
                </button>
              </div>
            </form>
          </AdminDialog>
        </>
      )}
    </section>
  );
}
