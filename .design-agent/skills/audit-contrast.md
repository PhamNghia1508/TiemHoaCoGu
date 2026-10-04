# Skill: Audit Contrast

> Cách kiểm tra contrast màu đạt WCAG 2.1 AA.

## Khi nào dùng

- Sau khi đổi palette.
- Sau khi thêm text màu mới.
- Khi review UI trước commit.

## Công thức

```
Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)

L = relative luminance
L = 0.2126 * R + 0.7152 * G + 0.0722 * B
(mỗi kênh gamma-corrected)
```

## Ngưỡng

| Loại | Tối thiểu |
|---|---|
| Text thường (< 18px hoặc < 14px bold) | 4.5:1 |
| Text lớn (≥ 18px hoặc ≥ 14px bold) | 3.0:1 |
| UI component (border, icon) | 3.0:1 |

## Cách kiểm tra

### 1. Tìm tất cả cặp màu

```bash
# Tìm text color + background context
grep -rn 'color:' css/ | grep -v 'var('    # hardcoded text color
grep -rn 'background:' css/ | grep -v 'var('  # hardcoded bg
```

### 2. Tính contrast

Dùng tool:
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **Chrome DevTools**: Inspect → Accessibility → Contrast
- **Firefox**: Accessibility tab

### 3. Bảng contrast SÁPA (Botanical Blush)

| Foreground | Background | Ratio | Đạt? |
|---|---|---|---|
| `#3d2b2b` ink | `#fdf6f0` bg | 10.2:1 | ✅ AAA |
| `#3d2b2b` ink | `#fffaf7` cream | 10.5:1 | ✅ AAA |
| `#3d2b2b` ink | `#f5e8e0` surface | 8.9:1 | ✅ AAA |
| `#fffaf7` cream | `#3d2b2b` ink | 10.5:1 | ✅ AAA |
| `#d98a8a` accent | `#fffaf7` cream | 2.8:1 | ⚠️ UI only |
| `#c9785f` sale | `#fffaf7` cream | 3.9:1 | ⚠️ Large/bold |
| `#6b8e5a` ok | `#fffaf7` cream | 3.5:1 | ⚠️ Large/bold |
| `#a64545` danger | `#fffaf7` cream | 5.6:1 | ✅ AA |

### 4. Khi không đạt

- **Accent trên cream** (2.8:1): không dùng cho text. Dùng cho badge/icon/focus ring (UI, 3:1).
- **Sale trên cream** (3.9:1): chỉ dùng cho text lớn (≥18px) hoặc bold (≥14px). Body text nhỏ → dùng `--ink` + `font-weight: 600`.
- **OK trên cream** (3.5:1): chỉ dùng cho text lớn hoặc bold. Body text nhỏ → dùng `--ink` + `font-weight: 600`.

### 5. Kiểm tra overlay

Text trên ảnh hero/banner: đảm bảo overlay đủ tối để text cream đạt 4.5:1.
- Overlay tối thiểu: `rgba(61,43,43,0.35)` cho text cream trên ảnh sáng.

## Checklist

- [ ] Mọi text thường ≥ 4.5:1.
- [ ] Mọi text lớn ≥ 3.0:1.
- [ ] UI border/icon ≥ 3.0:1.
- [ ] Accent không dùng cho text thường.
- [ ] Sale/OK chỉ dùng cho text lớn hoặc bold.
