# Motion Reference

> Tham chiếu nhanh. Nguồn sự thật: `tokens/design-tokens.json`.

## Easing

| Token | CSS Var | Value | Mô tả |
|---|---|---|---|
| `ease` | `--ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Smooth decelerate — dùng cho mọi transition |

## Duration

| Token | Value | Dùng cho |
|---|---|---|
| `fast` | `0.2s` | Hover, color change, border |
| `normal` | `0.35s` | Transform, toggle, nav color |
| `slow` | `0.45s` | Reveal, slide, drawer |
| `slower` | `0.85s` | Page reveal, hero entrance |

## Pattern chuẩn

### Hover

```css
transition: transform var(--ease);
/* duration: 0.35s–0.45s */
transform: translate3d(0, -2px, 0);   /* button */
transform: translate3d(0, -4px, 0);   /* card */
transform: scale(1.04);               /* image zoom */
```

### Reveal (scroll)

```css
opacity: 0;
transform: translate3d(0, 24px, 0);
transition: opacity 0.85s var(--ease), transform 0.95s var(--ease);
transition-delay: var(--d, 0ms);
/* .is-in → opacity: 1; transform: none; */
```

### Reveal media (clip)

```css
clip-path: inset(100% 0 0 0);
transition: clip-path 1.05s var(--ease);
/* .is-in → clip-path: inset(0 0 0 0); */
/* image: scale(1.06) → scale(1) trong 1.3s */
```

### Word split

```css
.word > span {
  transform: translate3d(0, 110%, 0);
  transition: transform 0.95s var(--ease);
  transition-delay: var(--wd, 0ms);
}
/* .is-in → transform: none; */
```

### Marquee

```css
animation: marquee var(--ticker-duration, 42s) linear infinite;
@keyframes marquee {
  from { transform: translate3d(0, 0, 0); }
  to { transform: translate3d(-50%, 0, 0); }
}
/* hover: animation-play-state: paused; */
```

### Hero entrance

```css
opacity: 0.001;
transform: translate3d(0, 28px, 0);
transition: opacity 1s var(--ease) 0.15s, transform 1.1s var(--ease) 0.15s;
/* .is-ready → opacity: 1; transform: none; */
```

## Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
    clip-path: none !important;
  }
}
```

## Don't

- ❌ Bounce / elastic / spring easing.
- ❌ Duration > 1.3s (trừ hero zoom 8s).
- ❌ Animation không có reduced-motion fallback.
- ❌ Transform layout-affecting properties (width, height, top, left) — dùng transform.
