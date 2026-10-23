# Botanical Play — Tiệm Hoa Có Gu

## Hướng hiện tại

Thay thế hướng editorial ngà–mận/serif trước đây bằng một florist studio có cá tính rõ: cobalt `#243db5`, citrus `#ebf28b`, warmwhite `#fffdf8`, lilac `#ece7f5`, nearblack `#1c2326`. Be Vietnam Pro 800 là chữ chủ đạo, serif italic chỉ dùng như một nét nhãn giấy nhỏ. Font tự host, có tiếng Việt.

Hero như một poster “Tặng hoa. Tặng gu.”; ảnh sản phẩm thật từ catalog, nhãn giá và đường vào cửa tiệm trực tiếp. Category shortcuts và form tìm quà đưa loại/ngân sách vào URL. Cửa tiệm có intro gọn, giá/lọc/sort/wishlist rõ và quick-add phản hồi ngay. PDP cho zoom ảnh, phân biệt ảnh sản phẩm với ảnh bối cảnh, thông tin phí chưa xác nhận và CTA mobile cố định.

Các trang workshop, hoa làm riêng, câu chuyện, journal và FAQ dùng cùng ngôn ngữ studio. Không dùng UI kit, nền gradient, glassmorphism hay các bộ card thành tích/review hư cấu. Chuyển động phục vụ phản hồi; reduced motion, focus, native dialog/Escape và labels vẫn là ràng buộc thiết kế.

## Nghiên cứu

Nguồn đã đọc và quyết định áp dụng cụ thể: [Design rethink](DESIGN-RETHINK.md), gồm Awwwards Flower Dose, Framer Sweetpea, Baymard Product List UX, NNGroup Product Pages, Galerie Bloom Bar và Clover. Không sao chép mã, layout nguyên bản, font trả phí hoặc ảnh từ các website tham khảo.

## Ảnh & dữ liệu

Ảnh WebP kế thừa từ `assets/` của repository `PhamNghia1508/TiemHoaCoGu`, hiện ở `public/images/`. Không tạo ảnh sản phẩm mới. Chủ tiệm cần xác nhận giấy phép/quyền dùng và tính đúng với hàng thực trước khi mở bán. Ảnh bối cảnh không được coi là góc chụp khác của đúng sản phẩm.

Giá/loại sản phẩm kế thừa dữ liệu repo cũ. Tên hiển thị được biên tập cho nhất quán. Bảng màu chỉ tham khảo, không tạo lựa chọn biến thể có giá/tồn kho giả. Cần bộ ảnh thật nhiều góc cho từng mẫu để hoàn thiện gallery thương mại.

## Chưa giao dịch live

Không bịa địa chỉ, số điện thoại, lượt bán, khách hàng, review, số chỗ hoặc lịch lớp. UI không tạo mã đơn, QR thanh toán hoặc vé. Form chỉ xác thực và xem trước trên trang. Backend/API adapter/auth/checkout/shipping/workshop sessions cần nối và kiểm tra trước khi mở bán. Xem README và API-INTEGRATION.md.
