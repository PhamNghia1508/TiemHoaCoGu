# Tích hợp frontend và backend

Frontend Next.js dùng API ASP.NET Core của `ZidenVN/TiemHoaCoGu_BE`. Luồng đã nối dùng dữ liệu và GUID backend; không biến dữ liệu mẫu thành đơn, tồn kho hoặc vé thật.

## Hai chế độ chạy

| Cấu hình                          | Hành vi                                                                                                         |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Không có `API_BASE_URL`           | Catalog mẫu; form đặt hoa, đặt riêng và workshop chỉ xem trước, không ghi backend.                              |
| Có `API_BASE_URL`                 | SSR đọc danh mục, sản phẩm, workshop và ca học. Lỗi API báo không khả dụng, không fallback demo.                |
| `STOREFRONT_WRITES_ENABLED=false` | Chỉ đọc nghiệp vụ; đăng ký/đăng nhập/đăng xuất vẫn hoạt động. Ghi nghiệp vụ bị chặn 503.                        |
| `STOREFRONT_WRITES_ENABLED=true`  | Cho phép thao tác ghi đã whitelist; vẫn cần auth, quyền và kiểm tra nghiệp vụ backend. Không bật provider thật. |

Không dùng `NEXT_PUBLIC_` cho URL nội bộ, token hoặc secret. Không commit `.env.local`, mật khẩu admin hoặc dữ liệu cá nhân.

## Các phần đã nối

**Catalog:** adapter server `src/lib/storefront.ts` map giá, GUID và category thật. Tải các trang tới tối đa 1.000 sản phẩm; vượt giới hạn sẽ báo lỗi thay vì âm thầm cắt danh mục. Chi tiết dùng GUID và tồn kho tại thời điểm tải, không coi thêm vào túi là giữ hàng. Catalog lỗi không được biến thành catalog mẫu.

**Ảnh:** URL HTTP(S) hợp lệ được trình duyệt tải trực tiếp, không dùng image optimizer fetch URL tùy ý trên server. Media quản lý `/api/media/<32 hex>.(png|jpg|webp)` qua proxy cố định có timeout, kiểm tra loại và giới hạn 8 MiB. Không có proxy URL tùy ý. Ảnh thiếu có nhãn minh họa.

**Tài khoản:** `/tai-khoan` có đăng ký, đăng nhập, đăng xuất, đổi mật khẩu, sổ địa chỉ CRUD và giỏ máy chủ. Lưu/khôi phục giỏ tài khoản là thao tác chủ động; không tự trộn giỏ. Dữ liệu cục bộ chỉ gồm mã sản phẩm/số lượng và yêu thích, không PII/token. UI giới hạn 20 đơn vị mỗi sản phẩm và giải thích khi khôi phục giỏ.

**Checkout:** lấy `shipping/quote` trước, hiển thị phí và hạn dùng rồi mới cho xác nhận tạo đơn. Giữ payload và idempotency key khi thử lại cùng lần gửi. Giá/tổng cuối do backend quyết định. Trong sandbox hiện tại vận chuyển bị khóa fail-closed cho đến khi GHN adapter và ánh xạ địa chỉ được xác minh; provider chưa sẵn sàng phải báo lỗi, không tự đặt phí 0 hoặc giả thành công. Khi payment sandbox đã cấu hình, checkout kiểm tra readiness trước khi tạo đơn, tạo đúng một MoMo charge với idempotency key, chỉ chuyển hướng tới host thanh toán thử nghiệm đã cho phép; trang quay về bỏ qua query claims và đọc số dư/trạng thái tin cậy từ backend.

**Hoa đặt riêng:** chọn sản phẩm customizable thật; tạo, đọc/sửa yêu cầu theo trạng thái, xem và duyệt phiên báo giá rồi checkout. Tra cứu hỗ trợ tiếp tục sau khi tải lại trang. Đơn chờ thanh toán không có nghĩa là đã nhận tiền hay bắt đầu sản xuất.

**Workshop:** chọn session ID thật; dữ liệu ca mở/tương lai/còn chỗ chỉ đúng tại thời điểm tải. Backend quyết định hold và trả thời hạn. UI phân biệt giữ chỗ, thanh toán và xác nhận, không phát hành vé giả.

**Tra cứu:** `/tra-cuu` dùng phiên đăng nhập để xem đơn/giao hàng, booking và yêu cầu riêng. Không tra cứu công khai lịch sử khách bằng mã và số điện thoại.

**CMS:** `/quan-tri` dành cho Admin: dashboard, danh mục/sản phẩm, tồn kho, workshop/session/roster và báo giá riêng. Form sản phẩm yêu cầu nhập trọng lượng đóng gói dương theo gram, không tự điền 500 g cho SKU mới; giá trị 500 g cũ phải được cân/xác nhận. Có CRUD voucher, quản lý tài khoản/quyền/reset mật khẩu, gallery/upload media, phân trang/lọc đơn, cập nhật trạng thái, phiếu giao nội bộ, check-in roster và xuất CSV. Tab **Thanh toán sandbox** tra cứu MoMo và chỉ cho xác nhận các kết quả cuối; lúc ghi sổ backend truy vấn MoMo lại, xác minh partner/order/request/amount/result và tự tạo bằng chứng đối soát. Pending/authorized/kết quả lạ vẫn bị giữ, không tự retry. Tab **Thông báo** liệt kê ID của bản tin `Unknown` (không lộ địa chỉ nhận/nội dung) và yêu cầu mã bằng chứng provider trước khi Admin ghi nhận provider đã chấp nhận hoặc xếp hàng retry; SMS sandbox luôn bỏ URL/token khôi phục tài khoản. Trạng thái `Sent` không khẳng định người nhận đã đọc. Audit log chỉ đọc. Backend kiểm tra role/ownership. Phiếu giao nội bộ không đặt vận chuyển với nhà cung cấp; mọi provider/live path vẫn bị cấm trong sandbox.

## BFF và phiên

Browser gọi `/api/store/<route>` bằng `src/lib/browser-api.ts`. Route handler dùng allowlist tường minh trong `src/lib/server/store-bff.ts`, không nhận URL upstream từ client. Query string được giữ, timeout 10 giây, body tối đa 1 MiB (JSON; riêng upload media nhận multipart PNG/JPEG/WebP tối đa 900 KiB ở backend), phản hồi cá nhân `no-store`, xử lý đúng 204.

Ghi yêu cầu `Origin` trùng chính xác origin request URL. Reverse proxy phải giữ URL công khai đúng host/protocol cho Next.js; không tùy tiện tin `X-Forwarded-Host`. Phải test cookie/CSRF trên origin HTTPS thật trước khi bật ghi sau proxy.

Token chỉ trong cookie HttpOnly, SameSite=Lax, Secure ở production; auth chỉ trả user ra JavaScript. Logout xóa cookie ngay cả khi backend không liên lạc được; trường hợp này thông báo lỗi không có nghĩa đã thu hồi phiên từ xa. Đổi mật khẩu thành công xóa phiên. Chưa tự refresh: hết access token cần đăng nhập lại; refresh token dùng thu hồi khi logout, không mở route refresh ra BFF.

CSV là endpoint cố định, chỉ phiên đủ quyền được tải và không cache. BFF chỉ mở readiness/charge/balance cho checkout, cùng các route Admin cụ thể để query/reconcile thanh toán; refund-provider route không được mở ra khách hàng. Notification reconciliation chỉ mở hai route quản trị cụ thể; ghi yêu cầu `Origin` hợp lệ, write gate, cookie phiên và role Admin của backend. Bật write gate không làm hệ thống sẵn sàng mở bán.

## Chạy và kiểm thử

```bash
npm ci
# .env.local: API_BASE_URL=http://127.0.0.1:5085
# Chỉ với database kiểm thử: STOREFRONT_WRITES_ENABLED=true
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Preview regression: server không có API rồi `npm run test:e2e`. Integration cần backend với DB tạm đã seed và một tài khoản Admin tổng hợp, không dùng tài khoản thật/database production.

```bash
INTEGRATION_API_URL=http://127.0.0.1:5085 \
INTEGRATION_BASE_URL=http://localhost:3100 \
ADMIN_TEST_CREDENTIALS_FILE=/private/path/admin.json \
INTEGRATION_START_SERVER=true \
CHROMIUM_PATH=/usr/bin/chromium npm run test:integration
```

Toàn bộ suite cần file Admin tổng hợp hợp lệ (các test CMS không tự bỏ qua). Credential JSON có `email/password`, lưu ngoài repository với quyền 600. Runner chặn host ngoài loopback theo mặc định. `NEXT_DIST_DIR=.next-integration` tách output test khỏi preview; production dùng `.next`. Không tắt cổng an toàn để chạy bộ test ghi trên production. Khi chạy song song, mỗi lượt phải dùng `--output=test-results/<tên-lượt>` riêng; không chạy preview suite xóa chung artifact. Với kiểm thử giao diện dài, ưu tiên `npm run build` rồi `PORT=3102 API_BASE_URL=http://127.0.0.1:5085 STOREFRONT_WRITES_ENABLED=true npm start`, đặt `INTEGRATION_BASE_URL=http://localhost:3102` và bỏ `INTEGRATION_START_SERVER`; không sửa source/build cùng thư mục đang phục vụ trong lúc test. Bản này đã kiểm tra runtime API ở standalone production, không chỉ dev server. Chi tiết kết quả hiện hành xem `docs/INTEGRATION-VERIFICATION.md`.

## Trước khi mở bán

Backend chưa triển khai production. Chỉ MoMo sandbox adapter và Mailtrap/Twilio test-only transports đã có mã; chưa có secrets nên chưa gọi provider. GHN staging chưa được tích hợp, và quote hiện bị khóa. Cần staging cô lập, HTTPS/IPN URL, sandbox credentials, location/address mapping cùng cân nặng/kích thước thực tế của SKU, backup/restore drill và ngưỡng E2E/load do chủ tiệm xác nhận. Không dùng production/live credentials hoặc giao dịch thật; không merge frontend PR khi chưa có yêu cầu.
