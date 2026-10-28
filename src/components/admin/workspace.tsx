'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  LogOut,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Flower2,
  LayoutDashboard,
  LockKeyhole,
  Package,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';
import CatalogManager from './catalog-manager';
import AdminOperations from './operations';
import AdminOrderOperations from './order-operations';
import { AccountManager, VoucherManager } from './business-tools';
import NotificationReconciliation from './notification-reconciliation';
import PaymentReconciliation from './payment-reconciliation';
import {
  AdminConfirmProvider,
  AdminEmpty,
  AdminLoading,
  AdminPagination,
  statusLabel,
} from './primitives';
import { adminPaths, storeRequest, type AdminMe, type Dashboard } from '@/lib/admin-store';

type View =
  | 'dashboard'
  | 'orders'
  | 'catalog'
  | 'inventory'
  | 'workshops'
  | 'custom'
  | 'vouchers'
  | 'accounts'
  | 'notifications'
  | 'payments'
  | 'audit';
type NavItem = { key: View; label: string; description: string; Icon: LucideIcon };
const groups: { label: string; items: NavItem[] }[] = [
  {
    label: 'Việc của tiệm',
    items: [
      {
        key: 'dashboard',
        label: 'Bàn điều hành',
        description: 'Nắm việc cần làm, rồi đi thẳng vào xử lý.',
        Icon: LayoutDashboard,
      },
      {
        key: 'orders',
        label: 'Đơn hàng',
        description: 'Từ chuẩn bị hoa đến giao hàng, mỗi đơn một nhịp rõ ràng.',
        Icon: ClipboardList,
      },
      {
        key: 'catalog',
        label: 'Sản phẩm',
        description: 'Chăm chút mẫu hoa, giá bán và cách trưng bày.',
        Icon: Package,
      },
      {
        key: 'inventory',
        label: 'Tồn kho',
        description: 'Kiểm tra hàng khả dụng và cập nhật từng sản phẩm.',
        Icon: Boxes,
      },
      {
        key: 'workshops',
        label: 'Workshop',
        description: 'Quản lý lớp, ca học và danh sách tham dự cùng một chỗ.',
        Icon: Flower2,
      },
      {
        key: 'custom',
        label: 'Hoa đặt riêng',
        description: 'Đọc yêu cầu, lên báo giá và theo dõi sản xuất.',
        Icon: Sparkles,
      },
    ],
  },
  {
    label: 'Quản lý chung',
    items: [
      {
        key: 'vouchers',
        label: 'Voucher',
        description: 'Điều kiện, thời hạn và lượt sử dụng minh bạch.',
        Icon: TicketPercent,
      },
      {
        key: 'accounts',
        label: 'Tài khoản',
        description: 'Quản lý người dùng, vai trò và quyền truy cập.',
        Icon: UsersRound,
      },
    ],
  },
  {
    label: 'Kiểm tra & đối soát',
    items: [
      {
        key: 'notifications',
        label: 'Thông báo',
        description: 'Kiểm tra các bản tin chưa rõ kết quả bằng chứng cứ provider.',
        Icon: Bell,
      },
      {
        key: 'payments',
        label: 'Thanh toán thử nghiệm',
        description: 'Chỉ đối soát MoMo sandbox; không thu tiền hoặc hoàn tiền thật.',
        Icon: CircleDollarSign,
      },
      {
        key: 'audit',
        label: 'Nhật ký thay đổi',
        description: 'Tra lại ai đã thay đổi điều gì. Khu vực chỉ đọc.',
        Icon: ScrollText,
      },
    ],
  },
];
const allItems = groups.flatMap((group) => group.items);
const money = (value?: number) =>
  typeof value === 'number'
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(value)
    : '—';
const message = (error: unknown) =>
  error instanceof Error ? error.message : 'Không thể tải dữ liệu. Vui lòng thử lại.';
const viewHref = (view: View, status?: string) =>
  `/quan-tri?${new URLSearchParams({ view, ...(status ? { status } : {}) })}`;

export default function AdminWorkspace(props: { connected: boolean; writesEnabled: boolean }) {
  return (
    <AdminConfirmProvider>
      <Workspace {...props} />
    </AdminConfirmProvider>
  );
}
function Workspace({ connected, writesEnabled }: { connected: boolean; writesEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('view') || 'dashboard';
  const view: View =
    raw === 'operations'
      ? 'workshops'
      : allItems.some((item) => item.key === raw)
        ? (raw as View)
        : 'dashboard';
  const active = allItems.find((item) => item.key === view)!;
  const [me, setMe] = useState<AdminMe | null>(null);
  const [auth, setAuth] = useState<'loading' | 'ready' | 'login' | 'error'>('loading');
  const [error, setError] = useState('');
  const readOnly = !writesEnabled;

  const handleLogout = async () => {
    try {
      await fetch('/api/store/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // ignore
    }
    router.replace('/tai-khoan');
    router.refresh();
  };
  const check = useCallback(async () => {
    setAuth('loading');
    setError('');
    try {
      const response = await fetch('/api/store/auth/me', {
        cache: 'no-store',
        credentials: 'same-origin',
      });
      if (response.status === 401) {
        setAuth('login');
        return;
      }
      if (!response.ok)
        throw new Error('Không thể xác thực phiên làm việc. Hệ thống có thể đang tạm gián đoạn.');
      setMe((await response.json()) as AdminMe);
      setAuth('ready');
    } catch (e) {
      setError(message(e));
      setAuth('error');
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void check(), 0);
    return () => window.clearTimeout(timer);
  }, [check]);
  if (auth !== 'ready' || me?.role !== 'Admin') {
    let content: ReactNode;
    if (auth === 'loading') content = <AdminLoading label="Đang kiểm tra phiên quản trị…" />;
    else if (auth === 'login')
      content = (
        <>
          <LockKeyhole size={30} aria-hidden="true" />
          <h1>Góc này dành cho người của tiệm.</h1>
          <p>Đăng nhập bằng tài khoản Admin để mở công việc quản trị.</p>
          <Link className="button" href="/tai-khoan">
            Đến trang đăng nhập <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </>
      );
    else if (auth === 'error')
      content = (
        <>
          <ShieldCheck size={30} aria-hidden="true" />
          <h1>Chưa mở được góc điều hành</h1>
          <p className="admin-error" role="alert">
            {error}
          </p>
          <button className="button" type="button" onClick={() => void check()}>
            Thử lại
          </button>
        </>
      );
    else
      content = (
        <>
          <LockKeyhole size={30} aria-hidden="true" />
          <h1>Không có quyền truy cập</h1>
          <p>Khu vực này chỉ dành cho tài khoản Admin. Quyền cũng được kiểm tra ở backend.</p>
          <Link className="button" href="/tai-khoan">
            Về trang cá nhân & xem lịch workshop <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </>
      );
    return (
      <div className="admin-shell admin-guard">
        <Link href="/" className="admin-guard-brand">
          <Flower2 size={26} aria-hidden="true" /> Tiệm Hoa Có Gu
        </Link>
        <div className="admin-guard-card">{content}</div>
        <Link href="/" className="admin-return">
          Quay về cửa tiệm <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    );
  }
  return (
    <div className="admin-shell admin-app">
      <a className="skip-link" href="#admin-content">
        Đến công việc đang mở
      </a>
      <aside className="admin-sidebar" aria-label="Khu vực quản trị">
        <Link href={viewHref('dashboard')} className="admin-wordmark">
          <Flower2 size={36} strokeWidth={1.5} aria-hidden="true" />
          <span>
            <small>TIỆM HOA</small>
            <strong>
              có gu<span>.</span>
            </strong>
          </span>
          <span className="admin-wordmark-tag">QUẢN TRỊ</span>
        </Link>
        <nav className="admin-nav" aria-label="Điều hướng quản trị">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <p className="admin-nav-group-title">{group.label}</p>
              {group.items.map(({ key, label, Icon }) => (
                <Link
                  key={key}
                  className={`admin-nav-link${view === key ? ' active' : ''}`}
                  href={viewHref(key)}
                  aria-current={view === key ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={1.7} aria-hidden="true" />
                  <span>{label}</span>
                  {view === key && <span className="admin-nav-marker" aria-hidden="true" />}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-sidebar-end">
          <Link href="/" className="admin-store-link">
            Xem cửa tiệm <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
          <div className="admin-person">
            <span className="admin-avatar" aria-hidden="true">
              {(me.fullName || me.email || 'A').slice(0, 1).toUpperCase()}
            </span>
            <div>
              <strong>{me.fullName || 'Quản trị viên'}</strong>
              <span>
                Admin ·{' '}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="admin-logout-btn"
                  title="Đăng xuất"
                >
                  <LogOut size={11} /> Đăng xuất
                </button>
              </span>
            </div>
          </div>
        </div>
      </aside>
      <div className="admin-workspace">
        <div className="admin-topbar">
          <Link className="admin-mobile-brand" href={viewHref('dashboard')}>
            <Flower2 size={22} aria-hidden="true" />
            <strong>
              Có Gu<span>.</span>
            </strong>
          </Link>
          <span className="admin-topbar-crumb">
            TIỆM HOA CÓ GU <span>/</span> GÓC ĐIỀU HÀNH
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`admin-mode${readOnly ? ' is-readonly' : ''}`}>
              <span aria-hidden="true" />
              {readOnly ? 'Bản xem trước · Chỉ đọc' : 'Quyền quản trị'}
            </span>
            <button
              type="button"
              className="admin-topbar-logout"
              onClick={handleLogout}
              title="Đăng xuất khỏi Bàn điều hành"
            >
              <LogOut size={14} aria-hidden="true" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
        <div className="admin-mobile-switch">
          <label htmlFor="admin-view-select">Khu vực làm việc</label>
          <select
            id="admin-view-select"
            value={view}
            onChange={(e) => router.push(viewHref(e.target.value as View))}
          >
            {groups.map((group) => (
              <optgroup label={group.label} key={group.label}>
                {group.items.map((item) => (
                  <option key={item.key} value={item.key}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div id="admin-content" className="admin-workspace-main" tabIndex={-1}>
          <header className="admin-page-heading">
            <div>
              <p className="admin-overline">
                {groups.find((group) => group.items.some((item) => item.key === view))?.label}
              </p>
              <h1>
                {active.label}
                <span>.</span>
              </h1>
              <p className="admin-muted">{active.description}</p>
            </div>
            <active.Icon className="admin-page-mark" size={40} strokeWidth={1} aria-hidden="true" />
          </header>
          {readOnly && (
            <div className="admin-readonly-note" role="note">
              <LockKeyhole size={16} aria-hidden="true" />
              <p>
                {connected
                  ? 'Dữ liệu sandbox tổng hợp. Bạn có thể xem và mở chi tiết; lưu, xóa và các thao tác nghiệp vụ đang khóa.'
                  : 'Chưa kết nối hệ thống. Không tạo đơn, thanh toán hoặc thay đổi dữ liệu.'}
              </p>
            </div>
          )}
          <div className="admin-panel" key={view}>
            {view === 'dashboard' && <DashboardView />}
            {(view === 'catalog' || view === 'inventory') && (
              <CatalogManager mode={view} readOnly={readOnly} />
            )}
            {view === 'orders' && (
              <AdminOrderOperations
                key={params.get('status') || 'all'}
                initialStatus={params.get('status') || ''}
                readOnly={readOnly}
              />
            )}
            {(view === 'workshops' || view === 'custom') && (
              <AdminOperations mode={view} readOnly={readOnly} />
            )}
            {view === 'vouchers' && <VoucherManager readOnly={readOnly} />}
            {view === 'accounts' && <AccountManager readOnly={readOnly} />}
            {view === 'notifications' && <NotificationReconciliation readOnly={readOnly} />}
            {view === 'payments' && <PaymentReconciliation readOnly={readOnly} />}
            {view === 'audit' && <AuditView />}
          </div>
          <footer className="admin-workspace-footer">
            <Flower2 size={16} aria-hidden="true" />
            <span>Chăm từng việc nhỏ. Giữ gu cho cả tiệm.</span>
            <span>Quyền & nghiệp vụ được kiểm tra ở máy chủ.</span>
          </footer>
        </div>
      </div>
    </div>
  );
}

function DashboardView() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await storeRequest<Dashboard>(adminPaths.dashboard));
      setUpdated(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const tasks = data
    ? [
        {
          label: 'Đơn chờ xử lý',
          hint: 'Mở đơn để chuẩn bị hoa',
          count: data.ordersByStatus?.find((x) => x.status === 'Confirmed')?.count ?? 0,
          href: viewHref('orders', 'Confirmed'),
          Icon: ClipboardList,
        },
        {
          label: 'Đang chuẩn bị',
          hint: 'Kiểm tra trước khi giao',
          count: data.ordersByStatus?.find((x) => x.status === 'Processing')?.count ?? 0,
          href: viewHref('orders', 'Processing'),
          Icon: Package,
        },
        {
          label: 'Đơn đang giao',
          hint: 'Theo dõi phiếu giao nội bộ',
          count: data.ordersByStatus?.find((x) => x.status === 'Delivering')?.count ?? 0,
          href: viewHref('orders', 'Delivering'),
          Icon: ArrowUpRight,
        },
        {
          label: 'Sản phẩm sắp hết',
          hint: 'Kiểm tra danh sách tồn kho',
          count: data.lowStockCount,
          href: viewHref('inventory'),
          Icon: Boxes,
        },
      ]
    : [];
  return (
    <>
      <div className="admin-overview-intro">
        <div>
          <span className="admin-label-sticker">NHỊP TIỆM</span>
          <h2>Bắt nhịp công việc.</h2>
          <p className="admin-muted">Việc cần xử lý ở trước. Những con số ở đúng chỗ.</p>
        </div>
        <button
          className="button button-outline"
          type="button"
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw size={16} aria-hidden="true" />
          {loading ? 'Đang cập nhật' : 'Cập nhật dữ liệu'}
        </button>
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}{' '}
          <button type="button" className="text-link" onClick={() => void load()}>
            Thử lại
          </button>
        </p>
      )}
      {loading && !data ? (
        <AdminLoading label="Đang lấy nhịp công việc từ hệ thống…" />
      ) : (
        data && (
          <>
            <div className="admin-overview-grid">
              <section className="admin-card admin-task-card">
                <div className="admin-section-heading">
                  <div>
                    <p className="admin-overline">01 / VIỆC ĐANG CHẠY</p>
                    <h3>Đi thẳng vào việc</h3>
                  </div>
                  <span className="admin-live-label">Cập nhật {updated}</span>
                </div>
                <div className="admin-task-list">
                  {tasks.map(({ label, hint, count, href, Icon }) => (
                    <Link className="admin-task" href={href} key={label}>
                      <span className="admin-task-icon">
                        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
                      </span>
                      <span>
                        <strong>{label}</strong>
                        <small>{hint}</small>
                      </span>
                      <b>{count}</b>
                      <ArrowRight size={18} aria-hidden="true" />
                    </Link>
                  ))}
                </div>
                <p className="admin-helper">
                  Số liệu toàn hệ thống tại lần cập nhật gần nhất, không tự cập nhật nền.
                </p>
              </section>
              <section className="admin-finance-card">
                <div className="admin-section-heading">
                  <div>
                    <p className="admin-overline">02 / TIỀN CỦA TIỆM</p>
                    <h3>Nhìn rõ dòng tiền</h3>
                  </div>
                  <ArrowDownLeft size={25} aria-hidden="true" />
                </div>
                <div className="admin-finance-primary">
                  <span>Doanh thu ghi nhận</span>
                  <strong>{money(data.revenue)}</strong>
                </div>
                <dl>
                  <div>
                    <dt>Đã thu</dt>
                    <dd>{money(data.paidAmount)}</dd>
                  </div>
                  <div>
                    <dt>Hoàn tiền ghi nhận</dt>
                    <dd>{money(data.refundAmount)}</dd>
                  </div>
                  <div>
                    <dt>Thực thu ròng</dt>
                    <dd>{money(data.netCollected)}</dd>
                  </div>
                </dl>
                <p>Trạng thái đơn không đồng nghĩa đã thu tiền. Đây là dữ liệu sandbox tổng hợp.</p>
              </section>
            </div>
            <div className="admin-stat-strip">
              <div>
                <span>Đơn hàng trong hệ thống</span>
                <strong>{data.orderCount}</strong>
              </div>
              <div>
                <span>Mẫu hoa trong catalog</span>
                <strong>{data.productCount}</strong>
              </div>
              <div>
                <span>Tài khoản khách hàng</span>
                <strong>{data.customerCount}</strong>
              </div>
            </div>
            <div className="admin-overview-lower">
              <section className="admin-card">
                <div className="admin-section-heading">
                  <div>
                    <p className="admin-overline">03 / MẪU HOA</p>
                    <h3>Sản phẩm bán chạy</h3>
                  </div>
                  <Link href={viewHref('catalog')} className="admin-inline-link">
                    Xem sản phẩm <ArrowUpRight size={15} aria-hidden="true" />
                  </Link>
                </div>
                {data.topProducts?.length ? (
                  <ol className="admin-ranked-list">
                    {data.topProducts.map((item, i) => (
                      <li key={`${item.name}-${i}`}>
                        <span className="admin-rank">{String(i + 1).padStart(2, '0')}</span>
                        <strong>{item.name}</strong>
                        <span>{item.quantity} sản phẩm</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <AdminEmpty
                    title="Chưa có dữ liệu bán chạy"
                    description="Danh sách sẽ xuất hiện khi hệ thống có dữ liệu phù hợp."
                  />
                )}
              </section>
              <div className="admin-next-tasks">
                <Link href={viewHref('workshops')} className="admin-task-tile">
                  <Flower2 size={25} aria-hidden="true" />
                  <div>
                    <h3>Hẹn ở xưởng</h3>
                    <p>Ca học, danh sách khách & check-in.</p>
                  </div>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </Link>
                <Link href={viewHref('custom')} className="admin-task-tile">
                  <Sparkles size={24} aria-hidden="true" />
                  <div>
                    <h3>Mỗi bó, một ý riêng</h3>
                    <p>Yêu cầu khách, báo giá & sản xuất.</p>
                  </div>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </>
        )
      )}
    </>
  );
}
function AuditView() {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await storeRequest<{ items: Record<string, unknown>[]; total: number }>(
        `${adminPaths.audit}?page=${page}&pageSize=20`,
      );
      setItems(result.items);
      setTotal(result.total);
    } catch (e) {
      setError(message(e));
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  return (
    <section className="admin-card">
      <div className="admin-section-heading">
        <div>
          <h2>Lịch sử hoạt động</h2>
          <p className="admin-muted">
            Nhật ký do hệ thống ghi nhận. Không chỉnh sửa hoặc xóa tại đây.
          </p>
        </div>
        <button
          className="button button-outline"
          type="button"
          disabled={loading}
          onClick={() => void load()}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Làm mới
        </button>
      </div>
      {error && (
        <p className="admin-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <AdminLoading />
      ) : !items.length ? (
        <AdminEmpty title="Chưa có hoạt động để hiển thị" />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-responsive-table">
            <caption className="sr-only">Nhật ký thay đổi</caption>
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Người thao tác</th>
                <th>Đối tượng</th>
                <th>Thao tác</th>
                <th>Nội dung</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={String(item.id || i)}>
                  <td data-label="Thời điểm">
                    {item.occurredAtUtc
                      ? new Date(String(item.occurredAtUtc)).toLocaleString('vi-VN')
                      : '—'}
                  </td>
                  <td data-label="Người thao tác">
                    <code>{String(item.actorId || 'Hệ thống')}</code>
                  </td>
                  <td data-label="Đối tượng">{String(item.entityType || '—')}</td>
                  <td data-label="Thao tác">{statusLabel(String(item.action || '—'))}</td>
                  <td data-label="Nội dung">{String(item.description || item.entityId || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <AdminPagination page={page} pageSize={20} total={total} loading={loading} onPage={setPage} />
    </section>
  );
}
