'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowUpRight, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useStore } from './store-provider';
import ProductCard from './product-card';
export function GiftFinder() {
  const router = useRouter();
  const [category, setCategory] = useState('all');
  const [budget, setBudget] = useState('all');
  return (
    <form
      className="gift-finder"
      onSubmit={(e) => {
        e.preventDefault();
        const q = new URLSearchParams();
        if (category !== 'all') q.set('category', category);
        if (budget !== 'all') q.set('budget', budget);
        router.push('/cua-tiem' + (q.size ? '?' + q.toString() : ''));
      }}
    >
      <div className="finder-title">
        <SlidersHorizontal size={24} />
        <div>
          <span className="eyebrow">CHƯA BIẾT CHỌN GÌ?</span>
          <h2>Tiệm tìm cùng bạn.</h2>
        </div>
      </div>
      <label>
        Kiểu quà bạn đang nghĩ đến
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Một chút bất ngờ</option>
          <option value="bo">Một bó hoa sáp</option>
          <option value="lo">Một góc nhỏ xinh</option>
          <option value="diy">Quà & tự tay làm</option>
        </select>
      </label>
      <label>
        Ngân sách của bạn
        <select value={budget} onChange={(e) => setBudget(e.target.value)}>
          <option value="all">Thoải mái lựa chọn</option>
          <option value="under300">Dưới 300.000 ₫</option>
          <option value="300to500">300.000 – 500.000 ₫</option>
          <option value="over500">Trên 500.000 ₫</option>
        </select>
      </label>
      <button type="submit" className="button">
        Tìm đúng gu <ArrowRight size={19} />
      </button>
    </form>
  );
}
export function HomeCollection() {
  const [tab, setTab] = useState('all');
  const { products, categories } = useStore();
  const filtered = products.filter(
    (p) => tab === 'all' || (tab === 'under300' ? p.price < 300000 : p.category === tab),
  );
  const tabs = [
    ['all', 'Tiệm gợi ý'],
    ...categories
      .filter((c) => c.id !== 'all')
      .slice(0, 2)
      .map((c) => [c.id, c.label]),
    ['under300', 'Quà dưới 300k'],
  ];
  return (
    <section className="section home-collection" id="bo-suu-tap">
      <div className="collection-top">
        <div>
          <p className="eyebrow">01 / NHỮNG MÓN QUÀ CÓ GU</p>
          <h2>
            Thích là tặng.
            <br />
            <span>Đâu cần chờ dịp.</span>
          </h2>
        </div>
        <Link className="text-link" href="/cua-tiem">
          Dạo hết cửa tiệm <ArrowUpRight size={20} />
        </Link>
      </div>
      <div className="home-collection-tabs" role="group" aria-label="Chọn bộ sưu tập">
        {tabs.map(([id, label]) => (
          <button key={id} aria-pressed={id === tab} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
        <span aria-live="polite">{Math.min(filtered.length, 4)} món quà dành cho bạn</span>
      </div>
      <div className="product-grid home-products">
        {filtered.slice(0, 4).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
      <p className="catalog-note">
        Giá tham khảo · Mỗi món quà đều cần được tiệm xác nhận trước khi đặt thật.
      </p>
    </section>
  );
}
