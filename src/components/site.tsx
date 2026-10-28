import Link from 'next/link';
import { ArrowRight, ArrowUpRight, Flower2 } from 'lucide-react';
import { HeaderActions } from './store-provider';
import MobileNavigation from './mobile-navigation';
import SiteNavigation from './site-navigation';
export { default as ProductCard } from './product-card';

export function FlowerMark({ className = '' }: { className?: string }) {
  return <Flower2 className={className} strokeWidth={1.7} aria-hidden="true" />;
}
export function Header() {
  return (
    <>
      <a className="skip-link" href="#noi-dung">
        Đến nội dung chính
      </a>
      <div className="announcement">
        <span>HOA SÁP. QUÀ XINH. MỘT CHÚT KHÁC BIỆT.</span>
        <Link href="/workshop">
          Hẹn nhau ở xưởng <ArrowUpRight size={14} />
        </Link>
      </div>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Tiệm Hoa Có Gu — Trang chủ">
          <FlowerMark />
          <span>
            <small>TIỆM HOA</small>
            <strong>
              có gu<span className="brand-period">.</span>
            </strong>
          </span>
        </Link>
        <SiteNavigation />
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
        <div className="footer-invite">
          <span className="eyebrow">MỘT CHÚT HOA. NHIỀU CHÚT VUI.</span>
          <h2>
            Chọn một món quà.
            <br />
            Làm ai đó <em>vui cả ngày.</em>
          </h2>
          <Link className="button button-citrus" href="/cua-tiem">
            Tìm món quà của bạn <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="footer-links">
          <div>
            <span>GHÉ TIỆM</span>
            <Link href="/cua-tiem">Tất cả sản phẩm</Link>
            <Link href="/dat-rieng">Hoa theo ý bạn</Link>
            <Link href="/workshop">Workshop tại xưởng</Link>
            <Link href="/cau-chuyen">Câu chuyện của tiệm</Link>
          </div>
          <div>
            <span>CẦN MỘT CHÚT GIÚP ĐỠ?</span>
            <Link href="/tra-cuu">Tra cứu đơn & đặt chỗ</Link>
            <Link href="/tai-khoan">Tài khoản của bạn</Link>
            <Link href="/nhan-vien">Bàn làm việc Nhân viên</Link>
            <Link href="/quan-tri">Góc điều hành Admin</Link>
            <Link href="/hoi-dap">Hỏi đáp & chăm hoa</Link>
            <Link href="/chuyen-cua-hoa">Chuyện của hoa</Link>
            <Link href="/chinh-sach">Chính sách & riêng tư</Link>
          </div>
        </div>
      </div>
      <div className="footer-wordmark" aria-hidden="true">
        có gu
        <span>
          <Flower2 strokeWidth={1.2} />
        </span>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} TIỆM HOA CÓ GU / SÁPA STUDIO</span>
        <span className="preview-label">
          {process.env.API_BASE_URL
            ? 'TÍCH HỢP API · CHƯA MỞ BÁN PRODUCTION'
            : 'BẢN TRẢI NGHIỆM · CHƯA NHẬN ĐƠN THẬT'}
        </span>
        <a href="#noi-dung">Về đầu trang ↑</a>
      </div>
    </footer>
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
      <ArrowRight size={19} strokeWidth={1.8} />
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
