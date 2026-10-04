/* SÁPA Studio — UX Enhancements */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const STORAGE = {
    theme: "sapa-theme",
    wishlist: "sapa-wishlist",
    cookie: "sapa-cookie-consent",
    recent: "sapa-recently-viewed",
  };

  /* ===== Dark mode ===== */
  const themeToggle = $(".theme-toggle");
  function applyTheme(t) {
    if (t === "dark") document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
  }
  const savedTheme = localStorage.getItem(STORAGE.theme);
  if (savedTheme) applyTheme(savedTheme);
  themeToggle?.addEventListener("click", () => {
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(STORAGE.theme, next);
  });

  /* ===== Back to top ===== */
  const btt = document.createElement("button");
  btt.className = "back-to-top";
  btt.setAttribute("aria-label", "Về đầu trang");
  btt.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19V5M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  document.body.appendChild(btt);
  const lenis = window.__sapaLenis;
  const onScrollBtt = () => {
    const y = lenis ? lenis.scroll : window.scrollY;
    btt.classList.toggle("is-visible", y > 600);
  };
  if (lenis) lenis.on("scroll", onScrollBtt);
  else window.addEventListener("scroll", onScrollBtt, { passive: true });
  btt.addEventListener("click", () => {
    if (lenis) lenis.scrollTo(0, { duration: 1 });
    else window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* ===== Wishlist ===== */
  let wishlist = [];
  try { wishlist = JSON.parse(localStorage.getItem(STORAGE.wishlist) || "[]"); } catch { wishlist = []; }

  function saveWishlist() {
    localStorage.setItem(STORAGE.wishlist, JSON.stringify(wishlist));
  }

  function isWished(id) { return wishlist.includes(id); }

  function toggleWish(id) {
    const idx = wishlist.indexOf(id);
    if (idx >= 0) { wishlist.splice(idx, 1); return false; }
    wishlist.push(id); return true;
  }

  function createWishBtn(id) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "wish-btn" + (isWished(id) ? " is-active" : "");
    btn.setAttribute("aria-label", "Yêu thích");
    btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.5 1 4 2.5C10.5 6.5 12 5.5 14 5.5c3.5 0 5 3.5 3.5 6.5C19 16.5 12 21 12 21z"/></svg>';
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const active = toggleWish(id);
      btn.classList.toggle("is-active", active);
      const toast = $("#toast");
      if (toast) {
        toast.textContent = active ? "Đã thêm vào yêu thích ♥" : "Đã bỏ khỏi yêu thích";
        toast.hidden = false;
        requestAnimationFrame(() => toast.classList.add("is-on"));
        clearTimeout(window.__sapaToastTimer);
        window.__sapaToastTimer = setTimeout(() => {
          toast.classList.remove("is-on");
          setTimeout(() => { toast.hidden = true; }, 280);
        }, 2000);
      }
      saveWishlist();
    });
    return btn;
  }

  // Attach wishlist buttons to product cards
  function attachWishButtons() {
    $$(".product-card").forEach((card) => {
      if (card.querySelector(".wish-btn")) return;
      const id = card.dataset.id;
      if (!id) return;
      const media = card.querySelector(".product-card__media");
      if (media) media.appendChild(createWishBtn(id));
    });
  }

  // Watch for dynamically added cards (shop page)
  const gridObserver = new MutationObserver(() => attachWishButtons());
  $$(".product-grid, #shop-grid, #related-grid").forEach((g) => gridObserver.observe(g, { childList: true }));
  attachWishButtons();

  /* ===== Recently viewed ===== */
  function trackRecent(id, name, img, price) {
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem(STORAGE.recent) || "[]"); } catch { recent = []; }
    recent = recent.filter((r) => r.id !== id);
    recent.unshift({ id, name, img, price });
    recent = recent.slice(0, 4);
    localStorage.setItem(STORAGE.recent, JSON.stringify(recent));
  }

  // Track on product page
  if (document.body.dataset.page === "product") {
    const params = new URLSearchParams(location.search);
    const pid = params.get("id") || "trang-non";
    // track after product data loads
    window.addEventListener("sapa:product-loaded", (e) => {
      const p = e.detail || {};
      trackRecent(p.id || pid, p.name || "", p.image || "", p.price || 0);
    });
  }

  function renderRecentlyViewed(container) {
    if (!container) return;
    let recent = [];
    try { recent = JSON.parse(localStorage.getItem(STORAGE.recent) || "[]"); } catch { recent = []; }
    const currentId = new URLSearchParams(location.search).get("id");
    recent = recent.filter((r) => r.id !== currentId);
    if (recent.length === 0) { container.style.display = "none"; return; }
    container.innerHTML = `
      <h2>Đã xem gần đây</h2>
      <div class="product-grid">
        ${recent.map((r) => `
          <article class="product-card">
            <a class="product-card__media" href="product.html?id=${r.id}">
              <img src="${r.img}" alt="${r.name}" width="900" height="900" loading="lazy" />
            </a>
            <div class="product-card__foot">
              <h3>${r.name}</h3>
              <p class="price">${Number(r.price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}₫</p>
            </div>
          </article>
        `).join("")}
      </div>`;
    attachWishButtons();
  }

  // Render recently viewed on product page
  renderRecentlyViewed($("#recently-viewed"));

  window.__sapaTrackRecent = trackRecent;
  window.__sapaAttachWish = attachWishButtons;

  /* ===== Social proof popup ===== */
  const NAMES = ["Minh Anh", "Thuỳ Linh", "Hoàng", "Mai", "Quỳnh", "Đức", "Hà", "Lan", "Trang", "Nam"];
  const PRODUCTS = [
    { name: "Bó Trăng Non", id: "trang-non" },
    { name: "Lọ Sương Sớm", id: "suong-som" },
    { name: "Set DIY Cơ Bản", id: "kit-co-ban" },
    { name: "Bó Ánh Trăng", id: "anh-trang" },
    { name: "Nến Hoa Sáp", id: "nen-hoa" },
    { name: "Thẻ Quà SÁPA", id: "gift" },
  ];

  const sp = document.createElement("div");
  sp.className = "social-proof";
  sp.innerHTML = `
    <div class="social-proof__avatar"></div>
    <div class="social-proof__text"></div>
    <button class="social-proof__close" aria-label="Đóng">✕</button>
  `;
  document.body.appendChild(sp);

  let spTimer = null;
  let spShown = false;

  function showSocialProof() {
    if (spShown) return;
    const name = NAMES[Math.floor(Math.random() * NAMES.length)];
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const mins = Math.floor(Math.random() * 25) + 2;
    sp.querySelector(".social-proof__avatar").textContent = name.charAt(0);
    sp.querySelector(".social-proof__text").innerHTML = `<strong>${name}</strong> <span>đã mua ${product.name} · ${mins} phút trước</span>`;
    sp.classList.add("is-on");
    spShown = true;
    spTimer = setTimeout(() => {
      sp.classList.remove("is-on");
      spShown = false;
      spTimer = setTimeout(showSocialProof, 15000 + Math.random() * 15000);
    }, 5000);
  }

  sp.querySelector(".social-proof__close").addEventListener("click", () => {
    sp.classList.remove("is-on");
    spShown = false;
    clearTimeout(spTimer);
  });

  // Start after 8s, only on shop/product/index pages
  const pageType = document.body.dataset.page;
  const isShopPage = location.pathname.includes("shop") || location.pathname.includes("product") || location.pathname === "/" || location.pathname.endsWith("index.html");
  if (isShopPage && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setTimeout(() => { showSocialProof(); }, 8000);
  }

  /* ===== Cookie consent ===== */
  if (!localStorage.getItem(STORAGE.cookie)) {
    const cookie = document.createElement("div");
    cookie.className = "cookie-banner";
    cookie.innerHTML = `
      <p>SÁPA sử dụng cookie để cải thiện trải nghiệm của bạn. Xem <a href="lien-he.html">chính sách quyền riêng tư</a>.</p>
      <div class="cookie-banner__actions">
        <button class="cookie-banner__btn--decline">Từ chối</button>
        <button class="cookie-banner__btn--accept">Đồng ý</button>
      </div>
    `;
    document.body.appendChild(cookie);
    requestAnimationFrame(() => cookie.classList.add("is-on"));
    cookie.querySelector(".cookie-banner__btn--accept").addEventListener("click", () => {
      localStorage.setItem(STORAGE.cookie, "accepted");
      cookie.classList.remove("is-on");
      setTimeout(() => cookie.remove(), 500);
    });
    cookie.querySelector(".cookie-banner__btn--decline").addEventListener("click", () => {
      localStorage.setItem(STORAGE.cookie, "declined");
      cookie.classList.remove("is-on");
      setTimeout(() => cookie.remove(), 500);
    });
  }

  /* ===== Chat widget ===== */
  const chatFab = document.createElement("div");
  chatFab.className = "chat-fab";
  chatFab.innerHTML = `
    <div class="chat-menu" id="chat-menu">
      <a href="https://zalo.me/" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 6h16v10H8l-4 3V6z"/></svg>
        Zalo OA
      </a>
      <a href="https://facebook.com/" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.5l.5-3H13v-2c0-.6.4-1 1-1z"/></svg>
        Messenger
      </a>
      <a href="tel:0900000000">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z"/></svg>
        Hotline
      </a>
    </div>
    <button class="chat-btn" aria-label="Liên hệ nhanh" aria-expanded="false">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
    </button>
  `;
  document.body.appendChild(chatFab);
  const chatMenu = $("#chat-menu", chatFab);
  const chatBtn = $(".chat-btn", chatFab);
  chatBtn.addEventListener("click", () => {
    const open = chatMenu.classList.toggle("is-open");
    chatBtn.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".chat-fab")) chatMenu.classList.remove("is-open");
  });

  /* ===== Promo countdown banner ===== */
  const promoClosed = sessionStorage.getItem("sapa-promo-closed");
  if (!promoClosed) {
    const promo = document.createElement("div");
    promo.className = "promo-banner";
    promo.innerHTML = `
      <strong>🎁 Giảm 19% Bó Trăng Non</strong> — còn
      <span class="promo-banner__timer">
        <span data-hh>--</span>:<span data-mm>--</span>:<span data-ss>--</span>
      </span>
      <a href="shop.html" style="text-decoration:underline;text-underline-offset:3px;">Mua ngay</a>
      <button class="promo-banner__close" aria-label="Đóng">✕</button>
    `;
    const main = document.querySelector("main");
    if (main) main.insertBefore(promo, main.firstChild);
    else document.body.insertBefore(promo, document.body.firstChild);

    // Countdown to end of day
    function updateCountdown() {
      const now = new Date();
      const end = new Date(now);
      end.setHours(23, 59, 59, 0);
      const diff = Math.max(0, Math.floor((end - now) / 1000));
      const hh = String(Math.floor(diff / 3600)).padStart(2, "0");
      const mm = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
      const ss = String(diff % 60).padStart(2, "0");
      promo.querySelector("[data-hh]").textContent = hh;
      promo.querySelector("[data-mm]").textContent = mm;
      promo.querySelector("[data-ss]").textContent = ss;
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);

    promo.querySelector(".promo-banner__close").addEventListener("click", () => {
      promo.style.display = "none";
      sessionStorage.setItem("sapa-promo-closed", "1");
    });
  }

  /* ===== Empty cart suggestions ===== */
  function renderCartSuggestions() {
    const cartEmpty = $("#cart-empty");
    const cartLines = $("#cart-lines");
    if (!cartEmpty || !cartLines) return;
    if (cartEmpty.hidden) return; // cart has items
    let existing = cartLines.querySelector(".cart-suggest");
    if (existing) return;
    const suggest = document.createElement("div");
    suggest.className = "cart-suggest";
    suggest.innerHTML = `
      <h4>Gợi ý cho bạn</h4>
      <div class="cart-suggest__grid">
        <a class="cart-suggest__item" href="product.html?id=trang-non">
          <img src="assets/prod-bouquet.webp" alt="" width="48" height="48" />
          <div><h5>Bó Trăng Non</h5><p>420.000₫</p></div>
        </a>
        <a class="cart-suggest__item" href="product.html?id=suong-som">
          <img src="assets/prod-jar.webp" alt="" width="48" height="48" />
          <div><h5>Lọ Sương Sớm</h5><p>289.000₫</p></div>
        </a>
        <a class="cart-suggest__item" href="product.html?id=kit-co-ban">
          <img src="assets/prod-kit.webp" alt="" width="48" height="48" />
          <div><h5>Set DIY Cơ Bản</h5><p>350.000₫</p></div>
        </a>
        <a class="cart-suggest__item" href="product.html?id=gift">
          <img src="assets/prod-gift.webp" alt="" width="48" height="48" />
          <div><h5>Thẻ Quà SÁPA</h5><p>500.000₫</p></div>
        </a>
      </div>
    `;
    cartLines.appendChild(suggest);
  }

  // Observe cart changes
  const cartObserver = new MutationObserver(() => renderCartSuggestions());
  const cartLinesEl = $("#cart-lines");
  if (cartLinesEl) cartObserver.observe(cartLinesEl, { childList: true, subtree: true });
  renderCartSuggestions();

  /* ===== Checkout steps ===== */
  function renderCheckoutSteps() {
    const drawerFoot = $(".drawer__foot");
    if (!drawerFoot) return;
    let existing = drawerFoot.querySelector(".checkout-steps");
    if (existing) return;
    const steps = document.createElement("div");
    steps.className = "checkout-steps";
    steps.innerHTML = `
      <div class="checkout-step is-active"><span class="checkout-step__num">1</span> Giỏ hàng</div>
      <span class="checkout-step__sep"></span>
      <div class="checkout-step"><span class="checkout-step__num">2</span> Thanh toán</div>
      <span class="checkout-step__sep"></span>
      <div class="checkout-step"><span class="checkout-step__num">3</span> Xác nhận</div>
    `;
    drawerFoot.insertBefore(steps, drawerFoot.firstChild);
  }
  renderCheckoutSteps();
})();
