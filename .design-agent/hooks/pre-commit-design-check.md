# Hook: Pre-commit Design Check

> Hook chạy trước khi commit. Kiểm tra tuân thủ design system.

## Khi nào chạy

Trước mọi commit có thay đổi file CSS hoặc HTML.

## Checklist

### 1. Token compliance

```bash
# Tìm hex hardcode ngoài :root
grep -rn '#[0-9a-fA-F]\{3,8\}' css/*.css | grep -v ':root' | grep -v '\/\*'
```

**Fail** nếu tìm thấy hex không trong `:root` (trừ comment).

### 2. Black check

```bash
# Tìm đen thuần
grep -rn '#000\b\|#000000\b\|#141414\b\|rgba(5,5,5,\|rgba(5, 5, 5,' css/*.css
```

**Fail** nếu tìm thấy — phải dùng `--ink` hoặc `rgba(61,43,43,...)`.

### 3. White check

```bash
# Tìm trắng thuần ngoài focus outline
grep -rn '#fff\b\|#ffffff\b\|rgba(244,238,230,\|rgba(244, 238, 230,' css/*.css | grep -v 'outline'
```

**Fail** nếu tìm thấy — phải dùng `--cream` hoặc `rgba(255,250,247,...)`.

### 4. CSS variable usage

```bash
# Tìm màu dùng trực tiếp thay vì var()
grep -rn 'color:\s*#' css/*.css | grep -v ':root'
grep -rn 'background:\s*#' css/*.css | grep -v ':root'
grep -rn 'border.*:\s*#' css/*.css | grep -v ':root'
```

**Warning** nếu tìm thấy — nên dùng `var(--...)`.

### 5. Focus visible

```bash
# Kiểm tra mọi :focus không có :focus-visible
grep -rn ':focus\s*{' css/*.css | grep -v 'focus-visible'
```

**Warning** — nên có `:focus-visible` thay vì `:focus`.

### 6. Touch target

Kiểm tra button, link, icon button có `min-height: 44px` hoặc `var(--hit)`.

### 7. Contrast

Kiểm tra text color + background đạt WCAG AA (4.5:1).
Tham khảo `a11y/accessibility-guide.md` cho bảng contrast.

## Output

```
## Pre-commit Design Check

### ✅ Pass
- No hardcoded hex outside :root
- No black/white pure colors

### ❌ Fail (block commit)
- css/styles.css:234: hardcoded #f5e8e0 → use var(--surface)
- css/workshop.css:145: rgba(5,5,5,0.3) → use rgba(61,43,43,0.3)

### ⚠️ Warning (allow commit)
- css/styles.css:300: :focus without :focus-visible
```

## Tích hợp Git hook

```bash
# .git/hooks/pre-commit
#!/bin/sh
# Chạy agent design check tại đây
# Exit 1 nếu fail, 0 nếu pass
```
