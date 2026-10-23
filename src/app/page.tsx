import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, ArrowDownRight, Flower2, HandHeart, Gift, MoveUpRight } from 'lucide-react';
import { GiftFinder, HomeCollection } from '@/components/home-commerce';
import { articles, money } from '@/lib/catalog';
export default function Home() {
  return (
    <>
      <section className="campaign-hero">
        <div className="campaign-copy">
          <p className="eyebrow">
            <span className="live-dot" /> HOA SÁP & QUÀ TẶNG, LÀM BẰNG TAY.
          </p>
          <h1>
            TẶNG HOA.
            <br />
            TẶNG{' '}
            <span>
              GU
              <Flower2 aria-hidden="true" />
            </span>
          </h1>
          <div className="campaign-copy-bottom">
            <p>
              Không phải món quà nào cũng nói thay bạn.
              <br />
              Nhưng món quà <strong>đúng gu</strong> thì có.
            </p>
            <Link href="/cua-tiem" className="button">
              Chọn một món quà <ArrowUpRight size={21} />
            </Link>
            <Link href="/dat-rieng" className="campaign-secondary">
              Hay làm một bó của riêng bạn? <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="campaign-stage">
          <div className="campaign-sticker">
            <span>một chút hoa,</span>
            <strong>VUI CẢ NGÀY.</strong>
            <ArrowDownRight size={30} />
          </div>
          <Link
            className="campaign-product"
            href="/cua-tiem/trang-non"
            aria-label="Khám phá bó hoa Trăng Non"
          >
            <Image
              src="/images/prod-bouquet.webp"
              alt="Bó hoa sáp Trăng Non màu hồng phấn và kem, gói giấy kraft và buộc nơ vải"
              fill
              priority
              sizes="(max-width: 700px) 85vw, 43vw"
            />
            <span className="campaign-product-label">
              <span>
                <small>BÓ HOA SÁP / TRĂNG NON</small>
                <strong>{money(420000)}</strong>
              </span>
              <MoveUpRight size={25} />
            </span>
          </Link>
          <span className="campaign-side-note">ĐẸP THEO CÁCH CỦA BẠN — CÓ GU.</span>
        </div>
      </section>
      <div className="brand-ribbon" aria-hidden="true">
        <span>KHÔNG ĐỢI MỘT DỊP ĐẶC BIỆT</span>
        <Flower2 />
        <span>CHỈ CẦN MỘT NGƯỜI ĐẶC BIỆT</span>
        <Flower2 />
        <span>KỂ CẢ KHI NGƯỜI ĐÓ LÀ BẠN</span>
        <Flower2 />
      </div>
      <section className="shop-shortcuts section" aria-label="Chọn theo kiểu món quà">
        {[
          {
            name: 'Một bó hoa',
            note: 'Thay lời muốn nói',
            image: '/images/prod-bouquet.webp',
            id: 'bo',
            n: '01',
          },
          {
            name: 'Một góc xinh',
            note: 'Cho ngày thường khác đi',
            image: '/images/prod-jar.webp',
            id: 'lo',
            n: '02',
          },
          {
            name: 'Một chút tự tay',
            note: 'Quà tặng & những bộ DIY',
            image: '/images/prod-kit.webp',
            id: 'diy',
            n: '03',
          },
        ].map((c) => (
          <Link
            href={`/cua-tiem?category=${c.id}`}
            className={`shop-shortcut shortcut-${c.id}`}
            key={c.id}
          >
            <span className="shortcut-count">{c.n}</span>
            <div>
              <h2>{c.name}</h2>
              <p>{c.note}</p>
              <span className="shortcut-arrow">
                <ArrowUpRight size={21} />
              </span>
            </div>
            <div className="shortcut-image">
              <Image src={c.image} alt="" fill sizes="(max-width:700px) 30vw, 12vw" />
            </div>
          </Link>
        ))}
      </section>
      <div className="finder-wrap">
        <GiftFinder />
      </div>
      <HomeCollection />
      <section className="custom-campaign">
        <div className="custom-campaign-image">
          <Image
            src="/images/ws-gallery.webp"
            alt="Bảng cảm hứng hoa sáp và chất liệu tại xưởng"
            fill
            sizes="(max-width:700px) 100vw, 42vw"
          />
          <span className="paper-tag">
            GU CỦA BẠN.
            <br />
            <strong>ĐÔI TAY CỦA TIỆM.</strong>
            <Flower2 />
          </span>
        </div>
        <div className="custom-campaign-copy">
          <p className="eyebrow">02 / KHÔNG CẦN GIỐNG AI</p>
          <h2>
            Bạn có một gu.
            <br />
            Tiệm có
            <br />
            <em>đôi tay khéo.</em>
          </h2>
          <p>
            Một bảng màu bạn mê. Một câu chuyện chỉ hai người biết. Kể cho tiệm nghe, mình cùng phác
            một bó hoa không lẫn vào đâu.
          </p>
          <Link className="button button-citrus" href="/dat-rieng">
            Cùng tiệm làm riêng <ArrowUpRight size={20} />
          </Link>
          <span className="custom-small">Xem trước ý tưởng · Chưa gửi yêu cầu đặt hoa</span>
        </div>
      </section>
      <section className="home-workshop section">
        <div className="home-workshop-copy">
          <p className="eyebrow">03 / HẸN NHAU Ở XƯỞNG</p>
          <h2>
            Đổi màn hình.
            <br />
            Lấy một
            <br />
            <span>buổi thật vui.</span>
          </h2>
          <p>
            Chạm vào chất liệu. Nắn một cánh hoa. Tự tay làm một món quà. Không cần khéo sẵn — cứ
            đến với một chút tò mò.
          </p>
          <div className="workshop-facts-inline">
            <span>
              <HandHeart size={19} /> Dành cho người mới
            </span>
            <span>
              <Gift size={19} /> Mang thành phẩm về
            </span>
          </div>
          <Link className="button" href="/workshop">
            Khám phá buổi làm hoa <ArrowUpRight size={19} />
          </Link>
          <small>Lịch lớp chưa mở · Giá và nội dung hiện là tham khảo</small>
        </div>
        <div className="home-workshop-image">
          <Image
            src="/images/workshop-hands.webp"
            alt="Đôi tay đang làm một bông hoa sáp tại bàn xưởng"
            fill
            sizes="(max-width:700px) 100vw, 48vw"
          />
          <div className="workshop-flower">
            <Flower2 aria-hidden="true" strokeWidth={1} />
            <span>
              OFFLINE
              <br />
              IS A GOOD IDEA.
            </span>
          </div>
        </div>
      </section>
      <section className="brand-values">
        <div>
          <span>01</span>
          <h3>Đẹp không chỉ để ngắm.</h3>
          <p>Là món quà được nghĩ đến kỹ, từ chất liệu đến cách trao.</p>
        </div>
        <div>
          <span>02</span>
          <h3>Giữ lại lâu hơn.</h3>
          <p>Hoa sáp không cần tưới nước. Giữ khô, thoáng và tránh nguồn nhiệt.</p>
        </div>
        <div>
          <span>03</span>
          <h3>Thêm một chút bạn.</h3>
          <p>Chọn bảng màu, gói ghém ý tưởng, viết một lời nhắn riêng.</p>
        </div>
      </section>
      <section className="section home-journal">
        <div className="collection-top">
          <div>
            <p className="eyebrow">04 / CHUYỆN Ở TIỆM</p>
            <h2>
              Mấy chuyện nhỏ.
              <br />
              <span>Đọc lúc rảnh nha.</span>
            </h2>
          </div>
          <Link href="/chuyen-cua-hoa" className="text-link">
            Ghé góc đọc <ArrowUpRight size={20} />
          </Link>
        </div>
        <div className="home-journal-grid">
          {articles.map((a, i) => (
            <Link href={`/chuyen-cua-hoa/${a.slug}`} className="home-journal-card" key={a.slug}>
              <div className="home-journal-image">
                <Image src={a.image} alt="" fill sizes="(max-width:700px) 90vw, 30vw" />
                <span>0{i + 1}</span>
              </div>
              <p className="eyebrow">{a.category} / 3 PHÚT ĐỌC</p>
              <h3>
                {a.title}
                <ArrowUpRight size={22} />
              </h3>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
