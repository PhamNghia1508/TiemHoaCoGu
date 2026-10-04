# Dữ liệu SÁPA Studio

Thư mục này chứa dữ liệu danh mục hoa sáp và workshop. Chỉnh sửa file JSON rồi lưu — nội dung sẽ cập nhật trên trang.

## File

| File | Nội dung |
|---|---|
| `products.json` | Danh mục hoa sáp (bó, lọ, set DIY, nến, thẻ quà) |
| `workshops.json` | Các lớp workshop (cơ bản, nâng cao, gia đình) |

---

## Schema `products.json`

Mỗi phần tử là một sản phẩm:

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | string | ✅ | Định danh duyên, không dấu, dùng cho giỏ hàng (VD: `trang-non`) |
| `name` | string | ✅ | Tên hiển thị (VD: `Bó Trăng Non`) |
| `category` | string | ✅ | `bo` (bó), `lo` (lọ/nến), `diy` (set/phụ kiện) |
| `price` | number | ✅ | Giá hiện tại, đơn vị VNĐ (VD: `420000`) |
| `oldPrice` | number\|null | | Giá gốc (gạch ngang), `null` nếu không giảm |
| `image` | string | ✅ | Đường dẫn ảnh trong `assets/` (VD: `assets/prod-bouquet.webp`) |
| `description` | string | ✅ | Mô tả ngắn hiển thị trong quick view |
| `badge` | string\|null | | Nhãn nổi bật (VD: `-19%`, `Hot`, `Tiết kiệm`), `null` nếu không |
| `href` | string\|null | | Link đến trang chi tiết, `null` nếu chỉ quick view |
| `section` | string | ✅ | `arrivals` (Bó & Set quà) hoặc `discover` (Set & phụ kiện) |
| `featured` | boolean | | Hiển thị trên hero card carousel |
| `inStock` | boolean | | Còn hàng hay hết |

### Cách thêm sản phẩm mới

```json
{
  "id": "ten-san-pham",
  "name": "Tên Sản Phẩm",
  "category": "bo",
  "price": 350000,
  "oldPrice": null,
  "image": "assets/ten-anh.webp",
  "description": "Mô tả ngắn gọn.",
  "badge": null,
  "href": null,
  "section": "arrivals",
  "featured": false,
  "inStock": true
}
```

---

## Schema `workshops.json`

Mỗi phần tử là một lớp workshop:

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `id` | string | ✅ | Định danh lớp (VD: `ws-co-ban`) |
| `name` | string | ✅ | Tên đầy đủ (VD: `Hoa Sáp Cơ Bản`) |
| `shortName` | string | ✅ | Tên rút gọn trên card (VD: `WS Hoa Sáp Cơ Bản`) |
| `category` | string | ✅ | `basic`, `advance`, hoặc `kid` |
| `price` | number | ✅ | Giá / người hoặc / cặp, VNĐ |
| `priceLabel` | string | ✅ | Giá hiển thị (VD: `450.000₫ / người`) |
| `image` | string | ✅ | Ảnh đại diện |
| `description` | string | ✅ | Mô tả ngắn trên card |
| `badge` | string\|null | | Nhãn (VD: `Hot`), `null` nếu không |
| `tag` | string | ✅ | Nhãn phân loại (VD: `Cơ bản`, `Phổ biến`) |
| `lead` | string | ✅ | Mô tả dài trong modal chi tiết |
| `meta` | array | ✅ | Thông tin nhanh: `[{label, value}]` |
| `goals` | string[] | ✅ | Mục tiêu / kỹ năng học được |
| `includes` | string[] | ✅ | Bao gồm những gì |
| `forWho` | string | ✅ | Đối tượng phù hợp |
| `capacity` | number | ✅ | Sức chứa tối đa |
| `duration` | string | ✅ | Thời lượng (VD: `2.5 giờ`) |
| `featured` | boolean | | Hiển thị nổi bật |

### Cách thêm workshop mới

```json
{
  "id": "ws-ten-lop",
  "name": "Tên Lớp",
  "shortName": "WS Tên Lớp",
  "category": "basic",
  "price": 450000,
  "priceLabel": "450.000₫ / người",
  "image": "assets/ten-anh.webp",
  "description": "Mô tả ngắn.",
  "badge": null,
  "tag": "Cơ bản",
  "lead": "Mô tả dài cho modal chi tiết.",
  "meta": [
    { "label": "Thời lượng", "value": "2.5 giờ" },
    { "label": "Giá", "value": "450.000₫ / người" },
    { "label": "Sức chứa", "value": "8 người" },
    { "label": "Mang về", "value": "3 bông + lọ mini" }
  ],
  "goals": ["Kỹ năng 1", "Kỹ năng 2"],
  "includes": ["Vật liệu", "Trà bánh"],
  "forWho": "Đối tượng phù hợp.",
  "capacity": 8,
  "duration": "2.5 giờ",
  "featured": false
}
```

---

## Lưu ý

- **Giá**: nhập số nguyên VNĐ, không dấu chấm (VD: `420000` → hiển thị `420.000₫`)
- **Ảnh**: đặt file WebP vào thư mục `assets/`, đường dẫn bắt đầu bằng `assets/`
- **ID**: duy nhất, không trùng, không dấu, dùng dấu gạch ngang (VD: `bo-trang-non`)
- **Category sản phẩm**: `bo` = bó hoa, `lo` = lọ/nến, `diy` = set/phụ kiện
- **Category workshop**: `basic` = cơ bản, `advance` = nâng cao, `kid` = gia đình
