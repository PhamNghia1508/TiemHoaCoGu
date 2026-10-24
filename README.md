# Tiệm Hoa Có Gu

Frontend Next.js cho tiệm hoa sáp thủ công & workshop SÁPA Studio. Giao diện tiếng Việt theo hướng Botanical Play: cobalt–citrus, typography sans đậm, poster hero và luồng chọn quà ưu tiên thao tác thật. Không dùng UI kit hay sao chép template.

**Trạng thái:** frontend đã nối API backend `ZidenVN/TiemHoaCoGu_BE` qua BFF Next.js, có preview an toàn khi chưa cấu hình. Chưa triển khai backend production, chưa nối provider thanh toán/giao vận/email/SMS và chưa sẵn sàng mở bán. Thay đổi nằm trên PR frontend, không merge PR và không sửa backend main.

## Chạy

Yêu cầu Node.js 22.x (từ 22.12), 24.x hoặc từ 26 trở lên và npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
# http://localhost:3000
```

```bash
npm run build
npm start
```

Font được đóng gói trong ứng dụng, không phụ thuộc Google Fonts lúc build/runtime. Ảnh dùng `next/image`, có kích thước responsive và ưu tiên tải hero.

## Có gì hoạt động?

- Trang chủ, cửa tiệm và chi tiết theo catalog (6 sản phẩm mẫu ở preview), câu chuyện tiệm, 3 bài đọc, FAQ và chính sách.
- Tìm quà theo loại/ngân sách từ trang chủ; bộ lọc giá desktop/mobile, active chips/reset, tìm tiếng Việt không dấu, sắp xếp giá, tìm toàn trang.
- Quick-add có feedback, zoom ảnh và CTA cố định trên mobile. Ảnh bối cảnh được ghi rõ, không giả thành góc chụp sản phẩm.
- Sản phẩm yêu thích và giỏ hàng lưu trên trình duyệt; tăng, giảm, xóa, tính tổng và giữ sau reload. Giới hạn 20 đơn vị mỗi sản phẩm trong bản trải nghiệm; đây không phải số tồn kho.
- Drawer giỏ hàng & dialog tìm kiếm dùng native `<dialog>` với focus trap và Escape.
- Form hoa đặt riêng & workshop: preview chỉ xem nháp; chế độ API dùng request/booking backend thật, không tạo mã giả.
- Checkout lấy phí từ backend; tra cứu dùng tài khoản và dữ liệu thật khi API đã cấu hình. Không có thu tiền giả.
- Responsive, hỗ trợ reduced motion, skip link, trạng thái screen reader, 404 và error boundary.
- Metadata tiếng Việt, Open Graph, favicon, sitemap và redirects URL HTML cũ. `robots.txt` chặn index bản trải nghiệm.

Danh mục/giá/ảnh kế thừa từ repository cũ để phát triển giao diện, không phải dữ liệu kinh doanh đã xác nhận. Không dùng review, số khách, địa chỉ hay lịch còn chỗ hư cấu.

## Kết nối backend

`src/lib/api/` chứa typed client đọc từ hợp đồng API .NET hiện tại: catalog, orders, custom orders, workshops, bookings và CMS catalog. Có timeout, chuẩn hóa lỗi và tùy chọn JWT phía server. Xem [API integration](docs/API-INTEGRATION.md).

Có `API_BASE_URL`: catalog/workshop đọc dữ liệu thật và GUID thật; backend lỗi báo không khả dụng, không fallback dữ liệu mẫu. `/tai-khoan` có phiên HttpOnly, địa chỉ và giỏ máy chủ; `/tra-cuu` đọc lịch sử theo tài khoản; `/quan-tri` dành cho Admin. Ghi nghiệp vụ mặc định tắt, chỉ bật bằng `STOREFRONT_WRITES_ENABLED=true` sau khi đã kiểm tra môi trường.

Checkout cần shipping quote hợp lệ trước khi xác nhận; provider chưa sẵn sàng thì chặn, không giả phí hoặc thành công. Custom request đi qua báo giá/duyệt/checkout; workshop dùng hold thật và không coi hold là đã trả tiền. Chi tiết triển khai, route, bảo mật, giới hạn và cách chạy test ở [API integration](docs/API-INTEGRATION.md); kết quả xác minh ở [Integration verification](docs/INTEGRATION-VERIFICATION.md).

Không lưu token/PII trong localStorage hay `NEXT_PUBLIC_*`. Form preview không gửi thông tin cá nhân; chế độ kết nối có thể lưu dữ liệu vào backend khi người dùng gửi.

## Kiểm thử

```bash
npm run typecheck
npm run lint
npm test
npm run build
# Để server ở terminal khác, rồi:
CHROMIUM_PATH=/usr/bin/chromium npm run test:e2e
```

E2E dùng Playwright + axe cho desktop/mobile: routes/404, các breakpoint 320–1440px, tìm kiếm, lọc, yêu thích, giỏ hàng, form preview và accessibility trang chủ. Cài Chromium hệ thống hoặc `npx playwright install chromium`; nếu dùng Chromium Playwright, đặt `CHROMIUM_PATH` tới binary phù hợp. Có thể đặt `PLAYWRIGHT_BASE_URL` để kiểm tra production server.

Suite đọc ID/URL, tên, giá và danh mục từ catalog đang hiển thị, không chốt số lượng 6 hay slug preview. Assertions vẫn kiểm tra tập sản phẩm sau lọc, thứ tự giá, tổng giỏ, persistence, 404 và WCAG.

Để chạy cùng suite với **production build local nối backend/SQL thật**, dùng database và tài khoản tổng hợp, bật write gate chỉ ở stack test và chạy integration trước theo [hướng dẫn](docs/API-INTEGRATION.md). Catalog test cần sản phẩm có đủ tồn cho thao tác giỏ, ít nhất một sản phẩm cho phép đặt riêng và ca workshop tương lai còn chỗ. Sau khi production server test đã chạy:

```bash
E2E_EXPECT_CONNECTED=true PLAYWRIGHT_BASE_URL=http://localhost:3100 npm run test:e2e
```

Connected E2E chỉ chấp nhận loopback, không dùng production thật. Hai test form xác minh guest nhận 401 từ BFF và không có yêu cầu/hold/kết quả giả; preview vẫn bắt buộc không gửi POST. Các luồng đăng nhập, tạo báo giá/đơn Unpaid, hold và CMS upload thật nằm trong `npm run test:integration`; không thay backend bằng fixture mock.

## Cấu trúc

```text
src/app/          Next.js App Router, trang và metadata
src/components/  UI có tương tác và cấu phần chung
src/lib/catalog.ts  Dữ liệu trải nghiệm + bài viết
src/lib/api/     Typed API client phía server
src/lib/server/  BFF allowlist, cookie và proxy
src/lib/storefront.ts  Adapter DTO backend → UI
public/images/   Ảnh WebP kế thừa
tests/e2e/       Catalog-driven regression desktop/mobile (preview hoặc connected local)
tests/integration/ BFF + backend + browser tests
 docs/           Tích hợp, thiết kế & tài liệu prototype lịch sử
```

## Triển khai

Vercel: import repository, framework Next.js, build `npm run build`; thiết lập `SITE_URL` theo domain thực. Chưa chọn domain/deploy production trong thay đổi này.

Docker: `docker build -t tiem-hoa-co-gu .` rồi `docker run --rm -p 3000:3000 -e SITE_URL=http://localhost:3000 tiem-hoa-co-gu`. Image dùng Next standalone, user không đặc quyền.

Trước public launch: hoàn thiện các mục backend nêu trên, xác nhận quyền dùng ảnh, giá, địa chỉ/liên hệ, chính sách thật, thay robots/metadata index, đặt `SITE_URL` và test kết nối end-to-end trên staging.

## Tinh thần thiết kế

Nghiên cứu Awwwards Flower Dose, Framer Sweetpea, Baymard, NNGroup và các case branding florist để thay đổi cả art direction lẫn UX thương mại. Không dùng template có sẵn. Xem [Design rethink](docs/DESIGN-RETHINK.md) cho nguồn và cách áp dụng, [Design notes](docs/DESIGN.md) cho palette, typography, tài nguyên và giới hạn.
