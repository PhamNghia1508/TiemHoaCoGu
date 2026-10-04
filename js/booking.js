/**
 * SÁPA booking prototype — pending → confirmed / expired / cancelled
 * States: pending | expired | confirmed | attended | no_show | cancelled
 */
(() => {
  const KEY = "sapa-bookings-v1";
  const HOLD_MS = 10 * 60 * 1000; // 10 minutes
  const DEPOSIT_RATE = 0.3;
  const CLASS_META = {
    "ws-co-ban": { name: "Hoa Sáp Cơ Bản", price: 450000 },
    "ws-bo-qua": { name: "Bó Quà Tặng", price: 690000 },
    "ws-gia-dinh": { name: "Workshop Gia Đình", price: 790000 },
    "ws-ky-thuat": { name: "Nặn Cánh Nâng Cao", price: 890000 },
  };
  const WD_FULL = [
    "Chủ Nhật",
    "Thứ Hai",
    "Thứ Ba",
    "Thứ Tư",
    "Thứ Năm",
    "Thứ Sáu",
    "Thứ Bảy",
  ];

  const $ = (s, r = document) => r.querySelector(s);

  const formatVND = (n) =>
    Number(n || 0)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[character]);

  const pad = (n) => String(n).padStart(2, "0");

  const isoDate = (date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const addDays = (base, count) => {
    const date = new Date(base);
    date.setDate(date.getDate() + count);
    return date;
  };

  function dayLabel(dateStr) {
    const date = new Date(`${dateStr}T12:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round(
      (new Date(`${dateStr}T00:00:00`).getTime() - today.getTime()) / 86400000
    );
    const datePart = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
    if (diff === 0) return `Hôm nay · ${datePart}`;
    if (diff === 1) return `Ngày mai · ${datePart}`;
    return `${WD_FULL[date.getDay()]} · ${datePart}`;
  }

  const sessionKey = (session) =>
    `${session.classId}|${session.date}|${session.start}`;
  const sessionLabel = (session) =>
    `${dayLabel(session.date)} · ${session.start}`;

  function buildSessions() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const plan = [
      { day: 1, classId: "ws-co-ban", start: "09:00", end: "11:30", cap: 10, taken: 6 },
      { day: 1, classId: "ws-bo-qua", start: "14:00", end: "17:00", cap: 8, taken: 6 },
      { day: 2, classId: "ws-gia-dinh", start: "09:00", end: "11:00", cap: 6, taken: 2 },
      { day: 4, classId: "ws-co-ban", start: "18:30", end: "21:00", cap: 10, taken: 3 },
      { day: 5, classId: "ws-ky-thuat", start: "13:00", end: "17:00", cap: 8, taken: 5 },
      { day: 8, classId: "ws-co-ban", start: "09:00", end: "11:30", cap: 10, taken: 10 },
      { day: 8, classId: "ws-bo-qua", start: "14:00", end: "17:00", cap: 8, taken: 4 },
      { day: 9, classId: "ws-gia-dinh", start: "09:00", end: "11:00", cap: 6, taken: 1 },
      { day: 11, classId: "ws-ky-thuat", start: "13:00", end: "17:00", cap: 8, taken: 7 },
      { day: 12, classId: "ws-co-ban", start: "18:30", end: "21:00", cap: 10, taken: 2 },
      { day: 15, classId: "ws-bo-qua", start: "09:00", end: "12:00", cap: 8, taken: 8 },
      { day: 15, classId: "ws-co-ban", start: "14:00", end: "16:30", cap: 10, taken: 5 },
      { day: 16, classId: "ws-gia-dinh", start: "09:00", end: "11:00", cap: 6, taken: 3 },
      { day: 18, classId: "ws-ky-thuat", start: "13:00", end: "17:00", cap: 8, taken: 1 },
      { day: 19, classId: "ws-co-ban", start: "09:00", end: "11:30", cap: 10, taken: 9 },
      { day: 22, classId: "ws-bo-qua", start: "14:00", end: "17:00", cap: 8, taken: 3 },
      { day: 23, classId: "ws-co-ban", start: "18:30", end: "21:00", cap: 10, taken: 0 },
      { day: 26, classId: "ws-gia-dinh", start: "09:00", end: "11:00", cap: 6, taken: 4 },
    ];
    return plan.map((item, index) => {
      const session = {
        id: `sch-${index}`,
        date: isoDate(addDays(today, item.day)),
        classId: item.classId,
        start: item.start,
        end: item.end,
        cap: item.cap,
        initialTaken: item.taken,
      };
      return { ...session, key: sessionKey(session), taken: item.taken };
    });
  }

  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      return [];
    }
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }

  function getBookings() {
    const now = Date.now();
    let changed = false;
    const bookings = load().map((booking) => {
      if (booking.status === "pending" && now >= booking.expiresAt) {
        changed = true;
        return { ...booking, status: "expired" };
      }
      return booking;
    });
    if (changed) save(bookings);
    return bookings;
  }

  function getSessions() {
    const bookings = getBookings().filter((booking) =>
      ["pending", "confirmed"].includes(booking.status)
    );
    return buildSessions().map((session) => {
      const slot = sessionLabel(session);
      const reserved = bookings
        .filter(
          (booking) =>
            booking.sessionKey === session.key ||
            (!booking.sessionKey &&
              booking.classId === session.classId &&
              booking.slot === slot)
        )
        .reduce((total, booking) => total + Number(booking.qty || 1), 0);
      const taken = Math.min(session.cap, session.initialTaken + reserved);
      return { ...session, taken, remaining: Math.max(0, session.cap - taken) };
    });
  }

  function isSessionPast(session) {
    return (
      new Date(`${session.date}T${session.start}:00`).getTime() <
      Date.now() - 2 * 3600 * 1000
    );
  }

  function getAvailableSessions() {
    return getSessions()
      .filter((session) => !isSessionPast(session) && session.remaining > 0)
      .map((session) => ({
        ...session,
        slot: sessionLabel(session),
        className: CLASS_META[session.classId]?.name || "Workshop",
      }));
  }

  function genCode() {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i += 1) {
      s += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return `SP-${s}`;
  }

  function createBooking(data) {
    const list = load();
    const total = data.total;
    const deposit = Math.round(total * DEPOSIT_RATE);
    const booking = {
      code: genCode(),
      classId: data.classId,
      className: data.className,
      slot: data.slot,
      sessionKey: data.sessionKey || "",
      sessionDate: data.sessionDate || "",
      sessionStart: data.sessionStart || "",
      name: data.name,
      phone: data.phone.replace(/\s/g, ""),
      email: data.email || "",
      qty: data.qty,
      quantityLabel: data.quantityLabel || "Số người",
      total,
      deposit,
      remaining: total - deposit,
      status: "pending",
      createdAt: Date.now(),
      expiresAt: Date.now() + HOLD_MS,
      paidAt: null,
    };
    list.push(booking);
    save(list);
    return booking;
  }

  function updateBooking(code, patch) {
    const list = load();
    const i = list.findIndex((b) => b.code === code);
    if (i < 0) return null;
    const previous = list[i];
    const allowedTransitions = {
      pending: ["confirmed", "expired", "cancelled"],
      confirmed: ["cancelled", "attended", "no_show"],
      expired: [],
      cancelled: [],
      attended: [],
      no_show: [],
    };
    if (
      patch.status &&
      patch.status !== previous.status &&
      !allowedTransitions[previous.status]?.includes(patch.status)
    ) return null;
    list[i] = { ...list[i], ...patch };
    save(list);
    window.dispatchEvent(
      new CustomEvent("sapa:booking-change", { detail: { previous, booking: list[i] } })
    );
    return list[i];
  }

  function findBooking(code, phone) {
    return (
      load().find(
        (b) =>
          b.code.toUpperCase() === String(code || "").trim().toUpperCase() &&
          b.phone.replace(/\s/g, "") === String(phone || "").replace(/\s/g, "")
      ) || null
    );
  }

  function findByPhone(phone) {
    return getBookings().filter(
      (b) => b.phone.replace(/\s/g, "") === String(phone || "").replace(/\s/g, "")
    );
  }

  function expireIfDue(booking) {
    if (booking && booking.status === "pending" && Date.now() >= booking.expiresAt) {
      return updateBooking(booking.code, { status: "expired" });
    }
    return booking;
  }

  /* ---------- UI shell ---------- */
  const flow = $("#booking-flow");
  const steps = {
    hold: $("#step-hold"),
    pay: $("#step-pay"),
    done: $("#step-done"),
    expired: $("#step-expired"),
    lost: $("#step-lost"),
  };

  function showStep(name) {
    Object.entries(steps).forEach(([k, el]) => {
      if (el) el.hidden = k !== name;
    });
    if (flow) flow.hidden = false;
    flow?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideFlow() {
    if (flow) flow.hidden = true;
  }

  let countdownTimer = null;
  let current = null;

  function renderCountdown() {
    const el = $("#hold-countdown");
    if (!el || !current) return;
    const left = Math.max(0, current.expiresAt - Date.now());
    const m = Math.floor(left / 60000);
    const s = Math.floor((left % 60000) / 1000);
    el.textContent = `${m}:${String(s).padStart(2, "0")}`;
    const bar = $("#hold-bar");
    if (bar) {
      bar.style.width = `${Math.max(0, (left / HOLD_MS) * 100)}%`;
      bar.classList.toggle("is-warn", left < 120000);
      bar.classList.toggle("is-critical", left < 30000);
    }
    // announce only at milestones (not every second)
    const live = $("#hold-live");
    if (live) {
      const totalSec = Math.ceil(left / 1000);
      if (totalSec === 120 || totalSec === 30) {
        live.textContent =
          totalSec === 120
            ? "Còn 2 phút giữ chỗ"
            : "Còn 30 giây giữ chỗ";
      }
    }
    if (left <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      current = expireIfDue(current) || current;
      renderExpired();
    }
  }

  function startCountdown(booking) {
    current = booking;
    clearInterval(countdownTimer);
    renderCountdown();
    countdownTimer = setInterval(renderCountdown, 1000);
  }

  function renderHold(booking) {
    const name = $("#hold-name");
    const info = $("#hold-info");
    const payTotal = $("#pay-total");
    const payDeposit = $("#pay-deposit");
    const payRemaining = $("#pay-remaining");
    const holdSummary = $("#hold-summary");
    const holdCode = $("#hold-code");
    const holdMeta = $("#hold-meta");
    const holdCta = $("#hold-continue");
    const payDeadline = $("#pay-deadline");

    if (name) name.textContent = booking.name;
    if (info) {
      info.textContent = `${booking.className} · ${booking.slot}`;
    }
    if (holdCode) {
      holdCode.textContent = booking.code;
    }
    if (holdMeta) {
      holdMeta.innerHTML = `
        <div><span>Lớp</span><strong>${escapeHtml(booking.className)}</strong></div>
        <div><span>Thời gian</span><strong>${escapeHtml(booking.slot)}</strong></div>
        <div><span>${escapeHtml(booking.quantityLabel || "Số người")}</span><strong>${booking.qty}</strong></div>
        <div><span>Liên hệ</span><strong>${escapeHtml(booking.name)} · ${escapeHtml(booking.phone)}</strong></div>
      `;
    }

    // absolute deadline for remaining payment = 24h before slot start (best-effort parse)
    const deadline = formatDeadline(booking);
    if (payDeadline) {
      payDeadline.textContent = deadline
        ? `Hạn trả phần còn lại: ${deadline}`
        : "Hạn trả phần còn lại: trước buổi 24 giờ";
    }

    if (holdSummary) {
      holdSummary.innerHTML = `
        <div class="pay-title"><span>Chi tiết thanh toán</span></div>
        <div><span>Tổng tiền</span><strong>${formatVND(booking.total)}</strong></div>
        <div><span>Cọc 30% (trả ngay)</span><strong>${formatVND(booking.deposit)}</strong></div>
        <div class="is-remaining"><span>Còn lại${deadline ? " — hạn " + deadline : " (trước buổi 24h)"}</span><strong>${formatVND(booking.remaining)}</strong></div>
      `;
    }
    if (payTotal) payTotal.textContent = formatVND(booking.total);
    if (payDeposit) payDeposit.textContent = formatVND(booking.deposit);
    if (payRemaining) payRemaining.textContent = formatVND(booking.remaining);
    if (holdCta) holdCta.textContent = `Thanh toán cọc ${formatVND(booking.deposit)}`;
    startCountdown(booking);
    showStep("hold");
  }

  function formatDeadline(booking) {
    if (booking.sessionDate && booking.sessionStart) {
      const start = new Date(`${booking.sessionDate}T${booking.sessionStart}:00`);
      if (!Number.isNaN(start.getTime())) {
        const due = new Date(start.getTime() - 24 * 3600 * 1000);
        return `${pad(due.getDate())}/${pad(due.getMonth() + 1)} ${pad(due.getHours())}:${pad(due.getMinutes())}`;
      }
    }
    // slot like "Ngày mai · 26/09 · 14:00" or "Thứ Bảy · 05/10 · 09:00"
    const m = /(\d{2})\/(\d{2}).*?(\d{2}:\d{2})/.exec(booking.slot || "");
    if (!m) return "";
    const [, dd, mm, time] = m;
    const year = new Date().getFullYear();
    const start = new Date(`${year}-${mm}-${dd}T${time}:00`);
    if (Number.isNaN(start.getTime())) return "";
    const due = new Date(start.getTime() - 24 * 3600 * 1000);
    return `${pad(due.getDate())}/${pad(due.getMonth() + 1)} ${pad(due.getHours())}:${pad(due.getMinutes())}`;
  }

  function renderPay(booking) {
    current = booking;
    const payDeposit = $("#pay-deposit");
    const payRemaining = $("#pay-remaining");
    const payTotal = $("#pay-total");
    if (payDeposit) payDeposit.textContent = formatVND(booking.deposit);
    if (payRemaining) payRemaining.textContent = formatVND(booking.remaining);
    if (payTotal) payTotal.textContent = formatVND(booking.total);
    showStep("pay");
  }

  function renderDone(booking) {
    clearInterval(countdownTimer);
    countdownTimer = null;
    current = booking;
    const codeEl = $("#done-code");
    const copyBtn = $("#done-copy");
    const doneInfo = $("#done-info");
    const doneMoney = $("#done-money");
    const doneDeadline = $("#done-deadline");
    if (codeEl) codeEl.textContent = booking.code;
    if (copyBtn) copyBtn.dataset.code = booking.code;
    if (doneInfo) {
      doneInfo.innerHTML = `
        <div class="kv"><span>Lớp</span><strong>${escapeHtml(booking.className)}</strong></div>
        <div class="kv"><span>Thời gian</span><strong>${escapeHtml(booking.slot)}</strong></div>
        <div class="kv"><span>${escapeHtml(booking.quantityLabel || "Số người")}</span><strong>${booking.qty}</strong></div>
        <div class="kv"><span>Liên hệ</span><strong>${escapeHtml(booking.name)} · ${escapeHtml(booking.phone)}</strong></div>
      `;
    }
    const deadline = formatDeadline(booking);
    if (doneDeadline) {
      doneDeadline.textContent = deadline
        ? `Trả phần còn lại trước ${deadline}`
        : "Trả phần còn lại trước buổi 24 giờ";
    }
    if (doneMoney) {
      doneMoney.innerHTML = `
        <div class="pay-title"><span>Chi tiết thanh toán</span></div>
        <div><span>Đã cọc</span><strong>${formatVND(booking.deposit)}</strong></div>
        <div class="is-remaining"><span>Còn phải trả${deadline ? " — hạn " + deadline : ""}</span><strong>${formatVND(booking.remaining)}</strong></div>
        <div><span>Tổng</span><strong>${formatVND(booking.total)}</strong></div>
      `;
    }
    showStep("done");
  }

  function renderExpired() {
    clearInterval(countdownTimer);
    countdownTimer = null;
    showStep("expired");
  }

  function renderLost(suggestions) {
    const list = $("#lost-list");
    if (list) {
      list.innerHTML = (suggestions || [])
        .slice(0, 3)
        .map(
          (s) =>
            `<li>${s.className} · ${s.slot} · còn ${s.remain}</li>`
        )
        .join("");
    }
    showStep("lost");
  }

  /* ---------- Shared booking API ---------- */
  window.__sapaBooking = {
    createBooking,
    updateBooking,
    findBooking,
    findByPhone,
    getBookings,
    getSessions,
    getAvailableSessions,
    dayLabel,
    expireIfDue,
    renderHold,
    renderPay,
    renderDone,
    renderExpired,
    renderLost,
    hideFlow,
    showStep,
    formatVND,
    escapeHtml,
    HOLD_MS,
    DEPOSIT_RATE,
    BOOKINGS_KEY: KEY,
  };

  /* ---------- Wire flow buttons (if present) ---------- */
  $("#hold-continue")?.addEventListener("click", () => {
    if (!current) return;
    current = expireIfDue(current) || current;
    if (current.status === "expired") {
      renderExpired();
      return;
    }
    renderPay(current);
  });

  $("#pay-stub")?.addEventListener("click", () => {
    if (!current) return;
    current = expireIfDue(current) || current;
    if (current.status !== "pending") {
      renderExpired();
      return;
    }
    current = updateBooking(current.code, {
      status: "confirmed",
      paidAt: Date.now(),
    });
    renderDone(current);
  });

  $("#done-copy")?.addEventListener("click", (e) => {
    const code = e.currentTarget.dataset.code || "";
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code);
    }
    e.currentTarget.textContent = "Đã chép";
    setTimeout(() => {
      e.currentTarget.textContent = "Sao chép mã";
    }, 1500);
  });

  $("#expired-retry")?.addEventListener("click", () => {
    hideFlow();
    $("#ws-name")?.focus();
  });

  $("#lost-retry")?.addEventListener("click", () => {
    hideFlow();
    $("#ws-name")?.focus();
  });

  $("#hold-restart")?.addEventListener("click", () => {
    if (!confirm("Huỷ giữ chỗ này và nhập lại từ đầu? Suất sẽ được nhả lại.")) return;
    if (current) updateBooking(current.code, { status: "cancelled" });
    hideFlow();
    $("#ws-name")?.focus();
  });

})();
