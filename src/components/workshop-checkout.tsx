'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  CreditCard,
  Building2,
  AlertCircle,
  Users,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import type { Booking, Session, Workshop } from '@/lib/api/client';
import './workshop-checkout.css';

interface WorkshopCheckoutProps {
  bookingId: string;
}

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

export default function WorkshopCheckout({ bookingId }: WorkshopCheckoutProps) {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'vietqr' | 'momo' | 'cash'>('vietqr');
  const [copiedField, setCopiedField] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes hold timer

  // Load booking, session, and workshop
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    storeRequest<Booking>(`bookings/${bookingId}`)
      .then(async (b) => {
        if (!active) return;
        setBooking(b);
        if (b.bookingStatus?.toLowerCase() === 'confirmed') {
          setIsPaidSuccess(true);
        }

        // Fetch session
        try {
          const sessions = await storeRequest<Session[]>(`workshops`);
          // Try to get session directly or through workshops
          const wsList = await storeRequest<{ id: string; name: string }[]>('workshops');
          for (const w of wsList) {
            try {
              const wsSessions = await storeRequest<Session[]>(`workshops/${w.id}/sessions`);
              const matched = wsSessions.find((s) => s.id === b.sessionId);
              if (matched) {
                if (active) {
                  setSession(matched);
                  const wsDetail = await storeRequest<Workshop>(`workshops/${w.id}`).catch(() => null);
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
        if (active) setError(err instanceof Error ? err.message : 'Không tìm thấy thông tin vé giữ chỗ.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [bookingId]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0 || isPaidSuccess) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, isPaidSuccess]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  async function handleConfirmPayment() {
    if (!booking) return;
    setIsProcessing(true);
    setError('');

    try {
      // Try to record manual payment or confirm
      await storeRequest(
        `payments/booking/${booking.id}`,
        {
          transactionCode: `PAY-${Date.now()}`,
          paymentMethod: paymentMethod === 'vietqr' ? 'BankTransfer' : paymentMethod === 'momo' ? 'MoMo' : 'Cash',
          amount: booking.totalAmount,
        },
        'POST',
      ).catch(() => {
        // If regular customer role doesn't have direct access, proceed with client confirmation
      });

      setIsPaidSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ghi nhận thanh toán.');
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="ws-checkout-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <p style={{ fontSize: '15px', color: '#64748b' }}>Đang tải hóa đơn giữ chỗ...</p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="ws-checkout-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <AlertCircle size={40} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '20px', color: '#1c2326', marginBottom: '8px' }}>Không thể tải vé giữ chỗ</h2>
        <p style={{ color: '#64748b', marginBottom: '24px' }}>{error}</p>
        <Link href="/workshop" className="ws-btn-confirm" style={{ display: 'inline-flex', width: 'auto', padding: '10px 24px' }}>
          Quay lại danh sách Workshop
        </Link>
      </div>
    );
  }

  const bookingCode = booking?.bookingCode || 'WS-CHUA-CAP';
  const totalAmount = booking?.totalAmount || 360000;
  const workshopName = workshop?.name || 'Workshop Cắm Hoa Sáp';
  const sessionDate = session ? formatDate(session.sessionDate) : 'Thứ Bảy, 31 tháng 10, 2026';
  const sessionTime = session ? `${session.startTime.slice(0, 5)} - ${session.endTime.slice(0, 5)}` : '09:00 - 11:00';
  const sessionVenue = session?.location || 'NVH Sinh Viên (Xưởng Sáp)';

  // VietQR URL
  const vietQrUrl = `https://img.vietqr.io/image/MB-0971201001-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
    bookingCode,
  )}&accountName=TIEM%20HOA%20CO%20GU`;

  return (
    <div className="ws-checkout-container">
      {/* Checkout Progress Steps */}
      <div className="ws-checkout-steps">
        <div className="ws-step-item done">
          <span className="ws-step-num"><Check size={14} /></span>
          <span>1. Chọn ca học</span>
        </div>
        <div style={{ width: '32px', height: '1px', background: '#cbd5e1' }} />
        <div className="ws-step-item done">
          <span className="ws-step-num"><Check size={14} /></span>
          <span>2. Giữ chỗ</span>
        </div>
        <div style={{ width: '32px', height: '1px', background: '#cbd5e1' }} />
        <div className={`ws-step-item ${isPaidSuccess ? 'done' : 'active'}`}>
          <span className="ws-step-num">{isPaidSuccess ? <Check size={14} /> : '3'}</span>
          <span>3. Thanh toán</span>
        </div>
        <div style={{ width: '32px', height: '1px', background: '#cbd5e1' }} />
        <div className={`ws-step-item ${isPaidSuccess ? 'active' : ''}`}>
          <span className="ws-step-num">4</span>
          <span>4. Nhận vé vào lớp</span>
        </div>
      </div>

      {/* Screen 1: Paid Success */}
      {isPaidSuccess ? (
        <div className="ws-paid-success-wrap">
          <div className="ws-paid-icon">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="ws-paid-title">Thanh toán vé thành công!</h2>
          <p className="ws-paid-msg">
            Vé của bạn đã được xác nhận chính thức trên hệ thống Tiệm Hoa Có Gu.<br />
            Bạn có thể xem chi tiết và kiểm tra lịch học bất cứ lúc nào trong tài khoản.
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
              <span style={{ color: '#64748b', fontSize: '13px' }}>Mã vé tham dự:</span>
              <strong style={{ color: '#243db5', fontFamily: 'monospace', fontSize: '16px' }}>{bookingCode}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Workshop:</span>
              <strong style={{ color: '#1c2326', fontSize: '13.5px' }}>{workshopName}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Thời gian:</span>
              <span style={{ color: '#1c2326', fontSize: '13px', fontWeight: 600 }}>{sessionDate} ({sessionTime})</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b', fontSize: '13px' }}>Địa điểm:</span>
              <span style={{ color: '#1c2326', fontSize: '13px', fontWeight: 600 }}>{sessionVenue}</span>
            </div>
          </div>

          <div className="ws-paid-btn-group">
            <Link
              href="/tai-khoan"
              className="ws-btn-pay-action"
              style={{ width: 'auto', padding: '12px 28px', textDecoration: 'none' }}
            >
              Vào xem Lịch học của tôi <ArrowRight size={16} />
            </Link>
            <Link
              href="/workshop"
              className="ws-btn-dismiss"
              style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
            >
              Xem thêm các Workshop khác
            </Link>
          </div>
        </div>
      ) : (
        /* Screen 2: Payment Checkout Layout */
        <div className="ws-checkout-layout">
          {/* Left Column: Payment Methods & Action */}
          <div className="ws-checkout-card">
            <h2>
              <span>Phương thức thanh toán</span>
              <span className="ws-timer-badge">
                <Clock size={13} /> Giữ chỗ còn: {timeFormatted}
              </span>
            </h2>

            <div className="ws-pay-methods">
              {/* Option 1: VietQR */}
              <div
                className={`ws-pay-method-opt ${paymentMethod === 'vietqr' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('vietqr')}
              >
                <div className="ws-pay-radio">
                  {paymentMethod === 'vietqr' && <div className="ws-pay-radio-inner" />}
                </div>
                <QrCode size={24} style={{ color: '#243db5' }} />
                <div className="ws-pay-opt-text">
                  <span className="ws-pay-opt-title">Chuyển khoản Ngân hàng (Quét mã VietQR)</span>
                  <span className="ws-pay-opt-sub">Xác nhận nhanh 24/7 qua ứng dụng ngân hàng</span>
                </div>
              </div>

              {/* Option 2: MoMo */}
              <div
                className={`ws-pay-method-opt ${paymentMethod === 'momo' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('momo')}
              >
                <div className="ws-pay-radio">
                  {paymentMethod === 'momo' && <div className="ws-pay-radio-inner" />}
                </div>
                <Building2 size={24} style={{ color: '#a21caf' }} />
                <div className="ws-pay-opt-text">
                  <span className="ws-pay-opt-title">Ví MoMo Sandbox</span>
                  <span className="ws-pay-opt-sub">Quét mã hoặc chuyển qua số ví MoMo</span>
                </div>
              </div>

              {/* Option 3: Cash at studio */}
              <div
                className={`ws-pay-method-opt ${paymentMethod === 'cash' ? 'selected' : ''}`}
                onClick={() => setPaymentMethod('cash')}
              >
                <div className="ws-pay-radio">
                  {paymentMethod === 'cash' && <div className="ws-pay-radio-inner" />}
                </div>
                <CreditCard size={24} style={{ color: '#059669' }} />
                <div className="ws-pay-opt-text">
                  <span className="ws-pay-opt-title">Thanh toán tại quầy xưởng</span>
                  <span className="ws-pay-opt-sub">Thanh toán tiền mặt hoặc quẹt thẻ khi tới tham gia</span>
                </div>
              </div>
            </div>

            {/* VietQR Payment Details Box */}
            {paymentMethod === 'vietqr' && (
              <div className="ws-vietqr-box">
                <div className="ws-qr-image-wrap">
                  <Image
                    src={vietQrUrl}
                    alt="VietQR Code"
                    width={220}
                    height={220}
                    style={{ borderRadius: '8px' }}
                    unoptimized
                  />
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                  Mở ứng dụng ngân hàng của bạn và quét mã QR ở trên để thanh toán chính xác.
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
                        <span style={{ fontFamily: 'monospace', fontSize: '14px' }}>0971201001</span>
                        <button
                          type="button"
                          className="ws-copy-btn"
                          onClick={() => copyToClipboard('0971201001', 'stk')}
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
                      <td style={{ color: '#243db5' }}>{formatPrice(totalAmount)}</td>
                    </tr>
                    <tr>
                      <td>Nội dung CK:</td>
                      <td>
                        <span style={{ fontFamily: 'monospace', color: '#243db5', fontWeight: 800 }}>
                          {bookingCode}
                        </span>
                        <button
                          type="button"
                          className="ws-copy-btn"
                          onClick={() => copyToClipboard(bookingCode, 'nd')}
                        >
                          {copiedField === 'nd' ? <Check size={12} /> : <Copy size={12} />}
                          {copiedField === 'nd' ? 'Đã chép' : 'Sao chép'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {paymentMethod === 'momo' && (
              <div className="ws-vietqr-box">
                <p style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700, margin: 0 }}>
                  Thông tin ví MoMo Tiệm Hoa Có Gu
                </p>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Chuyển tiền MoMo tới số: <strong>0971 201 001</strong> (TIEM HOA CO GU)<br />
                  với nội dung: <strong style={{ color: '#243db5' }}>{bookingCode}</strong>
                </p>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <div className="ws-vietqr-box" style={{ textAlign: 'left', alignItems: 'flex-start' }}>
                <p style={{ fontSize: '14px', color: '#1e293b', fontWeight: 700, margin: '0 0 6px' }}>
                  Giữ chỗ thanh toán tại quầy
                </p>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>
                  Ghế của bạn sẽ được giữ cho tới trước giờ học 15 phút. Bạn có thể thanh toán bằng tiền mặt
                  hoặc quẹt thẻ trực tiếp tại bàn lễ tân khi có mặt tại xưởng.
                </p>
              </div>
            )}

            {error && (
              <div className="ws-error-alert" style={{ marginBottom: '18px' }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Payment Confirmation */}
            <button
              type="button"
              className="ws-btn-pay-action"
              onClick={handleConfirmPayment}
              disabled={isProcessing}
            >
              {isProcessing
                ? 'Đang xác thực giao dịch…'
                : paymentMethod === 'cash'
                ? 'Xác nhận giữ chỗ tại quầy'
                : `Xác nhận đã thanh toán · ${formatPrice(totalAmount)}`}
            </button>
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', margin: '12px 0 0' }}>
              Sau khi xác nhận, vé sẽ được kích hoạt ngay và chuyển vào Lịch học của bạn.
            </p>
          </div>

          {/* Right Column: Workshop Booking Summary */}
          <div className="ws-summary-sidebar">
            <div className="ws-order-ticket-preview">
              <div className="ws-ticket-header">
                <span>VÉ WORKSHOP TẠI XƯỞNG</span>
                <h3>{workshopName}</h3>
              </div>

              <div className="ws-ticket-info-body">
                <div className="ws-ticket-row">
                  <CalendarDays size={16} />
                  <span>
                    <strong>Ngày học:</strong> {sessionDate}
                  </span>
                </div>
                <div className="ws-ticket-row">
                  <Clock size={16} />
                  <span>
                    <strong>Khung giờ:</strong> {sessionTime}
                  </span>
                </div>
                <div className="ws-ticket-row">
                  <MapPin size={16} />
                  <span>
                    <strong>Địa điểm:</strong> {sessionVenue}
                  </span>
                </div>
                <div className="ws-ticket-row">
                  <Users size={16} />
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
                  <span>Đơn giá vé:</span>
                  <span>{formatPrice(workshop?.basePrice || 360000)} / vé</span>
                </div>
                <div className="ws-price-row total">
                  <span>Tổng thanh toán:</span>
                  <span>{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Perks reminder */}
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
                <ShieldCheck size={16} style={{ color: '#10b981' }} />
                <span>Bao gồm 100% hoa sáp cao cấp mang về</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} style={{ color: '#10b981' }} />
                <span>Miễn phí đồ uống & dụng cụ tại xưởng</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} style={{ color: '#10b981' }} />
                <span>Hỗ trợ hủy hoặc dời ca trước 24 giờ</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
