# Skill: Add Component

> Cách thêm component mới tuân thủ SÁPA Design System.

## Khi nào dùng

Khi cần tạo component UI mới (card, panel, form section, widget...).

## Các bước

### 1. Xem rules và guide

- Đọc `rules/design-rules.md` — nguyên lý tone, màu, typography, spacing, motion.
- Đọc `components/component-guide.md` — xem component tương tự đã có.

### 2. Chọn token, không hardcode

```css
/* ✅ ĐÚNG */
.my-card {
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 4px;    /* md */
  padding: 1.25rem;
  transition: transform 0.45s var(--ease);
}

/* ❌ SAI */
.my-card {
  background: #f5e8e0;        /* hardcode */
  color: #3d2b2b;            /* hardcode */
  border: 1px solid rgba(61,43,43,0.15);  /* hardcode */
  border-radius: 4px;
  transition: transform 0.45s cubic-bezier(0.22,1,0.36,1);  /* hardcode */
}
```

### 3. Tuân thủ spacing scale

| Kích thước | Value |
|---|---|
| xs | 0.25rem |
| sm | 0.5rem |
| md | 1rem |
| lg | 1.5rem |
| xl | 2rem |
| 2xl | 2.75rem |

### 4. Tuân thủ radius

- Button/input/chip: 2px (sm)
- Card/panel: 4px (md)
- Modal/section: 6px (lg)
- Hero card/sticky: 8px (xl)
- Pill/variant: 999px

### 5. Tuân thủ motion

- Hover: `transform: translate3d(0, -2px, 0)` + `transition: transform 0.45s var(--ease)`.
- Reveal: `opacity: 0` + `translateY(24px)` → `opacity: 1` + `translateY(0)`.
- Duration: 0.2s (fast), 0.35s (normal), 0.45s (slow).

### 6. Accessibility

- Touch target tối thiểu 44px (`--hit`).
- `:focus-visible` với `outline: 2px solid var(--focus)`.
- Nếu có icon, thêm `aria-label`.
- Nếu có trạng thái, thêm text label (không chỉ màu).

### 7. Responsive

- Desktop (>1100px): full grid.
- Tablet (≤1100px): giảm cột.
- Mobile (≤800px): 1 cột, stack.
- Small (≤520px): tối giản thêm.

### 8. Đăng ký component

Thêm vào `components/component-guide.md` section tương ứng với:
- Spec CSS (code snippet)
- Do / Don't

## Checklist

- [ ] Dùng `var(--...)` cho mọi màu, font, spacing.
- [ ] Touch target ≥ 44px.
- [ ] `:focus-visible` có outline.
- [ ] Hover có feedback (transform/shadow/color).
- [ ] Responsive (desktop → mobile).
- [ ] `prefers-reduced-motion` được tôn trọng.
- [ ] Contrast text đạt WCAG AA.
