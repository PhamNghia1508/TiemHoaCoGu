import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUpRight,
  Asterisk,
  Flower2,
  HandHeart,
  PenLine,
  PackageCheck,
} from 'lucide-react';
import { products, articles } from '@/lib/catalog';
import { ProductCard, SectionHeading, ArrowLink } from '@/components/site';
export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-line" /> HOA SÁP THỦ CÔNG & NHỮNG ĐIỀU DỊU DÀNG
          </p>
          <h1>
            Có những điều,
            <br />
            <em>để hoa nói.</em>
            <span className="hero-asterisk">
              <Asterisk strokeWidth={1} />
            </span>
          </h1>
          <p className="hero-description">
            Không chỉ là một bó hoa.
            <br />
            Là lời thương, là một cái ôm, là chút bình yên
            <br className="desktop-only" /> bạn muốn gửi đến một người.
          </p>
          <div className="hero-cta">
            <Link href="/cua-tiem" className="button">
              Tìm một bó hoa có gu <ArrowUpRight size={19} strokeWidth={1.5} />
            </Link>
            <Link href="/dat-rieng" className="underlined">
              Hay để tiệm làm riêng?
            </Link>
          </div>
          <div className="hero-bottom">
            <span>
              GÓI GHÉM BẰNG TAY.
              <br />
              GỬI ĐI BẰNG CẢ TẤM LÒNG.
            </span>
            <a href="#bo-suu-tap" aria-label="Khám phá bộ sưu tập" className="scroll-cue">
              <ArrowDown size={20} strokeWidth={1} />
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-photo">
            <Image
              src="/images/hero-wax.webp"
              alt="Bó hoa sáp kem hồng gói kraft, nằm trên bàn vải linen trong ánh nắng dịu"
              fill
              priority
              sizes="(max-width: 800px) 100vw, 54vw"
              style={{ objectFit: 'cover', objectPosition: '63% center' }}
            />
            <div className="photo-note">
              a little flower,
              <br />
              <em>a lot of feeling.</em>
            </div>
            <div className="hero-stamp">
              <Flower2 size={30} strokeWidth={1} />
              <span>
                HOA SÁP
                <br />
                THỦ CÔNG
              </span>
              <small>made with care</small>
            </div>
          </div>
          <div className="hero-caption">
            <span>01 / MỘT CHÚT DỊU DÀNG</span>
            <span>
              Bộ sưu tập Trăng Non <ArrowUpRight size={14} />
            </span>
          </div>
        </div>
      </section>
      <div className="brand-ribbon" aria-hidden="true">
        <span>Mỗi bông hoa, một lời chưa nói</span>
        <Asterisk />
        <span>Không vội nở. Không vội phai.</span>
        <Asterisk />
        <span>Một món quà, nhiều thương mến</span>
        <Asterisk />
      </div>
      <section className="section collection-section" id="bo-suu-tap">
        <SectionHeading
          number="01"
          eyebrow="TỪ TIỆM, GỬI BẠN"
          title={
            <>
              Một chút hoa.
              <br />
              <em>Nhiều chút thương.</em>
            </>
          }
        >
          <div className="heading-aside">
            <p>
              Chọn theo cảm xúc, không theo khuôn mẫu.
              <br />
              Mỗi món quà đều có một người đang chờ.
            </p>
            <ArrowLink href="/cua-tiem">Dạo một vòng cửa tiệm</ArrowLink>
          </div>
        </SectionHeading>
        <div className="product-grid home-products">
          {products.slice(0, 3).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
        <div className="collection-footnote">
          <span>Đẹp theo cách của bạn. Được làm theo cách của tiệm.</span>
          <span>HOA SÁP · QUÀ TẶNG · DIY</span>
        </div>
      </section>
      <section className="custom-strip">
        <Flower2 strokeWidth={1} size={51} />
        <div>
          <span className="eyebrow">KHÔNG THẤY BÓ HOA “ĐÚNG NGƯỜI”?</span>
          <h2>
            Gu của bạn, <em>đôi tay của tiệm.</em>
          </h2>
        </div>
        <ArrowLink href="/dat-rieng">Cùng tạo một bó hoa riêng</ArrowLink>
      </section>
      <section className="workshop-feature">
        <div className="workshop-image">
          <Image
            src="/images/workshop-hands.webp"
            alt="Đôi tay người thợ đang tỉ mỉ nắn từng cánh hoa sáp tại bàn xưởng"
            fill
            sizes="(max-width: 800px) 100vw, 55vw"
            style={{ objectFit: 'cover' }}
          />
          <span className="image-label">MỘT KHOẢNG NGHỈ CHO BẠN</span>
        </div>
        <div className="workshop-copy">
          <p className="eyebrow">
            <span className="section-number">02</span> HẸN NHAU Ở XƯỞNG
          </p>
          <h2>
            Bỏ điện thoại xuống.
            <br />
            <em>
              Chạm vào
              <br />
              một chút bình yên.
            </em>
          </h2>
          <p>
            Một buổi làm hoa, một tách trà, vài câu chuyện nhỏ. Không cần khéo tay — chỉ cần bạn
            dành cho mình một khoảng thời gian.
          </p>
          <div className="workshop-meta">
            <span>2,5 giờ thong thả</span>
            <i />
            <span>Cho cả người mới bắt đầu</span>
          </div>
          <Link href="/workshop" className="button light-button">
            Khám phá workshop <ArrowUpRight size={19} />
          </Link>
          <span className="handwritten">hẹn bạn, một ngày thật chậm.</span>
        </div>
      </section>
      <section className="section story-section">
        <div className="story-number">
          <span className="eyebrow">03 / CHUYỆN CỦA TIỆM</span>
          <Flower2 size={80} strokeWidth={0.6} />
        </div>
        <div className="story-text">
          <h2>
            Giữa những điều chóng qua,
            <br />
            tiệm chọn làm ra
            <br />
            <em>một điều ở lại.</em>
          </h2>
          <div className="story-detail">
            <p>
              Một cánh hoa được nắn lại nhiều lần. Một sợi nơ được buộc cho ngay ngắn. Tiệm tin
              rằng, sự để tâm luôn có hình dáng — và đôi khi, hình dáng ấy là một bông hoa.
            </p>
            <ArrowLink href="/cau-chuyen">Đọc câu chuyện của tiệm</ArrowLink>
          </div>
        </div>
      </section>
      <section className="care-values">
        <div>
          <HandHeart />
          <h3>Làm bằng tay, có tâm</h3>
          <p>Từng cánh hoa đều được chăm chút.</p>
        </div>
        <div>
          <PenLine />
          <h3>Một lời nhắn của riêng bạn</h3>
          <p>Dành chỗ cho những điều muốn nói.</p>
        </div>
        <div>
          <PackageCheck />
          <h3>Gói ghém thật cẩn thận</h3>
          <p>Để món quà đến nơi vẫn vẹn nguyên.</p>
        </div>
      </section>
      <section className="section journal-section">
        <SectionHeading
          number="04"
          eyebrow="CHUYỆN NHỎ ĐỌC CHẬM"
          title={
            <>
              Một góc <em>của hoa.</em>
            </>
          }
        >
          <ArrowLink href="/chuyen-cua-hoa">Ghé góc đọc của tiệm</ArrowLink>
        </SectionHeading>
        <div className="journal-grid">
          {articles.map((a, i) => (
            <Link href={`/chuyen-cua-hoa/${a.slug}`} className="journal-card" key={a.slug}>
              <div className="journal-image">
                <Image
                  src={a.image}
                  alt={a.title}
                  fill
                  sizes="(max-width: 650px) 90vw, 30vw"
                  style={{ objectFit: 'cover' }}
                />
                <span>0{i + 1}</span>
              </div>
              <span className="eyebrow">
                {a.category} <span>· 3 PHÚT ĐỌC</span>
              </span>
              <h3>
                {a.title}
                <ArrowUpRight size={20} />
              </h3>
            </Link>
          ))}
        </div>
      </section>
      <section className="closing-note">
        <Asterisk size={38} strokeWidth={1} />
        <p>
          Không cần một dịp đặc biệt
          <br />
          để dành cho ai đó <em>một điều dịu dàng.</em>
        </p>
        <ArrowLink href="/cua-tiem">Kể cả khi người đó là bạn</ArrowLink>
      </section>
    </>
  );
}
