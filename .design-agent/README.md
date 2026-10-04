# SÁPA Design Agent Framework

Hệ thống tài liệu thiết kế cho AI agent và developer làm việc trong repo SÁPA Studio.

## Cấu trúc

```
.design-agent/
├── tokens/          # Design tokens (JSON) — nguồn sự thật duy nhất
├── rules/           # Nguyên lý thiết kế SÁPA
├── components/      # Hướng dẫn style từng component
├── a11y/           # Quy tắc accessibility (WCAG 2.1 AA)
├── skills/         # Kỹ năng agent thực thi
├── commands/       # Lệnh agent chạy
├── reference/      # Tài liệu tham chiếu nhanh
└── hooks/          # Hook kiểm tra tự động
```

## Cách dùng

1. **Đọc `rules/design-rules.md`** trước khi bắt đầu — đây là nguyên lý nền tảng.
2. **Tham chiếu `tokens/design-tokens.json`** cho mọi giá trị màu, font, spacing — không hardcode.
3. **Xem `components/component-guide.md`** khi tạo/sửa component.
4. **Kiểm tra `a11y/accessibility-guide.md`** cho mọi thay đổi UI.
5. **Chạy `commands/`** để review và audit.
6. **Hook `hooks/`** chạy tự động trước commit và sau edit.

## Palette hiện tại

**Botanical Blush** — nền kem hồng ấm, ink nâu sô-cô-la, accent hồng dusty rose + xanh sage.

## Nguyên tắc cốt lõi

- Mọi màu phải lấy từ `tokens/design-tokens.json` — không tự chế màu.
- Mọi component mới phải tuân thủ `components/component-guide.md`.
- Contrast text phải đạt WCAG AA (4.5:1 cho text thường, 3:1 cho text lớn).
- Giữ tone *quiet luxury / handcrafted* — ấm, tinh tế, không rực rỡ.
