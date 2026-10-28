'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserCheck,
  UserX,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import type { WorkshopBrief, WorkshopSession, RosterBooking } from './types';

export type EnrichedSession = WorkshopSession & {
  workshopName: string;
  workshopCode: string;
  basePrice: number;
};

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

function formatDateLong(d: Date) {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString('vi-VN');
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

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function isToday(d: Date): boolean {
  return isSameDay(d, new Date());
}

function toISODateInput(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const dayNamesVi = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function StaffWorkshopRoster() {
  // Calendar Navigation State
  const [currentWeekMonday, setCurrentWeekMonday] = useState<Date>(() => getMonday(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  // Master Data: All enriched sessions
  const [sessions, setSessions] = useState<EnrichedSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Active Selected Session for Roster View (null = viewing day list)
  const [activeSession, setActiveSession] = useState<EnrichedSession | null>(null);
  const [roster, setRoster] = useState<RosterBooking[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Operation feedback
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch all workshops and sessions once
  const loadAllSessions = useCallback(async () => {
    setLoadingSessions(true);
    setError('');
    try {
      const workshops = await storeRequest<WorkshopBrief[]>('workshops');
      const all: EnrichedSession[] = [];

      await Promise.all(
        (workshops || []).map(async (ws) => {
          try {
            const sList = await storeRequest<WorkshopSession[]>(`workshops/${ws.id}/sessions`);
            (sList || []).forEach((s) => {
              all.push({
                ...s,
                workshopName: ws.name,
                workshopCode: ws.code,
                basePrice: ws.basePrice,
              });
            });
          } catch {
            // ignore empty session lists
          }
        }),
      );

      all.sort(
        (a, b) =>
          new Date(a.sessionDate).getTime() - new Date(b.sessionDate).getTime() ||
          a.startTime.localeCompare(b.startTime),
      );
      setSessions(all);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách ca học.');
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    void loadAllSessions();
  }, [loadAllSessions]);

  // 2. Fetch roster when active session is opened
  const loadRosterForSession = useCallback(async (session: EnrichedSession) => {
    setLoadingRoster(true);
    setError('');
    try {
      const data = await storeRequest<RosterBooking[]>(`workshops/sessions/${session.id}/roster`);
      setRoster(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách học viên của ca.');
    } finally {
      setLoadingRoster(false);
    }
  }, []);

  const openSessionRoster = (session: EnrichedSession) => {
    setActiveSession(session);
    setError('');
    setSuccessMsg('');
    void loadRosterForSession(session);
  };

  const closeRosterView = () => {
    setActiveSession(null);
    setRoster([]);
    setError('');
    setSuccessMsg('');
  };

  // Check-in action
  const handleCheckIn = async (bookingId: string) => {
    setActionBusy(bookingId);
    setError('');
    setSuccessMsg('');
    try {
      await storeRequest(`bookings/${bookingId}/check-in`, {}, 'POST');
      setSuccessMsg('Điểm danh học viên thành công!');
      if (activeSession) {
        await loadRosterForSession(activeSession);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Điểm danh thất bại (chỉ điểm danh khi đã đến giờ ca học và đã đóng đủ tiền).',
      );
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
      if (activeSession) {
        await loadRosterForSession(activeSession);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể ghi nhận vắng mặt (chỉ được ghi nhận sau khi ca học kết thúc).',
      );
    } finally {
      setActionBusy(null);
    }
  };

  // Close session action
  const handleCloseSession = async () => {
    if (!activeSession) return;
    if (!window.confirm('Bạn có chắc chắn muốn đóng ca học này? Ca học đã đóng sẽ hoàn tất nghiệp vụ.')) return;
    setActionBusy('close-session');
    setError('');
    setSuccessMsg('');
    try {
      await storeRequest(`workshops/sessions/${activeSession.id}/close`, {}, 'POST');
      setSuccessMsg('Đã đóng ca học thành công.');
      // Refresh session
      setActiveSession((prev) => (prev ? { ...prev, sessionStatus: 'Closed' } : null));
      await loadAllSessions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đóng ca (chỉ đóng khi ca đã kết thúc giờ học và xử lý hết booking).',
      );
    } finally {
      setActionBusy(null);
    }
  };

  // Calendar helpers
  const weekDays = getWeekDays(currentWeekMonday);

  const getSessionsOnDate = (d: Date) => {
    return sessions.filter((s) => isSameDay(new Date(s.sessionDate), d));
  };

  const selectedDateSessions = getSessionsOnDate(selectedDate);
  const weekHasSessions = sessions.filter((s) =>
    weekDays.some((wd) => isSameDay(new Date(s.sessionDate), wd)),
  );

  const handlePrevWeek = () => {
    const prev = new Date(currentWeekMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentWeekMonday(prev);
    setSelectedDate(prev);
    setActiveSession(null);
  };

  const handleNextWeek = () => {
    const next = new Date(currentWeekMonday);
    next.setDate(next.getDate() + 7);
    setCurrentWeekMonday(next);
    setSelectedDate(next);
    setActiveSession(null);
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentWeekMonday(getMonday(now));
    setSelectedDate(now);
    setActiveSession(null);
  };

  const handlePickDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [y, m, d] = e.target.value.split('-').map(Number);
    const picked = new Date(y, m - 1, d);
    setSelectedDate(picked);
    setCurrentWeekMonday(getMonday(picked));
    setActiveSession(null);
  };

  return (
    <div className="staff-view-container">
      {/* Global Notifications */}
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

      {/* VIEW LEVEL 3: ROSTER VIEW OF A SELECTED SESSION */}
      {activeSession ? (
        <div className="staff-roster-view-container">
          {/* Back button & Session Header Card */}
          <div className="staff-roster-back-bar">
            <button type="button" className="staff-btn staff-btn-secondary" onClick={closeRosterView}>
              <ArrowLeft size={16} /> Quay lại lịch ca học ngày {formatDate(activeSession.sessionDate)}
            </button>
            <button
              type="button"
              className="staff-btn staff-btn-secondary"
              onClick={() => void loadRosterForSession(activeSession)}
              disabled={loadingRoster}
            >
              <RefreshCw size={14} className={loadingRoster ? 'spin-anim' : ''} /> Tải lại danh sách
            </button>
          </div>

          <div className="staff-session-active-card">
            <div className="staff-session-active-head">
              <div>
                <span className="staff-eyebrow">CA HỌC ĐANG CHỌN</span>
                <h2>{activeSession.workshopName}</h2>
                <div className="staff-session-meta-items" style={{ marginTop: '8px' }}>
                  <span>
                    <CalendarDays size={15} /> <strong>{formatDate(activeSession.sessionDate)}</strong>
                  </span>
                  <span>
                    <Clock size={15} />{' '}
                    <strong>
                      {formatTime(activeSession.startTime)} - {formatTime(activeSession.endTime)}
                    </strong>
                  </span>
                  <span>
                    <MapPin size={15} /> {activeSession.location || 'Xưởng Tiệm Hoa Có Gu'}
                  </span>
                  <span>
                    <Users size={15} /> Sĩ số: <strong>{activeSession.bookedSlots}/{activeSession.maxSlots} học viên</strong>
                  </span>
                  <span className={`staff-badge badge-${activeSession.sessionStatus.toLowerCase()}`}>
                    Trạng thái: {activeSession.sessionStatus}
                  </span>
                </div>
              </div>

              {activeSession.sessionStatus !== 'Closed' && activeSession.sessionStatus !== 'Cancelled' && (
                <button
                  type="button"
                  className="staff-btn staff-btn-secondary"
                  onClick={() => void handleCloseSession()}
                  disabled={actionBusy === 'close-session'}
                >
                  <Lock size={15} /> Đóng ca học
                </button>
              )}
            </div>
          </div>

          {/* Roster Table */}
          <div className="staff-section-card" style={{ marginTop: '20px' }}>
            <div className="staff-section-header">
              <div>
                <h3>Danh sách học viên điểm danh</h3>
                <p className="staff-muted">
                  Tổng đăng ký: <strong>{roster.reduce((sum, b) => sum + (b.bookingStatus !== 'cancelled' ? b.ticketCount : 0), 0)} chỗ</strong> · Đã điểm danh:{' '}
                  <strong style={{ color: '#059669' }}>
                    {roster.filter((b) => b.bookingStatus === 'attended').length} học viên
                  </strong>
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
                <h3>Chưa có học viên nào đặt ca này</h3>
                <p>Học viên đăng ký qua web hoặc tại quầy sẽ xuất hiện ngay tại đây.</p>
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
                      <th>Trạng thái vé</th>
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
      ) : (
        /* VIEW LEVEL 1 & 2: WEEKLY CALENDAR STRIP & DAY SESSIONS LIST */
        <div>
          {/* Weekly Calendar Card */}
          <div className="staff-calendar-card">
            <div className="calendar-toolbar">
              <div className="calendar-week-title">
                <h3>
                  Lịch Workshop: {formatDate(weekDays[0].toISOString())} — {formatDate(weekDays[6].toISOString())}
                </h3>
                <span>
                  Tháng {currentWeekMonday.getMonth() + 1}, {currentWeekMonday.getFullYear()}
                </span>
              </div>

              <div className="calendar-nav-controls">
                <button
                  type="button"
                  className="staff-btn staff-btn-secondary"
                  onClick={handleGoToday}
                  title="Về tuần hiện tại"
                >
                  Hôm nay
                </button>

                <button
                  type="button"
                  className="staff-btn staff-btn-secondary"
                  onClick={handlePrevWeek}
                  aria-label="Tuần trước"
                  title="Tuần trước"
                >
                  <ChevronLeft size={16} />
                </button>

                <button
                  type="button"
                  className="staff-btn staff-btn-secondary"
                  onClick={handleNextWeek}
                  aria-label="Tuần sau"
                  title="Tuần sau"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Date Picker Input */}
                <label className="calendar-date-picker-wrap" title="Chọn ngày để mở tuần tương ứng">
                  <Calendar size={14} />
                  <span>Chọn ngày:</span>
                  <input
                    type="date"
                    value={toISODateInput(selectedDate)}
                    onChange={handlePickDate}
                    className="calendar-date-input"
                  />
                </label>

                <button
                  type="button"
                  className="staff-btn staff-btn-secondary"
                  onClick={() => void loadAllSessions()}
                  disabled={loadingSessions}
                  title="Tải lại toàn bộ lịch"
                >
                  <RefreshCw size={14} className={loadingSessions ? 'spin-anim' : ''} />
                </button>
              </div>
            </div>

            {/* 7-Day Weekly Calendar Strip */}
            <div className="calendar-week-grid" role="grid" aria-label="Lịch tuần workshop">
              {weekDays.map((day, idx) => {
                const daySessions = getSessionsOnDate(day);
                const hasEvents = daySessions.length > 0;
                const isSelected = isSameDay(day, selectedDate);
                const today = isToday(day);

                return (
                  <div
                    key={day.toISOString()}
                    className={`calendar-day-cell ${isSelected ? 'is-selected' : ''} ${
                      today ? 'is-today' : ''
                    } ${hasEvents ? 'has-events' : ''}`}
                    onClick={() => setSelectedDate(day)}
                    role="gridcell"
                    tabIndex={0}
                    aria-selected={isSelected}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedDate(day);
                      }
                    }}
                  >
                    {today && <span className="calendar-today-badge">Hôm nay</span>}
                    <span className="day-name">{dayNamesVi[idx]}</span>
                    <span className="day-num">{day.getDate()}</span>
                    <div className="day-event-dot-wrap">
                      {hasEvents && (
                        <span className="event-count-pill">{daySessions.length} ca</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LEVEL 2: SESSIONS LIST ON SELECTED DATE */}
          <div className="staff-day-detail-section">
            <div className="calendar-day-detail-header">
              <h3>
                <CalendarDays size={18} /> Các ca học ngày {formatDateLong(selectedDate)}
              </h3>
              <span className="staff-pill-badge" style={{ fontSize: '13px', padding: '4px 10px' }}>
                {selectedDateSessions.length} ca học
              </span>
            </div>

            {loadingSessions ? (
              <div className="staff-loading-box">
                <RefreshCw size={24} className="spin-anim" />
                <p>Đang tải danh sách ca học…</p>
              </div>
            ) : selectedDateSessions.length === 0 ? (
              <div className="staff-empty-box">
                <CalendarDays size={36} />
                <h3>Không có ca học nào vào ngày này</h3>
                <p>Xưởng không có lịch tổ chức workshop vào ngày {formatDateLong(selectedDate)}.</p>

                {weekHasSessions.length > 0 && (
                  <div className="calendar-hint-banner" style={{ marginTop: '20px' }}>
                    <span>
                      Tuần này có <strong>{weekHasSessions.length} ca học</strong> vào những ngày khác:
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                      {weekHasSessions.map((s) => {
                        const sDate = new Date(s.sessionDate);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            className="staff-btn staff-btn-primary staff-btn-sm"
                            onClick={() => setSelectedDate(sDate)}
                          >
                            {formatDate(s.sessionDate)} ({formatTime(s.startTime)})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="staff-sessions-grid">
                {selectedDateSessions.map((session) => (
                  <article key={session.id} className="staff-session-card">
                    <div className="staff-session-card-header">
                      <div>
                        <span className="staff-eyebrow">{session.workshopCode}</span>
                        <h4 className="staff-session-card-title">{session.workshopName}</h4>
                      </div>
                      <span className={`staff-badge badge-${session.sessionStatus.toLowerCase()}`}>
                        {session.sessionStatus}
                      </span>
                    </div>

                    <div className="staff-session-card-body">
                      <div className="staff-session-info-row">
                        <Clock size={16} />
                        <span>
                          Khung giờ: <strong>{formatTime(session.startTime)} - {formatTime(session.endTime)}</strong>
                        </span>
                      </div>
                      <div className="staff-session-info-row">
                        <MapPin size={16} />
                        <span>Địa điểm: <strong>{session.location || 'Xưởng Tiệm Hoa Có Gu'}</strong></span>
                      </div>
                      <div className="staff-session-info-row">
                        <Users size={16} />
                        <span>
                          Học viên: <strong>{session.bookedSlots} / {session.maxSlots} chỗ đã đặt</strong>
                        </span>
                      </div>
                    </div>

                    <div className="staff-session-card-footer">
                      <button
                        type="button"
                        className="staff-btn staff-btn-primary"
                        style={{ width: '100%', height: '40px' }}
                        onClick={() => openSessionRoster(session)}
                      >
                        <UserCheck size={16} /> Xem danh sách & Điểm danh ({session.bookedSlots}) <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
