# Hook: Post-edit Token Sync

> Hook chạy sau khi sửa CSS. Đảm bảo tokens và CSS đồng bộ.

## Khi nào chạy

Sau mọi edit file CSS (`css/*.css`).

## Checklist

### 1. So sánh tokens vs CSS :root

Đọc `tokens/design-tokens.json` và `css/styles.css` `:root`.

Kiểm tra mỗi cặp:

| Token | CSS Var | Kiểm tra |
|---|---|---|
| `color.bg.value` | `--bg` | Giá trị khớp? |
| `color.surface.value` | `--surface` | Giá trị khớp? |
| `color.ink.value` | `--ink` | Giá trị khớp? |
| `color.cream.value` | `--cream` | Giá trị khớp? |
| `color.accent.value` | `--accent` | Tồn tại trong CSS? |
| `color.accent2.value` | `--accent-2` | Tồn tại trong CSS? |
| `color.sale.value` | `--sale` | Giá trị khớp? |
| `color.danger.value` | `--danger` | Giá trị khớp? |
| `color.ok.value` | `--ok` | Giá trị khớp? |
| `color.focus.value` | `--focus` | Giá trị khớp? |

### 2. Phát hiện token mới

Nếu CSS có variable mới không có trong tokens → thêm token vào JSON.

### 3. Phát hiện hardcoded

```bash
# Tìm giá trị màu không dùng var()
grep -rn '#[0-9a-fA-F]\{3,8\}' css/*.css | grep -v ':root'
grep -rn 'rgba(' css/*.css | grep -v 'var(' | grep -v ':root'
```

Nếu tìm thấy → gợi ý thay bằng `var(--...)`.

### 4. Phát hiện màu cũ

```bash
# Palette cũ (kiểm tra không còn)
grep -rn '#f4eee6\|#ece5da\|#141414\|#faf8f5\|#9a6b12\|#8b2e2e\|#2f6b3a' css/*.css
grep -rn 'rgba(5,5,5,\|rgba(5, 5, 5,' css/*.css
grep -rn 'rgba(244,238,230,\|rgba(244, 238, 230,' css/*.css
grep -rn 'rgba(250,248,245,\|rgba(250, 248, 245,' css/*.css
```

**Fail** nếu tìm thấy màu cũ — cần cập nhật sang palette mới.

### 5. Cập nhật reference

Nếu palette đổi → cập nhật:
- `reference/color-palette.md`
- `a11y/accessibility-guide.md` (bảng contrast)
- `rules/design-rules.md` (bảng màu)

## Output

```
## Post-edit Token Sync

### ✅ Đồng bộ
- --bg: #fdf6f0 ✓
- --ink: #3d2b2b ✓
- --accent: #d98a8a ✓

### ❌ Lệch
- --sale: CSS=#c9785f, Token=#c9785f → OK
  (hoặc: CSS=#old, Token=#new → cần sync)

### ⚠️ Hardcode phát hiện
- css/workshop.css:145: #fffaf7 → nên dùng var(--cream)

### 🔍 Màu cũ phát hiện
- css/styles.css:300: #f4eee6 → cần đổi sang #fdf6f0
```
