# Skill: Apply Palette

> Cách đổi màu đúng cho SÁPA Studio.

## Khi nào dùng

Khi cần áp dụng một palette mới, hoặc sửa màu hiện tại.

## Các bước

### 1. Cập nhật tokens

Mở `.design-agent/tokens/design-tokens.json`, đổi giá trị `value` trong section `color`.

### 2. Đồng bộ CSS variables

Mở `css/styles.css`, cập nhật `:root` cho khớp với tokens:

```css
:root {
  --bg: #fdf6f0;          /* ← color.bg */
  --surface: #f5e8e0;     /* ← color.surface */
  --ink: #3d2b2b;         /* ← color.ink */
  --cream: #fffaf7;       /* ← color.cream */
  --line: rgba(61,43,43,0.15);  /* ← color.line */
  --accent: #d98a8a;      /* ← color.accent */
  --accent-2: #a8c4a0;    /* ← color.accent2 */
  --sale: #c9785f;        /* ← color.sale */
  --danger: #a64545;      /* ← color.danger */
  --ok: #6b8e5a;          /* ← color.ok */
  --focus: #3d2b2b;      /* ← color.focus */
}
```

### 3. Cập nhật hardcoded colors

Tìm và thay các hex/rgba hardcode trong CSS:

```bash
# Tìm hardcoded colors (ngoài :root)
grep -rn '#[0-9a-fA-F]\{3,8\}' css/ | grep -v ':root'
grep -rn 'rgba\?(' css/
```

Thay bằng `var(--...)` hoặc giá trị mới từ tokens.

### 4. Cập nhật overlay/gradient

Overlay trên ảnh: `rgba(61, 43, 43, opacity)` (ink, không đen).
Glass effect: `rgba(255, 250, 247, opacity)` (cream, không trắng).

### 5. Kiểm tra contrast

Xem `a11y/accessibility-guide.md` — đảm bảo text đạt WCAG AA.

### 6. Kiểm tra trực quan

Refresh preview, kiểm tra:
- [ ] Hero: text cream trên ảnh, overlay ấm không đen.
- [ ] Section sáng: text ink trên bg, dễ đọc.
- [ ] Card: surface nổi trên bg, không chìm.
- [ ] Button: CTA nổi bật, hover rõ.
- [ ] Form: input cream, focus ink border.

## Don't

- ❌ Không hardcode hex ngoài `:root` — dùng `var(--...)`.
- ❌ Không dùng đen `#000` cho overlay — dùng ink `rgba(61,43,43,...)`.
- ❌ Không dùng `#fff` cho nền card — dùng `--cream`.
- ❌ Không đổi 1 màu lẻ — luôn đồng bộ tokens + CSS + reference.
