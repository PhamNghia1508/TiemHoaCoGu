# Góc điều hành Có Gu: thiết kế theo việc của tiệm

Bản quản trị trước đặt sidebar vào một trang bán hàng, giữ header/footer lớn và chia nội dung thành các khối chức năng thay vì một đường làm việc rõ. Dashboard cho xem số nhưng không dẫn vào đơn cần xử lý; catalog dành chỗ ngang cho form danh mục ít dùng; workshop và hoa đặt riêng lẫn nhau, còn roster lại xuất hiện trong đơn hàng. Tablet/mobile phải dò một hàng điều hướng dài và bảng có form.

## Việc thường làm ở trước

Khung điều hành riêng bỏ chrome bán hàng ở route quản trị nhưng giữ đường quay về cửa tiệm. Sidebar nhóm theo công việc; tablet/mobile dùng bộ chọn khu vực có nhãn, không giấu 11 mục trong một dải trượt. URL lưu màn đang mở để tải lại, đi lùi và gửi deep link vẫn đúng ngữ cảnh. Dashboard dùng trạng thái đơn/tồn từ API thật và cho đi thẳng vào danh sách liên quan; số tiền ghi nhận tách khỏi trạng thái đơn, không tạo biểu đồ xu hướng hay số liệu giả.

[NN/g về dashboard vận hành](https://www.nngroup.com/articles/dashboards-preattentive/) nhấn mạnh thông tin quan trọng phải đọc nhanh và hỗ trợ quyết định ngay. Vì vậy khu vực việc đang chạy đứng trước số liệu tổng hợp; không dùng các KPI trang trí vô tác dụng.

## Danh sách trước, biểu mẫu đúng lúc

Sản phẩm, danh mục, voucher, tài khoản và workshop đều bắt đầu bằng danh sách có bộ tìm/lọc phù hợp. Tạo/sửa dùng dialog có tiêu đề/đối tượng rõ, nhóm field theo thông tin liên quan. Sản phẩm phân biệt thông tin bán hàng với quy cách đóng gói; sửa số đo tự bỏ xác nhận, không tự điền cân nặng. Workshop giữ ca học và roster/check-in; hoa đặt riêng có hàng đợi, báo giá và sản xuất riêng. Đơn hàng có chi tiết khách, sản phẩm, tổng tiền và hành động tiếp theo; phiếu giao luôn được gọi là bản ghi nội bộ.

[NN/g về progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/) yêu cầu giữ tác vụ thường dùng dễ thấy và chỉ hoãn lựa chọn ít dùng. [Bốn nguyên tắc giảm tải nhận thức trong form](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/) dẫn tới nhóm thông tin, yêu cầu rõ và hỗ trợ đúng thời điểm. [Carbon về data table](https://www.carbondesignsystem.com/building-blocks/core/components/data-table) được dùng làm tham khảo hành vi toolbar/search/pagination/loading, không dùng UI kit hoặc chép template.

## Nhận diện và nhịp tương tác

Giữ Botanical Play: cobalt #243db5 cho điều hướng và hành động, citrus #ebf28b cho điểm nhấn Có Gu, warm-white cho vùng thao tác, lilac cho tác vụ liên quan. Be Vietnam Pro đậm làm hierarchy; không dùng serif hero, gradient, glassmorphism hoặc hiệu ứng nhấc mọi nút/card khi hover. Trạng thái cần đọc được bằng chữ, không chỉ màu.

Feedback màu/selection khoảng 120ms; dialog vào 220ms và đóng ngay để không giữ người dùng chờ; tải dữ liệu có skeleton và trạng thái riêng. Native dialog quản lý focus/Escape; xác nhận có đối tượng và hậu quả rõ, nút quay lại được ưu tiên focus. Reduced-motion tắt chuyển động. Đây là áp dụng [NN/g về duration/motion](https://www.nngroup.com/articles/animation-duration/) và [Material 3 về easing/duration](https://m3.material.io/styles/motion/easing-and-duration): chuyển động phục vụ hiểu trạng thái, không tạo thêm thời gian chờ.

## Ranh giới không đổi

Mọi request tiếp tục qua BFF cùng origin và exact allowlist; role/ownership, write gate và nghiệp vụ vẫn do server quyết định. UI nhận capability boolean để báo và khóa thao tác ghi trong preview, không nhận URL nội bộ/token. Không mở provider/live payment, vận chuyển, email/SMS hay production data. Thông báo không lộ người nhận/nội dung; đối soát phải có chứng cứ; MoMo chỉ sandbox và không tự retry charge. Audit chỉ đọc. Không merge hoặc deploy production trong thay đổi này.

## Chạy kiểm tra giao diện

Sau `npm run build`, chạy `npm run test:admin`. Bộ kiểm tra tự mở standalone trên loopback với `API_BASE_URL` rỗng, mock toàn bộ `/api/store/**` và kiểm tra desktop 1440, tablet 834, mobile 390, màn hẹp 320 px. Có thể dùng `ADMIN_UI_DIST_DIR=.next-admin-ux` khi build thử ở thư mục riêng. Các thao tác lưu/xóa/xác nhận trong bộ này chỉ là fixture, không được chạy vào API sandbox thật. Smoke tích hợp thực hiện riêng ở preview chỉ đọc; lint, typecheck, unit và bộ E2E storefront vẫn giữ nguyên.
