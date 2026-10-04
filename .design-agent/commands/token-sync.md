# Command: Token Sync

> Đồng bộ design tokens JSON sang CSS variables.

## Khi nào chạy

- Sau khi sửa `tokens/design-tokens.json`.
- Khi thêm token mới.
- Khi audit phát hiện lệch giữa tokens và CSS.

## Cách chạy

### 1. Đọc tokens

Mở `.design-agent/tokens/design-tokens.json`, lấy tất cả giá trị.

### 2. Đọc CSS :root

Mở `css/styles.css`, đọc block `:root`.

### 3. So sánh

Ánh xạ theo bảng:

| Token JSON | CSS Variable |
|---|---|
| `color.bg.value` | `--bg` |
| `color.surface.value` | `--surface` |
| `color.ink.value` | `--ink` |
| `color.inkSoft.value` | `--ink-soft` |
| `color.inkMid.value` | `--ink-mid` |
| `color.cream.value` | `--cream` |
| `color.line.value` | `--line` |
| `color.accent.value` | `--accent` |
| `color.accent2.value` | `--accent-2` |
| `color.sale.value` | `--sale` |
| `color.danger.value` | `--danger` |
| `color.ok.value` | `--ok` |
| `color.focus.value` | `--focus` |
| `typography.fontDisplay.value` | `--font-display` |
| `typography.fontBody.value` | `--font-body` |
| `typography.fsBody.value` | `--fs-body` |
| `spacing.pad.value` | `--pad` |
| `spacing.max.value` | `--max` |
| `spacing.navH.value` | `--nav-h` |
| `spacing.hit.value` | `--hit` |
| `motion.ease.value` | `--ease` |

### 4. Cập nhật

Nếu giá trị trong CSS khác tokens → cập nhật CSS cho khớp.

### 5. Kiểm tra hardcoded

```bash
# Tìm hex không trong :root
grep -n '#[0-9a-fA-F]\{3,8\}' css/*.css | grep -v ':root'

# Tìm rgba không tham chiếu token
grep -n 'rgba(' css/*.css | grep -v 'var('
```

Nếu tìm thấy hardcoded → thay bằng `var(--...)` hoặc thêm token mới.

### 6. Kiểm tra các file CSS khác

Lặp lại cho `css/product.css`, `css/workshop.css`, `css/studio.css`.

## Output

```
## Token Sync Report

### ✅ Đồng bộ
- --bg: #fdf6f0 ✓
- --ink: #3d2b2b ✓

### ❌ Lệch
- --sale: CSS=#c9785f, Token=#c9785f → cần cập nhật
  File: css/styles.css:12

### ⚠️ Hardcode
- css/workshop.css:145: background: #fffaf7 → nên dùng var(--cream)
```
