import type { Metadata } from 'next';
import CheckoutDispatcher from '@/components/checkout-dispatcher';

export const metadata: Metadata = {
  title: 'Thanh toán đơn hàng & Workshop — Tiệm Hoa Có Gu',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutDispatcher />;
}
