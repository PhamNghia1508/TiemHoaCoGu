'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const links = [
  ['/cua-tiem', 'Cửa tiệm'],
  ['/dat-rieng', 'Hoa theo ý bạn'],
  ['/workshop', 'Workshop'],
  ['/cau-chuyen', 'Về Có Gu'],
];
export default function SiteNavigation() {
  const pathname = usePathname();
  return (
    <nav className="desktop-nav" aria-label="Điều hướng chính">
      {links.map(([href, label]) => (
        <Link href={href} key={href} aria-current={pathname.startsWith(href) ? 'page' : undefined}>
          {label}
          {href === '/workshop' && <span className="nav-dot" />}
        </Link>
      ))}
    </nav>
  );
}
