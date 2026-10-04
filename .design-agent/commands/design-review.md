# Command: Design Review

> Review UI theo SÁPA Design Rules.

## Cách chạy

Agent đọc các file sau và kiểm tra tuân thủ:

1. `rules/design-rules.md` — nguyên lý nền tảng.
2. `components/component-guide.md` — spec từng component.
3. `a11y/accessibility-guide.md` — quy tắc accessibility.
4. `tokens/design-tokens.json` — giá trị chuẩn.

## Checklist review

### Color

- [ ] Mọi màu dùng `var(--...)` — không hardcode hex ngoài `:root`.
- [ ] Overlay dùng `rgba(61,43,43,...)` (ink) — không `rgba(5,5,5,...)` hoặc `#000`.
- [ ] Glass/cream overlay dùng `rgba(255,250,247,...)` — không `rgba(244,238,230,...)` hoặc `#fff`.
- [ ] Không dùng đen thuần (`#000`, `#141414`) cho text — dùng `--ink`.
- [ ] Tỷ lệ màu: 85% nền/surface, 10% ink, 5% accent.

### Typography

- [ ] Tiêu đề dùng `font-display` (serif), `font-weight: 400`.
- [ ] Body dùng `font-body` (sans), `font-weight: 500`.
- [ ] Không bold serif.
- [ ] Font size dùng `clamp()` responsive.

### Spacing

- [ ] Container `--max: 1360px`.
- [ ] Padding dùng `--pad` (clamp).
- [ ] Touch target ≥ 44px (`--hit`).

### Motion

- [ ] Easing dùng `--ease` (cubic-bezier).
- [ ] Không bounce/elastic.
- [ ] `prefers-reduced-motion` được tôn trọng.

### Accessibility

- [ ] Contrast text ≥ 4.5:1 (AA).
- [ ] `:focus-visible` có outline.
- [ ] Skip link có.
- [ ] `lang="vi"` trên `<html>`.
- [ ] Form field có label.
- [ ] Icon button có `aria-label`.
- [ ] Màu không phải tín hiệu duy nhất.

### Component

- [ ] Button radius 2px, không bo tròn.
- [ ] Card hover translateY, không shadow mặc định.
- [ ] Modal backdrop ink 40%, panel cream.
- [ ] Drawer slide phải, 0.4s.
- [ ] Toast bottom center, ink bg.

## Output

Report dạng:

```
## Design Review Report

### ✅ Pass
- [danh sách đạt]

### ⚠️ Warning
- [danh sách cần chú ý]

### ❌ Fail
- [danh sách vi phạm, kèm file:line và gợi ý sửa]
```
