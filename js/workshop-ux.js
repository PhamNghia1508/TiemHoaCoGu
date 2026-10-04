/* SÁPA Workshop — UX Behavior Enhancements */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasHover = window.matchMedia("(hover: hover)").matches;

  /* ===== 1. Magnetic buttons ===== */
  if (!reduceMotion && hasHover) {
    const MAGNET_STRENGTH = 0.3;
    $$(".ws-hero__actions .btn, .ws-book .btn--dark, .ws-class__actions .btn--dark, .flow-actions .btn--dark, .schedule-foot .btn-mini").forEach((btn) => {
      const wrap = document.createElement("span");
      wrap.className = "magnet";
      btn.parentNode.insertBefore(wrap, btn);
      wrap.appendChild(btn);

      wrap.addEventListener("pointermove", (e) => {
        const r = wrap.getBoundingClientRect();
        const dx = (e.clientX - r.left - r.width / 2) * MAGNET_STRENGTH;
        const dy = (e.clientY - r.top - r.height / 2) * MAGNET_STRENGTH;
        wrap.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      wrap.addEventListener("pointerleave", () => {
        wrap.style.transform = "";
      });
    });
  }

  /* ===== 2. Ripple click effect ===== */
  if (!reduceMotion) {
    $$(".btn--dark, .btn--cream, .btn-mini, .btn--block").forEach((btn) => {
      btn.classList.add("ripple-origin");
      btn.addEventListener("click", (e) => {
        const r = btn.getBoundingClientRect();
        const wave = document.createElement("span");
        wave.className = "ripple-wave";
        const size = Math.max(r.width, r.height);
        wave.style.width = wave.style.height = size + "px";
        wave.style.left = (e.clientX - r.left - size / 2) + "px";
        wave.style.top = (e.clientY - r.top - size / 2) + "px";
        btn.appendChild(wave);
        setTimeout(() => wave.remove(), 600);
      });
    });
  }

  /* ===== 3. 3D tilt on class cards ===== */
  if (!reduceMotion && hasHover) {
    $$(".ws-class").forEach((card) => {
      card.classList.add("is-tilting");
      let rafId = null;
      card.addEventListener("pointermove", (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = `perspective(800px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateZ(0)`;
        });
      });
      card.addEventListener("pointerleave", () => {
        if (rafId) cancelAnimationFrame(rafId);
        card.style.transform = "";
      });
    });
  }

  /* ===== 4. Animated stat counters ===== */
  const stats = $$(".ws-stats .stat");
  if (stats.length && !reduceMotion) {
    stats.forEach((stat) => stat.classList.add("is-revealed-pending"));
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const stat = entry.target;
        stat.classList.add("is-revealed");
        const strong = stat.querySelector("strong");
        if (!strong) return;
        const raw = strong.textContent.trim();
        const match = raw.match(/^([\d.]+)(.*)$/);
        if (!match) return;
        const target = parseFloat(match[1]);
        const suffix = match[2] || "";
        if (isNaN(target)) return;
        strong.classList.add("is-counting");
        const duration = 900;
        const start = performance.now();
        const tick = (now) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          const val = target * eased;
          const display = target % 1 === 0 ? Math.round(val) : val.toFixed(1);
          strong.textContent = display + suffix;
          if (t < 1) requestAnimationFrame(tick);
          else strong.textContent = match[1] + suffix;
        };
        requestAnimationFrame(tick);
        counterObserver.unobserve(stat);
      });
    }, { threshold: 0.5 });
    stats.forEach((s) => counterObserver.observe(s));
  }

  /* ===== 5. Inline form validation ===== */
  const validators = {
    "ws-name": (v) => v.trim().length >= 2 || "Vui lòng nhập họ tên",
    "ws-phone": (v) => /^(0|\+84)(\d{9,10})$/.test(v.replace(/\s/g, "")) || "Số điện thoại chưa hợp lệ (VD: 09xx xxx xxx)",
    "ws-email": (v) => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Email chưa đúng định dạng",
    "ws-qty": (v) => {
      const n = Number(v);
      return (Number.isInteger(n) && n >= 1 && n <= 4) || "Số lượng từ 1 đến 4";
    },
  };

  const checkSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const crossSVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 6l12 12M18 6L6 18" stroke-linecap="round"/></svg>';

  Object.keys(validators).forEach((id) => {
    const input = $("#" + id);
    if (!input) return;
    const row = input.closest(".ws-form__row");
    if (!row) return;

    // Create valid icon
    const icon = document.createElement("span");
    icon.className = "ws-form__valid-icon";
    icon.innerHTML = checkSVG;
    row.appendChild(icon);

    // Create hint
    const hint = document.createElement("p");
    hint.className = "ws-form__hint";
    row.appendChild(hint);

    const validate = () => {
      const result = validators[id](input.value);
      const ok = result === true;
      if (ok) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
        icon.className = "ws-form__valid-icon is-ok";
        icon.innerHTML = checkSVG;
        row.classList.remove("has-error");
        hint.textContent = "";
      } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        icon.className = "ws-form__valid-icon is-err";
        icon.innerHTML = crossSVG;
        row.classList.add("has-error");
        hint.textContent = result;
      }
      return ok;
    };

    input.addEventListener("blur", () => {
      if (input.value.trim()) validate();
    });
    input.addEventListener("input", () => {
      if (row.classList.contains("has-error")) validate();
      else if (input.value.trim()) {
        const result = validators[id](input.value);
        if (result === true) {
          input.classList.remove("is-invalid");
          input.classList.add("is-valid");
          icon.className = "ws-form__valid-icon is-ok";
          icon.innerHTML = checkSVG;
        }
      } else {
        input.classList.remove("is-valid", "is-invalid");
        icon.className = "ws-form__valid-icon";
      }
    });

    // Expose for form submit
    input._validate = validate;
  });

  // Hook into existing form submit for pre-validation visual feedback
  const form = $("#ws-form");
  if (form) {
    form.addEventListener("submit", () => {
      Object.keys(validators).forEach((id) => {
        const input = $("#" + id);
        if (input && input._validate && input.value.trim()) input._validate();
      });
    }, true); // capture phase — runs before workshop.js handler
  }

  /* ===== 6. Section progress dots ===== */
  const sections = [
    { id: "classes", label: "Các lớp" },
    { id: "schedule", label: "Lịch" },
    { id: "included", label: "Bao gồm" },
    { id: "book", label: "Đăng ký" },
    { id: "faq", label: "FAQ" },
  ].filter((s) => $("#" + s.id));

  if (sections.length > 1) {
    const dotsWrap = document.createElement("nav");
    dotsWrap.className = "section-dots";
    dotsWrap.setAttribute("aria-label", "Điều hướng nhanh");
    sections.forEach((s) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "section-dot";
      dot.setAttribute("aria-label", s.label);
      dot.innerHTML = `<span class="section-dot__label">${s.label}</span>`;
      dot.addEventListener("click", () => {
        const target = $("#" + s.id);
        if (!target) return;
        const lenis = window.__sapaLenis;
        if (lenis && typeof lenis.scrollTo === "function") {
          lenis.scrollTo(target, { offset: -12, duration: 1.25 });
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
      dotsWrap.appendChild(dot);
    });
    document.body.appendChild(dotsWrap);

    const dotEls = $$(".section-dot", dotsWrap);

    // Show dots after scrolling past hero
    const lenis = window.__sapaLenis;
    const updateDots = () => {
      const y = lenis ? lenis.scroll : window.scrollY;
      dotsWrap.classList.toggle("is-visible", y > 400);

      const probeY = (nav) => {
        const navEl = $("#nav");
        return navEl ? navEl.offsetHeight * 0.5 + 20 : 100;
      };
      const threshold = probeY();
      let activeIdx = -1;
      sections.forEach((s, i) => {
        const el = $("#" + s.id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= threshold && r.bottom >= threshold) activeIdx = i;
      });
      dotEls.forEach((d, i) => d.classList.toggle("is-active", i === activeIdx));
    };
    if (lenis) lenis.on("scroll", updateDots);
    else window.addEventListener("scroll", updateDots, { passive: true });
    updateDots();
  }
})();
