'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, type FormEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Package,
  Sparkles,
  Settings,
  LogOut,
  ArrowRight,
  Shield,
  Plus,
  Trash2,
  Edit3,
  UserCheck,
  Flower2,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ListFilter,
  ScrollText,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import { useStore } from '@/components/store-provider';
import FloralCalendarPopover from './staff/floral-calendar-popover';

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
type Booking = {
  id: string;
  sessionId: string;
  bookingCode: string;
  customerName: string;
  ticketCount: number;
  totalAmount: number;
  depositAmount: number;
  remainingAmount: number;
  bookingStatus: string;
  holdExpiresAt: string;
  checkedInAt?: string;
  createdAt: string;
};
type WorkshopItem = {
  id: string;
  name: string;
  code: string;
  basePrice: number;
};
type SessionItem = {
  id: string;
  workshopId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
};
type OrderItem = {
  id: string;
  orderCode: string;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  createdAt: string;
};
type CustomRequestItem = {
  id: string;
  description?: string;
  status: string;
  createdAt: string;
  quoteAmount?: number;
};

const emptyAddress = {
  receiverName: '',
  receiverPhone: '',
  detailAddress: '',
  ward: '',
  district: '',
  province: '',
  isDefault: false,
};

function formatMoney(n?: number) {
  if (typeof n !== 'number') return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

function formatDateLong(d: Date) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString('vi-VN');
  }
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

function statusBadgeClass(status?: string) {
  const s = (status || '').toLowerCase();
  if (['confirmed', 'paid', 'completed'].includes(s)) return 'confirmed';
  if (['hold', 'pending', 'processing'].includes(s)) return 'hold';
  if (['cancelled', 'failed'].includes(s)) return 'cancelled';
  return 'attended';
}

function statusLabel(status?: string) {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'confirmed':
      return 'Đã xác nhận';
    case 'hold':
      return 'Đang giữ chỗ';
    case 'cancelled':
      return 'Đã hủy';
    case 'attended':
    case 'checkedin':
      return 'Đã tham gia';
    case 'pending':
      return 'Chờ thanh toán';
    case 'processing':
      return 'Đang chuẩn bị';
    case 'shipping':
      return 'Đang giao hoa';
    case 'completed':
      return 'Hoàn thành';
    default:
      return status || '—';
  }
}

// Calendar Date Math Helpers
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  // day: 0 is Sun, 1 is Mon, ... 6 is Sat
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function toISODateInput(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const dayNamesVi = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function Account() {
  const router = useRouter();
  const store = useStore();

  const [user, setUser] = useState<User | null>(null);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [activeTab, setActiveTab] = useState<'workshops' | 'orders' | 'custom' | 'settings'>('workshops');

  // Customer Data
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, { workshopName: string; session: SessionItem }>>({});
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomRequestItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [serverCart, setServerCart] = useState<CartLine[]>([]);

  // Weekly Calendar Navigation State
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [calendarViewMode, setCalendarViewMode] = useState<'weekly' | 'all' | 'history'>('weekly');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'attended' | 'cancelled' | 'expired'>('all');

  // UI state
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [busy, setBusy] = useState(false);

  // Helper to extract session Date from a booking
  const getBookingDate = (booking: Booking): Date => {
    const session = sessionsMap[booking.sessionId]?.session;
    if (session?.sessionDate) {
      return new Date(session.sessionDate);
    }
    return new Date(booking.createdAt);
  };

  // Load user profile & auto-redirect admin
  const loadAccount = async () => {
    try {
      const me = await storeRequest<User>('auth/me');
      setUser(me);
      if (me?.role?.toLowerCase() === 'admin') {
        router.replace('/quan-tri');
        return;
      }
      if (me?.role?.toLowerCase() === 'staff') {
        router.replace('/nhan-vien');
        return;
      }
      await loadCustomerData();
    } catch {
      setUser(null);
    } finally {
      setLoadingInitial(false);
    }
  };

  // Load all customer portal data (workshops, orders, custom, addresses)
  const loadCustomerData = async () => {
    setLoadingData(true);
    try {
      // 1. Fetch bookings, addresses, orders, cart
      const [nextBookings, nextAddresses, nextOrders, nextCustom, nextCart] = await Promise.all([
        storeRequest<Booking[]>('bookings').catch(() => []),
        storeRequest<Address[]>('addresses').catch(() => []),
        storeRequest<OrderItem[]>('orders').catch(() => []),
        storeRequest<CustomRequestItem[]>('custom-orders').catch(() => []),
        storeRequest<CartLine[]>('cart').catch(() => []),
      ]);

      const validBookings = nextBookings || [];
      setBookings(validBookings);
      setAddresses(nextAddresses || []);
      setOrders(nextOrders || []);
      setCustomOrders(nextCustom || []);
      setServerCart(nextCart || []);

      // 2. Fetch workshop & session details to enrich booking cards
      try {
        const workshopsList = await storeRequest<WorkshopItem[]>('workshops');
        const mapping: Record<string, { workshopName: string; session: SessionItem }> = {};

        await Promise.all(
          (workshopsList || []).map(async (ws) => {
            try {
              const sessions = await storeRequest<SessionItem[]>(`workshops/${ws.id}/sessions`);
              (sessions || []).forEach((sess) => {
                mapping[sess.id] = { workshopName: ws.name, session: sess };
              });
            } catch {
              // ignore session load failure
            }
          })
        );
        setSessionsMap(mapping);

        // If there is an upcoming booking in the current week, select that day by default
        const today = new Date();
        const thisMon = getMonday(today);
        const thisWeek = getWeekDays(thisMon);
        const bookingInThisWeek = validBookings.find((b) => {
          const s = mapping[b.sessionId]?.session;
          const bDate = s?.sessionDate ? new Date(s.sessionDate) : new Date(b.createdAt);
          return thisWeek.some((wd) => isSameDay(wd, bDate));
        });

        if (bookingInThisWeek) {
          const s = mapping[bookingInThisWeek.sessionId]?.session;
          const targetDate = s?.sessionDate ? new Date(s.sessionDate) : new Date(bookingInThisWeek.createdAt);
          setSelectedDate(targetDate);
        }
      } catch {
        // ignore workshops load failure
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    void loadAccount();
  }, []);

  // Handle Login / Register
  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    setMessage('');
    setIsError(false);
    try {
      await storeRequest(`auth/${mode}`, data);
      await loadAccount();
      setMessage(mode === 'login' ? 'Đăng nhập thành công.' : 'Tạo tài khoản thành công.');
      form.reset();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Đã có lỗi xảy ra.');
    } finally {
      setBusy(false);
    }
  };

  // Handle Logout
  const logout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await storeRequest('auth/logout', {});
    } catch {
      // clear local state anyway
    } finally {
      setUser(null);
      setBookings([]);
      setOrders([]);
      setAddresses([]);
      setServerCart([]);
      setBusy(false);
      setMessage('Đã đăng xuất.');
      setIsError(false);
    }
  };

  // Handle Save Address
  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !user) return;
    setBusy(true);
    setMessage('');
    setIsError(false);
    try {
      await storeRequest(
        editingId ? `addresses/${editingId}` : 'addresses',
        addressForm,
        editingId ? 'PUT' : 'POST'
      );
      setEditingId(null);
      setAddressForm(emptyAddress);
      setAddresses(await storeRequest<Address[]>('addresses'));
      setMessage('Đã cập nhật sổ địa chỉ thành công.');
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Không thể lưu địa chỉ.');
    } finally {
      setBusy(false);
    }
  };

  // Handle Remove Address
  const removeAddress = async (id: string) => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    setIsError(false);
    try {
      await storeRequest(`addresses/${id}`, undefined, 'DELETE');
      setAddresses(await storeRequest<Address[]>('addresses'));
      setMessage('Đã xóa địa chỉ.');
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Không thể xóa địa chỉ.');
    } finally {
      setBusy(false);
    }
  };

  // Handle Change Password
  const changePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setBusy(true);
    setMessage('');
    setIsError(false);
    try {
      await storeRequest('auth/change-password', payload);
      form.reset();
      setUser(null);
      setMessage('Đổi mật khẩu thành công. Vui lòng đăng nhập lại với mật khẩu mới.');
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Không thể đổi mật khẩu.');
    } finally {
      setBusy(false);
    }
  };

  // Synchronize Local Bag to Account
  const saveLocalToAccount = async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      for (const line of store.cart) {
        const productId = store.products.find((p) => p.id === line.id)?.backendId;
        if (productId) {
          await storeRequest('cart', { productId, quantity: Math.min(20, line.quantity) });
        }
      }
      setServerCart(await storeRequest<CartLine[]>('cart'));
      setMessage('Đã lưu túi hoa hiện tại vào tài khoản.');
      setIsError(false);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Không thể lưu túi hoa.');
    } finally {
      setBusy(false);
    }
  };

  // Weekly Calendar Navigation Handlers
  const handlePrevWeek = () => {
    const prev = new Date(currentWeekMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekMonday(prev);
    // select Monday of prev week by default
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekMonday);
    next.setDate(next.getDate() + 7);
    setCurrentWeekMonday(next);
    // select Monday of next week by default
    setSelectedDate(next);
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentWeekMonday(getMonday(now));
    setSelectedDate(now);
  };

  const handlePickDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    const picked = new Date(y, m - 1, d);
    setSelectedDate(picked);
    setCurrentWeekMonday(getMonday(picked));
  };

  const canCancelOrder = (order: OrderItem) => {
    const s = (order.orderStatus || '').toLowerCase();
    const p = (order.paymentStatus || '').toLowerCase();
    return s !== 'cancelled' && s !== 'expired' && s !== 'delivering' && s !== 'completed' && p === 'unpaid';
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đơn hàng hoa này không?')) return;
    setBusy(true);
    setMessage('');
    try {
      await storeRequest(`orders/${orderId}/cancel`, {}, 'POST');
      setMessage('Đã hủy đơn hàng thành công.');
      setIsError(false);
      await loadCustomerData();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Không thể hủy đơn hàng.');
    } finally {
      setBusy(false);
    }
  };

  const canCancelBooking = (booking: Booking) => {
    const s = (booking.bookingStatus || '').toLowerCase();
    return s !== 'cancelled' && s !== 'expired' && s !== 'attended' && s !== 'no_show';
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy vé tham gia workshop này không?')) return;
    setBusy(true);
    setMessage('');
    try {
      await storeRequest(`bookings/${bookingId}/cancel`, 'Khách hàng tự hủy trên tài khoản cá nhân', 'POST');
      setMessage('Đã hủy vé workshop thành công.');
      setIsError(false);
      await loadCustomerData();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : 'Không thể hủy vé workshop.');
    } finally {
      setBusy(false);
    }
  };

  // 1. Loading Initial State
  if (loadingInitial) {
    return (
      <div className="account-portal">
        <div className="skeleton-card" />
      </div>
    );
  }

  // 2. Unauthenticated Form (Login / Register)
  if (!user) {
    return (
      <div className="account-portal">
        <div className="account-auth-container">
          <div className="account-auth-header">
            <span className="eyebrow">TIỆM HOA CÓ GU</span>
            <h1>{mode === 'login' ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}</h1>
            <p>
              {mode === 'login'
                ? 'Xem lại lịch workshop đã đặt, theo dõi đơn hoa và quản lý thông tin của bạn.'
                : 'Tham gia cùng tiệm để đặt lịch workshop thuận tiện và nhận ưu đãi.'}
            </p>
          </div>

          {message && (
            <div className={`account-alert ${isError ? 'error' : 'success'}`} role="alert">
              {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={submitAuth} className="account-form-grid">
            <label className="account-field">
              <span>Email</span>
              <input
                name="email"
                type="email"
                className="account-input"
                autoComplete="email"
                placeholder="ten@vidu.com"
                required
              />
            </label>

            {mode === 'register' && (
              <>
                <label className="account-field">
                  <span>Họ và tên</span>
                  <input
                    name="fullName"
                    className="account-input"
                    autoComplete="name"
                    placeholder="Nguyễn Văn A"
                    required
                  />
                </label>
                <label className="account-field">
                  <span>Số điện thoại</span>
                  <input
                    name="phoneNumber"
                    type="tel"
                    className="account-input"
                    autoComplete="tel"
                    placeholder="0901234567"
                    required
                  />
                </label>
              </>
            )}

            <label className="account-field">
              <span>Mật khẩu</span>
              <input
                name="password"
                type="password"
                className="account-input"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="Tối thiểu 10 ký tự"
                required
                minLength={10}
              />
            </label>

            {mode === 'register' && (
              <p style={{ fontSize: '12px', color: 'var(--portal-muted)', margin: '-8px 0 0' }}>
                Mật khẩu gồm ít nhất 10 ký tự: chữ hoa, chữ thường, số và ký tự đặc biệt.
              </p>
            )}

            <button className="account-btn-primary" type="submit" disabled={busy} style={{ marginTop: '8px' }}>
              {busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              type="button"
              className="account-btn-secondary"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setMessage('');
              }}
              style={{ width: '100%' }}
            >
              {mode === 'login' ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Customer Dashboard
  const isAdmin = user.role?.toLowerCase() === 'admin';
  const isStaff = user.role?.toLowerCase() === 'staff';

  // Filter active vs cancelled/expired bookings
  const activeBookings = bookings.filter((b) => {
    const s = (b.bookingStatus || '').toLowerCase();
    return s !== 'cancelled' && s !== 'expired';
  });

  // Compute Current Week Days for Calendar
  const weekDays = getWeekDays(currentWeekMonday);
  const selectedDateActiveBookings = activeBookings.filter((b) => isSameDay(getBookingDate(b), selectedDate));
  const selectedDateBookings = selectedDateActiveBookings;
  const weekHasBookings = activeBookings.filter((b) =>
    weekDays.some((wd) => isSameDay(getBookingDate(b), wd))
  );

  // Render Workshop Ticket Card
  const renderWorkshopCard = (booking: Booking) => {
    const sessionMeta = sessionsMap[booking.sessionId];
    const workshopTitle = sessionMeta?.workshopName || 'Workshop Cắm Hoa Sáp';
    const sessionDate = sessionMeta?.session
      ? formatDate(sessionMeta.session.sessionDate)
      : formatDate(booking.createdAt);
    const sessionTime = sessionMeta?.session
      ? `${formatTime(sessionMeta.session.startTime)} - ${formatTime(sessionMeta.session.endTime)}`
      : 'Thời gian đã hẹn';
    const location = sessionMeta?.session?.location || 'Xưởng Tiệm Hoa Có Gu';

    const wsId = sessionMeta?.session?.workshopId || '';
    const detailUrl = wsId
      ? `/workshop/${wsId}?sessionId=${booking.sessionId}&bookingCode=${booking.bookingCode}`
      : `/workshop?bookingCode=${booking.bookingCode}`;

    const status = (booking.bookingStatus || '').toLowerCase();
    const isPending = status === 'pending';
    const isConfirmed = status === 'confirmed';
    const isAttended = status === 'attended';
    const isCancelled = status === 'cancelled';
    const isExpired = status === 'expired';

    return (
      <article key={booking.id} className="workshop-ticket-card">
        <div className="ticket-body" style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                MÃ VÉ: {booking.bookingCode || booking.id.slice(0, 8)}
              </span>
              <h2 className="ticket-title" style={{ fontSize: '18px', margin: '4px 0 0' }}>
                {workshopTitle}
              </h2>
            </div>
            <div>
              {isConfirmed && (
                <span className="badge-status confirmed" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                  ✅ Đã thanh toán
                </span>
              )}
              {isPending && (
                <span className="badge-status" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  ⏳ Chờ thanh toán
                </span>
              )}
              {isAttended && (
                <span className="badge-status attended" style={{ background: '#edf1fc', color: '#243db5', border: '1px solid #cbd5e1' }}>
                  ✨ Đã tham gia
                </span>
              )}
              {isCancelled && (
                <span className="badge-status" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                  ❌ Đã hủy
                </span>
              )}
              {isExpired && (
                <span className="badge-status" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                  ⚠️ Hết hạn
                </span>
              )}
            </div>
          </div>

          <div className="ticket-info-list" style={{ marginBottom: '16px' }}>
            <div className="ticket-info-row">
              <CalendarDays size={16} />
              <span>
                <strong>Ngày học:</strong> {sessionDate}
              </span>
            </div>
            <div className="ticket-info-row">
              <Clock size={16} />
              <span>
                <strong>Khung giờ:</strong> {sessionTime}
              </span>
            </div>
            <div className="ticket-info-row">
              <MapPin size={16} />
              <span>
                <strong>Địa điểm:</strong> {location}
              </span>
            </div>
          </div>

          <div
            style={{
              paddingTop: '14px',
              borderTop: '1px solid var(--portal-line)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {isPending && (
                <Link
                  href={`/thanh-toan?bookingId=${booking.id}`}
                  className="account-btn-primary"
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: '#243db5',
                    color: '#ffffff',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  Thanh toán ngay →
                </Link>
              )}
              {canCancelBooking(booking) ? (
                <button
                  type="button"
                  className="account-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px', color: '#dc2626', borderColor: '#fca5a5' }}
                  onClick={() => void handleCancelBooking(booking.id)}
                  disabled={busy}
                >
                  {isPending ? 'Hủy giữ chỗ' : 'Hủy vé'}
                </button>
              ) : null}
            </div>

          </div>
        </div>
      </article>
    );
  };

  return (
    <div className="account-portal">
      {/* Admin Notice Banner */}
      {isAdmin && (
        <div className="account-alert info" style={{ marginBottom: '24px' }}>
          <Shield size={20} />
          <div style={{ flex: 1 }}>
            <strong>Tài khoản Quản trị viên:</strong> Bạn đang truy cập bằng tài khoản quyền Admin.
          </div>
          <Link href="/quan-tri" className="account-btn-primary" style={{ padding: '6px 14px', fontSize: '12.5px' }}>
            Mở Bàn điều hành <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Staff Notice Banner */}
      {isStaff && (
        <div className="account-alert info" style={{ marginBottom: '24px' }}>
          <Sparkles size={20} />
          <div style={{ flex: 1 }}>
            <strong>Tài khoản Nhân viên:</strong> Bạn đang truy cập bằng tài khoản quyền Staff vận hành tiệm.
          </div>
          <Link href="/nhan-vien" className="account-btn-primary" style={{ padding: '6px 14px', fontSize: '12.5px' }}>
            Mở Bàn làm việc Nhân viên <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Profile Hero Card */}
      <div className="account-profile-hero">
        <div className="account-user-meta">
          <div className="account-avatar" aria-hidden="true">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'H'}
          </div>
          <div className="account-user-details">
            <h1>Xin chào, {user.fullName}</h1>
            <div className="account-user-chips">
              <span className="account-chip">
                <Mail size={14} /> {user.email}
              </span>
              <span className="account-chip">
                <Phone size={14} /> {user.phoneNumber || 'Chưa cập nhật SĐT'}
              </span>
              <span className={`account-role-badge ${isAdmin ? 'admin' : ''}`}>
                {isAdmin ? 'Quản trị viên' : isStaff ? 'Nhân viên tiệm' : 'Khách hàng thân thiết'}
              </span>
            </div>
          </div>
        </div>

        <div className="account-profile-actions">
          {isAdmin && (
            <Link href="/quan-tri" className="account-btn-primary">
              <Shield size={16} /> Bàn điều hành
            </Link>
          )}
          <button
            type="button"
            className="account-btn-secondary"
            onClick={() => void logout()}
            disabled={busy}
            title="Đăng xuất khỏi thiết bị này"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {message && (
        <div className={`account-alert ${isError ? 'error' : 'success'}`} role="alert">
          {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{message}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <nav className="account-tabs" aria-label="Khu vực quản lý">
        <button
          type="button"
          className={`account-tab-btn ${activeTab === 'workshops' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('workshops')}
        >
          <CalendarDays size={18} />
          <span>Lịch Workshop của tôi</span>
          {activeBookings.length > 0 && <span className="account-tab-badge">{activeBookings.length}</span>}
        </button>

        <button
          type="button"
          className={`account-tab-btn ${activeTab === 'orders' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          <Package size={18} />
          <span>Đơn hàng hoa</span>
          {orders.length > 0 && <span className="account-tab-badge">{orders.length}</span>}
        </button>

        <button
          type="button"
          className={`account-tab-btn ${activeTab === 'custom' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('custom')}
        >
          <Sparkles size={18} />
          <span>Hoa đặt riêng</span>
          {customOrders.length > 0 && <span className="account-tab-badge">{customOrders.length}</span>}
        </button>

        <button
          type="button"
          className={`account-tab-btn ${activeTab === 'settings' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          <span>Sổ địa chỉ & Mật khẩu</span>
        </button>
      </nav>

      {/* TAB 1: WORKSHOPS WEEKLY CALENDAR & DETAILS */}
      {activeTab === 'workshops' && (
        <div>
          {loadingData ? (
            <div className="account-cards-grid">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ) : activeBookings.length === 0 ? (
            <div className="account-empty-box">
              <div className="account-empty-icon">
                <CalendarDays size={28} />
              </div>
              <h3>Bạn chưa đăng ký buổi workshop nào</h3>
              <p>
                Tham gia các buổi workshop cắm hoa sáp cuối tuần để tự tay tạo nên những tác phẩm
                hoa ý nghĩa và thư giãn cùng Tiệm Hoa Có Gu.
              </p>
              <Link href="/workshop" className="account-btn-primary">
                Xem lịch các lớp workshop <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div>
              {/* WEEKLY CALENDAR CARD */}
              <div className="account-calendar-card">
                {/* Toolbar */}
                <div className="calendar-toolbar">
                  <div className="calendar-week-title">
                    <h3>
                      Tuần {formatDate(weekDays[0].toISOString())} — {formatDate(weekDays[6].toISOString())}
                    </h3>
                    <span>
                      Tháng {currentWeekMonday.getMonth() + 1}, {currentWeekMonday.getFullYear()}
                    </span>
                  </div>

                  <div className="calendar-nav-controls">
                    {/* View Switcher: Weekly vs All */}
                    <div className="calendar-view-toggle">
                      <button
                        type="button"
                        className={calendarViewMode === 'weekly' ? 'is-active' : ''}
                        onClick={() => setCalendarViewMode('weekly')}
                      >
                        Lịch theo tuần
                      </button>
                      <button
                        type="button"
                        className={calendarViewMode === 'all' ? 'is-active' : ''}
                        onClick={() => setCalendarViewMode('all')}
                      >
                        Lớp đang học ({activeBookings.length})
                      </button>
                      <button
                        type="button"
                        className={calendarViewMode === 'history' ? 'is-active' : ''}
                        onClick={() => setCalendarViewMode('history')}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      >
                        <ScrollText size={13} /> Nhật ký vé ({bookings.length})
                      </button>
                    </div>

                    {calendarViewMode === 'weekly' && (
                      <>
                        <button
                          type="button"
                          className="account-btn-secondary"
                          onClick={handleGoToday}
                          title="Về tuần hiện tại"
                        >
                          Hôm nay
                        </button>

                        <button
                          type="button"
                          className="account-btn-secondary"
                          onClick={handlePrevWeek}
                          aria-label="Tuần trước"
                          title="Tuần trước"
                        >
                          <ChevronLeft size={16} />
                        </button>

                        <button
                          type="button"
                          className="account-btn-secondary"
                          onClick={handleNextWeek}
                          aria-label="Tuần sau"
                          title="Tuần sau"
                        >
                          <ChevronRight size={16} />
                        </button>

                        {/* Date Picker Input */}
                        <FloralCalendarPopover
                          selectedDate={selectedDate}
                          onSelectDate={(newDate) => {
                            setSelectedDate(newDate);
                            setCurrentWeekMonday(getMonday(newDate));
                          }}
                          sessionsDates={activeBookings.map((b) => getBookingDate(b).toISOString())}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* 7-Day Weekly Calendar Strip */}
                {calendarViewMode === 'weekly' && (
                  <div className="calendar-week-grid" role="grid" aria-label="Lịch theo tuần">
                    {weekDays.map((day, idx) => {
                      const dayBookings = activeBookings.filter((b) => isSameDay(getBookingDate(b), day));
                      const hasEvents = dayBookings.length > 0;
                      const isSelected = isSameDay(day, selectedDate);
                      const today = isToday(day);

                      return (
                        <div
                          key={day.toISOString()}
                          className={`calendar-day-cell ${isSelected ? 'is-selected' : ''} ${today ? 'is-today' : ''} ${hasEvents ? 'has-events' : ''}`}
                          onClick={() => setSelectedDate(day)}
                          role="gridcell"
                          tabIndex={0}
                          aria-selected={isSelected}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedDate(day);
                            }
                          }}
                        >
                          {today && <span className="calendar-today-badge">Hôm nay</span>}
                          <span className="day-name">{dayNamesVi[idx]}</span>
                          <span className="day-num">{day.getDate()}</span>
                          <div className="day-event-dot-wrap">
                            {hasEvents && (
                              <>
                                <span className="event-dot" title={`${dayBookings.length} buổi học`} />
                                <span className="event-count-pill">{dayBookings.length} lớp</span>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* DETAILS SECTION */}
              {calendarViewMode === 'weekly' ? (
                <div>
                  <div className="calendar-day-detail-header">
                    <h3>
                      <CalendarDays size={18} /> Chi tiết lịch học: {formatDateLong(selectedDate)}
                    </h3>
                    <span
                      className={`badge-status ${selectedDateBookings.length > 0 ? 'confirmed' : 'attended'}`}
                    >
                      {selectedDateActiveBookings.length} buổi học
                    </span>
                  </div>

                  {selectedDateBookings.length > 0 ? (
                    <div className="account-cards-grid">
                      {selectedDateBookings.map((b) => renderWorkshopCard(b))}
                    </div>
                  ) : (
                    <div>
                      <div className="account-empty-box" style={{ padding: '36px 20px', margin: '0 0 16px' }}>
                        <div className="account-empty-icon" style={{ marginBottom: '12px' }}>
                          <CalendarDays size={24} />
                        </div>
                        <h3>Không có lịch workshop vào ngày này</h3>
                        <p>Bạn không có ca học nào được xếp lịch vào ngày {formatDateLong(selectedDate)}.</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : calendarViewMode === 'all' ? (
                /* ALL ENROLLED WORKSHOPS LIST */
                <div className="account-cards-grid">
                  {activeBookings.map((booking) => renderWorkshopCard(booking))}
                </div>
              ) : (
                /* TICKET STATUS AUDIT LOG & HISTORY VIEW */
                <div className="account-history-view">
                  <div style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#1c2326' }}>
                      Nhật ký trạng thái & Lịch sử vé
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                      Toàn bộ lịch sử giữ chỗ, thanh toán, hủy vé và tham gia workshop của bạn.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
                    <button
                      type="button"
                      style={{
                        background: historyStatusFilter === 'all' ? '#1c2326' : '#ffffff',
                        color: historyStatusFilter === 'all' ? '#ffffff' : '#334155',
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                      }}
                      onClick={() => setHistoryStatusFilter('all')}
                    >
                      Tất cả ({bookings.length})
                    </button>
                    <button
                      type="button"
                      style={{
                        background: historyStatusFilter === 'pending' ? '#b45309' : '#ffffff',
                        color: historyStatusFilter === 'pending' ? '#ffffff' : '#b45309',
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        border: '1px solid #fde68a',
                        cursor: 'pointer',
                      }}
                      onClick={() => setHistoryStatusFilter('pending')}
                    >
                      Chờ thanh toán ({bookings.filter((b) => (b.bookingStatus || '').toLowerCase() === 'pending').length})
                    </button>
                    <button
                      type="button"
                      style={{
                        background: historyStatusFilter === 'confirmed' ? '#047857' : '#ffffff',
                        color: historyStatusFilter === 'confirmed' ? '#ffffff' : '#047857',
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        border: '1px solid #a7f3d0',
                        cursor: 'pointer',
                      }}
                      onClick={() => setHistoryStatusFilter('confirmed')}
                    >
                      Đã thanh toán ({bookings.filter((b) => (b.bookingStatus || '').toLowerCase() === 'confirmed').length})
                    </button>
                    <button
                      type="button"
                      style={{
                        background: historyStatusFilter === 'attended' ? '#243db5' : '#ffffff',
                        color: historyStatusFilter === 'attended' ? '#ffffff' : '#243db5',
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        border: '1px solid #cbd5e1',
                        cursor: 'pointer',
                      }}
                      onClick={() => setHistoryStatusFilter('attended')}
                    >
                      Đã tham gia ({bookings.filter((b) => (b.bookingStatus || '').toLowerCase() === 'attended').length})
                    </button>
                    <button
                      type="button"
                      style={{
                        background: historyStatusFilter === 'cancelled' ? '#b91c1c' : '#ffffff',
                        color: historyStatusFilter === 'cancelled' ? '#ffffff' : '#b91c1c',
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        border: '1px solid #fecaca',
                        cursor: 'pointer',
                      }}
                      onClick={() => setHistoryStatusFilter('cancelled')}
                    >
                      Đã hủy ({bookings.filter((b) => (b.bookingStatus || '').toLowerCase() === 'cancelled').length})
                    </button>
                    <button
                      type="button"
                      style={{
                        background: historyStatusFilter === 'expired' ? '#475569' : '#ffffff',
                        color: historyStatusFilter === 'expired' ? '#ffffff' : '#475569',
                        borderRadius: '9999px',
                        padding: '6px 14px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        border: '1px solid #e2e8f0',
                        cursor: 'pointer',
                      }}
                      onClick={() => setHistoryStatusFilter('expired')}
                    >
                      Hết hạn ({bookings.filter((b) => (b.bookingStatus || '').toLowerCase() === 'expired').length})
                    </button>
                  </div>

                  {/* History Log List */}
                  {bookings.filter((b) => historyStatusFilter === 'all' || (b.bookingStatus || '').toLowerCase() === historyStatusFilter).length === 0 ? (
                    <div className="account-empty-box" style={{ padding: '36px 20px' }}>
                      <ScrollText size={28} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                      <h3>Không có nhật ký nào phù hợp</h3>
                      <p>Không có vé nào thuộc bộ lọc trạng thái bạn đã chọn.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {bookings
                        .filter((b) => historyStatusFilter === 'all' || (b.bookingStatus || '').toLowerCase() === historyStatusFilter)
                        .map((b) => {
                          const sessionMeta = sessionsMap[b.sessionId];
                          const workshopTitle = sessionMeta?.workshopName || 'Workshop Cắm Hoa Sáp';
                          const sessionDate = sessionMeta?.session
                            ? formatDate(sessionMeta.session.sessionDate)
                            : formatDate(b.createdAt);
                          const sessionTime = sessionMeta?.session
                            ? `${formatTime(sessionMeta.session.startTime)} - ${formatTime(sessionMeta.session.endTime)}`
                            : 'Thời gian đã hẹn';
                          const location = sessionMeta?.session?.location || 'Xưởng Tiệm Hoa Có Gu';
                          const st = (b.bookingStatus || '').toLowerCase();
                          const isPending = st === 'pending';
                          const isConfirmed = st === 'confirmed';
                          const isAttended = st === 'attended';
                          const isCancelled = st === 'cancelled';
                          const isExpired = st === 'expired';

                          return (
                            <div
                              key={b.id}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '16px',
                                padding: '18px 22px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#243db5', fontSize: '14.5px' }}>
                                    {b.bookingCode || b.id.slice(0, 8)}
                                  </span>
                                  <span style={{ color: '#cbd5e1' }}>·</span>
                                  <strong style={{ fontSize: '15.5px', color: '#1c2326' }}>{workshopTitle}</strong>
                                </div>
                                <div>
                                  {isConfirmed && (
                                    <span className="badge-status confirmed" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                                      ✅ Đã thanh toán
                                    </span>
                                  )}
                                  {isPending && (
                                    <span className="badge-status" style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                                      ⏳ Chờ thanh toán
                                    </span>
                                  )}
                                  {isAttended && (
                                    <span className="badge-status attended" style={{ background: '#edf1fc', color: '#243db5', border: '1px solid #cbd5e1' }}>
                                      ✨ Đã tham gia
                                    </span>
                                  )}
                                  {isCancelled && (
                                    <span className="badge-status" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                                      ❌ Đã hủy
                                    </span>
                                  )}
                                  {isExpired && (
                                    <span className="badge-status" style={{ background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0' }}>
                                      ⚠️ Hết hạn
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '13px', color: '#475569' }}>
                                <div><strong>Ca học:</strong> {sessionDate} ({sessionTime})</div>
                                <div><strong>Địa điểm:</strong> {location}</div>
                                <div><strong>Số lượng & Phí:</strong> {b.ticketCount} vé · {formatMoney(b.totalAmount)}</div>
                              </div>

                              {/* Timeline log */}
                              <div
                                style={{
                                  background: '#f8fafc',
                                  borderRadius: '10px',
                                  padding: '10px 14px',
                                  fontSize: '12px',
                                  color: '#64748b',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '4px',
                                  lineHeight: 1.5,
                                }}
                              >
                                <div>🕒 <strong>Khởi tạo yêu cầu giữ chỗ:</strong> {formatDate(b.createdAt)}</div>
                                {isConfirmed && <div>💳 <strong>Thanh toán:</strong> Đã ghi nhận thanh toán · Đủ điều kiện vào lớp</div>}
                                {b.checkedInAt && <div>✨ <strong>Điểm danh:</strong> Học viên đã check-in vào lớp lúc {formatDate(b.checkedInAt)}</div>}
                                {isCancelled && <div>❌ <strong>Trạng thái hủy:</strong> Khách hàng đã hủy giữ chỗ (Ca học được giải phóng cho học viên khác)</div>}
                                {isExpired && <div>⚠️ <strong>Trạng thái hết hạn:</strong> Quá hạn thanh toán 10 phút, hệ thống tự động hoàn lại chỗ trống</div>}
                              </div>

                              {/* Actions if pending */}
                              {isPending && (
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '6px', borderTop: '1px solid #f1f5f9' }}>
                                  <Link
                                    href={`/thanh-toan?bookingId=${b.id}`}
                                    className="account-btn-primary"
                                    style={{
                                      padding: '6px 14px',
                                      fontSize: '12px',
                                      fontWeight: 700,
                                      background: '#243db5',
                                      color: '#ffffff',
                                      borderRadius: '8px',
                                      textDecoration: 'none',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                    }}
                                  >
                                    Thanh toán ngay →
                                  </Link>
                                  <button
                                    type="button"
                                    className="account-btn-secondary"
                                    style={{ padding: '6px 12px', fontSize: '12px', color: '#dc2626', borderColor: '#fca5a5' }}
                                    onClick={() => void handleCancelBooking(b.id)}
                                    disabled={busy}
                                  >
                                    Hủy giữ chỗ
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === 'orders' && (
        <div>
          {loadingData ? (
            <div className="skeleton-card" />
          ) : orders.length === 0 ? (
            <div className="account-empty-box">
              <div className="account-empty-icon">
                <Package size={28} />
              </div>
              <h3>Chưa có đơn hàng nào</h3>
              <p>Tất cả các đơn đặt hoa sáp và phụ kiện của bạn sẽ xuất hiện tại đây.</p>
              <Link href="/cua-tiem" className="account-btn-primary">
                Ghé cửa tiệm chọn hoa <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="account-cards-grid">
              {orders.map((order) => (
                <article key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <h3 className="order-code-title">Đơn hàng #{order.orderCode}</h3>
                      <p className="order-date">Đặt ngày {formatDate(order.createdAt)}</p>
                    </div>
                    <span className={`badge-status ${statusBadgeClass(order.orderStatus)}`}>
                      {statusLabel(order.orderStatus)}
                    </span>
                  </div>

                  <div className="order-items-preview">
                    <span>Thanh toán: <strong>{statusLabel(order.paymentStatus)}</strong></span>
                  </div>

                  <div className="order-card-footer">
                    <div>
                      <span style={{ fontSize: '12px', color: 'var(--portal-muted)' }}>Tổng thanh toán: </span>
                      <strong style={{ color: 'var(--portal-accent)', fontSize: '16px' }}>
                        {formatMoney(order.totalAmount)}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {canCancelOrder(order) && (
                        <button
                          type="button"
                          className="account-btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '12px', color: '#dc2626', borderColor: '#fca5a5' }}
                          onClick={() => void handleCancelOrder(order.id)}
                          disabled={busy}
                        >
                          Hủy đơn
                        </button>
                      )}
                      <Link
                        href="/tra-cuu"
                        className="account-btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                      >
                        Theo dõi <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CUSTOM REQUESTS */}
      {activeTab === 'custom' && (
        <div>
          {customOrders.length === 0 ? (
            <div className="account-empty-box">
              <div className="account-empty-icon">
                <Sparkles size={28} />
              </div>
              <h3>Chưa có yêu cầu làm hoa riêng</h3>
              <p>Bạn có thể gửi yêu cầu cắm hoa theo màu sắc, kích thước và thông điệp cá nhân.</p>
              <Link href="/dat-rieng" className="account-btn-primary">
                Gửi yêu cầu hoa đặt riêng <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="account-cards-grid">
              {customOrders.map((req) => (
                <article key={req.id} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <h3 className="order-code-title">Yêu cầu đặt hoa</h3>
                      <p className="order-date">Gửi ngày {formatDate(req.createdAt)}</p>
                    </div>
                    <span className={`badge-status ${statusBadgeClass(req.status)}`}>
                      {statusLabel(req.status)}
                    </span>
                  </div>

                  <p style={{ fontSize: '13.5px', color: 'var(--portal-ink)', margin: '8px 0' }}>
                    {req.description || 'Không có mô tả chi tiết.'}
                  </p>

                  <div className="order-card-footer">
                    <span style={{ fontSize: '13px', color: 'var(--portal-muted)' }}>
                      {req.quoteAmount ? `Báo giá: ${formatMoney(req.quoteAmount)}` : 'Đang chờ tiệm báo giá'}
                    </span>
                    <Link
                      href="/tra-cuu"
                      className="account-btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      Xem chi tiết
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS (ADDRESSES & PASSWORD) */}
      {activeTab === 'settings' && (
        <div className="account-settings-grid">
          {/* Left Column: Sổ địa chỉ */}
          <div className="settings-box">
            <h2>Sổ địa chỉ nhận hàng</h2>
            <p className="box-desc">Lưu các địa chỉ nhận hoa để thanh toán nhanh hơn.</p>

            <div className="saved-addresses-list">
              {addresses.length === 0 ? (
                <p style={{ fontSize: '13.5px', color: 'var(--portal-muted)' }}>
                  Chưa có địa chỉ nào được lưu.
                </p>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`address-item-card ${addr.isDefault ? 'is-default' : ''}`}
                  >
                    <div className="address-item-details">
                      <div>
                        <strong>{addr.receiverName}</strong> · <span>{addr.receiverPhone}</span>
                        {addr.isDefault && (
                          <span className="badge-status confirmed" style={{ marginLeft: '8px' }}>
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div style={{ color: 'var(--portal-muted)', marginTop: '4px' }}>
                        {addr.detailAddress}, {addr.ward ? `${addr.ward}, ` : ''}{addr.district ? `${addr.district}, ` : ''}{addr.province}
                      </div>
                    </div>

                    <div className="address-item-actions">
                      <button
                        type="button"
                        className="account-btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => {
                          setEditingId(addr.id);
                          setAddressForm({
                            receiverName: addr.receiverName,
                            receiverPhone: addr.receiverPhone,
                            detailAddress: addr.detailAddress,
                            ward: addr.ward,
                            district: addr.district,
                            province: addr.province,
                            isDefault: addr.isDefault,
                          });
                        }}
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        className="account-btn-danger"
                        style={{ padding: '6px 10px', fontSize: '12px' }}
                        onClick={() => void removeAddress(addr.id)}
                        disabled={busy}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Address Form */}
            <form onSubmit={saveAddress} className="account-form-grid" style={{ borderTop: '1px solid var(--portal-line)', paddingTop: '20px' }}>
              <h3 style={{ fontSize: '15px', margin: 0 }}>
                {editingId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ nhận hoa mới'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <label className="account-field">
                  <span>Người nhận</span>
                  <input
                    value={addressForm.receiverName}
                    onChange={(e) => setAddressForm({ ...addressForm, receiverName: e.target.value })}
                    className="account-input"
                    placeholder="Họ tên người nhận"
                    required
                  />
                </label>
                <label className="account-field">
                  <span>Số điện thoại</span>
                  <input
                    value={addressForm.receiverPhone}
                    onChange={(e) => setAddressForm({ ...addressForm, receiverPhone: e.target.value })}
                    className="account-input"
                    placeholder="090..."
                    required
                  />
                </label>
              </div>

              <label className="account-field">
                <span>Địa chỉ chi tiết (Số nhà, tên đường)</span>
                <input
                  value={addressForm.detailAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, detailAddress: e.target.value })}
                  className="account-input"
                  placeholder="Ví dụ: 123 Đường Nguyễn Huệ"
                  required
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <label className="account-field">
                  <span>Phường / Xã</span>
                  <input
                    value={addressForm.ward}
                    onChange={(e) => setAddressForm({ ...addressForm, ward: e.target.value })}
                    className="account-input"
                    placeholder="Phường..."
                  />
                </label>
                <label className="account-field">
                  <span>Quận / Huyện</span>
                  <input
                    value={addressForm.district}
                    onChange={(e) => setAddressForm({ ...addressForm, district: e.target.value })}
                    className="account-input"
                    placeholder="Quận..."
                  />
                </label>
                <label className="account-field">
                  <span>Tỉnh / TP</span>
                  <input
                    value={addressForm.province}
                    onChange={(e) => setAddressForm({ ...addressForm, province: e.target.value })}
                    className="account-input"
                    placeholder="TP.HCM..."
                    required
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button type="submit" className="account-btn-primary" disabled={busy}>
                  {editingId ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ mới'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="account-btn-secondary"
                    onClick={() => {
                      setEditingId(null);
                      setAddressForm(emptyAddress);
                    }}
                  >
                    Hủy bỏ
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Right Column: Đổi mật khẩu & Đồng bộ giỏ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Change Password Box */}
            <div className="settings-box">
              <h2>Đổi mật khẩu</h2>
              <p className="box-desc">Đảm bảo mật khẩu có tối thiểu 10 ký tự an toàn.</p>

              <form onSubmit={changePassword} className="account-form-grid">
                <label className="account-field">
                  <span>Mật khẩu hiện tại</span>
                  <input
                    name="currentPassword"
                    type="password"
                    className="account-input"
                    required
                    autoComplete="current-password"
                  />
                </label>

                <label className="account-field">
                  <span>Mật khẩu mới</span>
                  <input
                    name="newPassword"
                    type="password"
                    className="account-input"
                    required
                    minLength={10}
                    autoComplete="new-password"
                  />
                </label>

                <button type="submit" className="account-btn-primary" disabled={busy}>
                  {busy ? 'Đang cập nhật…' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            </div>

            {/* Sync Bag Box */}
            <div className="settings-box">
              <h2>Đồng bộ túi hoa</h2>
              <p className="box-desc">
                Lưu giỏ hàng hiện tại vào tài khoản để mở lại trên các thiết bị khác.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13.5px', color: 'var(--portal-muted)' }}>
                  Túi trên máy: <strong>{store.cart.length} món</strong> · Đã lưu: <strong>{serverCart.length} món</strong>
                </span>
                <button
                  type="button"
                  className="account-btn-secondary"
                  onClick={() => void saveLocalToAccount()}
                  disabled={busy}
                >
                  Lưu vào tài khoản
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
