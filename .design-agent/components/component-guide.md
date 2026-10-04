# Component Guide — Hướng dẫn style từng component

> Mọi component mới phải tuân thủ guide này. Xem `rules/design-rules.md` cho nguyên lý nền tảng.

## Button

### Variants

| Class | Background | Text | Border | Dùng khi |
|---|---|---|---|---|
| `.btn--cream` | `--cream` | `--ink` | `--cream` | CTA chính trên nền tối |
| `.btn--dark` | `--ink` | `--cream` | transparent | CTA chính trên nền sáng |
| `.btn--glass` | cream 6% | `--cream` | cream 35% | CTA phụ trên ảnh hero |
| `.btn--ghost-dark` | transparent | `--ink` | `--line` | CTA phụ trên nền sáng |

### Spec

```css
.btn {
  min-height: var(--hit);          /* 44px */
  padding: 0.75rem 1.75rem;
  border-radius: 2px;              /* sm */
  font-size: 0.8125rem;            /* small */
  font-weight: 500;
  transition: transform 0.35s var(--ease), background 0.25s, color 0.25s, border-color 0.25s;
}
.btn:hover { transform: translate3d(0, -2px, 0); }
```

### Do / Don't

- ✅ Hover: translateY -2px + đổi background/color.
- ✅ Border-radius 2px, không bo tròn.
- ❌ Không dùng accent cho button nền — accent chỉ cho badge/focus.
- ❌ Không bold button text — `font-weight: 500`.

---

## Product Card

### Spec

```css
.product-card {
  display: flex;
  flex-direction: column;
  transition: transform 0.45s var(--ease);
}
.product-card:hover { transform: translate3d(0, -4px, 0); }
.product-card__media {
  aspect-ratio: 4 / 5;
  background: var(--surface);
  overflow: hidden;
}
```

### Do / Don't

- ✅ Media aspect-ratio 4:5, background `--surface` (placeholder).
- ✅ Hover: card translateY -4px, image scale 1.04.
- ✅ Price: `font-weight: 500`, giá cũ `<s>` dùng `--ink-soft`.
- ❌ Không border trên card — chỉ border khi hover/active.
- ❌ Không shadow trên card mặc định.

---

## Hero

### Spec

```css
.hero {
  min-height: 100dvh;
  color: var(--cream);
  overflow: hidden;
}
.hero-overlay {
  background: linear-gradient(180deg,
    rgba(61,43,43,0.35) 0%,
    rgba(61,43,43,0.05) 35%,
    rgba(61,43,43,0.5) 100%);
}
```

### Do / Don't

- ✅ Overlay dùng ink (nâu) với 3 dải gradient, không dùng đen.
- ✅ Hero content: opacity + translateY entrance, delay 0.15s.
- ✅ Hero card: `--cream` background, `--ink` text, shadow card.
- ❌ Không dùng `#000` cho overlay.
- ❌ Không zoom image quá nhanh — 8s ease.

---

## Nav

### Spec

```css
.nav {
  position: fixed;
  color: var(--cream);       /* trên ảnh hero */
  transition: color 0.35s ease, transform 0.45s var(--ease);
}
.nav--on-light { color: var(--ink); }  /* trên nền sáng */
```

### Do / Don't

- ✅ Nav text color đổi giữa cream (trên ảnh) và ink (trên nền sáng).
- ✅ Link hover: underline scale từ trái, 1px, currentColor.
- ✅ Mobile: burger menu, background `--bg`.
- ❌ Không background cố định trên nav — transparent cho đến khi scroll.

---

## Drawer (Cart)

### Spec

```css
.drawer {
  width: min(400px, 100%);
  background: var(--cream);
  color: var(--ink);
  box-shadow: -12px 0 40px rgba(0,0,0,0.12);
  transform: translate3d(100%, 0, 0);
  transition: transform 0.4s var(--ease);
}
```

### Do / Don't

- ✅ Slide từ phải, 0.4s ease.
- ✅ Background `--cream`, text `--ink`.
- ✅ Overlay: `rgba(61,43,43,0.35)` + blur 2px.
- ❌ Không slide từ trái hoặc bottom.

---

## Modal (Quick View / Workshop Detail)

### Spec

```css
.modal {
  background: rgba(61,43,43,0.4);
  /* panel */
  .modal__panel {
    background: var(--cream);
    border-radius: 6px;       /* lg */
    grid-template-columns: 1fr 1fr;
  }
}
```

### Do / Don't

- ✅ Backdrop: ink 40% trong suốt.
- ✅ Panel: `--cream` bg, radius 6px, 2 cột (media + body).
- ✅ Close button: tròn, `--cream` bg, `--line` border.
- ❌ Không radius quá lớn (8px+) cho modal.

---

## Toast

### Spec

```css
.toast {
  background: var(--ink);
  color: var(--cream);
  border-radius: 4px;        /* md */
  font-size: 0.9rem;
  transition: opacity 0.3s ease, transform 0.3s var(--ease);
}
```

### Do / Don't

- ✅ Bottom center, translateY entrance.
- ✅ Background `--ink`, text `--cream`.
- ❌ Không dùng accent cho toast — ink/cream đủ contrast.

---

## Form

### Spec

```css
.ws-form input {
  min-height: 46px;
  border: 1px solid var(--line);
  border-radius: 4px;
  background: var(--cream);
  color: var(--ink);
}
.ws-form input:focus-visible {
  border-color: var(--ink);
}
```

### Do / Don't

- ✅ Input bg: `--cream`, border: `--line`, focus border: `--ink`.
- ✅ Placeholder: `rgba(61,43,43,0.45)`.
- ✅ Label: `font-weight: 600`, `0.8125rem`.
- ✅ Form message ok: `--ok`, err: `--danger`.
- ✅ Trên nền tối: ok `#b8d8a8`, err `#e8b8b8`.
- ❌ Không background `#fff` — dùng `--cream`.
- ❌ Không border focus dùng accent — dùng `--ink`.

---

## Chip / Pill / Badge

### Spec

```css
.chip {
  border: 1px solid var(--line);
  border-radius: 999px;       /* pill */
  background: transparent;
}
.chip.is-on {
  background: var(--ink);
  color: var(--cream);
  border-color: var(--ink);
}
.pill {
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}
```

### Do / Don't

- ✅ Chip active: `--ink` bg, `--cream` text.
- ✅ Pill status: `--ok` (thành công), `--sale` (cảnh báo), `--danger` (đầy/lỗi).
- ❌ Không dùng accent cho chip active — ink/cream đủ.

---

## Section Head

### Spec

```css
.section-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}
.section-head h2 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.65rem, 2.8vw, 2.35rem);
}
```

### Do / Don't

- ✅ h2 dùng `font-display`, `font-weight: 400`.
- ✅ Flex: title trái, filter/action phải.
- ❌ Không bold section title.
