'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CreditCard,
  QrCode,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  AlertCircle,
  ShieldCheck,
  X,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import { money } from '@/lib/catalog';

interface VnPaySandboxModalProps {
  orderId: string;
  orderCode?: string;
  totalAmount: number;
  redirectUrl?: string;
  onClose: () => void;
}

export default function VnPaySandboxModal({
  orderId,
  orderCode,
  totalAmount,
  redirectUrl,
  onClose,
}: VnPaySandboxModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'card' | 'qr' | 'redirect'>('card');
  const [secondsLeft, setSecondsLeft] = useState(899); // 14:59
  const [copiedField, setCopiedField] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  async function handleSimulatePayment(success: boolean, responseCode: string) {
    setIsSubmitting(true);
    setError('');
    try {
      await storeRequest(
        `gateway/orders/${orderId}/simulate-sandbox`,
        {
          success,
          responseCode,
        },
        'POST',
      );

      // Redirect to payment result page with query params
      const returnUrl = `/thanh-toan/ket-qua?orderId=${encodeURIComponent(orderId)}&vnp_ResponseCode=${responseCode}&vnp_BankCode=NCB&vnp_Amount=${totalAmount * 100}`;
      router.push(returnUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thực hiện thao tác.');
      setIsSubmitting(false);
    }
  }

  const vietQrUrl = `https://img.vietqr.io/image/970419-9704198526191432198-compact2.png?amount=${totalAmount}&addInfo=${encodeURIComponent(
    orderCode || orderId.slice(0, 8),
  )}&accountName=NGUYEN%20VAN%20A`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: '#005ba9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '18px',
                letterSpacing: '-0.5px',
              }}
            >
              VNP
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Cổng VNPAY Sandbox
                </h3>
                <span
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                  }}
                >
                  v2.1.0 Test
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: '#64748b' }}>
                Mã đơn: <strong style={{ color: '#334155' }}>{orderCode || orderId}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              border: 'none',
              background: '#f1f5f9',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: '#64748b',
            }}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Order Amount Banner & Timer */}
        <div
          style={{
            padding: '14px 24px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
              Số tiền cần thanh toán
            </span>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#005ba9' }}>
              {money(totalAmount)}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <Clock size={16} />
            <span>Chờ thanh toán: {timerDisplay}</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#ffffff',
            padding: '0 16px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderBottom: activeTab === 'card' ? '2px solid #005ba9' : '2px solid transparent',
              background: 'none',
              color: activeTab === 'card' ? '#005ba9' : '#64748b',
              fontWeight: activeTab === 'card' ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <CreditCard size={16} /> Thẻ NCB Sandbox (Khuyên dùng)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('redirect')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderBottom: activeTab === 'redirect' ? '2px solid #005ba9' : '2px solid transparent',
              background: 'none',
              color: activeTab === 'redirect' ? '#005ba9' : '#64748b',
              fontWeight: activeTab === 'redirect' ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <ExternalLink size={16} /> Cổng Web VNPAY
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderBottom: activeTab === 'qr' ? '2px solid #005ba9' : '2px solid transparent',
              background: 'none',
              color: activeTab === 'qr' ? '#005ba9' : '#64748b',
              fontWeight: activeTab === 'qr' ? 700 : 500,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <QrCode size={16} /> Mã VietQR
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ padding: '20px 24px', flex: 1 }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                color: '#dc2626',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {activeTab === 'card' && (
            <div>
              {/* Virtual ATM Card Visual */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #005ba9 0%, #1e40af 50%, #0369a1 100%)',
                  borderRadius: '18px',
                  padding: '20px 22px',
                  color: '#ffffff',
                  boxShadow: '0 10px 25px -5px rgba(0, 91, 169, 0.4)',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '1px' }}>NCB BANK</span>
                  <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '6px' }}>
                    ATM SANDBOX
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '18px',
                    letterSpacing: '2px',
                    fontWeight: 700,
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>9704 1985 2619 1432 198</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('9704198526191432198', 'card')}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      border: 'none',
                      color: '#ffffff',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {copiedField === 'card' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedField === 'card' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', textTransform: 'uppercase', opacity: 0.85 }}>
                  <div>
                    <div style={{ fontSize: '9px', opacity: 0.7 }}>Chủ thẻ</div>
                    <div style={{ fontWeight: 600 }}>NGUYEN VAN A</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', opacity: 0.7 }}>Ngày phát hành</div>
                    <div style={{ fontWeight: 600 }}>07/15</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '9px', opacity: 0.7 }}>Mã OTP Test</div>
                    <div style={{ fontWeight: 700, color: '#fef08a' }}>123456</div>
                  </div>
                </div>
              </div>

              {/* Notice */}
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '12.5px',
                  color: '#166534',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <ShieldCheck size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <div>
                  <strong>Kiểm thử chuẩn 100%:</strong> Khi bấm xác nhận, hệ thống backend sẽ tính toán chữ ký
                  HMAC-SHA512 thực tế và xác nhận thanh toán qua Server-to-Server IPN.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleSimulatePayment(true, '00')}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#005ba9',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '14px 20px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(0, 91, 169, 0.25)',
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={18} className="spin" /> Đang ghi nhận thanh toán qua IPN...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Xác nhận thanh toán thành công (Thẻ NCB)
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSimulatePayment(false, '24')}
                  disabled={isSubmitting}
                  style={{
                    backgroundColor: '#fffbeb',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    borderRadius: '14px',
                    padding: '12px 20px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <XCircle size={17} /> Mô phỏng khách hàng hủy / Thanh toán thất bại (Code 24)
                </button>
              </div>
            </div>
          )}

          {activeTab === 'redirect' && (
            <div>
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '18px',
                  fontSize: '13px',
                  color: '#475569',
                }}
              >
                <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '6px' }}>
                  Đường dẫn thanh toán VNPAY chính thức:
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    backgroundColor: '#ffffff',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    wordBreak: 'break-all',
                    maxHeight: '75px',
                    overflowY: 'auto',
                    color: '#0f172a',
                    marginBottom: '10px',
                  }}
                >
                  {redirectUrl || 'Đang tạo liên kết VNPAY...'}
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                  * Lưu ý: Môi trường VNPAY Sandbox có thể yêu cầu Terminal ID liên kết tên miền đã kích hoạt trên portal VNPAY (Code 72). Để báo cáo đồ án mượt mà, bạn có thể dùng tab &ldquo;Thẻ NCB Sandbox&rdquo;.
                </p>
              </div>

              {redirectUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <a
                    href={redirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      backgroundColor: '#005ba9',
                      color: '#ffffff',
                      textDecoration: 'none',
                      borderRadius: '14px',
                      padding: '13px 20px',
                      fontSize: '14px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(0, 91, 169, 0.25)',
                    }}
                  >
                    Mở Cổng VNPAY Web (Tab mới) <ExternalLink size={16} />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/thanh-toan/ket-qua?orderId=${encodeURIComponent(orderId)}`);
                    }}
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '11px 20px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    Đã thanh toán trên VNPAY? Kiểm tra đối soát <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qr' && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  display: 'inline-block',
                  padding: '12px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  marginBottom: '14px',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vietQrUrl}
                  alt="Mã VietQR"
                  style={{ width: '220px', height: 'auto', display: 'block' }}
                />
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
                Quét mã VietQR bằng ứng dụng Mobile Banking bất kỳ để chuyển khoản đúng số tiền{' '}
                <strong style={{ color: '#0f172a' }}>{money(totalAmount)}</strong>.
              </p>
              <button
                type="button"
                onClick={() => handleSimulatePayment(true, '00')}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#005ba9',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '12px 20px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={16} /> Xác nhận đã chuyển khoản
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
