'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from './store-provider';
import { storeRequest } from '@/lib/browser-api';
import WorkshopTicketView from '@/components/workshop/workshop-ticket';
import type {
  CustomQuote,
  CustomRequest,
  CustomRequestInput,
  CustomCheckout,
  Order,
  Delivery,
  Booking,
} from '@/lib/api/client';

type CarrierTracking = {
  accepted: boolean;
  trackingNumber: string;
  status: string;
  statusDescription: string;
  updatedAt?: string;
};
type Kind = 'orders' | 'bookings' | 'custom';
type PreviewResult = { code: string; phone: string };
const money = (n?: number) => (n === undefined ? '—' : `${Number(n).toLocaleString('vi-VN')} ₫`);
const date = (s?: string) => (s ? new Date(s).toLocaleString('vi-VN') : '—');
const lower = (s?: string) => (s ?? '').toLowerCase();

export default function Lookup() {
  const { mode } = useStore();
  const searchParams = useSearchParams();
  const deepLinkVe = searchParams.get('ve');
  const [kind, setKind] = useState<Kind>(deepLinkVe ? 'bookings' : 'orders');
  const [items, setItems] = useState<(Order | Booking | CustomRequest)[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, CarrierTracking>>({});
  const [trackingLoading, setTrackingLoading] = useState<Record<string, boolean>>({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selected, setSelected] = useState<CustomRequest | null>(null);
  const [quote, setQuote] = useState<CustomQuote | null>(null);
  const [checkout, setCheckout] = useState<CustomCheckout | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [address, setAddress] = useState('');
  const [revise, setRevise] = useState<CustomRequestInput>({
    productId: '',
    quantity: 1,
    description: '',
  });
  const [now] = useState(() => Date.now());
  const checkoutAttempt = useRef<{ fingerprint: string; key: string } | null>(null);
  const handledDeepLink = useRef<string | null>(null);

  function clearDetails() {
    setSelectedOrder(null);
    setDeliveries([]);
    setTrackingMap({});
    setTrackingLoading({});
    setSelectedBooking(null);
    setSelected(null);
    setQuote(null);
    setCheckout(null);
  }

  useEffect(() => {
    if (!deepLinkVe || handledDeepLink.current === deepLinkVe) return;
    if (mode !== 'connected') return;
    handledDeepLink.current = deepLinkVe;
    setKind('bookings');
    clearDetails();
    setError('');
    setPending(true);
    void (async () => {
      try {
        const booking = await storeRequest<Booking>(`bookings/${deepLinkVe}`);
        setSelectedBooking(booking);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải đặt chỗ từ liên kết vé.');
      } finally {
        setPending(false);
      }
    })();
  }, [deepLinkVe, mode]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (mode === 'preview') {
      const f = new FormData(e.currentTarget);
      setPreview({ code: String(f.get('code') || ''), phone: String(f.get('phone') || '') });
      return;
    }
    if (mode !== 'connected') {
      setError('Chưa thể tra cứu khi storefront không kết nối backend.');
      return;
    }
    setPending(true);
    setError('');
    setPreview(null);
    clearDetails();
    try {
      const path =
        kind === 'orders' ? 'orders' : kind === 'bookings' ? 'bookings' : 'custom-orders';
      setItems(await storeRequest<(Order | Booking | CustomRequest)[]>(path));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải lịch sử.');
    } finally {
      setPending(false);
    }
  }
  async function chooseOrder(order: Order) {
    setSelectedOrder(order);
    setPending(true);
    setError('');
    try {
      setDeliveries(await storeRequest<Delivery[]>(`orders/${order.id}/deliveries`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải giao hàng.');
    } finally {
      setPending(false);
    }
  }
  async function cancelOrder() {
    if (
      !selectedOrder ||
      pending ||
      !['pending', 'confirmed', 'processing'].includes(lower(selectedOrder.orderStatus))
    )
      return;
    setPending(true);
    setError('');
    try {
      await storeRequest(`orders/${selectedOrder.id}/cancel`, {}, 'POST');
      const fresh = await storeRequest<Order>(`orders/${selectedOrder.id}`);
      setSelectedOrder(fresh);
      setItems((xs) => xs.map((x) => ('orderCode' in x && x.id === fresh.id ? fresh : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể huỷ đơn.');
    } finally {
      setPending(false);
    }
  }
  async function trackDelivery(deliveryId: string) {
    if (!selectedOrder) return;
    setTrackingLoading((prev) => ({ ...prev, [deliveryId]: true }));
    setError('');
    try {
      const res = await storeRequest<CarrierTracking>(
        `orders/${selectedOrder.id}/deliveries/${deliveryId}/tracking`,
      );
      setTrackingMap((prev) => ({ ...prev, [deliveryId]: res }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lấy thông tin tracking GHN.');
    } finally {
      setTrackingLoading((prev) => ({ ...prev, [deliveryId]: false }));
    }
  }

  async function chooseBooking(booking: Booking) {
    setPending(true);
    setError('');
    try {
      setSelectedBooking(await storeRequest<Booking>(`bookings/${booking.id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải đặt chỗ.');
    } finally {
      setPending(false);
    }
  }
  async function cancelBooking() {
    if (
      !selectedBooking ||
      pending ||
      !['held', 'confirmed', 'pending'].includes(lower(selectedBooking.bookingStatus))
    )
      return;
    setPending(true);
    setError('');
    try {
      await storeRequest(
        `bookings/${selectedBooking.id}/cancel`,
        'Khách yêu cầu hủy từ tài khoản',
        'POST',
      );
      const fresh = await storeRequest<Booking>(`bookings/${selectedBooking.id}`);
      setSelectedBooking(fresh);
      setItems((xs) => xs.map((x) => ('bookingCode' in x && x.id === fresh.id ? fresh : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể huỷ đặt chỗ.');
    } finally {
      setPending(false);
    }
  }
  async function loadQuote(request: CustomRequest) {
    setSelected(request);
    setQuote(null);
    setCheckout(null);
    setRevise({
      productId: request.productId,
      quantity: request.quantity,
      description: request.description,
      referenceImageUrl: request.referenceImageUrl || undefined,
      requestedCompletionDate: request.requestedCompletionDate,
    });
    setPending(true);
    setError('');
    try {
      setQuote(await storeRequest<CustomQuote>(`custom-orders/${request.id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải báo giá.');
    } finally {
      setPending(false);
    }
  }
  async function reviseRequest(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || pending || selected.status !== 'Requested') return;
    setPending(true);
    setError('');
    try {
      const fresh = await storeRequest<CustomRequest>(
        `custom-orders/${selected.id}`,
        revise,
        'PUT',
      );
      setSelected(fresh);
      setItems((xs) => xs.map((x) => (x.id === fresh.id ? fresh : x)));
      setQuote(await storeRequest<CustomQuote>(`custom-orders/${fresh.id}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật yêu cầu.');
    } finally {
      setPending(false);
    }
  }
  async function approve() {
    if (
      !selected ||
      !quote ||
      pending ||
      lower(quote.status) !== 'quoted' ||
      !currentRevision ||
      new Date(currentRevision.expiresAt).getTime() <= now
    )
      return;
    setPending(true);
    setError('');
    try {
      setQuote(
        await storeRequest<CustomQuote>(
          `custom-orders/${selected.id}/approve`,
          { version: quote.currentRevision },
          'POST',
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể duyệt báo giá.');
    } finally {
      setPending(false);
    }
  }
  async function doCheckout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || !quote || !address.trim() || pending || lower(quote.status) !== 'approved')
      return setError('Chỉ checkout sau khi báo giá đã được duyệt và có địa chỉ giao hàng.');
    const fingerprint = JSON.stringify([selected.id, quote.currentRevision, address.trim()]);
    if (!checkoutAttempt.current || checkoutAttempt.current.fingerprint !== fingerprint)
      checkoutAttempt.current = { fingerprint, key: crypto.randomUUID() };
    setPending(true);
    setError('');
    try {
      setCheckout(
        await storeRequest<CustomCheckout>(
          `custom-orders/${selected.id}/checkout`,
          {
            shippingAddress: address.trim(),
            note: 'Checkout custom order',
            idempotencyKey: checkoutAttempt.current.key,
          },
          'POST',
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể checkout báo giá.');
    } finally {
      setPending(false);
    }
  }
  const currentRevision = quote?.revisions.find((r) => r.version === quote.currentRevision);
  const label = (item: Order | Booking | CustomRequest) =>
    'orderCode' in item ? item.orderCode : 'bookingCode' in item ? item.bookingCode : item.id;
  const status = (item: Order | Booking | CustomRequest) =>
    'orderStatus' in item
      ? item.orderStatus
      : 'bookingStatus' in item
        ? item.bookingStatus
        : item.status;
  return (
    <div className="lookup-card">
      <form onSubmit={submit}>
        <label className="field">
          Bạn muốn xem lịch sử
          <select
            name="type"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value as Kind);
              setItems([]);
              clearDetails();
            }}
          >
            <option value="orders">Đơn hoa & giao hàng</option>
            <option value="bookings">Đặt chỗ workshop</option>
            <option value="custom">Yêu cầu hoa theo ý bạn</option>
          </select>
        </label>
        {mode === 'preview' ? (
          <>
            <label className="field">
              Mã đơn / mã đặt chỗ
              <input name="code" required placeholder="TEST-123" />
            </label>
            <label className="field">
              Số điện thoại
              <input name="phone" required pattern="[+0-9 ()\-]{9,20}" placeholder="0901234567" />
            </label>
            <p className="form-notice">
              Bản xem trước không kết nối dữ liệu thật. Thông tin chỉ để kiểm tra giao diện.
            </p>
            <button type="submit" className="button full">
              Kiểm tra tra cứu <ArrowUpRight size={18} />
            </button>
          </>
        ) : (
          <>
            <p className="form-notice">
              Tra cứu thật dùng tài khoản đã đăng nhập, không tra cứu công khai bằng mã đơn và số
              điện thoại.
            </p>
            <button
              type="submit"
              className="button full"
              disabled={pending || mode !== 'connected'}
            >
              {pending ? 'Đang tải…' : 'Xem lịch sử tài khoản'} <ArrowUpRight size={18} />
            </button>
            {mode === 'connected' && (
              <p className="fine-print">
                Chưa đăng nhập? <Link href="/tai-khoan">Đăng nhập</Link>
              </p>
            )}
          </>
        )}
      </form>
      {mode === 'unavailable' && (
        <div className="form-status" role="status">
          Chức năng chưa sẵn sàng vì backend/catalog không kết nối; không thể tra cứu giả.
        </div>
      )}
      {error && (
        <div className="form-status" role="alert">
          {error}
        </div>
      )}
      {preview && (
        <div className="form-status" role="status">
          <span className="eyebrow">TRA CỨU XEM TRƯỚC</span>
          <p>
            Chưa thể tra cứu đơn thật trong bản xem trước cho mã {preview.code}. Không có kết quả
            giả.
          </p>
        </div>
      )}
      {items.length === 0 &&
        mode === 'connected' &&
        !pending &&
        !preview &&
        !selectedBooking &&
        !selectedOrder &&
        !selected && (
          <div className="form-status" role="status">
            Chưa có lịch sử{' '}
            {kind === 'orders' ? 'đơn hoa' : kind === 'bookings' ? 'đặt chỗ' : 'yêu cầu đặt riêng'}{' '}
            để hiển thị.
          </div>
        )}
      {items.length > 0 && (
        <div className="form-status" role="status">
          <span className="eyebrow">{items.length} KẾT QUẢ</span>
          {items.map((item) => (
            <div key={item.id} style={{ marginTop: 14 }}>
              <strong>{label(item)}</strong>
              <br />
              <span>Trạng thái: {status(item)}</span>
              {'orderCode' in item && (
                <>
                  <br />
                  <span>
                    Thanh toán: {item.paymentStatus} · {money(item.totalAmount)}
                  </span>
                  <br />
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => void chooseOrder(item)}
                  >
                    Xem chi tiết & giao hàng
                  </button>
                </>
              )}
              {'bookingCode' in item && (
                <>
                  <br />
                  <span>
                    Tổng: {money(item.totalAmount)} · Giữ đến: {date(item.holdExpiresAt)}
                  </span>
                  <br />
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => void chooseBooking(item)}
                  >
                    Xem chi tiết đặt chỗ
                  </button>
                </>
              )}
              {'description' in item && (
                <>
                  <br />
                  <button type="button" className="text-link" onClick={() => void loadQuote(item)}>
                    Chọn yêu cầu & tải báo giá
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
      {selectedOrder && (
        <div className="form-status" role="region" aria-label="Chi tiết đơn hàng">
          <strong>{selectedOrder.orderCode}</strong>
          <p>
            {selectedOrder.shippingAddress}
            <br />
            Tạo lúc: {date(selectedOrder.createdAt)} · Thanh toán: {selectedOrder.paymentStatus}
          </p>
          <div style={{ margin: '12px 0' }}>
            <strong>Giao hàng:</strong>
            {deliveries.length === 0 ? (
              <p style={{ margin: '4px 0', color: 'var(--text-muted)' }}>
                Chưa có dữ liệu giao hàng.
              </p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: '8px 0' }}>
                {deliveries.map((d) => (
                  <li
                    key={d.id}
                    style={{
                      margin: '8px 0',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.02)',
                      borderRadius: 6,
                      border: '1px solid rgba(0,0,0,0.06)',
                    }}
                  >
                    <div>
                      <strong>{d.deliveryCode}</strong>: <span>{d.deliveryStatus}</span>
                      {d.trackingNumber ? (
                        <span>
                          {' '}
                          · Mã vận đơn GHN: <code>{d.trackingNumber}</code>
                        </span>
                      ) : null}
                    </div>
                    {d.trackingNumber && (
                      <div style={{ marginTop: 6 }}>
                        {trackingMap[d.id] ? (
                          <div style={{ fontSize: 13, color: '#047857' }}>
                            Hành trình GHN Sandbox:{' '}
                            <strong>
                              {trackingMap[d.id].statusDescription || trackingMap[d.id].status}
                            </strong>
                            {trackingMap[d.id].updatedAt
                              ? ` (Cập nhật: ${date(trackingMap[d.id].updatedAt)})`
                              : ''}
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="text-link"
                            style={{ fontSize: 13, cursor: 'pointer' }}
                            disabled={trackingLoading[d.id]}
                            onClick={() => void trackDelivery(d.id)}
                          >
                            {trackingLoading[d.id]
                              ? 'Đang tra cứu GHN…'
                              : 'Tra cứu hành trình GHN Sandbox'}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            className="button"
            disabled={
              pending ||
              !['pending', 'confirmed', 'processing'].includes(lower(selectedOrder.orderStatus))
            }
            onClick={() => void cancelOrder()}
          >
            Huỷ đơn
          </button>
        </div>
      )}
      {selectedBooking && (
        <div className="form-status" role="region" aria-label="Chi tiết đặt chỗ">
          <strong>{selectedBooking.bookingCode}</strong>
          <p>
            {selectedBooking.customerName} · {selectedBooking.ticketCount} vé
            <br />
            Trạng thái: {selectedBooking.bookingStatus} · Giữ đến:{' '}
            {date(selectedBooking.holdExpiresAt)}
          </p>
          <p>
            Tổng: {money(selectedBooking.totalAmount)} · Đặt cọc:{' '}
            {money(selectedBooking.depositAmount)} · Còn lại:{' '}
            {money(selectedBooking.remainingAmount)}
          </p>
          <div style={{ margin: '12px 0' }}>
            <WorkshopTicketView bookingId={selectedBooking.id} />
          </div>
          <button
            type="button"
            className="button"
            disabled={
              pending ||
              !['held', 'confirmed', 'pending'].includes(lower(selectedBooking.bookingStatus))
            }
            onClick={() => void cancelBooking()}
          >
            Huỷ đặt chỗ
          </button>
        </div>
      )}
      {selected && (
        <div className="form-status" role="region" aria-label="Báo giá yêu cầu đã chọn">
          <strong>Yêu cầu {selected.id}</strong>
          <p>Trạng thái yêu cầu: {selected.status}</p>
          {selected.status === 'Requested' && (
            <form onSubmit={reviseRequest}>
              <label className="field">
                Mô tả cập nhật
                <textarea
                  value={revise.description}
                  onChange={(e) => setRevise({ ...revise, description: e.target.value })}
                  required
                />
              </label>
              <label className="field">
                Số lượng
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={revise.quantity}
                  onChange={(e) => setRevise({ ...revise, quantity: Number(e.target.value) })}
                  required
                />
              </label>
              <button type="submit" className="button" disabled={pending}>
                Cập nhật yêu cầu
              </button>
            </form>
          )}
          <button
            type="button"
            className="text-link"
            disabled={pending}
            onClick={() => void loadQuote(selected)}
          >
            Tải lại báo giá
          </button>
          {quote && (
            <>
              <p>
                Báo giá: {quote.status} · Phiên bản hiện tại: {quote.currentRevision}
              </p>
              {currentRevision && (
                <p>
                  Tổng: {money(currentRevision.totalAmount)} · Đặt cọc:{' '}
                  {money(currentRevision.depositAmount)} · Hạn: {date(currentRevision.expiresAt)}
                  <br />
                  Ghi chú: {currentRevision.adminNote || '—'}
                </p>
              )}
              <button
                type="button"
                className="button"
                disabled={
                  pending ||
                  lower(quote.status) !== 'quoted' ||
                  !currentRevision ||
                  new Date(currentRevision.expiresAt).getTime() <= now
                }
                onClick={() => void approve()}
              >
                Duyệt phiên bản hiện tại
              </button>
              {lower(quote.status) === 'approved' && !checkout && (
                <form onSubmit={doCheckout}>
                  <label className="field">
                    Địa chỉ giao hàng *
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                  </label>
                  <button type="submit" className="button" disabled={pending}>
                    Checkout (chưa thanh toán)
                  </button>
                </form>
              )}
              {checkout && (
                <p>
                  Đã tạo đơn <strong>{checkout.orderCode}</strong>. Trạng thái thanh toán:{' '}
                  {checkout.paymentStatus}.
                </p>
              )}
            </>
          )}
        </div>
      )}
      <Link href="/hoi-dap" className="text-link">
        Có một câu hỏi khác? <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
