(() => {
  document.documentElement.classList.add("js-ready");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("is-on"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-on");
      setTimeout(() => {
        toastEl.hidden = true;
      }, 280);
    }, 2200);
  }

  /* ---------- Lenis ---------- */
  let lenis = null;
  if (!reduceMotion && typeof Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.2,
    });
    const raf = (time) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };
    requestAnimationFrame(raf);
    window.__sapaLenis = lenis;

    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -12, duration: 1.25 });
      closeMobileMenu();
    });
  }

  /* ---------- Soft cursor ---------- */
  const cursor = document.createElement("div");
  cursor.className = "cursor";
  document.body.appendChild(cursor);
  let cx = -100,
    cy = -100,
    tx = -100,
    ty = -100;
  window.addEventListener(
    "pointermove",
    (e) => {
      tx = e.clientX;
      ty = e.clientY;
    },
    { passive: true }
  );
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx - 9}px, ${cy - 9}px, 0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    document.addEventListener("pointerover", (e) => {
      const hit = e.target.closest("a, button, .product-card, .hero-card, .ig-tile, input");
      cursor.classList.toggle("is-active", Boolean(hit));
    });
  }

  /* ---------- Parallax ---------- */
  const hero = $(".hero, .ws-hero");
  const heroImg = $(".hero-bg img, .ws-hero__bg img");
  const clubBg = $(".club-bg");
  const bannerImgs = $$(".banner > img, .collection img, .store-media img");

  function applyParallax() {
    if (reduceMotion) return;
    const vh = window.innerHeight;
    if (heroImg && hero) {
      const rect = hero.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -rect.top / vh));
      heroImg.style.transform = `translate3d(0, ${p * 16}%, 0) scale(${1.04 + p * 0.05})`;
    }
    if (clubBg) {
      const rect = clubBg.parentElement.getBoundingClientRect();
      const mid = rect.top + rect.height / 2 - vh / 2;
      const p = Math.max(-1, Math.min(1, mid / vh));
      clubBg.style.transform = `translate3d(0, ${p * -7}%, 0) scale(1.08)`;
    }
    bannerImgs.forEach((img) => {
      const wrap = img.parentElement;
      const rect = wrap.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const mid = rect.top + rect.height / 2 - vh / 2;
      const p = Math.max(-1, Math.min(1, mid / vh));
      img.style.transform = `translate3d(0, ${p * -5}%, 0) scale(1.05)`;
    });
  }

  /* ---------- Nav theme / hide ---------- */
  const nav = $("#nav");
  const burger = $("#burger");
  const mobileMenu = $("#mobile-menu");
  let lastY = window.scrollY;

  function closeMobileMenu() {
    if (!mobileMenu || mobileMenu.hasAttribute("hidden")) return;
    mobileMenu.setAttribute("hidden", "");
    burger?.setAttribute("aria-expanded", "false");
    burger?.setAttribute("aria-label", "Open menu");
    nav?.classList.remove("is-open-meta");
    updateNavTheme();
  }

  function updateNavTheme() {
    if (!nav) return;
    const probeY = nav.offsetHeight * 0.5;
    let onDark = false;
    $$('[data-nav="dark"]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top <= probeY && r.bottom >= probeY) onDark = true;
    });
    if (nav.classList.contains("is-open-meta")) onDark = false;
    nav.classList.toggle("nav--on-light", !onDark);
  }

  const onScroll = () => {
    const y = lenis ? lenis.scroll : window.scrollY;
    if (nav) {
      if (y > lastY && y > 240) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
    }
    lastY = y;
    updateNavTheme();
    applyParallax();
  };
  if (lenis) lenis.on("scroll", onScroll);
  else window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && mobileMenu) {
    burger.addEventListener("click", () => {
      const open = !mobileMenu.hasAttribute("hidden");
      if (open) closeMobileMenu();
      else {
        mobileMenu.removeAttribute("hidden");
        burger.setAttribute("aria-expanded", "true");
        burger.setAttribute("aria-label", "Close menu");
        nav?.classList.add("is-open-meta");
      }
      updateNavTheme();
    });
    mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobileMenu));
  }

  requestAnimationFrame(() => hero?.classList.add("is-ready"));

  /* ---------- Locale ---------- */
  const localeBtn = $("#locale-btn");
  const localeMenu = $("#locale-menu");
  const localeLabel = $("#locale-label");

  function closeLocale() {
    localeMenu?.setAttribute("hidden", "");
    localeBtn?.setAttribute("aria-expanded", "false");
  }

  localeBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    const open = !localeMenu.hasAttribute("hidden");
    if (open) closeLocale();
    else {
      localeMenu.removeAttribute("hidden");
      localeBtn.setAttribute("aria-expanded", "true");
      localeMenu.querySelector("button")?.focus();
    }
  });

  $$("[data-locale-open]").forEach((btn) => {
    btn.addEventListener("click", () => {
      localeBtn?.click();
      localeBtn?.focus();
    });
  });

  localeMenu?.addEventListener("click", (e) => {
    const opt = e.target.closest("[data-locale]");
    if (!opt) return;
    const code = opt.getAttribute("data-locale");
    if (localeLabel) localeLabel.textContent = code;
    toast(`Đã chọn khu vực ${code}`);
    closeLocale();
    localeBtn?.focus();
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".locale-wrap")) closeLocale();
  });

  /* ---------- Hero card carousel (pausable) ---------- */
  const slides = [
    {
      img: "assets/prod-bouquet.webp",
      title: "Bó Trăng Non",
      sub: "Hoa sáp · Size M",
      price: "420.000₫",
      was: "520.000₫",
      id: "trang-non",
    },
    {
      img: "assets/prod-jar.webp",
      title: "Lọ Sương Sớm",
      sub: "Để bàn",
      price: "289.000₫",
      was: "",
      id: "suong-som",
    },
    {
      img: "assets/prod-kit.webp",
      title: "Set DIY Cơ Bản",
      sub: "Làm tại nhà",
      price: "350.000₫",
      was: "399.000₫",
      id: "kit-co-ban",
    },
    {
      img: "assets/workshop-hands.webp",
      title: "Workshop Cơ Bản",
      sub: "Slot cuối tuần",
      price: "450.000₫",
      was: "",
      id: "ws-co-ban",
    },
  ];

  const card = $("#hero-card");
  const media = $("#hero-card-media");
  const cardImgs = media ? $$("img", media) : [];
  const cardTitle = $("#hero-card-title");
  const cardSub = $("#hero-card-sub");
  const cardPrice = $("#hero-card-price");
  const cardWas = $("#hero-card-was");
  let slideIndex = 0;
  let front = 0;
  let heroTimer = null;
  let heroPaused = false;

  const paintSlide = () => {
    const s = slides[slideIndex];
    if (!card || !s) return;
    if (cardTitle) cardTitle.textContent = s.title;
    if (cardSub) cardSub.textContent = s.sub;
    if (cardPrice) cardPrice.textContent = s.price;
    if (cardWas) cardWas.textContent = s.was;
    card.setAttribute("aria-label", `Featured: ${s.title}, ${s.price}`);
    if (cardImgs.length < 2) return;
    const back = (front + 1) % cardImgs.length;
    const incoming = cardImgs[back];
    const outgoing = cardImgs[front];
    const swap = () => {
      incoming.classList.add("is-front");
      outgoing.classList.remove("is-front");
      front = back;
    };
    if (incoming.getAttribute("src") === s.img) {
      requestAnimationFrame(swap);
      return;
    }
    const done = () => requestAnimationFrame(swap);
    incoming.addEventListener("load", done, { once: true });
    incoming.addEventListener("error", done, { once: true });
    incoming.src = s.img;
    if (incoming.complete) done();
  };

  const startHeroTimer = () => {
    clearInterval(heroTimer);
    heroTimer = setInterval(() => {
      if (heroPaused) return;
      slideIndex = (slideIndex + 1) % slides.length;
      paintSlide();
    }, 3800);
  };

  if (card) {
    startHeroTimer();
    ["pointerenter", "focusin"].forEach((ev) =>
      card.addEventListener(ev, () => {
        heroPaused = true;
      })
    );
    ["pointerleave", "focusout"].forEach((ev) =>
      card.addEventListener(ev, () => {
        heroPaused = false;
      })
    );
    card.addEventListener("click", (e) => {
      e.preventDefault();
      openQuick(slides[slideIndex]);
    });
  }

  /* ---------- Cart ---------- */
  const STORAGE_KEY = "neris-cart-v1";
  const cartCountEl = $("#cart-count");
  const drawer = $("#cart-drawer");
  const overlay = $("#overlay");
  const cartLines = $("#cart-lines");
  const cartEmpty = $("#cart-empty");
  const cartTotal = $("#cart-total");
  const cartNote = $("#cart-note");

  /** @type {{id:string,name:string,price:number,img:string,qty:number}[]} */
  let cart = [];
  try {
    cart = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(cart)) cart = [];
  } catch {
    cart = [];
  }

  function saveCart() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }

  function cartQty() {
    return cart.reduce((n, i) => n + i.qty, 0);
  }

  function cartSum() {
    return cart.reduce((n, i) => n + i.qty * i.price, 0);
  }

  function formatVND(n) {
    return (
      Number(n)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫"
    );
  }

  function renderCart() {
    if (cartCountEl) cartCountEl.textContent = String(cartQty());
    if (!cartLines) return;
    const items = cart;
    if (cartEmpty) cartEmpty.hidden = items.length > 0;
    $$(".cart-line", cartLines).forEach((el) => el.remove());
    items.forEach((item) => {
      const row = document.createElement("div");
      row.className = "cart-line";
      row.dataset.id = item.id;
      row.innerHTML = `
        <img src="${item.img}" alt="" width="64" height="64" />
        <div>
          <h3>${item.name}</h3>
          <p class="meta">${formatVND(item.price)}${item.slot ? " · " + item.slot : ""}</p>
          <div class="qty">
            <button type="button" data-dec aria-label="Giảm số lượng">−</button>
            <span>${item.qty}</span>
            <button type="button" data-inc aria-label="Tăng số lượng">+</button>
          </div>
        </div>
        <button type="button" class="remove" data-remove aria-label="Xóa ${item.name}">Xóa</button>
      `;
      cartLines.appendChild(row);
    });
    if (cartTotal) cartTotal.textContent = formatVND(cartSum());
    saveCart();
  }

  function addToCart(product) {
    const addQty = product.qty || 1;
    const existing = cart.find((i) => i.id === product.id);
    if (existing) {
      if (product.fixedQty) {
        // booking line is a fixed package — do not multiply group price
        existing.price = product.price;
        existing.slot = product.slot || existing.slot;
        existing.name = product.name || existing.name;
      } else {
        existing.qty += addQty;
      }
    } else {
      cart.push({ ...product, qty: addQty });
    }
    renderCart();
    toast(`${product.name} đã vào giỏ`);
    const bump = () => {
      if (!cartCountEl) return;
      cartCountEl.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.28)" }, { transform: "scale(1)" }],
        { duration: 300, easing: "cubic-bezier(0.22,1,0.36,1)" }
      );
    };
    bump();
    if (cartCountEl && window.__sapaConfetti) {
      const r = cartCountEl.getBoundingClientRect();
      window.__sapaConfetti(r.left + r.width / 2, r.top + r.height / 2);
    }
  }

  function productFromCard(el) {
    return {
      id: el.dataset.id,
      name: el.dataset.name,
      price: Number(el.dataset.price || 0),
      img: el.dataset.img || "assets/prod-amber.webp",
    };
  }

  function openDrawer() {
    if (!drawer || !overlay) return;
    overlay.hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    $("#cart-close")?.focus();
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }

  function closeDrawer() {
    if (!drawer || !overlay) return;
    drawer.classList.remove("is-open");
    overlay.hidden = true;
    document.body.style.overflow = "";
    if (lenis) lenis.start();
    setTimeout(() => {
      if (!drawer.classList.contains("is-open")) drawer.hidden = true;
    }, 320);
    $("#cart-btn")?.focus();
  }

  $("#cart-btn")?.addEventListener("click", openDrawer);
  $("#footer-cart")?.addEventListener("click", openDrawer);
  $("#cart-close")?.addEventListener("click", closeDrawer);
  overlay?.addEventListener("click", () => {
    closeDrawer();
    closeQuick();
  });

  cartLines?.addEventListener("click", (e) => {
    const row = e.target.closest(".cart-line");
    if (!row) return;
    const id = row.dataset.id;
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    if (e.target.closest("[data-inc]")) item.qty += 1;
    if (e.target.closest("[data-dec]")) item.qty = Math.max(1, item.qty - 1);
    if (e.target.closest("[data-remove]")) cart = cart.filter((i) => i.id !== id);
    renderCart();
  });

  $("#checkout-btn")?.addEventListener("click", () => {
    if (!cart.length) {
      if (cartNote) {
        cartNote.textContent = "Chưa có sản phẩm — hãy chọn bó hoa hoặc workshop.";
        cartNote.style.color = "var(--danger)";
      }
      return;
    }
    if (cartNote) {
      cartNote.textContent = "Đặt hàng thành công (demo). SÁPA sẽ liên hệ xác nhận trong 30 phút.";
      cartNote.style.color = "var(--ok)";
    }
    toast("Đã nhận đơn — cảm ơn bạn!");
    cart = [];
    renderCart();
    setTimeout(closeDrawer, 1000);
  });

  /* ---------- Quick view ---------- */
  const modal = $("#quick-modal");
  const quickImg = $("#quick-img");
  const quickTitle = $("#quick-title");
  const quickDesc = $("#quick-desc");
  const quickPrice = $("#quick-price");
  let quickProduct = null;

  function openQuick(product) {
    if (!modal || !product) return;
    quickProduct = product;
    if (quickImg) {
      quickImg.src = product.img || "assets/prod-bouquet.webp";
      quickImg.alt = product.name || "";
    }
    if (quickTitle) quickTitle.textContent = product.name || "Sản phẩm";
    if (quickDesc) quickDesc.textContent = product.desc || "";
    if (quickPrice) quickPrice.textContent = formatVND(product.price || 0);
    const isWorkshop = product.mode === "book";
    const sched = $("#quick-schedule");
    const addBtn = $("#quick-add");
    const kicker = $("#quick-kicker");
    if (sched) sched.hidden = !isWorkshop;
    if (addBtn) addBtn.textContent = isWorkshop ? "Giữ chỗ workshop" : "Thêm vào giỏ";
    if (kicker) kicker.textContent = isWorkshop ? "Đặt lịch workshop" : "Chi tiết sản phẩm";
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    $("#quick-close")?.focus();
  }

  function closeQuick() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (!drawer || drawer.hidden || !drawer.classList.contains("is-open")) {
      document.body.style.overflow = "";
      if (lenis) lenis.start();
    }
  }

  $("#quick-close")?.addEventListener("click", closeQuick);
  $("#quick-add")?.addEventListener("click", () => {
    if (!quickProduct) return;
    const slotSel = $("#workshop-slot");
    const slot =
      quickProduct.mode === "book" && slotSel
        ? slotSel.options[slotSel.selectedIndex].text
        : "";
    addToCart({ ...quickProduct, slot });
    closeQuick();
    openDrawer();
  });

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeQuick();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeQuick();
      closeDrawer();
      closeLocale();
      closeMobileMenu();
    }
  });

  /* ---------- Button success flash ---------- */
  function flashBtnSuccess(btn) {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = "✓ Đã thêm!";
    btn.classList.add("is-success");
    setTimeout(() => { btn.textContent = orig; btn.classList.remove("is-success"); }, 1200);
  }

  /* ---------- Product cards: quick view + add ---------- */
  $$(".product-card").forEach((el) => {
    el.querySelector("[data-quick]")?.addEventListener("click", (e) => {
      // dedicated product page wins over quick-view when linked
      const href = el.dataset.href || e.currentTarget.getAttribute("href");
      if (href && href.includes("product.html")) return;
      e.preventDefault();
      openQuick({
        ...productFromCard(el),
        desc: el.dataset.desc || "",
      });
    });
    el.querySelector("[data-add]")?.addEventListener("click", (e) => {
      addToCart(productFromCard(el));
      flashBtnSuccess(e.currentTarget);
    });
    el.querySelector("[data-book]")?.addEventListener("click", () => {
      openQuick({
        ...productFromCard(el),
        desc: el.dataset.desc || "",
        mode: "book",
      });
    });
  });

  /* ---------- Filters ---------- */
  $$(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".chip").forEach((c) => c.classList.remove("is-on"));
      chip.classList.add("is-on");
      const f = chip.dataset.filter || "all";
      $$("#grid-discover .product-card").forEach((cardEl) => {
        const show = f === "all" || cardEl.dataset.cat === f;
        cardEl.classList.toggle("is-filtered-out", !show);
      });
    });
  });

  /* ---------- Accordion ---------- */
  const motto = $("#motto");
  motto?.querySelectorAll(".motto-trigger").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".motto-item");
      const open = item.classList.contains("is-open");
      motto.querySelectorAll(".motto-item").forEach((el) => {
        el.classList.remove("is-open");
        el.querySelector(".motto-trigger")?.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- Email form ---------- */
  const form = $("#club-form");
  const emailInput = $("#email");
  const emailMsg = $("#email-msg");
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const value = (emailInput?.value || "").trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!valid) {
      emailInput?.classList.add("is-invalid");
      if (emailMsg) {
        emailMsg.textContent = "Vui lòng nhập email hợp lệ.";
        emailMsg.className = "form-msg is-err";
      }
      emailInput?.focus();
      return;
    }
    emailInput?.classList.remove("is-invalid");
    if (emailMsg) {
      emailMsg.textContent = "Đã đăng ký — SÁPA sẽ gửi lịch workshop vào hộp thư.";
      emailMsg.className = "form-msg is-ok";
    }
    toast("Đăng ký thành công!");
    form.reset();
  });

  /* ---------- Split text + reveals ---------- */
  const splitTargets = $$(".hero-title, .quote, .formula-lead, .story-lead, .explore-title, .ig-title");
  const splitText = (el) => {
    if (el.dataset.split === "1") return;
    let n = 0;
    const wrapWords = (chunk) =>
      chunk
        .replace(/<[^>]+>/g, " ")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => `<span class="word" style="--wd:${n++ * 42}ms"><span>${w}</span></span>`)
        .join(" ");
    if (el.querySelector("br")) {
      el.innerHTML = el.innerHTML
        .split(/<br\s*\/?>/i)
        .map((part) => wrapWords(part))
        .join("<br />");
    } else {
      el.innerHTML = wrapWords(el.textContent || "");
    }
    // preserve full phrase for assistive tech
    el.setAttribute("aria-label", (el.textContent || "").replace(/\s+/g, " ").trim());
    el.classList.add("split", "reveal-text");
    el.dataset.split = "1";
  };
  if (!reduceMotion) splitTargets.forEach(splitText);

  $$(".product-card__media, .formula-media, .collection, .ig-tile, .story-media, .explore-media, .store-media, .note-card__media").forEach((el) => {
    el.classList.add("reveal-media");
  });

  const targets = () => $$(".reveal, .reveal-media, .reveal-text, .split");
  const showAll = () => {
    targets().forEach((el) => el.classList.add("is-in"));
    hero?.classList.add("is-ready");
  };

  const io =
    !reduceMotion && "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("is-in");
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.05, rootMargin: "0px 0px -2% 0px" }
        )
      : null;

  $$(".product-grid").forEach((grid) => {
    $$(".product-card", grid).forEach((cardEl, i) => {
      cardEl.style.setProperty("--d", `${(i % 4) * 80}ms`);
    });
  });
  $$(".motto-item").forEach((item, i) => {
    item.classList.add("reveal");
    item.style.setProperty("--d", `${i * 70}ms`);
  });

  if (reduceMotion || !io) showAll();
  else {
    targets().forEach((el) => io.observe(el));
    // safety net so nothing stays invisible after settle
    setTimeout(showAll, 2500);
    setTimeout(() => targets().forEach((el) => io.observe(el)), 120);
  }

  /* init */
  renderCart();

  /* Shared cart API for product.html */
  window.addEventListener("sapa:add-to-cart", (e) => {
    const p = e.detail || {};
    if (!p.id) return;
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      img: p.img,
      slot: p.slot || "",
      qty: p.qty || 1,
      // workshop bookings: unit price already covers the group
      fixedQty: p.skipQty ? true : false,
    });
    if (p.openDrawer) openDrawer();
  });
})();
