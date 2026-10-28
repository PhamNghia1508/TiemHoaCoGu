'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Plus,
  Send,
  MapPin,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import type { StaffOrder, DeliveryItem } from './types';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return { label: 'Chờ chuẩn bị', className: 'badge-confirmed' };
    case 'processing':
      return { label: 'Đang bó hoa', className: 'badge-processing' };
    case 'delivering':
      return { label: 'Đang giao hàng', className: 'badge-delivering' };
    case 'completed':
      return { label: 'Đã hoàn tất', className: 'badge-completed' };
    case 'cancelled':
      return { label: 'Đã hủy', className: 'badge-cancelled' };
    default:
      return { label: status, className: 'badge-default' };
  }
}

export default function StaffOrderManager() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<
    'all' | 'confirmed' | 'processing' | 'delivering' | 'completed'
  >('all');
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Deliveries cache per order
  const [orderDeliveries, setOrderDeliveries] = useState<Record<string, DeliveryItem[]>>({});
  const [loadingDeliveries, setLoadingDeliveries] = useState<string | null>(null);

  // Delivery Modal State
  const [shippingModalOrder, setShippingModalOrder] = useState<StaffOrder | null>(null);
  const [shipperUnit, setShipperUnit] = useState('GrabExpress');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await storeRequest<StaffOrder[]>('orders/staff');
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn hàng nhân viên.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Load deliveries for a specific order
  const loadDeliveries = async (orderId: string) => {
    setLoadingDeliveries(orderId);
    try {
      const data = await storeRequest<DeliveryItem[]>(`orders/staff/${orderId}/deliveries`);
      setOrderDeliveries((prev) => ({ ...prev, [orderId]: data || [] }));
    } catch {
      // Deliveries may be empty
    } finally {
      setLoadingDeliveries(null);
    }
  };

  const toggleExpand = (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(orderId);
      if (!orderDeliveries[orderId]) {
        void loadDeliveries(orderId);
      }
    }
  };

  // Status transitions
  const handleTransition = async (orderId: string, nextStatus: string) => {
    setActionBusy(orderId);
    setError('');
    try {
      await storeRequest(`orders/${orderId}/status`, { status: nextStatus }, 'POST');
      await loadOrders();
      if (expandedOrderId === orderId) {
        await loadDeliveries(orderId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chuyển trạng thái thất bại.');
    } finally {
      setActionBusy(null);
    }
  };

  // Open create delivery modal
  const openCreateDelivery = (order: StaffOrder) => {
    setShippingModalOrder(order);
    setShipperUnit('GrabExpress');
    setTrackingNumber(`SHIP-${Math.floor(100000 + Math.random() * 900000)}`);
    const initialQuantities: Record<string, number> = {};
    order.items.forEach((item) => {
      const remaining = Math.max(1, item.quantity - (item.shippedQuantity || 0));
      initialQuantities[item.id] = remaining;
    });
    setSelectedItems(initialQuantities);
  };

  // Submit new delivery
  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingModalOrder) return;
    setActionBusy(shippingModalOrder.id);
    setError('');
    try {
      const itemsPayload = Object.entries(selectedItems)
        .filter(([, qty]) => qty > 0)
        .map(([orderItemId, quantity]) => ({ orderItemId, quantity }));

      if (itemsPayload.length === 0) {
        setError('Vui lòng chọn ít nhất 1 sản phẩm để tạo chuyến giao.');
        setActionBusy(null);
        return;
      }

      await storeRequest(
        `orders/${shippingModalOrder.id}/deliveries`,
        {
          shipperUnit: shipperUnit.trim(),
          trackingNumber: trackingNumber.trim(),
          items: itemsPayload,
        },
        'POST',
      );

      setShippingModalOrder(null);
      await loadOrders();
      await loadDeliveries(shippingModalOrder.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tạo đợt giao hàng thất bại.');
    } finally {
      setActionBusy(null);
    }
  };

  // Delivery status transition
  const handleDeliveryStatus = async (orderId: string, deliveryId: string, nextStatus: string) => {
    setActionBusy(deliveryId);
    setError('');
    try {
      await storeRequest(
        `orders/${orderId}/deliveries/${deliveryId}/status`,
        { status: nextStatus },
        'POST',
      );
      await loadDeliveries(orderId);
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật chuyến giao hàng thất bại.');
    } finally {
      setActionBusy(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'all') return true;
    return o.orderStatus.toLowerCase() === filter;
  });

  const countConfirmed = orders.filter((o) => o.orderStatus.toLowerCase() === 'confirmed').length;
  const countProcessing = orders.filter((o) => o.orderStatus.toLowerCase() === 'processing').length;
  const countDelivering = orders.filter((o) => o.orderStatus.toLowerCase() === 'delivering').length;
  const countCompleted = orders.filter((o) => o.orderStatus.toLowerCase() === 'completed').length;

  return (
    <div className="staff-view-container">
      {/* Metrics Row */}
      <div className="staff-metrics-grid">
        <div className="staff-metric-card">
          <div className="staff-metric-icon bg-amber">
            <Clock size={20} />
          </div>
          <div>
            <span className="staff-metric-label">Cần chuẩn bị hoa</span>
            <strong className="staff-metric-val">{countConfirmed}</strong>
          </div>
        </div>

        <div className="staff-metric-card">
          <div className="staff-metric-icon bg-blue">
            <Package size={20} />
          </div>
          <div>
            <span className="staff-metric-label">Đang bó hoa</span>
            <strong className="staff-metric-val">{countProcessing}</strong>
          </div>
        </div>

        <div className="staff-metric-card">
          <div className="staff-metric-icon bg-purple">
            <Truck size={20} />
          </div>
          <div>
            <span className="staff-metric-label">Đang giao shipper</span>
            <strong className="staff-metric-val">{countDelivering}</strong>
          </div>
        </div>

        <div className="staff-metric-card">
          <div className="staff-metric-icon bg-emerald">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <span className="staff-metric-label">Đã hoàn tất</span>
            <strong className="staff-metric-val">{countCompleted}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Refresh Bar */}
      <div className="staff-filter-toolbar">
        <div className="staff-tabs-pills">
          <button
            type="button"
            className={`staff-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({orders.length})
          </button>
          <button
            type="button"
            className={`staff-pill ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Chờ xử lý ({countConfirmed})
          </button>
          <button
            type="button"
            className={`staff-pill ${filter === 'processing' ? 'active' : ''}`}
            onClick={() => setFilter('processing')}
          >
            Đang bó hoa ({countProcessing})
          </button>
          <button
            type="button"
            className={`staff-pill ${filter === 'delivering' ? 'active' : ''}`}
            onClick={() => setFilter('delivering')}
          >
            Đang giao ({countDelivering})
          </button>
          <button
            type="button"
            className={`staff-pill ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Đã xong ({countCompleted})
          </button>
        </div>

        <button
          type="button"
          className="staff-btn staff-btn-secondary"
          onClick={() => void loadOrders()}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="staff-alert error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} className="staff-alert-close">
            ×
          </button>
        </div>
      )}

      {/* Order List */}
      {loading ? (
        <div className="staff-loading-box">
          <RefreshCw size={24} className="spin-anim" />
          <p>Đang tải đơn hàng tiệm hoa…</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="staff-empty-box">
          <Package size={36} />
          <h3>Không có đơn hàng nào trong mục này</h3>
          <p>Các đơn hoa khách đặt sẽ tự động cập nhật vào danh sách ca làm việc của bạn.</p>
        </div>
      ) : (
        <div className="staff-orders-stack">
          {filteredOrders.map((order) => {
            const badge = statusBadge(order.orderStatus);
            const isExpanded = expandedOrderId === order.id;
            const deliveries = orderDeliveries[order.id] || [];
            const isBusy = actionBusy === order.id;

            return (
              <div key={order.id} className="staff-order-card">
                {/* Header Row */}
                <div className="staff-order-header">
                  <div className="staff-order-left">
                    <div className="staff-order-title-line">
                      <strong className="staff-order-code">#{order.orderCode}</strong>
                      <span className={`staff-badge ${badge.className}`}>{badge.label}</span>
                      <span
                        className={`staff-badge ${
                          order.paymentStatus === 'Paid' ? 'badge-completed' : 'badge-amber'
                        }`}
                      >
                        {order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                    <div className="staff-order-meta">
                      <span>
                        <Calendar size={13} /> {formatDate(order.createdAt)}
                      </span>
                      <span>
                        <MapPin size={13} /> {order.shippingAddress || 'Khách nhận tại tiệm'}
                      </span>
                    </div>
                  </div>

                  <div className="staff-order-right">
                    <div className="staff-order-total">
                      <small>Tổng thu</small>
                      <strong>{formatMoney(order.totalAmount)}</strong>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="staff-actions-group">
                      {order.orderStatus.toLowerCase() === 'confirmed' && (
                        <button
                          type="button"
                          className="staff-btn staff-btn-primary"
                          onClick={() => void handleTransition(order.id, 'Processing')}
                          disabled={isBusy}
                        >
                          Bắt đầu bó hoa
                        </button>
                      )}

                      {order.orderStatus.toLowerCase() === 'processing' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="staff-btn staff-btn-secondary"
                            onClick={() => openCreateDelivery(order)}
                            disabled={isBusy}
                          >
                            <Truck size={14} /> Gán Shipper
                          </button>
                          <button
                            type="button"
                            className="staff-btn staff-btn-primary"
                            onClick={() => void handleTransition(order.id, 'Delivering')}
                            disabled={isBusy}
                          >
                            Chuyển Đang giao
                          </button>
                        </div>
                      )}

                      {order.orderStatus.toLowerCase() === 'delivering' && (
                        <button
                          type="button"
                          className="staff-btn staff-btn-success"
                          onClick={() => void handleTransition(order.id, 'Completed')}
                          disabled={isBusy || order.paymentStatus !== 'Paid'}
                          title={
                            order.paymentStatus !== 'Paid'
                              ? 'Cần thu tiền đủ trước khi hoàn tất đơn'
                              : 'Bấm hoàn tất đơn'
                          }
                        >
                          Xác nhận Đã giao xong
                        </button>
                      )}

                      <button
                        type="button"
                        className="staff-btn-icon"
                        onClick={() => toggleExpand(order.id)}
                        aria-label="Xem chi tiết đơn"
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="staff-order-details">
                    <h4 className="staff-subhead">Sản phẩm hoa trong đơn:</h4>
                    <div className="staff-items-table">
                      {order.items.map((item, idx) => (
                        <div key={item.id || idx} className="staff-item-row">
                          <div className="staff-item-info">
                            <span className="staff-item-name">
                              Sản phẩm #{item.productId.slice(0, 8)}…
                            </span>
                            {item.customNote && (
                              <span className="staff-item-note">Ghi chú: {item.customNote}</span>
                            )}
                          </div>
                          <span className="staff-item-qty">x{item.quantity}</span>
                          <span className="staff-item-price">{formatMoney(item.finalPrice)}</span>
                          <span className="staff-item-shipped">
                            Đã gửi: {item.shippedQuantity || 0}/{item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Deliveries Sub-list */}
                    <div className="staff-deliveries-section">
                      <div className="staff-deliveries-head">
                        <h4 className="staff-subhead">
                          <Truck size={16} /> Lịch sử chuyến giao hàng ({deliveries.length})
                        </h4>
                        {order.orderStatus.toLowerCase() === 'processing' && (
                          <button
                            type="button"
                            className="staff-link-btn"
                            onClick={() => openCreateDelivery(order)}
                          >
                            <Plus size={14} /> Thêm chuyến giao
                          </button>
                        )}
                      </div>

                      {loadingDeliveries === order.id ? (
                        <p className="staff-muted">Đang tải thông tin chuyến giao…</p>
                      ) : deliveries.length === 0 ? (
                        <p className="staff-muted">
                          Chưa có chuyến giao hàng nào được tạo cho đơn này.
                        </p>
                      ) : (
                        <div className="staff-delivery-cards-grid">
                          {deliveries.map((d) => (
                            <div key={d.id} className="staff-delivery-card">
                              <div className="staff-delivery-card-top">
                                <strong>{d.deliveryCode}</strong>
                                <span
                                  className={`staff-badge badge-${d.deliveryStatus.toLowerCase()}`}
                                >
                                  {d.deliveryStatus}
                                </span>
                              </div>
                              <p className="staff-muted" style={{ margin: '4px 0 8px' }}>
                                Đơn vị: <strong>{d.shipperUnit || 'Nội bộ'}</strong> | Vận đơn:{' '}
                                <strong>{d.trackingNumber || '—'}</strong>
                              </p>

                              {/* Delivery Status buttons */}
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {d.deliveryStatus === 'Preparing' && (
                                  <button
                                    type="button"
                                    className="staff-btn staff-btn-secondary staff-btn-sm"
                                    onClick={() =>
                                      void handleDeliveryStatus(order.id, d.id, 'Shipped')
                                    }
                                    disabled={actionBusy === d.id}
                                  >
                                    Bàn giao Shipper (Shipped)
                                  </button>
                                )}
                                {d.deliveryStatus === 'Shipped' && (
                                  <button
                                    type="button"
                                    className="staff-btn staff-btn-success staff-btn-sm"
                                    onClick={() =>
                                      void handleDeliveryStatus(order.id, d.id, 'Delivered')
                                    }
                                    disabled={actionBusy === d.id}
                                  >
                                    Khách đã nhận (Delivered)
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create Delivery */}
      {shippingModalOrder && (
        <div className="staff-modal-backdrop" onClick={() => setShippingModalOrder(null)}>
          <div className="staff-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="staff-modal-header">
              <h3>Tạo chuyến giao hàng cho #{shippingModalOrder.orderCode}</h3>
              <button
                type="button"
                className="staff-modal-close"
                onClick={() => setShippingModalOrder(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="staff-modal-form">
              <label className="staff-field">
                <span>Đơn vị vận chuyển</span>
                <select
                  value={shipperUnit}
                  onChange={(e) => setShipperUnit(e.target.value)}
                  className="staff-input"
                >
                  <option value="GrabExpress">GrabExpress (Giao nhanh)</option>
                  <option value="Ahamove">Ahamove (Giao xe máy)</option>
                  <option value="GHTK">Giao Hàng Tiết Kiệm</option>
                  <option value="Shipper Tiệm">Nhân viên tiệm tự giao</option>
                </select>
              </label>

              <label className="staff-field">
                <span>Mã vận đơn / Số tham chiếu</span>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="staff-input"
                  required
                />
              </label>

              <div className="staff-field">
                <span>Chọn số lượng từng bó hoa để bàn giao đợt này:</span>
                <div className="staff-modal-items-list">
                  {shippingModalOrder.items.map((item) => (
                    <div key={item.id} className="staff-modal-item-row">
                      <span>Mã sp: {item.productId.slice(0, 8)}…</span>
                      <input
                        type="number"
                        min="0"
                        max={item.quantity}
                        value={selectedItems[item.id] || 0}
                        onChange={(e) =>
                          setSelectedItems((prev) => ({
                            ...prev,
                            [item.id]: Math.max(0, parseInt(e.target.value, 10) || 0),
                          }))
                        }
                        className="staff-input"
                        style={{ width: '80px' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="staff-modal-actions">
                <button
                  type="button"
                  className="staff-btn staff-btn-secondary"
                  onClick={() => setShippingModalOrder(null)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="staff-btn staff-btn-primary"
                  disabled={actionBusy === shippingModalOrder.id}
                >
                  <Send size={15} /> Xác nhận tạo chuyến
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
