'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  CalendarDays,
  Clock3,
  MapPin,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import type { Booking, Session, Workshop } from '@/lib/api/client';
import type { StorefrontWorkshop } from '@/lib/storefront';
import { isOpenFutureSession, payloadFingerprint, remainingSeats } from '@/lib/transaction';

export type Course = StorefrontWorkshop & { detail?: Workshop };

type User = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string;
};

interface BookingDrawerProps {
  workshop: Course | null;
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

function formatPrice(amount: number) {
  return `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;
}

export default function WorkshopBookingDrawer({
  workshop,
  isOpen,
  onClose,
  imageUrl = '/images/workshop-hands.webp',
}: BookingDrawerProps) {
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const titleId = useId();

  // Load auth user info and existing bookings
  useEffect(() => {
    let active = true;
    storeRequest<User>('auth/me')
      .then(async (me) => {
        if (!active) return;
        setCurrentUser(me);
        if (me.fullName) setCustomerName(me.fullName);
        if (me.phoneNumber) setCustomerPhone(me.phoneNumber);
        if (me.email) setCustomerEmail(me.email);

        // Fetch user's existing bookings to prevent duplicate registration
        try {
          const bookings = await storeRequest<Booking[]>('bookings');
          if (active && bookings) {
            setUserBookings(bookings);
          }
        } catch {
          // ignore
        }
      })
      .catch(() => {
        // Guest user, not logged in
      })
      .finally(() => {
        if (active) setAuthChecked(true);
      });

    return () => {
      active = false;
    };
  }, []);

  // Filter open upcoming sessions
  const availableSessions = (workshop?.sessions || []).filter((s) => isOpenFutureSession(s));

  // Set of session IDs already booked by this member (active: pending or confirmed)
  const activeBookedSessionIds = new Set(
    userBookings
      .filter((b) => {
        const st = (b.bookingStatus || '').toLowerCase();
        return st !== 'cancelled' && st !== 'expired';
      })
      .map((b) => b.sessionId),
  );

  // Initialize selected session when drawer opens
  useEffect(() => {
    if (isOpen && availableSessions.length > 0) {
      // Pick first session that is NOT already booked
      const firstUnbooked = availableSessions.find((s) => !activeBookedSessionIds.has(s.id));
      if (firstUnbooked && !selectedSessionId) {
        setSelectedSessionId(firstUnbooked.id);
      } else if (!selectedSessionId) {
        setSelectedSessionId(availableSessions[0].id);
      }
    }
    if (isOpen) {
      setError('');
    }
  }, [isOpen, availableSessions, selectedSessionId, activeBookedSessionIds]);

  if (!isOpen || !workshop) return null;

  const currentSession = availableSessions.find((s) => s.id === selectedSessionId);
  const freeSeats = currentSession ? remainingSeats(currentSession) : 0;
  const maxSeatsAllowed = currentSession ? Math.max(1, Math.min(6, freeSeats)) : 1;
  const isCurrentSessionAlreadyBooked = currentSession
    ? activeBookedSessionIds.has(currentSession.id)
    : false;
  const totalPrice = workshop.basePrice * ticketCount;

  async function handleBookWorkshop(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // 1. Session validation
    if (!currentSession) {
      setError('Vui lòng chọn một ca học tại xưởng.');
      return;
    }

    // 2. Duplicate booking check
    if (activeBookedSessionIds.has(currentSession.id)) {
      setError('Bạn đã đăng ký tham gia ca học này rồi. Vui lòng kiểm tra trong Lịch học của bạn.');
      return;
    }

    // 3. Time validation (Cannot book session in the past)
    const startsAt = new Date(`${currentSession.sessionDate.slice(0, 10)}T${currentSession.startTime}`);
    if (startsAt.getTime() <= Date.now()) {
      setError('Ca học này đã bắt đầu hoặc đã qua giờ mở đăng ký.');
      return;
    }

    // 4. Capacity validation (Min/Max seats)
    if (freeSeats <= 0) {
      setError('Ca học này hiện đã đủ chỗ, không thể nhận thêm học viên.');
      return;
    }
    if (ticketCount < 1 || ticketCount > maxSeatsAllowed) {
      setError(`Số lượng vé không hợp lệ (tối thiểu 1 vé, tối đa ${maxSeatsAllowed} vé cho ca này).`);
      return;
    }

    // 5. Auth check
    if (!currentUser) {
      setError('Vui lòng đăng nhập tài khoản để xác nhận giữ chỗ.');
      return;
    }

    // 6. Name validation
    const trimmedName = customerName.trim();
    if (trimmedName.length < 2) {
      setError('Vui lòng nhập họ và tên học viên (tối thiểu 2 ký tự).');
      return;
    }

    // 7. Phone validation (Vietnamese mobile 10 digits)
    const phoneClean = customerPhone.trim().replace(/[\s.-]/g, '');
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(phoneClean)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam (10 chữ số, ví dụ 0912345678).');
      return;
    }

    // 8. Email validation (if provided)
    const trimmedEmail = customerEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Định dạng email không hợp lệ (ví dụ: name@example.com).');
      return;
    }

    const payload = {
      ticketCount,
      customerName: trimmedName,
      customerPhone: phoneClean,
      customerEmail: trimmedEmail || undefined,
    };

    const fingerprint = payloadFingerprint({ sessionId: currentSession.id, ...payload });
    if (!idempotencyRef.current || idempotencyRef.current.fingerprint !== fingerprint) {
      idempotencyRef.current = { fingerprint, key: crypto.randomUUID() };
    }

    setSubmitting(true);

    try {
      const res = await storeRequest<Booking>(
        `bookings/sessions/${currentSession.id}`,
        { ...payload, idempotencyKey: idempotencyRef.current.key },
        'POST',
      );
      // Seamlessly redirect to Payment Checkout page
      router.push(`/thanh-toan?bookingId=${res.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thực hiện giữ chỗ.');
      setSubmitting(false);
    }
  }

  return (
    <div className="ws-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className="ws-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ws-drawer-header">
          <div className="ws-drawer-header-info">
            <span className="ws-drawer-header-cat">
              {workshop.category || 'WORKSHOP HOA SÁP'}
            </span>
            <h2 id={titleId} className="ws-drawer-header-title">{workshop.name}</h2>
          </div>
          <button
            type="button"
            className="ws-drawer-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="ws-drawer-body">
          <form onSubmit={handleBookWorkshop} style={{ display: 'contents' }}>
            {/* Workshop Summary Card */}
            <div className="ws-drawer-summary-card">
              <div className="ws-drawer-thumb">
                <Image src={imageUrl} alt={workshop.name} fill sizes="100px" />
              </div>
              <div className="ws-drawer-meta">
                <div className="ws-drawer-meta-row">
                  <Clock3 size={15} />
                  <span>Thời lượng: {workshop.duration || 120} phút</span>
                </div>
                <div className="ws-drawer-meta-row">
                  <Sparkles size={15} />
                  <span>Học phí: <strong>{formatPrice(workshop.basePrice)}</strong> / người</span>
                </div>
                <div className="ws-drawer-meta-row">
                  <ShieldCheck size={15} />
                  <span>Bao gồm 100% hoa sáp mang về & phụ liệu</span>
                </div>
              </div>
            </div>

            {/* Description doc of workshop: ONLY render if exists ("k có thì khỏi") */}
            {workshop.description?.trim() ? (
              <div
                style={{
                  fontSize: '13.5px',
                  color: '#475569',
                  lineHeight: 1.65,
                  padding: '14px 16px',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                }}
              >
                {workshop.description.trim()}
              </div>
            ) : null}

            {/* Step 1: Chọn ca học */}
            <div>
              <div className="ws-drawer-section-title">
                <span>1. Chọn ca học tại xưởng</span>
                <span className="count-tag">{availableSessions.length} ca đang mở</span>
              </div>

              {availableSessions.length === 0 ? (
                <div className="ws-error-alert" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#64748b' }}>
                  <AlertCircle size={18} />
                  <span>Hiện chưa có ca mở sắp tới cho workshop này. Tiệm sẽ mở thêm ca sớm!</span>
                </div>
              ) : (
                <div className="ws-sessions-list">
                  {availableSessions.map((s) => {
                    const isSelected = s.id === selectedSessionId;
                    const freeSlots = remainingSeats(s);
                    const alreadyBooked = activeBookedSessionIds.has(s.id);

                    return (
                      <div
                        key={s.id}
                        className={`ws-session-option ${isSelected ? 'selected' : ''} ${
                          alreadyBooked ? 'is-booked' : ''
                        }`}
                        style={{
                          opacity: alreadyBooked || freeSlots === 0 ? 0.75 : 1,
                          cursor: alreadyBooked ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => {
                          if (alreadyBooked) {
                            setError('Bạn đã đăng ký ca này rồi. Vui lòng chọn ca khác hoặc xem trong Lịch học.');
                            return;
                          }
                          setSelectedSessionId(s.id);
                          setError('');
                          const allowed = Math.min(6, freeSlots);
                          if (ticketCount > allowed) {
                            setTicketCount(Math.max(1, allowed));
                          }
                        }}
                      >
                        <div className="ws-session-radio">
                          {isSelected && <div className="ws-session-radio-inner" />}
                        </div>
                        <div className="ws-session-details">
                          <div className="ws-session-date-time">
                            <span className="ws-session-datetime-txt">
                              {formatDate(s.sessionDate)} · {s.startTime.slice(0, 5)} - {s.endTime.slice(0, 5)}
                            </span>
                            {alreadyBooked ? (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: '#edf1fc',
                                  color: '#243db5',
                                  border: '1px solid #cbd5e1',
                                }}
                              >
                                Đã đăng ký
                              </span>
                            ) : freeSlots === 0 ? (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  background: '#fef2f2',
                                  color: '#b91c1c',
                                  border: '1px solid #fecaca',
                                }}
                              >
                                Đã đủ chỗ
                              </span>
                            ) : (
                              <span className="ws-session-seats-badge">
                                Còn {freeSlots} chỗ
                              </span>
                            )}
                          </div>
                          <div className="ws-session-venue">
                            <MapPin size={14} />
                            <span>{s.location || 'NVH Sinh Viên (Xưởng Sáp)'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Step 2: Số lượng vé */}
            <div>
              <div className="ws-drawer-section-title">
                <span>2. Số lượng người tham gia</span>
                {currentSession && (
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    (Tối đa {maxSeatsAllowed} vé/lần đặt)
                  </span>
                )}
              </div>
              <div className="ws-stepper-box">
                <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                  Số vé tham dự
                </span>
                <div className="ws-stepper-controls">
                  <button
                    type="button"
                    className="ws-stepper-btn"
                    onClick={() => setTicketCount((prev) => Math.max(1, prev - 1))}
                    disabled={ticketCount <= 1 || isCurrentSessionAlreadyBooked || freeSeats <= 0}
                  >
                    -
                  </button>
                  <span className="ws-stepper-value">{ticketCount}</span>
                  <button
                    type="button"
                    className="ws-stepper-btn"
                    onClick={() => setTicketCount((prev) => Math.min(maxSeatsAllowed, prev + 1))}
                    disabled={
                      ticketCount >= maxSeatsAllowed ||
                      isCurrentSessionAlreadyBooked ||
                      freeSeats <= 0
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Step 3: Thông tin người tham gia */}
            <div>
              <div className="ws-drawer-section-title">
                <span>3. Thông tin học viên</span>
              </div>

              {authChecked && currentUser ? (
                <div className="ws-prefill-badge">
                  <Check size={16} />
                  <span>Đã tự động điền từ tài khoản ({currentUser.email})</span>
                </div>
              ) : authChecked && !currentUser ? (
                <div className="ws-login-prompt" style={{ marginBottom: '14px' }}>
                  <span>Đăng nhập để giữ chỗ và lưu vé vào lịch của bạn.</span>
                  <Link href="/tai-khoan">Đăng nhập</Link>
                </div>
              ) : null}

              <div className="ws-form-fields">
                <div className="ws-field full">
                  <label>Họ và tên học viên *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setError('');
                    }}
                    placeholder="Nguyễn Văn A"
                    required
                    maxLength={100}
                  />
                </div>
                <div className="ws-field">
                  <label>Số điện thoại *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setError('');
                    }}
                    placeholder="0912 345 678"
                    required
                    maxLength={15}
                  />
                </div>
                <div className="ws-field">
                  <label>Email xác nhận (tùy chọn)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => {
                      setCustomerEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="email@example.com"
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="ws-error-alert" role="alert">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Drawer Footer Actions */}
            <div className="ws-drawer-footer">
              <div className="ws-drawer-total-row">
                <span className="ws-total-label">Tổng thanh toán ({ticketCount} vé):</span>
                <span className="ws-total-amount">{formatPrice(totalPrice)}</span>
              </div>

              {currentUser ? (
                <button
                  type="submit"
                  className="ws-btn-confirm"
                  disabled={
                    submitting ||
                    availableSessions.length === 0 ||
                    isCurrentSessionAlreadyBooked ||
                    freeSeats <= 0
                  }
                >
                  {submitting ? (
                    'Đang khởi tạo giữ chỗ...'
                  ) : isCurrentSessionAlreadyBooked ? (
                    'Bạn đã đăng ký ca học này'
                  ) : freeSeats <= 0 ? (
                    'Ca học đã hết chỗ'
                  ) : (
                    <>
                      Tiếp tục thanh toán · {formatPrice(totalPrice)} <ArrowRight size={17} />
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/tai-khoan"
                  className="ws-btn-confirm"
                  style={{ textDecoration: 'none' }}
                >
                  Đăng nhập để thanh toán <ArrowRight size={16} />
                </Link>
              )}

              <p className="ws-confirm-note">
                Chỗ ngồi của bạn sẽ được giữ trong 10 phút để hoàn tất thanh toán.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
