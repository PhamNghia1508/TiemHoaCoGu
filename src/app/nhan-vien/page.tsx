import type { Metadata } from 'next';
import ClientOnly from '@/components/client-only';
import StaffWorkspace from '@/components/staff/workspace';
import './staff.css';

export const metadata: Metadata = {
  title: 'Bàn làm việc Nhân viên | Tiệm Hoa Có Gu',
  robots: { index: false, follow: false },
};

export default function StaffPage() {
  return (
    <ClientOnly
      fallback={
        <div className="staff-guard-screen">
          <div className="staff-loading-box">
            <p role="status">Đang mở bàn làm việc nhân viên…</p>
          </div>
        </div>
      }
    >
      <StaffWorkspace />
    </ClientOnly>
  );
}
