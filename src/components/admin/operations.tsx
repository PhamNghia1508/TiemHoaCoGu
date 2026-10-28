'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { storeRequest } from '@/lib/browser-api';
import {
  AdminDialog,
  AdminEmpty,
  AdminLoading,
  StatusBadge,
  useAdminConfirm,
  useDebouncedValue,
} from '@/components/admin/primitives';

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
  customerPhone?: string;
  ticketCount: number;
  bookingStatus: string;
  checkedInAt?: string | null;
  createdAt?: string;
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
const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Không thể thực hiện yêu cầu.');
const money = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);
const dateTimeInput = (value?: string | null) => (value ? value.slice(0, 16) : '');
const Feedback = ({ error, notice }: { error: string; notice: string }) => (
  <>
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
  </>
);

export default function AdminOperations(
  {
    mode = 'workshops',
    readOnly = false,
  }: {
    mode?: 'workshops' | 'custom';
    readOnly?: boolean;
  } = { mode: 'workshops' },
) {
  const confirm = useAdminConfirm();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [roster, setRoster] = useState<Booking[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null);
  const [workshopForm, setWorkshopForm] = useState<WorkshopForm>(emptyWorkshop);
  const [sessionForm, setSessionForm] = useState<SessionForm>(emptySession);
  const [quoteForm, setQuoteForm] = useState<QuoteForm>(emptyQuote);
  const [workshopDialog, setWorkshopDialog] = useState(false);
  const [sessionDialog, setSessionDialog] = useState(false);
  const [editingWorkshopId, setEditingWorkshopId] = useState('');
  const [editingSessionId, setEditingSessionId] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebouncedValue(search, 250);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const workshopRequestId = useRef(0);
  const rosterRequestId = useRef(0);
  const requestDetailId = useRef(0);

  const request = useCallback(
    <T,>(path: string, body?: unknown, method = 'GET') => storeRequest<T>(path, body, method),
    [],
  );
  const loadWorkshops = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setWorkshops(await request<Workshop[]>('workshops'));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [request]);
  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await request<CustomRequest[]>('custom-orders'));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setLoading(false);
    }
  }, [request]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void (mode === 'workshops' ? loadWorkshops() : loadRequests());
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mode, loadRequests, loadWorkshops]);

  const openNewWorkshop = () => {
    setEditingWorkshopId('');
    setWorkshopForm(emptyWorkshop);
    setWorkshopDialog(true);
  };
  const openEditWorkshop = (workshop: Workshop) => {
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
    setWorkshopDialog(true);
  };
  const selectWorkshop = async (workshop: Workshop) => {
    const requestId = ++workshopRequestId.current;
    setSelectedWorkshop(workshop);
    setSelectedSession(null);
    setRoster([]);
    setError('');
    try {
      const result = await request<Session[]>(`workshops/${workshop.id}/sessions`);
      if (requestId === workshopRequestId.current) setSessions(result);
    } catch (e) {
      if (requestId === workshopRequestId.current) {
        setError(errorText(e));
        setSessions([]);
      }
    }
  };
  const submitWorkshop = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly || busy) return;
    setBusy(true);
    setError('');
    try {
      await request<Workshop>(
        editingWorkshopId ? `workshops/${editingWorkshopId}` : 'workshops',
        {
          ...workshopForm,
          basePrice: Number(workshopForm.basePrice),
          duration: Number(workshopForm.duration),
          maxCapacity: Number(workshopForm.maxCapacity),
        },
        editingWorkshopId ? 'PUT' : 'POST',
      );
      setNotice(editingWorkshopId ? 'Đã cập nhật workshop.' : 'Đã tạo workshop.');
      setWorkshopDialog(false);
      setWorkshopForm(emptyWorkshop);
      setEditingWorkshopId('');
      await loadWorkshops();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const openNewSession = () => {
    setEditingSessionId('');
    setSessionForm(emptySession);
    setSessionDialog(true);
  };
  const openEditSession = (session: Session) => {
    setEditingSessionId(session.id);
    setSessionForm({
      sessionDate: session.sessionDate.slice(0, 10),
      startTime: session.startTime.slice(0, 8),
      endTime: session.endTime.slice(0, 8),
      location: session.location,
      capacity: String(session.capacity),
    });
    setSessionDialog(true);
  };
  const reloadSessions = async () => {
    if (selectedWorkshop)
      setSessions(await request<Session[]>(`workshops/${selectedWorkshop.id}/sessions`));
  };
  const submitSession = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedWorkshop || readOnly || busy) return;
    setBusy(true);
    setError('');
    try {
      await request<Session>(
        editingSessionId
          ? `workshops/sessions/${editingSessionId}`
          : `workshops/${selectedWorkshop.id}/sessions`,
        { ...sessionForm, capacity: Number(sessionForm.capacity) },
        editingSessionId ? 'PUT' : 'POST',
      );
      setNotice(editingSessionId ? 'Đã cập nhật ca học.' : 'Đã tạo ca học.');
      setSessionDialog(false);
      setSessionForm(emptySession);
      setEditingSessionId('');
      await reloadSessions();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const cancelSession = async (session: Session) => {
    if (
      readOnly ||
      busy ||
      !(await confirm({
        title: 'Hủy ca học?',
        description: `Xác nhận hủy ca ngày ${session.sessionDate}? Backend sẽ kiểm tra booking hiện có.`,
        confirmLabel: 'Hủy ca',
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    setError('');
    try {
      await request<void>(`workshops/sessions/${session.id}`, undefined, 'DELETE');
      setNotice('Đã hủy ca học.');
      await reloadSessions();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const loadRoster = async (session: Session) => {
    const requestId = ++rosterRequestId.current;
    setSelectedSession(session);
    setRosterLoading(true);
    setError('');
    try {
      const result = await request<Booking[]>(`workshops/sessions/${session.id}/roster`);
      if (requestId === rosterRequestId.current) setRoster(result);
    } catch (e) {
      if (requestId === rosterRequestId.current) {
        setRoster([]);
        setError(errorText(e));
      }
    } finally {
      if (requestId === rosterRequestId.current) setRosterLoading(false);
    }
  };
  const checkIn = async (booking: Booking) => {
    if (
      readOnly ||
      busy ||
      booking.bookingStatus.toLowerCase() === 'attended' ||
      !(await confirm({
        title: 'Xác nhận check-in?',
        description: `Check-in cho ${booking.bookingCode} của ${booking.customerName}?`,
        confirmLabel: 'Check-in',
      }))
    )
      return;
    if (!selectedSession) return;
    setBusy(true);
    setError('');
    try {
      await request<void>(`bookings/${booking.id}/check-in`, {}, 'POST');
      setNotice(`Đã check-in ${booking.bookingCode}.`);
      await loadRoster(selectedSession);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const selectRequest = async (requestItem: CustomRequest) => {
    const detailId = ++requestDetailId.current;
    setSelectedRequest(requestItem);
    setQuote(null);
    setLifecycle(null);
    setDetailLoading(true);
    setError('');
    try {
      const result = await request<Quote>(`custom-orders/${requestItem.id}`);
      if (detailId !== requestDetailId.current) return;
      setQuote(result);
      const current =
        result.revisions?.find((revision) => revision.version === result.currentRevision) ??
        result.revisions?.[result.revisions.length - 1];
      if (current)
        setQuoteForm({
          unitPrice: String(current.unitPrice ?? ''),
          depositPercent: current.totalAmount
            ? String(Math.round(((current.depositAmount ?? 0) / current.totalAmount) * 100))
            : '50',
          completionDate: dateTimeInput(current.completionDate),
          expiresAt: dateTimeInput(current.expiresAt),
          adminNote: current.adminNote ?? '',
        });
      else setQuoteForm(emptyQuote);
    } catch (e) {
      if (detailId === requestDetailId.current) setError(errorText(e));
    } finally {
      if (detailId === requestDetailId.current) setDetailLoading(false);
    }
  };
  const submitQuote = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedRequest || readOnly || busy) return;
    setBusy(true);
    setError('');
    try {
      setQuote(
        await request<Quote>(
          `custom-orders/${selectedRequest.id}/quote`,
          {
            unitPrice: Number(quoteForm.unitPrice),
            depositPercent: Number(quoteForm.depositPercent),
            completionDate: new Date(quoteForm.completionDate).toISOString(),
            adminNote: quoteForm.adminNote,
            ...(quoteForm.expiresAt
              ? { expiresAt: new Date(quoteForm.expiresAt).toISOString() }
              : {}),
          },
          'POST',
        ),
      );
      setNotice('Đã phát hành phiên báo giá mới.');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const lifecycleAction = async (action: 'production/start' | 'complete') => {
    if (!selectedRequest || readOnly || busy) return;
    const label = action === 'complete' ? 'hoàn tất sản xuất' : 'bắt đầu sản xuất';
    if (
      !(await confirm({
        title: `Xác nhận ${label}?`,
        description: 'Backend sẽ kiểm tra điều kiện chuyển trạng thái.',
        confirmLabel: 'Xác nhận',
        destructive: action === 'complete',
      }))
    )
      return;
    setBusy(true);
    setError('');
    try {
      setLifecycle(
        await request<Lifecycle>(`custom-orders/${selectedRequest.id}/${action}`, {}, 'POST'),
      );
      setNotice(`Đã ${label}.`);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const filteredRequests = useMemo(
    () =>
      requests.filter((item) => {
        const haystack = `${item.id} ${item.productId} ${item.description}`.toLowerCase();
        return (
          (!debouncedSearch.trim() || haystack.includes(debouncedSearch.trim().toLowerCase())) &&
          (!statusFilter || item.status === statusFilter)
        );
      }),
    [debouncedSearch, requests, statusFilter],
  );
  const statuses = useMemo(
    () => Array.from(new Set(requests.map((item) => item.status))),
    [requests],
  );

  return (
    <section className="admin-card" aria-labelledby="operations-heading">
      <div className="admin-section-heading">
        <div>
          <h2 id="operations-heading">
            {mode === 'workshops' ? 'Workshop & ca học' : 'Yêu cầu đặt riêng'}
          </h2>
          <p className="admin-muted">
            {readOnly
              ? 'Chế độ chỉ đọc: vẫn xem được chi tiết, không thể thay đổi dữ liệu.'
              : 'Thao tác theo đúng trạng thái backend. Không xử lý thanh toán hay nhà cung cấp.'}
          </p>
        </div>
        <button
          className="button"
          type="button"
          disabled={loading || busy}
          onClick={() => void (mode === 'workshops' ? loadWorkshops() : loadRequests())}
        >
          Làm mới
        </button>
      </div>
      {!workshopDialog && !sessionDialog && (
        <>
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
        </>
      )}
      {mode === 'workshops' ? (
        <>
          <div className="admin-toolbar">
            <strong>Danh sách workshop</strong>
            {!readOnly && (
              <button className="button" type="button" onClick={openNewWorkshop}>
                Tạo workshop
              </button>
            )}
          </div>
          {loading ? (
            <AdminLoading label="Đang tải workshop…" />
          ) : workshops.length === 0 ? (
            <AdminEmpty
              title="Chưa có workshop"
              description="Tạo workshop đầu tiên để mở các ca học."
            />
          ) : (
            <div className="admin-list-detail">
              <ul className="admin-list">
                {workshops.map((workshop) => (
                  <li
                    key={workshop.id}
                    className={selectedWorkshop?.id === workshop.id ? 'is-selected' : ''}
                  >
                    <button
                      className="button button-outline"
                      type="button"
                      onClick={() => void selectWorkshop(workshop)}
                    >
                      {workshop.name}
                    </button>
                    <span>
                      <small>
                        {workshop.code} · {workshop.isActive ? 'Đang mở' : 'Tạm đóng'} ·{' '}
                        {workshop.category || 'Chưa phân loại'}
                      </small>
                    </span>
                    <button
                      className="button button-outline"
                      type="button"
                      onClick={() => openEditWorkshop(workshop)}
                    >
                      Sửa
                    </button>
                  </li>
                ))}
              </ul>
              <div className="admin-detail">
                {!selectedWorkshop ? (
                  <AdminEmpty
                    title="Chọn một workshop"
                    description="Bạn sẽ thấy các ca học và danh sách người đăng ký ở đây."
                  />
                ) : (
                  <>
                    <div className="admin-section-heading">
                      <div>
                        <h3>{selectedWorkshop.name}</h3>
                        <p className="admin-muted">
                          {selectedWorkshop.description || 'Chưa có mô tả.'}
                        </p>
                      </div>
                      {!readOnly && (
                        <button className="button" type="button" onClick={openNewSession}>
                          Tạo ca học
                        </button>
                      )}
                    </div>
                    {sessions.length === 0 ? (
                      <AdminEmpty
                        title="Chưa có ca học"
                        description="Tạo ca học để bắt đầu nhận đăng ký."
                      />
                    ) : (
                      <ul className="admin-record-list">
                        {sessions.map((session) => (
                          <li
                            key={session.id}
                            className={`admin-record ${selectedSession?.id === session.id ? 'is-selected' : ''}`}
                          >
                            <div>
                              <strong>
                                {session.sessionDate} · {session.startTime.slice(0, 5)}–
                                {session.endTime.slice(0, 5)}
                              </strong>
                              <small>
                                {session.location} · {session.bookedSlots}/{session.capacity} chỗ ·{' '}
                                <StatusBadge status={session.sessionStatus} />
                              </small>
                            </div>
                            <div className="admin-actions">
                              <button
                                className="button button-outline"
                                type="button"
                                onClick={() => openEditSession(session)}
                              >
                                Sửa
                              </button>
                              <button
                                className="button button-outline"
                                type="button"
                                onClick={() => void loadRoster(session)}
                              >
                                Roster
                              </button>
                              <button
                                className="button button-danger"
                                type="button"
                                disabled={
                                  readOnly ||
                                  busy ||
                                  session.sessionStatus.toLowerCase() === 'cancelled'
                                }
                                onClick={() => void cancelSession(session)}
                              >
                                Hủy
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                    {selectedSession && (
                      <div className="admin-form-section">
                        <div className="admin-section-heading">
                          <div>
                            <h4>
                              Roster: {selectedSession.sessionDate} · {selectedSession.location}
                            </h4>
                            <p className="admin-muted">
                              Ca đang chọn được đánh dấu rõ để tránh check-in nhầm.
                            </p>
                          </div>
                        </div>
                        {rosterLoading ? (
                          <AdminLoading label="Đang tải danh sách đăng ký…" />
                        ) : roster.length === 0 ? (
                          <AdminEmpty
                            title="Chưa có người đăng ký"
                            description="Roster của ca này đang trống."
                          />
                        ) : (
                          <ul className="admin-list">
                            {roster.map((booking) => (
                              <li key={booking.id}>
                                <span>
                                  <strong>{booking.customerName}</strong>
                                  <small>
                                    {booking.bookingCode} · {booking.ticketCount} vé ·{' '}
                                    <StatusBadge status={booking.bookingStatus} />
                                    {booking.checkedInAt
                                      ? ` · ${new Date(booking.checkedInAt).toLocaleString('vi-VN')}`
                                      : ''}
                                  </small>
                                </span>
                                <button
                                  className="button"
                                  type="button"
                                  disabled={
                                    readOnly ||
                                    busy ||
                                    booking.bookingStatus.toLowerCase() === 'attended'
                                  }
                                  onClick={() => void checkIn(booking)}
                                >
                                  {booking.bookingStatus.toLowerCase() === 'attended'
                                    ? 'Đã check-in'
                                    : 'Check-in'}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="admin-toolbar">
            <label className="admin-field">
              <span>Tìm kiếm</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ID, sản phẩm hoặc mô tả"
              />
            </label>
            <label className="admin-field">
              <span>Lọc trạng thái</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">Tất cả</option>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {loading ? (
            <AdminLoading label="Đang tải yêu cầu đặt riêng…" />
          ) : filteredRequests.length === 0 ? (
            <AdminEmpty
              title="Không có yêu cầu phù hợp"
              description={
                requests.length
                  ? 'Thử đổi từ khóa hoặc trạng thái.'
                  : 'Khi khách gửi yêu cầu, danh sách sẽ hiện ở đây.'
              }
            />
          ) : (
            <div className="admin-list-detail">
              <ul className="admin-list">
                {filteredRequests.map((item) => (
                  <li
                    key={item.id}
                    className={selectedRequest?.id === item.id ? 'is-selected' : ''}
                  >
                    <button
                      className="button button-outline"
                      type="button"
                      onClick={() => void selectRequest(item)}
                    >
                      {item.id.slice(0, 8)}
                    </button>
                    <span>
                      <strong>{item.description.slice(0, 80)}</strong>
                      <small>
                        SL {item.quantity} · <StatusBadge status={item.status} /> ·{' '}
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </small>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="admin-detail">
                {!selectedRequest ? (
                  <AdminEmpty
                    title="Chọn một yêu cầu"
                    description="Chọn một dòng bên trái để xem chi tiết và báo giá."
                  />
                ) : detailLoading ? (
                  <AdminLoading label="Đang tải chi tiết và báo giá…" />
                ) : (
                  <>
                    <h3>Chi tiết yêu cầu</h3>
                    <div className="admin-record">
                      <p>
                        <strong>ID:</strong> {selectedRequest.id}
                      </p>
                      <p>
                        <strong>Sản phẩm:</strong> {selectedRequest.productId} ·{' '}
                        <strong>Số lượng:</strong> {selectedRequest.quantity}
                      </p>
                      <p>
                        <strong>Ngày cần:</strong>{' '}
                        {selectedRequest.requestedCompletionDate
                          ? new Date(selectedRequest.requestedCompletionDate).toLocaleDateString(
                              'vi-VN',
                            )
                          : 'Chưa chốt'}
                      </p>
                      <p>{selectedRequest.description}</p>
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                    <form className="admin-form" onSubmit={submitQuote}>
                      <div className="admin-form-section">
                        <h4>Phiên báo giá mới</h4>
                        <div className="admin-form-grid">
                          <label className="admin-field">
                            <span>Đơn giá *</span>
                            <input
                              required
                              type="number"
                              min="0"
                              value={quoteForm.unitPrice}
                              onChange={(e) =>
                                setQuoteForm({ ...quoteForm, unitPrice: e.target.value })
                              }
                              disabled={readOnly}
                            />
                          </label>
                          <label className="admin-field">
                            <span>Tiền cọc (%)</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={quoteForm.depositPercent}
                              onChange={(e) =>
                                setQuoteForm({ ...quoteForm, depositPercent: e.target.value })
                              }
                              disabled={readOnly}
                            />
                          </label>
                          <label className="admin-field">
                            <span>Ngày hoàn tất *</span>
                            <input
                              required
                              type="datetime-local"
                              value={quoteForm.completionDate}
                              onChange={(e) =>
                                setQuoteForm({ ...quoteForm, completionDate: e.target.value })
                              }
                              disabled={readOnly}
                            />
                          </label>
                          <label className="admin-field">
                            <span>Hạn báo giá</span>
                            <input
                              type="datetime-local"
                              value={quoteForm.expiresAt}
                              onChange={(e) =>
                                setQuoteForm({ ...quoteForm, expiresAt: e.target.value })
                              }
                              disabled={readOnly}
                            />
                          </label>
                        </div>
                        <label className="admin-field">
                          <span>Ghi chú *</span>
                          <textarea
                            required
                            value={quoteForm.adminNote}
                            onChange={(e) =>
                              setQuoteForm({ ...quoteForm, adminNote: e.target.value })
                            }
                            disabled={readOnly}
                          />
                        </label>
                        <div className="admin-form-actions">
                          <button className="button" disabled={readOnly || busy} type="submit">
                            Phát hành báo giá
                          </button>
                        </div>
                      </div>
                    </form>
                    {quote && (
                      <div className="admin-form-section">
                        <h4>Báo giá hiện tại</h4>
                        <p>
                          <strong>Phiên bản:</strong> {quote.currentRevision} ·{' '}
                          <StatusBadge status={quote.status} />
                        </p>
                        <p>
                          <strong>Đã trả:</strong> {money(quote.paidAmount)} ·{' '}
                          <strong>Còn lại:</strong> {money(quote.balanceAmount)}
                        </p>
                        <p className="admin-helper">
                          Các nút sản xuất chỉ gọi transition backend; backend vẫn kiểm tra điều
                          kiện. Không suy diễn trạng thái thanh toán.
                        </p>
                        <div className="admin-actions">
                          <button
                            className="button"
                            type="button"
                            disabled={readOnly || busy || !quote.orderId}
                            onClick={() => void lifecycleAction('production/start')}
                          >
                            Bắt đầu sản xuất
                          </button>
                          <button
                            className="button button-danger"
                            type="button"
                            disabled={readOnly || busy || !quote.orderId}
                            onClick={() => void lifecycleAction('complete')}
                          >
                            Hoàn tất sản xuất
                          </button>
                        </div>
                        {lifecycle && (
                          <p className="admin-muted">
                            Sản xuất: {lifecycle.status} · Giao hàng: {lifecycle.deliveryStatus}
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}
      <AdminDialog
        open={workshopDialog}
        onClose={() => {
          if (!busy) setWorkshopDialog(false);
        }}
        title={editingWorkshopId ? 'Sửa workshop' : 'Tạo workshop'}
        description="Thông tin cơ bản và cách tổ chức workshop."
      >
        <form className="admin-form" onSubmit={submitWorkshop} aria-busy={busy}>
          <Feedback error={error} notice={notice} />
          <div className="admin-form-section">
            <h4>Thông tin nhận diện</h4>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Mã *</span>
                <input
                  required
                  disabled={readOnly || busy}
                  value={workshopForm.code}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, code: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Tên *</span>
                <input
                  required
                  disabled={readOnly || busy}
                  value={workshopForm.name}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, name: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Tên ngắn</span>
                <input
                  disabled={readOnly || busy}
                  value={workshopForm.shortName}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, shortName: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Danh mục</span>
                <input
                  disabled={readOnly || busy}
                  value={workshopForm.category}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, category: e.target.value })}
                />
              </label>
            </div>
          </div>
          <div className="admin-form-section">
            <h4>Giá và sức chứa</h4>
            <div className="admin-form-grid">
              <label className="admin-field">
                <span>Giá cơ bản</span>
                <input
                  disabled={readOnly || busy}
                  type="number"
                  min="0"
                  value={workshopForm.basePrice}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, basePrice: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Thời lượng (phút)</span>
                <input
                  disabled={readOnly || busy}
                  type="number"
                  min="1"
                  value={workshopForm.duration}
                  onChange={(e) => setWorkshopForm({ ...workshopForm, duration: e.target.value })}
                />
              </label>
              <label className="admin-field">
                <span>Sức chứa</span>
                <input
                  disabled={readOnly || busy}
                  type="number"
                  min="1"
                  value={workshopForm.maxCapacity}
                  onChange={(e) =>
                    setWorkshopForm({ ...workshopForm, maxCapacity: e.target.value })
                  }
                />
              </label>
            </div>
          </div>
          <label className="admin-field">
            <span>Mô tả</span>
            <textarea
              disabled={readOnly || busy}
              value={workshopForm.description}
              onChange={(e) => setWorkshopForm({ ...workshopForm, description: e.target.value })}
            />
          </label>
          <div className="admin-checks">
            <label className="admin-field">
              <input
                disabled={readOnly || busy}
                type="checkbox"
                checked={workshopForm.isActive}
                onChange={(e) => setWorkshopForm({ ...workshopForm, isActive: e.target.checked })}
              />
              <span>Đang mở</span>
            </label>
            <label className="admin-field">
              <input
                disabled={readOnly || busy}
                type="checkbox"
                checked={workshopForm.isFeatured}
                onChange={(e) => setWorkshopForm({ ...workshopForm, isFeatured: e.target.checked })}
              />
              <span>Nổi bật</span>
            </label>
          </div>
          <div className="admin-form-actions">
            <button className="button" disabled={readOnly || busy} type="submit">
              {editingWorkshopId ? 'Lưu workshop' : 'Tạo workshop'}
            </button>
          </div>
        </form>
      </AdminDialog>
      <AdminDialog
        open={sessionDialog}
        onClose={() => {
          if (!busy) setSessionDialog(false);
        }}
        title={editingSessionId ? 'Sửa ca học' : 'Tạo ca học'}
        description="Nhập ngày, giờ, địa điểm và số chỗ của ca."
      >
        <form className="admin-form" onSubmit={submitSession} aria-busy={busy}>
          <Feedback error={error} notice={notice} />
          <div className="admin-form-grid">
            <label className="admin-field">
              <span>Ngày *</span>
              <input
                required
                disabled={readOnly || busy}
                type="date"
                value={sessionForm.sessionDate}
                onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>Bắt đầu *</span>
              <input
                required
                disabled={readOnly || busy}
                type="time"
                step="1"
                value={sessionForm.startTime}
                onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>Kết thúc *</span>
              <input
                required
                disabled={readOnly || busy}
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
                disabled={readOnly || busy}
                value={sessionForm.location}
                onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
              />
            </label>
            <label className="admin-field">
              <span>Sức chứa *</span>
              <input
                required
                disabled={readOnly || busy}
                type="number"
                min="1"
                value={sessionForm.capacity}
                onChange={(e) => setSessionForm({ ...sessionForm, capacity: e.target.value })}
              />
            </label>
          </div>
          <div className="admin-form-actions">
            <button className="button" disabled={readOnly || busy} type="submit">
              {editingSessionId ? 'Lưu ca học' : 'Tạo ca học'}
            </button>
          </div>
        </form>
      </AdminDialog>
    </section>
  );
}
