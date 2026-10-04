# Spacing Reference

> Tham chiếu nhanh. Nguồn sự thật: `tokens/design-tokens.json`.

## Container

| Token | CSS Var | Value | Mô tả |
|---|---|---|---|
| `max` | `--max` | `1360px` | Chiều rộng tối đa |
| `pad` | `--pad` | `clamp(1rem, 2.22vw, 2rem)` | Padding responsive |

## Spacing Scale

| Token | Value | Dùng cho |
|---|---|---|
| `xs` | `0.25rem` (4px) | Gap tối thiểu, icon gap |
| `sm` | `0.5rem` (8px) | Chip gap, small gap |
| `md` | `1rem` (16px) | Gap mặc định, padding |
| `lg` | `1.5rem` (24px) | Section gap, card padding |
| `xl` | `2rem` (32px) | Large padding |
| `2xl` | `2.75rem` (44px) | Section padding trên/dưới |
| `3xl` | `4.5rem` (72px) | Quote block padding |

## Section Padding

```css
.section {
  padding: clamp(2.75rem, 6vw, 5rem) var(--pad);
  max-width: var(--max);
  margin: 0 auto;
}
```

- Trên/dưới: `clamp(2.75rem, 6vw, 5rem)` — 44–80px responsive.
- Trái/phải: `var(--pad)` — 16–32px responsive.

## Touch Target

| Token | CSS Var | Value | Mô tả |
|---|---|---|---|
| `hit` | `--hit` | `44px` | Vùng chạm tối thiểu |
| `navH` | `--nav-h` | `64px` | Chiều cao navbar |

## Grid Gap

| Context | Gap |
|---|---|
| Product grid | `1.75rem 1.1rem` (row col) |
| Formula/story | `2.5rem 3.5rem` |
| Footer cols | `1.5rem` |
| Notes grid | `1rem 0.85rem` |
| Class grid | `1.15rem` |

## Responsive breakpoints

| Breakpoint | Thay đổi |
|---|---|
| `≤ 1100px` | Product grid 4→2 cột, nav → burger |
| `≤ 900px` | PDP 2→1 cột |
| `≤ 800px` | Most grids → 1 cột, hero card reposition |
| `≤ 560px` | Class grid → 1 cột |
| `≤ 520px` | Product grid → 1 cột |
