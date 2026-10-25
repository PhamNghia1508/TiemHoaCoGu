'use client';
import AdminOperations from '@/components/admin/operations';
import AdminOrderOperations from '@/components/admin/order-operations';
import NotificationReconciliation from '@/components/admin/notification-reconciliation';
import PaymentReconciliation from '@/components/admin/payment-reconciliation';
import {
  VoucherManager,
  AccountManager,
  ProductMediaManager,
} from '@/components/admin/business-tools';
import {
  Bell,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Flower2,
  LayoutDashboard,
  Package,
  ScrollText,
  TicketPercent,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

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

type Tab =
  | 'dashboard'
  | 'catalog'
  | 'inventory'
  | 'orders'
  | 'vouchers'
  | 'accounts'
  | 'notifications'
  | 'payments'
  | 'audit'
  | 'operations';
type FormState = Record<string, string | boolean>;
const adminNavigation: {
  title: string;
  items: { key: Tab; label: string; Icon: LucideIcon }[];
}[] = [
  {
    title: 'Cửa hàng',
    items: [
      { key: 'dashboard', label: 'Tổng quan', Icon: LayoutDashboard },
      { key: 'catalog', label: 'Danh mục & sản phẩm', Icon: Package },
      { key: 'inventory', label: 'Tồn kho', Icon: Boxes },
      { key: 'orders', label: 'Đơn hàng', Icon: ClipboardList },
      { key: 'vouchers', label: 'Voucher', Icon: TicketPercent },
    ],
  },
  {
    title: 'Khách hàng & vận hành',
    items: [
      { key: 'accounts', label: 'Tài khoản', Icon: UsersRound },
      { key: 'operations', label: 'Workshop & đơn đặt riêng', Icon: Flower2 },
    ],
  },
  {
    title: 'Đối soát & hệ thống',
    items: [
      { key: 'notifications', label: 'Thông báo', Icon: Bell },
      { key: 'payments', label: 'Thanh toán sandbox', Icon: CircleDollarSign },
      { key: 'audit', label: 'Audit log', Icon: ScrollText },
    ],
  },
];
const emptyProductForm: FormState = {
  categoryId: '',
  code: '',
  name: '',
  price: '0',
  originalPrice: '',
  thumbnailUrl: '',
  description: '',
  badge: '',
  section: '',
  shippingWeightGrams: '',
  packageLengthCm: '',
  packageWidthCm: '',
  packageHeightCm: '',
  packagingSpecsConfirmed: false,
  isCustomizable: false,
  isPreOrder: false,
  isActive: true,
};
const optionalNumber = (value: string | boolean): number | null => {
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};
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
  min,
  max,
  step,
  children,
}: {
  label: string;
  name: string;
  value: string | boolean;
  onChange: (name: string, value: string | boolean) => void;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
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
          min={min}
          max={max}
          step={step}
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
  const [productForm, setProductForm] = useState<FormState>({ ...emptyProductForm });
  const [editingCategory, setEditingCategory] = useState('');
  const [editingProduct, setEditingProduct] = useState('');
  const [productFormOpen, setProductFormOpen] = useState(false);
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
      <div className="admin-workspace">
        <aside className="admin-sidebar" aria-label="Khu vực quản trị">
          <p className="admin-sidebar-label">KHÔNG GIAN LÀM VIỆC</p>
          <nav className="admin-tabs" aria-label="Điều hướng quản trị">
            {adminNavigation.map((group) => (
              <div className="admin-nav-group" key={group.title}>
                <p className="admin-nav-group-title">{group.title}</p>
                {group.items.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    aria-current={tab === key ? 'page' : undefined}
                    className={tab === key ? 'admin-tab active' : 'admin-tab'}
                    onClick={() => setTab(key)}
                  >
                    <Icon aria-hidden="true" size={17} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <div className="admin-workspace-main">
          <div className="admin-section-kicker">
            {
              adminNavigation.flatMap((group) => group.items).find((item) => item.key === tab)
                ?.label
            }
          </div>
          <div className="admin-panel" key={tab}>
            {tab === 'dashboard' && <DashboardView data={dashboard} />}
            {(tab === 'catalog' || tab === 'inventory') && (
              <fieldset disabled={saving} className="admin-catalog-fieldset">
                <CatalogView
                  mode={tab}
                  onDeleteCategory={(id) => deleteEntry('categories', id)}
                  onDeleteProduct={(id) => deleteEntry('products', id)}
                  categories={categories}
                  products={products}
                  categoryForm={categoryForm}
                  productForm={productForm}
                  setCategory={setCategory}
                  setProduct={setProduct}
                  resetProductForm={() => setProductForm({ ...emptyProductForm })}
                  editingCategory={editingCategory}
                  editingProduct={editingProduct}
                  setEditingCategory={setEditingCategory}
                  setEditingProduct={setEditingProduct}
                  productFormOpen={productFormOpen}
                  setProductFormOpen={setProductFormOpen}
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
                      editingProduct
                        ? `${adminPaths.products}/${editingProduct}`
                        : adminPaths.products,
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
                        shippingWeightGrams: optionalNumber(productForm.shippingWeightGrams),
                        packageLengthCm: optionalNumber(productForm.packageLengthCm),
                        packageWidthCm: optionalNumber(productForm.packageWidthCm),
                        packageHeightCm: optionalNumber(productForm.packageHeightCm),
                        packagingSpecsConfirmed: Boolean(productForm.packagingSpecsConfirmed),
                        isActive: Boolean(productForm.isActive),
                      },
                      editingProduct ? 'PUT' : 'POST',
                      () => {
                        setEditingProduct('');
                        setProductForm({ ...emptyProductForm });
                        setProductFormOpen(false);
                      },
                    )
                  }
                  inventory={inventory}
                  setInventory={setInventory}
                  onInventory={(id) =>
                    run(
                      adminPaths.inventory(id) +
                        `?quantity=${encodeURIComponent(inventory[id] || '0')}`,
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
            {tab === 'notifications' && <NotificationReconciliation />}
            {tab === 'payments' && <PaymentReconciliation />}
            {tab === 'operations' && <AdminOperations />}
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
          </div>
        </div>
      </div>
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
  mode,
  categories,
  products,
  categoryForm,
  productForm,
  setCategory,
  setProduct,
  resetProductForm,
  editingCategory,
  editingProduct,
  setEditingCategory,
  setEditingProduct,
  productFormOpen,
  setProductFormOpen,
  onCategory,
  onProduct,
  inventory,
  setInventory,
  onInventory,
  onDeleteCategory,
  onDeleteProduct,
}: {
  mode: 'catalog' | 'inventory';
  onDeleteCategory: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  categories: Category[];
  products: Product[];
  categoryForm: FormState;
  productForm: FormState;
  setCategory: (n: string, v: string | boolean) => void;
  setProduct: (n: string, v: string | boolean) => void;
  resetProductForm: () => void;
  editingCategory: string;
  editingProduct: string;
  setEditingCategory: (v: string) => void;
  setEditingProduct: (v: string) => void;
  productFormOpen: boolean;
  setProductFormOpen: (v: boolean) => void;
  onCategory: (e: FormEvent) => void;
  onProduct: (e: FormEvent) => void;
  inventory: Record<string, string>;
  setInventory: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onInventory: (id: string) => void;
}) {
  const setPackagingMeasurement = (name: string, value: string | boolean) => {
    setProduct(name, value);
    setProduct('packagingSpecsConfirmed', false);
  };
  return (
    <div className={mode === 'catalog' ? 'admin-catalog' : 'admin-inventory'}>
      {mode === 'catalog' && (
        <>
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
              <div>
                <h2>Sản phẩm</h2>
                <p className="admin-muted">Quản lý thông tin, giá và quy cách đóng gói.</p>
              </div>
              <div className="admin-heading-actions">
                <span>{products.length} sản phẩm</span>
                <button
                  className="button"
                  type="button"
                  onClick={() => {
                    if (!productFormOpen && !editingProduct) resetProductForm();
                    setProductFormOpen(!productFormOpen);
                  }}
                  aria-expanded={productFormOpen}
                >
                  {productFormOpen ? 'Đóng biểu mẫu' : 'Thêm sản phẩm'}
                </button>
              </div>
            </div>
            {productFormOpen && (
              <form className="admin-form admin-product-form" onSubmit={onProduct}>
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
                    label="Trọng lượng kiện hàng (g)"
                    name="shippingWeightGrams"
                    value={productForm.shippingWeightGrams}
                    onChange={setPackagingMeasurement}
                    type="number"
                    required={Boolean(productForm.packagingSpecsConfirmed)}
                    min={1}
                    max={1000000}
                    step={1}
                  />
                  <Field
                    label="Chiều dài kiện (cm)"
                    name="packageLengthCm"
                    value={productForm.packageLengthCm}
                    onChange={setPackagingMeasurement}
                    type="number"
                    required={Boolean(productForm.packagingSpecsConfirmed)}
                    min={0.01}
                    max={10000}
                    step={0.01}
                  />
                  <Field
                    label="Chiều rộng kiện (cm)"
                    name="packageWidthCm"
                    value={productForm.packageWidthCm}
                    onChange={setPackagingMeasurement}
                    type="number"
                    required={Boolean(productForm.packagingSpecsConfirmed)}
                    min={0.01}
                    max={10000}
                    step={0.01}
                  />
                  <Field
                    label="Chiều cao kiện (cm)"
                    name="packageHeightCm"
                    value={productForm.packageHeightCm}
                    onChange={setPackagingMeasurement}
                    type="number"
                    required={Boolean(productForm.packagingSpecsConfirmed)}
                    min={0.01}
                    max={10000}
                    step={0.01}
                  />
                  <p className="admin-muted">
                    Nhập số đo sau khi cân/đo kiện đã đóng gói. Dữ liệu cũ, kể cả 500 g, vẫn chưa
                    được xác nhận và không dùng để báo phí. Nếu chưa có số đo thật, để trống và chưa
                    xác nhận.
                  </p>
                  <Field
                    label="Ảnh thumbnail URL"
                    name="thumbnailUrl"
                    value={productForm.thumbnailUrl}
                    onChange={setProduct}
                  />
                  <Field
                    label="Badge"
                    name="badge"
                    value={productForm.badge}
                    onChange={setProduct}
                  />
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
                    label="Tôi xác nhận đây là trọng lượng và kích thước thực tế của kiện đã đóng gói"
                    name="packagingSpecsConfirmed"
                    value={productForm.packagingSpecsConfirmed}
                    onChange={setProduct}
                    type="checkbox"
                  />
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
                <button
                  className="button button-outline"
                  type="button"
                  onClick={() => {
                    setEditingProduct('');
                    resetProductForm();
                    setProductFormOpen(false);
                  }}
                >
                  Hủy
                </button>
              </form>
            )}
            <div className="admin-table-wrap">
              <table>
                <caption className="sr-only">Danh sách sản phẩm</caption>
                <thead>
                  <tr>
                    <th>Mã</th>
                    <th>Tên</th>
                    <th>Giá</th>
                    <th>Quy cách đóng gói</th>
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
                      <td>
                        {p.packagingSpecsConfirmed
                          ? `${p.shippingWeightGrams} g · ${p.packageLengthCm} × ${p.packageWidthCm} × ${p.packageHeightCm} cm`
                          : `Chưa xác nhận${p.shippingWeightGrams == null ? '' : ` · ${p.shippingWeightGrams} g cũ chưa xác minh`}`}
                      </td>
                      <td>{p.isActive ? 'Đang bán' : 'Tắt'}</td>
                      <td>
                        <button
                          className="button button-outline"
                          onClick={() => {
                            setEditingProduct(p.id);
                            setProductFormOpen(true);
                            const values: FormState = {
                              ...emptyProductForm,
                              categoryId: p.categoryId,
                              code: p.code,
                              name: p.name,
                              price: String(p.price),
                              originalPrice: p.originalPrice == null ? '' : String(p.originalPrice),
                              thumbnailUrl: p.thumbnailUrl ?? '',
                              description: p.description ?? '',
                              badge: p.badge ?? '',
                              section: p.section ?? '',
                              shippingWeightGrams:
                                p.shippingWeightGrams == null ? '' : String(p.shippingWeightGrams),
                              packageLengthCm:
                                p.packageLengthCm == null ? '' : String(p.packageLengthCm),
                              packageWidthCm:
                                p.packageWidthCm == null ? '' : String(p.packageWidthCm),
                              packageHeightCm:
                                p.packageHeightCm == null ? '' : String(p.packageHeightCm),
                              packagingSpecsConfirmed: p.packagingSpecsConfirmed,
                              isCustomizable: p.isCustomizable,
                              isPreOrder: p.isPreOrder,
                              isActive: p.isActive,
                            };
                            Object.entries(values).forEach(([key, value]) =>
                              setProduct(key, value),
                            );
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
        </>
      )}
      {mode === 'inventory' && products.length > 0 && (
        <section className="admin-card">
          <div className="admin-section-heading">
            <div>
              <h2>Tồn kho</h2>
              <p className="admin-muted">
                Cập nhật số lượng khả dụng. Hàng đã giữ chỗ được bảo toàn.
              </p>
            </div>
            <span>{products.length} sản phẩm</span>
          </div>
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
      {mode === 'inventory' && products.length === 0 && (
        <section className="admin-card admin-empty-state">
          <Boxes aria-hidden="true" size={24} />
          <h2>Chưa có sản phẩm để cập nhật</h2>
          <p className="admin-muted">Tạo sản phẩm trong Danh mục & sản phẩm để quản lý tồn kho.</p>
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
