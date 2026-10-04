# Command: Component Audit

> Audit component theo Component Guide.

## Khi nào chạy

- Khi thêm component mới.
- Khi sửa component hiện có.
- Trước commit có thay đổi UI.

## Cách chạy

### 1. Xác định component cần audit

Đọc file CSS có thay đổi, xác định class component.

### 2. So sánh với guide

Mở `components/component-guide.md`, tìm section tương ứng.

### 3. Checklist từng component

#### Button
- [ ] `min-height: var(--hit)` (44px).
- [ ] `border-radius: 2px`.
- [ ] `font-size: 0.8125rem`, `font-weight: 500`.
- [ ] Hover: `translateY(-2px)`.
- [ ] Không dùng accent cho background.

#### Card (product/collection)
- [ ] `background: var(--surface)` cho media placeholder.
- [ ] Hover: `translateY(-4px)` + image `scale(1.04)`.
- [ ] Không border mặc định.
- [ ] Aspect-ratio đúng (4:5 product, 1:1 note).

#### Hero
- [ ] `min-height: 100dvh`.
- [ ] `color: var(--cream)`.
- [ ] Overlay: `rgba(61,43,43,...)` gradient 3 dải.
- [ ] Hero card: `var(--cream)` bg, `var(--ink)` text.

#### Nav
- [ ] `position: fixed`.
- [ ] Color: cream trên ảnh, ink trên nền sáng.
- [ ] Link hover: underline scale từ trái.
- [ ] Burger menu < 1100px.

#### Drawer
- [ ] Slide từ phải, `0.4s var(--ease)`.
- [ ] `background: var(--cream)`, `color: var(--ink)`.
- [ ] Overlay: `rgba(61,43,43,0.35)` + blur.

#### Modal
- [ ] Backdrop: `rgba(61,43,43,0.4)`.
- [ ] Panel: `var(--cream)`, `border-radius: 6px`.
- [ ] Close button: tròn, cream bg.

#### Toast
- [ ] Bottom center.
- [ ] `background: var(--ink)`, `color: var(--cream)`.
- [ ] `border-radius: 4px`.

#### Form
- [ ] Input bg: `var(--cream)`.
- [ ] Border: `var(--line)`, focus: `var(--ink)`.
- [ ] Label: `font-weight: 600`.
- [ ] Message: ok `var(--ok)`, err `var(--danger)`.

#### Chip/Pill
- [ ] `border-radius: 999px`.
- [ ] Active: `var(--ink)` bg, `var(--cream)` text.
- [ ] Pill status: text + màu (không chỉ màu).

### 4. Kiểm tra responsive

- [ ] Desktop: grid đầy đủ.
- [ ] Tablet (≤1100px): giảm cột.
- [ ] Mobile (≤800px): 1 cột.
- [ ] Small (≤520px): tối giản.

### 5. Kiểm tra accessibility

- [ ] Touch target ≥ 44px.
- [ ] `:focus-visible` outline.
- [ ] `aria-label` cho icon button.
- [ ] `prefers-reduced-motion`.

## Output

```
## Component Audit: [tên component]

### ✅ Pass
- Touch target: 44px ✓
- Border radius: 2px ✓

### ❌ Fail
- Background hardcode #f5e8e0 → nên dùng var(--surface)
  File: css/styles.css:234

### ⚠️ Warning
- Không có :focus-visible → thêm outline
```
