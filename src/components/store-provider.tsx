'use client';
/* eslint-disable react-hooks/set-state-in-effect */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowUpRight,
  X,
  Minus,
  Plus,
  ShoppingBag,
  Search,
  Heart,
  Trash2,
  User,
} from 'lucide-react';
import { money, type Product } from '@/lib/catalog';
import type { StorefrontMode } from '@/lib/storefront';

type Line = { id: string; quantity: number };
type Store = {
  ready: boolean;
  cart: Line[];
  favorites: string[];
  add: (id: string, quantity?: number) => void;
  change: (id: string, delta: number) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  openCart: () => void;
  openSearch: () => void;
  total: number;
  count: number;
  clear: () => void;
  toast: (text: string) => void;
  products: Product[];
  categories: { id: string; label: string }[];
  mode: StorefrontMode;
};
const Context = createContext<Store | null>(null);
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error('StoreProvider is required');
  return value;
}
export function StoreProvider({
  children,
  initialProducts = [],
  initialCategories = [{ id: 'all', label: 'Tất cả' }],
  mode = 'preview',
  error,
}: {
  children: ReactNode;
  initialProducts?: Product[];
  initialCategories?: { id: string; label: string }[];
  mode?: StorefrontMode;
  error?: string;
}) {
  const products = initialProducts;
  const categories = initialCategories;
  const [cart, setCart] = useState<Line[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const cartDialog = useRef<HTMLDialogElement>(null);
  const searchDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem('cogu-cart-v1') || '[]');
      if (Array.isArray(saved))
        setCart(
          saved
            .filter(
              (x): x is Line =>
                !!x &&
                typeof x === 'object' &&
                products.some((p) => p.id === x.id) &&
                Number.isInteger(x.quantity) &&
                x.quantity > 0 &&
                x.quantity <= 20,
            )
            .filter((x, i, all) => all.findIndex((y) => y.id === x.id) === i),
        );
      const likes: unknown = JSON.parse(localStorage.getItem('cogu-favorites-v1') || '[]');
      if (Array.isArray(likes))
        setFavorites(
          likes.filter(
            (id): id is string => typeof id === 'string' && products.some((p) => p.id === id),
          ),
        );
    } catch {
      /* Dữ liệu cục bộ hỏng: bắt đầu giỏ mới, không chặn giao diện. */
    }
    setReady(true);
  }, [products]);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem('cogu-cart-v1', JSON.stringify(cart));
        localStorage.setItem('cogu-favorites-v1', JSON.stringify(favorites));
      } catch {
        /* Trình duyệt có thể chặn lưu trữ. */
      }
  }, [cart, favorites, ready, products]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3000);
    return () => clearTimeout(timer);
  }, [notice]);
  const toast = useCallback((text: string) => setNotice(text), []);
  const change = (id: string, delta: number) =>
    setCart((lines) =>
      lines
        .map((l) =>
          l.id === id ? { ...l, quantity: Math.min(20, Math.max(0, l.quantity + delta)) } : l,
        )
        .filter((l) => l.quantity > 0),
    );
  const add = (id: string, quantity = 1) => {
    if (!ready) {
      setNotice('Túi hoa đang khởi tạo, vui lòng thử lại sau một chút.');
      return;
    }
    if (!products.some((p) => p.id === id) || !Number.isInteger(quantity) || quantity < 1) return;
    setCart((lines) =>
      lines.some((l) => l.id === id)
        ? lines.map((l) =>
            l.id === id ? { ...l, quantity: Math.min(20, l.quantity + quantity) } : l,
          )
        : [...lines, { id, quantity: Math.min(20, quantity) }],
    );
    setNotice('Đã thêm một chút xinh vào túi hoa.');
  };
  const total = cart.reduce(
    (sum, l) => sum + (products.find((p) => p.id === l.id)?.price || 0) * l.quantity,
    0,
  );
  const count = cart.reduce((sum, l) => sum + l.quantity, 0);
  const remove = (id: string) => setCart((lines) => lines.filter((l) => l.id !== id));
  const toggleFavorite = (id: string) =>
    setFavorites((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  const closeCart = () => cartDialog.current?.close();
  const normalized = query
    .toLocaleLowerCase('vi')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  const results = products.filter((p) =>
    `${p.name} ${p.subtitle}`
      .toLocaleLowerCase('vi')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .includes(normalized),
  );
  return (
    <Context.Provider
      value={{
        ready,
        cart,
        favorites,
        add,
        change,
        remove,
        toggleFavorite,
        total,
        count,
        clear: () => setCart([]),
        toast,
        products,
        categories,
        mode,
        openCart: () => cartDialog.current?.showModal(),
        openSearch: () => {
          setQuery('');
          searchDialog.current?.showModal();
        },
      }}
    >
      {mode === 'unavailable' && (
        <div role="alert" className="catalog-error">
          Không thể tải catalog từ API. {error || 'Vui lòng thử lại sau.'}
        </div>
      )}
      {children}
      <div role="status" aria-live="polite" className={`toast ${notice ? 'visible' : ''}`}>
        {notice}
      </div>
      <dialog
        ref={cartDialog}
        className="drawer"
        aria-labelledby="cart-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) closeCart();
        }}
      >
        <div className="drawer-content">
          <div className="dialog-heading">
            <div>
              <span className="eyebrow">NHỮNG ĐIỀU BẠN CHỌN</span>
              <h2 id="cart-title">
                Túi hoa <sup>({count})</sup>
              </h2>
            </div>
            <button className="icon-button" aria-label="Đóng túi hoa" onClick={closeCart}>
              <X />
            </button>
          </div>
          {cart.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={42} strokeWidth={1} />
              <h3>Một chiếc túi đang chờ hoa.</h3>
              <p>Chọn một chút dịu dàng cho bạn, hoặc cho ai đó.</p>
              <Link className="button" href="/cua-tiem" onClick={closeCart}>
                Ghé cửa tiệm <ArrowUpRight size={18} />
              </Link>
            </div>
          ) : (
            <>
              <div className="cart-lines">
                {cart.map((line) => {
                  const p = products.find((p) => p.id === line.id)!;
                  return (
                    <div className="cart-line" key={line.id}>
                      <Link href={`/cua-tiem/${p.id}`} onClick={closeCart}>
                        <Image src={p.image} width={92} height={114} alt={p.name} />
                      </Link>
                      <div>
                        <Link href={`/cua-tiem/${p.id}`} onClick={closeCart}>
                          <h3>{p.name}</h3>
                        </Link>
                        <p>{money(p.price)}</p>
                        <div className="quantity small">
                          <button
                            aria-label={`Giảm số lượng ${p.name}`}
                            onClick={() => change(p.id, -1)}
                          >
                            <Minus size={14} />
                          </button>
                          <span>{line.quantity}</span>
                          <button
                            disabled={line.quantity >= 20}
                            aria-label={`Tăng số lượng ${p.name}`}
                            onClick={() => change(p.id, 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                      <button
                        className="icon-button remove"
                        aria-label={`Xóa ${p.name}`}
                        onClick={() => remove(p.id)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="cart-bottom">
                <div className="total-line">
                  <span>Tạm tính</span>
                  <strong>{money(total)}</strong>
                </div>
                <p className="fine-print">
                  Chưa bao gồm phí giao hàng. Giá và sản phẩm đang là dữ liệu trải nghiệm từ
                  repository.
                </p>
                <Link href="/thanh-toan" className="button full" onClick={closeCart}>
                  Xem lại đơn hoa <ArrowUpRight size={18} />
                </Link>
                <button className="text-link" onClick={closeCart}>
                  Chọn thêm một chút
                </button>
              </div>
            </>
          )}
        </div>
      </dialog>
      <dialog ref={searchDialog} className="search-dialog" aria-labelledby="search-title">
        <div className="dialog-heading">
          <h2 id="search-title">Bạn đang tìm điều gì?</h2>
          <button
            className="icon-button"
            aria-label="Đóng tìm kiếm"
            onClick={() => searchDialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <label className="search-input">
          <Search size={21} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Một bó hoa, một món quà…"
            aria-label="Tìm sản phẩm"
          />
        </label>
        <p className="eyebrow">{query ? `${results.length} KẾT QUẢ` : 'MỘT VÀI GỢI Ý CHO BẠN'}</p>
        <div className="search-results">
          {results.length ? (
            results.map((p) => (
              <Link
                key={p.id}
                href={`/cua-tiem/${p.id}`}
                onClick={() => searchDialog.current?.close()}
              >
                <Image src={p.image} width={64} height={72} alt="" />
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.subtitle}</small>
                </span>
                <span>{money(p.price)}</span>
                <ArrowUpRight size={18} />
              </Link>
            ))
          ) : (
            <p>Chưa thấy món quà bạn tìm. Thử “bó hoa”, “sương” hoặc “DIY” nhé.</p>
          )}
        </div>
      </dialog>
    </Context.Provider>
  );
}
export function HeaderActions() {
  const { count, openCart, openSearch } = useStore();
  return (
    <div className="header-actions">
      <Link href="/tai-khoan" className="icon-button" aria-label="Tài khoản" title="Tài khoản">
        <User size={20} strokeWidth={1.5} />
      </Link>
      <button className="icon-button" aria-label="Tìm kiếm sản phẩm" onClick={openSearch}>
        <Search size={20} strokeWidth={1.5} />
      </button>
      <button
        className="bag-button"
        aria-label={`Mở túi hoa, ${count} sản phẩm`}
        onClick={openCart}
      >
        <ShoppingBag size={19} strokeWidth={1.5} />
        <span>Túi hoa</span>
        <span className="bag-count">{count}</span>
      </button>
    </div>
  );
}
export function FavoriteButton({ id }: { id: string }) {
  const { favorites, toggleFavorite, ready } = useStore();
  const liked = favorites.includes(id);
  return (
    <button
      className={`favorite-button ${liked ? 'liked' : ''}`}
      aria-label={liked ? 'Bỏ lưu sản phẩm' : 'Lưu sản phẩm'}
      aria-pressed={liked}
      disabled={!ready}
      onClick={() => toggleFavorite(id)}
    >
      <Heart size={19} strokeWidth={1.4} fill={liked ? 'currentColor' : 'none'} />
    </button>
  );
}
