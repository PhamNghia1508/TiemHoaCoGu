'use client';

import { useState } from 'react';
import { CreditCard, Banknote, CheckCircle2, AlertCircle, Send, Receipt } from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';

export default function StaffCounterPos() {
  const [targetType, setTargetType] = useState<'order' | 'booking'>('order');
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'BankTransfer'>('Cash');
  const [transactionCode, setTransactionCode] = useState(
    () => `POS-${Date.now().toString().slice(-6)}`,
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = targetId.trim();
    const numAmount = parseFloat(amount);

    if (!cleanId) {
      setError('Vui lòng nhập ID đơn hàng hoặc ID vé workshop.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Số tiền thanh toán phải lớn hơn 0.');
      return;
    }

    setBusy(true);
    setError('');
    setSuccess('');

    try {
      const endpoint =
        targetType === 'order' ? `payments/order/${cleanId}` : `payments/booking/${cleanId}`;
      await storeRequest(
        endpoint,
        {
          paymentMethod,
          transactionCode: transactionCode.trim(),
          amount: numAmount,
        },
        'POST',
      );

      setSuccess(
        `Ghi nhận thanh toán ${paymentMethod === 'Cash' ? 'tiền mặt' : 'chuyển khoản'} thành công!`,
      );
      setTargetId('');
      setAmount('');
      setTransactionCode(`POS-${Date.now().toString().slice(-6)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ghi nhận thanh toán tại quầy thất bại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="staff-view-container" style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div className="staff-section-card">
        <div className="staff-section-header">
          <div>
            <h3>Thu ngân & Thanh toán tại quầy (POS)</h3>
            <p className="staff-muted">
              Ghi nhận tiền mặt hoặc chuyển khoản trực tiếp từ khách hàng đến nhận hoa hoặc học viên
              tại xưởng.
            </p>
          </div>
        </div>

        {error && (
          <div className="staff-alert error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="staff-alert-close">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="staff-alert success" role="alert">
            <CheckCircle2 size={18} />
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess('')} className="staff-alert-close">
              ×
            </button>
          </div>
        )}

        <form onSubmit={handleRecordPayment} className="staff-form-stack">
          {/* Target Type Selector */}
          <div className="staff-field">
            <span>Loại thanh toán thu</span>
            <div className="staff-type-toggle">
              <button
                type="button"
                className={`staff-toggle-opt ${targetType === 'order' ? 'active' : ''}`}
                onClick={() => setTargetType('order')}
              >
                <Receipt size={16} /> Đơn hàng hoa
              </button>
              <button
                type="button"
                className={`staff-toggle-opt ${targetType === 'booking' ? 'active' : ''}`}
                onClick={() => setTargetType('booking')}
              >
                <CreditCard size={16} /> Vé Workshop
              </button>
            </div>
          </div>

          <label className="staff-field">
            <span>
              {targetType === 'order'
                ? 'ID Đơn hàng (Order ID / GUID)'
                : 'ID Vé học (Booking ID / GUID)'}
            </span>
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder={
                targetType === 'order'
                  ? 'Ví dụ: 3fa85f64-5717-4562-b3fc-2c963f66afa6'
                  : 'Ví dụ: 2ca91f22-1234-4562-b3fc-1d963f66afa1'
              }
              className="staff-input"
              required
            />
          </label>

          <label className="staff-field">
            <span>Số tiền khách thanh toán (VNĐ)</span>
            <input
              type="number"
              step="1000"
              min="1000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ví dụ: 350000"
              className="staff-input"
              required
            />
          </label>

          <div className="staff-field">
            <span>Hình thức thanh toán</span>
            <div className="staff-type-toggle">
              <button
                type="button"
                className={`staff-toggle-opt ${paymentMethod === 'Cash' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('Cash')}
              >
                <Banknote size={16} /> Tiền mặt (Cash)
              </button>
              <button
                type="button"
                className={`staff-toggle-opt ${paymentMethod === 'BankTransfer' ? 'active' : ''}`}
                onClick={() => setPaymentMethod('BankTransfer')}
              >
                <CreditCard size={16} /> Quẹt thẻ / Chuyển khoản (BankTransfer)
              </button>
            </div>
          </div>

          <label className="staff-field">
            <span>Mã biên nhận / Số tham chiếu</span>
            <input
              type="text"
              value={transactionCode}
              onChange={(e) => setTransactionCode(e.target.value)}
              className="staff-input"
              required
            />
          </label>

          <button
            type="submit"
            className="staff-btn staff-btn-primary"
            style={{ height: '44px', marginTop: '12px' }}
            disabled={busy}
          >
            <Send size={16} /> {busy ? 'Đang ghi nhận…' : 'Xác nhận thu tiền tại quầy'}
          </button>
        </form>
      </div>
    </div>
  );
}
