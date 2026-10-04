/* SÁPA Studio — Custom order wizard (4-step) for shop page */
(() => {
  const wizard = document.getElementById("co-wizard");
  if (!wizard) return;

  const TOTAL_STEPS = 4;
  let step = 1;

  const state = {
    type: "",
    occasion: "",
    color: "",
    budget: "",
    date: "",
    qty: "1",
    name: "",
    phone: "",
    email: "",
    detail: "",
  };

  const $ = (id) => document.getElementById(id);
  const $$ = (s, r = wizard) => Array.from(r.querySelectorAll(s));

  const fill = $("co-progress-fill");
  const backBtn = $("co-back");
  const nextBtn = $("co-next");
  const submitBtn = $("co-submit");
  const msg = $("co-msg");

  function updateProgress() {
    fill.style.width = (step / TOTAL_STEPS) * 100 + "%";
    $$("[data-plabel]").forEach((el) => {
      el.classList.toggle("is-on", Number(el.dataset.plabel) <= step);
    });
  }

  function showStep(n) {
    step = n;
    wizard.dataset.step = n;
    $$(".co-step").forEach((el) => {
      const active = Number(el.dataset.coStep) === n;
      el.classList.toggle("is-active", active);
      el.hidden = !active;
    });
    backBtn.disabled = n === 1;
    nextBtn.hidden = n === TOTAL_STEPS;
    submitBtn.hidden = n !== TOTAL_STEPS;
    if (n === TOTAL_STEPS) renderSummary();
    updateProgress();
    // reset message
    if (msg) { msg.textContent = ""; msg.className = "form-msg"; }
    // focus first input in step
    const firstInput = wizard.querySelector(`.co-step.is-active input, .co-step.is-active button`);
    if (firstInput && !firstInput.classList.contains("co-option")) firstInput.focus?.();
  }

  function canAdvance() {
    if (step === 1) return !!state.type;
    if (step === 2) return !!state.occasion;
    if (step === 3) return !!state.color && !!state.budget;
    return true;
  }

  function renderSummary() {
    const summary = $("co-summary");
    if (!summary) return;
    const rows = [
      ["Loại hoa", state.type],
      ["Dịp", state.occasion],
      ["Màu", state.color],
      ["Ngân sách", state.budget],
      ["Ngày nhận", state.date || "Chưa chọn"],
      ["Số lượng", state.qty],
    ].filter(([, v]) => v);
    summary.innerHTML = rows
      .map(([k, v]) => `<div><dt>${k}:</dt><dd>${v}</dd></div>`)
      .join("");
  }

  function setMsg(text, ok) {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.toggle("is-ok", ok);
    msg.classList.toggle("is-err", !ok);
  }

  // Option selection (type, occasion, color, budget)
  $$("[data-co-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.coSelect;
      const value = btn.dataset.value;
      state[field] = value;
      // toggle selected in same group
      $$(`[data-co-select="${field}"]`).forEach((b) => b.classList.remove("is-selected"));
      btn.classList.add("is-selected");
      // enable next if can advance
      nextBtn.disabled = !canAdvance();
    });
  });

  // Text inputs
  $("co-date")?.addEventListener("change", (e) => { state.date = e.target.value; });
  $("co-qty")?.addEventListener("input", (e) => { state.qty = e.target.value || "1"; });
  $("co-name")?.addEventListener("input", (e) => { state.name = e.target.value; });
  $("co-phone")?.addEventListener("input", (e) => { state.phone = e.target.value; });
  $("co-email")?.addEventListener("input", (e) => { state.email = e.target.value; });
  $("co-detail")?.addEventListener("input", (e) => { state.detail = e.target.value; });

  // Navigation
  nextBtn.addEventListener("click", () => {
    if (!canAdvance()) {
      const hints = ["Vui lòng chọn loại hoa", "Vui lòng chọn dịp", "Vui lòng chọn màu và ngân sách"];
      setMsg(hints[step - 1] || "Vui lòng hoàn thành bước này", false);
      return;
    }
    if (step < TOTAL_STEPS) showStep(step + 1);
  });

  backBtn.addEventListener("click", () => {
    if (step > 1) showStep(step - 1);
  });

  // Submit
  submitBtn.addEventListener("click", (e) => {
    e.preventDefault();

    // honeypot
    if ($("co-website")?.value) return;

    if (!state.name.trim() || !state.phone.trim()) {
      setMsg("Vui lòng điền họ tên và số điện thoại.", false);
      return;
    }

    const phoneOK = /^0\d{8,10}$/.test(state.phone.replace(/\s/g, ""));
    if (!phoneOK) {
      setMsg("Số điện thoại không hợp lệ — vui lòng kiểm tra lại.", false);
      return;
    }

    // Save contact before reset
    const custName = state.name;
    const custPhone = state.phone;

    // Reset wizard first, then show success message (showStep clears msg)
    Object.keys(state).forEach((k) => { state[k] = ""; });
    state.qty = "1";
    $$("[data-co-select]").forEach((b) => b.classList.remove("is-selected"));
    $("co-date").value = "";
    $("co-qty").value = "1";
    $("co-name").value = "";
    $("co-phone").value = "";
    $("co-email").value = "";
    $("co-detail").value = "";
    showStep(1);

    setMsg(
      `Đã gửi yêu cầu! SÁPA sẽ liên hệ ${custName} qua ${custPhone} trong 30 phút để báo giá.`,
      true
    );
  });

  // Init
  showStep(1);
})();
