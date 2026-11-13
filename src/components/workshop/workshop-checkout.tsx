'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Clock,
  MapPin,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  QrCode,
  AlertCircle,
  Users,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import type { Booking, Session, VnPayCheckout, VnPaySync, Workshop } from '@/lib/api/client';
import './workshop-checkout.css';

interface WorkshopCheckoutProps {
  bookingId: string;
}

const SYNC_INTERVAL_MS = 5_000;
const SYNC_MAX_MS = 10 * 60_000;

type VnPayPhase = 'idle' | 'starting' | 'returning' | 'awaiting' | 'paid' | 'canceled' | 'invalid';

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

function formatPrice(amount: number) {
  return `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;
}

function remainingSeconds(holdExpiresAt?: string) {
  if (!holdExpiresAt) return 0;
  const ms = new Date(holdExpiresAt).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
}

function isConfirmedStatus(status?: string) {
  return ['confirmed', 'attended'].includes((status || '').toLowerCase());
}

function isClosedStatus(status?: string) {
  return ['expired', 'cancelled', 'canceled'].includes((status || '').toLowerCase());
}

/** True when the current query string carries at least one VNPAY return parameter. */
function hasVnPayParams(search: string) {
  for (const key of new URLSearchParams(search).keys()) if (key.startsWith('vnp_')) return true;
  return false;
}

/**
 * Returns the VNPAY payment URL to redirect to, or null. Only https URLs on the VNPAY
 * sandbox or a vnpayment.vn host are allowed, so a rogue URL can never be followed.
 */
function safeVnPayUrl(value?: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    return host === 'sandbox.vnpayment.vn' || host.endsWith('.vnpayment.vn')
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

export default function WorkshopCheckout({ bookingId }: WorkshopCheckoutProps) {
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [reported, setReported] = useState(false);
  const [countdown, setCountdown] = useState(0);
  // VNPAY: starting | returning | awaiting (result pending at the backend) | paid | canceled.
  const [vnpayPhase, setVnpayPhase] = useState<VnPayPhase>('idle');
  const [vnpayDisabled, setVnpayDisabled] = useState(false);
  const [vnpayError, setVnpayError] = useState('');
  // Manual "Tôi đã chuyển khoản" flow: shown as fallback or when the user reports a problem.
  const [manualMode, setManualMode] = useState(false);
  const startRequestedRef = useRef(false);
  const returnHandledRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    startRequestedRef.current = false;
    returnHandledRef.current = false;
    setVnpayPhase('idle');
    setVnpayDisabled(false);
    setVnpayError('');
    setManualMode(false);
    setReported(false);

    storeRequest<Booking>(`bookings/${bookingId}`)
      .then(async (b) => {
        if (!active) return;
        setBooking(b);
        setCountdown(remainingSeconds(b.holdExpiresAt));
        if ((b.pendingVerificationAmount ?? 0) > 0) setReported(true);

        try {
          const wsList = await storeRequest<{ id: string }[]>('workshops');
          for (const w of wsList) {
            try {
              const wsSessions = await storeRequest<Session[]>(`workshops/${w.id}/sessions`);
              const matched = wsSessions.find((s) => s.id === b.sessionId);
              if (matched) {
                if (active) {
                  setSession(matched);
                  const wsDetail = await storeRequest<Workshop>(`workshops/${w.id}`).catch(
                    () => null,
                  );
                  if (active && wsDetail) setWorkshop(wsDetail);
                }
                break;
              }
            } catch {
              // continue
            }
          }
        } catch {
          // ignore session fetch error
        }
      })
      .catch((err) => {
        if (active)
          setError(err instanceof Error ? err.message : 'Không tìm thấy thông tin vé giữ chỗ.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookingId]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const reloadBooking = useCallback(async () => {
    const fresh = await storeRequest<Booking>(`bookings/${bookingId}`).catch(() => null);
    if (!fresh) return;
    setBooking(fresh);
    setCountdown(remainingSeconds(fresh.holdExpiresAt));
    if ((fresh.pendingVerificationAmount ?? 0) > 0) setReported(true);
  }, [bookingId]);

  const startVnPay = useCallback(
    async (retry = false) => {
      // Ref guard: double clicks, re-renders and Strict Mode must not create a second payment.
      if (retry) startRequestedRef.current = false;
      if (startRequestedRef.current) return;
      startRequestedRef.current = true;
      setVnpayPhase('starting');
      setVnpayError('');
      try {
        const checkout = await storeRequest<VnPayCheckout>(
          `bookings/${bookingId}/vnpay`,
          {},
          'POST',
        );
        const target = safeVnPayUrl(checkout?.paymentUrl);
        if (!target) {
          setVnpayPhase('idle');
          setVnpayError('Không thể mở trang thanh toán VNPAY. Vui lòng thử lại sau.');
          return;
        }
        // Creating the payment extends the hold: re-read the booking for the countdown.
        await reloadBooking();
        window.location.assign(target);
      } catch (err) {
        // 503 (VNPAY disabled) or any error: hide the VNPAY button and keep the manual flow.
        setVnpayDisabled(true);
        setVnpayPhase('idle');
        setVnpayError(err instanceof Error ? err.message : '');
      }
    },
    [bookingId, reloadBooking],
  );

  // VNPAY redirects back to /thanh-toan?bookingId=…&vnp_…. The raw query goes to the backend once;
  // only the backend answer decides the outcome, never the URL parameters.
  useEffect(() => {
    if (!loading || !booking) return;
    const query = window.location.search.slice(1);
    if (!hasVnPayParams(query) || returnHandledRef.current) return;
    returnHandledRef.current = true;
    setVnpayPhase('returning');
    setVnpayError('');
    let active = true;
    (async () => {
      try {
        const result = await storeRequest<VnPaySync>(
          `bookings/${bookingId}/vnpay/return`,
          { query },
          'POST',
        );
        if (!active) return;
        await reloadBooking();
        if (!active) return;
        if (result.lastResult === 'paid' || isConfirmedStatus(result.bookingStatus)) {
          setVnpayPhase('paid');
          setCountdown(0);
        } else if (result.lastResult === 'canceled') {
          setVnpayPhase('canceled');
          startRequestedRef.current = false;
        } else if (result.lastResult === 'pending') {
          setVnpayPhase('awaiting');
        } else {
          setVnpayPhase('invalid');
          setVnpayError('Không xác minh được kết quả thanh toán VNPAY.');
        }
      } catch (err) {
        if (!active) return;
        setVnpayPhase('invalid');
        setVnpayError(
          err instanceof Error && err.message
            ? err.message
            : 'Không xác minh được kết quả thanh toán VNPAY.',
        );
      } finally {
        if (!active) return;
        // Strip vnp_* from the address bar; a refresh must not replay the return.
        router.replace(`/thanh-toan?bookingId=${encodeURIComponent(bookingId)}`);
      }
    })();
    return () => {
      active = false;
    };
  }, [loading, booking, bookingId, reloadBooking, router]);

  // While VNPAY is pending, ask the backend every 5 s (visible tab only, max 10 min).
  useEffect(() => {
    if (vnpayPhase !== 'awaiting') return;
    const deadline = Date.now() + SYNC_MAX_MS;
    let stopped = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      if (stopped) return;
      timer = setTimeout(tick, SYNC_INTERVAL_MS);
    };

    const tick = async () => {
      timer = undefined;
      if (stopped) return;
      if (Date.now() >= deadline) {
        stopped = true;
        return;
      }
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        schedule();
        return;
      }
      if (inFlight) {
        schedule();
        return;
      }
      inFlight = true;
      try {
        const result = await storeRequest<VnPaySync>(
          `bookings/${bookingId}/vnpay/sync`,
          {},
          'POST',
        );
        if (stopped) return;
        if (result.lastResult === 'paid' || isConfirmedStatus(result.bookingStatus)) {
          stopped = true;
          setBooking((prev) =>
            prev ? { ...prev, bookingStatus: 'confirmed', remainingAmount: 0 } : prev,
          );
          setVnpayPhase('paid');
          setCountdown(0);
          return;
        }
        if (result.lastResult === 'canceled') {
          stopped = true;
          setBooking((prev) =>
            prev ? { ...prev, bookingStatus: result.bookingStatus || prev.bookingStatus } : prev,
          );
          setVnpayPhase('canceled');
          startRequestedRef.current = false;
          return;
        }
        setBooking((prev) =>
          prev
            ? {
                ...prev,
                bookingStatus: result.bookingStatus || prev.bookingStatus,
                remainingAmount:
                  typeof result.remainingAmount === 'number'
                    ? result.remainingAmount
                    : prev.remainingAmount,
              }
            : prev,
        );
      } catch {
        // Transient sync failure: keep polling (also stops at the 10 minute deadline).
      } finally {
        inFlight = false;
      }
      schedule();
    };

    const onVisibilityChange = () => {
      // Coming back to a visible tab: refresh immediately instead of waiting a full interval.
      if (!stopped && document.visibilityState === 'visible') {
        if (timer) clearTimeout(timer);
        void tick();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibilityChange);
    }
    schedule();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    };
  }, [vnpayPhase, bookingId]);

  const totalAmount = booking?.totalAmount ?? 0;
  const remainingAmount = booking?.remainingAmount ?? totalAmount;

  const copyToClipboard = (text: string, field: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedField(field);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopiedField(''), 2000);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  async function handleReportTransfer() {
    if (!booking || isProcessing) return;
    setIsProcessing(true);
    setError('');
    const amount = booking.remainingAmount ?? booking.totalAmount;
    try {
      await storeRequest(
        `payments/booking/${booking.id}`,
        {
          transactionCode: `CK-${booking.bookingCode}`,
          paymentMethod: 'BankTransfer',
          amount,
        },
        'POST',
      );
      await reloadBooking();
      setReported(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ghi nhận báo chuyển khoản.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="ws-checkout-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <p style={{ fontSize: '15px', color: '#64748b' }}>Đang tải thông tin giữ chỗ...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="ws-checkout-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', color: '#1c2326', marginBottom: '8px' }}>
          Không thể tải vé giữ chỗ
        </h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
        <Link
          href="/workshop"
          className="ws-btn-confirm"
          style={{ display: 'inline-flex', width: 'auto', padding: '10px 24px' }}
        >
          Quay lại danh sách Workshop
        </Link>
      </div>
    );
  }

  const bookingCode = booking?.bookingCode || 'WS-CHUA-CAP';
  const reportAmount = remainingAmount ?? totalAmount;
  const workshopName = workshop?.name || 'Workshop Cắm Hoa Sáp';
  const sessionDate = session ? formatDate(session.sessionDate) : '—';
  const sessionTime = session
    ? `${session.startTime.slice(0, 5)} - ${session.endTime.slice(0, 5)}`
    : '—';
  const sessionVenue = session?.location || 'Xưởng Tiệm Hoa Có Gu';
  const isConfirmed = isConfirmedStatus(booking?.bookingStatus) && remainingAmount === 0;
  const isFree = totalAmount === 0;
  const bookingExpired = isClosedStatus(booking?.bookingStatus);
  const ticketUrl = `/tra-cuu?ve=${encodeURIComponent(bookingId)}`;

  const vietQrUrl = `https://img.vietqr.io/image/MB-0971201001-compact2.png?amount=${reportAmount}&addInfo=${encodeURIComponent(
    bookingCode,
  )}&accountName=TIEM%20HOA%20CO%20GU`;

  const summarySidebar = (
    <div className="ws-summary-sidebar">
      <div className="ws-order-ticket-preview">
        <div className="ws-ticket-header">
          <span>GIỮ CHỖ WORKSHOP</span>
          <h3>{workshopName}</h3>
        </div>

        <div className="ws-ticket-info-body">
          <div className="ws-ticket-row">
            <CalendarDays size={16} aria-hidden="true" />
            <span>
              <strong>Ngày học:</strong> {sessionDate}
            </span>
          </div>
          <div className="ws-ticket-row">
            <Clock size={16} aria-hidden="true" />
            <span>
              <strong>Khung giờ:</strong> {sessionTime}
            </span>
          </div>
          <div className="ws-ticket-row">
            <MapPin size={16} aria-hidden="true" />
            <span>
              <strong>Địa điểm:</strong> {sessionVenue}
            </span>
          </div>
          <div className="ws-ticket-row">
            <Users size={16} aria-hidden="true" />
            <span>
              <strong>Học viên:</strong> {booking?.customerName || 'Khách hàng'}
            </span>
          </div>
        </div>

        <div className="ws-ticket-pricing">
          <div className="ws-price-row">
            <span>Số lượng:</span>
            <span>{booking?.ticketCount || 1} người</span>
          </div>
          <div className="ws-price-row">
            <span>Số tiền cần chuyển:</span>
            <span>{formatPrice(reportAmount)}</span>
          </div>
          <div className="ws-price-row total">
            <span>Tổng đặt chỗ:</span>
            <span>{formatPrice(totalAmount)}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e8ebe4',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '12.5px',
          color: '#475569',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} style={{ color: '#10b981' }} aria-hidden="true" />
          <span>
            Nội dung chuyển khoản: <strong>{bookingCode}</strong>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={16} style={{ color: '#10b981' }} aria-hidden="true" />
          <span>Tiệm xác nhận thanh toán trước khi phát hành vé QR.</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="ws-checkout-container">
      <div className="ws-checkout-steps" aria-label="Các bước giữ chỗ">
        <div className="ws-step-item done">
          <span className="ws-step-num">
            <Check size={14} />
          </span>
          <span>1. Chọn ca học</span>
        </div>
        <div style={{ width: '32px', height: '1px', background: '#cbd5e1' }} aria-hidden="true" />
        <div className="ws-step-item done">
          <span className="ws-step-num">
            <Check size={14} />
          </span>
          <span>2. Giữ chỗ</span>
        </div>
        <div style={{ width: '32px', height: '1px', background: '#cbd5e1' }} aria-hidden="true" />
        <div className={`ws-step-item ${reported || isConfirmed || isFree ? 'done' : 'active'}`}>
          <span className="ws-step-num">
            {reported || isConfirmed || isFree ? <Check size={14} /> : '3'}
          </span>
          <span>3. Thanh toán</span>
        </div>
        <div style={{ width: '32px', height: '1px', background: '#cbd5e1' }} aria-hidden="true" />
        <div className={`ws-step-item ${isConfirmed || isFree ? 'active' : ''}`}>
          <span className="ws-step-num">4</span>
          <span>4. Nhận vé QR</span>
        </div>
      </div>

      {isFree ? (
        <div className="ws-paid-success-wrap">
          <div className="ws-paid-icon">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="ws-paid-title">Giữ chỗ miễn phí đã được xác nhận</h2>
          <p className="ws-paid-msg">
            Vé QR của bạn có thể xem trong mục tra cứu. Đưa mã QR cho tiệm khi check-in tại xưởng.
          </p>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '440px',
              margin: '0 auto 28px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Mã đặt chỗ:</span>
              <strong style={{ color: '#243db5', fontFamily: 'monospace', fontSize: '16px' }}>
                {bookingCode}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Workshop:</span>
              <strong style={{ color: '#1c2326', fontSize: '13.5px' }}>{workshopName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Thời gian:</span>
              <span style={{ color: '#1c2326', fontSize: '13px', fontWeight: 600 }}>
                {sessionDate} ({sessionTime})
              </span>
            </div>
          </div>
          <div className="ws-paid-btn-group">
            <Link
              href={ticketUrl}
              className="ws-btn-pay-action"
              style={{ width: 'auto', padding: '12px 28px', textDecoration: 'none' }}
            >
              Xem vé QR <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/workshop"
              className="ws-btn-dismiss"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              Xem thêm Workshop
            </Link>
          </div>
        </div>
      ) : isConfirmed ? (
        <div className="ws-paid-success-wrap">
          <div className="ws-paid-icon">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="ws-paid-title">Đặt chỗ đã được xác nhận</h2>
          <p className="ws-paid-msg">Đã nhận thanh toán. Vé QR đã được gửi qua email.</p>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '440px',
              margin: '0 auto 28px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Mã đặt chỗ:</span>
              <strong style={{ color: '#243db5', fontFamily: 'monospace', fontSize: '16px' }}>
                {bookingCode}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Workshop:</span>
              <strong style={{ color: '#1c2326', fontSize: '13.5px' }}>{workshopName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Thời gian:</span>
              <span style={{ color: '#1c2326', fontSize: '13px', fontWeight: 600 }}>
                {sessionDate} ({sessionTime})
              </span>
            </div>
          </div>
          <div className="ws-paid-btn-group">
            <Link
              href={ticketUrl}
              className="ws-btn-pay-action"
              style={{ width: 'auto', padding: '12px 28px', textDecoration: 'none' }}
            >
              Xem vé <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/workshop"
              className="ws-btn-dismiss"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              Xem thêm Workshop
            </Link>
          </div>
        </div>
      ) : reported ? (
        <div className="ws-paid-success-wrap">
          <div className="ws-paid-icon">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="ws-paid-title">Đã ghi nhận báo chuyển khoản</h2>
          <p className="ws-paid-msg">
            Đã ghi nhận bạn báo chuyển khoản. Tiệm sẽ xác nhận khi nhận tiền; vé QR được gửi qua
            email và hiện trong mục tra cứu.
          </p>
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              maxWidth: '440px',
              margin: '0 auto 28px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Mã đặt chỗ / nội dung CK:</span>
              <strong style={{ color: '#243db5', fontFamily: 'monospace', fontSize: '16px' }}>
                {bookingCode}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Số tiền báo chuyển:</span>
              <strong style={{ color: '#1c2326', fontSize: '13.5px' }}>
                {formatPrice(reportAmount)}
              </strong>
            </div>
            {countdown > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b', fontSize: '13px' }}>Giữ chỗ còn:</span>
                <span style={{ color: '#1c2326', fontSize: '13px', fontWeight: 600 }}>
                  {timeFormatted}
                </span>
              </div>
            )}
          </div>
          <div className="ws-paid-btn-group">
            <Link
              href={ticketUrl}
              className="ws-btn-pay-action"
              style={{ width: 'auto', padding: '12px 28px', textDecoration: 'none' }}
            >
              Xem trạng thái vé <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : bookingExpired ? (
        <div className="ws-paid-success-wrap">
          <div className="ws-paid-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <Clock size={36} aria-hidden="true" />
          </div>
          <h2 className="ws-paid-title">Hết thời gian giữ chỗ</h2>
          <p className="ws-paid-msg">
            Thời gian giữ chỗ đã hết nên booking {bookingCode} không còn chờ thanh toán. Bạn có thể
            chọn ca học khác.
          </p>
          <div className="ws-paid-btn-group">
            <Link
              href="/workshop"
              className="ws-btn-pay-action"
              style={{ width: 'auto', padding: '12px 28px', textDecoration: 'none' }}
            >
              Chọn Workshop khác <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      ) : vnpayPhase === 'paid' ? (
        <div className="ws-paid-success-wrap">
          <div className="ws-paid-icon">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="ws-paid-title">Đã nhận thanh toán VNPAY</h2>
          <p className="ws-paid-msg">Đã nhận thanh toán. Vé QR đã được gửi qua email.</p>
          <div className="ws-paid-btn-group">
            <Link
              href={ticketUrl}
              className="ws-btn-pay-action"
              style={{ width: 'auto', padding: '12px 28px', textDecoration: 'none' }}
            >
              Xem vé <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="/workshop"
              className="ws-btn-dismiss"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              Xem thêm Workshop
            </Link>
          </div>
        </div>
      ) : (
        <div className="ws-checkout-layout">
          <div className="ws-checkout-card">
            <h2>
              <span>{vnpayPhase === 'awaiting' ? 'Chờ xác nhận VNPAY' : 'Thanh toán giữ chỗ'}</span>
              {countdown > 0 && (
                <span className="ws-timer-badge">
                  <Clock size={13} aria-hidden="true" /> Giữ chỗ còn: {timeFormatted}
                </span>
              )}
            </h2>

            {vnpayPhase === 'canceled' && (
              <p className="ws-paid-msg" role="status">
                Bạn đã hủy thanh toán VNPAY.
              </p>
            )}

            {vnpayPhase === 'awaiting' && (
              <p className="ws-vnpay-status" role="status" aria-live="polite">
                <Clock size={14} aria-hidden="true" />
                <span>Đang chờ VNPAY xác nhận…</span>
              </p>
            )}

            {vnpayPhase === 'awaiting' ? (
              <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#64748b' }}>
                Trang này tự cập nhật khi VNPAY báo kết quả. Bạn có thể giữ trang mở hoặc kiểm tra
                lại vé trong mục tra cứu.
              </p>
            ) : (
              <>
                <div className="ws-pay-methods" aria-label="Hình thức thanh toán">
                  <div className="ws-pay-method-opt selected">
                    <div className="ws-pay-radio" aria-hidden="true">
                      <div className="ws-pay-radio-inner" />
                    </div>
                    <QrCode size={24} style={{ color: '#243db5' }} aria-hidden="true" />
                    <div className="ws-pay-opt-text">
                      <span className="ws-pay-opt-title">Cổng thanh toán VNPAY</span>
                      <span className="ws-pay-opt-sub">
                        Thanh toán bằng mã QR qua app ngân hàng, thẻ ATM hoặc thẻ quốc tế.
                      </span>
                    </div>
                  </div>
                </div>

                {!vnpayDisabled && (
                  <>
                    <button
                      type="button"
                      className="ws-btn-pay-action"
                      onClick={() => void startVnPay(vnpayPhase === 'canceled')}
                      disabled={vnpayPhase === 'starting' || vnpayPhase === 'returning'}
                      aria-busy={vnpayPhase === 'starting' || vnpayPhase === 'returning'}
                    >
                      {vnpayPhase === 'starting'
                        ? 'Đang mở cổng VNPAY…'
                        : vnpayPhase === 'returning'
                          ? 'Đang xác nhận kết quả…'
                          : vnpayPhase === 'canceled'
                            ? 'Thử thanh toán VNPAY lại'
                            : `Thanh toán qua VNPAY · ${formatPrice(reportAmount)}`}
                    </button>
                    <p className="ws-vnpay-status-note" style={{ marginTop: '12px' }}>
                      Vé QR được gửi qua email ngay khi VNPAY xác nhận thanh toán.
                    </p>
                  </>
                )}
              </>
            )}

            {(error || vnpayError) && (
              <div className="ws-error-alert" style={{ margin: '18px 0' }} role="alert">
                <AlertCircle size={18} aria-hidden="true" />
                <span>{error || vnpayError}</span>
              </div>
            )}

            {manualMode ? (
              <>
                <div className="ws-pay-methods" aria-label="Hướng dẫn chuyển khoản">
                  <div className="ws-pay-method-opt selected">
                    <div className="ws-pay-radio" aria-hidden="true">
                      <div className="ws-pay-radio-inner" />
                    </div>
                    <QrCode size={24} style={{ color: '#243db5' }} aria-hidden="true" />
                    <div className="ws-pay-opt-text">
                      <span className="ws-pay-opt-title">Chuyển khoản ngân hàng (VietQR)</span>
                      <span className="ws-pay-opt-sub">
                        Nội dung chuyển khoản là mã đặt chỗ để tiệm đối soát.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="ws-vietqr-box">
                  <div className="ws-qr-image-wrap">
                    <Image
                      src={vietQrUrl}
                      alt={`Mã VietQR chuyển khoản ${formatPrice(reportAmount)} với nội dung ${bookingCode}`}
                      width={220}
                      height={220}
                      style={{ borderRadius: '8px' }}
                      unoptimized
                    />
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Quét mã QR để chuyển khoản đúng số tiền và nội dung. Sau khi chuyển, bấm
                    &quot;Tôi đã chuyển khoản&quot; để tiệm xác nhận.
                  </p>

                  <table className="ws-bank-details">
                    <tbody>
                      <tr>
                        <td>Ngân hàng:</td>
                        <td>
                          <strong>MB Bank (Ngân hàng Quân Đội)</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>Số tài khoản:</td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>
                            0971201001
                          </span>
                          <button
                            type="button"
                            className="ws-copy-btn"
                            onClick={() => copyToClipboard('0971201001', 'stk')}
                            aria-label="Sao chép số tài khoản"
                          >
                            {copiedField === 'stk' ? <Check size={12} /> : <Copy size={12} />}
                            {copiedField === 'stk' ? 'Đã chép' : 'Sao chép'}
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>Chủ tài khoản:</td>
                        <td>TIEM HOA CO GU</td>
                      </tr>
                      <tr>
                        <td>Số tiền:</td>
                        <td style={{ color: '#243db5' }}>{formatPrice(reportAmount)}</td>
                      </tr>
                      <tr>
                        <td>Nội dung CK:</td>
                        <td>
                          <span
                            style={{ fontFamily: 'monospace', color: '#243db5', fontWeight: 800 }}
                          >
                            {bookingCode}
                          </span>
                          <button
                            type="button"
                            className="ws-copy-btn"
                            onClick={() => copyToClipboard(bookingCode, 'nd')}
                            aria-label="Sao chép nội dung chuyển khoản"
                          >
                            {copiedField === 'nd' ? <Check size={12} /> : <Copy size={12} />}
                            {copiedField === 'nd' ? 'Đã chép' : 'Sao chép'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  className="ws-btn-pay-action"
                  onClick={() => void handleReportTransfer()}
                  disabled={isProcessing}
                >
                  {isProcessing
                    ? 'Đang ghi nhận báo chuyển khoản…'
                    : `Tôi đã chuyển khoản · ${formatPrice(reportAmount)}`}
                </button>
                <p
                  style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    textAlign: 'center',
                    margin: '12px 0 0',
                  }}
                >
                  Tiệm sẽ xác nhận khi nhận được tiền. Vé QR chỉ phát hành sau khi đặt chỗ được xác
                  nhận.
                </p>
              </>
            ) : (
              vnpayPhase !== 'awaiting' && (
                <button
                  type="button"
                  className="ws-vnpay-manual-link"
                  onClick={() => {
                    setManualMode(true);
                    setVnpayError('');
                  }}
                >
                  Gặp sự cố? Báo đã chuyển khoản để tiệm kiểm tra
                </button>
              )
            )}
          </div>

          {summarySidebar}
        </div>
      )}
    </div>
  );
}
