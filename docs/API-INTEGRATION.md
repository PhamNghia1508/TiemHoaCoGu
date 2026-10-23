# API integration

Client nằm tại `src/lib/api/`, viết cho Next.js và **chỉ chạy ở server**.

## Cấu hình

Đặt biến môi trường server (không dùng `NEXT_PUBLIC_`):

```env
API_BASE_URL=http://localhost:5000
```

`API_BASE_URL` bắt buộc. Khi thiếu, client ném lỗi cấu hình; không có mock/fake success. Mỗi request timeout mặc định 10 giây, có thể truyền `{ timeoutMs }`. `apiFetch` ném `ApiError` với `status`, `message`, `details`; lỗi mạng có status `0`, timeout `408`.

## Dùng

```ts
import { catalogApi, ordersApi } from '@/lib/api';

const catalog = catalogApi();
const page = await catalog.products({ page: 1, pageSize: 20, categoryId });
const product = await catalog.product(productId);

// Route checkout thật; chỉ gọi sau khi đã có dữ liệu giỏ hàng hợp lệ.
const order = await ordersApi({ token: accessToken }).checkout({
  shippingAddress: '...',
  items: [{ productId, quantity: 1 }],
});
```

Token không được tự lưu hay expose ra client; truyền token từ server session vào `ApiClientOptions`. `fetch` dùng `cache: "no-store"`.

## Routes storefront đã map

- Catalog công khai: `GET /api/catalog/products`, `GET /api/catalog/products/{id}`, `GET /api/catalog/categories`.
- Orders: `POST /api/orders/checkout`; các `GET /api/orders*` cần đăng nhập.
- Custom orders: toàn bộ `/api/custom-orders` cần đăng nhập; client có create/revise/list/quote/approve/checkout.
- Workshops: `GET /api/workshops`, `GET /api/workshops/{id}`, `GET /api/workshops/{id}/sessions`.
- Bookings: tạo hold tại `POST /api/bookings/sessions/{sessionId}`; đọc booking cần đăng nhập.
- CMS catalog đọc: `GET /api/management/categories`, `GET /api/management/products`; cần role `Admin`. Client không map thao tác ghi CMS/staff.

Các type trong `client.ts` phản ánh DTO backend hiện tại (camelCase JSON mặc định ASP.NET). Giá là `number` (decimal JSON), thời gian là chuỗi ISO/TimeSpan từ API.

## Giới hạn / lưu ý

- Không gọi API ghi dữ liệu trong module này tự động; các method ghi chỉ tạo request khi code ứng dụng gọi rõ ràng.
- Backend hiện yêu cầu JWT cho orders của người dùng, custom orders, bookings và role Admin cho CMS; API client không tự refresh token.
- Không map cart riêng vì backend controller có thể yêu cầu trạng thái đăng nhập; checkout nhận `items` trực tiếp theo `CheckoutRequest` thật.
- Không đưa `API_BASE_URL` vào bundle trình duyệt và không import module này trong Client Component. CORS, JWT issuance, payment và refresh token do lớp ứng dụng/backend xử lý.

## Trạng thái giao diện hiện tại

Client này chưa được nối vào UI trải nghiệm. Đặt `API_BASE_URL` không tự chuyển website sang live. Cần adapter dữ liệu, product ID GUID thật, server session/auth, shipping quote và write-flow được test. Không gọi checkout bằng slug/giá từ `src/lib/catalog.ts`.
