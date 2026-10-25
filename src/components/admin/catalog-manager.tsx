'use client';

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flower2 } from 'lucide-react';
import {
  AdminDialog,
  AdminEmpty,
  AdminLoading,
  AdminPagination,
  StatusBadge,
  useAdminConfirm,
  useDebouncedValue,
} from '@/components/admin/primitives';
import { ProductMediaManager } from '@/components/admin/business-tools';
import { adminPaths, Category, Page, Product, storeRequest } from '@/lib/admin-store';

type Mode = 'catalog' | 'inventory';
type CatalogTab = 'products' | 'categories' | 'media';
type ProductForm = {
  categoryId: string;
  code: string;
  name: string;
  price: string;
  originalPrice: string;
  thumbnailUrl: string;
  description: string;
  badge: string;
  section: string;
  shippingWeightGrams: string;
  packageLengthCm: string;
  packageWidthCm: string;
  packageHeightCm: string;
  packagingSpecsConfirmed: boolean;
  isCustomizable: boolean;
  isPreOrder: boolean;
  isActive: boolean;
};
type CategoryForm = { code: string; name: string; description: string; imageUrl: string };

const emptyProduct: ProductForm = {
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
const emptyCategory: CategoryForm = { code: '', name: '', description: '', imageUrl: '' };
const PAGE_SIZE = 20;
const errorText = (error: unknown) =>
  error instanceof Error ? error.message : 'Không thể thực hiện yêu cầu.';
const money = (value?: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value ?? 0);
const optionalNumber = (value: string) => {
  const raw = value.trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};
const validHttpUrl = (value?: string) => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

function Feedback({
  error,
  notice,
  onRetry,
}: {
  error: string;
  notice: string;
  onRetry?: () => void;
}) {
  return (
    <>
      {error && (
        <p className="admin-error" role="alert">
          {error}{' '}
          {onRetry && (
            <button type="button" className="button button-outline" onClick={onRetry}>
              Thử lại
            </button>
          )}
        </p>
      )}
      {notice && (
        <p className="admin-notice" role="status">
          {notice}
        </p>
      )}
    </>
  );
}
function Field({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
  required = false,
  min,
  step,
  children,
}: {
  label: string;
  value: string | boolean;
  onChange?: (value: string | boolean) => void;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  min?: number;
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
          type={type}
          required={required}
          disabled={disabled}
          min={min}
          step={step}
          value={type === 'checkbox' ? undefined : String(value)}
          checked={type === 'checkbox' ? Boolean(value) : undefined}
          onChange={(event) =>
            onChange?.(type === 'checkbox' ? event.target.checked : event.target.value)
          }
        />
      )}
    </label>
  );
}
function categoryName(categories: Category[], id: string) {
  return categories.find((category) => category.id === id)?.name || 'Chưa phân loại';
}
function productToForm(product: Product): ProductForm {
  return {
    categoryId: product.categoryId,
    code: product.code,
    name: product.name,
    price: String(product.price),
    originalPrice: product.originalPrice == null ? '' : String(product.originalPrice),
    thumbnailUrl: product.thumbnailUrl ?? '',
    description: product.description ?? '',
    badge: product.badge ?? '',
    section: product.section ?? '',
    shippingWeightGrams:
      product.shippingWeightGrams == null ? '' : String(product.shippingWeightGrams),
    packageLengthCm: product.packageLengthCm == null ? '' : String(product.packageLengthCm),
    packageWidthCm: product.packageWidthCm == null ? '' : String(product.packageWidthCm),
    packageHeightCm: product.packageHeightCm == null ? '' : String(product.packageHeightCm),
    packagingSpecsConfirmed: product.packagingSpecsConfirmed,
    isCustomizable: product.isCustomizable,
    isPreOrder: product.isPreOrder,
    isActive: product.isActive,
  };
}

export default function CatalogManager({
  mode,
  readOnly = false,
}: {
  mode: Mode;
  readOnly?: boolean;
}) {
  const [tab, setTab] = useState<CatalogTab>('products');
  const [products, setProducts] = useState<Page<Product>>({
    items: [],
    total: 0,
    page: 1,
    pageSize: PAGE_SIZE,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [categorySearch, setCategorySearch] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [productDialog, setProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [busy, setBusy] = useState(false);
  const [productDialogError, setProductDialogError] = useState('');
  const [categoryDialogError, setCategoryDialogError] = useState('');
  const [inventoryValues, setInventoryValues] = useState<Record<string, string>>({});
  const [inventoryBusy, setInventoryBusy] = useState<Record<string, boolean>>({});
  const [selectedMediaProduct, setSelectedMediaProduct] = useState<Product | null>(null);
  const requestSequence = useRef(0);
  const confirm = useAdminConfirm();

  const load = useCallback(
    async (requestedPage = page) => {
      const sequence = ++requestSequence.current;
      setLoading(true);
      setError('');
      try {
        const query = new URLSearchParams({
          page: String(requestedPage),
          pageSize: String(PAGE_SIZE),
        });
        if (debouncedSearch.trim()) query.set('search', debouncedSearch.trim());
        const [productPage, categoryList] = await Promise.all([
          storeRequest<Page<Product>>(`${adminPaths.products}?${query.toString()}`),
          storeRequest<Category[]>(adminPaths.categories),
        ]);
        if (sequence !== requestSequence.current) return;
        setProducts(productPage);
        setPage(productPage.page || requestedPage);
        setCategories(categoryList);
        setInventoryValues((old) => {
          const next = { ...old };
          productPage.items.forEach((product) => {
            if (next[product.id] === undefined)
              next[product.id] = String(product.quantityAvailable ?? 0);
          });
          return next;
        });
      } catch (loadError) {
        if (sequence === requestSequence.current) setError(errorText(loadError));
      } finally {
        if (sequence === requestSequence.current) setLoading(false);
      }
    },
    [debouncedSearch, page],
  );
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const resetProduct = () => {
    setEditingProduct(null);
    setProductForm(emptyProduct);
    setProductDialogError('');
    setProductDialog(true);
  };
  const openProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm(productToForm(product));
    setProductDialogError('');
    setProductDialog(true);
  };
  const closeProduct = () => {
    setProductDialog(false);
    setEditingProduct(null);
    setProductForm(emptyProduct);
    setProductDialogError('');
  };
  const submitProduct = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly || busy) return;
    const allSpecsPositive = [
      productForm.shippingWeightGrams,
      productForm.packageLengthCm,
      productForm.packageWidthCm,
      productForm.packageHeightCm,
    ].every((value) => {
      const number = Number(value);
      return value.trim() !== '' && Number.isFinite(number) && number > 0;
    });
    if (productForm.packagingSpecsConfirmed && !allSpecsPositive) {
      setProductDialogError(
        'Hãy nhập số đo đóng gói dương cho đủ trọng lượng, dài, rộng và cao trước khi xác nhận.',
      );
      return;
    }
    setBusy(true);
    setError('');
    setProductDialogError('');
    setNotice('');
    const body = {
      categoryId: productForm.categoryId,
      code: productForm.code,
      name: productForm.name,
      price: Number(productForm.price),
      originalPrice: optionalNumber(productForm.originalPrice),
      thumbnailUrl: productForm.thumbnailUrl.trim() || null,
      description: productForm.description.trim() || null,
      badge: productForm.badge.trim() || null,
      section: productForm.section.trim() || null,
      isCustomizable: productForm.isCustomizable,
      isPreOrder: productForm.isPreOrder,
      shippingWeightGrams: optionalNumber(productForm.shippingWeightGrams),
      packageLengthCm: optionalNumber(productForm.packageLengthCm),
      packageWidthCm: optionalNumber(productForm.packageWidthCm),
      packageHeightCm: optionalNumber(productForm.packageHeightCm),
      packagingSpecsConfirmed: productForm.packagingSpecsConfirmed && allSpecsPositive,
      isActive: productForm.isActive,
    };
    try {
      await storeRequest<Product>(
        editingProduct ? `${adminPaths.products}/${editingProduct.id}` : adminPaths.products,
        body,
        editingProduct ? 'PUT' : 'POST',
      );
      setNotice(editingProduct ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm.');
      closeProduct();
      await load(page);
    } catch (saveError) {
      setProductDialogError(errorText(saveError));
    } finally {
      setBusy(false);
    }
  };
  const openCategory = (category?: Category) => {
    setEditingCategory(category ?? null);
    setCategoryForm(
      category
        ? {
            code: category.code,
            name: category.name,
            description: category.description ?? '',
            imageUrl: category.imageUrl ?? '',
          }
        : emptyCategory,
    );
    setCategoryDialogError('');
    setCategoryDialog(true);
  };
  const closeCategory = () => {
    setCategoryDialog(false);
    setEditingCategory(null);
    setCategoryForm(emptyCategory);
    setCategoryDialogError('');
  };
  const submitCategory = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly || busy) return;
    setBusy(true);
    setError('');
    setCategoryDialogError('');
    setNotice('');
    try {
      await storeRequest<Category>(
        editingCategory ? `${adminPaths.categories}/${editingCategory.id}` : adminPaths.categories,
        {
          code: categoryForm.code,
          name: categoryForm.name,
          description: categoryForm.description,
          imageUrl: categoryForm.imageUrl,
        },
        editingCategory ? 'PUT' : 'POST',
      );
      setNotice(editingCategory ? 'Đã cập nhật danh mục.' : 'Đã tạo danh mục.');
      closeCategory();
      await load(page);
    } catch (saveError) {
      setCategoryDialogError(errorText(saveError));
    } finally {
      setBusy(false);
    }
  };
  const remove = async (kind: 'categories' | 'products', id: string, label: string) => {
    if (
      readOnly ||
      busy ||
      !(await confirm({
        title: `Xóa ${kind === 'categories' ? 'danh mục' : 'sản phẩm'} này?`,
        description: `${label}. Backend sẽ từ chối nếu mục còn dữ liệu liên quan.`,
        confirmLabel: 'Xóa',
        destructive: true,
      }))
    )
      return;
    setBusy(true);
    setError('');
    try {
      await storeRequest(
        `${kind === 'categories' ? adminPaths.categories : adminPaths.products}/${id}`,
        undefined,
        'DELETE',
      );
      setNotice('Đã xóa.');
      await load(page);
    } catch (removeError) {
      setError(errorText(removeError));
    } finally {
      setBusy(false);
    }
  };
  const saveInventory = async (product: Product) => {
    if (readOnly || inventoryBusy[product.id]) return;
    const raw = inventoryValues[product.id] ?? String(product.quantityAvailable ?? 0);
    const value = Number(raw);
    if (!/^\d+$/.test(raw.trim()) || !Number.isInteger(value) || value < 0) {
      setError(`Tồn kho của ${product.name} phải là số nguyên không âm.`);
      return;
    }
    setInventoryBusy((old) => ({ ...old, [product.id]: true }));
    setError('');
    setNotice('');
    try {
      await storeRequest(
        adminPaths.inventory(product.id) + `?quantity=${encodeURIComponent(String(value))}`,
        undefined,
        'PUT',
      );
      setNotice(`Đã cập nhật tồn kho: ${product.name}.`);
      await load(page);
    } catch (saveError) {
      setError(`Không thể cập nhật ${product.name}: ${errorText(saveError)}`);
    } finally {
      setInventoryBusy((old) => ({ ...old, [product.id]: false }));
    }
  };

  const title = mode === 'inventory' ? 'Danh sách tồn kho' : 'Danh sách sản phẩm';
  const activeTab = mode === 'inventory' ? 'products' : tab;
  const hasProducts = products.items.length > 0;
  const categoryCount = useMemo(() => categories.length, [categories]);
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    return query
      ? categories.filter((category) =>
          `${category.name} ${category.code}`.toLowerCase().includes(query),
        )
      : categories;
  }, [categories, categorySearch]);
  return (
    <section className="admin-card">
      <div className="admin-section-heading">
        <div>
          <h2>{title}</h2>
          <p className="admin-muted">
            {readOnly
              ? 'Chế độ chỉ đọc — thao tác ghi đã bị vô hiệu hóa.'
              : mode === 'inventory'
                ? 'Cập nhật số lượng khả dụng; hàng đã giữ chỗ được bảo toàn.'
                : 'Quản lý sản phẩm, danh mục và quy cách đóng gói.'}
          </p>
        </div>
        {mode === 'catalog' && activeTab === 'products' && !readOnly && (
          <button type="button" className="button" onClick={resetProduct}>
            Thêm sản phẩm
          </button>
        )}
      </div>
      {mode === 'catalog' && (
        <div className="admin-filter-tabs" aria-label="Khu vực catalog">
          <button
            type="button"
            aria-pressed={tab === 'products'}
            className={tab === 'products' ? 'is-selected' : ''}
            onClick={() => setTab('products')}
          >
            Sản phẩm
          </button>
          <button
            type="button"
            aria-pressed={tab === 'categories'}
            className={tab === 'categories' ? 'is-selected' : ''}
            onClick={() => setTab('categories')}
          >
            Danh mục ({categoryCount})
          </button>
          <button
            type="button"
            aria-pressed={tab === 'media'}
            className={tab === 'media' ? 'is-selected' : ''}
            onClick={() => setTab('media')}
          >
            Ảnh sản phẩm
          </button>
        </div>
      )}
      <Feedback error={error} notice={notice} onRetry={() => void load(page)} />
      {activeTab === 'categories' ? (
        <div className="admin-toolbar">
          <label className="admin-field">
            <span>Tìm danh mục</span>
            <input
              aria-label="Tìm danh mục"
              placeholder="Tên hoặc mã danh mục"
              value={categorySearch}
              onChange={(event) => setCategorySearch(event.target.value)}
            />
          </label>
        </div>
      ) : (
        <div className="admin-toolbar">
          <label className="admin-field">
            <span>Tìm kiếm</span>
            <input
              aria-label="Tìm sản phẩm"
              placeholder="Tên hoặc mã sản phẩm"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
      )}
      {activeTab === 'media' ? (
        <MediaTab
          products={products.items}
          selected={selectedMediaProduct}
          onSelect={setSelectedMediaProduct}
          readOnly={readOnly}
        />
      ) : activeTab === 'categories' ? (
        <CategoryTab
          categories={filteredCategories}
          readOnly={readOnly}
          onEdit={openCategory}
          onDelete={(id, label) => void remove('categories', id, label)}
          onCreate={() => openCategory()}
        />
      ) : loading ? (
        <AdminLoading label="Đang tải sản phẩm…" />
      ) : !hasProducts ? (
        <AdminEmpty
          title="Chưa có sản phẩm phù hợp"
          description={
            error ? 'Không thể hiển thị dữ liệu.' : 'Thử đổi từ khóa hoặc tạo sản phẩm mới.'
          }
        >
          {!readOnly && (
            <button type="button" className="button" onClick={resetProduct}>
              Thêm sản phẩm
            </button>
          )}
        </AdminEmpty>
      ) : mode === 'inventory' ? (
        <InventoryTable
          products={products.items}
          values={inventoryValues}
          readOnly={readOnly}
          busy={inventoryBusy}
          onChange={(id, value) => setInventoryValues((old) => ({ ...old, [id]: value }))}
          onSave={(product) => void saveInventory(product)}
        />
      ) : (
        <ProductTable
          products={products.items}
          categories={categories}
          readOnly={readOnly}
          onEdit={openProduct}
          onDelete={(product) =>
            void remove('products', product.id, `${product.name} (${product.code})`)
          }
          onMedia={(product) => {
            setSelectedMediaProduct(product);
            setTab('media');
          }}
        />
      )}
      {activeTab !== 'categories' && (
        <AdminPagination
          page={products.page || page}
          pageSize={products.pageSize || PAGE_SIZE}
          total={products.total}
          loading={loading}
          onPage={(nextPage) => setPage(nextPage)}
        />
      )}
      <ProductDialog
        open={productDialog}
        onClose={closeProduct}
        form={productForm}
        setForm={setProductForm}
        categories={categories}
        editing={!!editingProduct}
        readOnly={readOnly}
        busy={busy}
        error={productDialogError}
        onSubmit={submitProduct}
      />
      <CategoryDialog
        open={categoryDialog}
        onClose={closeCategory}
        form={categoryForm}
        setForm={setCategoryForm}
        editing={!!editingCategory}
        readOnly={readOnly}
        busy={busy}
        error={categoryDialogError}
        onSubmit={submitCategory}
      />
    </section>
  );
}

/* eslint-disable @next/next/no-img-element -- product thumbnail URLs are backend-owned and must remain unoptimized. */
function ProductTable({
  products,
  categories,
  readOnly,
  onEdit,
  onDelete,
  onMedia,
}: {
  products: Product[];
  categories: Category[];
  readOnly: boolean;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onMedia: (product: Product) => void;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-responsive-table">
        <caption className="sr-only">Danh sách sản phẩm</caption>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Giá</th>
            <th>Khả dụng</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td data-label="Sản phẩm">
                <div className="admin-product-identity">
                  {validHttpUrl(product.thumbnailUrl) ? (
                    <img src={product.thumbnailUrl} alt="" width={48} height={48} />
                  ) : (
                    <Flower2 size={24} aria-hidden="true" />
                  )}
                  <span>
                    <strong>{product.name}</strong>
                    <small className="admin-muted">{product.code}</small>
                    <small className="admin-muted">
                      {categoryName(categories, product.categoryId)}
                    </small>
                  </span>
                </div>
              </td>
              <td data-label="Giá">{money(product.price)}</td>
              <td data-label="Khả dụng">{product.quantityAvailable ?? '—'}</td>
              <td data-label="Trạng thái">
                <div className="admin-product-state">
                  <StatusBadge status={product.isActive ? 'Active' : 'Inactive'} />
                  <small className="admin-muted">
                    Đóng gói: {product.packagingSpecsConfirmed ? 'đã xác minh' : 'chưa xác minh'}
                  </small>
                </div>
              </td>
              <td data-label="Thao tác">
                <div className="admin-actions">
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => onEdit(product)}
                  >
                    {readOnly ? 'Xem' : 'Sửa'}
                  </button>
                  <button
                    type="button"
                    className="button button-outline"
                    onClick={() => onMedia(product)}
                  >
                    Ảnh
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      className="button button-danger"
                      onClick={() => onDelete(product)}
                    >
                      Xóa
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
/* eslint-enable @next/next/no-img-element */

function InventoryTable({
  products,
  values,
  readOnly,
  busy,
  onChange,
  onSave,
}: {
  products: Product[];
  values: Record<string, string>;
  readOnly: boolean;
  busy: Record<string, boolean>;
  onChange: (id: string, value: string) => void;
  onSave: (product: Product) => void;
}) {
  return (
    <div className="admin-table-wrap">
      <table className="admin-responsive-table">
        <caption className="sr-only">Danh sách tồn kho</caption>
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Đang có</th>
            <th>Số lượng mới</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td data-label="Sản phẩm">
                <strong>{product.name}</strong>
                <small className="admin-muted">{product.code}</small>
              </td>
              <td data-label="Đang có">
                {product.quantityAvailable ?? '—'}{' '}
                <span className="admin-muted">(hàng giữ chỗ vẫn được bảo toàn)</span>
              </td>
              <td data-label="Số lượng mới">
                <input
                  aria-label={`Khả dụng ${product.name}`}
                  type="number"
                  min="0"
                  step="1"
                  inputMode="numeric"
                  disabled={readOnly || busy[product.id]}
                  value={values[product.id] ?? String(product.quantityAvailable ?? 0)}
                  onChange={(event) => onChange(product.id, event.target.value)}
                />
              </td>
              <td data-label="Thao tác">
                <button
                  type="button"
                  className="button button-outline"
                  disabled={readOnly || busy[product.id]}
                  onClick={() => onSave(product)}
                >
                  {busy[product.id] ? 'Đang lưu…' : readOnly ? 'Chỉ đọc' : 'Lưu'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryTab({
  categories,
  readOnly,
  onCreate,
  onEdit,
  onDelete,
}: {
  categories: Category[];
  readOnly: boolean;
  onCreate: () => void;
  onEdit: (category: Category) => void;
  onDelete: (id: string, label: string) => void;
}) {
  return (
    <div className="admin-record-list">
      {!categories.length ? (
        <AdminEmpty title="Chưa có danh mục" description="Không tìm thấy danh mục phù hợp." />
      ) : (
        categories.map((category) => (
          <article className="admin-record" key={category.id}>
            <div>
              <strong>{category.name}</strong>
              <p className="admin-muted">
                {category.code} · {category.description || 'Không có mô tả'}
              </p>
            </div>
            <div className="admin-actions">
              <button
                type="button"
                className="button button-outline"
                onClick={() => onEdit(category)}
              >
                {readOnly ? 'Xem' : 'Sửa'}
              </button>
              {!readOnly && (
                <button
                  type="button"
                  className="button button-danger"
                  onClick={() => onDelete(category.id, `${category.name} (${category.code})`)}
                >
                  Xóa
                </button>
              )}
            </div>
          </article>
        ))
      )}
      {!readOnly && (
        <button type="button" className="button" onClick={onCreate}>
          Tạo danh mục
        </button>
      )}
    </div>
  );
}

function MediaTab({
  products,
  selected,
  onSelect,
  readOnly,
}: {
  products: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
  readOnly: boolean;
}) {
  return (
    <div className="admin-grid-two">
      <div className="admin-record-list">
        <h3 className="admin-section-heading">Chọn sản phẩm</h3>
        {!products.length ? (
          <AdminEmpty title="Chưa có sản phẩm" />
        ) : (
          products.map((product) => (
            <button
              type="button"
              className={`admin-record ${selected?.id === product.id ? 'is-selected' : ''}`}
              key={product.id}
              onClick={() => onSelect(product)}
            >
              <span>
                <strong>{product.name}</strong>
                <small className="admin-muted">{product.code}</small>
              </span>
            </button>
          ))
        )}
      </div>
      <div className="admin-card">
        {selected ? (
          <ProductMediaManager productId={selected.id} readOnly={readOnly} />
        ) : (
          <AdminEmpty title="Chưa chọn sản phẩm" description="Chọn một sản phẩm để xem ảnh." />
        )}
      </div>
    </div>
  );
}

function ProductDialog({
  open,
  onClose,
  form,
  setForm,
  categories,
  editing,
  readOnly,
  busy,
  error,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  form: ProductForm;
  setForm: (form: ProductForm) => void;
  categories: Category[];
  editing: boolean;
  readOnly: boolean;
  busy: boolean;
  error: string;
  onSubmit: (event: FormEvent) => void;
}) {
  const change = (key: keyof ProductForm, value: string | boolean) =>
    setForm({ ...form, [key]: value });
  const measurement = (key: keyof ProductForm, value: string | boolean) =>
    setForm({ ...form, [key]: value, packagingSpecsConfirmed: false });
  const allSpecsPositive = [
    form.shippingWeightGrams,
    form.packageLengthCm,
    form.packageWidthCm,
    form.packageHeightCm,
  ].every((value) => {
    const number = Number(value);
    return value.trim() !== '' && Number.isFinite(number) && number > 0;
  });
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title={editing ? (readOnly ? 'Xem sản phẩm' : 'Sửa sản phẩm') : 'Tạo sản phẩm'}
      description={readOnly ? 'Chế độ chỉ đọc — biểu mẫu chỉ để xem.' : undefined}
      wide
    >
      <form className="admin-form" onSubmit={onSubmit}>
        <Feedback error={error} notice="" />
        <div className="admin-form-section">
          <h3>Thông tin</h3>
          <div className="admin-form-grid">
            <Field label="Danh mục" value={form.categoryId} disabled={readOnly || busy} required>
              <select
                aria-label="Danh mục"
                required
                disabled={readOnly || busy}
                value={form.categoryId}
                onChange={(event) => change('categoryId', event.target.value)}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Mã sản phẩm"
              value={form.code}
              disabled={readOnly || busy}
              required
              onChange={(value) => change('code', value)}
            />
            <Field
              label="Tên sản phẩm"
              value={form.name}
              disabled={readOnly || busy}
              required
              onChange={(value) => change('name', value)}
            />
            <Field
              label="Ảnh thumbnail URL"
              value={form.thumbnailUrl}
              disabled={readOnly || busy}
              onChange={(value) => change('thumbnailUrl', value)}
            />
            <Field
              label="Nhãn nổi bật"
              value={form.badge}
              disabled={readOnly || busy}
              onChange={(value) => change('badge', value)}
            />
            <Field
              label="Khu vực hiển thị"
              value={form.section}
              disabled={readOnly || busy}
              onChange={(value) => change('section', value)}
            />
          </div>
          <p className="admin-helper">
            Nhãn nổi bật và khu vực hiển thị được lưu theo giá trị hiện có của sản phẩm.
          </p>
          <Field
            label="Mô tả"
            value={form.description}
            disabled={readOnly || busy}
            onChange={(value) => change('description', value)}
          />
        </div>
        <div className="admin-form-section">
          <h3>Giá & trưng bày</h3>
          <div className="admin-form-grid">
            <Field
              label="Giá"
              value={form.price}
              type="number"
              min={0}
              step={1}
              disabled={readOnly || busy}
              required
              onChange={(value) => change('price', value)}
            />
            <Field
              label="Giá gốc (không bắt buộc)"
              value={form.originalPrice}
              type="number"
              min={0}
              step={1}
              disabled={readOnly || busy}
              onChange={(value) => change('originalPrice', value)}
            />
            <Field
              label="Tùy chỉnh"
              value={form.isCustomizable}
              type="checkbox"
              disabled={readOnly || busy}
              onChange={(value) => change('isCustomizable', value)}
            />
            <Field
              label="Đặt trước"
              value={form.isPreOrder}
              type="checkbox"
              disabled={readOnly || busy}
              onChange={(value) => change('isPreOrder', value)}
            />
            <Field
              label="Đang bán"
              value={form.isActive}
              type="checkbox"
              disabled={readOnly || busy}
              onChange={(value) => change('isActive', value)}
            />
          </div>
        </div>
        <div className="admin-form-section">
          <h3>Đóng gói</h3>
          <p className="admin-helper">
            Nhập số đo thực tế của kiện đã đóng gói. Khi thiếu số đo hoặc chưa xác nhận, phí giao
            hàng và thanh toán sẽ chưa được tính.
          </p>
          <div className="admin-form-grid">
            <Field
              label="Trọng lượng (g)"
              value={form.shippingWeightGrams}
              type="number"
              min={1}
              step={1}
              disabled={readOnly || busy}
              onChange={(value) => measurement('shippingWeightGrams', value)}
            />
            <Field
              label="Chiều dài (cm)"
              value={form.packageLengthCm}
              type="number"
              min={0.01}
              step={0.01}
              disabled={readOnly || busy}
              onChange={(value) => measurement('packageLengthCm', value)}
            />
            <Field
              label="Chiều rộng (cm)"
              value={form.packageWidthCm}
              type="number"
              min={0.01}
              step={0.01}
              disabled={readOnly || busy}
              onChange={(value) => measurement('packageWidthCm', value)}
            />
            <Field
              label="Chiều cao (cm)"
              value={form.packageHeightCm}
              type="number"
              min={0.01}
              step={0.01}
              disabled={readOnly || busy}
              onChange={(value) => measurement('packageHeightCm', value)}
            />
          </div>
          <Field
            label="Xác nhận số đo đóng gói thực tế"
            value={form.packagingSpecsConfirmed}
            type="checkbox"
            disabled={readOnly || busy || !allSpecsPositive}
            onChange={(value) => change('packagingSpecsConfirmed', value)}
          />
        </div>
        <div className="admin-form-actions">
          <button type="button" className="button button-outline" disabled={busy} onClick={onClose}>
            Đóng
          </button>
          {!readOnly && (
            <button type="submit" className="button" disabled={busy}>
              {busy ? 'Đang lưu…' : editing ? 'Lưu sản phẩm' : 'Tạo sản phẩm'}
            </button>
          )}
        </div>
      </form>
    </AdminDialog>
  );
}

function CategoryDialog({
  open,
  onClose,
  form,
  setForm,
  editing,
  readOnly,
  busy,
  error,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  form: CategoryForm;
  setForm: (form: CategoryForm) => void;
  editing: boolean;
  readOnly: boolean;
  busy: boolean;
  error: string;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <AdminDialog
      open={open}
      onClose={onClose}
      title={editing ? (readOnly ? 'Xem danh mục' : 'Sửa danh mục') : 'Tạo danh mục'}
      description={readOnly ? 'Chế độ chỉ đọc — biểu mẫu chỉ để xem.' : undefined}
    >
      <form className="admin-form" onSubmit={onSubmit}>
        <Feedback error={error} notice="" />
        <div className="admin-form-grid">
          <Field
            label="Mã danh mục"
            value={form.code}
            disabled={readOnly || busy}
            required
            onChange={(value) => setForm({ ...form, code: String(value) })}
          />
          <Field
            label="Tên danh mục"
            value={form.name}
            disabled={readOnly || busy}
            required
            onChange={(value) => setForm({ ...form, name: String(value) })}
          />
          <Field
            label="Mô tả"
            value={form.description}
            disabled={readOnly || busy}
            onChange={(value) => setForm({ ...form, description: String(value) })}
          />
          <Field
            label="Ảnh URL"
            value={form.imageUrl}
            disabled={readOnly || busy}
            onChange={(value) => setForm({ ...form, imageUrl: String(value) })}
          />
        </div>
        <div className="admin-form-actions">
          <button type="button" className="button button-outline" disabled={busy} onClick={onClose}>
            Đóng
          </button>
          {!readOnly && (
            <button type="submit" className="button" disabled={busy}>
              {busy ? 'Đang lưu…' : editing ? 'Lưu danh mục' : 'Tạo danh mục'}
            </button>
          )}
        </div>
      </form>
    </AdminDialog>
  );
}
