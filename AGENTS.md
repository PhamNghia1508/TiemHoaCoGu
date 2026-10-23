# Tiệm Hoa Có Gu — Next.js frontend

Next.js App Router + TypeScript + React. Frontend repository tách biệt backend .NET ở `ZidenVN/TiemHoaCoGu_BE`.

## Commands

- `npm ci`, `npm run dev` (port 3000)
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- `npm run test:e2e` cần server chạy và Chromium; xem README.

## Boundaries

- UI hiện là bản trải nghiệm, không nhận đơn/đặt chỗ/thanh toán thật.
- Dữ liệu trong `src/lib/catalog.ts`; đây không phải backend GUID hoặc tồn kho.
- API layer ở `src/lib/api/` chỉ dùng server, với `API_BASE_URL` và JWT từ server session. Không import vào Client Components.
- Không fake thông báo giao dịch thành công, lịch còn chỗ, review hoặc số khách.
- Không lưu PII, token hoặc địa chỉ trong localStorage. Giỏ/favorites là dữ liệu cục bộ không nhạy cảm.
- Giữ thông báo rõ cho các form preview. Chỉ bật write flow sau khi hoàn thiện auth, adapter và kiểm tra tích hợp.
- Không sửa hoặc merge backend từ frontend task. Không merge PR khi chưa được yêu cầu.

## Design

Botanical Play: cobalt `#243db5`, citrus `#ebf28b`, warmwhite `#fffdf8`, lilac `#ece7f5`, nearblack `#1c2326`. Be Vietnam Pro 800 chủ đạo, Cormorant italic chỉ accent nhỏ. `globals.css` là design system chung, `commerce.css` và `studio.css` là các layer scoped được import sau. Không quay lại hướng editorial serif/ngà–mận cũ. Tránh UI kit, gradient loang, glassmorphism và số liệu/review hư cấu. Responsive 320px+, reduced motion, focus rõ, accessible labels và keyboard navigation. Xem `docs/DESIGN-RETHINK.md` trước khi sửa bố cục.

Ảnh từ repository gốc nằm trong `public/images/`. Tài liệu prototype cũ trong `docs/yeu-cau-prototype.md` chỉ là tham chiếu lịch sử, không phải trạng thái đã triển khai.
