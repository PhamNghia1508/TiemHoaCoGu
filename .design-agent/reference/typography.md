# Typography Reference

> Tham chiếu nhanh. Nguồn sự thật: `tokens/design-tokens.json`.

## Font Stack

| Token | CSS Var | Value | Dùng cho |
|---|---|---|---|
| `fontDisplay` | `--font-display` | `"Hedvig Letters Serif", "Times New Roman", serif` | Tiêu đề, logo, quote |
| `fontBody` | `--font-body` | `"Inter", system-ui, sans-serif` | Body, UI, button, label |

## Font Weight

| Weight | Dùng cho |
|---|---|
| 400 (Regular) | Serif tiêu đề, quote — **không bao giờ bold serif** |
| 500 (Medium) | Body text, button, nav link — mặc định |
| 600 (Semibold) | Label, strong, emphasis, price, stat |

## Font Size Scale

| Token | Value | Px | Dùng cho |
|---|---|---|---|
| `h1` | `clamp(1.85rem, 4vw, 3.15rem)` | 30–50px | Hero title |
| `h2` | `clamp(1.65rem, 2.8vw, 2.35rem)` | 26–38px | Section head |
| `h3` | `clamp(1.45rem, 2.2vw, 2rem)` | 23–32px | Sub-section, card title |
| `lead` | `clamp(1.35rem, 2.4vw, 1.95rem)` | 22–31px | Story lead, intro |
| `body` | `0.9375rem` | 15px | Body text mặc định |
| `small` | `0.8125rem` | 13px | Button, chip, meta, nav |
| `caption` | `0.75rem` | 12px | Badge, tag, caption |

## Line Height

| Element | Line-height |
|---|---|
| Tiêu đề (h1–h3) | 1.25 |
| Quote | 1.3 |
| Body text | 1.55 |
| Description/lead | 1.65 |

## Letter Spacing

| Element | Letter-spacing |
|---|---|
| Tiêu đề serif | `normal` |
| Logo | `0.22em` |
| Eyebrow/kicker | `0.06em` + `uppercase` |
| Body | `-0.01em` (slight tight) |
| Tag/uppercase label | `0.05–0.08em` |

## Pairing

```
TIÊU ĐỀ (serif, 400)     ← Hedvig Letters Serif
────────────────────────
Body text (sans, 500)    ← Inter
```

- Serif cho **tất cả** heading, logo, quote, stat number.
- Sans cho **tất cả** body, UI, button, form, nav.
- Không trộn serif vào body, không trộn sans vào heading.
