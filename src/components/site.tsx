import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Flower2 } from 'lucide-react';
import { HeaderActions, FavoriteButton } from './store-provider';
import { money, type Product } from '@/lib/catalog';
import MobileNavigation from './mobile-navigation';
export function FlowerMark({ className = '' }: { className?: string }) {
  return <Flower2 className={className} strokeWidth={1} aria-hidden="true" />;
}
export function Header() {
  return (
    <>
      <a className="skip-link" href="#noi-dung">
        Đến nội dung chính
      </a>
      <div className="announcement">
        <span>Hoa không vội. Lời thương cũng thế.</span>
        <Link href="/workshop">
          Hẹn bạn một buổi ở xưởng <ArrowUpRight size={12} />
        </Link>
      </div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Tiệm Hoa Có Gu — Trang chủ">
          <FlowerMark />
          <span>
            <small>TIỆM HOA</small>
            <strong>có gu.</strong>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Điều hướng chính">
          <Link href="/cua-tiem">Cửa tiệm</Link>
          <Link href="/dat-rieng">Hoa theo ý bạn</Link>
          <Link href="/workshop">
            Workshop <span className="nav-dot" />
          </Link>
          <Link href="/cau-chuyen">Chuyện của tiệm</Link>
        </nav>
        <HeaderActions />
        <MobileNavigation />
      </header>
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <span className="eyebrow">MỘT TIỆM HOA. NHIỀU ĐIỀU MUỐN NÓI.</span>
          <h2>
            Gửi hoa.
            <br />
            <em>Gửi cả tấm lòng.</em>
          </h2>
          <Link href="/cua-tiem" className="text-link light">
            Chọn một món quà <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="footer-links">
          <div>
            <span className="eyebrow">GHÉ TIỆM</span>
            <Link href="/cua-tiem">Cửa tiệm</Link>
            <Link href="/dat-rieng">Hoa theo ý bạn</Link>
            <Link href="/workshop">Workshop tại xưởng</Link>
            <Link href="/cau-chuyen">Câu chuyện của tiệm</Link>
          </div>
          <div>
            <span className="eyebrow">CẦN MỘT CHÚT GIÚP ĐỠ?</span>
            <Link href="/tra-cuu">Tra cứu đơn & đặt chỗ</Link>
            <Link href="/hoi-dap">Hỏi đáp & chăm hoa</Link>
            <Link href="/chuyen-cua-hoa">Chuyện của hoa</Link>
            <Link href="/chinh-sach">Chính sách & riêng tư</Link>
          </div>
        </div>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        có gu<span>✳</span>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} Tiệm Hoa Có Gu · SÁPA Studio</span>
        <span>Được làm chậm, bằng cả sự để tâm.</span>
        <span className="preview-label">BẢN TRẢI NGHIỆM · CHƯA NHẬN ĐƠN THẬT</span>
      </div>
    </footer>
  );
}
export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  return (
    <article className="product-card">
      <div className="product-image">
        <Link href={`/cua-tiem/${product.id}`} aria-label={`Xem ${product.name}`}>
          <Image
            src={product.image}
            alt={product.subtitle}
            fill
            sizes="(max-width: 600px) 47vw, (max-width: 1000px) 45vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
          <span className="product-hover">
            Một chút về {product.name} <ArrowUpRight size={18} />
          </span>
        </Link>
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <FavoriteButton id={product.id} />
        <span className="product-index">0{index + 1}</span>
      </div>
      <div className="product-info">
        <div>
          <Link href={`/cua-tiem/${product.id}`}>
            <h3>{product.name}</h3>
          </Link>
          <p>{product.subtitle}</p>
        </div>
        <span className="product-price">{money(product.price)}</span>
      </div>
      <div className="swatches" role="img" aria-label="Bảng màu tham khảo">
        {product.palette.map((color) => (
          <i key={color} style={{ backgroundColor: color }} />
        ))}
      </div>
    </article>
  );
}
export function SectionHeading({
  number,
  eyebrow,
  title,
  children,
}: {
  number: string;
  eyebrow: string;
  title: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">
          <span className="section-number">{number}</span>
          {eyebrow}
        </p>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function ArrowLink({
  href,
  children,
  className = '',
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`text-link ${className}`}>
      {children}
      <ArrowRight size={19} strokeWidth={1.4} />
    </Link>
  );
}
export function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="page-intro">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
