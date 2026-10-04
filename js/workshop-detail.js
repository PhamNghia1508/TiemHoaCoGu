(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const params = new URLSearchParams(location.search);
  const id = params.get("id") || "ws-co-ban";

  // Pre-select the booking form's class to this workshop and refresh its slots.
  // workshop.js (loaded before us) owns the form logic + slot filling.
  const classSelect = document.getElementById("ws-class");
  if (classSelect && classSelect.value !== id) {
    classSelect.value = id;
    classSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const fmtVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(n) + "₫";

  const INCLUDE_IMG = [
    "assets/prod-kit.webp",
    "assets/note-rose.webp",
    "assets/ws-gallery.webp",
    "assets/note-kraft.webp",
    "assets/prod-candle.webp",
    "assets/note-linen.webp",
  ];

  function render(ws, all) {
    document.title = `${ws.name} — Workshop — SÁPA Studio`;

    // breadcrumb + hero
    $("#wsd-crumb-name").textContent = ws.name;
    $("#wsd-img").src = ws.image;
    $("#wsd-img").alt = ws.name;
    $("#wsd-tag").textContent = ws.tag;
    $("#wsd-title").textContent = ws.name;
    $("#wsd-lead").textContent = ws.lead;

    const metaEl = $("#wsd-meta");
    metaEl.innerHTML = ws.meta
      .map((m) => `<div class="kv"><span>${m.label}</span><strong>${m.value}</strong></div>`)
      .join("");

    // ensure the in-page booking form is locked to this class
    if (classSelect && classSelect.value !== ws.id) {
      classSelect.value = ws.id;
      classSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    $("#wsd-skeleton").hidden = true;
    $("#wsd-hero").hidden = false;

    // goals
    $("#wsd-goals").innerHTML = ws.goals.map((g) => `<li>${g}</li>`).join("");
    $("#wsd-goals-section").hidden = false;

    // includes
    const incEl = $("#wsd-includes");
    incEl.innerHTML = ws.includes
      .map((g, i) => {
        const img = INCLUDE_IMG[i % INCLUDE_IMG.length];
        return `<figure class="note-card reveal">
          <div class="note-card__media"><img src="${img}" alt="" width="720" height="720" loading="lazy" /></div>
          <figcaption><strong>${g}</strong></figcaption>
        </figure>`;
      })
      .join("");
    $("#wsd-includes-section").hidden = false;

    // for who
    $("#wsd-for").textContent = ws.forWho;
    $("#wsd-for-section").hidden = false;

    // schedule preview
    renderSchedule(ws.id);
    $("#wsd-schedule-section").hidden = false;

    // FAQ
    $("#wsd-faq").hidden = false;

    // related
    const related = all.filter((w) => w.id !== ws.id).slice(0, 3);
    $("#wsd-related-grid").innerHTML = related
      .map(
        (w) => `<a class="wsd-related-card reveal" href="workshop-detail.html?id=${w.id}">
          <div class="wsd-related-card__media"><img src="${w.image}" alt="${w.name}" width="900" height="900" loading="lazy" /></div>
          <div class="wsd-related-card__body">
            <p class="wsd-related-card__tag">${w.tag}</p>
            <h3>${w.name}</h3>
            <p>${w.description}</p>
            <span class="wsd-related-card__price">${w.priceLabel}</span>
          </div>
        </a>`
      )
      .join("");
    $("#wsd-related").hidden = false;

    // reveal: main.js owns the IntersectionObserver; force-reveal anything
    // we injected after it ran so content never sits hidden.
    requestAnimationFrame(() => {
      $$("#wsd-related .reveal, #wsd-includes-section .reveal").forEach((el) =>
        el.classList.add("is-in")
      );
    });

    // Sticky mobile booking CTA
    initStickyCTA(ws);
  }

  function initStickyCTA(ws) {
    const sticky = $("#wsd-sticky-book");
    if (!sticky) return;
    const stickyName = $("#wsd-sticky-name");
    const stickyPrice = $("#wsd-sticky-price");
    if (stickyName) stickyName.textContent = ws.name;
    if (stickyPrice) stickyPrice.textContent = ws.priceLabel;

    const hero = $("#wsd-hero");
    const bookSection = $("#book");
    let heroPassed = false;
    let bookVisible = false;

    function update() {
      const show = heroPassed && !bookVisible && window.innerWidth <= 860;
      sticky.hidden = !show;
      document.body.classList.toggle("has-wsd-sticky", show);
    }

    if (hero) {
      const heroObs = new IntersectionObserver(
        ([entry]) => {
          heroPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          update();
        },
        { threshold: 0 }
      );
      heroObs.observe(hero);
    }

    if (bookSection) {
      const bookObs = new IntersectionObserver(
        ([entry]) => {
          bookVisible = entry.isIntersecting;
          update();
        },
        { threshold: 0.15 }
      );
      bookObs.observe(bookSection);
    }

    window.addEventListener("resize", update);
  }

  function renderSchedule(classId) {
    const listEl = $("#wsd-sched-list");
    const booking = window.__sapaBooking;
    if (!booking) {
      listEl.innerHTML = `<p class="wsd-sched-empty">Xem lịch đầy đủ tại trang Workshop.</p>`;
      return;
    }
    let sessions = booking.getSessions() || [];
    const left = (s) => Math.max(0, s.cap - s.taken);
    const isPast = (s) => {
      const d = new Date(`${s.date}T${s.start}:00`);
      return d.getTime() < Date.now() - 2 * 3600 * 1000;
    };
    const dayLabel = (d) => booking.dayLabel?.(d) || d;
    const upcoming = sessions
      .filter((s) => s.classId === classId && !isPast(s) && left(s) > 0)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
      .slice(0, 5);

    if (!upcoming.length) {
      listEl.innerHTML = `<p class="wsd-sched-empty">Hiện chưa có buổi còn chỗ cho lớp này — xem danh sách chờ tại trang Workshop.</p>`;
      return;
    }
    listEl.innerHTML = upcoming
      .map(
        (s) => `<div class="wsd-sched-row">
          <strong>${dayLabel(s.date)} · ${s.start}–${s.end}</strong>
          <span>còn ${left(s)}/${s.cap} ${s.classId === "ws-gia-dinh" ? "cặp" : "chỗ"}</span>
        </div>`
      )
      .join("");
  }

  async function init() {
    try {
      const res = await fetch("data/workshops.json", { cache: "no-cache" });
      const all = await res.json();
      const ws = all.find((w) => w.id === id);
      if (!ws) {
        $("#wsd-skeleton").hidden = true;
        $("#wsd-error").hidden = false;
        return;
      }
      render(ws, all);
    } catch (e) {
      $("#wsd-skeleton").hidden = true;
      $("#wsd-error").hidden = false;
    }
  }

  // booking.js may load after this script; wait a tick for the API
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => setTimeout(init, 60));
  } else {
    setTimeout(init, 60);
  }
})();
