'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Minus, Plus, HandHeart, PenLine } from 'lucide-react';
import { money, type Product } from '@/lib/catalog';
import { useStore, FavoriteButton } from './store-provider';
export function ProductDetail({ product: p }: { product: Product }) {
  const [image, setImage] = useState(p.image);
  const [quantity, setQuantity] = useState(1);
  const { add, openCart } = useStore();
  return (
    <div className="detail-grid">
      <div>
        <div className="detail-image">
          <Image
            src={image}
            alt={image === p.image ? p.subtitle : `Góc nhìn khác của ${p.name}, ảnh minh họa`}
            fill
            priority
            sizes="(max-width: 600px) 100vw, 50vw"
            style={{ objectFit: 'cover' }}
          />
          <FavoriteButton id={p.id} />
        </div>
        <div className="detail-thumbnails">
          {[p.image, p.alternate].map((src, i) => (
            <button
              key={src}
              className={image === src ? 'active' : ''}
              aria-label={`Xem ảnh ${i + 1} của ${p.name}`}
              aria-pressed={image === src}
              onClick={() => setImage(src)}
            >
              <Image src={src} alt="" width={72} height={80} />
            </button>
          ))}
        </div>
      </div>
      <div className="detail-copy">
        <span className="eyebrow">MỘT MÓN QUÀ TỪ TIỆM HOA CÓ GU</span>
        <h1>{p.name}</h1>
        <p>{p.subtitle}</p>
        <div className="detail-price">{money(p.price)}</div>
        <p className="detail-description">{p.description}</p>
        <div className="detail-options">
          <div>
            <span className="eyebrow">BẢNG MÀU THAM KHẢO</span>
            <div className="swatches">
              {p.palette.map((c) => (
                <i style={{ backgroundColor: c }} key={c} />
              ))}
            </div>
          </div>
          <Link href="/dat-rieng" className="underlined">
            Muốn một bảng màu khác?
          </Link>
        </div>
        <div className="detail-actions">
          <div className="quantity">
            <button
              aria-label="Giảm số lượng"
              disabled={quantity <= 1}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            >
              <Minus size={15} />
            </button>
            <span aria-live="polite">{quantity}</span>
            <button
              aria-label="Tăng số lượng"
              disabled={quantity >= 20}
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            >
              <Plus size={15} />
            </button>
          </div>
          <button
            className="button"
            onClick={() => {
              add(p.id, quantity);
              openCart();
            }}
          >
            Thêm vào túi hoa <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="detail-extras">
          <span>
            <HandHeart size={15} strokeWidth={1} /> Làm thủ công, có tâm
          </span>
          <span>
            <PenLine size={15} strokeWidth={1} /> Dành chỗ cho lời nhắn riêng
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
              Bạn có thể chuẩn bị lời nhắn trong bước xem lại đơn. Phí giao, khu vực phục vụ và thời
              gian nhận sẽ được tiệm xác nhận khi hệ thống mở bán. Bản trải nghiệm chưa nhận thanh
              toán hoặc đơn hàng thật.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
