'use client';

import Link from 'next/link';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import { storeRequest } from '@/lib/browser-api';
import { useStore } from '@/components/store-provider';

type User = { id: string; fullName: string; email: string; phoneNumber: string; role: string };
type Address = {
  id: string;
  receiverName: string;
  receiverPhone: string;
  detailAddress: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
};
type CartLine = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};
type Status = { configured?: boolean; writesEnabled?: boolean };
const emptyAddress = {
  receiverName: '',
  receiverPhone: '',
  detailAddress: '',
  ward: '',
  district: '',
  province: '',
  isDefault: false,
};

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Không thể thực hiện yêu cầu.';
}

export default function Account() {
  const store = useStore();
  const authGeneration = useRef(0);
  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serverCart, setServerCart] = useState<CartLine[]>([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [writesEnabled, setWritesEnabled] = useState(true);
  const [status, setStatus] = useState<Status | null>(null);

  const loadAccount = async () => {
    const me = await storeRequest<User>('auth/me');
    setUser(me);
    const [nextAddresses, nextCart] = await Promise.all([
      storeRequest<Address[]>('addresses'),
      storeRequest<CartLine[]>('cart'),
    ]);
    setAddresses(nextAddresses);
    setServerCart(nextCart);
  };

  useEffect(() => {
    let active = true;
    const generation = authGeneration.current;
    void Promise.all([
      storeRequest<Status>('status')
        .then((value) => {
          if (active) {
            setStatus(value);
            setWritesEnabled(value.writesEnabled !== false);
          }
        })
        .catch(() => undefined),
      storeRequest<User>('auth/me')
        .then(async (me) => {
          if (!active || generation !== authGeneration.current) return;
          setUser(me);
          try {
            const [nextAddresses, nextCart] = await Promise.all([
              storeRequest<Address[]>('addresses'),
              storeRequest<CartLine[]>('cart'),
            ]);
            if (active && generation === authGeneration.current) {
              setAddresses(nextAddresses);
              setServerCart(nextCart);
            }
          } catch (error) {
            if (active && generation === authGeneration.current) setMessage(errorText(error));
          }
        })
        .catch(() => {
          if (active && generation === authGeneration.current) setUser(null);
        }),
    ]);
    return () => {
      active = false;
    };
  }, []);

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    authGeneration.current += 1;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    setMessage('');
    try {
      await storeRequest(`auth/${mode}`, data);
      await loadAccount();
      setMessage(mode === 'login' ? 'Đã đăng nhập thành công.' : 'Đã tạo tài khoản thành công.');
      form.reset();
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    if (busy) return;
    authGeneration.current += 1;
    setBusy(true);
    setMessage('');
    try {
      await storeRequest('auth/logout', {});
      setMessage('Đã đăng xuất.');
    } catch (error) {
      setMessage(`Đã xoá phiên đăng nhập trên trang. ${errorText(error)}`);
    } finally {
      setUser(null);
      setAddresses([]);
      setServerCart([]);
      setEditingId(null);
      setAddressForm(emptyAddress);
      setBusy(false);
    }
  };

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !writesEnabled || !user) return;
    const form = event.currentTarget;
    const payload = { ...addressForm };
    setBusy(true);
    setMessage('');
    try {
      await storeRequest(
        editingId ? `addresses/${editingId}` : 'addresses',
        payload,
        editingId ? 'PUT' : 'POST',
      );
      setEditingId(null);
      setAddressForm(emptyAddress);
      form.reset();
      setAddresses(await storeRequest<Address[]>('addresses'));
      setMessage('Đã lưu địa chỉ.');
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const removeAddress = async (id: string) => {
    if (busy || !writesEnabled) return;
    setBusy(true);
    setMessage('');
    try {
      await storeRequest(`addresses/${id}`, undefined, 'DELETE');
      setAddresses(await storeRequest<Address[]>('addresses'));
      setMessage('Đã xoá địa chỉ.');
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !writesEnabled) return;
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    setMessage('');
    try {
      await storeRequest('auth/change-password', payload);
      form.reset();
      setUser(null);
      setAddresses([]);
      setServerCart([]);
      setMessage('Đổi mật khẩu thành công. Bạn đã được đăng xuất.');
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  };

  const saveLocalToAccount = async () => {
    if (cartBusy || !writesEnabled) return;
    setCartBusy(true);
    setMessage('');
    try {
      for (const line of store.cart) {
        const productId = store.products.find((product) => product.id === line.id)?.backendId;
        if (productId)
          await storeRequest('cart', { productId, quantity: Math.min(20, line.quantity) });
      }
      setServerCart(await storeRequest<CartLine[]>('cart'));
      setMessage('Đã lưu túi hoa hiện tại vào tài khoản.');
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setCartBusy(false);
    }
  };

  const restoreAccountToLocal = () => {
    if (cartBusy) return;
    store.clear();
    for (const line of serverCart) {
      const product = store.products.find((item) => item.backendId === line.productId);
      if (product) store.add(product.id, Math.min(20, line.quantity));
    }
    setMessage('Đã thay túi hoa cục bộ bằng túi trong tài khoản.');
  };

  const setServerQuantity = async (line: CartLine, quantity: number) => {
    if (cartBusy || !writesEnabled) return;
    setCartBusy(true);
    setMessage('');
    try {
      await storeRequest(`cart/${line.id}`, undefined, 'DELETE');
      if (quantity > 0)
        await storeRequest('cart', { productId: line.productId, quantity: Math.min(20, quantity) });
      setServerCart(await storeRequest<CartLine[]>('cart'));
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setCartBusy(false);
    }
  };

  if (!user)
    return (
      <section className="studio-block" aria-labelledby="account-title">
        <p className="eyebrow">TÀI KHOẢN</p>
        <h1 id="account-title">{mode === 'login' ? 'Chào bạn trở lại.' : 'Tạo tài khoản.'}</h1>
        <form onSubmit={submitAuth}>
          <label className="field">
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          {mode === 'register' && (
            <>
              <label className="field">
                Họ tên
                <input name="fullName" autoComplete="name" required />
              </label>
              <label className="field">
                Điện thoại
                <input name="phoneNumber" type="tel" autoComplete="tel" required />
              </label>
            </>
          )}
          <label className="field">
            Mật khẩu
            <input
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              required
              minLength={10}
            />
          </label>
          {mode === 'register' && <p>Mật khẩu tối thiểu 10 ký tự.</p>}
          <button className="button" type="submit" disabled={busy}>
            {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
          </button>
        </form>
        <button
          className="text-link"
          type="button"
          onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
        >
          {mode === 'login' ? 'Tạo tài khoản mới' : 'Tôi đã có tài khoản'}
        </button>
        {message && <p role="status">{message}</p>}
        {status && <p>API: {status.configured === false ? 'chưa cấu hình' : 'sẵn sàng'}.</p>}
      </section>
    );

  return (
    <section className="studio-block" aria-labelledby="account-title">
      <p className="eyebrow">TÀI KHOẢN</p>
      <h1 id="account-title">Xin chào, {user.fullName}.</h1>
      <p>
        {user.email} · {user.phoneNumber}
      </p>
      <div>
        <Link className="text-link" href="/tra-cuu">
          Tra cứu đơn hàng
        </Link>
        {user.role.toLowerCase() === 'admin' && (
          <Link className="text-link" href="/quan-tri">
            Quản trị
          </Link>
        )}
        <button className="text-link" type="button" onClick={() => void logout()} disabled={busy}>
          Đăng xuất
        </button>
      </div>
      {!writesEnabled && (
        <p role="alert">Server đang tắt thao tác ghi. Bạn vẫn có thể xem dữ liệu.</p>
      )}
      <div aria-labelledby="address-title">
        <h2 id="address-title">Địa chỉ giao hàng</h2>
        <form onSubmit={saveAddress}>
          <label className="field">
            Người nhận
            <input
              value={addressForm.receiverName}
              onChange={(e) => setAddressForm({ ...addressForm, receiverName: e.target.value })}
              required
            />
          </label>
          <label className="field">
            Điện thoại
            <input
              value={addressForm.receiverPhone}
              onChange={(e) => setAddressForm({ ...addressForm, receiverPhone: e.target.value })}
              required
            />
          </label>
          <label className="field">
            Địa chỉ chi tiết
            <input
              value={addressForm.detailAddress}
              onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
              required
            />
          </label>
          <label className="field">
            Phường/xã
            <input
              value={addressForm.ward}
              onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
              required
            />
          </label>
          <label className="field">
            Quận/huyện
            <input
              value={addressForm.district}
              onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
              required
            />
          </label>
          <label className="field">
            Tỉnh/thành phố
            <input
              value={addressForm.province}
              onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
              required
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
            />{' '}
            Đặt làm mặc định
          </label>
          <button className="button" type="submit" disabled={busy || !writesEnabled}>
            {editingId ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
          </button>
          {editingId && (
            <button
              type="button"
              className="text-link"
              onClick={() => {
                setEditingId(null);
                setAddressForm(emptyAddress);
              }}
            >
              Huỷ sửa
            </button>
          )}
        </form>
        <ul>
          {addresses.map((address) => (
            <li key={address.id}>
              {address.receiverName} · {address.detailAddress}, {address.ward}, {address.district},{' '}
              {address.province}
              {address.isDefault ? ' · mặc định' : ''}
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setEditingId(address.id);
                  setAddressForm({
                    receiverName: address.receiverName,
                    receiverPhone: address.receiverPhone,
                    detailAddress: address.detailAddress,
                    ward: address.ward,
                    district: address.district,
                    province: address.province,
                    isDefault: address.isDefault,
                  });
                }}
              >
                Sửa
              </button>
              <button
                type="button"
                className="text-link"
                disabled={busy || !writesEnabled}
                onClick={() => void removeAddress(address.id)}
              >
                Xoá
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div aria-labelledby="password-title">
        <h2 id="password-title">Đổi mật khẩu</h2>
        <form onSubmit={changePassword}>
          <label className="field">
            Mật khẩu hiện tại
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          <label className="field">
            Mật khẩu mới
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </label>
          <label className="field">
            Nhập lại mật khẩu mới
            <input
              name="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              required
            />
          </label>
          <p>Mật khẩu mới tối thiểu 10 ký tự; sau khi đổi bạn sẽ đăng xuất.</p>
          <button className="button" disabled={busy || !writesEnabled}>
            Đổi mật khẩu
          </button>
        </form>
      </div>
      <div aria-labelledby="cart-title">
        <h2 id="cart-title">Túi hoa trong tài khoản</h2>
        {serverCart.length === 0 ? (
          <p>Chưa có dòng sản phẩm nào.</p>
        ) : (
          <ul>
            {serverCart.map((line) => (
              <li key={line.id}>
                {line.productName} · {line.quantity} · {line.lineTotal.toLocaleString('vi-VN')}đ{' '}
                <button
                  type="button"
                  className="text-link"
                  disabled={cartBusy || !writesEnabled}
                  onClick={() => void setServerQuantity(line, line.quantity - 1)}
                >
                  −
                </button>
                <button
                  type="button"
                  className="text-link"
                  disabled={cartBusy || !writesEnabled}
                  onClick={() => void setServerQuantity(line, line.quantity + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="text-link"
                  disabled={cartBusy || !writesEnabled}
                  onClick={() => void setServerQuantity(line, 0)}
                >
                  Xoá
                </button>
              </li>
            ))}
          </ul>
        )}
        <p>
          Không tự động gộp túi cục bộ và túi tài khoản. Số lượng mỗi dòng được giới hạn 20 trên
          trang này.
        </p>
        <button
          className="button"
          type="button"
          disabled={cartBusy || !writesEnabled}
          onClick={() => void saveLocalToAccount()}
        >
          Lưu túi cục bộ vào tài khoản
        </button>
        <button
          className="text-link"
          type="button"
          disabled={cartBusy}
          onClick={restoreAccountToLocal}
        >
          Khôi phục túi tài khoản về máy
        </button>
      </div>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
