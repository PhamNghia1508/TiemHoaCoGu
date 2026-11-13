'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  ScanLine,
  Ticket,
  UserCheck,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import type { TicketScan } from '@/lib/api/client';

type ScanStatus = 'idle' | 'loading' | 'ready' | 'checked-in' | 'error';

const TICKET_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

function extractToken(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    return url.searchParams.get('ve')?.trim() || trimmed;
  } catch {
    const match = trimmed.match(/[?&]ve=([^&]+)/);
    if (match) return decodeURIComponent(match[1]).trim();
    return trimmed;
  }
}

function bookingStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'Đã xác nhận';
    case 'attended':
      return 'Đã check-in';
    case 'pending':
      return 'Chờ thanh toán';
    case 'cancelled':
      return 'Đã hủy';
    case 'expired':
      return 'Hết hạn';
    case 'no_show':
      return 'Vắng mặt';
    default:
      return status;
  }
}

function formatUtc(iso?: string) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Ho_Chi_Minh',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function StaffTicketCheckIn({ initialToken = '' }: { initialToken?: string }) {
  const [input, setInput] = useState(initialToken);
  const [token, setToken] = useState('');
  const [scan, setScan] = useState<TicketScan | null>(null);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [message, setMessage] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const handledTokenRef = useRef('');

  const stopCamera = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }, []);

  const lookup = useCallback(
    async (raw: string) => {
      const nextToken = extractToken(raw);
      if (!nextToken) {
        setMessage('Nhập hoặc quét mã vé.');
        setStatus('error');
        return;
      }
      if (!TICKET_TOKEN_RE.test(nextToken)) {
        setMessage('Mã vé không đúng định dạng.');
        setStatus('error');
        return;
      }
      stopCamera();
      setToken(nextToken);
      setStatus('loading');
      setMessage('');
      setScan(null);
      try {
        const data = await storeRequest<TicketScan>(`bookings/tickets/${nextToken}`);
        setScan(data);
        setStatus('ready');
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Vé không hợp lệ.');
      }
    },
    [stopCamera],
  );

  useEffect(() => {
    if (initialToken && handledTokenRef.current !== initialToken) {
      handledTokenRef.current = initialToken;
      setInput(initialToken);
      void lookup(initialToken);
    }
  }, [initialToken, lookup]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await lookup(input);
  }

  async function handleCheckIn() {
    if (!token || !scan?.canCheckIn || status === 'loading') return;
    setStatus('loading');
    setMessage('');
    try {
      const result = await storeRequest<TicketScan>(
        `bookings/tickets/${token}/check-in`,
        {},
        'POST',
      );
      setScan(result);
      setStatus('checked-in');
      setMessage(`Đã check-in ${result.customerName} · ${result.ticketCount} vé`);
    } catch (err) {
      setStatus('ready');
      setMessage(err instanceof Error ? err.message : 'Không thể check-in.');
    }
  }

  function reset() {
    stopCamera();
    setInput('');
    setToken('');
    setScan(null);
    setStatus('idle');
    setMessage('');
    setCameraError('');
    inputRef.current?.focus();
  }

  async function startCamera() {
    setCameraError('');
    const Detector = (
      window as unknown as {
        BarcodeDetector?: new (o: { formats: string[] }) => {
          detect: (s: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>;
        };
      }
    ).BarcodeDetector;
    if (!Detector) return;
    try {
      setCameraOn(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const detector = new Detector({ formats: ['qr_code'] });
      timerRef.current = setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const value = codes[0]?.rawValue;
          if (value) {
            setInput(value);
            await lookup(value);
          }
        } catch {
          // ignore frame errors
        }
      }, 300);
    } catch (err) {
      stopCamera();
      setCameraError(err instanceof Error ? err.message : 'Không thể mở camera.');
    }
  }

  const supportsBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  return (
    <div className="staff-checkin-view">
      <div className="staff-section-card">
        <div className="staff-section-header">
          <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <ScanLine size={18} aria-hidden="true" /> Quét vé workshop
            </h3>
            <p className="staff-muted" style={{ margin: '6px 0 0' }}>
              Quét mã QR, dán liên kết vé, hoặc nhập mã vé. Máy quét USB có thể nhập trực tiếp và
              nhấn Enter.
            </p>
          </div>
          {(status === 'checked-in' || status === 'error') && token && (
            <button type="button" className="staff-btn staff-btn-secondary" onClick={reset}>
              <RefreshCw size={15} aria-hidden="true" /> Quét vé tiếp
            </button>
          )}
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="staff-checkin-form">
          <label className="staff-field" htmlFor="ticket-token-input" style={{ flex: 1 }}>
            <span>Mã vé hoặc liên kết</span>
            <input
              id="ticket-token-input"
              ref={inputRef}
              className="staff-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Dán liên kết /nhan-vien?ve=... hoặc mã vé"
              autoComplete="off"
              inputMode="text"
              aria-label="Mã vé hoặc liên kết check-in"
            />
          </label>
          <button
            type="submit"
            className="staff-btn staff-btn-primary"
            disabled={status === 'loading'}
          >
            {status === 'loading' ? (
              <Loader2 size={16} className="spin-anim" aria-hidden="true" />
            ) : (
              <QrCode size={16} aria-hidden="true" />
            )}
            Tra cứu
          </button>
        </form>

        <div className="staff-checkin-camera-actions">
          {supportsBarcodeDetector ? (
            <button
              type="button"
              className="staff-btn staff-btn-secondary"
              onClick={() => void startCamera()}
              disabled={cameraOn}
            >
              <Camera size={16} aria-hidden="true" /> {cameraOn ? 'Camera đang mở' : 'Mở camera'}
            </button>
          ) : (
            <p className="staff-muted" style={{ margin: 0, fontSize: '13px' }}>
              Trình duyệt chưa hỗ trợ quét trong trang; dùng camera điện thoại quét QR (sẽ mở trang
              này) hoặc dán mã.
            </p>
          )}
          {cameraOn && (
            <button type="button" className="staff-btn staff-btn-secondary" onClick={stopCamera}>
              Tắt camera
            </button>
          )}
        </div>

        {cameraError && (
          <div className="staff-alert error" role="alert" style={{ marginTop: '12px' }}>
            <AlertCircle size={16} aria-hidden="true" />
            <span>{cameraError}</span>
          </div>
        )}

        <div className="staff-checkin-video-wrap" hidden={!cameraOn}>
          <video
            ref={videoRef}
            className="staff-checkin-video"
            muted
            playsInline
            aria-label="Camera quét mã QR"
          />
        </div>
      </div>

      {message && status === 'error' && (
        <div className="staff-alert error" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{message}</span>
        </div>
      )}

      {scan && (
        <div className="staff-section-card staff-checkin-result" aria-live="polite">
          {status === 'checked-in' ? (
            <div className="staff-checkin-success">
              <CheckCircle2 size={22} aria-hidden="true" />
              <div>
                <strong>
                  {message || `Đã check-in ${scan.customerName} · ${scan.ticketCount} vé`}
                </strong>
                <p className="staff-muted" style={{ margin: '4px 0 0' }}>
                  {scan.workshopName} · {formatUtc(scan.sessionStartUtc)}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="staff-checkin-guest-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Ticket
                    size={18}
                    aria-hidden="true"
                    style={{ color: 'var(--accent, #243db5)' }}
                  />
                  <div>
                    <strong style={{ fontSize: '17px' }}>{scan.customerName}</strong>
                    <div className="staff-muted" style={{ fontSize: '13px' }}>
                      {scan.bookingCode} · {scan.ticketCount} vé
                    </div>
                  </div>
                </div>
                <span
                  className={`staff-badge ${scan.canCheckIn ? 'badge-confirmed' : scan.checkedInAt ? 'badge-completed' : 'badge-amber'}`}
                >
                  {bookingStatusLabel(scan.bookingStatus)}
                </span>
              </div>

              <div className="staff-checkin-details">
                <div>
                  <strong>Workshop:</strong> {scan.workshopName}
                </div>
                <div>
                  <strong>Thời gian:</strong> {formatUtc(scan.sessionStartUtc)} -{' '}
                  {formatUtc(scan.sessionEndUtc)}
                </div>
                <div>
                  <strong>Địa điểm:</strong> {scan.location || 'Xưởng Tiệm Hoa Có Gu'}
                </div>
                <div>
                  <strong>Thanh toán đủ:</strong> {scan.fullyPaid ? 'Có' : 'Chưa'}
                </div>
                {scan.checkedInAt && (
                  <div>
                    <strong>Đã check-in:</strong> {formatUtc(scan.checkedInAt)}
                  </div>
                )}
                {scan.reason && (
                  <div>
                    <strong>Ghi chú:</strong> {scan.reason}
                  </div>
                )}
              </div>

              {message && status === 'ready' && (
                <div className="staff-alert error" role="alert" style={{ marginTop: '12px' }}>
                  <AlertCircle size={16} aria-hidden="true" />
                  <span>{message}</span>
                </div>
              )}

              <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="staff-btn staff-btn-primary"
                  onClick={() => void handleCheckIn()}
                  disabled={!scan.canCheckIn || status === 'loading'}
                >
                  {status === 'loading' ? (
                    <Loader2 size={16} className="spin-anim" aria-hidden="true" />
                  ) : (
                    <UserCheck size={16} aria-hidden="true" />
                  )}
                  Check-in
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
