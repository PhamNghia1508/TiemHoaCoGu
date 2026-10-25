'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { storeRequest } from '@/lib/browser-api';
import {
  AdminDialog,
  AdminEmpty,
  AdminLoading,
  AdminPagination,
  StatusBadge,
  statusLabel,
  useAdminConfirm,
  useDebouncedValue,
} from '@/components/admin/primitives';

type OrderItem = {
  id: string;
  productId: string;
  productName?: string | null;
  quantity: number;
  unitPrice: number;
  finalPrice: number;
  shippedQuantity?: number;
  customNote?: string;
  referenceImageUrl?: string;
};
type Order = {
  id: string;
  orderCode: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  subTotal?: number;
  subtotal?: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  shippingAddress: string;
  note?: string;
  createdAt: string;
  items: OrderItem[];
};
type Page<T> = { items: T[]; total: number; page: number; pageSize: number };
type DeliveryLine = { orderItemId: string; quantity: number };
type Delivery = {
  id: string;
  deliveryCode: string;
  shipperUnit?: string | null;
  trackingNumber?: string | null;
  deliveryStatus: string;
  items: DeliveryLine[];
};
type DeliveryDraft = { itemId: string; quantity: string };

type Props = { readOnly?: boolean; initialStatus?: string };

const PAGE_SIZE = 20;
const ORDER_STATUSES = ['Confirmed', 'Processing', 'Delivering', 'Completed', 'Cancelled'];
const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
const dateTime = (value: string) => new Date(value).toLocaleString('vi-VN');
const errText = (e: unknown) => (e instanceof Error ? e.message : 'Không thể thực hiện yêu cầu.');

export default function AdminOrderOperations({ readOnly = false, initialStatus = '' }: Props) {
  const confirm = useAdminConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState(initialStatus);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryDraft[]>([]);
  const [shipper, setShipper] = useState('');
  const [tracking, setTracking] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const selectionRequest = useRef(0);

  const request = useCallback(
    async <T,>(path: string, body?: unknown, method = 'GET') => storeRequest<T>(path, body, method),
    [],
  );

  const loadOrders = useCallback(async () => {
    setListLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
      if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
      if (status) params.set('status', status);
      if (from) params.set('from', new Date(`${from}T00:00:00`).toISOString());
      if (to) params.set('to', new Date(`${to}T23:59:59.999`).toISOString());
      const result = await request<Page<Order>>(`management/orders?${params.toString()}`);
      setOrders(result.items);
      setTotal(result.total);
    } catch (e) {
      setError(errText(e));
    } finally {
      setListLoading(false);
    }
  }, [debouncedSearch, from, page, request, status, to]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  const selectOrder = async (order: Order) => {
    const requestId = ++selectionRequest.current;
    setSelected(order);
    setDialogOpen(true);
    setDetailLoading(true);
    setError('');
    setDeliveryDraft((order.items ?? []).map((item) => ({ itemId: item.id, quantity: '0' })));
    try {
      const [fresh, orderDeliveries] = await Promise.all([
        request<Order>(`management/orders/${order.id}`),
        request<Delivery[]>(`orders/staff/${order.id}/deliveries`),
      ]);
      if (requestId !== selectionRequest.current) return;
      setSelected(fresh);
      setDeliveries(orderDeliveries);
      setDeliveryDraft(fresh.items.map((item) => ({ itemId: item.id, quantity: '0' })));
    } catch (e) {
      if (requestId === selectionRequest.current) setError(errText(e));
    } finally {
      if (requestId === selectionRequest.current) setDetailLoading(false);
    }
  };

  const refreshSelected = async (orderId: string) => {
    const requestId = ++selectionRequest.current;
    try {
      const [fresh, orderDeliveries] = await Promise.all([
        request<Order>(`management/orders/${orderId}`),
        request<Delivery[]>(`orders/staff/${orderId}/deliveries`),
      ]);
      if (requestId !== selectionRequest.current) return;
      setSelected(fresh);
      setDeliveries(orderDeliveries);
      setDeliveryDraft(fresh.items.map((item) => ({ itemId: item.id, quantity: '0' })));
    } catch (e) {
      if (requestId === selectionRequest.current) setError(errText(e));
    }
  };

  const transition = async (next: string) => {
    if (!selected || readOnly || busy || detailLoading) return;
    const destructive = next === 'Cancelled';
    if (
      (destructive || next === 'Completed') &&
      !(await confirm({
        title: destructive ? 'Hủy đơn hàng?' : 'Hoàn tất đơn hàng?',
        description: destructive
          ? `Đơn ${selected.orderCode} sẽ chuyển sang Đã hủy.`
          : `Xác nhận chuyển đơn ${selected.orderCode} sang Hoàn tất?`,
        confirmLabel: destructive ? 'Hủy đơn' : 'Hoàn tất',
        destructive,
      }))
    )
      return;
    setBusy(true);
    setError('');
    try {
      await request(`orders/${selected.id}/status`, { status: next }, 'POST');
      setNotice(`Đã chuyển đơn sang ${statusLabel(next)}.`);
      await Promise.all([loadOrders(), refreshSelected(selected.id)]);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const createDelivery = async () => {
    if (!selected || readOnly || busy || detailLoading) return;
    const items: DeliveryLine[] = [];
    for (const draft of deliveryDraft) {
      const item = selected.items.find((candidate) => candidate.id === draft.itemId);
      const remaining = item ? Math.max(0, item.quantity - (item.shippedQuantity ?? 0)) : 0;
      if (!draft.quantity.trim()) continue;
      if (!/^\d+$/.test(draft.quantity) || Number(draft.quantity) > remaining) {
        setError('Số lượng giao phải là số nguyên từ 0 đến số lượng còn lại.');
        return;
      }
      if (Number(draft.quantity) > 0)
        items.push({ orderItemId: draft.itemId, quantity: Number(draft.quantity) });
    }
    if (!items.length) {
      setError('Nhập ít nhất một số lượng giao lớn hơn 0.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await request<Delivery>(
        `orders/${selected.id}/deliveries`,
        { shipperUnit: shipper, trackingNumber: tracking, items },
        'POST',
      );
      setNotice('Đã tạo phiếu giao nội bộ; chưa đặt vận chuyển với nhà cung cấp.');
      await refreshSelected(selected.id);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const deliveryTransition = async (delivery: Delivery, next: string) => {
    if (!selected || readOnly || busy || detailLoading) return;
    const isCancel = next === 'Cancelled';
    if (
      !(await confirm({
        title: isCancel
          ? 'Hủy phiếu giao?'
          : next === 'Delivered'
            ? 'Xác nhận đã giao?'
            : 'Xác nhận cập nhật phiếu?',
        description: isCancel
          ? `Phiếu ${delivery.deliveryCode} sẽ chuyển sang Đã hủy.`
          : `Xác nhận chuyển phiếu ${delivery.deliveryCode} sang ${statusLabel(next)}?`,
        confirmLabel: isCancel ? 'Hủy phiếu' : 'Xác nhận',
        destructive: isCancel,
      }))
    )
      return;
    setBusy(true);
    setError('');
    try {
      await request(
        `orders/${selected.id}/deliveries/${delivery.id}/status`,
        { status: next },
        'POST',
      );
      setNotice(`Đã chuyển ${delivery.deliveryCode} sang ${statusLabel(next)}.`);
      await refreshSelected(selected.id);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const csvQuery = useMemo(
    () =>
      new URLSearchParams({
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(status ? { status } : {}),
        ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}),
        ...(to ? { to: new Date(`${to}T23:59:59.999`).toISOString() } : {}),
      }).toString(),
    [debouncedSearch, from, status, to],
  );

  const nextAction =
    selected?.orderStatus === 'Confirmed'
      ? ['Processing', 'Bắt đầu xử lý']
      : selected?.orderStatus === 'Processing'
        ? ['Delivering', 'Chuyển sang đang giao']
        : selected?.orderStatus === 'Delivering'
          ? ['Completed', 'Hoàn tất đơn']
          : null;
  const selectedItems = selected?.items ?? [];

  return (
    <section className="admin-card" aria-labelledby="order-operations-heading">
      <div className="admin-section-heading">
        <div>
          <h2 id="order-operations-heading">Đơn hàng & giao hàng</h2>
          <p className="admin-muted">
            Xử lý đơn theo từng bước. Phiếu giao chỉ là bản ghi nội bộ, không đặt vận chuyển với nhà
            cung cấp.
          </p>
        </div>
        <div className="admin-actions">
          <button
            className="button button-outline"
            type="button"
            onClick={() => void loadOrders()}
            disabled={listLoading || busy}
          >
            Làm mới
          </button>
          <a
            className="button"
            href={`/api/store/management/reports/orders.csv?${csvQuery}`}
            download="orders.csv"
          >
            Xuất CSV
          </a>
        </div>
      </div>
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <div className="admin-error" role="alert">
          <span>{error}</span>{' '}
          <button className="button button-outline" type="button" onClick={() => void loadOrders()}>
            Thử lại
          </button>
        </div>
      )}

      <div className="admin-toolbar">
        <label className="admin-field">
          <span>Tìm kiếm</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Mã đơn, khách, email, địa chỉ"
          />
        </label>
        <div className="admin-filter-tabs" role="group" aria-label="Lọc trạng thái đơn hàng">
          <button
            className={`button button-outline${!status ? ' is-selected' : ''}`}
            aria-pressed={!status}
            type="button"
            onClick={() => {
              setStatus('');
              setPage(1);
            }}
          >
            Tất cả
          </button>
          {ORDER_STATUSES.map((value) => (
            <button
              key={value}
              className={`button button-outline${status === value ? ' is-selected' : ''}`}
              aria-pressed={status === value}
              type="button"
              onClick={() => {
                setStatus(value);
                setPage(1);
              }}
            >
              {statusLabel(value)}
            </button>
          ))}
        </div>
        <button
          className="button button-outline"
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Bộ lọc nâng cao
        </button>
      </div>
      {filtersOpen && (
        <div className="admin-form-grid admin-form-section">
          <label className="admin-field">
            <span>Từ ngày</span>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="admin-field">
            <span>Đến ngày</span>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
      )}

      <div className="admin-order-list">
        <div className="admin-list">
          {listLoading ? (
            <AdminLoading label="Đang tải đơn hàng…" />
          ) : orders.length === 0 ? (
            <AdminEmpty title="Không có đơn hàng" description="Thử thay đổi từ khóa hoặc bộ lọc." />
          ) : (
            <div className="admin-record-list">
              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  className={`admin-record${selected?.id === order.id ? ' is-selected' : ''}`}
                  onClick={() => void selectOrder(order)}
                  aria-pressed={selected?.id === order.id}
                >
                  <span>
                    <strong>{order.orderCode}</strong>
                    <small>
                      {order.customerName || 'Khách vãng lai'} · {dateTime(order.createdAt)}
                    </small>
                  </span>
                  <span>
                    <StatusBadge status={order.orderStatus} />
                    <strong>{money(order.totalAmount)}</strong>
                  </span>
                </button>
              ))}
            </div>
          )}
          <AdminPagination
            page={page}
            pageSize={PAGE_SIZE}
            total={total}
            onPage={setPage}
            loading={listLoading || busy}
          />
        </div>
      </div>

      <AdminDialog
        open={dialogOpen && !!selected}
        onClose={() => {
          if (!busy) {
            selectionRequest.current += 1;
            setDialogOpen(false);
          }
        }}
        title={selected ? `Chi tiết ${selected.orderCode}` : 'Chi tiết đơn hàng'}
        description="Xem đầy đủ thông tin đơn hàng và thao tác theo trạng thái."
        wide
      >
        {error && (
          <p className="admin-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="admin-notice" role="status">
            {notice}
          </p>
        )}
        {detailLoading ? (
          <AdminLoading label="Đang tải chi tiết…" />
        ) : (
          selected && (
            <div className="admin-detail">
              <div className="admin-actions">
                <button
                  className="button button-outline"
                  type="button"
                  disabled={busy}
                  onClick={() => setDialogOpen(false)}
                >
                  Đóng
                </button>
                {nextAction && (
                  <button
                    className="button"
                    type="button"
                    disabled={busy || readOnly}
                    onClick={() => void transition(nextAction[0])}
                  >
                    {nextAction[1]}
                  </button>
                )}
                {['Confirmed', 'Processing'].includes(selected.orderStatus) && (
                  <button
                    className="button button-danger"
                    type="button"
                    disabled={busy || readOnly}
                    onClick={() => void transition('Cancelled')}
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
              <div className="admin-form-grid">
                <section className="admin-form-section">
                  <h3>Thông tin đơn</h3>
                  <p>
                    <strong>Trạng thái:</strong> <StatusBadge status={selected.orderStatus} />
                  </p>
                  <p>
                    <strong>Thanh toán:</strong> <StatusBadge status={selected.paymentStatus} />
                  </p>
                  <p>
                    <strong>Ngày tạo:</strong> {dateTime(selected.createdAt)}
                  </p>
                  <p>
                    <strong>Khách hàng:</strong> {selected.customerName || 'Khách vãng lai'}
                  </p>
                  <p>
                    <strong>Email:</strong> {selected.customerEmail || '—'}
                  </p>
                  <p>
                    <strong>Điện thoại:</strong> {selected.customerPhone || '—'}
                  </p>
                  <p>
                    <strong>Địa chỉ giao:</strong> {selected.shippingAddress || '—'}
                  </p>
                  {selected.note && (
                    <p>
                      <strong>Ghi chú:</strong> {selected.note}
                    </p>
                  )}
                </section>
                <section className="admin-form-section">
                  <h3>Tổng tiền</h3>
                  <p>Tạm tính: {money(selected.subTotal ?? selected.subtotal ?? 0)}</p>
                  <p>Giảm giá: {money(selected.discountAmount)}</p>
                  <p>Phí giao: {money(selected.shippingFee)}</p>
                  <p>
                    <strong>Tổng cộng: {money(selected.totalAmount)}</strong>
                  </p>
                </section>
              </div>
              <section className="admin-form-section">
                <h3>Sản phẩm</h3>
                <div className="admin-record-list">
                  {selectedItems.map((item) => (
                    <div className="admin-record" key={item.id}>
                      <span>
                        <strong>{item.productName || item.productId}</strong>
                        <small>
                          {item.quantity} × {money(item.finalPrice)} · đã giao{' '}
                          {item.shippedQuantity ?? 0} · còn{' '}
                          {Math.max(0, item.quantity - (item.shippedQuantity ?? 0))}
                        </small>
                      </span>
                      <strong>{money(item.finalPrice * item.quantity)}</strong>
                    </div>
                  ))}
                </div>
              </section>
              <section className="admin-form-section">
                <h3>Tạo phiếu giao từng phần</h3>
                <p className="admin-helper">
                  Phiếu giao chỉ ghi nhận nội bộ; không tạo vận đơn với nhà cung cấp.
                </p>
                <div className="admin-form-grid">
                  {selectedItems.map((item, index) => {
                    const remaining = Math.max(0, item.quantity - (item.shippedQuantity ?? 0));
                    return (
                      <label className="admin-field" key={item.id}>
                        <span>
                          {item.productName || item.productId} (tối đa {remaining})
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          step="1"
                          inputMode="numeric"
                          value={deliveryDraft[index]?.quantity ?? '0'}
                          disabled={busy || readOnly || remaining === 0}
                          onChange={(e) =>
                            setDeliveryDraft((old) =>
                              old.map((draft, i) =>
                                i === index ? { ...draft, quantity: e.target.value } : draft,
                              ),
                            )
                          }
                        />
                      </label>
                    );
                  })}
                </div>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Đơn vị giao (ghi nhận)</span>
                    <input
                      value={shipper}
                      disabled={busy || readOnly}
                      onChange={(e) => setShipper(e.target.value)}
                    />
                  </label>
                  <label className="admin-field">
                    <span>Mã tracking (nếu có)</span>
                    <input
                      value={tracking}
                      disabled={busy || readOnly}
                      onChange={(e) => setTracking(e.target.value)}
                    />
                  </label>
                </div>
                <div className="admin-form-actions">
                  <button
                    className="button"
                    type="button"
                    disabled={
                      busy ||
                      readOnly ||
                      !['Processing', 'Delivering'].includes(selected.orderStatus)
                    }
                    onClick={() => void createDelivery()}
                  >
                    Tạo phiếu giao
                  </button>
                </div>
              </section>
              <section className="admin-form-section">
                <h3>Phiếu giao</h3>
                {deliveries.length === 0 ? (
                  <p className="admin-muted">Chưa có phiếu giao.</p>
                ) : (
                  <div className="admin-record-list">
                    {deliveries.map((delivery) => (
                      <div className="admin-record" key={delivery.id}>
                        <span>
                          <strong>{delivery.deliveryCode}</strong>
                          <small>
                            <StatusBadge status={delivery.deliveryStatus} /> ·{' '}
                            {delivery.shipperUnit || 'Nội bộ'}
                            {delivery.trackingNumber ? ` · ${delivery.trackingNumber}` : ''}
                          </small>
                        </span>
                        <span className="admin-actions">
                          {delivery.deliveryStatus === 'Preparing' && (
                            <>
                              <button
                                className="button button-outline"
                                type="button"
                                disabled={busy || readOnly}
                                onClick={() => void deliveryTransition(delivery, 'Shipped')}
                              >
                                Đã gửi
                              </button>
                              <button
                                className="button button-danger"
                                type="button"
                                disabled={busy || readOnly}
                                onClick={() => void deliveryTransition(delivery, 'Cancelled')}
                              >
                                Hủy phiếu
                              </button>
                            </>
                          )}
                          {delivery.deliveryStatus === 'Shipped' && (
                            <button
                              className="button"
                              type="button"
                              disabled={busy || readOnly}
                              onClick={() => void deliveryTransition(delivery, 'Delivered')}
                            >
                              Đã giao
                            </button>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )
        )}
      </AdminDialog>
    </section>
  );
}
