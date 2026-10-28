import type { Metadata } from 'next';
import Account from '@/components/account';
import ClientOnly from '@/components/client-only';
import './account.css';

export const metadata: Metadata = { title: 'Tài khoản · Tiệm Hoa Có Gu' };

export default function AccountPage() {
  return (
    <div className="page-shell">
      <ClientOnly
        fallback={
          <div className="account-portal">
            <div className="skeleton-card" />
          </div>
        }
      >
        <Account />
      </ClientOnly>
    </div>
  );
}
