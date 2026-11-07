'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CalendarDays, Clock, MapPin, Ticket, Users } from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import type { WorkshopTicket } from '@/lib/api/client';

const TZ = 'Asia/Ho_Chi_Minh';

function partsInTz(iso: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour') === '24' ? '00' : get('hour'),
    minute: get('minute'),
  };
}

function formatCheckInTime(iso?: string) {
  if (!iso) return '—';
  try {
    const p = partsInTz(iso);
    return `${p.hour}:${p.minute} ${p.day}/${p.month}/${p.year}`;
  } catch {
    return iso;
  }
}

function formatSessionRange(startIso?: string, endIso?: string) {
  if (!startIso && !endIso) return '—';
  try {
    if (!startIso || !endIso) {
      const one = startIso || endIso;
      return one ? formatCheckInTime(one) : '—';
    }
    const s = partsInTz(startIso);
    const e = partsInTz(endIso);
    const startTime = `${s.hour}:${s.minute}`;
    const endTime = `${e.hour}:${e.minute}`;
    const sameDay = s.year === e.year && s.month === e.month && s.day === e.day;
    if (sameDay) {
      const weekdayDate = new Intl.DateTimeFormat('vi-VN', {
        timeZone: TZ,
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(new Date(startIso));
      return `${startTime}–${endTime} · ${weekdayDate}`;
    }
    return `${startTime} ${s.day}/${s.month}/${s.year} – ${endTime} ${e.day}/${e.month}/${e.year}`;
  } catch {
    return [startIso, endIso].filter(Boolean).join(' - ');
  }
}

function reasonText(ticket: WorkshopTicket) {
  const status = (ticket.bookingStatus || '').toLowerCase();
  if (status === 'attended') return 'Vé đã được check-in.';
  if (status === 'cancelled') return 'Đặt chỗ đã hủy, vé không còn hiệu lực.';
  if (status === 'expired') return 'Đặt chỗ đã hết hạn.';
  if (status === 'pending' || status === 'held') return 'Chờ tiệm xác nhận thanh toán để phát hành vé QR.';
  if (status === 'confirmed') return 'Vé chưa được phát hành. Vui lòng thử tải lại sau ít phút.';
  return 'Vé chưa sẵn sàng.';
}

export default function WorkshopTicketView({ bookingId }: { bookingId: string }) {
  const [ticket, setTicket] = useState<WorkshopTicket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    storeRequest<WorkshopTicket>(`bookings/${bookingId}/ticket`)
      .then((data) => {
        if (active) setTicket(data);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Không thể tải vé.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (loading) return <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Đang tải vé…</p>;
  if (error)
    return (
      <div role="alert" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', color: '#991b1b', fontSize: '13px' }}>
        <AlertCircle size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1 }} />
        <span>{error}</span>
      </div>
    );
  if (!ticket) return null;

  return (
    <section
      aria-label={`Vé workshop ${ticket.bookingCode}`}
      style={{
        background: '#fffdf8',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        padding: '18px',
        display: 'grid',
        gap: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#243db5' }}>
        <Ticket size={18} aria-hidden="true" />
        <strong style={{ fontSize: '15px' }}>Vé workshop</strong>
        <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#475569' }}>
          {ticket.bookingCode}
        </span>
      </div>

      {ticket.issued && ticket.qrPngBase64 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-start' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR is a runtime base64 data URI from ticket API */}
          <img
            src={`data:image/png;base64,${ticket.qrPngBase64}`}
            alt={`Mã QR vé ${ticket.bookingCode}`}
            width={180}
            height={180}
            style={{ borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}
          />
          <div style={{ display: 'grid', gap: '8px', fontSize: '13.5px', color: '#334155', minWidth: 220, flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#1c2326', fontSize: '15px' }}>{ticket.workshopName}</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <CalendarDays size={15} aria-hidden="true" style={{ marginTop: 2, color: '#243db5' }} />
              <span>{formatSessionRange(ticket.sessionStartUtc, ticket.sessionEndUtc)}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <MapPin size={15} aria-hidden="true" style={{ marginTop: 2, color: '#243db5' }} />
              <span>{ticket.location || 'Xưởng Tiệm Hoa Có Gu'}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Users size={15} aria-hidden="true" style={{ marginTop: 2, color: '#243db5' }} />
              <span>{ticket.customerName} · {ticket.ticketCount} vé</span>
            </div>
            {ticket.checkedInAt && (
              <p style={{ margin: '4px 0 0', color: '#047857', fontWeight: 600 }}>
                Đã check-in lúc {formatCheckInTime(ticket.checkedInAt)}
              </p>
            )}
            <p style={{ margin: '4px 0 0', color: '#475569' }}>Đưa mã này cho tiệm khi check-in.</p>
          </div>
        </div>
      ) : (
        <div
          role="status"
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 14px',
            color: '#334155',
            fontSize: '13.5px',
          }}
        >
          <Clock size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2, color: '#64748b' }} />
          <div>
            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#1c2326' }}>{ticket.workshopName}</p>
            <p style={{ margin: 0 }}>{reasonText(ticket)}</p>
          </div>
        </div>
      )}
    </section>
  );
}
