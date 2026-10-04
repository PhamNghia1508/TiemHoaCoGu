(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Hero entrance —— */
  const hero = $(".gal-hero");
  requestAnimationFrame(() => hero?.classList.add("is-ready"));

  /* —— Reveal observer (reuse pattern from main.js) —— */
  const io = !reduceMotion && "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.05, rootMargin: "0px 0px -2% 0px" })
    : null;

  if (!io || reduceMotion) {
    $$(".reveal").forEach((el) => el.classList.add("is-in"));
  } else {
    $$(".reveal").forEach((el) => io.observe(el));
    setTimeout(() => $$(".reveal").forEach((el) => el.classList.add("is-in")), 2500);
  }

  /* —— Filters —— */
  const items = $$(".gal-item");
  const empty = $("#gal-empty");

  $$(".gal-filters .chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".gal-filters .chip").forEach((c) => c.classList.remove("is-on"));
      chip.classList.add("is-on");
      const f = chip.dataset.gfilter || "all";
      let visible = 0;
      items.forEach((item) => {
        const show = f === "all" || item.dataset.cat === f;
        item.classList.toggle("is-hidden", !show);
        if (show) visible++;
      });
      if (empty) empty.hidden = visible > 0;
    });
  });

  /* —— Lightbox —— */
  const lightbox = $("#lightbox");
  const lbImg = $("#lightbox-img");
  const lbTitle = $("#lightbox-title");
  const lbDesc = $("#lightbox-desc");
  let currentIndex = -1;
  let visibleItems = [];

  function getVisibleItems() {
    return items.filter((item) => !item.classList.contains("is-hidden"));
  }

  function openLightbox(index) {
    visibleItems = getVisibleItems();
    if (index < 0 || index >= visibleItems.length) return;
    currentIndex = index;
    const item = visibleItems[index];
    lbImg.src = item.dataset.img || "";
    lbImg.alt = item.dataset.title || "";
    lbTitle.textContent = item.dataset.title || "";
    lbDesc.textContent = item.dataset.desc || "";
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    const lenis = window.__sapaLenis;
    if (lenis) lenis.stop();
    $("#lightbox-close")?.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    const lenis = window.__sapaLenis;
    if (lenis) lenis.start();
    currentIndex = -1;
  }

  function navigate(dir) {
    if (currentIndex < 0) return;
    visibleItems = getVisibleItems();
    currentIndex = (currentIndex + dir + visibleItems.length) % visibleItems.length;
    const item = visibleItems[currentIndex];
    lbImg.src = item.dataset.img || "";
    lbImg.alt = item.dataset.title || "";
    lbTitle.textContent = item.dataset.title || "";
    lbDesc.textContent = item.dataset.desc || "";
  }

  items.forEach((item, i) => {
    item.setAttribute("tabindex", "0");
    item.setAttribute("role", "button");
    const title = item.dataset.title || "";
    item.setAttribute("aria-label", `Xem ảnh: ${title}`);
    item.addEventListener("click", () => {
      const allItems = getVisibleItems();
      openLightbox(allItems.indexOf(item));
    });
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const allItems = getVisibleItems();
        openLightbox(allItems.indexOf(item));
      }
    });
  });

  $("#lightbox-close")?.addEventListener("click", closeLightbox);
  $("#lightbox-prev")?.addEventListener("click", () => navigate(-1));
  $("#lightbox-next")?.addEventListener("click", () => navigate(1));
  lightbox?.addEventListener("click", (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox?.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") navigate(-1);
    if (e.key === "ArrowRight") navigate(1);
  });

  /* —— Swipe support —— */
  let touchStartX = 0;
  lightbox?.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  lightbox?.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) navigate(dx > 0 ? -1 : 1);
  }, { passive: true });
})();
