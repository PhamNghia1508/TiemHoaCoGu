# Tiệm Hoa Có Gu

Frontend Next.js cho tiệm hoa sáp thủ công & workshop SÁPA Studio. Giao diện tiếng Việt, tự thiết kế theo hướng editorial: nền giấy ấm, đỏ mận, serif Cormorant Garamond, sans Be Vietnam Pro và bố cục bất đối xứng. Không dùng UI kit hay sao chép template.

**Trạng thái:** frontend trải nghiệm có tương tác; chưa mở bán, chưa nối dữ liệu trực tiếp với backend và chưa nhận đơn, giữ chỗ hoặc thanh toán thật. Backend ở repository riêng `ZidenVN/TiemHoaCoGu_BE`, không bị sửa trong PR này.

## Chạy

Yêu cầu Node.js 22 trở lên và npm.

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

- Trang chủ, cửa tiệm, 6 chi tiết sản phẩm, câu chuyện tiệm, 3 bài đọc, FAQ và chính sách.
- Lọc loại sản phẩm, tìm tiếng Việt không dấu, sắp xếp giá, tìm toàn trang.
- Sản phẩm yêu thích và giỏ hàng lưu trên trình duyệt; tăng, giảm, xóa, tính tổng và giữ sau reload. Giới hạn 20 đơn vị mỗi sản phẩm trong bản trải nghiệm; đây không phải số tồn kho.
- Drawer giỏ hàng & dialog tìm kiếm dùng native `<dialog>` với focus trap và Escape.
- Form hoa đặt riêng & workshop: kiểm tra đầu vào, xem lại **bản nháp**, không gửi dữ liệu hoặc tạo mã đơn/vé giả.
- Bước xem lại đơn và tra cứu có thông báo rõ phần chưa kết nối; không giả kết quả hoặc thu tiền.
- Responsive, hỗ trợ reduced motion, skip link, trạng thái screen reader, 404 và error boundary.
- Metadata tiếng Việt, Open Graph, favicon, sitemap và redirects URL HTML cũ. `robots.txt` chặn index bản trải nghiệm.

Danh mục/giá/ảnh kế thừa từ repository cũ để phát triển giao diện, không phải dữ liệu kinh doanh đã xác nhận. Không dùng review, số khách, địa chỉ hay lịch còn chỗ hư cấu.

## Kết nối backend sau này

`src/lib/api/` chứa typed client đọc từ hợp đồng API .NET hiện tại: catalog, orders, custom orders, workshops, bookings và CMS catalog. Có timeout, chuẩn hóa lỗi và tùy chọn JWT phía server. Xem [API integration](docs/API-INTEGRATION.md).

**Chỉ điền `API_BASE_URL` chưa khiến giao diện chuyển sang live.** UI hiện dùng `src/lib/catalog.ts`; phải bổ sung adapter DTO → UI, dữ liệu sản phẩm thực/ID thực, server-side session/auth, checkout/shipping quote, ca workshop, kiểm tra tồn kho, chính sách và thanh toán trước khi nhận giao dịch. Không được gửi ID mẫu như `trang-non` vào API dùng GUID.

Không lưu access token trong localStorage, không thêm token hay API key vào biến `NEXT_PUBLIC_*`. Form preview hiện không lưu tên, điện thoại, địa chỉ hoặc nội dung lời nhắn; chỉ giỏ/favorites được lưu localStorage.

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

## Cấu trúc

```text
src/app/          Next.js App Router, trang và metadata
src/components/  UI có tương tác và cấu phần chung
src/lib/catalog.ts  Dữ liệu trải nghiệm + bài viết
src/lib/api/     Typed API client phía server
public/images/   Ảnh WebP kế thừa
 tests/e2e/      Playwright tests
 docs/           Tích hợp, thiết kế & tài liệu prototype lịch sử
```

## Triển khai

Vercel: import repository, framework Next.js, build `npm run build`; thiết lập `SITE_URL` theo domain thực. Chưa chọn domain/deploy production trong thay đổi này.

Docker: `docker build -t tiem-hoa-co-gu .` rồi `docker run --rm -p 3000:3000 -e SITE_URL=http://localhost:3000 tiem-hoa-co-gu`. Image dùng Next standalone, user không đặc quyền.

Trước public launch: hoàn thiện các mục backend nêu trên, xác nhận quyền dùng ảnh, giá, địa chỉ/liên hệ, chính sách thật, thay robots/metadata index, đặt `SITE_URL` và test kết nối end-to-end trên staging.

## Tinh thần thiết kế

Tham khảo nguyên tắc bố cục editorial, nhịp typography và chuyển động tiết chế từ [Dribbble](https://dribbble.com/tags/flower-shop-website), [Framer Urban Flora](https://www.framer.com/marketplace/templates/urban-flora/) và [Awwwards Orchid](https://www.awwwards.com/sites/orchid). Không sao chép mã, layout nguyên bản hoặc tài sản hình ảnh của các website tham khảo. Nguồn ảnh chi tiết: [Design notes](docs/DESIGN.md).
