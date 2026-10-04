(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const KEY = "sapa-studio-v1";
  const bookingApi = window.__sapaBooking;

  const CLASS_META = {
    "ws-co-ban": { name: "Hoa Sáp Cơ Bản", price: 450000 },
    "ws-bo-qua": { name: "Bó Quà Tặng", price: 690000 },
    "ws-gia-dinh": { name: "Workshop Gia Đình", price: 790000 },
    "ws-ky-thuat": { name: "Nặn Cánh Nâng Cao", price: 890000 },
  };

  const formatVND = (n) =>
    Number(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";

  const todayISO = () => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  };

  const plusDays = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };

  const weekday = (iso) => {
    const d = new Date(iso + "T12:00:00");
    return ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()];
  };

  const fmtDay = (iso) => {
    const d = new Date(iso + "T12:00:00");
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  /* ---------- State ---------- */
  const seed = () => ({
    teachers: [
      { id: "g1", name: "Ngọc Mai", phone: "0901 234 567", skill: "Nặn cánh · bó quà" },
      { id: "g2", name: "Hoài An", phone: "0912 345 678", skill: "Lớp gia đình" },
      { id: "g3", name: "Thùy Linh", phone: "0987 654 321", skill: "Nâng cao · phối màu" },
    ],
    sessions: [
      {
        id: "s1",
        classId: "ws-co-ban",
        date: todayISO(),
        start: "09:00",
        end: "11:30",
        cap: 10,
        teacherId: "g1",
        status: "open",
      },
      {
        id: "s2",
        classId: "ws-bo-qua",
        date: todayISO(),
        start: "14:00",
        end: "17:00",
        cap: 8,
        teacherId: "g1",
        status: "open",
      },
      {
        id: "s3",
        classId: "ws-gia-dinh",
        date: plusDays(1),
        start: "09:00",
        end: "11:00",
        cap: 6,
        teacherId: "g2",
        status: "open",
      },
      {
        id: "s4",
        classId: "ws-ky-thuat",
        date: plusDays(4),
        start: "13:00",
        end: "17:00",
        cap: 8,
        teacherId: "g3",
        status: "open",
      },
    ],
    bookings: [
      { id: "b1", sessionId: "s1", name: "Minh Anh", phone: "0902 111 222", qty: 1, deposit: "paid", checkedIn: true, checkedOut: false },
      { id: "b2", sessionId: "s1", name: "Thu Hà", phone: "0903 333 444", qty: 2, deposit: "pending", checkedIn: false, checkedOut: false },
      { id: "b3", sessionId: "s1", name: "Bảo Trân", phone: "0904 555 666", qty: 1, deposit: "paid", checkedIn: true, checkedOut: true },
      { id: "b4", sessionId: "s2", name: "Gia Huy", phone: "0905 777 888", qty: 2, deposit: "paid", checkedIn: false, checkedOut: false },
      { id: "b5", sessionId: "s2", name: "Lan Chi", phone: "0906 999 000", qty: 1, deposit: "pending", checkedIn: false, checkedOut: false },
      { id: "b6", sessionId: "s3", name: "Nhà Bắp", phone: "0907 121 212", qty: 2, deposit: "paid", checkedIn: false, checkedOut: false },
      { id: "b7", sessionId: "s4", name: "Yến Nhi", phone: "0908 343 434", qty: 1, deposit: "paid", checkedIn: false, checkedOut: false },
    ],
  });

  let state;
  try {
    state = JSON.parse(localStorage.getItem(KEY) || "null") || seed();
    if (!state.sessions) state = seed();
  } catch {
    state = seed();
  }

  const save = () => localStorage.setItem(KEY, JSON.stringify(state));

  /* ---------- Toast ---------- */
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.hidden = false;
    requestAnimationFrame(() => toastEl.classList.add("is-on"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.classList.remove("is-on");
      setTimeout(() => {
        toastEl.hidden = true;
      }, 280);
    }, 2200);
  }

  /* ---------- Helpers ---------- */
  const bookingsOf = (sid) => state.bookings.filter((b) => b.sessionId === sid);
  const seatCount = (sid) =>
    bookingsOf(sid).reduce((n, b) => n + (b.qty || 1), 0);
  const teacherName = (id) =>
    state.teachers.find((t) => t.id === id)?.name || "—";

  function sessionTotals(sid) {
    const list = bookingsOf(sid);
    const meta = CLASS_META[
      state.sessions.find((s) => s.id === sid)?.classId
    ] || { price: 0 };
    const people = list.reduce((n, b) => n + b.qty, 0);
    const total = people * meta.price;
    const deposited = list
      .filter((b) => b.deposit === "paid")
      .reduce((n, b) => n + b.qty * meta.price * 0.3, 0);
    return { people, total, deposited, pending: list.filter((b) => b.deposit !== "paid").length };
  }

  /* ---------- KPI ---------- */
  function renderKPI() {
    const t = todayISO();
    const today = state.sessions.filter((s) => s.date === t);
    const students = state.bookings.reduce((n, b) => n + b.qty, 0);
    const pending = state.bookings.filter((b) => b.deposit !== "paid").length;
    const checkins = state.bookings.filter((b) => b.checkedIn).length;
    $("#kpi-today").textContent = String(today.length);
    $("#kpi-students").textContent = String(students);
    $("#kpi-deposit").textContent = String(pending);
    $("#kpi-checkin").textContent = String(checkins);
  }

  /* ---------- Sessions ---------- */
  let filter = "all";

  function renderSessions() {
    const root = $("#session-list");
    if (!root) return;
    const sorted = [...state.sessions].sort((a, b) =>
      (a.date + a.start).localeCompare(b.date + b.start)
    );
    root.innerHTML = "";
    sorted.forEach((s) => {
      const meta = CLASS_META[s.classId] || { name: s.classId };
      const taken = seatCount(s.id);
      const full = taken >= s.cap;
      const isToday = s.date === todayISO();
      const show =
        filter === "all" ||
        (filter === "today" && isToday) ||
        (filter === "open" && !full) ||
        (filter === "full" && full);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "session-card" + (show ? "" : " is-hidden");
      btn.dataset.id = s.id;
      btn.innerHTML = `
        <div class="session-date">
          <strong>${fmtDay(s.date)}</strong>
          <span>${weekday(s.date)} · ${s.start}–${s.end}</span>
        </div>
        <div>
          <div class="session-title">${meta.name}</div>
          <div class="session-meta">GV · ${teacherName(s.teacherId)}</div>
        </div>
        <div class="session-funnel">
          <span class="pill ${full ? "pill--warn" : "pill--ok"}">${taken}/${s.cap} slot</span>
          ${isToday ? '<span class="pill pill--muted">Hôm nay</span>' : ""}
        </div>
        <div class="session-meta">Cọc 30% · ${formatVND(meta.price)}</div>
        <div class="session-meta">${bookingsOf(s.id).length} đơn</div>
        <span class="btn-mini" aria-hidden="true">Chi tiết</span>
      `;
      btn.addEventListener("click", () => openSession(s.id));
      root.appendChild(btn);
    });
    if (!root.querySelector(".session-card:not(.is-hidden)")) {
      root.innerHTML = `<p class="empty-note">Không có ca phù hợp bộ lọc.</p>`;
    }
  }

  function renderOnlineBookings() {
    const root = $("#online-booking-list");
    if (!root || !bookingApi) return;
    const statusLabels = {
      pending: "Chờ cọc",
      confirmed: "Đã xác nhận",
      expired: "Hết hạn",
      cancelled: "Đã huỷ",
      attended: "Đã tham dự",
      no_show: "Không đến",
    };
    const bookings = bookingApi
      .getBookings()
      .sort((a, b) => b.createdAt - a.createdAt);

    if (!bookings.length) {
      root.innerHTML = '<p class="empty-note">Chưa có đặt chỗ online trong prototype.</p>';
      return;
    }

    const safe = bookingApi.escapeHtml;
    root.innerHTML = bookings.map((booking) => {
      const canMarkOutcome = booking.status === "confirmed";
      const quantityLabel = booking.quantityLabel || "Số người";
      return `
        <article class="roster-item">
          <div>
            <h3>${safe(booking.className)} · ${safe(booking.slot)}</h3>
            <p>${safe(booking.name)} · ${booking.qty} ${safe(quantityLabel)} · ${safe(booking.phone)}</p>
            <span class="online-booking-status">${safe(statusLabels[booking.status] || booking.status)}</span>
            <p class="online-booking-note">Mã ${safe(booking.code)} · Đã cọc ${bookingApi.formatVND(booking.deposit)} · Còn lại ${bookingApi.formatVND(booking.remaining)}</p>
          </div>
          ${canMarkOutcome ? `
            <div class="roster-actions">
              <button type="button" class="btn-mini" data-outcome="attended" data-code="${safe(booking.code)}">Đã tham dự</button>
              <button type="button" class="btn-mini" data-outcome="no_show" data-code="${safe(booking.code)}">Không đến</button>
            </div>
          ` : ""}
        </article>
      `;
    }).join("");
  }

  $("#online-booking-list")?.addEventListener("click", (e) => {
    const button = e.target.closest("[data-outcome]");
    if (!button || !bookingApi) return;
    const booking = bookingApi.getBookings().find((item) => item.code === button.dataset.code);
    if (!booking || booking.status !== "confirmed") return;
    const status = button.dataset.outcome;
    if (!["attended", "no_show"].includes(status)) return;
    bookingApi.updateBooking(booking.code, {
      status,
      ...(status === "attended" ? { attendedAt: Date.now() } : { noShowAt: Date.now() }),
    });
    renderOnlineBookings();
    toast(status === "attended" ? "Đã ghi nhận tham dự" : "Đã ghi nhận không đến");
  });

  window.addEventListener("sapa:booking-change", renderOnlineBookings);
  window.addEventListener("storage", (e) => {
    if (e.key === bookingApi?.BOOKINGS_KEY) renderOnlineBookings();
  });

  /* ---------- Teachers ---------- */
  function renderTeachers() {
    const root = $("#teacher-grid");
    if (!root) return;
    root.innerHTML = "";
    state.teachers.forEach((t) => {
      const loads = state.sessions.filter((s) => s.teacherId === t.id).length;
      const el = document.createElement("article");
      el.className = "teacher-card";
      el.innerHTML = `
        <div class="teacher-card__top">
          <div class="avatar">${(t.name || "?").trim().charAt(0)}</div>
          <div>
            <h3>${t.name}</h3>
            <p>${t.phone}</p>
          </div>
        </div>
        <p>${t.skill || "—"}</p>
        <p style="margin-top:0.65rem"><span class="pill pill--muted">${loads} ca phụ trách</span></p>
      `;
      root.appendChild(el);
    });
  }

  function fillTeacherSelect() {
    const sel = $("#c-teacher");
    if (!sel) return;
    sel.innerHTML = state.teachers
      .map((t) => `<option value="${t.id}">${t.name}</option>`)
      .join("");
  }

  /* ---------- Session drawer ---------- */
  let openId = null;

  function openSession(id) {
    openId = id;
    const s = state.sessions.find((x) => x.id === id);
    if (!s) return;
    const meta = CLASS_META[s.classId] || { name: s.classId, price: 0 };
    $("#drawer-title").textContent = `${meta.name} · ${weekday(s.date)} ${fmtDay(s.date)} · ${s.start}`;
    renderRoster();
    const overlay = $("#overlay");
    const drawer = $("#session-drawer");
    overlay.hidden = false;
    drawer.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    $("#drawer-close")?.focus();
    document.body.style.overflow = "hidden";
    if (window.lenis) window.lenis.stop?.();
  }

  function closeDrawer() {
    const drawer = $("#session-drawer");
    const overlay = $("#overlay");
    drawer?.classList.remove("is-open");
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = "";
    openId = null;
  }

  function renderRoster() {
    const body = $("#drawer-body");
    if (!body || !openId) return;
    const list = bookingsOf(openId);
    const money = sessionTotals(openId);
    $("#drawer-money").textContent = `${formatVND(money.deposited)} / ${formatVND(money.total)}`;

    if (!list.length) {
      body.innerHTML = `<p class="empty-note">Chưa có học viên. Dùng nút bên dưới để thêm tại quầy.</p>`;
      return;
    }

    body.innerHTML = `<div class="roster">${list
      .map((b) => {
        const cls = [
          "roster-item",
          b.checkedIn ? "is-in" : "",
          b.checkedOut ? "is-done" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return `
        <div class="${cls}" data-bid="${b.id}">
          <div>
            <h3>${b.name} · ${b.qty} người</h3>
            <p>${b.phone} · Cọc: <strong>${b.deposit === "paid" ? "Đã cọc" : "Chờ cọc"}</strong>
            ${b.checkedIn ? " · Đã check-in" : ""}
            ${b.checkedOut ? " · Đã check-out" : ""}</p>
          </div>
          <div class="roster-actions">
            <button type="button" class="btn-mini" data-act="deposit">${b.deposit === "paid" ? "Hủy cọc" : "Xác nhận cọc"}</button>
            <button type="button" class="btn-mini" data-act="in" ${b.checkedIn ? "disabled" : ""}>Check-in</button>
            <button type="button" class="btn-mini" data-act="out" ${!b.checkedIn || b.checkedOut ? "disabled" : ""}>Check-out</button>
          </div>
        </div>`;
      })
      .join("")}</div>`;
  }

  $("#drawer-body")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn || !openId) return;
    const row = btn.closest("[data-bid]");
    const booking = state.bookings.find((b) => b.id === row?.dataset.bid);
    if (!booking) return;
    const act = btn.dataset.act;
    if (act === "deposit") {
      booking.deposit = booking.deposit === "paid" ? "pending" : "paid";
      toast(booking.deposit === "paid" ? "Đã xác nhận cọc" : "Đã chuyển về chờ cọc");
    }
    if (act === "in") {
      booking.checkedIn = true;
      toast(`Đã check-in ${booking.name}`);
    }
    if (act === "out") {
      booking.checkedOut = true;
      toast(`Đã check-out ${booking.name}`);
    }
    save();
    renderRoster();
    renderKPI();
    renderSessions();
  });

  $("#drawer-close")?.addEventListener("click", closeDrawer);
  $("#overlay")?.addEventListener("click", closeDrawer);

  $("#add-booking")?.addEventListener("click", () => {
    if (!openId) return;
    const name = prompt("Tên học viên:");
    if (!name) return;
    const phone = prompt("SĐT:") || "—";
    const qty = Number(prompt("Số người:", "1") || 1);
    state.bookings.push({
      id: "b" + Date.now(),
      sessionId: openId,
      name,
      phone,
      qty: qty || 1,
      deposit: "pending",
      checkedIn: false,
      checkedOut: false,
    });
    save();
    renderRoster();
    renderKPI();
    renderSessions();
    toast("Đã thêm học viên");
  });

  /* ---------- Filters ---------- */
  $$(".chip[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$(".chip[data-filter]").forEach((c) => c.classList.remove("is-on"));
      chip.classList.add("is-on");
      filter = chip.dataset.filter || "all";
      renderSessions();
    });
  });

  /* ---------- Create session ---------- */
  const dateInput = $("#c-date");
  if (dateInput) dateInput.value = plusDays(2);

  $("#create-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const classId = $("#c-class").value;
    const date = $("#c-date").value;
    const start = $("#c-start").value;
    const end = $("#c-end").value;
    const cap = Number($("#c-cap").value || 10);
    const teacherId = $("#c-teacher").value;
    const msg = $("#create-msg");
    if (!date || !start || !end) {
      if (msg) {
        msg.textContent = "Vui lòng chọn ngày và giờ.";
        msg.className = "form-msg is-err";
      }
      return;
    }
    state.sessions.push({
      id: "s" + Date.now(),
      classId,
      date,
      start,
      end,
      cap,
      teacherId,
      status: "open",
    });
    save();
    renderSessions();
    renderKPI();
    if (msg) {
      msg.textContent = `Đã tạo ca ${CLASS_META[classId].name} · ${weekday(date)} ${fmtDay(date)} · ${start}`;
      msg.className = "form-msg is-ok";
    }
    toast("Đã tạo ca học");
  });

  $("#open-create")?.addEventListener("click", () => {
    $("#create")?.scrollIntoView({ behavior: "smooth" });
  });

  /* ---------- Teacher modal ---------- */
  const teacherModal = $("#teacher-modal");
  $("#add-teacher")?.addEventListener("click", () => {
    teacherModal.hidden = false;
    document.body.style.overflow = "hidden";
    $("#t-name")?.focus();
  });
  $("#teacher-close")?.addEventListener("click", () => {
    teacherModal.hidden = true;
    document.body.style.overflow = "";
  });
  teacherModal?.addEventListener("click", (e) => {
    if (e.target === teacherModal) {
      teacherModal.hidden = true;
      document.body.style.overflow = "";
    }
  });

  $("#teacher-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#t-name").value.trim();
    const phone = $("#t-phone").value.trim();
    const skill = $("#t-skill").value.trim();
    const msg = $("#teacher-msg");
    if (name.length < 2) {
      if (msg) {
        msg.textContent = "Nhập họ tên giảng viên.";
        msg.className = "form-msg is-err";
      }
      return;
    }
    state.teachers.push({
      id: "g" + Date.now(),
      name,
      phone: phone || "—",
      skill,
    });
    save();
    renderTeachers();
    fillTeacherSelect();
    teacherModal.hidden = true;
    document.body.style.overflow = "";
    e.target.reset();
    toast("Đã thêm giảng viên");
  });

  /* ---------- Mobile menu (light) ---------- */
  const burger = $("#burger");
  const mobileMenu = $("#mobile-menu");
  burger?.addEventListener("click", () => {
    const open = !mobileMenu.hasAttribute("hidden");
    if (open) {
      mobileMenu.setAttribute("hidden", "");
      burger.setAttribute("aria-expanded", "false");
    } else {
      mobileMenu.removeAttribute("hidden");
      burger.setAttribute("aria-expanded", "true");
    }
  });
  mobileMenu?.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      mobileMenu.setAttribute("hidden", "");
      burger?.setAttribute("aria-expanded", "false");
    })
  );

  /* ---------- Init ---------- */
  renderKPI();
  renderSessions();
  renderTeachers();
  fillTeacherSelect();
  renderOnlineBookings();
})();
