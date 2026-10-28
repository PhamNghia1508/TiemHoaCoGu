'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Sparkles,
  BookOpen,
  Scissors,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { storeRequest } from '@/lib/browser-api';
import ClientOnly from '@/components/client-only';
import './workshop-detail.css';

type WorkshopDetail = {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  category?: string;
  basePrice: number;
  duration: number;
  maxCapacity: number;
  description?: string;
  leadContent?: string;
  goalsJson?: string;
  includesJson?: string;
  forWho?: string;
  isFeatured: boolean;
  isActive: boolean;
  instructorId?: string | null;
};

type SessionDetail = {
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

function parseJsonArray(jsonStr?: string): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return iso;
  }
}

function formatDuration(minutes?: number) {
  if (!minutes) return 'Đang cập nhật';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} phút`;
  if (m === 0) return `${h} giờ`;
  return `${h} giờ ${m} phút`;
}

function WorkshopDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workshopId = typeof params?.id === 'string' ? params.id : '';
  const sessionId = searchParams.get('sessionId') || '';

  const [workshop, setWorkshop] = useState<WorkshopDetail | null>(null);
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!workshopId) return;

    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      storeRequest<WorkshopDetail>(`workshops/${workshopId}`).catch((err) => {
        throw new Error(`Không thể tải thông tin lớp học: ${err.message}`);
      }),
      storeRequest<SessionDetail[]>(`workshops/${workshopId}/sessions`).catch(() => []),
    ])
      .then(([ws, sessions]) => {
        if (!active) return;
        setWorkshop(ws);

        // Match session by sessionId if passed, or take first session
        if (sessionId) {
          const matched = sessions.find((s) => s.id === sessionId);
          if (matched) setSession(matched);
          else if (sessions.length > 0) setSession(sessions[0]);
        } else if (sessions.length > 0) {
          setSession(sessions[0]);
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Lỗi kết nối.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [workshopId, sessionId]);

  if (loading) {
    return (
      <div className="ws-detail-container" style={{ maxWidth: '820px' }}>
        <div style={{ height: '300px', background: '#f2f3ed', borderRadius: '16px' }} />
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="ws-detail-container" style={{ maxWidth: '820px' }}>
        <div className="ws-detail-back-bar">
          <Link href="/tai-khoan" className="ws-back-link">
            <ArrowLeft size={16} /> Quay lại Lịch của tôi
          </Link>
        </div>
        <div className="ws-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <AlertCircle size={32} color="#be123c" style={{ marginBottom: '12px' }} />
          <h2>Không tìm thấy thông tin workshop</h2>
          <p style={{ color: '#60675f', margin: '8px 0 20px' }}>
            {error || 'Lớp học không tồn tại hoặc đã ngừng hoạt động.'}
          </p>
          <Link href="/tai-khoan" className="ws-back-link">
            Về trang cá nhân
          </Link>
        </div>
      </div>
    );
  }

  const goals = parseJsonArray(workshop.goalsJson);
  const includes = parseJsonArray(workshop.includesJson);

  return (
    <div className="ws-detail-container" style={{ maxWidth: '820px' }}>
      {/* Top Navigation */}
      <div className="ws-detail-back-bar">
        <Link href="/tai-khoan" className="ws-back-link">
          <ArrowLeft size={16} /> Quay lại Lịch của tôi
        </Link>
        <span style={{ fontSize: '13px', color: '#60675f' }}>
          Chi tiết buổi học
        </span>
      </div>

      {/* Hero Banner */}
      <div className="ws-detail-hero">
        <div className="ws-eyebrow">THÔNG TIN WORKSHOP / SÁPA STUDIO</div>
        <h1>{workshop.name}</h1>

        <div className="ws-hero-badges">
          {workshop.category && (
            <span className="ws-tag accent">
              <Tag size={13} /> {workshop.category}
            </span>
          )}
          <span className="ws-tag">
            <Clock size={13} /> Thời lượng: {formatDuration(workshop.duration)}
          </span>
        </div>
      </div>

      {/* Thông tin ca học cụ thể */}
      {session && (
        <div className="ws-card">
          <h2>
            <CalendarDays size={20} /> Ca học của bạn
          </h2>
          <div className="ws-session-box" style={{ marginBottom: 0 }}>
            <div className="ws-info-list">
              <div className="ws-info-row">
                <CalendarDays size={18} />
                <div>
                  <strong>Ngày diễn ra:</strong>
                  <div>{formatDate(session.sessionDate)}</div>
                </div>
              </div>

              <div className="ws-info-row">
                <Clock size={18} />
                <div>
                  <strong>Khung giờ:</strong>
                  <div>
                    {session.startTime.slice(0, 5)} - {session.endTime.slice(0, 5)}
                  </div>
                </div>
              </div>

              <div className="ws-info-row">
                <MapPin size={18} />
                <div>
                  <strong>Địa điểm tổ chức:</strong>
                  <div>{session.location}</div>
                </div>
              </div>

              <div className="ws-info-row">
                <Users size={18} />
                <div>
                  <strong>Số lượng thành viên ca học:</strong>
                  <div>
                    {session.bookedSlots} / {session.capacity} chỗ đã đăng ký
                    {session.capacity - session.bookedSlots > 0 ? (
                      <span style={{ color: '#047857', marginLeft: '8px' }}>
                        (Còn {session.capacity - session.bookedSlots} chỗ trống)
                      </span>
                    ) : (
                      <span style={{ color: '#be123c', marginLeft: '8px' }}>(Đã kín chỗ)</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Giới thiệu buổi học (chỉ hiển thị nếu DB có, không bịa) */}
      <div className="ws-card">
        <h2>
          <BookOpen size={20} /> Giới thiệu buổi học
        </h2>
        {workshop.leadContent || workshop.description ? (
          <p style={{ lineHeight: 1.7, color: '#1c2326', margin: 0 }}>
            {workshop.leadContent || workshop.description}
          </p>
        ) : (
          <p style={{ color: '#60675f', fontStyle: 'italic', margin: 0 }}>
            Chưa có nội dung giới thiệu.
          </p>
        )}
      </div>

      {/* Bạn sẽ học gì (chỉ hiển thị nếu DB có, không bịa) */}
      <div className="ws-card">
        <h2>
          <Sparkles size={20} /> Bạn sẽ học được gì
        </h2>
        {goals.length > 0 ? (
          <ul className="ws-list-bullets">
            {goals.map((goal, idx) => (
              <li key={idx}>{goal}</li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#60675f', fontStyle: 'italic', margin: 0 }}>
            Chưa có thông tin mục tiêu bài học.
          </p>
        )}
      </div>

      {/* Dụng cụ & Vật tư bao gồm (chỉ hiển thị nếu DB có, không bịa) */}
      <div className="ws-card">
        <h2>
          <Scissors size={20} /> Vật liệu & Dụng cụ bao gồm
        </h2>
        {includes.length > 0 ? (
          <ul className="ws-chip-list">
            {includes.map((inc, idx) => (
              <li key={idx} className="ws-chip">
                {inc}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#60675f', fontStyle: 'italic', margin: 0 }}>
            Chưa cập nhật danh sách dụng cụ & vật tư.
          </p>
        )}
      </div>
    </div>
  );
}

export default function WorkshopDetailPage() {
  return (
    <div className="page-shell">
      <ClientOnly
        fallback={
          <div className="ws-detail-container" style={{ maxWidth: '820px' }}>
            <div style={{ height: '300px', background: '#f2f3ed', borderRadius: '16px' }} />
          </div>
        }
      >
        <WorkshopDetailContent />
      </ClientOnly>
    </div>
  );
}
