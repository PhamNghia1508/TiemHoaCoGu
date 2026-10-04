(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* gallery thumbs */
  const mainImg = $("#pdp-image");
  $$(".pdp-thumb").forEach((thumb) => {
    thumb.addEventListener("click", () => {
      $$(".pdp-thumb").forEach((t) => t.classList.remove("is-active"));
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

  /* size / color variants */
  let selectedSize = "M";
  let selectedColor = "Kem";
  let selectedPrice = 420000;

  const priceEl = $("#pdp-price");
  const formatVND = (n) =>
    Number(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";

  $$('.pdp-variants [data-size]').forEach((btn) => {
    btn.addEventListener("click", () => {
      $$('.pdp-variants [data-size]').forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      selectedSize = btn.dataset.size || "M";
      selectedPrice = Number(btn.dataset.price || 420000);
      if (priceEl) priceEl.textContent = formatVND(selectedPrice);
    });
  });

  $$('.pdp-variants [data-color]').forEach((btn) => {
    btn.addEventListener("click", () => {
      $$('.pdp-variants [data-color]').forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      selectedColor = btn.dataset.color || "Kem";
    });
  });

  /* PDP accordion */
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

  /* add / buy now — reuse cart from main.js via window event or localStorage */
  function currentProduct() {
    return {
      id: `trang-non-${selectedSize}-${selectedColor}`.toLowerCase(),
      name: `Bó Trăng Non · ${selectedSize} · ${selectedColor}`,
      price: selectedPrice,
      img: $("#pdp-image")?.getAttribute("src") || "assets/prod-bouquet.webp",
    };
  }

  $("#pdp-add")?.addEventListener("click", () => {
    // main.js exposes cart via DOM render; dispatch custom event for shared cart
    window.dispatchEvent(
      new CustomEvent("sapa:add-to-cart", { detail: currentProduct() })
    );
  });

  $("#pdp-buy-now")?.addEventListener("click", () => {
    window.dispatchEvent(
      new CustomEvent("sapa:add-to-cart", {
        detail: { ...currentProduct(), openDrawer: true },
      })
    );
  });
})();
