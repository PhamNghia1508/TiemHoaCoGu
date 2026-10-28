# Thiết kế lại: Botanical Play

Bản trước thiên về editorial serif và khoảng trắng nhưng thiếu nhịp, cá tính và lối vào mua quà. Bản mới dùng Be Vietnam Pro đậm, cobalt + citrus + lilac, poster hero, ảnh sản phẩm lớn, category entry rõ và khu vực thương mại dễ thao tác. Không sao chép layout hoặc tài sản của website tham khảo.

## Nguồn & cách áp dụng

[Awwwards — Flower Dose](https://www.awwwards.com/sites/flower-dose) trình bày các lối vào theo cảm xúc/dịp, category, product, gift, mobile và sticky menu. Áp dụng: sticky header có trạng thái, shortcut sản phẩm và trang cửa tiệm/PDP được xem là hành trình chính, không phải phần phụ dưới một landing page.

[Framer — Sweetpea](https://www.framer.com/marketplace/templates/sweetpea/) mô tả filters, bouquet options, delivery checker, ngày giao, lịch/chỗ workshop và reduced motion. Áp dụng các mẫu tương tác hữu ích, nhưng không dựng tồn kho, thời gian giao, phí hoặc lịch/chỗ giả khi backend chưa có. Preview vẫn được gắn nhãn rõ.

[Baymard — Product List UX](https://baymard.com/research-articles/current-state-product-list-and-filtering) nhấn mạnh bộ lọc hữu dụng trên mobile, nhóm biến thể và nhiều ảnh phù hợp để đánh giá sản phẩm. Áp dụng: bộ lọc giá, category, active count/reset, deep link từ ngân sách, quick-add và ảnh lớn. Không tách màu minh họa thành sản phẩm giả hoặc dùng ảnh sản phẩm khác như góc chụp bổ sung. Cần chủ tiệm cung cấp bộ ảnh đúng từng mẫu để hoàn thiện tiêu chuẩn nhiều thumbnails.

[NNGroup — Ecommerce Product Pages](https://www.nngroup.com/articles/ecommerce-product-pages/) yêu cầu tên/mô tả cụ thể, ảnh có thể phóng lớn, giá/phí, lựa chọn, trạng thái cung ứng và feedback thêm giỏ rõ. Áp dụng: ảnh zoom, hierarchy thông tin rõ, CTA dễ thấy trên mobile, báo phí/tồn kho chưa xác nhận, feedback quick-add và drawer giỏ hàng thật trong trình duyệt.

[Galerie Design Studio — Bloom Bar Studio](https://galeriedesignstudio.com/bloom-bar-studio) cho thấy florist branding có thể vui, đậm, giàu typography chứ không bắt buộc phải serif mảnh/màu be. Đây là cảm hứng cho thái độ thương hiệu, không phải template dùng lại.

[Clover — The Artist Studio](https://theartiststudio.agency/work/clover) minh họa việc giữ nhận diện nhất quán từ logo đến nhãn và bao bì. Bản mới đưa cobalt/citrus, nét hoa đơn giản và typographic label xuyên suốt các trang.

## Ranh giới

Giữ ảnh và danh mục từ repository, không tạo mẫu hàng/tồn kho/review/địa chỉ/lịch hư cấu. API client vẫn server-only và chưa nối live. Không nhận đơn, thanh toán hoặc giữ chỗ thật. Form không gửi dữ liệu cá nhân. Chuyển động tôn trọng reduced motion; controls keyboard có focus rõ, label đầy đủ và vùng chạm tối thiểu 44px.
