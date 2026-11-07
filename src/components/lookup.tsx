'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { useStore } from './store-provider';
import CustomRequestPanel from './custom-request-panel';
import { storeRequest } from '@/lib/browser-api';
import { customStatusLabel } from '@/lib/custom-order-status';
import type { CustomRequest, Order, Delivery, Booking } from '@/lib/api/client';

type CarrierTracking = {
  accepted: boolean;
  trackingNumber: string;
  status: string;
  statusDescription: string;
  updatedAt?: string;
};
type Kind = 'orders' | 'bookings' | 'custom';
type PreviewResult = { code: string; phone: string };
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const money = (n?: number) => (n === undefined ? '—' : `${Number(n).toLocaleString('vi-VN')} ₫`);
const date = (s?: string) => (s ? new Date(s).toLocaleString('vi-VN') : '—');
const lower = (s?: string) => (s ?? '').toLowerCase();
const isOrder = (item: Order | Booking | CustomRequest): item is Order => 'orderStatus' in item;
const isBooking = (item: Order | Booking | CustomRequest): item is Booking =>
  'bookingStatus' in item;
const isCustomRequest = (item: Order | Booking | CustomRequest): item is CustomRequest =>
  'quoteVersion' in item;

export default function Lookup() {
  const { mode } = useStore();
  const search = useSearchParams();
  const router = useRouter();
  const [deepLinkId] = useState(() => {
    const value = search.get('yeu-cau') ?? '';
    return GUID.test(value) ? value : '';
  });
  const [kind, setKind] = useState<Kind>(deepLinkId ? 'custom' : 'orders');
  const [items, setItems] = useState<(Order | Booking | CustomRequest)[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [trackingMap, setTrackingMap] = useState<Record<string, CarrierTracking>>({});
  const [trackingLoading, setTrackingLoading] = useState<Record<string, boolean>>({});
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selected, setSelected] = useState<CustomRequest | null>(null);
  const [customNotice, setCustomNotice] = useState('');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  const clearDetails = () => {
    setSelectedOrder(null);
    setDeliveries([]);
    setTrackingMap({});
    setTrackingLoading({});
    setSelectedBooking(null);
    setSelected(null);
  };

  useEffect(() => {
    if (mode !== 'connected' || !deepLinkId) return;
    let active = true;
    setPending(true);
    setError('');
    storeRequest<CustomRequest[]>('custom-orders')
      .then((list) => {
        if (!active) return;
        setItems(list);
        const found = list.find((item) => item.id === deepLinkId);
        if (found) setSelected(found);
        else setCustomNotice('Không tìm thấy yêu cầu trong tài khoản này.');
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : 'Không thể tải lịch sử.');
      })
      .finally(() => {
        if (active) setPending(false);
      });
    return () => {
      active = false;
    };
  }, [deepLinkId, mode]);

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
    setCustomNotice('');
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
  function chooseRequest(item: CustomRequest) {
    setSelected(item);
    setCustomNotice('');
    router.replace(`/tra-cuu?yeu-cau=${encodeURIComponent(item.id)}`, { scroll: false });
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
      setItems((xs) => xs.map((x) => (isOrder(x) && x.id === fresh.id ? fresh : x)));
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
  const label = (item: Order | Booking | CustomRequest) =>
    isOrder(item)
      ? item.orderCode
      : isBooking(item)
        ? item.bookingCode
        : item.productName || item.id.slice(0, 8);
  const status = (item: Order | Booking | CustomRequest) =>
    isOrder(item)
      ? item.orderStatus
      : isBooking(item)
        ? item.bookingStatus
        : customStatusLabel(item.status);
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
              setCustomNotice('');
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
              <input name="phone" required pattern={'[+0-9 \\(\\)\\-]{9,20}'} placeholder="0901234567" />
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
      {customNotice && (
        <div className="form-status" role="status">
          {customNotice}
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
      {items.length === 0 && mode === 'connected' && !pending && !preview && !customNotice && (
        <div className="form-status" role="status">
          Chưa có lịch sử{' '}
          {kind === 'orders' ? 'đơn hoa' : kind === 'bookings' ? 'đặt chỗ' : 'yêu cầu đặt riêng'} để
          hiển thị.
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
              {'orderStatus' in item && (
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
              {'bookingStatus' in item && (
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
              {isCustomRequest(item) && (
                <>
                  <br />
                  <button type="button" className="text-link" onClick={() => chooseRequest(item)}>
                    {selected?.id === item.id ? 'Đang xem yêu cầu này' : 'Xem chi tiết yêu cầu'}
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
        <CustomRequestPanel
          key={selected.id}
          request={selected}
          onChanged={(fresh) => {
            setSelected(fresh);
            setItems((xs) => xs.map((x) => (x.id === fresh.id ? fresh : x)));
          }}
        />
      )}
      <Link href="/hoi-dap" className="text-link">
        Có một câu hỏi khác? <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
