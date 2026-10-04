(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const grid = $("#shop-grid");
  const countEl = $("#shop-count");
  const emptyEl = $("#shop-empty");
  if (!grid) return;

  /* —— Hero entrance —— */
  const hero = $(".shop-hero");
  requestAnimationFrame(() => hero?.classList.add("is-ready"));

  const formatVND = (n) =>
    Number(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let products = [];
  let activeFilter = "all";
  let activeSort = "default";
  let searchTerm = "";

  /* —— Skeleton loading —— */
  function showSkeletons() {
    grid.setAttribute("aria-busy", "true");
    let html = "";
    for (let i = 0; i < 8; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton-media"></div>
          <div class="skeleton-line skeleton-line--w70"></div>
          <div class="skeleton-line skeleton-line--w50"></div>
        </div>`;
    }
    grid.innerHTML = html;
  }

  function badgeHTML(p) {
    if (p.badge && p.badgeType) {
      const cls = p.badgeType === "sale" ? "" : p.badgeType === "deal" ? " badge--deal" : "";
      return `<span class="badge${cls}">${p.badge}</span>`;
    }
    if (p.isNew) return `<span class="badge badge--new">Mới</span>`;
    if (p.isBestseller) return `<span class="badge badge--best">Bán chạy</span>`;
    return "";
  }

  function stockHTML(p) {
    if (p.inStock === false) return `<span class="stock-bar">Hết hàng</span>`;
    if (!p.stock || p.stock >= 10) return "";
    const pct = Math.max(10, Math.min(100, (p.stock / 10) * 100));
    const isLow = p.stock <= 5;
    return `<span class="stock-bar${isLow ? "" : " is-ok"}">
      <span class="stock-bar__track"><span class="stock-bar__fill" style="width:${pct}%"></span></span>
      Chỉ còn ${p.stock} ${p.category === "bo" ? "bó" : "sp"}
    </span>`;
  }

  function soldHTML(p) {
    if (!p.soldCount) return "";
    return `<p class="sold-count">Đã bán <strong>${p.soldCount}+</strong></p>`;
  }

  function cardHTML(p) {
    const badge = badgeHTML(p);
    const old = p.oldPrice ? ` <s>${formatVND(p.oldPrice)}</s>` : "";
    const stock = stockHTML(p);
    const sold = soldHTML(p);
    return `
      <article class="product-card reveal" data-id="${p.id}" data-cat="${p.category}">
        <a class="product-card__media product-card__link" href="product.html?id=${p.id}" aria-label="${p.name}">
          ${badge}
          <img src="${p.image}" alt="${p.name}" width="900" height="900" loading="lazy" />
          <span class="shop-card__overlay">
            <span>Xem chi tiết</span>
            <svg width="16" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M1 7h13M9 2l5 5-5 5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
        </a>
        <div class="product-card__foot">
          <h3>${p.name}</h3>
          <p class="price">${formatVND(p.price)}${old}</p>
          ${stock}
          ${sold}
        </div>
        <a class="add-btn" href="product.html?id=${p.id}">Xem chi tiết</a>
      </article>`;
  }

  function getFilteredSorted() {
    let list = products.slice();
    if (activeFilter !== "all") list = list.filter((p) => p.category === activeFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description || "").toLowerCase().includes(q));
    }
    switch (activeSort) {
      case "price-asc": list.sort((a, b) => a.price - b.price); break;
      case "price-desc": list.sort((a, b) => b.price - a.price); break;
      case "bestseller": list.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)); break;
      case "newest": list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
    }
    return list;
  }

  function render() {
    const list = getFilteredSorted();
    grid.innerHTML = list.map(cardHTML).join("");
    if (countEl) countEl.textContent = `${list.length} sản phẩm`;
    if (emptyEl) emptyEl.hidden = list.length > 0;
    grid.setAttribute("aria-busy", "false");

    // stagger reveal
    $$(".product-card", grid).forEach((card, i) => {
      card.style.setProperty("--d", `${(i % 4) * 80}ms`);
    });

    // observe reveals
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

    if (!io || reduceMotion) {
      $$(".product-card", grid).forEach((el) => el.classList.add("is-in"));
    } else {
      $$(".product-card", grid).forEach((el) => io.observe(el));
      setTimeout(
        () => $$(".product-card", grid).forEach((el) => el.classList.add("is-in")),
        2500
      );
    }

    // attach wishlist buttons
    if (window.__sapaAttachWish) window.__sapaAttachWish();
  }

  /* —— Filter chips —— */
  $$(".shop-filters .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".shop-filters .chip").forEach((c) => c.classList.remove("is-on"));
      chip.classList.add("is-on");
      activeFilter = chip.dataset.sfilter || "all";
      render();
    });
  });

  /* —— Search —— */
  const searchInput = $("#shop-search-input");
  searchInput?.addEventListener("input", () => {
    searchTerm = searchInput.value.trim();
    render();
  });

  /* —— Sort —— */
  const sortSelect = $("#shop-sort-select");
  sortSelect?.addEventListener("change", () => {
    activeSort = sortSelect.value;
    render();
  });

  /* —— Load products —— */
  showSkeletons();
  fetch("data/products.json")
    .then((r) => {
      if (!r.ok) throw new Error("fetch failed");
      return r.json();
    })
    .then((data) => {
      products = Array.isArray(data) ? data : [];
      render();
    })
    .catch(() => {
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML = `<p class="shop-empty">Không tải được danh sách sản phẩm. Vui lòng thử lại sau.</p>`;
    });
})();
