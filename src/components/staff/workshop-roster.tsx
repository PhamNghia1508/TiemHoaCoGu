'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Lock,
  ChevronRight,
  UserCheck,
  UserX,
  Sparkles,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import type { WorkshopBrief, WorkshopSession, RosterBooking } from './types';

function formatMoney(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatTime(timeStr?: string) {
  if (!timeStr) return '';
  return timeStr.slice(0, 5);
}

function bookingBadge(status: string) {
  switch (status.toLowerCase()) {
    case 'attended':
      return { label: 'Đã điểm danh', className: 'badge-completed' };
    case 'no_show':
      return { label: 'Vắng mặt', className: 'badge-cancelled' };
    case 'confirmed':
      return { label: 'Đã xác nhận', className: 'badge-confirmed' };
    case 'pending':
      return { label: 'Chờ thanh toán', className: 'badge-amber' };
    case 'cancelled':
      return { label: 'Đã hủy', className: 'badge-cancelled' };
    default:
      return { label: status, className: 'badge-default' };
  }
}

export default function StaffWorkshopRoster() {
  const [workshops, setWorkshops] = useState<WorkshopBrief[]>([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState<string>('');
  const [sessions, setSessions] = useState<WorkshopSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');

  const [roster, setRoster] = useState<RosterBooking[]>([]);
  const [loadingWorkshops, setLoadingWorkshops] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingRoster, setLoadingRoster] = useState(false);

  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Load all workshops
  const loadWorkshops = useCallback(async () => {
    setLoadingWorkshops(true);
    setError('');
    try {
      const data = await storeRequest<WorkshopBrief[]>('workshops');
      const activeList = data || [];
      setWorkshops(activeList);
      if (activeList.length > 0 && !selectedWorkshopId) {
        setSelectedWorkshopId(activeList[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách workshop.');
    } finally {
      setLoadingWorkshops(false);
    }
  }, [selectedWorkshopId]);

  useEffect(() => {
    void loadWorkshops();
  }, [loadWorkshops]);

  // 2. Load sessions when selected workshop changes
  useEffect(() => {
    if (!selectedWorkshopId) return;
    const loadSessions = async () => {
      setLoadingSessions(true);
      setError('');
      try {
        const data = await storeRequest<WorkshopSession[]>(`workshops/${selectedWorkshopId}/sessions`);
        const list = data || [];
        setSessions(list);
        if (list.length > 0) {
          setSelectedSessionId(list[0].id);
        } else {
          setSelectedSessionId('');
          setRoster([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách ca học.');
      } finally {
        setLoadingSessions(false);
      }
    };
    void loadSessions();
  }, [selectedWorkshopId]);

  // 3. Load roster when selected session changes
  const loadRoster = useCallback(async () => {
    if (!selectedSessionId) {
      setRoster([]);
      return;
    }
    setLoadingRoster(true);
    setError('');
    try {
      const data = await storeRequest<RosterBooking[]>(`workshops/sessions/${selectedSessionId}/roster`);
      setRoster(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách học viên (Roster).');
    } finally {
      setLoadingRoster(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    void loadRoster();
  }, [loadRoster]);

  // Check-in action
  const handleCheckIn = async (bookingId: string) => {
    setActionBusy(bookingId);
    setError('');
    setSuccessMsg('');
    try {
      await storeRequest(`bookings/${bookingId}/check-in`, {}, 'POST');
      setSuccessMsg('Điểm danh học viên thành công!');
      await loadRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Điểm danh thất bại (chỉ điểm danh khi đã bắt đầu ca và đủ cọc).');
    } finally {
      setActionBusy(null);
    }
  };

  // No-show action
  const handleNoShow = async (bookingId: string) => {
    if (!window.confirm('Xác nhận ghi nhận học viên vắng mặt (No-show)?')) return;
    setActionBusy(bookingId);
    setError('');
    setSuccessMsg('');
    try {
      await storeRequest(`bookings/${bookingId}/no-show`, {}, 'POST');
      setSuccessMsg('Đã ghi nhận vắng mặt học viên.');
      await loadRoster();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể ghi nhận vắng mặt (chỉ ghi nhận sau khi ca học kết thúc).');
    } finally {
      setActionBusy(null);
    }
  };

  // Close session action
  const handleCloseSession = async () => {
    if (!selectedSessionId) return;
    if (!window.confirm('Bạn có chắc chắn muốn đóng ca học này? Ca học đã đóng không thể thêm người mới.')) return;
    setActionBusy('close-session');
    setError('');
    setSuccessMsg('');
    try {
      await storeRequest(`workshops/sessions/${selectedSessionId}/close`, {}, 'POST');
      setSuccessMsg('Đã đóng ca học thành công.');
      // Refresh sessions
      const data = await storeRequest<WorkshopSession[]>(`workshops/${selectedWorkshopId}/sessions`);
      setSessions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đóng ca (chỉ đóng khi ca đã hết giờ và xử lý hết booking).');
    } finally {
      setActionBusy(null);
    }
  };

  const currentWorkshop = workshops.find((w) => w.id === selectedWorkshopId);
  const currentSession = sessions.find((s) => s.id === selectedSessionId);

  const totalAttendees = roster.reduce((sum, b) => sum + (b.bookingStatus !== 'cancelled' ? b.ticketCount : 0), 0);
  const attendedCount = roster.filter((b) => b.bookingStatus === 'attended').length;

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

      {/* Workshop and Session Selector Controls */}
      <div className="staff-filter-card">
        <div className="staff-filters-grid">
          <label className="staff-field">
            <span>Chọn Workshop</span>
            <select
              value={selectedWorkshopId}
              onChange={(e) => setSelectedWorkshopId(e.target.value)}
              className="staff-input"
              disabled={loadingWorkshops}
            >
              {workshops.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </label>

          <label className="staff-field">
            <span>Chọn Ca học</span>
            <select
              value={selectedSessionId}
              onChange={(e) => setSelectedSessionId(e.target.value)}
              className="staff-input"
              disabled={loadingSessions || sessions.length === 0}
            >
              {sessions.length === 0 ? (
                <option value="">(Chưa có ca học nào)</option>
              ) : (
                sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatDate(s.sessionDate)} · {formatTime(s.startTime)} - {formatTime(s.endTime)} ({s.bookedSlots}/{s.maxSlots} chỗ)
                  </option>
                ))
              )}
            </select>
          </label>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="button"
              className="staff-btn staff-btn-secondary"
              style={{ width: '100%', height: '42px' }}
              onClick={() => void loadRoster()}
              disabled={loadingRoster || !selectedSessionId}
            >
              <RefreshCw size={15} className={loadingRoster ? 'spin-anim' : ''} />
              <span>Tải lại danh sách</span>
            </button>
          </div>
        </div>

        {/* Selected Session Info Banner */}
        {currentSession && (
          <div className="staff-session-summary-bar">
            <div className="staff-session-meta-items">
              <span>
                <CalendarDays size={15} /> <strong>{formatDate(currentSession.sessionDate)}</strong>
              </span>
              <span>
                <Clock size={15} />{' '}
                <strong>
                  {formatTime(currentSession.startTime)} - {formatTime(currentSession.endTime)}
                </strong>
              </span>
              <span>
                <MapPin size={15} /> {currentSession.location || 'Xưởng Tiệm Hoa Có Gu'}
              </span>
              <span>
                <Users size={15} /> Đã đặt: <strong>{currentSession.bookedSlots}/{currentSession.maxSlots}</strong>
              </span>
              <span className={`staff-badge badge-${currentSession.sessionStatus.toLowerCase()}`}>
                Trạng thái: {currentSession.sessionStatus}
              </span>
            </div>

            {currentSession.sessionStatus !== 'Closed' && currentSession.sessionStatus !== 'Cancelled' && (
              <button
                type="button"
                className="staff-btn staff-btn-secondary staff-btn-sm"
                onClick={() => void handleCloseSession()}
                disabled={actionBusy === 'close-session'}
              >
                <Lock size={14} /> Đóng ca học
              </button>
            )}
          </div>
        )}
      </div>

      {/* Roster Attendance Table */}
      <div className="staff-section-card">
        <div className="staff-section-header">
          <div>
            <h3>Danh sách học viên điểm danh (Roster)</h3>
            <p className="staff-muted">
              Tổng số chỗ đăng ký: <strong>{totalAttendees}</strong> | Đã check-in:{' '}
              <strong style={{ color: '#059669' }}>{attendedCount}</strong>
            </p>
          </div>
        </div>

        {loadingRoster ? (
          <div className="staff-loading-box">
            <RefreshCw size={24} className="spin-anim" />
            <p>Đang tải danh sách học viên…</p>
          </div>
        ) : roster.length === 0 ? (
          <div className="staff-empty-box">
            <Users size={36} />
            <h3>Chưa có học viên nào đăng ký ca này</h3>
            <p>Khi có khách đặt vé trên trang web hoặc đăng ký tại quầy, thông tin sẽ xuất hiện ngay tại đây.</p>
          </div>
        ) : (
          <div className="staff-roster-table-wrapper">
            <table className="staff-roster-table">
              <thead>
                <tr>
                  <th>Mã vé</th>
                  <th>Học viên</th>
                  <th>Số vé</th>
                  <th>Tổng tiền</th>
                  <th>Còn thiếu</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Thao tác điểm danh</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((booking) => {
                  const badge = bookingBadge(booking.bookingStatus);
                  const isBusy = actionBusy === booking.id;
                  const canCheckIn = booking.bookingStatus.toLowerCase() === 'confirmed';
                  const canNoShow = booking.bookingStatus.toLowerCase() === 'confirmed';

                  return (
                    <tr key={booking.id}>
                      <td>
                        <strong className="staff-mono">{booking.bookingCode}</strong>
                      </td>
                      <td>
                        <div className="staff-attendee-name">
                          <strong>{booking.customerName || 'Khách vãng lai'}</strong>
                          {booking.checkedInAt && (
                            <span className="staff-checkin-time">
                              Check-in lúc {formatDate(booking.checkedInAt)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="staff-pill-badge">{booking.ticketCount} vé</span>
                      </td>
                      <td>{formatMoney(booking.totalAmount)}</td>
                      <td>
                        {booking.remainingAmount > 0 ? (
                          <span style={{ color: '#dc2626', fontWeight: 600 }}>
                            {formatMoney(booking.remainingAmount)}
                          </span>
                        ) : (
                          <span style={{ color: '#059669' }}>Đã đủ 100%</span>
                        )}
                      </td>
                      <td>
                        <span className={`staff-badge ${badge.className}`}>{badge.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {canCheckIn && (
                            <button
                              type="button"
                              className="staff-btn staff-btn-primary staff-btn-sm"
                              onClick={() => void handleCheckIn(booking.id)}
                              disabled={isBusy}
                            >
                              <UserCheck size={14} /> Điểm danh
                            </button>
                          )}

                          {canNoShow && (
                            <button
                              type="button"
                              className="staff-btn staff-btn-secondary staff-btn-sm"
                              onClick={() => void handleNoShow(booking.id)}
                              disabled={isBusy}
                            >
                              <UserX size={14} /> Vắng mặt
                            </button>
                          )}

                          {!canCheckIn && !canNoShow && (
                            <span className="staff-muted" style={{ fontSize: '13px' }}>
                              {booking.bookingStatus === 'attended' ? '✓ Đã vào lớp' : '—'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
