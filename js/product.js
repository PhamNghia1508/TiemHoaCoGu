(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const formatVND = (n) =>
    Number(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Category labels —— */
  const CAT_LABEL = {
    bo: "Bó hoa sáp",
    lo: "Lọ & nến",
    diy: "Set & phụ kiện",
  };

  /* —— Read ?id= from URL —— */
  const params = new URLSearchParams(location.search);
  const productId = params.get("id") || "trang-non";

  /* —— DOM refs —— */
  const titleEl = $("#pdp-title");
  const descEl = $("#pdp-desc");
  const priceEl = $("#pdp-price");
  const wasEl = $("#pdp-was");
  const badgeEl = $("#pdp-badge");
  const kickerEl = $("#pdp-kicker");
  const mainImg = $("#pdp-image");
  const thumbsWrap = $(".pdp-thumbs");
  const sizeField = $("#pdp-field-size");
  const colorField = $("#pdp-field-color");
  const crumbName = $("#crumb-name");
  const relatedGrid = $("#related-grid");

  let current = null;
  let selectedSize = null;
  let selectedColor = null;
  let selectedPrice = 0;

  /* —— Build size variants for bouquets —— */
  function buildSizes(basePrice) {
    if (!sizeField) return;
    const variants = sizeField.querySelector(".pdp-variants");
    if (!variants) return;
    const s = Math.round(basePrice * 0.76);
    const m = basePrice;
    const l = Math.round(basePrice * 1.33);
    variants.innerHTML = `
      <button type="button" class="variant" data-size="S" data-price="${s}">S · 5 bông</button>
      <button type="button" class="variant is-active" data-size="M" data-price="${m}">M · 9 bông</button>
      <button type="button" class="variant" data-size="L" data-price="${l}">L · 15 bông</button>`;
    selectedSize = "M";
    selectedPrice = m;
    bindVariants(variants, "data-size", (btn) => {
      selectedSize = btn.dataset.size;
      selectedPrice = Number(btn.dataset.price);
      if (priceEl) priceEl.textContent = formatVND(selectedPrice);
    });
  }

  function bindVariants(scope, attr, onSelect) {
    $$(`[${attr}]`, scope).forEach((btn) => {
      btn.addEventListener("click", () => {
        $$(`[${attr}]`, scope).forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        onSelect(btn);
      });
    });
  }

  /* —— Thumbnails: use the product image + a few complementary assets —— */
  const COMPLEMENT = [
    "assets/workshop-hands.webp",
    "assets/note-rose.webp",
    "assets/note-linen.webp",
  ];

  function buildThumbs(img) {
    if (!thumbsWrap) return;
    const set = [img, ...COMPLEMENT];
    thumbsWrap.innerHTML = set
      .map(
        (src, i) => `
        <button type="button" class="pdp-thumb${i === 0 ? " is-active" : ""}" data-img="${src}" aria-label="Ảnh ${i + 1}">
          <img src="${src}" alt="" width="96" height="96" loading="lazy" />
        </button>`
      )
      .join("");
    $$(".pdp-thumb", thumbsWrap).forEach((thumb) => {
      thumb.addEventListener("click", () => {
        $$(".pdp-thumb", thumbsWrap).forEach((t) => t.classList.remove("is-active"));
        thumb.classList.add("is-active");
        const src = thumb.dataset.img;
        if (!mainImg || !src) return;
        mainImg.classList.add("is-fading");
        setTimeout(() => {
          mainImg.src = src;
          mainImg.classList.remove("is-fading");
        }, 180);
      });
    });
  }

  /* —— Related products —— */
  function renderRelated(all, id) {
    if (!relatedGrid) return;
    const others = all.filter((p) => p.id !== id).slice(0, 4);
    relatedGrid.setAttribute("aria-busy", "false");
    relatedGrid.innerHTML = others
      .map(
        (p) => `
        <article class="product-card reveal">
          <a class="product-card__media" href="product.html?id=${p.id}">
            ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
            <img src="${p.image}" alt="${p.name}" width="900" height="900" loading="lazy" />
          </a>
          <div class="product-card__foot">
            <h3>${p.name}</h3>
            <p class="price">${formatVND(p.price)}${p.oldPrice ? ` <s>${formatVND(p.oldPrice)}</s>` : ""}</p>
          </div>
        </article>`
      )
      .join("");

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
            { threshold: 0.05 }
          )
        : null;
    if (!io || reduceMotion)
      $$(".product-card", relatedGrid).forEach((el) => el.classList.add("is-in"));
    else
      $$(".product-card", relatedGrid).forEach((el) => io.observe(el));
  }

  /* —— Populate the page from a product record —— */
  function applyProduct(p, all) {
    current = p;
    if (titleEl) titleEl.textContent = p.name;
    if (crumbName) crumbName.textContent = p.name;
    if (descEl) descEl.textContent = p.description || "";
    if (priceEl) priceEl.textContent = formatVND(p.price);
    if (kickerEl) kickerEl.textContent = CAT_LABEL[p.category] || "Hoa sáp thủ công";

    if (wasEl) {
      if (p.oldPrice) {
        wasEl.textContent = formatVND(p.oldPrice);
        wasEl.hidden = false;
      } else {
        wasEl.hidden = true;
      }
    }
    if (badgeEl) {
      if (p.badge) {
        badgeEl.textContent = p.badge;
        badgeEl.hidden = false;
      } else {
        badgeEl.hidden = true;
      }
    }

    if (mainImg) {
      mainImg.src = p.image;
      mainImg.alt = p.name;
    }
    buildThumbs(p.image);

    /* size variants only make sense for bouquets */
    if (p.category === "bo") {
      if (sizeField) sizeField.hidden = false;
      buildSizes(p.price);
    } else {
      if (sizeField) sizeField.hidden = true;
      selectedPrice = p.price;
    }

    /* color choice only for bouquets */
    if (colorField) colorField.hidden = p.category !== "bo";
    if (colorField && !colorField.hidden) {
      selectedColor = "Kem";
      const colorVariants = colorField.querySelector(".pdp-variants");
      if (colorVariants) {
        $$("[data-color]", colorVariants).forEach((b) => b.classList.remove("is-active"));
        const kem = colorVariants.querySelector('[data-color="Kem"]');
        if (kem) kem.classList.add("is-active");
        bindVariants(colorVariants, "data-color", (btn) => {
          selectedColor = btn.dataset.color;
        });
      }
    }

    document.title = `${p.name} — SÁPA Studio`;

    renderRelated(all, p.id);
  }

  /* —— PDP accordion (delegate, works after dynamic content) —— */
  $$(".pdp-acc-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".pdp-acc-item");
      const open = item.classList.contains("is-open");
      $$(".pdp-acc-item").forEach((el) => {
        el.classList.remove("is-open");
        el.querySelector(".pdp-acc-btn")?.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* —— Quantity selector —— */
  let qty = 1;
  const qtyField = document.createElement("div");
  qtyField.className = "pdp-qty";
  qtyField.innerHTML = `
    <span class="pdp-qty__label">Số lượng</span>
    <div class="pdp-qty__ctrl">
      <button type="button" data-qty-dec aria-label="Giảm">−</button>
      <input type="number" value="1" min="1" max="99" aria-label="Số lượng" data-qty-input />
      <button type="button" data-qty-inc aria-label="Tăng">+</button>
    </div>`;
  const actionsEl = $(".pdp-actions");
  if (actionsEl) actionsEl.parentNode.insertBefore(qtyField, actionsEl);
  const qtyInput = qtyField.querySelector("[data-qty-input]");
  qtyField.querySelector("[data-qty-dec]").addEventListener("click", () => {
    qty = Math.max(1, qty - 1); qtyInput.value = qty;
  });
  qtyField.querySelector("[data-qty-inc]").addEventListener("click", () => {
    qty = Math.min(99, qty + 1); qtyInput.value = qty;
  });
  qtyInput.addEventListener("change", () => {
    qty = Math.max(1, Math.min(99, parseInt(qtyInput.value) || 1)); qtyInput.value = qty;
  });

  /* —— Image lightbox —— */
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = `<button class="lightbox__close" aria-label="Đóng">✕</button><img alt="" />`;
  document.body.appendChild(lightbox);
  const lbImg = lightbox.querySelector("img");
  const lbClose = lightbox.querySelector(".lightbox__close");
  mainImg?.addEventListener("click", () => {
    if (!mainImg.src) return;
    lbImg.src = mainImg.src; lbImg.alt = mainImg.alt || "";
    lightbox.classList.add("is-open");
    document.body.style.overflow = "hidden";
  });
  function closeLightbox() { lightbox.classList.remove("is-open"); document.body.style.overflow = ""; }
  lbClose.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("is-open")) closeLightbox();
  });

  /* —— Sticky add-to-cart bar —— */
  const stickyBar = document.createElement("div");
  stickyBar.className = "pdp-sticky-bar";
  stickyBar.innerHTML = `
    <img class="pdp-sticky-bar__thumb" alt="" width="48" height="48" />
    <div class="pdp-sticky-bar__info">
      <div class="pdp-sticky-bar__name"></div>
      <div class="pdp-sticky-bar__price"></div>
    </div>
    <button type="button" class="btn btn--dark">Thêm vào giỏ</button>`;
  document.body.appendChild(stickyBar);
  const stickyThumb = stickyBar.querySelector(".pdp-sticky-bar__thumb");
  const stickyName = stickyBar.querySelector(".pdp-sticky-bar__name");
  const stickyPrice = stickyBar.querySelector(".pdp-sticky-bar__price");
  const stickyAdd = stickyBar.querySelector("button");
  function updateStickyBar() {
    if (!current) return;
    stickyThumb.src = mainImg ? mainImg.getAttribute("src") : current.image;
    stickyThumb.alt = current.name;
    stickyName.textContent = current.name;
    stickyPrice.textContent = formatVND(selectedPrice || current.price);
  }
  const buyPanel = $(".pdp-buy");
  if (buyPanel) {
    new IntersectionObserver((entries) => {
      if (!current) return;
      const shouldShow = buyPanel.getBoundingClientRect().bottom < 0;
      stickyBar.classList.toggle("is-visible", shouldShow);
      if (shouldShow) updateStickyBar();
    }, { threshold: 0 }).observe(buyPanel);
  }
  stickyAdd.addEventListener("click", () => {
    if (!current) return;
    window.dispatchEvent(new CustomEvent("sapa:add-to-cart", { detail: { ...currentProduct(), openDrawer: true } }));
    flashBtn(stickyAdd);
  });

  /* —— Button success flash —— */
  function flashBtn(btn) {
    if (!btn) return;
    const orig = btn.textContent;
    btn.textContent = "✓ Đã thêm!";
    btn.classList.add("is-success");
    setTimeout(() => { btn.textContent = orig; btn.classList.remove("is-success"); }, 1200);
  }

  /* —— Add to cart / buy now —— */
  function currentProduct() {
    if (!current) return {};
    const size = selectedSize ? ` · ${selectedSize}` : "";
    const color = selectedColor ? ` · ${selectedColor}` : "";
    return {
      id: `${current.id}${selectedSize ? "-" + selectedSize.toLowerCase() : ""}`,
      name: `${current.name}${size}${color}`,
      price: selectedPrice || current.price,
      img: mainImg ? mainImg.getAttribute("src") : current.image,
      qty: qty,
    };
  }

  const addBtn = $("#pdp-add");
  addBtn?.addEventListener("click", () => {
    if (!current) return;
    window.dispatchEvent(new CustomEvent("sapa:add-to-cart", { detail: currentProduct() }));
    flashBtn(addBtn);
  });

  const buyNowBtn = $("#pdp-buy-now");
  buyNowBtn?.addEventListener("click", () => {
    if (!current) return;
    window.dispatchEvent(new CustomEvent("sapa:add-to-cart", { detail: { ...currentProduct(), openDrawer: true } }));
    flashBtn(buyNowBtn);
  });

  /* —— Load products and apply —— */
  fetch("data/products.json")
    .then((r) => {
      if (!r.ok) throw new Error("fetch failed");
      return r.json();
    })
    .then((data) => {
      const all = Array.isArray(data) ? data : [];
      const p = all.find((x) => x.id === productId) || all[0];
      if (!p) return;
      applyProduct(p, all);
      // Dispatch event for recently-viewed tracking
      window.dispatchEvent(new CustomEvent("sapa:product-loaded", { detail: p }));
    })
    .catch(() => {
      /* keep static fallback content already in HTML */
    });
})();
