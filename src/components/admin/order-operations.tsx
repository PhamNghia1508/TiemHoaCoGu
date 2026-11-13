'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Search } from 'lucide-react';
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
type TrackingEvent = {
  status: string;
  description?: string | null;
  occurredAt?: string | null;
  note?: string | null;
};
type TrackingInfo = {
  accepted?: boolean;
  statusDescription?: string | null;
  status: string;
  updatedAt?: string;
  events?: TrackingEvent[] | null;
  codAmount?: number | null;
  codCollected?: boolean | null;
  codCollectedAt?: string | null;
  leadTime?: string | null;
};

type Props = { readOnly?: boolean; initialStatus?: string };

const PAGE_SIZE = 20;
const ORDER_STATUSES = ['Confirmed', 'Processing', 'Delivering', 'Completed', 'Cancelled'];
const LIFECYCLE = [
  { key: 'Confirmed', label: 'Chờ xử lý' },
  { key: 'Processing', label: 'Đang chuẩn bị' },
  { key: 'Delivering', label: 'Đang giao' },
  { key: 'Completed', label: 'Hoàn tất' },
];
const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
const dateTime = (value: string) => new Date(value).toLocaleString('vi-VN');
const errText = (e: unknown) => (e instanceof Error ? e.message : 'Không thể thực hiện yêu cầu.');
const countItems = (items: OrderItem[] = []) => items.reduce((sum, item) => sum + item.quantity, 0);
const countLines = (lines: DeliveryLine[] = []) => lines.reduce((sum, line) => sum + line.quantity, 0);
const toneOf = (status: string) =>
  status === 'Cancelled'
    ? 'cancelled'
    : status === 'Completed'
      ? 'done'
      : status === 'Delivering'
        ? 'shipping'
        : status === 'Processing'
          ? 'preparing'
          : 'new';
function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(diff)) return dateTime(value);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} ngày trước` : dateTime(value);
}

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
  const [trackingInfo, setTrackingInfo] = useState<Record<string, TrackingInfo>>({});
  const [trackingBusy, setTrackingBusy] = useState<Record<string, boolean>>({});
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'BankTransfer' | 'MoMo'>('Cash');
  const [payCode, setPayCode] = useState('');
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
    setPayOpen(false);
    setPayAmount(String(order.totalAmount));
    setPayCode(`COD-${order.orderCode}`);
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

  const fetchAdminTracking = async (deliveryId: string) => {
    if (!selected) return;
    setTrackingBusy((prev) => ({ ...prev, [deliveryId]: true }));
    try {
      const res = await request<TrackingInfo>(
        `orders/${selected.id}/deliveries/${deliveryId}/tracking`,
      );
      setTrackingInfo((prev) => ({ ...prev, [deliveryId]: res }));
    } catch (e) {
      setError(errText(e));
    } finally {
      setTrackingBusy((prev) => ({ ...prev, [deliveryId]: false }));
    }
  };

  const openPayment = () => {
    if (!selected) return;
    setPayOpen(true);
    setError('');
    setPayMethod('Cash');
    setPayAmount(String(selected.totalAmount));
    setPayCode(`COD-${selected.orderCode}`);
  };

  const recordPayment = async () => {
    if (!selected || readOnly || busy) return;
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Số tiền thanh toán phải lớn hơn 0.');
      return;
    }
    if (!payCode.trim()) {
      setError('Nhập mã giao dịch để tránh ghi trùng.');
      return;
    }
    if (
      !(await confirm({
        title: 'Ghi nhận thanh toán?',
        description: `Ghi nhận ${money(amount)} cho đơn ${selected.orderCode}.`,
        confirmLabel: 'Ghi nhận',
      }))
    )
      return;
    setBusy(true);
    setError('');
    try {
      await request(
        `payments/order/${selected.id}`,
        { paymentMethod: payMethod, transactionCode: payCode.trim(), amount },
        'POST',
      );
      setNotice(`Đã ghi nhận thanh toán ${money(amount)} cho đơn ${selected.orderCode}.`);
      setPayOpen(false);
      await Promise.all([loadOrders(), refreshSelected(selected.id)]);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const renderTracking = (deliveryId: string, t: TrackingInfo) => {
    const events = t.events ?? [];
    return (
      <div className="admin-ord-ghn">
        {t.accepted === false ? (
          <p className="admin-error" role="alert">
            {t.statusDescription || 'GHN không trả về trạng thái.'}
          </p>
        ) : (
          <>
            <p className="admin-ord-ghn-head">
              <strong>{t.statusDescription || t.status}</strong>
              {t.updatedAt ? ` · ${dateTime(t.updatedAt)}` : ''}
            </p>
            {(t.codAmount != null || t.leadTime) && (
              <p className="admin-ord-ghn-meta">
                {t.codAmount != null && (
                  <>
                    Thu hộ COD {money(t.codAmount)}
                    {t.codCollected ? ' · đã thu' : ' · chưa thu'}
                  </>
                )}
                {t.leadTime && ` · Dự kiến giao ${dateTime(t.leadTime)}`}
              </p>
            )}
            {events.length > 0 && (
              <ol className="admin-ord-timeline">
                {events.map((e, i) => (
                  <li key={i}>
                    <span className="admin-ord-timeline-dot" aria-hidden="true" />
                    <div>
                      <strong>{e.description || e.status}</strong>
                      {e.note && <small>{e.note}</small>}
                      {e.occurredAt && <time>{dateTime(e.occurredAt)}</time>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </>
        )}
        <button
          className="button button-outline admin-ord-ghn-btn"
          type="button"
          disabled={busy || trackingBusy[deliveryId]}
          onClick={() => void fetchAdminTracking(deliveryId)}
        >
          {trackingBusy[deliveryId] ? 'Đang tra…' : 'Tra cứu lại'}
        </button>
      </div>
    );
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
      const created = await request<Delivery>(
        `orders/${selected.id}/deliveries`,
        {
          shipperUnit: shipper.trim() || undefined,
          trackingNumber: tracking.trim() || undefined,
          items,
        },
        'POST',
      );
      if (created?.trackingNumber) {
        setNotice(
          `Đã tạo phiếu giao ${created.deliveryCode} với mã vận đơn GHN Sandbox: ${created.trackingNumber}`,
        );
      } else {
        setNotice('Đã tạo phiếu giao nội bộ.');
      }
      await refreshSelected(selected.id);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };

  const fillRemaining = () => {
    if (!selected) return;
    setDeliveryDraft(
      selected.items.map((item) => ({
        itemId: item.id,
        quantity: String(Math.max(0, item.quantity - (item.shippedQuantity ?? 0))),
      })),
    );
  };

  const deliveryTransition = async (delivery: Delivery, next: string) => {
    if (!selected || readOnly || busy || detailLoading) return;
    const isCancel = next === 'Cancelled';
    const copy: Record<string, { title: string; description: string; confirmLabel: string; destructive?: boolean }> = {
      Cancelled: {
        title: 'Hủy phiếu giao?',
        description: `Phiếu ${delivery.deliveryCode} sẽ chuyển sang Đã hủy.`,
        confirmLabel: 'Hủy phiếu',
        destructive: true,
      },
      Delivered: {
        title: 'Xác nhận đã giao?',
        description: `Xác nhận phiếu ${delivery.deliveryCode} đã giao thành công. Sau đó ghi nhận thanh toán COD (nếu có) rồi hoàn tất đơn.`,
        confirmLabel: 'Đã giao',
      },
      Failed: {
        title: 'Ghi nhận giao thất bại?',
        description: `Phiếu ${delivery.deliveryCode} sẽ chuyển sang Giao thất bại. Có thể giao lại hoặc chuyển hoàn.`,
        confirmLabel: 'Giao thất bại',
        destructive: true,
      },
      Returned: {
        title: 'Xác nhận hoàn hàng?',
        description: `Phiếu ${delivery.deliveryCode} sẽ chuyển sang Đã hoàn hàng và hàng được tính là về lại tiệm.`,
        confirmLabel: 'Hoàn hàng',
        destructive: true,
      },
      Shipped: {
        title: 'Giao lại?',
        description: `Phiếu ${delivery.deliveryCode} sẽ quay lại trạng thái Đã gửi để giao lần tiếp theo.`,
        confirmLabel: 'Giao lại',
      },
    };
    const action = copy[next] ?? {
      title: 'Xác nhận cập nhật phiếu?',
      description: `Xác nhận chuyển phiếu ${delivery.deliveryCode} sang ${statusLabel(next)}?`,
      confirmLabel: 'Xác nhận',
    };
    if (!(await confirm({ ...action, destructive: isCancel || action.destructive }))) return;
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

  const resetFilters = () => {
    setStatus('');
    setSearch('');
    setFrom('');
    setTo('');
    setPage(1);
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
  const stepIndex = selected ? LIFECYCLE.findIndex((step) => step.key === selected.orderStatus) : -1;
  const hasFilters = Boolean(debouncedSearch || status || from || to);

  return (
    <section className="admin-card admin-ord" aria-labelledby="order-operations-heading">
      <div className="admin-section-heading">
        <div>
          <p className="admin-overline">VẬN HÀNH / ĐƠN HÀNG</p>
          <h2 id="order-operations-heading">Đơn hàng &amp; giao hàng</h2>
          <p className="admin-muted">
            Theo dõi đơn theo từng bước, tạo phiếu giao và đối chiếu trạng thái vận chuyển.
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

      <div className="admin-ord-filters">
        <label className="admin-ord-search">
          <Search size={16} aria-hidden="true" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm mã đơn, tên khách, email, địa chỉ…"
            aria-label="Tìm kiếm đơn hàng"
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
          className={`button button-outline admin-ord-dates-toggle${filtersOpen || from || to ? ' is-selected' : ''}`}
          type="button"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          Ngày tạo
        </button>
      </div>

      {filtersOpen && (
        <div className="admin-ord-dates">
          <label className="admin-field">
            <span>Từ ngày</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
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
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
      )}

      <div className="admin-ord-summary">
        <span className="admin-muted">
          {listLoading ? 'Đang tải…' : `${total} đơn`}
          {hasFilters ? ' khớp bộ lọc' : ''}
        </span>
        {hasFilters && (
          <button className="admin-ord-clear" type="button" onClick={resetFilters}>
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="admin-order-list">
        {listLoading ? (
          <AdminLoading label="Đang tải đơn hàng…" />
        ) : orders.length === 0 ? (
          <AdminEmpty title="Không có đơn hàng" description="Thử thay đổi từ khóa hoặc bộ lọc.">
            {hasFilters && (
              <button className="button button-outline" type="button" onClick={resetFilters}>
                Xóa bộ lọc
              </button>
            )}
          </AdminEmpty>
        ) : (
          <ul className="admin-ord-list">
            {orders.map((order) => {
              const active = selected?.id === order.id;
              return (
                <li key={order.id}>
                  <button
                    type="button"
                    className={`admin-ord-row${active ? ' is-selected' : ''}`}
                    onClick={() => void selectOrder(order)}
                    aria-pressed={active}
                  >
                    <span
                      className={`admin-ord-rail tone-${toneOf(order.orderStatus)}`}
                      aria-hidden="true"
                    />
                    <span className="admin-ord-main">
                      <span className="admin-ord-top">
                        <strong className="admin-ord-code">{order.orderCode}</strong>
                        <StatusBadge status={order.orderStatus} />
                      </span>
                      <span className="admin-ord-meta">
                        <span>{order.customerName || 'Khách vãng lai'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{countItems(order.items)} sản phẩm</span>
                        <span aria-hidden="true">·</span>
                        <span title={dateTime(order.createdAt)}>{timeAgo(order.createdAt)}</span>
                      </span>
                    </span>
                    <span className="admin-ord-side">
                      <strong className="admin-ord-total">{money(order.totalAmount)}</strong>
                      <StatusBadge status={order.paymentStatus} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        <AdminPagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          onPage={setPage}
          loading={listLoading || busy}
        />
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
            <div className="admin-ord-detail">
              <div className="admin-ord-head">
                <div className="admin-ord-head-main">
                  <p className="admin-overline">ĐƠN {selected.orderCode}</p>
                  <div className="admin-ord-badges">
                    <StatusBadge status={selected.orderStatus} />
                    <StatusBadge status={selected.paymentStatus} />
                  </div>
                  <p className="admin-muted">
                    {dateTime(selected.createdAt)} · {countItems(selectedItems)} sản phẩm
                  </p>
                </div>
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
              </div>

              {selected.orderStatus === 'Cancelled' ? (
                <p className="admin-ord-banner">Đơn đã hủy. Không thể tạo thêm phiếu giao.</p>
              ) : (
                <ol className="admin-ord-steps" aria-label="Tiến trình đơn hàng">
                  {LIFECYCLE.map((step, index) => {
                    const state =
                      index < stepIndex ? 'done' : index === stepIndex ? 'current' : 'todo';
                    return (
                      <li
                        className={`admin-ord-step is-${state}`}
                        key={step.key}
                        aria-current={state === 'current' ? 'step' : undefined}
                      >
                        <span className="admin-ord-step-dot" aria-hidden="true">
                          {state === 'done' ? <Check size={12} /> : index + 1}
                        </span>
                        <span>{step.label}</span>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="admin-ord-grid">
                <section className="admin-ord-card">
                  <h3>Người nhận</h3>
                  <dl className="admin-ord-facts">
                    <div>
                      <dt>Khách hàng</dt>
                      <dd>{selected.customerName || 'Khách vãng lai'}</dd>
                    </div>
                    <div>
                      <dt>Điện thoại</dt>
                      <dd>{selected.customerPhone || '—'}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{selected.customerEmail || '—'}</dd>
                    </div>
                    <div className="is-wide">
                      <dt>Địa chỉ giao</dt>
                      <dd>{selected.shippingAddress || '—'}</dd>
                    </div>
                    {selected.note && (
                      <div className="is-wide">
                        <dt>Ghi chú</dt>
                        <dd>{selected.note}</dd>
                      </div>
                    )}
                  </dl>
                </section>
                <section className="admin-ord-card">
                  <h3>Thanh toán</h3>
                  <dl className="admin-ord-facts">
                    <div>
                      <dt>Trạng thái</dt>
                      <dd>
                        <StatusBadge status={selected.paymentStatus} />
                      </dd>
                    </div>
                    <div>
                      <dt>Tạm tính</dt>
                      <dd>{money(selected.subTotal ?? selected.subtotal ?? 0)}</dd>
                    </div>
                    <div>
                      <dt>Giảm giá</dt>
                      <dd>{money(selected.discountAmount)}</dd>
                    </div>
                    <div>
                      <dt>Phí giao</dt>
                      <dd>{money(selected.shippingFee)}</dd>
                    </div>
                  </dl>
                  <p className="admin-ord-grand">
                    <span>Tổng cộng</span>
                    <strong>{money(selected.totalAmount)}</strong>
                  </p>
                  {selected.paymentStatus !== 'Paid' && selected.orderStatus !== 'Cancelled' && (
                    <div className="admin-ord-pay">
                      <button
                        className="button button-outline"
                        type="button"
                        disabled={busy || readOnly}
                        onClick={openPayment}
                      >
                        Ghi nhận thanh toán
                      </button>
                      {payOpen && (
                        <div className="admin-ord-pay-form">
                          <p className="admin-helper">
                            Dùng khi khách chuyển khoản, trả tiền mặt hoặc shipper thu hộ COD. Mã giao dịch
                            để chống ghi trùng.
                          </p>
                          <div className="admin-ord-create-grid">
                            <label className="admin-field">
                              <span>Số tiền</span>
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={payAmount}
                                disabled={busy || readOnly}
                                onChange={(e) => setPayAmount(e.target.value)}
                              />
                            </label>
                            <label className="admin-field">
                              <span>Phương thức</span>
                              <select
                                value={payMethod}
                                disabled={busy || readOnly}
                                onChange={(e) =>
                                  setPayMethod(e.target.value as typeof payMethod)
                                }
                              >
                                <option value="Cash">Tiền mặt (Cash)</option>
                                <option value="BankTransfer">Chuyển khoản (BankTransfer)</option>
                                <option value="MoMo">Ví MoMo</option>
                              </select>
                            </label>
                          </div>
                          <label className="admin-field">
                            <span>Mã giao dịch</span>
                            <input
                              value={payCode}
                              placeholder="VD: COD-DH-0001-1234"
                              disabled={busy || readOnly}
                              onChange={(e) => setPayCode(e.target.value)}
                            />
                          </label>
                          <div className="admin-form-actions">
                            <button
                              className="button button-outline"
                              type="button"
                              disabled={busy}
                              onClick={() => setPayOpen(false)}
                            >
                              Đóng
                            </button>
                            <button
                              className="button"
                              type="button"
                              disabled={busy || readOnly}
                              onClick={() => void recordPayment()}
                            >
                              Ghi nhận
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>

              <section className="admin-ord-card">
                <h3>Sản phẩm</h3>
                <ul className="admin-ord-items">
                  {selectedItems.map((item) => {
                    const remaining = Math.max(0, item.quantity - (item.shippedQuantity ?? 0));
                    return (
                      <li key={item.id}>
                        <span className="admin-ord-item-name">
                          <strong>{item.productName || item.productId}</strong>
                          {item.customNote && <small>{item.customNote}</small>}
                        </span>
                        <span className="admin-ord-item-qty">
                          {item.quantity} × {money(item.finalPrice)}
                        </span>
                        <span
                          className={`admin-ord-chip${remaining === 0 ? ' is-done' : ''}`}
                          title="Đã giao / tổng số lượng"
                        >
                          Giao {item.shippedQuantity ?? 0}/{item.quantity}
                        </span>
                        <strong className="admin-ord-item-total">
                          {money(item.finalPrice * item.quantity)}
                        </strong>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="admin-ord-card">
                <div className="admin-ord-card-head">
                  <h3>Phiếu giao</h3>
                  <span className="admin-muted">{deliveries.length} phiếu</span>
                </div>
                {deliveries.length === 0 ? (
                  <p className="admin-muted">Chưa có phiếu giao.</p>
                ) : (
                  <ul className="admin-ord-deliveries">
                    {deliveries.map((delivery) => (
                      <li key={delivery.id} className="admin-ord-delivery">
                        <div className="admin-ord-delivery-head">
                          <strong>{delivery.deliveryCode}</strong>
                          <StatusBadge status={delivery.deliveryStatus} />
                        </div>
                        <p className="admin-ord-delivery-meta">
                          <span>{delivery.shipperUnit || 'Nội bộ'}</span>
                          {delivery.trackingNumber && (
                            <span className="admin-ord-tracking">{delivery.trackingNumber}</span>
                          )}
                          <span>{countLines(delivery.items)} sản phẩm</span>
                        </p>
                        {delivery.trackingNumber ? (
                          !trackingInfo[delivery.id] ? (
                            <button
                              className="button button-outline admin-ord-ghn-btn"
                              type="button"
                              disabled={busy || trackingBusy[delivery.id]}
                              onClick={() => void fetchAdminTracking(delivery.id)}
                            >
                              {trackingBusy[delivery.id] ? 'Đang tra…' : 'Tra cứu GHN'}
                            </button>
                          ) : (
                            renderTracking(delivery.id, trackingInfo[delivery.id])
                          )
                        ) : (
                          <p className="admin-muted admin-ord-ghn-empty">Chưa có mã vận đơn GHN.</p>
                        )}
                        <div className="admin-actions">
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
                            <>
                              <button
                                className="button"
                                type="button"
                                disabled={busy || readOnly}
                                onClick={() => void deliveryTransition(delivery, 'Delivered')}
                              >
                                Đã giao
                              </button>
                              <button
                                className="button button-danger"
                                type="button"
                                disabled={busy || readOnly}
                                onClick={() => void deliveryTransition(delivery, 'Failed')}
                              >
                                Giao thất bại
                              </button>
                              <button
                                className="button button-outline"
                                type="button"
                                disabled={busy || readOnly}
                                onClick={() => void deliveryTransition(delivery, 'Returned')}
                              >
                                Hoàn hàng
                              </button>
                            </>
                          )}
                          {delivery.deliveryStatus === 'Failed' && (
                            <>
                              <button
                                className="button"
                                type="button"
                                disabled={busy || readOnly}
                                onClick={() => void deliveryTransition(delivery, 'Shipped')}
                              >
                                Giao lại
                              </button>
                              <button
                                className="button button-outline"
                                type="button"
                                disabled={busy || readOnly}
                                onClick={() => void deliveryTransition(delivery, 'Returned')}
                              >
                                Hoàn hàng
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                <details className="admin-ord-create">
                  <summary>Tạo phiếu giao</summary>
                  <p className="admin-helper">
                    Phiếu giao ghi nhận nội bộ; để trống đơn vị và mã tracking thì hệ thống tạo vận
                    đơn GHN và lấy mã tự động.
                  </p>
                  {!['Processing', 'Delivering'].includes(selected.orderStatus) && (
                    <p className="admin-helper">
                      Chỉ tạo được phiếu giao khi đơn đang ở bước “Đang chuẩn bị” hoặc “Đang giao”.
                    </p>
                  )}
                  <div className="admin-ord-create-grid">
                    {selectedItems.map((item, index) => {
                      const remaining = Math.max(0, item.quantity - (item.shippedQuantity ?? 0));
                      return (
                        <label className="admin-field" key={item.id}>
                          <span>
                            {item.productName || item.productId} · còn {remaining}
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
                  <div className="admin-ord-create-grid">
                    <label className="admin-field">
                      <span>Đơn vị giao</span>
                      <input
                        value={shipper}
                        placeholder="Để trống để chọn GHN"
                        disabled={busy || readOnly}
                        onChange={(e) => setShipper(e.target.value)}
                      />
                    </label>
                    <label className="admin-field">
                      <span>Mã tracking</span>
                      <input
                        value={tracking}
                        placeholder="Để trống để GHN tự sinh"
                        disabled={busy || readOnly}
                        onChange={(e) => setTracking(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="admin-form-actions">
                    <button
                      className="button button-outline"
                      type="button"
                      disabled={busy || readOnly}
                      onClick={fillRemaining}
                    >
                      Điền phần còn lại
                    </button>
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
                </details>
              </section>
            </div>
          )
        )}
      </AdminDialog>
    </section>
  );
}
