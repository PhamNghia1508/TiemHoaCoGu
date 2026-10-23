'use client';
import { useMemo, useState } from 'react';
import { Search, Heart } from 'lucide-react';
import { products, categories } from '@/lib/catalog';
import { ProductCard } from './site';
import { useStore } from './store-provider';
const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
export default function Shop() {
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('curated');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const { favorites } = useStore();
  const filtered = useMemo(() => {
    const items = products.filter(
      (p) =>
        (category === 'all' || p.category === category) &&
        (!saved || favorites.includes(p.id)) &&
        normalize(`${p.name} ${p.subtitle}`).includes(normalize(query)),
    );
    return sort === 'price-up'
      ? items.sort((a, b) => a.price - b.price)
      : sort === 'price-down'
        ? items.sort((a, b) => b.price - a.price)
        : items;
  }, [category, query, sort, saved, favorites]);
  return (
    <>
      <div className="shop-search">
        <Search size={16} strokeWidth={1.3} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm một món quà…"
          aria-label="Tìm trong cửa tiệm"
        />
        <button
          className="icon-button"
          aria-label="Chỉ xem sản phẩm đã lưu"
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
        >
          <Heart size={16} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="shop-toolbar">
        <div className="filter-tabs" role="group" aria-label="Lọc loại sản phẩm">
          {categories.map((c) => (
            <button
              className={category === c.id ? 'active' : ''}
              aria-pressed={category === c.id}
              key={c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <span aria-live="polite">
            {filtered.length} món quà{saved ? ' đã lưu' : ''}
          </span>
          <select
            aria-label="Sắp xếp sản phẩm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="curated">Tiệm gợi ý</option>
            <option value="price-up">Giá: thấp đến cao</option>
            <option value="price-down">Giá: cao đến thấp</option>
          </select>
        </div>
      </div>
      <section className="section shop-products">
        {filtered.length ? (
          <div className="product-grid">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Heart size={35} strokeWidth={1} />
            <h3>Chưa có món quà nào ở đây.</h3>
            <p>Thử một từ khóa khác, hoặc dạo lại cả cửa tiệm nhé.</p>
            <button
              className="button outline"
              onClick={() => {
                setQuery('');
                setCategory('all');
                setSaved(false);
              }}
            >
              Xem tất cả
            </button>
          </div>
        )}
        <p className="shop-note">
          Danh mục & giá trải nghiệm được chuyển từ repository gốc. Tình trạng hàng, phí giao và giá
          bán thực tế sẽ được đồng bộ sau khi kết nối backend.
        </p>
      </section>
    </>
  );
}
