'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Flower2,
  Package,
  CalendarDays,
  Sparkles,
  CreditCard,
  LogOut,
  ArrowUpRight,
  ShieldAlert,
  Lock,
  ArrowRight,
  User,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import type { StaffUser } from './types';
import StaffOrderManager from './order-manager';
import StaffWorkshopRoster from './workshop-roster';
import StaffCustomOrders from './custom-orders';
import StaffCounterPos from './counter-pos';

export default function StaffWorkspace() {
  const router = useRouter();
  const [user, setUser] = useState<StaffUser | null>(null);
  const [authStatus, setAuthStatus] = useState<
    'loading' | 'unauthenticated' | 'forbidden' | 'authorized'
  >('loading');
  const [activeTab, setActiveTab] = useState<'orders' | 'workshops' | 'custom' | 'pos'>('orders');

  // Staff Login Form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');

  const checkAuth = useCallback(async () => {
    setAuthStatus('loading');
    setLoginError('');
    try {
      const me = await storeRequest<StaffUser>('auth/me');
      if (!me) {
        setAuthStatus('unauthenticated');
        return;
      }
      setUser(me);
      const role = me.role?.toLowerCase();
      if (role === 'staff' || role === 'admin') {
        setAuthStatus('authorized');
      } else {
        setAuthStatus('forbidden');
      }
    } catch {
      setAuthStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const handleStaffLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError('');
    try {
      await storeRequest(
        'auth/login',
        { email: loginEmail.trim(), password: loginPassword },
        'POST',
      );
      await checkAuth();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Đăng nhập nhân viên không thành công.');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await storeRequest('auth/logout', {}, 'POST');
    } catch {
      // ignore
    }
    setUser(null);
    setAuthStatus('unauthenticated');
  };

  // State 1: Loading
  if (authStatus === 'loading') {
    return (
      <div className="staff-guard-screen">
        <div className="staff-loading-box">
          <RefreshCw size={28} className="spin-anim" />
          <p>Đang kiểm tra phiên làm việc nhân viên…</p>
        </div>
      </div>
    );
  }

  // State 2: Unauthenticated (Staff Login Form)
  if (authStatus === 'unauthenticated') {
    return (
      <div className="staff-guard-screen">
        <div className="staff-guard-card">
          <div className="staff-guard-head">
            <Flower2 size={32} className="staff-brand-icon" />
            <span className="staff-eyebrow">TIỆM HOA CÓ GU</span>
            <h2>Bàn làm việc Nhân viên</h2>
            <p className="staff-muted">
              Đăng nhập tài khoản nhân viên (Staff) hoặc Quản trị viên (Admin) để thực hiện giao
              nhận hoa và điểm danh workshop.
            </p>
          </div>

          {loginError && (
            <div className="staff-alert error" role="alert">
              <AlertCircle size={16} />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleStaffLogin} className="staff-guard-form">
            <label className="staff-field">
              <span>Email nhân viên</span>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="staff@tiemhoacogu.vn"
                className="staff-input"
                autoComplete="email"
                required
              />
            </label>

            <label className="staff-field">
              <span>Mật khẩu</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••"
                className="staff-input"
                autoComplete="current-password"
                required
              />
            </label>

            <button
              type="submit"
              className="staff-btn staff-btn-primary"
              style={{ width: '100%', height: '42px' }}
              disabled={loginBusy}
            >
              {loginBusy ? 'Đang xác thực…' : 'Đăng nhập vào ca làm việc'} <ArrowRight size={16} />
            </button>
          </form>

          <div className="staff-guard-footer">
            <Link href="/" className="staff-link-btn">
              Quay lại trang chủ cửa tiệm <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // State 3: Forbidden (Logged in as normal customer)
  if (authStatus === 'forbidden') {
    return (
      <div className="staff-guard-screen">
        <div className="staff-guard-card">
          <ShieldAlert size={36} style={{ color: '#dc2626', margin: '0 auto 12px' }} />
          <h2>Không có quyền nhân viên</h2>
          <p className="staff-muted">
            Tài khoản hiện tại của bạn ({user?.email}) mang vai trò <strong>Khách hàng</strong>,
            không thể truy cập không gian điều phối của nhân viên.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '18px' }}>
            <Link href="/tai-khoan" className="staff-btn staff-btn-primary">
              Về trang cá nhân & lịch workshop <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="staff-btn staff-btn-secondary"
            >
              Đăng xuất để đổi tài khoản
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State 4: Authorized Staff Workspace
  return (
    <div className="staff-shell">
      {/* Top Staff Navigation Header */}
      <header className="staff-top-header">
        <div className="staff-top-container">
          <div className="staff-header-left">
            <Link href="/nhan-vien" className="staff-brand-wordmark">
              <Flower2 size={24} aria-hidden="true" />
              <span>
                <strong>TIỆM HOA CÓ GU</strong>
                <small>BÀN LÀM VIỆC NHÂN VIÊN</small>
              </span>
            </Link>
          </div>

          <div className="staff-header-tabs">
            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <Package size={17} />
              <span>Đơn hàng & Giao vận</span>
            </button>
            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'workshops' ? 'active' : ''}`}
              onClick={() => setActiveTab('workshops')}
            >
              <CalendarDays size={17} />
              <span>Lớp học & Điểm danh</span>
            </button>
            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'custom' ? 'active' : ''}`}
              onClick={() => setActiveTab('custom')}
            >
              <Sparkles size={17} />
              <span>Bó hoa Đặt riêng</span>
            </button>
            <button
              type="button"
              className={`staff-nav-tab ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <CreditCard size={17} />
              <span>Thu ngân tại quầy</span>
            </button>
          </div>

          <div className="staff-header-right">
            <div className="staff-user-chip">
              <User size={15} />
              <span>{user?.fullName || user?.email}</span>
              <span className="staff-chip-badge">{user?.role}</span>
            </div>

            <Link href="/" target="_blank" className="staff-icon-btn" title="Mở trang khách xem">
              <ArrowUpRight size={16} />
            </Link>

            <button
              type="button"
              onClick={() => void handleLogout()}
              className="staff-icon-btn"
              title="Đăng xuất khỏi ca"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="staff-main-content">
        <div className="staff-content-wrapper">
          {activeTab === 'orders' && <StaffOrderManager />}
          {activeTab === 'workshops' && <StaffWorkshopRoster />}
          {activeTab === 'custom' && <StaffCustomOrders />}
          {activeTab === 'pos' && <StaffCounterPos />}
        </div>
      </main>
    </div>
  );
}
