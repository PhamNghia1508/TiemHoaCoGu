'use client';
import { useMemo, useRef, useState } from 'react';
import { Search, Heart, SlidersHorizontal, X } from 'lucide-react';
import { ProductCard } from './site';
import { useStore } from './store-provider';
import { useSearchParams } from 'next/navigation';

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
const budgets = [
  { id: 'all', label: 'Mọi mức giá' },
  { id: 'under300', label: 'Dưới 300.000đ' },
  { id: '300to500', label: '300.000–500.000đ' },
  { id: 'over500', label: 'Trên 500.000đ' },
] as const;

type Budget = (typeof budgets)[number]['id'];
export default function Shop() {
  const params = useSearchParams();
  const { favorites, products, categories } = useStore();
  const [category, setCategory] = useState(() => {
    const value = params.get('category');
    return categories.some((c) => c.id === value) ? value! : 'all';
  });
  const [budget, setBudget] = useState<Budget>(() => {
    const value = params.get('budget') as Budget;
    return budgets.some((b) => b.id === value) ? value : 'all';
  });
  const [sort, setSort] = useState('curated');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState(false);
  const filterDialog = useRef<HTMLDialogElement>(null);

  const filtered = useMemo(() => {
    const items = products.filter((p) => {
      const inBudget =
        budget === 'all' ||
        (budget === 'under300'
          ? p.price < 300000
          : budget === '300to500'
            ? p.price >= 300000 && p.price <= 500000
            : p.price > 500000);
      return (
        (category === 'all' || p.category === category) &&
        inBudget &&
        (!saved || favorites.includes(p.id)) &&
        normalize(`${p.name} ${p.subtitle}`).includes(normalize(query))
      );
    });
    return [...items].sort((a, b) =>
      sort === 'price-up' ? a.price - b.price : sort === 'price-down' ? b.price - a.price : 0,
    );
  }, [category, budget, query, sort, saved, favorites, products]);
  const activeCount = (category !== 'all' ? 1 : 0) + (budget !== 'all' ? 1 : 0) + (saved ? 1 : 0);
  const reset = () => {
    setQuery('');
    setCategory('all');
    setBudget('all');
    setSaved(false);
    setSort('curated');
  };
  return (
    <div className="commerce-shop">
      <div className="commerce-search" role="search">
        <Search size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm một món quà…"
          aria-label="Tìm trong cửa tiệm"
        />
        {query && (
          <button
            type="button"
            className="commerce-clear"
            onClick={() => setQuery('')}
            aria-label="Xóa tìm kiếm"
          >
            <X size={16} />
          </button>
        )}
        <button
          type="button"
          className={`commerce-save-toggle ${saved ? 'is-active' : ''}`}
          aria-label="Chỉ xem sản phẩm đã lưu"
          aria-pressed={saved}
          onClick={() => setSaved(!saved)}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="commerce-toolbar">
        <div className="commerce-category-tabs" role="group" aria-label="Lọc loại sản phẩm">
          {categories.map((c) => (
            <button
              type="button"
              key={c.id}
              data-category-id={c.id}
              className={category === c.id ? 'is-active' : ''}
              aria-pressed={category === c.id}
              onClick={() => setCategory(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="commerce-filter-trigger"
          onClick={() => filterDialog.current?.showModal()}
        >
          <SlidersHorizontal size={16} /> Bộ lọc {activeCount > 0 && <span>{activeCount}</span>}
        </button>
        <div className="commerce-sort">
          <span aria-live="polite">
            {filtered.length} món quà{saved ? ' đã lưu' : ''}
          </span>
          <label>
            <span className="sr-only">Sắp xếp sản phẩm</span>
            <select
              aria-label="Sắp xếp sản phẩm"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="curated">Tiệm gợi ý</option>
              <option value="price-up">Giá: thấp đến cao</option>
              <option value="price-down">Giá: cao đến thấp</option>
            </select>
          </label>
        </div>
      </div>
      {activeCount > 0 && (
        <div className="commerce-chips" aria-label="Bộ lọc đang áp dụng">
          <span>Đang lọc:</span>
          {category !== 'all' && (
            <button type="button" onClick={() => setCategory('all')}>
              {categories.find((c) => c.id === category)?.label} <X size={13} />
            </button>
          )}
          {budget !== 'all' && (
            <button type="button" onClick={() => setBudget('all')}>
              {budgets.find((b) => b.id === budget)?.label} <X size={13} />
            </button>
          )}
          {saved && (
            <button type="button" onClick={() => setSaved(false)}>
              Đã lưu <X size={13} />
            </button>
          )}
          <button type="button" className="commerce-reset" onClick={reset}>
            Xóa tất cả
          </button>
        </div>
      )}
      <section className="section shop-products">
        {filtered.length ? (
          <div className="product-grid">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Heart size={35} />
            <h3>Chưa có món quà nào ở đây.</h3>
            <p>Thử một từ khóa khác, hoặc bỏ bớt bộ lọc nhé.</p>
            <button className="button outline" onClick={reset}>
              Xem tất cả
            </button>
          </div>
        )}
        <p className="shop-note">
          Giá từ catalog của tiệm. Tình trạng hàng, phí giao và thời gian nhận sẽ được tiệm xác
          nhận; chưa có đơn hàng thật.
        </p>
      </section>
      <dialog ref={filterDialog} className="commerce-filter-dialog" aria-labelledby="filter-title">
        <form method="dialog" onSubmit={(e) => e.preventDefault()}>
          <div className="commerce-dialog-heading">
            <div>
              <span className="eyebrow">LỌC GỌN LẠI</span>
              <h2 id="filter-title">Bộ lọc</h2>
            </div>
            <button
              type="button"
              className="icon-button"
              aria-label="Đóng bộ lọc"
              onClick={() => filterDialog.current?.close()}
            >
              <X />
            </button>
          </div>
          <fieldset>
            <legend>Khoảng giá</legend>
            {budgets.map((b) => (
              <label key={b.id}>
                <input
                  type="radio"
                  name="budget"
                  checked={budget === b.id}
                  onChange={() => setBudget(b.id)}
                />{' '}
                {b.label}
              </label>
            ))}
          </fieldset>
          <button type="button" className="button" onClick={() => filterDialog.current?.close()}>
            Xem {filtered.length} món quà
          </button>
          <button type="button" className="commerce-dialog-reset" onClick={reset}>
            Xóa bộ lọc
          </button>
        </form>
      </dialog>
    </div>
  );
}
