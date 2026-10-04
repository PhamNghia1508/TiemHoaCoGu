# Design Tokens — Hướng dẫn sử dụng

`design-tokens.json` là **nguồn sự thật duy nhất** cho mọi giá trị thiết kế trong SÁPA Studio.

## Cấu trúc token

Mỗi token có 4 trường:

```json
{
  "value": "#fdf6f0",
  "type": "color",
  "rgb": "253, 246, 240",
  "description": "Nền chính — kem hồng nhẹ"
}
```

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| `value` | ✅ | Giá trị CSS sẵn sàng dùng |
| `type` | ✅ | Loại: `color`, `fontSize`, `spacing`, `borderRadius`, `shadow`, `easing`, `duration` |
| `rgb` | ❌ | Giá trị RGB thô (cho tính contrast) |
| `description` | ❌ | Mô tả mục đích sử dụng |

## Ánh xạ sang CSS Variables

Token JSON → CSS `:root` trong `css/styles.css`:

| Token JSON | CSS Variable |
|---|---|
| `color.bg` | `--bg` |
| `color.surface` | `--surface` |
| `color.ink` | `--ink` |
| `color.inkSoft` | `--ink-soft` |
| `color.inkMid` | `--ink-mid` |
| `color.cream` | `--cream` |
| `color.line` | `--line` |
| `color.accent` | `--accent` |
| `color.accent2` | `--accent-2` |
| `color.sale` | `--sale` |
| `color.danger` | `--danger` |
| `color.ok` | `--ok` |
| `color.focus` | `--focus` |
| `typography.fontDisplay` | `--font-display` |
| `typography.fontBody` | `--font-body` |
| `typography.fsBody` | `--fs-body` |
| `spacing.pad` | `--pad` |
| `spacing.max` | `--max` |
| `spacing.navH` | `--nav-h` |
| `spacing.hit` | `--hit` |
| `motion.ease` | `--ease` |

## Quy tắc

1. **Không hardcode màu** — luôn dùng `var(--...)` trong CSS.
2. **Khi thêm token mới** — thêm vào JSON trước, rồi thêm CSS variable tương ứng.
3. **Khi đổi giá trị** — đổi trong JSON, rồi đồng bộ sang CSS variable.
4. **Không tự chế giá trị** — nếu cần giá trị mới, thêm token, không nhét hex trực tiếp.
5. **Overlay/gradient** — dùng `colorOverlay.dark` / `colorOverlay.cream` với opacity phù hợp.

## Convert sang các hệ thống khác

- **Tailwind**: map `color.*` → `theme.colors.*`, `spacing.*` → `theme.spacing.*`
- **Figma**: dùng plugin Design Tokens để import JSON
- **Style Dictionary**: JSON tương thích sẵn, chạy `style-dictionary build`
