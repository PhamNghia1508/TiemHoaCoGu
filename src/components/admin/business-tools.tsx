'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { storeRequest } from '@/lib/browser-api';

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

function localDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Không thể thực hiện yêu cầu.');
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
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="admin-pagination">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Trước
      </button>
      <span>
        Trang {page}/{pages} · {total}
      </span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Sau
      </button>
    </div>
  );
}

export function VoucherManager() {
  const [data, setData] = useState<Page<Voucher>>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [form, setForm] = useState<VoucherForm>(blankVoucher);
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    async (page = 1) => {
      try {
        const q = new URLSearchParams({ page: String(page), pageSize: String(data.pageSize) });
        if (search.trim()) q.set('search', search.trim());
        if (active) q.set('isActive', active);
        setData(await storeRequest<Page<Voucher>>(`management/vouchers?${q}`));
      } catch (e) {
        setError(errorText(e));
      }
    },
    [active, data.pageSize, search],
  );
  // load is intentionally invoked only when the user changes filters; its paging callback is stable for this view.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
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
      setForm(blankVoucher);
      setEditing(null);
      await load();
    } catch (x) {
      setError(errorText(x));
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (v: Voucher) => {
    if (
      !window.confirm(
        `${v.isActive ? 'Tắt' : 'Bật'} voucher ${v.code}? Backend sẽ kiểm tra điều kiện nghiệp vụ.`,
      )
    )
      return;
    setBusy(true);
    try {
      await storeRequest<void>(
        `management/vouchers/${v.id}/active?value=${!v.isActive}`,
        undefined,
        'PATCH',
      );
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="admin-card">
      <h2>Voucher</h2>
      <Feedback error={error} notice={notice} />
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
      <form onSubmit={submit} className="admin-form">
        <label className="admin-field">
          <span>Mã voucher</span>
          <input
            required
            maxLength={40}
            placeholder="Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Mô tả voucher</span>
          <input
            maxLength={1000}
            placeholder="Mô tả"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <select
          aria-label="Loại giảm giá"
          value={form.discountType}
          onChange={(e) =>
            setForm({ ...form, discountType: e.target.value as VoucherForm['discountType'] })
          }
        >
          <option value="Percentage">Phần trăm</option>
          <option value="FixedAmount">Số tiền</option>
        </select>
        <label className="admin-field">
          <span>Giá trị giảm</span>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={form.discountValue}
            onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })}
          />
        </label>
        <label className="admin-field">
          <span>Giá trị đơn tối thiểu</span>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.minOrderAmount}
            onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
          />
        </label>
        <label className="admin-field">
          <span>Mức giảm tối đa (không bắt buộc)</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Giảm tối đa (tuỳ chọn)"
            value={form.maxDiscountAmount ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                maxDiscountAmount: e.target.value ? Number(e.target.value) : null,
              })
            }
          />
        </label>
        <label>
          Bắt đầu{' '}
          <input
            required
            type="datetime-local"
            value={form.startDate.slice(0, 16)}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
        </label>
        <label>
          Kết thúc{' '}
          <input
            required
            type="datetime-local"
            value={form.endDate.slice(0, 16)}
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
            onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })}
          />
        </label>
        <button disabled={busy} type="submit">
          {editing ? 'Lưu voucher' : 'Tạo voucher'}
        </button>
        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setForm(blankVoucher);
            }}
          >
            Hủy
          </button>
        )}
      </form>
      <ul>
        {data.items.map((v) => (
          <li key={v.id}>
            <strong>{v.code}</strong> · {v.discountType} {v.discountValue} · dùng {v.usedCount}/
            {v.usageLimit} · {v.isActive ? 'Bật' : 'Tắt'}{' '}
            <button
              type="button"
              onClick={() => {
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
              }}
            >
              Sửa
            </button>
            <button type="button" disabled={busy} onClick={() => void toggle(v)}>
              {v.isActive ? 'Tắt' : 'Bật'}
            </button>
          </li>
        ))}
      </ul>
      <Pager {...data} onPage={(p) => void load(p)} />
    </section>
  );
}

export function AccountManager() {
  const [data, setData] = useState<Page<Account>>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [form, setForm] = useState<AccountForm>(blankAccount);
  const [password, setPassword] = useState('');
  const [resetTarget, setResetTarget] = useState<Account | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(
    async (page = 1) => {
      try {
        const q = new URLSearchParams({ page: String(page), pageSize: String(data.pageSize) });
        if (search.trim()) q.set('search', search.trim());
        if (role) q.set('role', role);
        if (isActive) q.set('isActive', isActive);
        setData(await storeRequest<Page<Account>>(`management/accounts?${q}`));
      } catch (e) {
        setError(errorText(e));
      }
    },
    [data.pageSize, isActive, role, search],
  ); // Filter changes reload accounts and permissions; paging changes are handled by the pager.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(1);
      void storeRequest<Permissions>('management/permissions')
        .then(setPermissions)
        .catch((e) => setError(errorText(e)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (editing && !window.confirm('Xác nhận cập nhật tài khoản, quyền và trạng thái truy cập?'))
      return;
    setBusy(true);
    setError('');
    try {
      if (editing) await storeRequest<Account>(`management/accounts/${editing}`, form, 'PUT');
      else await storeRequest<Account>('management/accounts', { ...form, password });
      setNotice(editing ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản.');
      setForm(blankAccount);
      setPassword('');
      setEditing(null);
      await load();
    } catch (x) {
      setError(errorText(x));
    } finally {
      setBusy(false);
    }
  };
  const reset = async (a: Account) => {
    const next = resetPassword;
    if (!next) return;
    if (!window.confirm('Xác nhận reset mật khẩu? Các phiên đăng nhập sẽ bị thu hồi.')) return;
    setBusy(true);
    try {
      await storeRequest<void>(
        `management/accounts/${a.id}/reset-password`,
        { newPassword: next },
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
      <h2>Tài khoản</h2>
      <Feedback error={error} notice={notice} />
      <div className="admin-toolbar">
        <input
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
      <form onSubmit={submit} className="admin-form">
        <label className="admin-field">
          <span>Họ tên</span>
          <input
            required
            minLength={2}
            maxLength={120}
            placeholder="Họ tên"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Email tài khoản</span>
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="admin-field">
          <span>Số điện thoại</span>
          <input
            required
            pattern="[+]?[0-9]{9,15}"
            placeholder="Số điện thoại"
            value={form.phoneNumber}
            onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
          />
        </label>
        <select
          aria-label="Quyền tài khoản"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as AccountForm['role'] })}
        >
          <option>Customer</option>
          <option>Staff</option>
          <option>Admin</option>
        </select>
        {!editing && (
          <input
            required
            minLength={10}
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
        <label>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
          />{' '}
          Hoạt động
        </label>
        <button disabled={busy} type="submit">
          {editing ? 'Lưu tài khoản' : 'Tạo tài khoản'}
        </button>
      </form>
      {resetTarget && (
        <form
          className="admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            void reset(resetTarget);
          }}
        >
          <h3>Đặt lại mật khẩu cho {resetTarget.email}</h3>
          <label className="admin-field">
            <span>Mật khẩu mới (ít nhất 10 ký tự, có chữ hoa, chữ thường và số)</span>
            <input
              required
              minLength={10}
              maxLength={128}
              type="password"
              autoComplete="new-password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
            />
          </label>
          <button type="submit" disabled={busy}>
            Xác nhận đặt lại mật khẩu
          </button>
          <button
            type="button"
            onClick={() => {
              setResetTarget(null);
              setResetPassword('');
            }}
          >
            Hủy
          </button>
        </form>
      )}
      <ul>
        {data.items.map((a) => (
          <li key={a.id}>
            <strong>{a.fullName}</strong> · {a.email} · {a.role} ·{' '}
            {a.isActive ? 'Hoạt động' : 'Khóa'}{' '}
            <button
              type="button"
              onClick={() => {
                setEditing(a.id);
                setForm({
                  fullName: a.fullName,
                  email: a.email,
                  phoneNumber: a.phoneNumber,
                  role: a.role,
                  isActive: a.isActive,
                });
              }}
            >
              Sửa
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setResetTarget(a);
                setResetPassword('');
              }}
            >
              Reset mật khẩu
            </button>
          </li>
        ))}
      </ul>
      <Pager {...data} onPage={(p) => void load(p)} />
      {permissions && (
        <details>
          <summary>Quyền hệ thống</summary>
          {permissions.roles.map((r) => (
            <p key={r.role}>
              <strong>{r.role}</strong>: {r.description}
            </p>
          ))}
        </details>
      )}
    </section>
  );
}

export function ProductMediaManager({ productId }: { productId?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState(productId ?? '');
  const [images, setImages] = useState<ProductImage[]>([]);
  const [form, setForm] = useState<ImageForm>(blankImage);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (productId) return;
    const timer = window.setTimeout(() => {
      void storeRequest<Page<Product>>('management/products?page=1&pageSize=100')
        .then((r) => setProducts(r.items))
        .catch((e) => setError(errorText(e)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [productId]);
  const load = useCallback(async () => {
    if (!selected) return;
    try {
      setImages(await storeRequest<ProductImage[]>(`management/products/${selected}/images`));
    } catch (e) {
      setError(errorText(e));
    }
  }, [selected]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const upload = async (file: File) => {
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
    if (!selected) return;
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
    } catch (x) {
      setError(errorText(x));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (image: ProductImage) => {
    if (!window.confirm('Xóa ảnh khỏi gallery?')) return;
    setBusy(true);
    try {
      await storeRequest<void>(
        `management/products/${selected}/images/${image.id}`,
        undefined,
        'DELETE',
      );
      await load();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="admin-card">
      <h2>Ảnh sản phẩm</h2>
      <Feedback error={error} notice={notice} />
      {!productId && (
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
      )}
      {selected && (
        <>
          <form onSubmit={save} className="admin-form">
            <label className="admin-field">
              <span>URL ảnh</span>
              <input
                required
                maxLength={2000}
                placeholder="URL ảnh hoặc managed media path"
                value={form.imageUrl}
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
                onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
              />
            </label>
            <label>
              Upload (PNG/JPEG/WebP, tối đa 900 KiB){' '}
              <input
                disabled={busy}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload(file);
                  e.currentTarget.value = '';
                }}
              />
            </label>
            <button disabled={busy || !form.imageUrl} type="submit">
              {editing ? 'Lưu ảnh' : 'Thêm vào gallery'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setForm(blankImage);
                }}
              >
                Hủy
              </button>
            )}
          </form>
          <ul>
            {images.map((image) => (
              <li key={image.id}>
                <a href={image.imageUrl} target="_blank" rel="noreferrer">
                  {image.imageUrl}
                </a>{' '}
                · thứ tự {image.displayOrder}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setEditing(image.id);
                    setForm({ imageUrl: image.imageUrl, displayOrder: image.displayOrder });
                  }}
                >
                  Sửa
                </button>
                <button type="button" disabled={busy} onClick={() => void remove(image)}>
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
