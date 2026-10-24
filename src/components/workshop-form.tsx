'use client';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { useStore } from './store-provider';
import { storeRequest } from '@/lib/browser-api';
import type { Booking, Session, WorkshopList } from '@/lib/api/client';
import { isOpenFutureSession, payloadFingerprint } from '@/lib/transaction';

type Preview = { course: string; date: string; guests: string };
export default function WorkshopForm() {
  const { mode } = useStore();
  const [workshops, setWorkshops] = useState<WorkshopList[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [workshopId, setWorkshopId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [review, setReview] = useState<Booking | Preview | null>(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const attempt = useRef<{ fingerprint: string; key: string } | null>(null);
  useEffect(() => {
    if (mode !== 'connected') return;
    let active = true;
    storeRequest<WorkshopList[]>('workshops')
      .then((x) => {
        if (active) {
          setWorkshops(x);
          setWorkshopId((current) => current || x[0]?.id || '');
        }
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Không thể tải workshop.');
      });
    return () => {
      active = false;
    };
  }, [mode]);
  useEffect(() => {
    if (!workshopId || mode !== 'connected') return;
    let active = true;
    storeRequest<Session[]>(`workshops/${workshopId}/sessions`)
      .then((x) => {
        if (active) setSessions(x);
      })
      .catch((e) => {
        if (active) setError(e instanceof Error ? e.message : 'Không thể tải ca học.');
      });
    return () => {
      active = false;
    };
  }, [workshopId, mode]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const d = new FormData(e.currentTarget);
    if (mode !== 'connected') {
      setReview({
        course: String(d.get('course')),
        date: String(d.get('date')),
        guests: String(d.get('guests')),
      });
      return;
    }
    const session = sessions.find((s) => s.id === sessionId);
    const count = Number(d.get('guests'));
    if (
      !session ||
      !isOpenFutureSession(session) ||
      count < 1 ||
      count > Math.min(6, session.capacity - session.bookedSlots)
    ) {
      setError('Ca đã chọn không còn mở hoặc không đủ chỗ.');
      return;
    }
    const body = {
      ticketCount: count,
      customerName: String(d.get('name')),
      customerPhone: String(d.get('phone')),
      customerEmail: String(d.get('email') || '') || undefined,
    };
    const fingerprint = payloadFingerprint({ sessionId, ...body });
    if (!attempt.current || attempt.current.fingerprint !== fingerprint)
      attempt.current = { fingerprint, key: crypto.randomUUID() };
    setPending(true);
    setError('');
    try {
      const booking = await storeRequest<Booking>(
        `bookings/sessions/${sessionId}`,
        { ...body, idempotencyKey: attempt.current.key },
        'POST',
      );
      setReview(booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể giữ chỗ.');
    } finally {
      setPending(false);
    }
  }
  const openSessions = sessions.filter((s) => isOpenFutureSession(s));
  return (
    <form
      id="hen-o-xuong"
      data-ready="true"
      onSubmit={submit}
      onChange={() => {
        setReview(null);
        if (mode === 'connected') {
          setError('');
          attempt.current = null;
        }
      }}
    >
      <h2 className="form-section-title">Phác một buổi hẹn ở xưởng.</h2>
      <fieldset
        disabled={pending || (mode === 'connected' && Boolean(review))}
        style={{ border: 0, padding: 0, minWidth: 0 }}
      >
        <div className="form-grid">
          {mode === 'connected' ? (
            <>
              <label className="field full">
                Trải nghiệm bạn muốn thử *
                <select
                  value={workshopId}
                  onChange={(e) => {
                    setWorkshopId(e.target.value);
                    setSessionId('');
                    setSessions([]);
                    setReview(null);
                    attempt.current = null;
                  }}
                  required
                >
                  <option value="">Chọn workshop</option>
                  {workshops.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field full">
                Ca thực tế *
                <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} required>
                  <option value="">Chọn ca còn chỗ</option>
                  {openSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sessionDate} · {s.startTime}–{s.endTime} · còn {s.capacity - s.bookedSlots}{' '}
                      chỗ
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : (
            <label className="field full">
              Trải nghiệm bạn muốn thử *
              <select name="course" required>
                <option>Hoa Sáp Cơ Bản</option>
                <option>Bó Quà Tặng</option>
              </select>
            </label>
          )}
          <label className="field">
            {mode === 'connected' ? 'Số người *' : 'Ngày bạn mong muốn *'}
            {mode === 'connected' ? (
              <select name="guests" required>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} người
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="date"
                name="date"
                min={new Date().toLocaleDateString('en-CA')}
                required
              />
            )}
          </label>
          {mode !== 'connected' && (
            <label className="field">
              Bạn đi cùng mấy người? *
              <select name="guests" required>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} người
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="field">
            Tên của bạn *<input name="name" autoComplete="name" required maxLength={100} />
          </label>
          <label className="field">
            Số điện thoại *
            <input
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              pattern="[+0-9 ()\-]{9,20}"
              maxLength={20}
            />
          </label>
        </div>
      </fieldset>
      <p className="form-notice">
        {mode === 'connected'
          ? 'Giữ chỗ chỉ là hold tạm thời và có thời hạn; chưa phải booking xác nhận, chưa có thanh toán.'
          : 'Lịch lớp thật chưa được mở. Ngày bạn chọn chỉ là mong muốn, không phải ca còn chỗ.'}
      </p>
      <button
        className="button"
        type="submit"
        disabled={pending || (mode === 'connected' && (!workshops.length || Boolean(review)))}
      >
        {pending
          ? 'Đang giữ chỗ…'
          : mode === 'connected'
            ? 'Giữ chỗ tạm thời'
            : 'Xem trước buổi hẹn'}{' '}
        <ArrowUpRight size={18} />
      </button>
      {mode === 'connected' && (
        <p className="fine-print">
          Cần đăng nhập để xem lịch sử. <Link href="/tai-khoan">Đăng nhập</Link>
        </p>
      )}
      {error && (
        <div className="form-status" role="alert">
          {error}
        </div>
      )}
      {review && (
        <div className="form-status" role="status">
          <span className="eyebrow">
            {mode === 'connected' ? 'ĐÃ GIỮ CHỖ TẠM THỜI' : 'BUỔI HẸN DỰ KIẾN — CHƯA ĐẶT CHỖ'}
          </span>
          <p>
            {mode === 'connected'
              ? `Mã giữ chỗ: ${(review as Booking).bookingCode || (review as Booking).id}. Hạn giữ: ${(review as Booking).holdExpiresAt || 'do hệ thống trả về'}. Chưa thanh toán và chưa là booking xác nhận.`
              : `${(review as Preview).course} · ${(review as Preview).date} · ${(review as Preview).guests} người`}
          </p>
        </div>
      )}
    </form>
  );
}
