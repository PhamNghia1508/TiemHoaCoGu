import type { Metadata } from 'next';
import Image from 'next/image';
import CustomForm from '@/components/custom-form';
import './redesign.css';

export const metadata: Metadata = { title: 'Hoa theo ý bạn — Bạn chọn gu' };

export default function CustomPage() {
  const connected = Boolean(process.env.API_BASE_URL);
  return (
    <div className="x-site custom-design">
      <section className="x-hero" aria-labelledby="custom-title">
        <div className="x-wrap x-hero__grid">
          <div>
            <p className="x-eyebrow">HOA THEO Ý BẠN / CUSTOM ORDER</p>
            <h1 className="x-h1" id="custom-title">
              Bạn chọn <span className="x-serif">gu.</span>
              <br />
              Tiệm làm <span className="x-serif">phần còn lại.</span>
            </h1>
            <p className="custom-lead">
              Kể tiệm nghe về người nhận, màu sắc và cảm giác bạn muốn gửi.{' '}
              {connected
                ? 'Tiệm sẽ xem ý tưởng và gửi báo giá riêng cho bạn.'
                : 'Cùng phác một ý tưởng dành riêng cho người ấy.'}
            </p>
            <div className="custom-cta">
              <a className="x-btn" href="#custom-form">
                Bắt đầu kể ↓
              </a>
              <a className="x-textlink" href="#quy-trinh">
                Xem quy trình
              </a>
            </div>
          </div>
          <div className="x-stage">
            <div className="x-glow" aria-hidden="true" />
            <Image
              className="x-bouquet"
              src="/images/custom-design/bouquet.png"
              alt="Bó hoa minh họa tông pastel"
              width={600}
              height={667}
              priority
            />
            <div className="x-orbit" aria-hidden="true">
              <span className="x-chip">Dịu dàng</span>
              <span className="x-chip">Rực rỡ</span>
              <span className="x-chip">Mộc mạc</span>
            </div>
          </div>
        </div>
      </section>
      <section className="x-sec" aria-labelledby="custom-intro">
        <div className="x-wrap x-gift">
          <div className="x-blob">
            <div className="x-blob__mask">
              <Image
                src="/images/custom-design/atelier.jpg"
                alt="Góc làm hoa thủ công"
                fill
                sizes="(max-width: 860px) 86vw, 480px"
              />
            </div>
            <div className="x-sticker" aria-hidden="true">
              <b>✿</b>
            </div>
          </div>
          <div>
            <p className="x-eyebrow">MỘT MÓN QUÀ ĐÚNG NGƯỜI</p>
            <h2 className="x-h2" id="custom-intro">
              Ý tưởng của bạn không cần <span className="x-serif">hoàn hảo.</span>
            </h2>
            <p className="custom-lead">
              Chỉ cần một chút về người nhận — họ thích gì, bạn muốn họ cảm thấy thế nào.
            </p>
            <p className="x-quote">Phần còn lại, tiệm cùng bạn hoàn thiện.</p>
          </div>
        </div>
      </section>
      <section
        className="x-sec custom-process"
        id="quy-trinh"
        aria-labelledby="custom-process-title"
      >
        <div className="x-wrap">
          <p className="x-eyebrow">MỘT MÓN QUÀ, TỪNG BƯỚC MỘT</p>
          <h2 className="x-h2" id="custom-process-title">
            Từ ý tưởng đến <span className="x-serif">món quà.</span>
          </h2>
          <div className="x-proc">
            <article className="x-card">
              <span className="x-card__n">01</span>
              <h3>Bạn kể</h3>
              <p>Chọn dịp, ngân sách, màu sắc và điều bạn muốn gửi gắm.</p>
            </article>
            <article className="x-card">
              <span className="x-card__n">02</span>
              <h3>Tiệm báo giá</h3>
              <p>Tiệm xem yêu cầu và gửi báo giá riêng để bạn cân nhắc.</p>
            </article>
            <article className="x-card">
              <span className="x-card__n">03</span>
              <h3>Bạn duyệt</h3>
              <p>Bạn duyệt báo giá trước khi tạo đơn và đặt cọc.</p>
            </article>
          </div>
        </div>
      </section>
      <section
        className="x-sec custom-builder"
        id="custom-form"
        aria-labelledby="custom-builder-title"
      >
        <div className="x-wrap">
          <p className="x-eyebrow">HOA THEO Ý BẠN</p>
          <h2 className="x-h2" id="custom-builder-title">
            Kể tiệm nghe <span className="x-serif">một chút.</span>
          </h2>
          <CustomForm />
        </div>
      </section>
    </div>
  );
}
