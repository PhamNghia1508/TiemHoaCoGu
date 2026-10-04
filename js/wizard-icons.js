/* SÁPA Studio — Hand-drawn tear-paper sticker icons for custom order wizard */
(() => {
  // Torn-paper organic sticker shape (shared)
  const BG =
    "M34 4 Q40 3 46 6 Q52 9 55 15 Q59 22 58 29 Q57 37 53 43 Q48 50 41 53 Q33 56 25 54 Q17 52 11 46 Q5 40 5 31 Q5 22 10 15 Q15 8 23 5 Q28 4 34 4 Z";

  function sticker(inner) {
    return `<svg viewBox="0 0 64 64" class="sticker" aria-hidden="true" focusable="false">
      <path d="${BG}" fill="#1f2e23" opacity="0.06" transform="translate(2.5,3.5)"/>
      <path d="${BG}" fill="#fdfbf7" stroke="#d4cfc3" stroke-width="0.7"/>
      <g stroke-linecap="round" stroke-linejoin="round" fill="none">${inner}</g>
    </svg>`;
  }

  const stickers = {
    // Step 1 — Loại hoa
    bouquet: sticker(`
      <circle cx="24" cy="24" r="4.5" fill="#f0d0d8" stroke="#c9a0a6" stroke-width="1.3"/>
      <circle cx="34" cy="20" r="5" fill="#f0d0d8" stroke="#c9a0a6" stroke-width="1.3"/>
      <circle cx="43" cy="25" r="4" fill="#f0d0d8" stroke="#c9a0a6" stroke-width="1.3"/>
      <circle cx="24" cy="24" r="1.3" fill="#c9a0a6" stroke="none"/>
      <circle cx="34" cy="20" r="1.3" fill="#c9a0a6" stroke="none"/>
      <circle cx="43" cy="25" r="1.3" fill="#c9a0a6" stroke="none"/>
      <path d="M24 28.5 Q28 34 31 38 M34 25 Q33 32 32 38 M43 29 Q39 34 35 38" stroke="#8ca98c" stroke-width="1.3"/>
      <path d="M27 38 L31 50 L37 50 L40 38 Z" fill="#2d5f4a" stroke="#2d5f4a" stroke-width="1.2"/>
      <path d="M27 38 Q33.5 36 40 38" stroke="#1f2e23" stroke-width="1"/>
    `),

    vase: sticker(`
      <circle cx="26" cy="20" r="3.5" fill="#f0d0d8" stroke="#c9a0a6" stroke-width="1.2"/>
      <circle cx="38" cy="22" r="3" fill="#f0d0d8" stroke="#c9a0a6" stroke-width="1.2"/>
      <circle cx="26" cy="20" r="1" fill="#c9a0a6" stroke="none"/>
      <circle cx="38" cy="22" r="0.8" fill="#c9a0a6" stroke="none"/>
      <path d="M26 23.5 Q28 28 30 32 M38 25 Q36 29 33 32" stroke="#8ca98c" stroke-width="1.2"/>
      <path d="M26 32 Q26 34 24 38 Q23 44 27 48 L39 48 Q43 44 42 38 Q40 34 40 32 Z" fill="#e8dcc8" stroke="#b8723c" stroke-width="1.3"/>
      <path d="M28 36 Q28 40 28 44" stroke="#fdfbf7" stroke-width="1" opacity="0.5"/>
    `),

    gift: sticker(`
      <rect x="20" y="30" width="24" height="20" rx="2" fill="#2d5f4a" stroke="#1f2e23" stroke-width="1.2"/>
      <rect x="18" y="26" width="28" height="6" rx="1.5" fill="#2d5f4a" stroke="#1f2e23" stroke-width="1.2"/>
      <line x1="32" y1="26" x2="32" y2="50" stroke="#c9a0a6" stroke-width="2.2"/>
      <line x1="18" y1="29" x2="46" y2="29" stroke="#c9a0a6" stroke-width="2"/>
      <path d="M32 25 Q27 19 25 22 Q24 26 32 25 Q40 26 39 22 Q37 19 32 25" fill="#c9a0a6" stroke="#c9a0a6" stroke-width="1"/>
      <circle cx="32" cy="25" r="2" fill="#c9a0a6" stroke="none"/>
    `),

    candle: sticker(`
      <path d="M32 14 Q28 18 30 22 Q31 24 32 24 Q33 24 34 22 Q36 18 32 14" fill="#e8c879" stroke="#b8723c" stroke-width="1"/>
      <line x1="32" y1="24" x2="32" y2="27" stroke="#1f2e23" stroke-width="1"/>
      <rect x="27" y="27" width="10" height="20" rx="1.5" fill="#fdfbf7" stroke="#c9a0a6" stroke-width="1.3"/>
      <path d="M27 33 Q29 35 27 37" stroke="#c9a0a6" stroke-width="1"/>
      <ellipse cx="32" cy="49" rx="9" ry="2.5" fill="#b8723c" stroke="#b8723c" stroke-width="1"/>
    `),

    sparkle: sticker(`
      <path d="M32 14 L34 26 L46 28 L34 30 L32 42 L30 30 L18 28 L30 26 Z" fill="#2d5f4a" stroke="#2d5f4a" stroke-width="1"/>
      <path d="M44 18 L45 23 L50 24 L45 25 L44 30 L43 25 L38 24 L43 23 Z" fill="#c9a0a6" stroke="#c9a0a6" stroke-width="0.8"/>
      <circle cx="20" cy="42" r="2" fill="#b8723c" stroke="none"/>
    `),

    // Step 2 — Dịp
    cake: sticker(`
      <path d="M32 16 Q30 19 31 21 Q31.5 22 32 22 Q32.5 22 33 21 Q34 19 32 16" fill="#e8c879" stroke="#b8723c" stroke-width="0.8"/>
      <line x1="32" y1="22" x2="32" y2="25" stroke="#1f2e23" stroke-width="0.8"/>
      <path d="M20 28 Q20 26 22 26 L42 26 Q44 26 44 28 L44 44 Q44 46 42 46 L22 46 Q20 46 20 44 Z" fill="#f0d0d8" stroke="#c9a0a6" stroke-width="1.3"/>
      <path d="M22 28 Q24 32 22 34 Q20 36 24 38 Q26 34 28 38 Q30 34 32 38 Q34 34 36 38 Q38 34 40 38 Q42 36 40 34 Q38 32 40 28" stroke="#c9a0a6" stroke-width="1.2"/>
      <ellipse cx="32" cy="48" rx="14" ry="2.5" stroke="#b8723c" stroke-width="1.2"/>
    `),

    cap: sticker(`
      <path d="M32 16 L50 22 L32 28 L14 22 Z" fill="#1f2e23" stroke="#1f2e23" stroke-width="1"/>
      <path d="M22 24 Q22 32 26 34 L38 34 Q42 32 42 24" stroke="#1f2e23" stroke-width="1.3"/>
      <path d="M50 22 L50 30" stroke="#b8723c" stroke-width="1.2"/>
      <circle cx="50" cy="31" r="2" fill="#b8723c" stroke="none"/>
      <path d="M50 33 L48 38 M50 33 L52 38" stroke="#b8723c" stroke-width="0.8"/>
    `),

    heart: sticker(`
      <path d="M32 46 C32 46 18 36 16 26 C14 18 20 14 26 16 C29 17 32 20 32 22 C32 20 35 17 38 16 C44 14 50 18 48 26 C46 36 32 46 32 46" fill="#e8b4c4" stroke="#c9a0a6" stroke-width="1.3"/>
    `),

    rings: sticker(`
      <circle cx="26" cy="34" r="9" stroke="#b8723c" stroke-width="2.2"/>
      <circle cx="38" cy="34" r="9" stroke="#8ca98c" stroke-width="2.2"/>
      <path d="M32 18 L33 22 L37 23 L33 24 L32 28 L31 24 L27 23 L31 22 Z" fill="#e8c879" stroke="#b8723c" stroke-width="0.6"/>
    `),

    confetti: sticker(`
      <line x1="32" y1="14" x2="32" y2="20" stroke="#2d5f4a" stroke-width="1.5"/>
      <line x1="44" y1="18" x2="40" y2="22" stroke="#c9a0a6" stroke-width="1.5"/>
      <line x1="48" y1="30" x2="42" y2="31" stroke="#b8723c" stroke-width="1.5"/>
      <line x1="44" y1="44" x2="40" y2="40" stroke="#2d5f4a" stroke-width="1.5"/>
      <line x1="20" y1="44" x2="24" y2="40" stroke="#c9a0a6" stroke-width="1.5"/>
      <line x1="16" y1="30" x2="22" y2="31" stroke="#b8723c" stroke-width="1.5"/>
      <line x1="20" y1="18" x2="24" y2="22" stroke="#2d5f4a" stroke-width="1.5"/>
      <rect x="30" y="28" width="4" height="4" rx="0.5" fill="#e8c879" stroke="none" transform="rotate(15 32 30)"/>
      <circle cx="38" cy="36" r="2" fill="#c9a0a6" stroke="none"/>
      <circle cx="26" cy="36" r="2" fill="#2d5f4a" stroke="none"/>
      <circle cx="32" cy="42" r="1.5" fill="#b8723c" stroke="none"/>
    `),
  };

  // Map emoji → sticker key (strip variation selectors)
  const emojiMap = {
    "\u{1F490}": "bouquet",   // 💐
    "\u{1FAB4}": "vase",       // 🪴 (potted plant — repurposed as vase)
    "\u{1F381}": "gift",       // 🎁
    "\u{1F56F}": "candle",     // 🕯️
    "\u2728": "sparkle",       // ✨
    "\u{1F382}": "cake",       // 🎂
    "\u{1F393}": "cap",        // 🎓
    "\u{1F495}": "heart",      // 💕
    "\u{1F48D}": "rings",      // 💍
    "\u{1F38A}": "confetti",   // 🎊
  };

  document.querySelectorAll(".co-option__icon").forEach((el) => {
    const text = el.textContent.trim().replace(/\uFE0F/g, "");
    const key = emojiMap[text];
    if (key && stickers[key]) {
      el.innerHTML = stickers[key];
    }
  });
})();
