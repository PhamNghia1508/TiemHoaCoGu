'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowUpRight, Minus, Plus, HandHeart, PenLine, X, ZoomIn } from 'lucide-react';
import { money, type Product } from '@/lib/catalog';
import { useStore, FavoriteButton } from './store-provider';
export function ProductDetail({ product: p }: { product: Product }) {
  const [image, setImage] = useState(p.image);
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const zoomDialog = useRef<HTMLDialogElement>(null);
  const { add, openCart, toast } = useStore();
  const addToCart = () => {
    add(p.id, quantity);
    toast(`Đã thêm ${quantity} ${p.name} vào túi hoa.`);
    openCart();
  };
  const imageIsContext = image === p.alternate;
  return (
    <div className="detail-grid commerce-detail">
      <div className="commerce-gallery">
        <div className="detail-image">
          <Image
            src={image}
            alt={imageIsContext ? `Ảnh bối cảnh tham khảo cho ${p.name}` : p.subtitle}
            fill
            priority
            sizes="(max-width: 700px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
          <FavoriteButton id={p.id} />
          <button
            type="button"
            className="commerce-zoom"
            aria-label="Phóng to ảnh sản phẩm"
            onClick={() => zoomDialog.current?.showModal()}
          >
            <ZoomIn size={17} />
          </button>
        </div>
        <p className="commerce-image-caption">
          {imageIsContext
            ? 'Ảnh bối cảnh tham khảo — không phải góc chụp sản phẩm.'
            : 'Ảnh sản phẩm từ catalog trải nghiệm.'}
        </p>
        <div className="detail-thumbnails">
          {[p.image, p.alternate].map((src, i) => (
            <button
              type="button"
              key={src}
              className={image === src ? 'active' : ''}
              aria-label={
                i === 0 ? `Ảnh sản phẩm ${p.name}` : `Ảnh bối cảnh tham khảo cho ${p.name}`
              }
              aria-pressed={image === src}
              onClick={() => setImage(src)}
            >
              <Image src={src} alt="" width={72} height={80} />
            </button>
          ))}
        </div>
      </div>
      <div className="detail-copy">
        <span className="eyebrow">MÓN QUÀ CÓ GU / BẢN TRẢI NGHIỆM</span>
        <h1>{p.name}</h1>
        <p className="commerce-subtitle">{p.subtitle}</p>
        <div className="detail-price">
          {money(p.price)} <span>giá minh họa</span>
        </div>
        <p className="commerce-shipping">
          Phí giao & thời gian nhận: tiệm sẽ xác nhận trước khi nhận đơn.
        </p>
        <p className="detail-description">{p.description}</p>
        <div className="detail-options">
          <div>
            <span className="eyebrow">BẢNG MÀU THAM KHẢO</span>
            <div className="swatches" role="img" aria-label="Bảng màu tham khảo">
              {p.palette.map((c) => (
                <i style={{ backgroundColor: c }} key={c} />
              ))}
            </div>
          </div>
          <Link href="/dat-rieng" className="underlined">
            Muốn một bảng màu khác?
          </Link>
        </div>
        <label className="commerce-note">
          <span>Lời nhắn tặng (không bắt buộc)</span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 180))}
            maxLength={180}
            placeholder="Ví dụ: Chúc bạn một ngày thật dịu dàng…"
          />
          <small>{note.length}/180 · Chỉ dùng để xem lại, chưa lưu hoặc gửi đi.</small>
        </label>
        <div className="detail-actions">
          <div className="quantity">
            <button
              type="button"
              aria-label="Giảm số lượng"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus size={15} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              type="button"
              aria-label="Tăng số lượng"
              disabled={quantity >= 20}
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            >
              <Plus size={15} />
            </button>
          </div>
          <button type="button" className="button commerce-primary" onClick={addToCart}>
            Thêm vào túi hoa <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="detail-extras">
          <span>
            <HandHeart size={15} /> Làm thủ công, có tâm
          </span>
          <span>
            <PenLine size={15} /> Dành chỗ cho lời nhắn riêng
          </span>
        </div>
        <div className="accordion">
          <details open>
            <summary>Về món quà này</summary>
            <p>
              Sản phẩm và ảnh trong bản trải nghiệm được kế thừa từ repository. Hoa thủ công có thể
              khác nhẹ về dáng, sắc độ và cách gói. Tiệm sẽ xác nhận quy cách, thời gian hoàn thiện
              và giá thực tế trước khi nhận đơn.
            </p>
          </details>
          <details>
            <summary>Chăm hoa để thương lâu hơn</summary>
            <p>
              Giữ hoa sáp nơi khô thoáng, tránh nắng trực tiếp và nguồn nhiệt. Không tưới nước. Dùng
              cọ mềm, khô để làm sạch bụi. Riêng nến hoa cần đặt trên đế chịu nhiệt và luôn có người
              trông khi đốt.
            </p>
          </details>
          <details>
            <summary>Gói quà & giao nhận</summary>
            <p>
              Phí giao, khu vực phục vụ và thời gian nhận sẽ được tiệm xác nhận khi hệ thống mở bán.
              Bản trải nghiệm chưa nhận thanh toán hoặc đơn hàng thật.
            </p>
          </details>
        </div>
      </div>
      <div className="commerce-mobile-cta">
        <span>
          <b>{quantity}</b> × {money(p.price)}
        </span>
        <button type="button" className="button" onClick={addToCart}>
          Thêm vào túi hoa <ArrowUpRight size={17} />
        </button>
      </div>
      <dialog ref={zoomDialog} className="commerce-zoom-dialog" aria-label="Ảnh sản phẩm phóng to">
        <button
          type="button"
          className="icon-button"
          aria-label="Đóng ảnh phóng to"
          onClick={() => zoomDialog.current?.close()}
        >
          <X />
        </button>
        <Image
          src={image}
          alt={imageIsContext ? `Ảnh bối cảnh tham khảo cho ${p.name}` : p.subtitle}
          width={1200}
          height={1350}
          style={{ width: '100%', height: 'auto' }}
        />
      </dialog>
    </div>
  );
}
