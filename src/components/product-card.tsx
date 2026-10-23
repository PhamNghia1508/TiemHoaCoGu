'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight, Plus, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { FavoriteButton, useStore } from './store-provider';
import { money, type Product } from '@/lib/catalog';
export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { add, ready, mode } = useStore();
  const [added, setAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  return (
    <article
      className="product-card"
      style={
        {
          '--card-tone': ['#f1e6e7', '#edf0de', '#e9e7f0', '#f3e7d5'][index % 4],
        } as React.CSSProperties
      }
    >
      <div className="product-image">
        <Link href={`/cua-tiem/${product.id}`} aria-label={`Xem ${product.name}`}>
          <Image
            src={product.image}
            alt={product.subtitle}
            fill
            sizes="(max-width: 600px) 46vw, (max-width: 1000px) 45vw, 25vw"
            style={{ objectFit: 'cover' }}
          />
          <span className="product-hover">
            Khám phá món quà <ArrowUpRight size={20} />
          </span>
        </Link>
        {product.tag && <span className="product-tag">{product.tag}</span>}
        <FavoriteButton id={product.id} />
      </div>
      <div className="product-info">
        <div>
          <p className="product-kind">
            {product.category === 'bo'
              ? 'HOA SÁP THỦ CÔNG'
              : product.category === 'lo'
                ? 'CHO GÓC NHỎ'
                : 'QUÀ & DIY'}
          </p>
          <Link href={`/cua-tiem/${product.id}`}>
            <h3>{product.name}</h3>
          </Link>
          <p>{product.subtitle}</p>
        </div>
        <span className="product-price">{money(product.price)}</span>
      </div>
      <div className="product-card-bottom">
        <div className="swatches" role="img" aria-label="Bảng màu tham khảo">
          {product.palette.map((c) => (
            <i key={c} style={{ backgroundColor: c }} />
          ))}
        </div>
        <button
          className={`quick-add ${added ? 'is-added' : ''}`}
          aria-label={`Thêm ${product.name} vào túi`}
          disabled={
            !ready ||
            (mode === 'connected' &&
              !product.isPreOrder &&
              product.quantityAvailable !== undefined &&
              product.quantityAvailable <= 0)
          }
          onClick={() => {
            add(product.id);
            setAdded(true);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => setAdded(false), 2200);
          }}
        >
          {added ? <Check size={16} /> : <Plus size={16} />}
          <span>{added ? 'Đã thêm' : 'Thêm vào túi'}</span>
        </button>
      </div>
    </article>
  );
}
