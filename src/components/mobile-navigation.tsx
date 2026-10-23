'use client';
import { useRef } from 'react';
import Link from 'next/link';
export default function MobileNavigation() {
  const details = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={details} className="mobile-nav">
      <summary aria-label="Mở menu">
        <span />
        <span />
      </summary>
      <nav
        aria-label="Điều hướng điện thoại"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) details.current?.removeAttribute('open');
        }}
      >
        <Link href="/cua-tiem">Cửa tiệm</Link>
        <Link href="/dat-rieng">Hoa theo ý bạn</Link>
        <Link href="/workshop">Workshop</Link>
        <Link href="/cau-chuyen">Chuyện của tiệm</Link>
        <Link href="/tra-cuu">Tra cứu đơn</Link>
      </nav>
    </details>
  );
}
