(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const grid = $("#shop-grid");
  const countEl = $("#shop-count");
  const emptyEl = $("#shop-empty");
  if (!grid) return;

  const formatVND = (n) =>
    Number(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let products = [];

  function cardHTML(p) {
    const badge = p.badge
      ? `<span class="badge">${p.badge}</span>`
      : "";
    const old = p.oldPrice
      ? ` <s>${formatVND(p.oldPrice)}</s>`
      : "";
    const stock = p.inStock === false
      ? `<span class="shop-out">Hết hàng</span>`
      : "";
    return `
      <article class="product-card reveal" data-id="${p.id}" data-cat="${p.category}">
        <a class="product-card__media product-card__link" href="product.html?id=${p.id}" aria-label="${p.name}">
          ${badge}
          <img src="${p.image}" alt="${p.name}" width="900" height="900" loading="lazy" />
        </a>
        <div class="product-card__foot">
          <h3>${p.name}</h3>
          <p class="price">${formatVND(p.price)}${old}</p>
        </div>
        <a class="add-btn" href="product.html?id=${p.id}">Xem chi tiết</a>
      </article>`;
  }

  function render(list) {
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
  }

  function filter(cat) {
    const list =
      cat === "all" ? products : products.filter((p) => p.category === cat);
    render(list);
  }

  $$(".shop-filters .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".shop-filters .chip").forEach((c) => c.classList.remove("is-on"));
      chip.classList.add("is-on");
      filter(chip.dataset.sfilter || "all");
    });
  });

  fetch("data/products.json")
    .then((r) => {
      if (!r.ok) throw new Error("fetch failed");
      return r.json();
    })
    .then((data) => {
      products = Array.isArray(data) ? data : [];
      render(products);
    })
    .catch(() => {
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML = `<p class="shop-empty">Không tải được danh sách sản phẩm. Vui lòng thử lại sau.</p>`;
    });
})();
