# Tiệm Hoa Có Gu — Next.js frontend

Next.js App Router + TypeScript + React. Frontend repository tách biệt backend .NET ở `ZidenVN/TiemHoaCoGu_BE`.

## Commands

- `npm ci`, `npm run dev` (port 3000)
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- `npm run test:e2e` cần server chạy và Chromium; xem README.

## Boundaries

- Không cấu hình API: UI chỉ là preview. Có API: dữ liệu đọc từ backend; lỗi API không được fallback demo. Chỉ mở ghi khi `STOREFRONT_WRITES_ENABLED=true` trong môi trường đã kiểm tra. Chưa mở bán production hoặc tích hợp provider thật.
- Dữ liệu mẫu trong `src/lib/catalog.ts` chỉ cho preview; adapter server `src/lib/storefront.ts` dùng GUID, giá và danh mục backend thật.
- API layer ở `src/lib/api/` chỉ dùng server, với `API_BASE_URL` và JWT từ server session. Không import vào Client Components.
- Không fake thông báo giao dịch thành công, lịch còn chỗ, review hoặc số khách.
- Không lưu PII, token hoặc địa chỉ trong localStorage. Giỏ/favorites là dữ liệu cục bộ không nhạy cảm.
- Giữ thông báo rõ cho preview/API. Ghi qua BFF `/api/store` same-origin, HttpOnly cookies, exact allowlist và write gate; không gọi trực tiếp backend từ client. Không thêm thanh toán/hoàn tiền provider khi chưa có contract/provider thực.
- Không sửa hoặc merge backend từ frontend task. Backend test phải chạy DB tạm và chỉ tài khoản tổng hợp; không dùng tài khoản/DB production. Không merge PR khi chưa được yêu cầu.

## Design

Botanical Play: cobalt `#243db5`, citrus `#ebf28b`, warmwhite `#fffdf8`, lilac `#ece7f5`, nearblack `#1c2326`. Be Vietnam Pro 800 chủ đạo, Cormorant italic chỉ accent nhỏ. `globals.css` là design system chung, `commerce.css` và `studio.css` là các layer scoped được import sau. Không quay lại hướng editorial serif/ngà–mận cũ. Tránh UI kit, gradient loang, glassmorphism và số liệu/review hư cấu. Responsive 320px+, reduced motion, focus rõ, accessible labels và keyboard navigation. Xem `docs/DESIGN-RETHINK.md` trước khi sửa bố cục.

Ảnh từ repository gốc nằm trong `public/images/`. Tài liệu prototype cũ trong `docs/yeu-cau-prototype.md` chỉ là tham chiếu lịch sử, không phải trạng thái đã triển khai.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
