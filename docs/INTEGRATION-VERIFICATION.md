# Kết quả tích hợp Tiệm Hoa Có Gu

Frontend đã nối API ASP.NET Core, không chỉ dựng giao diện. Các kiểm thử dưới đây dùng backend `main` tại commit `41f11144ad6c24465ff11f0e929ecb3ad9dc0205`, database SQLite riêng và tài khoản/dữ liệu tổng hợp. Không dùng tài khoản khách thật, không triển khai production và không sửa backend gốc.

## Kết quả cuối

| Kiểm tra                            | Kết quả                        |
| ----------------------------------- | ------------------------------ |
| Unit test                           | 30/30 đạt                      |
| E2E preview, desktop và mobile      | 30/30 đạt                      |
| Integration với backend thật        | 21/21 đạt, gồm 6 browser flows |
| ESLint, TypeScript, Prettier        | Đạt                            |
| Next.js standalone production build | Đạt                            |

Integration cuối chạy trên standalone production, `API_BASE_URL` và write gate được đặt khi khởi động server. Như vậy cùng bản build có thể nhận cấu hình backend ở runtime, không bị đóng băng thành preview lúc build. Các bộ integration không mock backend hoặc bịa response thành công của nhà cung cấp.

## Đã kiểm chứng trực tiếp

**Phiên và quyền:** đăng ký/đăng nhập, cookie HttpOnly, không trả token cho JavaScript, logout thu hồi phiên, chặn cross-origin và chặn tài khoản khác đọc dữ liệu. Customer không được vào CMS; Admin đọc và ghi qua backend có kiểm tra quyền. Các route payment-provider không được mở trong BFF.

**Tài khoản và giỏ:** đăng nhập bằng giao diện, tạo/sửa/xóa địa chỉ, lưu/khôi phục giỏ máy chủ, kiểm tra trên mobile và reload. localStorage chỉ giữ GUID/số lượng giỏ và yêu thích, không chứa token hoặc thông tin giao hàng. Có test mô phỏng response kiểm tra phiên cũ về muộn: response đó không được ghi đè phiên vừa đăng nhập.

**Catalog và checkout:** giá/GUID/danh mục/ảnh từ API; phân trang catalog; ảnh không hợp lệ bị loại. Thêm sản phẩm thực vào túi rồi yêu cầu phí giao hàng bằng UI. Backend chưa có shipping provider nên trả **503**; UI báo lỗi và không tạo đơn giả. Backend không liên lạc được thì catalog không fallback dữ liệu mẫu. Nút thêm hoa chờ giỏ khởi tạo để không mất thao tác trên mobile.

**Hoa đặt riêng:** UI tạo yêu cầu thực; Admin fixture phát hành báo giá; khách tải lại, đọc giá/tiền cọc/điều kiện, duyệt và checkout. Đơn được đọc lại từ backend với trạng thái **Unpaid**. Tra cứu bằng UI hiển thị đúng mã đơn vừa tạo. Idempotency và ownership cũng được kiểm tra qua API.

**Workshop:** tạo workshop/ca tương lai tổng hợp, chọn ca bằng UI và giữ chỗ thật trong database test. Booking trả trạng thái **pending**, số vé và hạn giữ; UI ghi rõ chưa thanh toán, chưa phải booking xác nhận. Không gọi provider, không phát hành vé đã mua giả.

**CMS:** voucher CRUD, tài khoản/role/reset mật khẩu/permissions, upload media/gallery CRUD, tồn kho, CSV, quyền staff khi đọc giao hàng. UI kiểm tra Customer bị chặn, Admin sửa sản phẩm mà bảo toàn các checkbox `false`, và gallery được render. Các nghiệp vụ workshop, báo giá, đơn/giao nội bộ và roster được nối endpoint tương ứng; không có nghĩa từng tổ hợp thao tác CMS đã có E2E riêng.

## Không được hiểu nhầm là đã mở bán

Backend chưa có triển khai production. Chưa tích hợp thanh toán, shipping provider, email/SMS hoặc webhook từ nhà cung cấp thật. Giữ chỗ không phải mua vé; duyệt giá không phải trả tiền; đơn Unpaid không phải đã thu tiền; phiếu giao nội bộ không phải đã đặt hãng vận chuyển.

Bộ integration này dùng SQLite; không dùng nó thay bằng chứng kiểm thử SQL Server. Các kết quả backend 192/192 và SQL Server trước tích hợp là baseline riêng, không được cộng vào kết quả mới ở bảng trên.

Trước khi bật ghi ở production phải có backend/DB bền vững, HTTPS, secrets, backup/monitoring, kiểm tra cookie/CSRF qua reverse proxy và kiểm thử provider/webhook thật. `STOREFRONT_WRITES_ENABLED` mặc định tắt; chưa được phép merge frontend PR.

Cách chạy và cấu hình: [API-INTEGRATION.md](./API-INTEGRATION.md).
