(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const classSelect = $("#ws-class");
  const slotSelect = $("#ws-slot");
  const form = $("#ws-form");
  const msg = $("#ws-msg");

  const className = {
    "ws-co-ban": "Hoa Sáp Cơ Bản",
    "ws-bo-qua": "Bó Quà Tặng",
    "ws-gia-dinh": "Workshop Gia Đình",
    "ws-ky-thuat": "Nặn Cánh Nâng Cao",
  };

  const priceOf = {
    "ws-co-ban": 450000,
    "ws-bo-qua": 690000,
    "ws-gia-dinh": 790000,
    "ws-ky-thuat": 890000,
  };

  const bookingApi = window.__sapaBooking;
  let sessions = bookingApi?.getSessions() || [];
  const pad = (n) => String(n).padStart(2, "0");
  const addDays = (base, count) => {
    const date = new Date(base);
    date.setDate(date.getDate() + count);
    return date;
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let sFilter = "all";
  let weekOffset = 0;
  let visibleDays = 14; // default 2 weeks
  let selectedId = null;

  const fmtDay = (dateStr) => bookingApi?.dayLabel(dateStr) || dateStr;
  const refreshSessions = () => {
    if (!bookingApi) return;
    const simulatedFull = new Set(
      sessions.filter((session) => session.demoFull).map((session) => session.key)
    );
    sessions = bookingApi.getSessions().map((session) =>
      simulatedFull.has(session.key)
        ? { ...session, taken: session.cap, remaining: 0, demoFull: true }
        : session
    );
  };

  const left = (s) => Math.max(0, s.cap - s.taken);
  const isPast = (s) => {
    const d = new Date(`${s.date}T${s.start}:00`);
    return d.getTime() < Date.now() - 2 * 3600 * 1000;
  };

  /* ---------- Slot select (form) ---------- */
  function sessionsForClass(classId) {
    refreshSessions();
    return sessions
      .filter((s) => s.classId === classId && !isPast(s) && left(s) > 0)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  }

  function slotValue(s) {
    return `${fmtDay(s.date)} · ${s.start}`;
  }

  function fillSlots(classId, keepValue) {
    if (!slotSelect) return;
    const list = sessionsForClass(classId);
    if (!list.length) {
      slotSelect.innerHTML = `<option value="">— Hết slot gần đây —</option>`;
      return;
    }
    slotSelect.innerHTML = list
      .map(
      (s) =>
          `<option value="${slotValue(s)}">${fmtDay(s.date)} · ${s.start}–${s.end} · còn ${left(s)}/${s.cap} ${s.classId === "ws-gia-dinh" ? "cặp" : "chỗ"}</option>`
      )
      .join("");
    if (keepValue) {
      const hit = list.find((s) => slotValue(s) === keepValue);
      if (hit) slotSelect.value = keepValue;
    }
  }

  classSelect?.addEventListener("change", () => {
    fillSlots(classSelect.value);
    updateQuantityLabel();
    updateBookingSummary();
  });
  slotSelect?.addEventListener("change", updateBookingSummary);
  fillSlots(classSelect?.value || "ws-co-ban");

  function updateQuantityLabel() {
    const label = $("#ws-qty-label");
    if (!label) return;
    label.textContent = classSelect?.value === "ws-gia-dinh"
      ? "Số cặp (1 cặp gồm 1 người lớn + 1 bé)"
      : "Số người (tối đa 4)";
  }
  updateQuantityLabel();

  function updateBookingSummary() {
    const el = $("#booking-summary");
    if (!el) return;
    const classId = classSelect?.value;
    const slot = slotSelect?.value;
    if (!classId || !slot) {
      el.textContent = "";
      return;
    }
    el.textContent = `Bạn đang đặt: ${className[classId]} · ${slot}`;
    el.hidden = false;
  }

  function selectSession(id) {
    selectedId = id;
    renderSchedule();
    const s = sessions.find((x) => x.id === id);
    if (!s) return;
    if (classSelect && className[s.classId]) classSelect.value = s.classId;
    fillSlots(s.classId, slotValue(s));
    updateBookingSummary();
    const book = $("#book");
    if (book) {
      const lenis = window.__sapaLenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(book, { offset: -12, duration: 1.25 });
      } else {
        book.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    $("#ws-name")?.focus({ preventScroll: true });
  }

  /* ---------- Render schedule board ---------- */
  function weekStart(offset) {
    const d = new Date(today);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday start
    d.setDate(d.getDate() + diff + offset * 7);
    return d;
  }

  function renderSchedule() {
    const board = $("#schedule-board");
    const live = $("#schedule-live");
    const updated = $("#schedule-updated");
    if (!board) return;
    refreshSessions();

    if (updated) {
      updated.textContent = "Lịch cập nhật hôm nay";
    }

    const w0 = weekStart(weekOffset);
    const w1 = addDays(w0, visibleDays - 1);
    const label = $("#week-label");
    if (label) {
      label.textContent = `${pad(w0.getDate())}/${pad(w0.getMonth() + 1)} – ${pad(w1.getDate())}/${pad(w1.getMonth() + 1)}`;
    }

    const inRange = (s) => {
      const d = new Date(s.date + "T12:00:00");
      return d >= w0 && d <= w1 && !isPast(s);
    };

    let list = sessions.filter(inRange);
    if (sFilter !== "all") list = list.filter((s) => s.classId === sFilter);
    list.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

    const totalLabel = $("#schedule-count");
    const openCount = list.filter((session) => left(session) > 0).length;
    if (totalLabel) {
      totalLabel.textContent = `${openCount} buổi còn chỗ trong ${Math.round(visibleDays / 7)} tuần tới`;
    }

    if (live) {
      live.textContent = `Còn ${openCount} buổi có chỗ trong khoảng đã chọn.`;
    }

    if (!list.length) {
      board.innerHTML = `
        <div class="empty-state">
          <p class="empty-note">Khoảng này chưa mở lịch.</p>
          <p class="empty-note">Tháng tới chưa mở — để lại email bên dưới để nhận thông báo.</p>
        </div>`;
      renderStickyBar();
      return;
    }

    const groups = new Map();
    list.forEach((s) => {
      if (!groups.has(s.date)) groups.set(s.date, []);
      groups.get(s.date).push(s);
    });

    board.innerHTML = Array.from(groups.entries())
      .map(([date, items]) => {
        const rows = items
          .map((s) => {
            const remain = left(s);
            const full = remain <= 0;
            const low = remain > 0 && remain <= 3;
            const remainPct = Math.round((remain / s.cap) * 100);
            const status = full
              ? `<span class="slot-tag slot-tag--full">Hết chỗ</span>`
              : low
                ? `<span class="slot-tag slot-tag--low">Sắp hết</span>`
                : "";
            const ratio = full ? 0 : remain;
            const unit = s.classId === "ws-gia-dinh" ? "cặp" : "chỗ";
            const action = full
              ? `<button type="button" class="linkish" data-wait="${s.id}">Danh sách chờ</button>`
              : `<button type="button" class="btn-mini ${selectedId === s.id ? "is-selected" : ""}" data-book="${s.classId}" data-slot="${slotValue(s)}" data-sid="${s.id}">${selectedId === s.id ? "Đã chọn" : "Giữ chỗ"}</button>`;
            return `
            <article class="slot-row ${full ? "is-full" : ""} ${selectedId === s.id ? "is-selected" : ""}" data-sid="${s.id}">
              <p class="slot-row__time">${s.start}</p>
              <div class="slot-row__meta">
                <p class="slot-row__class">${className[s.classId]}</p>
                <p class="slot-row__sub">${s.start}–${s.end} ${status ? "· " : ""}${status}</p>
              </div>
              <div class="slot-row__meter">
                <span class="slot-row__ratio">${ratio}/${s.cap} ${unit}</span>
                <span class="meter" aria-hidden="true"><i style="width:${remainPct}%"></i></span>
              </div>
              <div class="slot-row__action">${action}</div>
            </article>`;
          })
          .join("");
        return `
          <section class="day-group" aria-label="${fmtDay(date)}">
            <h3 class="day-group__title">${fmtDay(date)}</h3>
            <div class="day-group__list">${rows}</div>
          </section>`;
      })
      .join("");

    renderStickyBar();
  }

  function renderStickyBar() {
    let bar = $("#sticky-book");
    const s = sessions.find((x) => x.id === selectedId);
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "sticky-book";
      bar.className = "sticky-book";
      bar.hidden = true;
      document.body.appendChild(bar);
    }
    if (!s) {
      bar.hidden = true;
      document.body.classList.remove("has-sticky-book");
      return;
    }
    const remain = left(s);
    bar.hidden = false;
    document.body.classList.add("has-sticky-book");
    bar.innerHTML = `
      <div>
        <strong>${className[s.classId]}</strong>
        <span>${fmtDay(s.date)} · ${s.start}–${s.end} · còn ${remain}/${s.cap} ${s.classId === "ws-gia-dinh" ? "cặp" : "chỗ"}</span>
      </div>
      <button type="button" class="btn btn--dark" id="sticky-continue">Tiếp tục đặt</button>
    `;
    $("#sticky-continue")?.addEventListener("click", () => {
      const book = $("#book");
      if (book) {
        const lenis = window.__sapaLenis;
        if (lenis && typeof lenis.scrollTo === "function") {
          lenis.scrollTo(book, { offset: -12, duration: 1.25 });
        } else {
          book.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      $("#ws-name")?.focus({ preventScroll: true });
    });
  }

  /* schedule interactions */
  const WAITLIST_KEY = "sapa-waitlist-v1";
  let waitlistSessionId = null;

  $("#schedule-board")?.addEventListener("click", (e) => {
    const wait = e.target.closest("[data-wait]");
    if (wait) {
      const session = sessions.find((item) => item.id === wait.dataset.wait);
      if (!session) return;
      waitlistSessionId = session.id;
      $("#waitlist-slot").textContent = `${className[session.classId]} · ${fmtDay(session.date)} · ${session.start}–${session.end}`;
      $("#waitlist-msg").textContent = "";
      $("#waitlist-panel").hidden = false;
      $("#waitlist-panel").scrollIntoView({ behavior: "smooth", block: "center" });
      $("#waitlist-name")?.focus({ preventScroll: true });
      return;
    }
    const bookBtn = e.target.closest("[data-book]");
    if (bookBtn) {
      const id = bookBtn.getAttribute("data-sid");
      if (id) selectedId = id;
      const classId = bookBtn.getAttribute("data-book");
      const slot = bookBtn.getAttribute("data-slot");
      if (classSelect && classId && className[classId]) {
        classSelect.value = classId;
        fillSlots(classId, slot);
      }
      updateBookingSummary();
      renderSchedule();
      const book = $("#book");
      if (book) {
        const lenis = window.__sapaLenis;
        if (lenis && typeof lenis.scrollTo === "function") {
          lenis.scrollTo(book, { offset: -12, duration: 1.25 });
        } else {
          book.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      $("#ws-name")?.focus({ preventScroll: true });
    }
  });

  $("#waitlist-close")?.addEventListener("click", () => {
    $("#waitlist-panel").hidden = true;
    waitlistSessionId = null;
  });

  $("#waitlist-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#waitlist-name")?.value.trim() || "";
    const phone = $("#waitlist-phone")?.value.trim() || "";
    const normalizedPhone = phone.replace(/\s/g, "");
    const message = $("#waitlist-msg");
    const session = sessions.find((item) => item.id === waitlistSessionId);

    if (!session) {
      if (message) {
        message.textContent = "Buổi này không còn trong lịch. Vui lòng chọn buổi khác.";
        message.className = "form-msg is-err";
      }
      return;
    }
    if (name.length < 2) {
      if (message) {
        message.textContent = "Vui lòng nhập họ tên.";
        message.className = "form-msg is-err";
      }
      $("#waitlist-name")?.focus();
      return;
    }
    if (!/^(0|\+84)(\d{9,10})$/.test(normalizedPhone)) {
      if (message) {
        message.textContent = "Số điện thoại chưa hợp lệ (VD: 09xx xxx xxx).";
        message.className = "form-msg is-err";
      }
      $("#waitlist-phone")?.focus();
      return;
    }
    refreshSessions();
    const latest = sessions.find((item) => item.id === waitlistSessionId);
    if (!latest || left(latest) > 0) {
      if (message) {
        message.textContent = "Buổi này vừa có chỗ. Hãy chọn lịch còn chỗ ở danh sách.";
        message.className = "form-msg is-err";
      }
      renderSchedule();
      return;
    }

    let waitlist = [];
    try {
      waitlist = JSON.parse(localStorage.getItem(WAITLIST_KEY) || "[]");
      if (!Array.isArray(waitlist)) waitlist = [];
    } catch {
      waitlist = [];
    }
    const key = latest.key || `${latest.classId}|${latest.date}|${latest.start}`;
    if (waitlist.some((entry) => entry.sessionKey === key && entry.phone === normalizedPhone)) {
      if (message) {
        message.textContent = "Số điện thoại này đã có trong danh sách chờ của buổi đó.";
        message.className = "form-msg is-err";
      }
      return;
    }
    waitlist.push({
      id: `WL-${Date.now()}`,
      sessionKey: key,
      classId: latest.classId,
      slot: `${fmtDay(latest.date)} · ${latest.start}`,
      name,
      phone: normalizedPhone,
      createdAt: Date.now(),
    });
    try {
      localStorage.setItem(WAITLIST_KEY, JSON.stringify(waitlist));
      if (message) {
        message.textContent = "Đã lưu đăng ký chờ trong prototype. Chưa có thông báo thật.";
        message.className = "form-msg is-ok";
      }
      e.currentTarget.reset();
    } catch {
      if (message) {
        message.textContent = "Không lưu được đăng ký chờ trên trình duyệt này.";
        message.className = "form-msg is-err";
      }
    }
  });

  window.addEventListener("sapa:booking-change", () => {
    renderSchedule();
    fillSlots(classSelect?.value || "ws-co-ban", slotSelect?.value);
  });
  window.addEventListener("storage", (e) => {
    if (e.key !== bookingApi?.BOOKINGS_KEY) return;
    renderSchedule();
    fillSlots(classSelect?.value || "ws-co-ban", slotSelect?.value);
  });
  window.addEventListener("pageshow", () => {
    renderSchedule();
    fillSlots(classSelect?.value || "ws-co-ban", slotSelect?.value);
  });

  $$("#schedule-filters [data-sfilter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      $$("#schedule-filters [data-sfilter]").forEach((c) =>
        c.classList.remove("is-on")
      );
      chip.classList.add("is-on");
      sFilter = chip.dataset.sfilter || "all";
      renderSchedule();
    });
  });

  $("#week-prev")?.addEventListener("click", () => {
    weekOffset -= 1;
    renderSchedule();
  });
  $("#week-next")?.addEventListener("click", () => {
    weekOffset += 1;
    renderSchedule();
  });
  $("#schedule-more")?.addEventListener("click", () => {
    visibleDays = visibleDays >= 28 ? 14 : visibleDays + 7;
    $("#schedule-more").textContent = visibleDays >= 28 ? "Thu gọn" : "Xem thêm";
    renderSchedule();
  });

  $("#schedule-ics")?.addEventListener("click", () => {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//SAPA//Workshop//VI",
    ];
    sessions
      .filter((s) => !isPast(s) && left(s) > 0)
      .forEach((s) => {
        const stamp = s.date.replace(/-/g, "");
        const st = s.start.replace(":", "") + "00";
        const en = s.end.replace(":", "") + "00";
        lines.push(
          "BEGIN:VEVENT",
          `UID:${s.id}@sapa.studio`,
          `DTSTART:${stamp}T${st}`,
          `DTEND:${stamp}T${en}`,
          `SUMMARY:${className[s.classId]} — SÁPA Studio`,
          "LOCATION:SÁPA Studio Hà Nội",
          "END:VEVENT"
        );
      });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\r\n")], {
      type: "text/calendar;charset=utf-8",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sapa-workshop.ics";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Đã tải lịch .ics");
  });

  /* ---------- Toast (local) ---------- */
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

  /* ---------- FAQ accordion ---------- */
  $$("#faq-acc .pdp-acc-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".pdp-acc-item");
      const open = item.classList.contains("is-open");
      $$("#faq-acc .pdp-acc-item").forEach((el) => {
        el.classList.remove("is-open");
        el.querySelector(".pdp-acc-btn")?.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- Booking form → state machine ---------- */
  const phoneOk = (v) => /^(0|\+84)(\d{9,10})$/.test(v.replace(/\s/g, ""));

  // mark form open time for bot heuristic
  const openedAt = $("#ws-opened-at");
  if (openedAt) openedAt.value = String(Date.now());

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const api = window.__sapaBooking;

    // honeypot
    const hp = $("#ws-website");
    if (hp && hp.value) {
      if (msg) {
        msg.textContent = "Gửi không thành công.";
        msg.className = "form-msg is-err";
      }
      return;
    }

    // fill time (too fast = bot)
    const opened = Number($("#ws-opened-at")?.value || 0);
    if (opened && Date.now() - opened < 2500) {
      if (msg) {
        msg.textContent = "Bạn vui lòng kiểm tra lại thông tin rồi gửi lại.";
        msg.className = "form-msg is-err";
      }
      return;
    }

    const name = $("#ws-name")?.value.trim() || "";
    const phone = $("#ws-phone")?.value.trim() || "";
    const email = $("#ws-email")?.value.trim() || "";
    const qty = Number($("#ws-qty")?.value || 1);
    const classId = classSelect?.value || "ws-co-ban";
    const slot = slotSelect?.value || "";

    if (name.length < 2) {
      if (msg) {
        msg.textContent = "Vui lòng nhập họ tên.";
        msg.className = "form-msg is-err";
      }
      $("#ws-name")?.focus();
      return;
    }
    if (!phoneOk(phone)) {
      if (msg) {
        msg.textContent = "Số điện thoại chưa hợp lệ (VD: 09xx xxx xxx).";
        msg.className = "form-msg is-err";
      }
      $("#ws-phone")?.focus();
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (msg) {
        msg.textContent = "Email chưa đúng định dạng.";
        msg.className = "form-msg is-err";
      }
      $("#ws-email")?.focus();
      return;
    }

    if (!Number.isInteger(qty) || qty < 1 || qty > 4) {
      if (msg) {
        msg.textContent = "Số lượng phải là số nguyên từ 1 đến 4.";
        msg.className = "form-msg is-err";
      }
      $("#ws-qty")?.focus();
      return;
    }

    if (!slot) {
      if (msg) {
        msg.textContent = "Lớp này hiện chưa có buổi còn chỗ. Vui lòng chọn buổi khác.";
        msg.className = "form-msg is-err";
      }
      slotSelect?.focus();
      return;
    }

    refreshSessions();
    const match = sessions.find(
      (session) => session.classId === classId && slotValue(session) === slot
    );
    if (!match) {
      if (msg) {
        msg.textContent = "Buổi này không còn trong lịch. Vui lòng chọn một buổi còn chỗ.";
        msg.className = "form-msg is-err";
      }
      fillSlots(classId);
      slotSelect?.focus();
      return;
    }

    // one phone per session
    const phoneKey = phone.replace(/\s/g, "");
    const dup = (window.__sapaBooking?.findByPhone(phoneKey) || []).some(
      (booking) =>
        (booking.sessionKey === match.key || booking.slot === slot) &&
        ["pending", "confirmed"].includes(booking.status)
    );
    if (dup) {
      if (msg) {
        msg.textContent = "Số điện thoại này đã giữ chỗ cho buổi này rồi.";
        msg.className = "form-msg is-err";
      }
      return;
    }

    // simulate someone else took the last seats while filling
    if (match && left(match) > 0 && Math.random() < 0.08 && left(match) <= 2) {
      match.taken = match.cap;
      match.remaining = 0;
      match.demoFull = true;
      renderSchedule();
      fillSlots(classId);
      if (api) {
        const suggestions = sessions
          .filter((s) => left(s) > 0 && !isPast(s))
          .sort((a, b) => left(b) - left(a))
          .map((s) => ({
            className: className[s.classId],
            slot: `${fmtDay(s.date)} · ${s.start}`,
            remain: `${left(s)}/${s.cap}`,
          }));
        api.renderLost(suggestions);
      }
      return;
    }

    if (left(match) < qty) {
      if (msg) {
        const unit = classId === "ws-gia-dinh" ? "cặp" : "người";
        msg.textContent = `Buổi này chỉ còn ${left(match)} ${unit} — vui lòng giảm số lượng hoặc chọn lịch khác.`;
        msg.className = "form-msg is-err";
      }
      fillSlots(classId);
      return;
    }

    const total = (priceOf[classId] || 0) * qty;
    const booking = api?.createBooking({
      classId,
      className: className[classId] || "Workshop",
      slot,
      sessionKey: match.key,
      sessionDate: match.date,
      sessionStart: match.start,
      name,
      phone,
      email,
      qty,
      quantityLabel: classId === "ws-gia-dinh" ? "Số cặp" : "Số người",
      total,
    });

    renderSchedule();
    fillSlots(classId, slot);

    if (msg) {
      msg.textContent = "";
      msg.className = "form-msg";
    }

    if (booking && api) {
      api.renderHold(booking);
    }

    updateBookingSummary();
    if (openedAt) openedAt.value = String(Date.now());
  });

  /* hero buttons that still use data-book without sid */
  $$("[data-book]").forEach((btn) => {
    if (btn.closest("#schedule-board")) return;
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-book");
      const slot = btn.getAttribute("data-slot");
      if (classSelect && id && className[id]) {
        classSelect.value = id;
        fillSlots(id, slot);
      }
      updateBookingSummary();
      const book = $("#book");
      if (book) {
        const lenis = window.__sapaLenis;
        if (lenis && typeof lenis.scrollTo === "function") {
          lenis.scrollTo(book, { offset: -12, duration: 1.25 });
        } else {
          book.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
      $("#ws-name")?.focus({ preventScroll: true });
    });
  });

  /* ---------- Workshop detail modal ---------- */
  const WS_INFO = {
    "ws-co-ban": {
      tag: "Cơ bản",
      title: "Hoa Sáp Cơ Bản",
      img: "assets/prod-kit.webp",
      lead: "Làm quen sáp ong & sáp đậu nành, nặn 3 bông hoa đầu tiên và cắm vào lọ mini mang về. Không cần khéo tay — giáo viên nặn mẫu từng bước.",
      meta: [
        ["Thời lượng", "2.5 giờ"],
        ["Giá", "450.000₫ / người"],
        ["Sức chứa", "8–10 người"],
        ["Mang về", "3 bông + lọ mini"],
      ],
      goals: [
        "Làm phẳng — cắt — nặn cánh cơ bản",
        "Gắn nhịp và cành kẽm",
        "Cắm lọ mini hài hoà",
        "Mẹo bảo quản hoa sáp tại nhà",
      ],
      includes: [
        "Tất cả sáp, mold, kẽm, kéo, chỉ",
        "Tạp dề dùng tại xưởng",
        "Trà & bánh nhẹ",
        "−10% cửa hàng trong 7 ngày",
      ],
      forWho: "Người mới 100%, cặp đôi, nhóm bạn muốn thử 1 buổi chiều êm.",
    },
    "ws-bo-qua": {
      tag: "Phổ biến",
      title: "Bó Quà Tặng",
      img: "assets/prod-bouquet.webp",
      lead: "Nặn 7–9 bông, học kỹ thuật gói kraft Ý và thắt nơ linen. Bạn rời xưởng với một bó ready-to-gift — có thể tặng ngay.",
      meta: [
        ["Thời lượng", "3 giờ"],
        ["Giá", "690.000₫ / người"],
        ["Sức chứa", "8 người"],
        ["Mang về", "Bó 7–9 bông hoàn chỉnh"],
      ],
      goals: [
        "Nặn đủ số bông cho 1 bó nhỏ",
        "Phối màu kem / blush / sage",
        "Gói kraft + nơ linen",
        "Chọn giấy & ruy băng theo dịp tặng",
      ],
      includes: [
        "Sáp & dụng cụ đầy đủ",
        "Giấy kraft Ý, nơ linen, thiệp viết tay",
        "Hộp mang về an toàn",
        "Trà & bánh nhẹ",
      ],
      forWho: "Ai muốn mang về một món quà thật, hoặc học gói bó chuyên nghiệp hơn.",
    },
    "ws-gia-dinh": {
      tag: "Gia đình",
      title: "Workshop Gia Đình",
      img: "assets/prod-jar.webp",
      lead: "Một người lớn + một bé cùng làm chung một lọ hoa. Nhịp chậm, dụng cụ an toàn, không áp lực “phải đẹp”.",
      meta: [
        ["Thời lượng", "2 giờ"],
        ["Giá", "790.000₫ / cặp"],
        ["Sức chứa", "4 cặp"],
        ["Mang về", "1 lọ hoa chung"],
      ],
      goals: [
        "Bé tập nặn cánh đơn giản (có hỗ trợ)",
        "Cùng chọn màu và cắm lọ",
        "Khoảnh khắc làm chung, không màn hình",
      ],
      includes: [
        "Dụng cụ an toàn cho trẻ (từ 5 tuổi)",
        "Tạp dề size bé & người lớn",
        "Trà bánh nhẹ",
        "Ảnh kỷ niệm tại xưởng",
      ],
      forWho: "Gia đình muốn 1 hoạt động cuối tuần; bé từ 5 tuổi trở lên.",
    },
    "ws-ky-thuat": {
      tag: "Nâng cao",
      title: "Nặn Cánh Nâng Cao",
      img: "assets/workshop-hands.webp",
      lead: "Kỹ thuật cánh mỏng, phối màu tinh tế và composition bó hoa. Dành cho người đã qua lớp cơ bản hoặc đã tự nặn ở nhà.",
      meta: [
        ["Thời lượng", "4 giờ"],
        ["Giá", "890.000₫ / người"],
        ["Sức chứa", "6 người"],
        ["Yêu cầu", "Đã qua lớp cơ bản"],
      ],
      goals: [
        "Cánh mỏng, độ cong tự nhiên",
        "Blend màu trên cánh",
        "Composition & nhịp hoa trong bó",
        "Sửa lỗi thường gặp khi nặn nhanh",
      ],
      includes: [
        "Sáp cao cấp & dụng cụ chuyên",
        "Tệp mẫu cánh nâng cao",
        "Trà & bánh nhẹ",
        "Ưu tiên lịch lớp tiếp theo",
      ],
      forWho: "Người đã biết nặn cơ bản, muốn nâng tay nghề hoặc mở xưởng nhỏ.",
    },
  };

  const wsModal = $("#ws-modal");
  let wsDetailId = "ws-co-ban";

  function openWsDetail(id) {
    const data = WS_INFO[id];
    if (!wsModal || !data) return;
    wsDetailId = id;
    $("#ws-detail-img").src = data.img;
    $("#ws-detail-img").alt = data.title;
    $("#ws-detail-tag").textContent = data.tag;
    $("#ws-modal-title").textContent = data.title;
    $("#ws-detail-lead").textContent = data.lead;
    $("#ws-detail-meta").innerHTML = data.meta
      .map(([k, v]) => `<div><span>${k}</span><strong>${v}</strong></div>`)
      .join("");
    $("#ws-detail-goals").innerHTML = data.goals.map((g) => `<li>${g}</li>`).join("");
    $("#ws-detail-includes").innerHTML = data.includes.map((g) => `<li>${g}</li>`).join("");
    $("#ws-detail-for").textContent = data.forWho;
    wsModal.hidden = false;
    document.body.style.overflow = "hidden";
    if (window.__sapaLenis) window.__sapaLenis.stop?.();
    $("#ws-modal-close")?.focus();
  }

  function closeWsDetail() {
    if (!wsModal || wsModal.hidden) return;
    wsModal.hidden = true;
    document.body.style.overflow = "";
    if (window.__sapaLenis) window.__sapaLenis.start?.();
  }

  $("#ws-modal-close")?.addEventListener("click", closeWsDetail);
  $("#ws-detail-close2")?.addEventListener("click", closeWsDetail);
  wsModal?.addEventListener("click", (e) => {
    if (e.target === wsModal) closeWsDetail();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeWsDetail();
  });

  $("#ws-detail-book")?.addEventListener("click", () => {
    closeWsDetail();
    const classId = wsDetailId;
    if (classSelect && className[classId]) {
      classSelect.value = classId;
      fillSlots(classId);
      updateBookingSummary();
    }
    const book = $("#book");
    if (book) {
      const lenis = window.__sapaLenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(book, { offset: -12, duration: 1.25 });
      } else {
        book.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
    $("#ws-name")?.focus({ preventScroll: true });
  });

  $$("[data-open-detail]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      openWsDetail(el.getAttribute("data-open-detail"));
    });
  });

  renderSchedule();
})();
