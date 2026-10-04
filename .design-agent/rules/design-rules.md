# SÁPA Design Rules — Nguyên lý thiết kế

## 1. Tone & Mood

**Quiet luxury / handcrafted aesthetic.** SÁPA Studio là tiệm hoa sáp nghệ thuật + workshop trải nghiệm. Thiết kế phải truyền cảm giác:

- **Ấm áp** — không lạnh, không rực rỡ. Nền kem hồng, ink nâu thay đen.
- **Tinh tế** — khoảng trắng nhiều, typography serif cho tiêu đề, chuyển động chậm mượt.
- **Tự nhiên** — màu hoa (dusty rose), màu lá (sage), màu đất (cam đất). Không neon, không màu primary thuần.
- **Thủ công** — font serif Hedvig Letters, border-radius nhỏ (2–6px), không bo tròn quá nhiều.

## 2. Color Usage

### Khi nào dùng màu nào

| Màu | Dùng cho | Không dùng cho |
|---|---|---|
| `--bg` `#fdf6f0` | Nền trang | Card, panel |
| `--surface` `#f5e8e0` | Card, section phụ, placeholder ảnh | Nền chính, text |
| `--ink` `#3d2b2b` | Text chính, button dark, border active | Nền, overlay |
| `--cream` `#fffaf7` | Card sáng, text trên nền tối, modal | Nền trang |
| `--accent` `#d98a8a` | CTA nổi bật, badge, focus ring | Text body, nền lớn |
| `--accent-2` `#a8c4a0` | Tag "workshop", trạng thái nhẹ | CTA chính, error |
| `--sale` `#c9785f` | Giá sale, slot thấp, cảnh báo ấm | Error, thành công |
| `--danger` `#a64545` | Lỗi, huỷ, trạng thái nguy hiểm | CTA, thành công |
| `--ok` `#6b8e5a` | Thành công, xác nhận, slot còn chỗ | Error, CTA |

### Overlay & Gradient

- Overlay trên ảnh: `rgba(61, 43, 43, opacity)` — dùng ink, không dùng đen `#000`.
- Glass effect: `rgba(255, 250, 247, opacity)` — dùng cream, không dùng trắng `#fff`.
- Box-shadow: `rgba(0, 0, 0, opacity)` — shadow giữ neutral đen (tự nhiên).

### Tỷ lệ màu

- Nền + surface + cream = **85%** diện tích (tone ấm, nhẹ).
- Ink (text) = **10%** (đậm, contrast).
- Accent + accent-2 + sale = **5%** (điểm xuyết, nổi bật).

## 3. Typography

### Font stack

- **Display**: `"Hedvig Letters Serif", "Times New Roman", serif` — tiêu đề, logo, quote.
- **Body**: `"Inter", system-ui, sans-serif` — body text, UI, button.

### Quy tắc

- Tiêu đề (h1–h3, logo, quote) → `font-display`, `font-weight: 400` (không bold).
- Body text, button, label → `font-body`, `font-weight: 500` (medium).
- Strong/emphasis → `font-weight: 600`.
- Letter-spacing: tiêu đề `normal`, logo `0.22em`, eyebrow `0.06em uppercase`.
- Line-height: tiêu đề `1.25`, body `1.55`, quote `1.3`.

### Scale

| Token | Value | Dùng cho |
|---|---|---|
| `h1` | `clamp(1.85rem, 4vw, 3.15rem)` | Hero title |
| `h2` | `clamp(1.65rem, 2.8vw, 2.35rem)` | Section head |
| `h3` | `clamp(1.45rem, 2.2vw, 2rem)` | Sub-section, card title |
| `lead` | `clamp(1.35rem, 2.4vw, 1.95rem)` | Story lead, intro |
| `body` | `0.9375rem` (15px) | Body text mặc định |
| `small` | `0.8125rem` (13px) | Button, chip, meta |
| `caption` | `0.75rem` (12px) | Caption, tag, badge |

## 4. Spacing & Layout

### Container

- `--max: 1360px` — chiều rộng tối đa, căn giữa.
- `--pad: clamp(1rem, 2.22vw, 2rem)` — padding responsive.
- Section padding: `clamp(2.75rem, 6vw, 5rem)` trên/dưới.

### Grid

- Product grid: 4 cột → 2 cột (<1100px) → 1 cột (<520px).
- Formula/story: 2 cột → 1 cột (<800px).
- Footer cols: 4 cột → 1 cột (<800px).

### Touch target

- `--hit: 44px` — kích thước tối thiểu cho mọi vùng chạm (button, link, icon).

## 5. Motion

### Easing

- `--ease: cubic-bezier(0.22, 1, 0.36, 1)` — smooth decelerate, dùng cho mọi transition chính.

### Duration

| Loại | Thời gian | Dùng cho |
|---|---|---|
| Fast | 0.2s | Hover, color change, border |
| Normal | 0.35s | Transform, toggle, nav |
| Slow | 0.45s | Reveal, slide, drawer |
| Slower | 0.85s | Page reveal, hero entrance |

### Nguyên tắc

- Chuyển động **chậm và mượt** — không bounce, không elastic.
- Reveal: opacity + translateY (24px), stagger qua `--d`.
- Hover: translateY (-2px đến -6px) + shadow.
- `prefers-reduced-motion: reduce` → tắt toàn bộ animation/transition.

## 6. Border & Radius

| Token | Value | Dùng cho |
|---|---|---|
| `sm` | 2px | Button, input, chip, badge |
| `md` | 4px | Card, panel, review card |
| `lg` | 6px | Modal, section lớn |
| `xl` | 8px | Hero card, sticky bar |
| `pill` | 999px | Chip active, pill, variant |

## 7. Don't

- ❌ Dùng đen thuần `#000` hoặc `#141414` cho text — dùng `--ink` nâu.
- ❌ Dùng trắng `#fff` cho nền — dùng `--cream` hoặc `--bg`.
- ❌ Dùng màu primary rực rỡ (blue, green thuần) — dùng accent ấm.
- ❌ Bo tròn quá lớn (16px+) — giữ radius nhỏ, handcrafted.
- ❌ Bold serif — serif luôn `font-weight: 400`.
- ❌ Hardcode hex — luôn dùng `var(--...)`.
- ❌ Animation bounce/elastic — chỉ smooth ease.
