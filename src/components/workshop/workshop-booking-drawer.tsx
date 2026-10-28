'use client';

import React, { useEffect, useRef, useState, useId } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  X,
  CalendarDays,
  Clock3,
  MapPin,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
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
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const idempotencyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const titleId = useId();

  // Load auth user info
  useEffect(() => {
    let active = true;
    storeRequest<User>('auth/me')
      .then((me) => {
        if (!active) return;
        setCurrentUser(me);
        if (me.fullName) setCustomerName(me.fullName);
        if (me.phoneNumber) setCustomerPhone(me.phoneNumber);
        if (me.email) setCustomerEmail(me.email);
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

  // Initialize selected session when drawer opens
  useEffect(() => {
    if (isOpen && availableSessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(availableSessions[0].id);
    }
    if (isOpen) {
      setError('');
      setConfirmedBooking(null);
    }
  }, [isOpen, availableSessions, selectedSessionId]);

  if (!isOpen || !workshop) return null;

  const currentSession = availableSessions.find((s) => s.id === selectedSessionId);
  const maxSeatsAllowed = currentSession ? Math.min(6, remainingSeats(currentSession)) : 1;
  const totalPrice = workshop.basePrice * ticketCount;

  async function handleBookWorkshop(e: React.FormEvent) {
    e.preventDefault();
    if (!currentSession) {
      setError('Vui lòng chọn một ca học còn chỗ.');
      return;
    }
    if (!currentUser) {
      setError('Vui lòng đăng nhập tài khoản để xác nhận giữ chỗ.');
      return;
    }
    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Vui lòng điền đầy đủ họ tên và số điện thoại.');
      return;
    }

    const payload = {
      ticketCount,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
    };

    const fingerprint = payloadFingerprint({ sessionId: currentSession.id, ...payload });
    if (!idempotencyRef.current || idempotencyRef.current.fingerprint !== fingerprint) {
      idempotencyRef.current = { fingerprint, key: crypto.randomUUID() };
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await storeRequest<Booking>(
        `bookings/sessions/${currentSession.id}`,
        { ...payload, idempotencyKey: idempotencyRef.current.key },
        'POST',
      );
      setConfirmedBooking(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thực hiện giữ chỗ.');
    } finally {
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
          {/* Confirmed Ticket State */}
          {confirmedBooking ? (
            <div className="ws-success-card">
              <div className="ws-success-badge-icon">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="ws-success-title">Giữ chỗ thành công!</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Mã vé của bạn đã được ghi nhận trên hệ thống Tiệm Hoa Có Gu.
              </p>

              <div className="ws-ticket-code-box">
                {confirmedBooking.bookingCode || confirmedBooking.id}
              </div>

              <table className="ws-ticket-details-table">
                <tbody>
                  <tr>
                    <td>Lớp học:</td>
                    <td>{workshop.name}</td>
                  </tr>
                  <tr>
                    <td>Ca học:</td>
                    <td>
                      {currentSession ? formatDate(currentSession.sessionDate) : '—'} ·{' '}
                      {currentSession?.startTime.slice(0, 5)} - {currentSession?.endTime.slice(0, 5)}
                    </td>
                  </tr>
                  <tr>
                    <td>Địa điểm:</td>
                    <td>{currentSession?.location || 'NVH Sinh Viên'}</td>
                  </tr>
                  <tr>
                    <td>Số lượng vé:</td>
                    <td>{ticketCount} học viên</td>
                  </tr>
                  <tr>
                    <td>Tổng học phí:</td>
                    <td>{formatPrice(confirmedBooking.totalAmount || totalPrice)}</td>
                  </tr>
                  <tr>
                    <td>Học viên:</td>
                    <td>{customerName} ({customerPhone})</td>
                  </tr>
                </tbody>
              </table>

              <div className="ws-success-actions">
                <Link href="/tai-khoan" className="ws-btn-portal">
                  Xem trong Lịch học của tôi <ArrowRight size={16} />
                </Link>
                <button
                  type="button"
                  className="ws-btn-dismiss"
                  onClick={onClose}
                >
                  Hoàn tất & Đóng
                </button>
              </div>
            </div>
          ) : (
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
                      return (
                        <div
                          key={s.id}
                          className={`ws-session-option ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedSessionId(s.id);
                            if (ticketCount > Math.min(6, freeSlots)) {
                              setTicketCount(Math.min(6, freeSlots));
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
                              <span className="ws-session-seats-badge">
                                Còn {freeSlots} chỗ
                              </span>
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
                </div>
                <div className="ws-stepper-box">
                  <span style={{ fontSize: '13.5px', color: '#334155', fontWeight: 600 }}>
                    Số vé giữ chỗ
                  </span>
                  <div className="ws-stepper-controls">
                    <button
                      type="button"
                      className="ws-stepper-btn"
                      onClick={() => setTicketCount((prev) => Math.max(1, prev - 1))}
                      disabled={ticketCount <= 1}
                    >
                      -
                    </button>
                    <span className="ws-stepper-value">{ticketCount}</span>
                    <button
                      type="button"
                      className="ws-stepper-btn"
                      onClick={() => setTicketCount((prev) => Math.min(maxSeatsAllowed, prev + 1))}
                      disabled={ticketCount >= maxSeatsAllowed}
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
                    <span>Đã tự động điền từ tài khoản của bạn ({currentUser.email})</span>
                  </div>
                ) : authChecked && !currentUser ? (
                  <div className="ws-login-prompt" style={{ marginBottom: '14px' }}>
                    <span>Đăng nhập để lưu vé vào tài khoản và quản lý lịch học.</span>
                    <Link href="/tai-khoan">Đăng nhập</Link>
                  </div>
                ) : null}

                <div className="ws-form-fields">
                  <div className="ws-field full">
                    <label>Họ và tên học viên *</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                  <div className="ws-field">
                    <label>Số điện thoại *</label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0912 345 678"
                      required
                    />
                  </div>
                  <div className="ws-field">
                    <label>Email xác nhận (tùy chọn)</label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="email@example.com"
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
                    disabled={submitting || availableSessions.length === 0}
                  >
                    {submitting ? 'Đang tạo giữ chỗ...' : `Xác nhận đặt chỗ · ${formatPrice(totalPrice)}`}
                  </button>
                ) : (
                  <Link
                    href="/tai-khoan"
                    className="ws-btn-confirm"
                    style={{ textDecoration: 'none' }}
                  >
                    Đăng nhập để giữ chỗ <ArrowRight size={16} />
                  </Link>
                )}

                <p className="ws-confirm-note">
                  {currentUser
                    ? 'Vé giữ chỗ sẽ xuất hiện ngay trong mục Lịch học của bạn.'
                    : 'Cần đăng nhập tài khoản để lưu vé và quản lý lịch.'}
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
