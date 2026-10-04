# Tiệm Hoa Có Gu — SÁPA Studio (Prototype)

Prototype website thương hiệu thủ công hoa sáp nghệ thuật & hệ thống đặt chỗ workshop trải nghiệm tại Hà Nội.

---

## 🌸 Giới thiệu dự án

Dự án được xây dựng nhằm mô phỏng trải nghiệm người dùng và luồng vận hành thực tế cho **SÁPA Studio** (Tiệm Hoa Có Gu):
- **Trải nghiệm thương hiệu:** Định vị theo phong cách *quiet luxury / handcrafted aesthetic*, tối ưu typography, bố cục bất đối xứng, chuyển động mượt mà (Lenis Smooth Scroll).
- **Luồng đặt chỗ Workshop:** Mô phỏng chu trình đặt chỗ không cần đăng nhập (định danh bằng SĐT + mã đặt chỗ).
- **Mô hình trạng thái hoàn chỉnh:** `pending` (giữ chỗ 10 phút đếm ngược) $\rightarrow$ `confirmed` (sau khi thanh toán cọc) $\rightarrow$ `attended` / `no_show` / `cancelled` (huỷ & hoàn tiền theo chính sách).
- **Tra cứu & Quản lý đặt chỗ:** Khách hàng chủ động tra cứu vé, dời lịch hoặc huỷ lịch trực tiếp trên website.
- **Studio Ops:** Bảng điều khiển mô phỏng vận hành lớp học, điểm danh và đối soát.

---

## 📁 Cấu trúc thư mục

```text
TiemHoaCoGu/
├── index.html              # Trang chủ: Bộ sưu tập, câu chuyện xưởng, review, CTA
├── product.html            # Trang chi tiết sản phẩm hoa sáp & đặt mua
├── workshop.html           # Lịch học, danh sách ca lớp & form đặt chỗ workshop
├── tra-cuu.html            # Tra cứu đặt chỗ bằng Mã đặt chỗ + SĐT (đổi/huỷ lịch)
├── studio.html             # Studio Ops: Quản trị ca lớp, điểm danh, trạng thái vé
├── css/                    # Toàn bộ stylesheet giao diện
│   ├── styles.css          # Phong cách chung, reset, layout, component hệ thống
│   ├── product.css         # Style chi tiết sản phẩm, drawer giỏ hàng, modal
│   ├── studio.css          # Style bảng điều khiển vận hành Studio Ops
│   └── workshop.css        # Style lịch workshop, form đặt chỗ, timeline, modal
├── js/                     # Toàn bộ script xử lý logic frontend
│   ├── main.js             # Navigation, giỏ hàng localStorage, animation, toast
│   ├── product.js          # Logic trang chi tiết sản phẩm, gallery ảnh
│   ├── booking.js          # Engine mô phỏng quản lý đặt chỗ, session, trạng thái
│   ├── workshop.js         # Luồng form đặt chỗ, đếm ngược giữ chỗ, xuất vé ICS
│   ├── lookup.js           # Logic tra cứu, kiểm tra mã đặt chỗ, đổi ca lớp, huỷ vé
│   ├── studio.js           # Logic dashboard Studio Ops, cập nhật trạng thái ca
│   └── lenis.min.js        # Thư viện cuộn mượt (Smooth Scrolling)
├── assets/                 # Tài nguyên hình ảnh định dạng WebP đã tối ưu
└── docs/                   # Tài liệu thiết kế & đặc tả luồng
    └── yeu-cau-prototype.md # Yêu cầu prototype & checklist trạng thái
```

---

## 🚀 Hướng dẫn chạy thử nghiệm

Dự án là ứng dụng thuần Web (HTML5 / CSS3 / Vanilla JavaScript), không phụ thuộc vào build tools phức tạp:

1. **Cách 1: Sử dụng VS Code Live Server**
   - Mở thư mục dự án trong VS Code.
   - Nhấp chuột phải vào `index.html` $\rightarrow$ chọn **Open with Live Server**.

2. **Cách 2: Sử dụng máy chủ HTTP cục bộ**
   ```bash
   # Dùng Python 3
   python -m http.server 3000

   # Hoặc dùng npx serve
   npx serve .
   ```
   Sau đó truy cập `http://localhost:3000` trên trình duyệt.

3. **Cách 3: Mở trực tiếp**
   - Nhấp đúp vào `index.html` để mở trực tiếp trong trình duyệt.

---

## 📑 Tài liệu đặc tả

Chi tiết các quyết định thiết kế luồng, danh sách trạng thái workshop và các kịch bản kiểm thử tham khảo tại: [docs/yeu-cau-prototype.md](docs/yeu-cau-prototype.md).
