/* SÁPA Studio — Refined botanical line-art icons for custom order wizard */
(() => {
  // Clean circle medallion background (shared)
  function sticker(inner) {
    return `<svg viewBox="0 0 48 48" class="sticker" aria-hidden="true" focusable="false">
      <circle cx="25" cy="26" r="20" fill="#1f2e23" opacity="0.04"/>
      <circle cx="24" cy="24" r="20" fill="#f7f4ef" stroke="#e8e3d8" stroke-width="0.5"/>
      <g stroke-linecap="round" stroke-linejoin="round" fill="none">${inner}</g>
    </svg>`;
  }

  const stickers = {
    // ── Step 1: Loại hoa ──
    bouquet: sticker(`
      <circle cx="16" cy="16" r="3.5" fill="#f4d8de" stroke="#c9a0a6" stroke-width="1.1"/>
      <circle cx="24" cy="13" r="4.2" fill="#f4d8de" stroke="#c9a0a6" stroke-width="1.1"/>
      <circle cx="32" cy="17" r="3.2" fill="#f4d8de" stroke="#c9a0a6" stroke-width="1.1"/>
      <circle cx="16" cy="16" r="1.1" fill="#c9a0a6" stroke="none"/>
      <circle cx="24" cy="13" r="1.3" fill="#c9a0a6" stroke="none"/>
      <circle cx="32" cy="17" r="0.9" fill="#c9a0a6" stroke="none"/>
      <path d="M16 19.5 Q19 24 21 27 M24 17.2 L24 27 M32 20.2 Q29 24 27 27" stroke="#5a8a6e" stroke-width="1.1"/>
      <path d="M19 22 Q17 21 16 23 Q17.5 24 19 22" fill="#5a8a6e" stroke="#5a8a6e" stroke-width="0.5"/>
      <path d="M19 27 L22 39 L26 39 L29 27 Z" fill="#2d5f4a" stroke="#2d5f4a" stroke-width="1" stroke-linejoin="round"/>
      <path d="M19 27 Q24 25.5 29 27" stroke="#1f2e23" stroke-width="0.9"/>
      <line x1="24" y1="27.5" x2="24" y2="39" stroke="#1f2e23" stroke-width="0.5" opacity="0.35"/>
    `),

    vase: sticker(`
      <circle cx="19" cy="14" r="3" fill="#f4d8de" stroke="#c9a0a6" stroke-width="1"/>
      <circle cx="29" cy="16" r="2.5" fill="#f4d8de" stroke="#c9a0a6" stroke-width="1"/>
      <circle cx="19" cy="14" r="0.9" fill="#c9a0a6" stroke="none"/>
      <circle cx="29" cy="16" r="0.7" fill="#c9a0a6" stroke="none"/>
      <path d="M19 17 Q21 21 22 24 M29 18.5 Q27 21 26 24" stroke="#5a8a6e" stroke-width="1"/>
      <path d="M22 20 Q20 19 19.5 21 Q21 21.5 22 20" fill="#5a8a6e" stroke="#5a8a6e" stroke-width="0.5"/>
      <path d="M20 24 Q20 26 18 29 Q17 34 20 38 L28 38 Q31 34 30 29 Q28 26 28 24 Z" fill="#f0e8d8" stroke="#b8723c" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M22 28 Q22 32 22 35" stroke="#fdfbf7" stroke-width="0.8" opacity="0.5"/>
      <path d="M18 31 Q24 30 30 31" stroke="#b8723c" stroke-width="0.6" opacity="0.4"/>
    `),

    gift: sticker(`
      <rect x="14" y="22" width="20" height="18" rx="1.5" fill="#2d5f4a" stroke="#1f2e23" stroke-width="1"/>
      <rect x="12" y="18" width="24" height="5" rx="1" fill="#2d5f4a" stroke="#1f2e23" stroke-width="1"/>
      <line x1="24" y1="18" x2="24" y2="40" stroke="#c9a0a6" stroke-width="2"/>
      <line x1="12" y1="20.5" x2="36" y2="20.5" stroke="#c9a0a6" stroke-width="1.8"/>
      <path d="M24 18 Q18 13 17 16 Q16 19 24 18" fill="#c9a0a6" stroke="#c9a0a6" stroke-width="0.8"/>
      <path d="M24 18 Q30 13 31 16 Q32 19 24 18" fill="#c9a0a6" stroke="#c9a0a6" stroke-width="0.8"/>
      <circle cx="24" cy="18" r="1.8" fill="#c9a0a6" stroke="none"/>
      <path d="M22 19 Q20 22 21 24 M26 19 Q28 22 27 24" stroke="#c9a0a6" stroke-width="1"/>
    `),

    candle: sticker(`
      <path d="M24 10 Q21 14 22.5 17 Q23 18.5 24 18.5 Q25 18.5 25.5 17 Q27 14 24 10" fill="#f4dca0" stroke="#d4a050" stroke-width="0.8"/>
      <path d="M24 13 Q23 15 24 17 Q25 15 24 13" fill="#fdfbf7" stroke="none"/>
      <line x1="24" y1="18.5" x2="24" y2="21" stroke="#1f2e23" stroke-width="0.8"/>
      <rect x="20" y="21" width="8" height="16" rx="1" fill="#fdfbf7" stroke="#c9a0a6" stroke-width="1.1"/>
      <path d="M20 25 Q22 27 20 29" stroke="#c9a0a6" stroke-width="0.7"/>
      <path d="M17 37 Q17 36 18 36 L30 36 Q31 36 31 37 L30 40 L18 40 Z" fill="#b8723c" stroke="#b8723c" stroke-width="1" stroke-linejoin="round"/>
      <ellipse cx="24" cy="40" rx="8" ry="1.5" fill="#b8723c" stroke="none"/>
    `),

    sparkle: sticker(`
      <path d="M24 10 L26 20 L36 22 L26 24 L24 34 L22 24 L12 22 L22 20 Z" fill="#2d5f4a" stroke="#2d5f4a" stroke-width="0.8"/>
      <path d="M36 12 L37 16 L41 17 L37 18 L36 22 L35 18 L31 17 L35 16 Z" fill="#c9a0a6" stroke="#c9a0a6" stroke-width="0.5"/>
      <circle cx="14" cy="34" r="1.8" fill="#b8723c" stroke="none"/>
      <path d="M14 28 L14.5 30 L16.5 30.5 L14.5 31 L14 33 L13.5 31 L11.5 30.5 L13.5 30 Z" fill="#c9a0a6" stroke="none" opacity="0.6"/>
    `),

    // ── Step 2: Dịp ──
    cake: sticker(`
      <path d="M24 9 Q22 12 23 14 Q23.5 15 24 15 Q24.5 15 25 14 Q26 12 24 9" fill="#f4dca0" stroke="#d4a050" stroke-width="0.6"/>
      <line x1="24" y1="15" x2="24" y2="18" stroke="#1f2e23" stroke-width="0.7"/>
      <path d="M14 20 Q14 18 16 18 L32 18 Q34 18 34 20 L34 36 Q34 38 32 38 L16 38 Q14 38 14 36 Z" fill="#f4d8de" stroke="#c9a0a6" stroke-width="1.1" stroke-linejoin="round"/>
      <path d="M16 20 Q18 24 16 26 Q14 28 18 30 Q20 26 22 30 Q24 26 26 30 Q28 26 30 30 Q34 28 32 26 Q30 24 32 20" stroke="#c9a0a6" stroke-width="1"/>
      <ellipse cx="24" cy="39" rx="12" ry="2" stroke="#b8723c" stroke-width="1"/>
      <circle cx="20" cy="33" r="0.8" fill="#c9a0a6" stroke="none"/>
      <circle cx="28" cy="33" r="0.8" fill="#c9a0a6" stroke="none"/>
      <circle cx="24" cy="35" r="0.8" fill="#c9a0a6" stroke="none"/>
    `),

    cap: sticker(`
      <path d="M24 12 L40 18 L24 24 L8 18 Z" fill="#1f2e23" stroke="#1f2e23" stroke-width="0.8" stroke-linejoin="round"/>
      <path d="M16 20 Q16 27 19 29 L29 29 Q32 27 32 20" stroke="#1f2e23" stroke-width="1.1"/>
      <path d="M40 18 L40 25" stroke="#b8723c" stroke-width="1"/>
      <circle cx="40" cy="25.5" r="1.5" fill="#b8723c" stroke="none"/>
      <line x1="40" y1="27" x2="38" y2="31" stroke="#b8723c" stroke-width="0.8"/>
      <line x1="40" y1="27" x2="40" y2="31" stroke="#b8723c" stroke-width="0.8"/>
      <line x1="40" y1="27" x2="42" y2="31" stroke="#b8723c" stroke-width="0.8"/>
      <path d="M24 12 L32 15" stroke="#5a8a6e" stroke-width="0.6" opacity="0.4"/>
    `),

    heart: sticker(`
      <path d="M24 38 C24 38 12 29 10 21 C8 14 14 10 19 12 C22 13 24 16 24 18 C24 16 26 13 29 12 C34 10 40 14 38 21 C36 29 24 38 24 38" fill="#f4d8de" stroke="#c9a0a6" stroke-width="1.2"/>
      <path d="M17 16 Q15 17 15 19" stroke="#fdfbf7" stroke-width="0.8" opacity="0.6"/>
    `),

    rings: sticker(`
      <circle cx="19" cy="28" r="8" stroke="#b8723c" stroke-width="2"/>
      <circle cx="29" cy="28" r="8" stroke="#5a8a6e" stroke-width="2"/>
      <path d="M24 12 L25 17 L29 18 L25 19 L24 24 L23 19 L19 18 L23 17 Z" fill="#f4dca0" stroke="#d4a050" stroke-width="0.5"/>
      <circle cx="14" cy="16" r="1" fill="#c9a0a6" stroke="none"/>
      <circle cx="34" cy="15" r="0.8" fill="#c9a0a6" stroke="none"/>
    `),

    confetti: sticker(`
      <line x1="24" y1="10" x2="24" y2="15" stroke="#2d5f4a" stroke-width="1.3"/>
      <line x1="35" y1="13" x2="32" y2="17" stroke="#c9a0a6" stroke-width="1.3"/>
      <line x1="39" y1="24" x2="34" y2="24" stroke="#b8723c" stroke-width="1.3"/>
      <line x1="35" y1="35" x2="32" y2="31" stroke="#2d5f4a" stroke-width="1.3"/>
      <line x1="24" y1="38" x2="24" y2="33" stroke="#c9a0a6" stroke-width="1.3"/>
      <line x1="13" y1="35" x2="16" y2="31" stroke="#b8723c" stroke-width="1.3"/>
      <line x1="9" y1="24" x2="14" y2="24" stroke="#2d5f4a" stroke-width="1.3"/>
      <line x1="13" y1="13" x2="16" y2="17" stroke="#c9a0a6" stroke-width="1.3"/>
      <rect x="22" y="22" width="4" height="4" rx="0.5" fill="#f4dca0" stroke="none" transform="rotate(20 24 24)"/>
      <circle cx="30" cy="28" r="2" fill="#c9a0a6" stroke="none"/>
      <circle cx="18" cy="28" r="1.8" fill="#2d5f4a" stroke="none"/>
      <circle cx="24" cy="32" r="1.3" fill="#b8723c" stroke="none"/>
      <rect x="34" y="20" width="2.5" height="2.5" rx="0.3" fill="#2d5f4a" stroke="none" transform="rotate(45 35 21)"/>
      <rect x="11" y="29" width="2.5" height="2.5" rx="0.3" fill="#c9a0a6" stroke="none" transform="rotate(30 12 30)"/>
    `),
  };

  // Map emoji → sticker key (strip variation selectors)
  const emojiMap = {
    "\u{1F490}": "bouquet",
    "\u{1FAB4}": "vase",
    "\u{1F381}": "gift",
    "\u{1F56F}": "candle",
    "\u2728": "sparkle",
    "\u{1F382}": "cake",
    "\u{1F393}": "cap",
    "\u{1F495}": "heart",
    "\u{1F48D}": "rings",
    "\u{1F38A}": "confetti",
  };

  document.querySelectorAll(".co-option__icon").forEach((el) => {
    const text = el.textContent.trim().replace(/\uFE0F/g, "");
    const key = emojiMap[text];
    if (key && stickers[key]) {
      el.innerHTML = stickers[key];
    }
  });
})();
