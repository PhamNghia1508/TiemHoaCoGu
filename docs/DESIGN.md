# Một tiệm hoa có cá tính

## Hướng thiết kế

Tiệm hoa sáp thủ công, không phải cửa hàng nước hoa hay một trang SaaS. Trục chính là những điều được làm chậm: nền giấy ngà, màu mận trầm, màu olive tiết chế; chữ serif lớn, nhiều khoảng thở và nhịp ảnh lệch nhau. Thẻ sản phẩm phẳng, đường kẻ mảnh; không dùng gradient, glassmorphism, badge thành tích hay testimonial giả.

Hero mở bằng “Có những điều, để hoa nói.”, ảnh hoa chiếm nửa còn lại, dấu tròn nhỏ như tem gói quà. Workshop chuyển sang nền mận để thay nhịp thay vì lặp lại một lưới card. Footer dùng wordmark lớn làm điểm kết.

Cormorant Garamond cho cảm xúc, Be Vietnam Pro cho thông tin. Tất cả font tự host và có bộ ký tự tiếng Việt. Chuyển động chỉ gồm hover ảnh/nút và toast; tôn trọng `prefers-reduced-motion`.

## Tham khảo, không sao chép

- [Dribbble — Flower Shop Website](https://dribbble.com/tags/flower-shop-website): tham khảo tương quan ảnh, chữ và khoảng trắng.
- [Framer — Urban Flora](https://www.framer.com/marketplace/templates/urban-flora/): cách ảnh và lời dẫn tạo đường đi đến inquiry.
- [Awwwards — Orchid](https://www.awwwards.com/sites/orchid): nhịp editorial và hệ thống trang nội dung.

Không dùng mã, font trả phí, screenshot hoặc ảnh sản phẩm từ các trang tham khảo.

## Ảnh & dữ liệu

Ảnh WebP được kế thừa từ thư mục `assets/` của repository `PhamNghia1508/TiemHoaCoGu`, chuyển sang `public/images/`. Không tạo ảnh mới trong thay đổi này; nguồn gốc tác giả/giấy phép của ảnh kế thừa chưa được xác minh độc lập. Chủ tiệm cần xác nhận quyền sử dụng và độ đúng với hàng thực trước khi mở bán.

Giá tham khảo có nguồn từ `data/products.json` và `data/workshops.json` của repo cũ. Một số tên hiển thị được biên tập lại cho nhất quán. Không coi ảnh minh họa là cam kết quy cách sản phẩm.

Không bịa địa chỉ, điện thoại, lượt bán, review, số chỗ hoặc lịch lớp. Chưa biết thông tin nào thì không đưa vào UI như dữ kiện thật.

## Chưa phải luồng giao dịch live

UI cố ý không phát hành mã đơn, QR thanh toán hay vé workshop. Form chỉ xác thực và xem trước trên trang. Để mở bán cần hoàn thiện backend deployment, adapter dữ liệu, session/auth và kiểm tra write-flow; xem README và API-INTEGRATION.md.
