# Color Palette — Botanical Blush

> Tham chiếu nhanh. Nguồn sự thật: `tokens/design-tokens.json`.

## Bảng màu chính

| Token | CSS Var | Hex | RGB | Mô tả |
|---|---|---|---|---|
| `color.bg` | `--bg` | `#fdf6f0` | 253, 246, 240 | Nền chính — kem hồng nhẹ |
| `color.surface` | `--surface` | `#f5e8e0` | 245, 232, 224 | Card, section phụ |
| `color.ink` | `--ink` | `#3d2b2b` | 61, 43, 43 | Text chính — nâu sô-cô-la |
| `color.cream` | `--cream` | `#fffaf7` | 255, 250, 247 | Card sáng, text trên nền tối |
| `color.accent` | `--accent` | `#d98a8a` | 217, 138, 138 | Hồng dusty rose — CTA, badge |
| `color.accent2` | `--accent-2` | `#a8c4a0` | 168, 196, 160 | Xanh sage — tag workshop |
| `color.sale` | `--sale` | `#c9785f` | 201, 120, 95 | Cam đất — giá sale, slot thấp |
| `color.danger` | `--danger` | `#a64545` | 166, 69, 69 | Đỏ ấm — lỗi, huỷ |
| `color.ok` | `--ok` | `#6b8e5a` | 107, 142, 90 | Xanh sage đậm — thành công |

## Bảng phụ

| Token | CSS Var | Value | Mô tả |
|---|---|---|---|
| `color.inkSoft` | `--ink-soft` | `rgba(61,43,43,0.68)` | Text phụ |
| `color.inkMid` | `--ink-mid` | `rgba(61,43,43,0.8)` | Text trung bình |
| `color.line` | `--line` | `rgba(61,43,43,0.15)` | Border, divider |
| `color.focus` | `--focus` | `#3d2b2b` | Focus ring |

## Overlay

| Mục đích | Value |
|---|---|
| Overlay trên ảnh (tối) | `rgba(61, 43, 43, 0.25–0.55)` |
| Glass effect (sáng) | `rgba(255, 250, 247, 0.06–0.35)` |
| Box-shadow | `rgba(0, 0, 0, 0.12–0.18)` (neutral) |
| Form msg trên nền tối | ok: `#b8d8a8`, err: `#e8b8b8` |

## Gradient chuẩn

```css
/* Hero overlay */
linear-gradient(180deg,
  rgba(61,43,43,0.35) 0%,
  rgba(61,43,43,0.05) 35%,
  rgba(61,43,43,0.5) 100%);

/* Banner shade */
linear-gradient(180deg, rgba(61,43,43,0.3), rgba(61,43,43,0.45));

/* Collection shade */
linear-gradient(180deg, rgba(61,43,43,0.35), rgba(61,43,43,0.5));

/* Club shade */
linear-gradient(180deg, rgba(61,43,43,0.25), rgba(61,43,43,0.55));
```

## Tỷ lệ sử dụng

```
████████████████████████  85%  bg / surface / cream (nền)
███                       10%  ink (text)
█                          5%  accent / accent-2 / sale (điểm xuyết)
```
