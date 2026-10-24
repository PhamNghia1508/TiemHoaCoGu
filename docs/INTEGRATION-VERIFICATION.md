# Kết quả tích hợp Tiệm Hoa Có Gu

Frontend đã nối API ASP.NET Core, không chỉ dựng giao diện. Regression ngày 24/10/2026 chạy với standalone production FE, API từ Dockerfile đã sửa trên branch backend `fix/docker-nonroot-runtime-permissions` (gốc main `41f11144ad6c24465ff11f0e929ecb3ad9dc0205`) và SQL Server 2022 Docker. Chỉ dùng tài khoản/dữ liệu tổng hợp trên loopback; không triển khai production.

## Kết quả cuối

| Kiểm tra                                           | Kết quả                               |
| -------------------------------------------------- | ------------------------------------- |
| Unit test                                          | 30/30 đạt                             |
| E2E preview, desktop và mobile                     | 30/30 đạt                             |
| E2E production FE + API + SQL thật, desktop/mobile | 30/30 đạt                             |
| Integration với backend thật                       | 21/21 đạt, gồm 6 browser flows        |
| Backend, bật SQL Server tests                      | 193/193 đạt, 0 skip; gồm 12 SQL tests |
| ESLint, TypeScript, Prettier                       | Đạt                                   |
| Next.js standalone production build                | Đạt                                   |
| npm audit                                          | 0 vulnerabilities                     |

Integration cuối chạy trên standalone production, `API_BASE_URL` và write gate được đặt khi khởi động server. Như vậy cùng bản build có thể nhận cấu hình backend ở runtime, không bị đóng băng thành preview lúc build. Các bộ integration không mock backend hoặc bịa response thành công của nhà cung cấp.

Docker API chạy UID/GID 1654/1654, đọc được appsettings và ghi media ở đường dẫn mặc định; upload HTTP thật đã qua. Catalog list trả tồn kho khớp detail (dương/0/thiếu inventory), tránh quick-add cho hàng hết tồn. Gift-finder/nhãn loại dùng danh mục API thay slug mẫu. E2E lấy GUID/tên/giá/tập sản phẩm từ catalog, chờ hydration và vẫn kiểm tra đầy đủ lọc, sắp xếp, tổng giỏ, persistence, 404, WCAG. Test CSV tự tạo đơn Unpaid qua API thật và đã chạy thành công từ DB mới có 0 đơn, không phụ thuộc lượt test trước. Vitest nâng 3.x → 5.0.5, cấu hình ESM và yêu cầu Node được cập nhật theo engines.

## Đã kiểm chứng trực tiếp

**Phiên và quyền:** đăng ký/đăng nhập, cookie HttpOnly, không trả token cho JavaScript, logout thu hồi phiên, chặn cross-origin và chặn tài khoản khác đọc dữ liệu. Customer không được vào CMS; Admin đọc và ghi qua backend có kiểm tra quyền. Ở baseline trước sandbox, payment-provider routes chưa mở trong BFF; branch follow-up hiện chỉ mở readiness/charge/balance và Admin query/reconcile theo allowlist hẹp, còn refund route không được mở cho khách.

**Tài khoản và giỏ:** đăng nhập bằng giao diện, tạo/sửa/xóa địa chỉ, lưu/khôi phục giỏ máy chủ, kiểm tra trên mobile và reload. localStorage chỉ giữ GUID/số lượng giỏ và yêu thích, không chứa token hoặc thông tin giao hàng. Có test mô phỏng response kiểm tra phiên cũ về muộn: response đó không được ghi đè phiên vừa đăng nhập.

**Catalog và checkout:** giá/GUID/danh mục/ảnh từ API; phân trang catalog; ảnh không hợp lệ bị loại. Thêm sản phẩm thực vào túi rồi yêu cầu phí giao hàng bằng UI. Backend hiện khóa carrier `Disabled` cho tới khi GHN staging adapter được xác minh nên trả **503**; UI báo lỗi và không tạo đơn giả. Branch follow-up kiểm tra MoMo sandbox readiness trước khi tạo đơn, dùng idempotent charge một lần và trang return đọc trạng thái từ backend, không tin query claims của trình duyệt. Backend không liên lạc được thì catalog không fallback dữ liệu mẫu.

**Hoa đặt riêng:** UI tạo yêu cầu thực; Admin fixture phát hành báo giá; khách tải lại, đọc giá/tiền cọc/điều kiện, duyệt và checkout. Đơn được đọc lại từ backend với trạng thái **Unpaid**. Tra cứu bằng UI hiển thị đúng mã đơn vừa tạo. Idempotency và ownership cũng được kiểm tra qua API.

**Workshop:** tạo workshop/ca tương lai tổng hợp, chọn ca bằng UI và giữ chỗ thật trong database test. Booking trả trạng thái **pending**, số vé và hạn giữ; UI ghi rõ chưa thanh toán, chưa phải booking xác nhận. Không gọi provider, không phát hành vé đã mua giả.

**CMS:** voucher CRUD, tài khoản/role/reset mật khẩu/permissions, upload media/gallery CRUD, tồn kho, CSV, quyền staff khi đọc giao hàng. UI kiểm tra Customer bị chặn, Admin sửa sản phẩm mà bảo toàn các checkbox `false`, và gallery được render. Các nghiệp vụ workshop, báo giá, đơn/giao nội bộ và roster được nối endpoint tương ứng; không có nghĩa từng tổ hợp thao tác CMS đã có E2E riêng.

## Không được hiểu nhầm là đã mở bán

Backend chưa có triển khai production. MoMo adapter khóa endpoint sandbox; Mailtrap Email Sandbox và Twilio Test Credentials có code test-only nhưng chưa được cấu hình secrets hoặc gọi thật. GHN chưa được tích hợp nên carrier bị disable. Giữ chỗ không phải mua vé; duyệt giá không phải trả tiền; đơn Unpaid không phải đã thu tiền; phiếu giao nội bộ không phải đã đặt hãng vận chuyển.

Lượt SQLite 21/21 và backend 192/192 trước đây là baseline lịch sử; bảng trên là lượt Docker/SQL mới với 193 backend tests (thêm regression tồn kho). Số test giữa các bộ được báo riêng, không cộng thành một bộ duy nhất.

## Sandbox follow-up (branch local, chưa merge/deploy)

Backend thêm MoMo sandbox create/IPN/query/refund, Admin reconciliation tự query provider lần nữa trước khi ghi sổ, Mailtrap/Twilio test-only transports, SMS template bỏ recovery URL/token, notification reconciliation có audit, và carrier `Disabled` tới khi GHN được xác minh. FE thêm checkout handoff/return status và Admin panels qua BFF allowlist.

Lượt kiểm tra mới nhất: backend Release **205 passed, 12 skipped, 0 failed**; 12 test cần `HOASAP_TEST_SQLSERVER` nên không chạy trong sandbox này. FE lint, typecheck, **32/32 unit tests**, Prettier và production build đạt; preview E2E trước đó **30/30 đạt**. Không có provider call thật. Chưa có sandbox credentials để xác thực wire behavior; chưa có GHN adapter, staging backup/restore thực tế hoặc ngưỡng load do team duyệt. Không coi đây là acceptance staging hay production.

Trước khi bật ghi ở production phải có backend/DB bền vững, HTTPS, secrets, backup/monitoring, kiểm tra cookie/CSRF qua reverse proxy và kiểm thử provider/webhook thật. `STOREFRONT_WRITES_ENABLED` mặc định tắt; chưa được phép merge frontend PR.

Cách chạy và cấu hình: [API-INTEGRATION.md](./API-INTEGRATION.md).
