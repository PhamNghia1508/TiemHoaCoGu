/* SÁPA Studio — New Features: Quick View, Price Range, Share, Reading Progress */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmtVND = (n) => Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";
  const CAT_LABEL = { bo: "Bó hoa sáp", lo: "Lọ & nến", diy: "Set & phụ kiện" };

  /* ===== Quick View modal (shop page) ===== */
  const isShopPage = location.pathname.includes("shop");
  let qvProducts = null;

  async function loadProducts() {
    if (qvProducts) return qvProducts;
    try {
      const res = await fetch("data/products.json");
      if (!res.ok) throw new Error("fetch failed");
      qvProducts = await res.json();
      return qvProducts;
    } catch { return []; }
  }

  if (isShopPage) {
    const modal = document.createElement("div");
    modal.className = "qv-modal";
    modal.innerHTML = `
      <div class="qv-modal__panel">
        <button class="qv-modal__close" aria-label="Đóng">✕</button>
        <img class="qv-modal__img" alt="" />
        <div class="qv-modal__body">
          <p class="qv-modal__kicker"></p>
          <h2 class="qv-modal__title"></h2>
          <p class="qv-modal__price"></p>
          <p class="qv-modal__desc"></p>
          <div class="qv-modal__actions">
            <button class="btn btn--dark" data-qv-add>Thêm vào giỏ</button>
            <a class="btn btn--ghost-dark" data-qv-detail>Xem chi tiết</a>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const qvImg = modal.querySelector(".qv-modal__img");
    const qvKicker = modal.querySelector(".qv-modal__kicker");
    const qvTitle = modal.querySelector(".qv-modal__title");
    const qvPrice = modal.querySelector(".qv-modal__price");
    const qvDesc = modal.querySelector(".qv-modal__desc");
    const qvAdd = modal.querySelector("[data-qv-add]");
    const qvDetail = modal.querySelector("[data-qv-detail]");
    let qvCurrent = null;

    function openQV(product) {
      qvCurrent = product;
      qvImg.src = product.image;
      qvImg.alt = product.name;
      qvKicker.textContent = CAT_LABEL[product.category] || "Hoa sáp thủ công";
      qvTitle.textContent = product.name;
      qvPrice.innerHTML = fmtVND(product.price) + (product.oldPrice ? ` <s>${fmtVND(product.oldPrice)}</s>` : "");
      qvDesc.textContent = product.description || "";
      qvDetail.href = `product.html?id=${product.id}`;
      modal.classList.add("is-open");
      document.body.style.overflow = "hidden";
      modal.querySelector(".qv-modal__close").focus();
    }

    function closeQV() {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
    }

    modal.querySelector(".qv-modal__close").addEventListener("click", closeQV);
    modal.addEventListener("click", (e) => { if (e.target === modal) closeQV(); });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeQV();
    });

    qvAdd.addEventListener("click", () => {
      if (!qvCurrent) return;
      window.dispatchEvent(new CustomEvent("sapa:add-to-cart", {
        detail: { id: qvCurrent.id, name: qvCurrent.name, price: qvCurrent.price, img: qvCurrent.image, qty: 1 }
      }));
      closeQV();
    });

    // Delegate clicks on .qv-trigger buttons (cards are dynamically rendered)
    document.addEventListener("click", async (e) => {
      const trigger = e.target.closest(".qv-trigger");
      if (!trigger) return;
      e.preventDefault();
      e.stopPropagation();
      const id = trigger.dataset.id;
      if (!id) return;
      const products = await loadProducts();
      const product = products.find((p) => p.id === id);
      if (product) openQV(product);
    });
  }

  /* ===== Price range filter (shop page) ===== */
  // Dispatches a custom event that shop.js listens to
  const priceRange = $("#price-range");
  if (priceRange && isShopPage) {
    const minInput = $("#price-min");
    const maxInput = $("#price-max");
    const minLabel = $("#price-min-label");
    const maxLabel = $("#price-max-label");
    const fill = priceRange.querySelector(".price-range__fill");
    const sliderMin = priceRange.querySelector('[data-slider="min"]');
    const sliderMax = priceRange.querySelector('[data-slider="max"]');
    const MIN = 0;
    const MAX = 1200000;
    let valMin = MIN;
    let valMax = MAX;

    function updateUI() {
      const pctMin = (valMin / MAX) * 100;
      const pctMax = (valMax / MAX) * 100;
      sliderMin.style.left = pctMin + "%";
      sliderMax.style.left = pctMax + "%";
      fill.style.left = pctMin + "%";
      fill.style.width = (pctMax - pctMin) + "%";
      if (minLabel) minLabel.textContent = fmtVND(valMin);
      if (maxLabel) maxLabel.textContent = fmtVND(valMax);
      if (minInput) minInput.value = valMin;
      if (maxInput) maxInput.value = valMax;
    }

    function dispatchChange() {
      document.dispatchEvent(new CustomEvent("sapa:price-filter", {
        detail: { min: valMin, max: valMax }
      }));
    }

    function dragSlider(slider, which) {
      const track = priceRange.querySelector(".price-range__track");
      let dragging = false;

      function onMove(e) {
        if (!dragging) return;
        const rect = track.getBoundingClientRect();
        const x = Math.max(0, Math.min(rect.width, (e.touches ? e.touches[0].clientX : e.clientX) - rect.left));
        const val = Math.round((x / rect.width) * MAX / 10000) * 10000;
        if (which === "min") {
          valMin = Math.min(val, valMax - 50000);
        } else {
          valMax = Math.max(val, valMin + 50000);
        }
        updateUI();
        dispatchChange();
      }

      function onUp() { dragging = false; }

      slider.addEventListener("pointerdown", (e) => { dragging = true; e.preventDefault(); });
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    }

    if (sliderMin) dragSlider(sliderMin, "min");
    if (sliderMax) dragSlider(sliderMax, "max");

    // Manual input
    minInput?.addEventListener("change", () => {
      valMin = Math.max(MIN, Math.min(Number(minInput.value) || MIN, valMax - 50000));
      updateUI();
      dispatchChange();
    });
    maxInput?.addEventListener("change", () => {
      valMax = Math.min(MAX, Math.max(Number(maxInput.value) || MAX, valMin + 50000));
      updateUI();
      dispatchChange();
    });

    updateUI();
  }

  /* ===== Social share (product page) ===== */
  const shareBtns = $(".share-btns");
  if (shareBtns) {
    const pageUrl = encodeURIComponent(location.href);
    const pageTitle = encodeURIComponent(document.title);

    const fb = shareBtns.querySelector("[data-share='fb']");
    const zalo = shareBtns.querySelector("[data-share='zalo']");
    const copy = shareBtns.querySelector("[data-share='copy']");

    fb?.addEventListener("click", () => {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`, "_blank", "noopener,noreferrer,width=600,height=400");
    });
    zalo?.addEventListener("click", () => {
      window.open(`https://zalo.me/share?link=${pageUrl}`, "_blank", "noopener,noreferrer,width=600,height=400");
    });
    copy?.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(location.href);
        copy.classList.add("is-copied");
        const toast = $("#toast");
        if (toast) {
          toast.textContent = "Đã sao chép link!";
          toast.hidden = false;
          requestAnimationFrame(() => toast.classList.add("is-on"));
          clearTimeout(window.__sapaToastTimer);
          window.__sapaToastTimer = setTimeout(() => {
            toast.classList.remove("is-on");
            setTimeout(() => { toast.hidden = true; }, 280);
          }, 2000);
        }
        setTimeout(() => copy.classList.remove("is-copied"), 1500);
      } catch { /* clipboard not available */ }
    });
  }

  /* ===== Reading progress (blog / cau-chuyen) ===== */
  const articleMain = $("main#top");
  const isArticlePage = location.pathname.includes("blog") || location.pathname.includes("cau-chuyen");
  if (isArticlePage && articleMain) {
    const bar = document.createElement("div");
    bar.className = "reading-progress";
    document.body.appendChild(bar);

    function updateReading() {
      const rect = articleMain.getBoundingClientRect();
      const total = articleMain.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      const pct = total > 0 ? Math.min(100, (scrolled / total) * 100) : 0;
      bar.style.width = pct + "%";
    }
    window.addEventListener("scroll", updateReading, { passive: true });
    updateReading();
  }
})();
