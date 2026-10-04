# Accessibility Guide — WCAG 2.1 AA

> Mọi thay đổi UI phải đạt WCAG 2.1 Level AA. Đây là yêu cầu bắt buộc, không tùy chọn.

## 1. Contrast Ratio

### Yêu cầu

| Loại text | Tối thiểu | Tối thiểu (text lớn ≥18px) |
|---|---|---|
| Body text | 4.5:1 | 3:1 |
| UI component (border, icon) | — | 3:1 |

### Bảng contrast palette Botanical Blush

| Cặp | Foreground | Background | Ratio | Đạt? |
|---|---|---|---|---|
| Text chính | `#3d2b2b` ink | `#fdf6f0` bg | **10.2:1** | ✅ AAA |
| Text chính | `#3d2b2b` ink | `#fffaf7` cream | **10.5:1** | ✅ AAA |
| Text chính | `#3d2b2b` ink | `#f5e8e0` surface | **8.9:1** | ✅ AAA |
| Text phụ | ink 68% | bg | ~7.0:1 | ✅ AAA |
| Text phụ | ink 68% | surface | ~6.1:1 | ✅ AA |
| Text trên tối | `#fffaf7` cream | `#3d2b2b` ink | **10.5:1** | ✅ AAA |
| Accent | `#d98a8a` | `#fffaf7` cream | **2.8:1** | ⚠️ Chỉ UI, không text thường |
| Accent | `#d98a8a` | `#fdf6f0` bg | **2.7:1** | ⚠️ Chỉ UI, không text thường |
| Sale | `#c9785f` | `#fffaf7` cream | **3.9:1** | ⚠️ Text lớn OK, thường thì cần bold ≥14px |
| OK | `#6b8e5a` | `#fffaf7` cream | **3.5:1** | ⚠️ Text lớn OK |
| Danger | `#a64545` | `#fffaf7` cream | **5.6:1** | ✅ AA |

### Quy tắc

- `--accent` (`#d98a8a`) **không dùng cho text thường** — chỉ dùng cho badge, icon, decorative, focus ring (≥3:1 với nền).
- `--sale` (`#c9785f`) dùng cho text **lớn (≥18px) hoặc bold (≥14px)** — không dùng cho body text nhỏ.
- `--ok` (`#6b8e5a`) dùng cho text **lớn hoặc bold** — không dùng cho body text nhỏ.
- `--ink` trên `--bg`/`--cream`/`--surface` luôn đạt AAA — an toàn cho mọi text.
- Trên nền tối (hero, banner, club): `--cream` text luôn đạt AAA.

## 2. Keyboard Navigation

### Yêu cầu

- Mọi element tương tác (button, link, input, select) phải **reachable bằng Tab**.
- Thứ tự tab phải **logic** (trái → phải, trên → xuống).
- Không dùng `tabindex` dương (>0) — để DOM tự quyết định thứ tự.
- `display: none` / `visibility: hidden` → loại khỏi tab. Dùng `[hidden]` attribute.

### Focus Visible

```css
:focus-visible {
  outline: 2px solid var(--focus);   /* #3d2b2b */
  outline-offset: 3px;
  border-radius: 2px;
}
```

- Trên nền tối (hero, club, banner): `outline-color: #fff` (cream/white).
- Trên nền sáng (drawer, modal): `outline-color: var(--ink)`.
- **Không bao giờ** `outline: none` mà không có `:focus-visible` thay thế.

### Skip Link

```html
<a href="#main" class="skip-link">Bỏ qua tới nội dung</a>
```

- Phải có skip link tới `#main` cho screen reader.
- Ẩn mặc định, hiện khi focus.

## 3. Screen Reader

### Yêu cầu

- Mọi ảnh thông tin phải có `alt` mô tả. Ảnh decorative: `alt=""`.
- Button icon phải có `aria-label` hoặc `.sr-only` text.
- Trạng thái động (modal, drawer, toast) phải có `role` và `aria-*` phù hợp.
- Form input phải có `<label>` liên kết (`for` + `id`).

### sr-only class

```css
.sr-only {
  position: absolute; width: 1px; height: 1px;
  overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap;
}
```

### Checklist

- [ ] `html` có `lang="vi"`.
- [ ] Mỗi page có `<title>` duy nhất.
- [ ] Heading hierarchy không bỏ cấp (h1 → h3 mà thiếu h2).
- [ ] Form field có label.
- [ ] Button icon có aria-label.
- [ ] Modal có `role="dialog"` + `aria-modal="true"`.
- [ ] Live region cho toast (`aria-live="polite"`).

## 4. Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
  }
}
```

- Tôn trọng `prefers-reduced-motion` — tắt toàn bộ animation/transition.
- Page vẫn functional khi animation tắt — reveal elements phải `opacity: 1`.

## 5. Touch Target

- `--hit: 44px` — mọi vùng chạm tối thiểu 44×44px.
- Button, link nav, icon button, chip — đều phải đạt tối thiểu này.
- Mobile: tăng padding nếu cần để đạt 44px.

## 6. Color không phải tín hiệu duy nhất

- Không dùng màu để truyền thông tin quan trọng (lỗi, trạng thái).
- Luôn có **text label** kèm màu (ví dụ: "Còn 2 chỗ" + màu sale, không chỉ màu).
- Pill trạng thái có text, không chỉ màu.
