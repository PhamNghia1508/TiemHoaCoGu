import type { Metadata } from 'next';
import AdminWorkspace from '@/components/admin/workspace';
import ClientOnly from '@/components/client-only';
import './admin.css';

export const metadata: Metadata = {
  title: 'Góc điều hành',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <ClientOnly
      fallback={
        <div className="admin-shell admin-guard">
          <p role="status">Đang mở góc điều hành…</p>
        </div>
      }
    >
      <AdminWorkspace
        connected={Boolean(process.env.API_BASE_URL)}
        writesEnabled={process.env.STOREFRONT_WRITES_ENABLED === 'true'}
      />
    </ClientOnly>
  );
}
