'use client';
import AdminOperations from '@/components/admin/operations';
import AdminOrderOperations from '@/components/admin/order-operations';
import {
  VoucherManager,
  AccountManager,
  ProductMediaManager,
} from '@/components/admin/business-tools';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import './admin.css';
import {
  adminPaths,
  AdminMe,
  Category,
  Dashboard,
  Page,
  Product,
  storeRequest,
} from '@/lib/admin-store';

type Tab = 'dashboard' | 'catalog' | 'inventory' | 'orders' | 'vouchers' | 'accounts' | 'audit';
type FormState = Record<string, string | boolean>;
const money = (value?: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
const date = (value?: string) =>
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(value)) : '—';

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  required = false,
  children,
}: {
  label: string;
  name: string;
  value: string | boolean;
  onChange: (name: string, value: string | boolean) => void;
  type?: string;
  required?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <label className="admin-field">
      <span>
        {label}
        {required ? ' *' : ''}
      </span>
      {children ?? (
        <input
          name={name}
          type={type}
          required={required}
          value={type === 'checkbox' ? undefined : String(value)}
          checked={type === 'checkbox' ? Boolean(value) : undefined}
          onChange={(e) => onChange(name, type === 'checkbox' ? e.target.checked : e.target.value)}
        />
      )}
    </label>
  );
}

export default function AdminPage() {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [audit, setAudit] = useState<Record<string, unknown>[]>([]);
  const [categoryForm, setCategoryForm] = useState<FormState>({
    code: '',
    name: '',
    description: '',
    imageUrl: '',
  });
  const [productForm, setProductForm] = useState<FormState>({
    categoryId: '',
    code: '',
    name: '',
    price: '0',
    originalPrice: '',
    thumbnailUrl: '',
    description: '',
    badge: '',
    section: '',
    shippingWeightGrams: '500',
    isCustomizable: false,
    isPreOrder: false,
    isActive: true,
  });
  const [editingCategory, setEditingCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState('');
  const [inventory, setInventory] = useState<Record<string, string>>({});
  const [search] = useState('');
  const update =
    (setter: React.Dispatch<React.SetStateAction<FormState>>) =>
    (name: string, value: string | boolean) =>
      setter((old) => ({ ...old, [name]: value }));
  const setCategory = update(setCategoryForm);
  const setProduct = update(setProductForm);

  const run = useCallback(async <T,>(path: string, body?: unknown, method = 'GET') => {
    const value = await storeRequest<T>(path, body, method);
    return value;
  }, []);
  const refresh = useCallback(
    async (section: Tab = tab) => {
      try {
        if (section === 'dashboard') setDashboard(await run<Dashboard>(adminPaths.dashboard));
        if (section === 'catalog' || section === 'inventory') {
          const [cats, products] = await Promise.all([
            run<Category[]>(adminPaths.categories),
            run<Page<Product>>(
              `${adminPaths.products}?page=1&pageSize=100&search=${encodeURIComponent(search)}`,
            ),
          ]);
          setCategories(cats);
          setProducts(products.items);
        }
        if (section === 'audit')
          setAudit(
            (
              await run<{ items: Record<string, unknown>[] }>(
                `${adminPaths.audit}?page=1&pageSize=50`,
              )
            ).items,
          );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu');
      }
    },
    [run, search, tab],
  );
  // These effects synchronize the UI with the authenticated BFF and API state.
  useEffect(() => {
    run<AdminMe>(adminPaths.me)
      .then(setMe)
      .catch((e) => setError(e instanceof Error ? e.message : 'Không thể xác thực'));
  }, [run]);
  useEffect(() => {
    // External API synchronization: refresh only sets state after its awaited requests.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me?.role === 'Admin') refresh(tab);
  }, [me, tab, refresh]);
  const write = async (
    event: FormEvent,
    path: string,
    body: unknown,
    method: string,
    after: () => void,
  ) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await run(path, body, method);
      setNotice('Đã lưu thay đổi.');
      after();
      refresh(tab);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể lưu');
    } finally {
      setSaving(false);
    }
  };

  async function deleteEntry(kind: 'categories' | 'products', id: string) {
    if (saving || !window.confirm('Xóa mục này? Backend sẽ chặn nếu còn dữ liệu liên quan.'))
      return;
    setSaving(true);
    setError('');
    try {
      await run(`management/${kind}/${id}`, undefined, 'DELETE');
      setNotice('Đã xóa.');
      await refresh('catalog');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Không thể xóa.');
    } finally {
      setSaving(false);
    }
  }
  if (!me)
    return (
      <div className="admin-shell">
        <div className="admin-card">
          <p role="status">Đang kiểm tra quyền quản trị…</p>
          {error && (
            <p className="admin-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  if (me.role !== 'Admin')
    return (
      <div className="admin-shell">
        <div className="admin-card">
          <h1>Không có quyền truy cập</h1>
          <p>Khu vực này chỉ dành cho tài khoản Admin. Quyền cũng được kiểm tra ở backend.</p>
          <p className="admin-error">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">CMS / QUẢN TRỊ</p>
          <h1>Điều hành Tiệm Hoa Có Gu</h1>
          <p className="admin-muted">
            Xin chào {me.fullName || me.email || 'Admin'} · dữ liệu trực tiếp từ hệ thống.
          </p>
        </div>
        <button className="button button-outline" onClick={() => refresh(tab)}>
          Làm mới
        </button>
      </header>
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      <nav className="admin-tabs" aria-label="Điều hướng quản trị">
        {(
          [
            ['dashboard', 'Tổng quan'],
            ['catalog', 'Danh mục & sản phẩm'],
            ['inventory', 'Tồn kho'],
            ['orders', 'Đơn hàng'],
            ['vouchers', 'Voucher'],
            ['accounts', 'Tài khoản'],
            ['audit', 'Audit log'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? 'admin-tab active' : 'admin-tab'}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>
      {tab === 'dashboard' && <DashboardView data={dashboard} />}
      {(tab === 'catalog' || tab === 'inventory') && (
        <fieldset disabled={saving} style={{ border: 0, padding: 0, minWidth: 0 }}>
          <CatalogView
            onDeleteCategory={(id) => deleteEntry('categories', id)}
            onDeleteProduct={(id) => deleteEntry('products', id)}
            categories={categories}
            products={products}
            categoryForm={categoryForm}
            productForm={productForm}
            setCategory={setCategory}
            setProduct={setProduct}
            editingCategory={editingCategory}
            editingProduct={editingProduct}
            setEditingCategory={setEditingCategory}
            setEditingProduct={setEditingProduct}
            onCategory={(e) =>
              write(
                e,
                editingCategory
                  ? `${adminPaths.categories}/${editingCategory}`
                  : adminPaths.categories,
                {
                  code: categoryForm.code,
                  name: categoryForm.name,
                  description: categoryForm.description,
                  imageUrl: categoryForm.imageUrl,
                },
                editingCategory ? 'PUT' : 'POST',
                () => {
                  setEditingCategory('');
                  setCategoryForm({ code: '', name: '', description: '', imageUrl: '' });
                },
              )
            }
            onProduct={(e) =>
              write(
                e,
                editingProduct ? `${adminPaths.products}/${editingProduct}` : adminPaths.products,
                {
                  categoryId: productForm.categoryId,
                  code: productForm.code,
                  name: productForm.name,
                  price: Number(productForm.price),
                  originalPrice: productForm.originalPrice
                    ? Number(productForm.originalPrice)
                    : null,
                  thumbnailUrl: productForm.thumbnailUrl || null,
                  description: productForm.description || null,
                  badge: productForm.badge || null,
                  section: productForm.section || null,
                  isCustomizable: Boolean(productForm.isCustomizable),
                  isPreOrder: Boolean(productForm.isPreOrder),
                  shippingWeightGrams: Number(productForm.shippingWeightGrams),
                  isActive: Boolean(productForm.isActive),
                },
                editingProduct ? 'PUT' : 'POST',
                () => {
                  setEditingProduct('');
                  setProduct('code', '');
                },
              )
            }
            inventory={inventory}
            setInventory={setInventory}
            onInventory={(id) =>
              run(
                adminPaths.inventory(id) + `?quantity=${encodeURIComponent(inventory[id] || '0')}`,
                undefined,
                'PUT',
              )
                .then(() => {
                  setNotice('Đã cập nhật tồn kho.');
                  refresh('inventory');
                })
                .catch((e) =>
                  setError(e instanceof Error ? e.message : 'Không thể cập nhật tồn kho'),
                )
            }
          />
        </fieldset>
      )}
      {tab === 'catalog' && <ProductMediaManager />}
      {tab === 'orders' && <AdminOrderOperations />}
      {tab === 'vouchers' && <VoucherManager />}
      {tab === 'accounts' && <AccountManager />}
      {tab === 'audit' && (
        <DataTable
          title="Audit log"
          columns={['Thời điểm', 'Actor', 'Entity', 'Action', 'Mô tả']}
          rows={audit.map((a) => [
            date(String(a.occurredAtUtc || '')),
            String(a.actorId || '—'),
            String(a.entityType || '—'),
            String(a.action || '—'),
            String(a.description || a.entityId || '—'),
          ])}
          empty="Chưa có log."
        />
      )}
      <AdminOperations />
    </div>
  );
}

function DashboardView({ data }: { data: Dashboard | null }) {
  const cards = data
    ? [
        ['Đơn hàng', data.orderCount],
        ['Doanh thu', money(data.revenue)],
        ['Đã thu', money(data.paidAmount)],
        ['Khách hàng', data.customerCount],
        ['Sản phẩm', data.productCount],
        ['Sắp hết hàng', data.lowStockCount],
      ]
    : [];
  return (
    <section className="admin-card">
      <div className="admin-section-heading">
        <div>
          <p className="eyebrow">BẢNG ĐIỀU KHIỂN</p>
          <h2>Tổng quan kinh doanh</h2>
        </div>
      </div>
      {!data ? (
        <p>Đang tải…</p>
      ) : (
        <>
          <div className="admin-kpis">
            {cards.map(([label, value]) => (
              <div className="admin-kpi" key={String(label)}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="admin-grid-two">
            <div>
              <h3>Đơn theo trạng thái</h3>
              <ul className="admin-list">
                {(data.ordersByStatus || []).map((x) => (
                  <li key={x.status}>
                    <span>{x.status}</span>
                    <strong>{x.count}</strong>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Sản phẩm bán chạy</h3>
              <ul className="admin-list">
                {(data.topProducts || []).map((x) => (
                  <li key={x.name}>
                    <span>{x.name}</span>
                    <strong>{x.quantity}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function CatalogView({
  categories,
  products,
  categoryForm,
  productForm,
  setCategory,
  setProduct,
  editingCategory,
  editingProduct,
  setEditingCategory,
  setEditingProduct,
  onCategory,
  onProduct,
  inventory,
  setInventory,
  onInventory,
  onDeleteCategory,
  onDeleteProduct,
}: {
  onDeleteCategory: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  categories: Category[];
  products: Product[];
  categoryForm: FormState;
  productForm: FormState;
  setCategory: (n: string, v: string | boolean) => void;
  setProduct: (n: string, v: string | boolean) => void;
  editingCategory: string;
  editingProduct: string;
  setEditingCategory: (v: string) => void;
  setEditingProduct: (v: string) => void;
  onCategory: (e: FormEvent) => void;
  onProduct: (e: FormEvent) => void;
  inventory: Record<string, string>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onInventory: (id: string) => void;
}) {
  return (
    <div className="admin-catalog">
      <section className="admin-card">
        <div className="admin-section-heading">
          <h2>Danh mục</h2>
          <span>{categories.length} mục</span>
        </div>
        <form className="admin-form" onSubmit={onCategory}>
          <Field
            label="Mã danh mục"
            name="code"
            value={categoryForm.code}
            onChange={setCategory}
            required
          />
          <Field
            label="Tên"
            name="name"
            value={categoryForm.name}
            onChange={setCategory}
            required
          />
          <Field
            label="Mô tả"
            name="description"
            value={categoryForm.description}
            onChange={setCategory}
          />
          <Field
            label="Ảnh URL (HTTP(S))"
            name="imageUrl"
            value={categoryForm.imageUrl}
            onChange={setCategory}
          />
          <div>
            <button className="button" type="submit">
              {editingCategory ? 'Cập nhật' : 'Tạo danh mục'}
            </button>
            {editingCategory && (
              <button
                className="button button-outline"
                type="button"
                onClick={() => setEditingCategory('')}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
        <ul className="admin-list">
          {categories.map((c) => (
            <li key={c.id}>
              <span>
                <strong>{c.name}</strong>
                <small>{c.code}</small>
              </span>
              <button
                className="button button-outline"
                onClick={() => {
                  setEditingCategory(c.id);
                  setCategory('code', c.code);
                  setCategory('name', c.name);
                  setCategory('description', c.description || '');
                  setCategory('imageUrl', c.imageUrl || '');
                }}
              >
                Sửa
              </button>
              <button className="button button-outline" onClick={() => onDeleteCategory(c.id)}>
                Xóa
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="admin-card">
        <div className="admin-section-heading">
          <h2>Sản phẩm</h2>
          <span>{products.length} sản phẩm</span>
        </div>
        <form className="admin-form" onSubmit={onProduct}>
          <div className="admin-form-grid">
            <Field
              label="Danh mục"
              name="categoryId"
              value={productForm.categoryId}
              onChange={setProduct}
              required
            >
              <select
                value={String(productForm.categoryId)}
                onChange={(e) => setProduct('categoryId', e.target.value)}
                required
              >
                <option value="">Chọn danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Mã sản phẩm"
              name="code"
              value={productForm.code}
              onChange={setProduct}
              required
            />
            <Field
              label="Tên sản phẩm"
              name="name"
              value={productForm.name}
              onChange={setProduct}
              required
            />
            <Field
              label="Giá"
              name="price"
              value={productForm.price}
              onChange={setProduct}
              type="number"
              required
            />
            <Field
              label="Giá gốc"
              name="originalPrice"
              value={productForm.originalPrice}
              onChange={setProduct}
              type="number"
            />
            <Field
              label="Khối lượng (gram)"
              name="shippingWeightGrams"
              value={productForm.shippingWeightGrams}
              onChange={setProduct}
              type="number"
            />
            <Field
              label="Ảnh thumbnail URL"
              name="thumbnailUrl"
              value={productForm.thumbnailUrl}
              onChange={setProduct}
            />
            <Field label="Badge" name="badge" value={productForm.badge} onChange={setProduct} />
            <Field
              label="Section"
              name="section"
              value={productForm.section}
              onChange={setProduct}
            />
          </div>
          <Field
            label="Mô tả"
            name="description"
            value={productForm.description}
            onChange={setProduct}
          />
          <div className="admin-checks">
            <Field
              label="Tùy chỉnh"
              name="isCustomizable"
              value={productForm.isCustomizable}
              onChange={setProduct}
              type="checkbox"
            />
            <Field
              label="Pre-order"
              name="isPreOrder"
              value={productForm.isPreOrder}
              onChange={setProduct}
              type="checkbox"
            />
            <Field
              label="Đang bán"
              name="isActive"
              value={productForm.isActive}
              onChange={setProduct}
              type="checkbox"
            />
          </div>
          <button className="button" type="submit">
            {editingProduct ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
          </button>
        </form>
        <div className="admin-table-wrap">
          <table>
            <caption className="sr-only">Danh sách sản phẩm</caption>
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên</th>
                <th>Giá</th>
                <th>Trạng thái</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.code}</td>
                  <td>{p.name}</td>
                  <td>{money(p.price)}</td>
                  <td>{p.isActive ? 'Đang bán' : 'Tắt'}</td>
                  <td>
                    <button
                      className="button button-outline"
                      onClick={() => {
                        setEditingProduct(p.id);
                        Object.entries(p).forEach(([k, v]) => {
                          if (
                            typeof v === 'string' ||
                            typeof v === 'boolean' ||
                            typeof v === 'number'
                          )
                            setProduct(k, typeof v === 'boolean' ? v : String(v));
                        });
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => onDeleteProduct(p.id)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {products.length > 0 && (
        <section className="admin-card">
          <h2>Điều chỉnh tồn kho</h2>
          <p className="admin-muted">
            Nhập số lượng khả dụng mới. Bucket đã giữ chỗ không bị thay đổi.
          </p>
          <div className="admin-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Đang có</th>
                  <th>Số lượng mới</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{p.quantityAvailable ?? '—'}</td>
                    <td>
                      <input
                        aria-label={`Tồn kho ${p.name}`}
                        type="number"
                        min="0"
                        value={inventory[p.id] ?? String(p.quantityAvailable ?? 0)}
                        onChange={(e) =>
                          setInventory((old) => ({ ...old, [p.id]: e.target.value }))
                        }
                      />
                    </td>
                    <td>
                      <button className="button button-outline" onClick={() => onInventory(p.id)}>
                        Lưu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function DataTable({
  title,
  columns,
  rows,
  empty,
}: {
  title: string;
  columns: string[];
  rows: (string | number)[][];
  empty: string;
}) {
  return (
    <section className="admin-card">
      <div className="admin-section-heading">
        <h2>{title}</h2>
        <span>{rows.length} dòng</span>
      </div>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>{empty}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
