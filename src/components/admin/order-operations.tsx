'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { storeRequest } from '@/lib/browser-api';

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
  subTotal: number;
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
type Workshop = { id: string; name: string; code: string };
type Session = {
  id: string;
  workshopId: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  bookedSlots: number;
  sessionStatus: string;
};
type Booking = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone?: string;
  ticketCount: number;
  bookingStatus: string;
  checkedInAt?: string | null;
};

type DeliveryDraft = { itemId: string; quantity: string };
const money = (n: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(n);
const errText = (e: unknown) => (e instanceof Error ? e.message : 'Không thể thực hiện yêu cầu.');

export default function AdminOrderOperations() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selected, setSelected] = useState<Order | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryDraft[]>([]);
  const [shipper, setShipper] = useState('');
  const [tracking, setTracking] = useState('');
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [roster, setRoster] = useState<Booking[]>([]);
  const [workshopId, setWorkshopId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const request = useCallback(
    async <T,>(path: string, body?: unknown, method = 'GET') => storeRequest<T>(path, body, method),
    [],
  );
  const loadOrders = useCallback(async () => {
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (from) params.set('from', new Date(`${from}T00:00:00`).toISOString());
      if (to) params.set('to', new Date(`${to}T23:59:59.999`).toISOString());
      const result = await request<Page<Order>>(`management/orders?${params.toString()}`);
      setOrders(result.items);
      setTotal(result.total);
    } catch (e) {
      setError(errText(e));
    }
  }, [from, page, request, search, status, to]);
  const loadWorkshops = useCallback(async () => {
    try {
      setWorkshops(await request<Workshop[]>('workshops'));
    } catch (e) {
      setError(errText(e));
    }
  }, [request]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrders();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkshops();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkshops]);

  const chooseOrder = async (order: Order) => {
    setError('');
    setSelected(order);
    setDeliveryDraft(order.items.map((item) => ({ itemId: item.id, quantity: '0' })));
    try {
      setDeliveries(await request<Delivery[]>(`orders/staff/${order.id}/deliveries`));
    } catch (e) {
      setError(errText(e));
    }
  };
  const transition = async (next: string) => {
    if (!selected) return;
    if (
      next === 'Completed' &&
      !window.confirm('Xác nhận hoàn tất đơn? Đây là thao tác không thể đảo ngược.')
    )
      return;
    setBusy(true);
    setError('');
    try {
      await request(`orders/${selected.id}/status`, { status: next }, 'POST');
      setNotice(`Đã chuyển đơn sang ${next}.`);
      await loadOrders();
      const fresh = await request<Order>(`management/orders/${selected.id}`);
      await chooseOrder(fresh);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };
  const createDelivery = async () => {
    if (!selected) return;
    const items = deliveryDraft
      .filter((x) => Number(x.quantity) > 0)
      .map((x) => ({ orderItemId: x.itemId, quantity: Number(x.quantity) }));
    if (!items.length) {
      setError('Nhập ít nhất một số lượng giao.');
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
      setDeliveries(await request<Delivery[]>(`orders/staff/${selected.id}/deliveries`));
      setDeliveryDraft(selected.items.map((item) => ({ itemId: item.id, quantity: '0' })));
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };
  const deliveryTransition = async (delivery: Delivery, next: string) => {
    if (
      next === 'Delivered' &&
      !window.confirm('Xác nhận giao hàng thành công? Đây là thao tác không thể đảo ngược.')
    )
      return;
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      await request(
        `orders/${selected.id}/deliveries/${delivery.id}/status`,
        { status: next },
        'POST',
      );
      setDeliveries(await request<Delivery[]>(`orders/staff/${selected.id}/deliveries`));
      setNotice(`Đã chuyển ${delivery.deliveryCode} sang ${next}.`);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };
  const loadSessions = async (id: string) => {
    setWorkshopId(id);
    setSessionId('');
    setRoster([]);
    if (!id) {
      setSessions([]);
      return;
    }
    try {
      setSessions(await request<Session[]>(`workshops/${id}/sessions`));
    } catch (e) {
      setError(errText(e));
    }
  };
  const loadRoster = async (id: string) => {
    setSessionId(id);
    try {
      setRoster(await request<Booking[]>(`workshops/sessions/${id}/roster`));
    } catch (e) {
      setError(errText(e));
    }
  };
  const checkIn = async (booking: Booking) => {
    if (!window.confirm(`Xác nhận check-in ${booking.bookingCode}?`)) return;
    setBusy(true);
    setError('');
    try {
      await request(`bookings/${booking.id}/check-in`, {}, 'POST');
      setRoster(await request<Booking[]>(`workshops/sessions/${sessionId}/roster`));
      setNotice(`Đã check-in ${booking.bookingCode}.`);
    } catch (e) {
      setError(errText(e));
    } finally {
      setBusy(false);
    }
  };
  const csvQuery = useMemo(
    () =>
      new URLSearchParams({
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(from ? { from: new Date(`${from}T00:00:00`).toISOString() } : {}),
        ...(to ? { to: new Date(`${to}T23:59:59.999`).toISOString() } : {}),
      }).toString(),
    [from, search, status, to],
  );

  return (
    <section className="admin-card" aria-labelledby="order-operations-heading">
      <div className="admin-section-heading">
        <div>
          <h2 id="order-operations-heading">Đơn hàng & giao hàng</h2>
          <p className="admin-muted">
            Chỉ thao tác theo state machine backend. Phiếu giao là bản ghi nội bộ, không đặt vận
            chuyển nhà cung cấp.
          </p>
        </div>
        <div>
          <button
            className="button"
            type="button"
            onClick={() => void loadOrders()}
            disabled={busy}
          >
            Làm mới
          </button>{' '}
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
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-form-grid">
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
        <label className="admin-field">
          <span>Trạng thái</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Processing">Processing</option>
            <option value="Delivering">Delivering</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </label>
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
      <div className="admin-grid-two">
        <div>
          <ul className="admin-list">
            {orders.map((order) => (
              <li key={order.id}>
                <button
                  className="button button-outline"
                  type="button"
                  onClick={() => void chooseOrder(order)}
                >
                  {order.orderCode}
                </button>
                <span>
                  {order.customerName || 'Khách vãng lai'} · {money(order.totalAmount)}
                  <small>
                    {order.orderStatus} · {order.paymentStatus} ·{' '}
                    {new Date(order.createdAt).toLocaleString('vi-VN')}
                  </small>
                </span>
              </li>
            ))}
            {!orders.length && <li>Không có đơn phù hợp.</li>}
          </ul>
          <p className="admin-muted">
            {total} đơn · trang {page}
          </p>
          <button
            className="button"
            type="button"
            disabled={page <= 1 || busy}
            onClick={() => setPage((x) => x - 1)}
          >
            Trang trước
          </button>{' '}
          <button
            className="button"
            type="button"
            disabled={page * 20 >= total || busy}
            onClick={() => setPage((x) => x + 1)}
          >
            Trang sau
          </button>
        </div>
        {selected && (
          <div>
            <h3>{selected.orderCode}</h3>
            <p>
              {selected.customerName || 'Khách vãng lai'} · {selected.shippingAddress}
            </p>
            <p>
              Trạng thái: <strong>{selected.orderStatus}</strong> · Thanh toán:{' '}
              {selected.paymentStatus}
            </p>
            <ul className="admin-list">
              {selected.items.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.productName || item.productId}
                    <small>
                      {item.quantity} × {money(item.finalPrice)} · đã giao{' '}
                      {item.shippedQuantity ?? 0}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
            <div className="admin-checks">
              {selected.orderStatus === 'Confirmed' && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void transition('Processing')}
                >
                  Bắt đầu xử lý
                </button>
              )}
              {selected.orderStatus === 'Processing' && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void transition('Delivering')}
                >
                  Đang giao
                </button>
              )}
              {selected.orderStatus === 'Delivering' && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void transition('Completed')}
                >
                  Hoàn tất đơn
                </button>
              )}
              {['Confirmed', 'Processing'].includes(selected.orderStatus) && (
                <button
                  className="button"
                  disabled={busy}
                  onClick={() => void transition('Cancelled')}
                >
                  Hủy đơn
                </button>
              )}
            </div>
            <h4>Tạo phiếu giao từng phần</h4>
            <div className="admin-form-grid">
              {selected.items.map((item, index) => (
                <label className="admin-field" key={item.id}>
                  <span>
                    {item.productName || item.productId} (tối đa{' '}
                    {item.quantity - (item.shippedQuantity ?? 0)})
                  </span>
                  <input
                    type="number"
                    min="0"
                    max={item.quantity - (item.shippedQuantity ?? 0)}
                    value={deliveryDraft[index]?.quantity ?? '0'}
                    onChange={(e) =>
                      setDeliveryDraft((old) =>
                        old.map((x, i) => (i === index ? { ...x, quantity: e.target.value } : x)),
                      )
                    }
                  />
                </label>
              ))}
            </div>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Đơn vị giao (ghi nhận)</span>
                <input value={shipper} onChange={(e) => setShipper(e.target.value)} />
              </label>
              <label className="admin-field">
                <span>Mã tracking (nếu có)</span>
                <input value={tracking} onChange={(e) => setTracking(e.target.value)} />
              </label>
            </div>
            <button
              className="button"
              disabled={busy || !['Processing', 'Delivering'].includes(selected.orderStatus)}
              onClick={() => void createDelivery()}
            >
              Tạo phiếu giao
            </button>
            <h4>Phiếu giao</h4>
            {deliveries.map((delivery) => (
              <div className="admin-card" key={delivery.id}>
                <strong>{delivery.deliveryCode}</strong> · {delivery.deliveryStatus}
                <small>
                  {' '}
                  {delivery.shipperUnit || 'Nội bộ'}{' '}
                  {delivery.trackingNumber && `· ${delivery.trackingNumber}`}
                </small>
                <div>
                  {delivery.deliveryStatus === 'Preparing' && (
                    <>
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() => void deliveryTransition(delivery, 'Shipped')}
                      >
                        Đã gửi
                      </button>{' '}
                      <button
                        className="button"
                        disabled={busy}
                        onClick={() => void deliveryTransition(delivery, 'Cancelled')}
                      >
                        Hủy phiếu
                      </button>
                    </>
                  )}
                  {delivery.deliveryStatus === 'Shipped' && (
                    <button
                      className="button"
                      disabled={busy}
                      onClick={() => void deliveryTransition(delivery, 'Delivered')}
                    >
                      Đã giao
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <hr />
      <h3>Roster & check-in workshop</h3>
      <div className="admin-form-grid">
        <label className="admin-field">
          <span>Workshop</span>
          <select value={workshopId} onChange={(e) => void loadSessions(e.target.value)}>
            <option value="">Chọn workshop</option>
            {workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.code})
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Ca học</span>
          <select
            value={sessionId}
            onChange={(e) => void loadRoster(e.target.value)}
            disabled={!workshopId}
          >
            <option value="">Chọn ca</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sessionDate} {s.startTime} · {s.location} · {s.bookedSlots}/{s.capacity}
              </option>
            ))}
          </select>
        </label>
      </div>
      {roster.length > 0 && (
        <ul className="admin-list">
          {roster.map((booking) => (
            <li key={booking.id}>
              <span>
                <strong>{booking.bookingCode}</strong> · {booking.customerName}
                <small>
                  {booking.ticketCount} vé · {booking.bookingStatus}
                </small>
              </span>
              <button
                className="button"
                disabled={busy || booking.bookingStatus === 'attended'}
                onClick={() => void checkIn(booking)}
              >
                {booking.bookingStatus === 'attended' ? 'Đã check-in' : 'Check-in'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
