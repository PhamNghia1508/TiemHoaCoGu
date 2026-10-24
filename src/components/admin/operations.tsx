'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { storeRequest } from '@/lib/browser-api';

type Workshop = {
  id: string;
  code: string;
  name: string;
  shortName?: string | null;
  category?: string | null;
  basePrice: number;
  duration: number;
  maxCapacity: number;
  description?: string | null;
  isFeatured: boolean;
  isActive: boolean;
};
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
  sessionId: string;
  bookingCode: string;
  customerName: string;
  ticketCount: number;
  bookingStatus: string;
  checkedInAt?: string | null;
  createdAt: string;
};
type CustomRequest = {
  id: string;
  productId: string;
  quantity: number;
  description: string;
  referenceImageUrl?: string | null;
  requestedCompletionDate?: string | null;
  status: string;
  createdAt: string;
};
type Quote = {
  id: string;
  requestId: string;
  currentRevision: number;
  status: string;
  revisions: QuoteRevision[];
  orderId?: string | null;
  paidAmount: number;
  balanceAmount: number;
};
type QuoteRevision = {
  version: number;
  unitPrice?: number | null;
  totalAmount?: number | null;
  depositAmount?: number | null;
  completionDate: string;
  expiresAt: string;
  adminNote: string;
  status: string;
};
type Lifecycle = {
  requestId: string;
  orderId: string;
  status: string;
  scheduledCompletionDate?: string | null;
  productionStartedAt?: string | null;
  completedAt?: string | null;
  deliveryStatus: string;
};
type WorkshopForm = {
  code: string;
  name: string;
  shortName: string;
  category: string;
  basePrice: string;
  duration: string;
  maxCapacity: string;
  description: string;
  isFeatured: boolean;
  isActive: boolean;
};
type SessionForm = {
  sessionDate: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: string;
};
type QuoteForm = {
  unitPrice: string;
  depositPercent: string;
  completionDate: string;
  expiresAt: string;
  adminNote: string;
};

const emptyWorkshop: WorkshopForm = {
  code: '',
  name: '',
  shortName: '',
  category: '',
  basePrice: '0',
  duration: '120',
  maxCapacity: '12',
  description: '',
  isFeatured: false,
  isActive: true,
};
const emptySession: SessionForm = {
  sessionDate: '',
  startTime: '09:00:00',
  endTime: '11:00:00',
  location: '',
  capacity: '12',
};
const emptyQuote: QuoteForm = {
  unitPrice: '',
  depositPercent: '50',
  completionDate: '',
  expiresAt: '',
  adminNote: '',
};
const asNumber = (value: string) => Number(value);
const displayError = (error: unknown) =>
  error instanceof Error ? error.message : 'Không thể thực hiện yêu cầu.';

export default function AdminOperations() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [roster, setRoster] = useState<Booking[]>([]);
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null);
  const [workshopForm, setWorkshopForm] = useState<WorkshopForm>(emptyWorkshop);
  const [sessionForm, setSessionForm] = useState<SessionForm>(emptySession);
  const [quoteForm, setQuoteForm] = useState<QuoteForm>(emptyQuote);
  const [editingWorkshopId, setEditingWorkshopId] = useState('');
  const [editingSessionId, setEditingSessionId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const run = useCallback(async <T,>(path: string, body?: unknown, method = 'GET') => {
    setError('');
    setNotice('');
    return storeRequest<T>(path, body, method);
  }, []);

  const loadWorkshops = useCallback(async () => {
    try {
      setWorkshops(await run<Workshop[]>('workshops'));
    } catch (e) {
      setError(displayError(e));
    }
  }, [run]);
  const loadRequests = useCallback(async () => {
    try {
      setRequests(await run<CustomRequest[]>('custom-orders'));
    } catch (e) {
      setError(displayError(e));
    }
  }, [run]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadWorkshops();
      void loadRequests();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadWorkshops, loadRequests]);

  const submitWorkshop = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const payload = {
      ...workshopForm,
      basePrice: asNumber(workshopForm.basePrice),
      duration: asNumber(workshopForm.duration),
      maxCapacity: asNumber(workshopForm.maxCapacity),
    };
    try {
      await run<Workshop>(
        editingWorkshopId ? `workshops/${editingWorkshopId}` : 'workshops',
        payload,
        editingWorkshopId ? 'PUT' : 'POST',
      );
      setNotice(editingWorkshopId ? 'Đã cập nhật workshop.' : 'Đã tạo workshop.');
      setWorkshopForm(emptyWorkshop);
      setEditingWorkshopId('');
      await loadWorkshops();
    } catch (e) {
      setError(displayError(e));
    } finally {
      setBusy(false);
    }
  };
  const selectWorkshop = async (workshop: Workshop) => {
    setSelectedWorkshop(workshop);
    setEditingWorkshopId(workshop.id);
    setWorkshopForm({
      code: workshop.code,
      name: workshop.name,
      shortName: workshop.shortName ?? '',
      category: workshop.category ?? '',
      basePrice: String(workshop.basePrice),
      duration: String(workshop.duration),
      maxCapacity: String(workshop.maxCapacity),
      description: workshop.description ?? '',
      isFeatured: workshop.isFeatured,
      isActive: workshop.isActive,
    });
    try {
      setSessions(await run<Session[]>(`workshops/${workshop.id}/sessions`));
    } catch (e) {
      setError(displayError(e));
    }
  };
  const submitSession = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedWorkshop) return;
    setBusy(true);
    const payload = { ...sessionForm, capacity: asNumber(sessionForm.capacity) };
    try {
      await run<Session>(
        editingSessionId
          ? `workshops/sessions/${editingSessionId}`
          : `workshops/${selectedWorkshop.id}/sessions`,
        payload,
        editingSessionId ? 'PUT' : 'POST',
      );
      setNotice(editingSessionId ? 'Đã cập nhật ca học.' : 'Đã tạo ca học.');
      setSessionForm(emptySession);
      setEditingSessionId('');
      setSessions(await run<Session[]>(`workshops/${selectedWorkshop.id}/sessions`));
    } catch (e) {
      setError(displayError(e));
    } finally {
      setBusy(false);
    }
  };
  const cancelSession = async (session: Session) => {
    if (!window.confirm(`Hủy ca ${session.sessionDate}? Backend sẽ kiểm tra booking hiện có.`))
      return;
    setBusy(true);
    try {
      await run<void>(`workshops/sessions/${session.id}`, undefined, 'DELETE');
      setNotice('Đã hủy ca học.');
      if (selectedWorkshop)
        setSessions(await run<Session[]>(`workshops/${selectedWorkshop.id}/sessions`));
    } catch (e) {
      setError(displayError(e));
    } finally {
      setBusy(false);
    }
  };
  const loadRoster = async (session: Session) => {
    try {
      setRoster(await run<Booking[]>(`workshops/sessions/${session.id}/roster`));
    } catch (e) {
      setError(displayError(e));
    }
  };
  const selectRequest = async (request: CustomRequest) => {
    setSelectedRequest(request);
    setQuote(null);
    setLifecycle(null);
    try {
      setQuote(await run<Quote>(`custom-orders/${request.id}`));
    } catch (e) {
      setError(displayError(e));
    }
  };
  const submitQuote = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRequest) return;
    setBusy(true);
    const payload = {
      unitPrice: asNumber(quoteForm.unitPrice),
      depositPercent: asNumber(quoteForm.depositPercent),
      completionDate: new Date(quoteForm.completionDate).toISOString(),
      adminNote: quoteForm.adminNote,
      ...(quoteForm.expiresAt ? { expiresAt: new Date(quoteForm.expiresAt).toISOString() } : {}),
    };
    try {
      setQuote(await run<Quote>(`custom-orders/${selectedRequest.id}/quote`, payload, 'POST'));
      setNotice('Đã phát hành phiên báo giá mới.');
    } catch (e) {
      setError(displayError(e));
    } finally {
      setBusy(false);
    }
  };
  const lifecycleAction = async (action: 'production/start' | 'complete') => {
    if (!selectedRequest) return;
    setBusy(true);
    try {
      setLifecycle(
        await run<Lifecycle>(`custom-orders/${selectedRequest.id}/${action}`, {}, 'POST'),
      );
      setNotice(action === 'complete' ? 'Đã hoàn tất sản xuất.' : 'Đã bắt đầu sản xuất.');
    } catch (e) {
      setError(displayError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-card" aria-labelledby="operations-heading">
      <div className="admin-section-heading">
        <div>
          <h2 id="operations-heading">Vận hành</h2>
          <p className="admin-muted">
            Chỉ thao tác khi trạng thái backend cho phép. Không có thanh toán, hoàn tiền hay ghi
            nhận đã trả thủ công.
          </p>
        </div>
        <button
          className="button"
          type="button"
          onClick={() => {
            void loadWorkshops();
            void loadRequests();
          }}
        >
          Làm mới
        </button>
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
      <div className="admin-grid-two">
        <div>
          <h3>Workshop & ca học</h3>
          <form className="admin-form" onSubmit={submitWorkshop}>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Mã *</span>
                <input
                  required
                  value={workshopForm.code}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, code: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Tên *</span>
                <input
                  required
                  value={workshopForm.name}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, name: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Giá cơ bản</span>
                <input
                  type="number"
                  min="0"
                  value={workshopForm.basePrice}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, basePrice: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Thời lượng (phút)</span>
                <input
                  type="number"
                  min="1"
                  value={workshopForm.duration}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, duration: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Sức chứa</span>
                <input
                  type="number"
                  min="1"
                  value={workshopForm.maxCapacity}
                  onChange={(e) =>
                    setWorkshopForm({ ...workshopForm, maxCapacity: e.target.value })
                  }
                />
              </label>
              <label className="admin-field">
                <span>Danh mục</span>
                <input
                  value={workshopForm.category}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, category: e.target.value })}
                />
              </label>
            </div>
            <label className="admin-field">
              <span>Mô tả</span>
              <textarea
                value={workshopForm.description}
                onChange={(e) => setWorkshopForm({ ...workshopForm, description: e.target.value })}
              />
            </label>
            <div className="admin-checks">
              <label className="admin-field">
                <input
                  type="checkbox"
                  checked={workshopForm.isActive}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, isActive: e.target.checked })}
                />
                <span>Đang mở</span>
              </label>
              <label className="admin-field">
                <input
                  type="checkbox"
                  checked={workshopForm.isFeatured}
                  onChange={(e) =>
                    setWorkshopForm({ ...workshopForm, isFeatured: e.target.checked })
                  }
                />
                <span>Nổi bật</span>
              </label>
            </div>
            <button className="button" disabled={busy} type="submit">
              {editingWorkshopId ? 'Lưu workshop' : 'Tạo workshop'}
            </button>
            {editingWorkshopId && (
              <button
                className="button"
                type="button"
                onClick={() => {
                  setEditingWorkshopId('');
                  setWorkshopForm(emptyWorkshop);
                }}
              >
                Hủy sửa
              </button>
            )}
          </form>
          <ul className="admin-list">
            {workshops.map((w) => (
              <li key={w.id}>
                <span>
                  <strong>{w.name}</strong>
                  <small>
                    {w.code} · {w.isActive ? 'Đang mở' : 'Tạm đóng'}
                  </small>
                </span>
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    void selectWorkshop(w);
                  }}
                >
                  Quản lý ca
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>
            {selectedWorkshop ? `Ca học: ${selectedWorkshop.name}` : 'Chọn workshop để quản lý ca'}
          </h3>
          {selectedWorkshop && (
            <>
              <form className="admin-form" onSubmit={submitSession}>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span>Ngày *</span>
                    <input
                      required
                      type="date"
                      value={sessionForm.sessionDate}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, sessionDate: e.target.value })
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>Bắt đầu *</span>
                    <input
                      required
                      type="time"
                      step="1"
                      value={sessionForm.startTime}
                      onChange={(e) =>
                        setSessionForm({ ...sessionForm, startTime: e.target.value })
                      }
                    />
                  </label>
                  <label className="admin-field">
                    <span>Kết thúc *</span>
                    <input
                      required
                      type="time"
                      step="1"
                      value={sessionForm.endTime}
                      onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    <span>Địa điểm *</span>
                    <input
                      required
                      value={sessionForm.location}
                      onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                    />
                  </label>
                  <label className="admin-field">
                    <span>Sức chứa *</span>
                    <input
                      required
                      type="number"
                      min="1"
                      value={sessionForm.capacity}
                      onChange={(e) => setSessionForm({ ...sessionForm, capacity: e.target.value })}
                    />
                  </label>
                </div>
                <button className="button" disabled={busy} type="submit">
                  {editingSessionId ? 'Lưu ca học' : 'Tạo ca học'}
                </button>
              </form>
              <ul className="admin-list">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <span>
                      <strong>
                        {s.sessionDate} · {s.startTime}–{s.endTime}
                      </strong>
                      <small>
                        {s.location} · {s.bookedSlots}/{s.capacity} · {s.sessionStatus}
                      </small>
                    </span>
                    <span>
                      <button
                        className="button"
                        type="button"
                        onClick={() => {
                          setEditingSessionId(s.id);
                          setSessionForm({
                            sessionDate: s.sessionDate.slice(0, 10),
                            startTime: s.startTime.slice(0, 8),
                            endTime: s.endTime.slice(0, 8),
                            location: s.location,
                            capacity: String(s.capacity),
                          });
                        }}
                      >
                        Sửa
                      </button>{' '}
                      <button
                        className="button"
                        type="button"
                        onClick={() => {
                          void loadRoster(s);
                        }}
                      >
                        Danh sách
                      </button>{' '}
                      <button
                        className="button"
                        type="button"
                        disabled={busy || s.sessionStatus.toLowerCase() === 'cancelled'}
                        onClick={() => {
                          void cancelSession(s);
                        }}
                      >
                        Hủy
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
              {roster.length > 0 && (
                <div>
                  <h4>Roster</h4>
                  <ul className="admin-list">
                    {roster.map((b) => (
                      <li key={b.id}>
                        <span>
                          {b.customerName}
                          <small>
                            {b.bookingCode} · {b.ticketCount} vé · {b.bookingStatus}
                            {b.checkedInAt ? ' · đã check-in' : ''}
                          </small>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div>
        <h3>Yêu cầu đặt riêng</h3>
        <div className="admin-grid-two">
          <ul className="admin-list">
            {requests.map((r) => (
              <li key={r.id}>
                <span>
                  <strong>{r.description.slice(0, 80)}</strong>
                  <small>
                    {r.status} · SL {r.quantity}
                  </small>
                </span>
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    void selectRequest(r);
                  }}
                >
                  Mở
                </button>
              </li>
            ))}
          </ul>
          {selectedRequest && (
            <div>
              <p>
                <strong>Chi tiết:</strong> {selectedRequest.description}
              </p>
              <form className="admin-form" onSubmit={submitQuote}>
                <h4>Báo giá / sửa phiên bản</h4>
                <label className="admin-field">
                  <span>Đơn giá *</span>
                  <input
                    required
                    type="number"
                    min="0"
                    value={quoteForm.unitPrice}
                    onChange={(e) => setQuoteForm({ ...quoteForm, unitPrice: e.target.value })}
                  />
                </label>
                <label className="admin-field">
                  <span>Tiền cọc (%)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={quoteForm.depositPercent}
                    onChange={(e) => setQuoteForm({ ...quoteForm, depositPercent: e.target.value })}
                  />
                </label>
                <label className="admin-field">
                  <span>Ngày hoàn tất *</span>
                  <input
                    required
                    type="datetime-local"
                    value={quoteForm.completionDate}
                    onChange={(e) => setQuoteForm({ ...quoteForm, completionDate: e.target.value })}
                  />
                </label>
                <label className="admin-field">
                  <span>Hạn báo giá</span>
                  <input
                    type="datetime-local"
                    value={quoteForm.expiresAt}
                    onChange={(e) => setQuoteForm({ ...quoteForm, expiresAt: e.target.value })}
                  />
                </label>
                <label className="admin-field">
                  <span>Ghi chú *</span>
                  <textarea
                    required
                    value={quoteForm.adminNote}
                    onChange={(e) => setQuoteForm({ ...quoteForm, adminNote: e.target.value })}
                  />
                </label>
                <button className="button" disabled={busy} type="submit">
                  Gửi báo giá
                </button>
              </form>
              {quote && (
                <>
                  <p>
                    Phiên bản hiện tại: {quote.currentRevision} · {quote.status}
                  </p>
                  <div className="admin-checks">
                    <button
                      className="button"
                      type="button"
                      disabled={busy || !quote.orderId}
                      onClick={() => {
                        void lifecycleAction('production/start');
                      }}
                    >
                      Bắt đầu sản xuất
                    </button>
                    <button
                      className="button"
                      type="button"
                      disabled={busy || !quote.orderId}
                      onClick={() => {
                        void lifecycleAction('complete');
                      }}
                    >
                      Hoàn tất sản xuất
                    </button>
                  </div>
                  {lifecycle && (
                    <p className="admin-muted">
                      Trạng thái sản xuất: {lifecycle.status} · giao hàng:{' '}
                      {lifecycle.deliveryStatus}
                    </p>
                  )}
                  <p className="admin-muted">
                    Các nút sản xuất chỉ gọi transition backend; không suy diễn trạng thái thanh
                    toán.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
