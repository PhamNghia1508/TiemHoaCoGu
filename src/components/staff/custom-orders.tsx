'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Calendar,
  Layers,
  Image as ImageIcon,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';

type CustomRequestItem = {
  id: string;
  productId: string;
  quantity: number;
  description: string;
  referenceImageUrl?: string;
  requestedCompletionDate?: string;
  status: string;
  createdAt: string;
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'inproduction':
      return { label: 'Đang bó hoa', className: 'badge-processing' };
    case 'approved':
      return { label: 'Đã duyệt / Sẵn sàng cắm', className: 'badge-confirmed' };
    case 'completed':
      return { label: 'Đã hoàn tất', className: 'badge-completed' };
    case 'quoted':
      return { label: 'Đang chờ khách duyệt', className: 'badge-amber' };
    case 'submitted':
      return { label: 'Chờ Admin báo giá', className: 'badge-amber' };
    default:
      return { label: status, className: 'badge-default' };
  }
}

export default function StaffCustomOrders() {
  const [requests, setRequests] = useState<CustomRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storeRequest<CustomRequestItem[]>('custom-orders');
      setRequests(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách hoa đặt riêng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const handleStartProduction = async (id: string) => {
    setActionBusy(id);
    setError('');
    setSuccessMsg('');
    try {
      await storeRequest(`custom-orders/${id}/production/start`, {}, 'POST');
      setSuccessMsg('Đã ghi nhận bắt đầu bó hoa đặt riêng!');
      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Chưa thể bắt đầu (kiểm tra tiền cọc hoặc trạng thái duyệt).',
      );
    } finally {
      setActionBusy(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActionBusy(id);
    setError('');
    setSuccessMsg('');
    try {
      await storeRequest(`custom-orders/${id}/complete`, {}, 'POST');
      setSuccessMsg('Đã ghi nhận hoàn tất bó hoa đặt riêng!');
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hoàn tất bó hoa.');
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="staff-view-container">
      {/* Notifications */}
      {error && (
        <div className="staff-alert error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="staff-alert-close">
            ×
          </button>
        </div>
      )}

      {successMsg && (
        <div className="staff-alert success" role="alert">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg('')} className="staff-alert-close">
            ×
          </button>
        </div>
      )}

      <div className="staff-filter-toolbar">
        <div>
          <h3>Tiến độ Bó hoa Đặt riêng (Crafting Studio)</h3>
          <p className="staff-muted">
            Thợ cắm hoa nhận các đơn khách đã chốt cọc để tiến hành cắm hoa và bàn giao.
          </p>
        </div>
        <button
          type="button"
          className="staff-btn staff-btn-secondary"
          onClick={() => void loadRequests()}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {loading ? (
        <div className="staff-loading-box">
          <RefreshCw size={24} className="spin-anim" />
          <p>Đang tải đơn hoa đặt riêng…</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="staff-empty-box">
          <Sparkles size={36} />
          <h3>Chưa có yêu cầu làm hoa riêng nào</h3>
          <p>
            Khi khách hàng gửi mẫu hoa riêng qua form đặt trước, thông tin sẽ được hiển thị ở đây.
          </p>
        </div>
      ) : (
        <div className="staff-custom-grid">
          {requests.map((item) => {
            const badge = statusBadge(item.status);
            const isBusy = actionBusy === item.id;
            const canStart = item.status.toLowerCase() === 'approved';
            const canComplete = item.status.toLowerCase() === 'inproduction';

            return (
              <div key={item.id} className="staff-custom-card">
                <div className="staff-custom-header">
                  <span className="staff-mono">Mã #{item.id.slice(0, 8)}</span>
                  <span className={`staff-badge ${badge.className}`}>{badge.label}</span>
                </div>

                <div className="staff-custom-body">
                  <p className="staff-custom-desc">
                    {item.description || 'Khách đặt hoa sáp thiết kế riêng theo yêu cầu.'}
                  </p>

                  <div className="staff-custom-details-meta">
                    <span>
                      <Layers size={14} /> Số lượng: <strong>{item.quantity} bó</strong>
                    </span>
                    <span>
                      <Calendar size={14} /> Hẹn hoàn tất:{' '}
                      <strong>{formatDate(item.requestedCompletionDate)}</strong>
                    </span>
                  </div>

                  {item.referenceImageUrl && (
                    <div className="staff-custom-img-preview">
                      <ImageIcon size={14} />
                      <a
                        href={item.referenceImageUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-link"
                      >
                        Xem ảnh mẫu khách gửi
                      </a>
                    </div>
                  )}
                </div>

                <div className="staff-custom-footer">
                  {canStart && (
                    <button
                      type="button"
                      className="staff-btn staff-btn-primary"
                      onClick={() => void handleStartProduction(item.id)}
                      disabled={isBusy}
                    >
                      <Play size={14} /> Bắt đầu bó hoa
                    </button>
                  )}

                  {canComplete && (
                    <button
                      type="button"
                      className="staff-btn staff-btn-success"
                      onClick={() => void handleComplete(item.id)}
                      disabled={isBusy}
                    >
                      <CheckCircle2 size={14} /> Hoàn tất cắm hoa
                    </button>
                  )}

                  {!canStart && !canComplete && (
                    <span className="staff-muted" style={{ fontSize: '13px' }}>
                      {item.status.toLowerCase() === 'completed'
                        ? '✓ Đã xong bó hoa'
                        : 'Chờ khách chốt cọc'}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
