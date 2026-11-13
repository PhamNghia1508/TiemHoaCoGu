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
import type { BouquetSnapshot } from '@/lib/api/client';
import {
  bouquetSummary,
  customStatusLabel,
  customStatusTone,
  safeHttpUrl,
  type CustomStatusTone,
} from '@/lib/custom-order-status';

type CustomRequestItem = {
  id: string;
  productId: string;
  quantity: number;
  description: string;
  referenceImageUrl?: string;
  requestedCompletionDate?: string;
  status: string;
  createdAt: string;
  productName: string;
  updatedAt: string;
  quoteVersion: number;
  orderId?: string | null;
  orderCode?: string | null;
  depositReady: boolean;
  fullyPaid: boolean;
  deliveryComplete: boolean;
  bouquet?: BouquetSnapshot | null;
};

const toneClass: Record<CustomStatusTone, string> = {
  waiting: 'badge-amber',
  active: 'badge-processing',
  done: 'badge-completed',
  stopped: 'badge-cancelled',
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

function blockReason(item: CustomRequestItem): string {
  const status = item.status.toLowerCase();
  if (status === 'completed') return 'Đã hoàn tất.';
  if (status === 'cancelled') return 'Yêu cầu đã hủy.';
  if (status === 'expired') return 'Đơn đã hết hạn thanh toán.';
  if (status === 'checkedout' && !item.depositReady) return 'Chờ khách thanh toán cọc.';
  if (status === 'production' && !item.fullyPaid) return 'Chờ khách thanh toán đủ.';
  if (status === 'production' && item.fullyPaid && !item.deliveryComplete)
    return 'Chờ giao hàng hoàn tất.';
  if (['requested', 'quoted', 'approved'].includes(status)) return 'Chờ khách duyệt và tạo đơn.';
  return 'Chưa đủ điều kiện chuyển bước.';
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
      setSuccessMsg('Đã ghi nhận bắt đầu sản xuất.');
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa thể bắt đầu sản xuất.');
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
      setSuccessMsg('Đã ghi nhận hoàn tất đơn.');
      await loadRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hoàn tất đơn.');
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="staff-view-container">
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
        <div className="staff-alert success" role="status">
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
            Chỉ bắt đầu khi đơn đã tạo và cọc đã ghi nhận; chỉ hoàn tất khi đã thanh toán đủ và giao
            hàng xong.
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
            const isBusy = actionBusy === item.id;
            const status = item.status.toLowerCase();
            const canStart = status === 'checkedout' && item.depositReady;
            const canComplete = status === 'production' && item.fullyPaid && item.deliveryComplete;
            const referenceUrl = safeHttpUrl(item.referenceImageUrl);
            const reason = blockReason(item);

            return (
              <div key={item.id} className="staff-custom-card">
                <div className="staff-custom-header">
                  <span className="staff-mono">Mã #{item.id.slice(0, 8)}</span>
                  <span className={`staff-badge ${toneClass[customStatusTone(item.status)]}`}>
                    {customStatusLabel(item.status)}
                  </span>
                </div>

                <div className="staff-custom-body">
                  <p className="staff-custom-desc">
                    <strong>{item.productName || item.productId}</strong>
                  </p>
                  <p className="staff-custom-desc">{item.description || 'Không có mô tả.'}</p>
                  {item.bouquet && (
                    <p className="staff-custom-desc">
                      {item.quantity} bó · Mỗi bó: {bouquetSummary(item.bouquet)}
                    </p>
                  )}

                  <div className="staff-custom-details-meta">
                    <span>
                      <Layers size={14} /> Số lượng: <strong>{item.quantity}</strong>
                    </span>
                    <span>
                      <Calendar size={14} /> Ngày khách mong nhận:{' '}
                      <strong>{formatDate(item.requestedCompletionDate)}</strong>
                    </span>
                    {item.orderCode && (
                      <span>
                        Đơn hàng: <strong>{item.orderCode}</strong>
                      </span>
                    )}
                  </div>

                  {referenceUrl && (
                    <div className="staff-custom-img-preview">
                      <ImageIcon size={14} />
                      <a
                        href={referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
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
                      <Play size={14} /> Bắt đầu sản xuất
                    </button>
                  )}

                  {canComplete && (
                    <button
                      type="button"
                      className="staff-btn staff-btn-success"
                      onClick={() => void handleComplete(item.id)}
                      disabled={isBusy}
                    >
                      <CheckCircle2 size={14} /> Hoàn tất đơn
                    </button>
                  )}

                  {!canStart && !canComplete && (
                    <span className="staff-muted" style={{ fontSize: '13px' }}>
                      {reason}
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
