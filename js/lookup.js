/* Lookup page wiring — uses window.__sapaBooking */
(() => {
  const $ = (s, r = document) => r.querySelector(s);

  // wait for booking.js (defer order: booking then this)
  const boot = () => {
    if (!window.__sapaBooking) {
      setTimeout(boot, 30);
      return;
    }
    // safety: never show workshop sticky bar on lookup page
    document.getElementById("sticky-book")?.remove();
    document.body.classList.remove("has-sticky-book");

    const bookingApi = window.__sapaBooking;
    const escapeHtml = bookingApi.escapeHtml;
    const form = $("#manage-form");
    const msg = $("#manage-msg");
    const card = $("#manage-card");
    let tries = 0;
    let lockUntil = 0;

    form?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (Date.now() < lockUntil) {
        if (msg) {
          msg.textContent = "Bạn tra cứu quá nhanh — thử lại sau 30 giây.";
          msg.className = "form-msg is-err";
        }
        return;
      }
      tries += 1;
      if (tries > 8) {
        lockUntil = Date.now() + 30000;
        tries = 0;
        if (msg) {
          msg.textContent = "Quá nhiều lần tra cứu — thử lại sau 30 giây.";
          msg.className = "form-msg is-err";
        }
        return;
      }
      const code = $("#manage-code")?.value || "";
      const phone = $("#manage-phone")?.value || "";
      let b = bookingApi.findBooking(code, phone);
      b = bookingApi.expireIfDue(b);
      if (!b) {
        if (card) {
          card.innerHTML = "";
          card.hidden = true;
        }
        const empty0 = $("#manage-empty");
        if (empty0) empty0.hidden = true;
        if (msg) {
          msg.textContent = "Không tìm thấy đặt chỗ. Kiểm tra mã và số điện thoại.";
          msg.className = "form-msg is-err";
        }
        return;
      }
      if (msg) {
        msg.textContent = "";
        msg.className = "form-msg";
      }
      if (card) {
        card.hidden = false;
        renderManage(b);
      }
      const empty = $("#manage-empty");
      if (empty) empty.hidden = true;
    });

    function renderManage(b) {
      const box = $("#manage-card");
      if (!box) return;
      const canManage = ["pending", "confirmed"].includes(b.status);
      const availableSessions = canManage
        ? bookingApi.getAvailableSessions().filter(
            (session) =>
              session.classId === b.classId &&
              session.remaining >= b.qty &&
              session.key !== b.sessionKey &&
              session.slot !== b.slot
          )
        : [];
      const statusLabel = {
        pending: "Đang giữ chỗ (chờ cọc)",
        confirmed: "Đã xác nhận",
        expired: "Hết hạn giữ chỗ",
        cancelled: "Đã huỷ",
        attended: "Đã tham dự",
        no_show: "Không đến",
      }[b.status] || b.status;

      box.innerHTML = `
        <p class="manage-code">Mã đặt chỗ <strong>${escapeHtml(b.code)}</strong>
          <button type="button" class="linkish" data-copy="${escapeHtml(b.code)}">Sao chép</button></p>
        <p class="manage-status">Trạng thái: <strong>${escapeHtml(statusLabel)}</strong></p>
        <div class="hold-meta">
          <div><span>Lớp</span><strong>${escapeHtml(b.className)}</strong></div>
          <div><span>Thời gian</span><strong>${escapeHtml(b.slot)}</strong></div>
          <div><span>${escapeHtml(b.quantityLabel || "Số người")}</span><strong>${escapeHtml(b.qty)}</strong></div>
          <div><span>Liên hệ</span><strong>${escapeHtml(b.name)} · ${escapeHtml(b.phone)}</strong></div>
        </div>
        <div class="hold-summary">
          <div class="pay-title"><span>Chi tiết thanh toán</span></div>
          <div><span>Đã cọc</span><strong>${bookingApi.formatVND(b.deposit)}</strong></div>
          <div class="is-remaining"><span>Còn phải trả</span><strong>${bookingApi.formatVND(b.remaining)}</strong></div>
          <div><span>Tổng</span><strong>${bookingApi.formatVND(b.total)}</strong></div>
        </div>
        <p class="manage-policy"><strong>Chính sách:</strong> huỷ trước 48h hoàn 100% cọc · dời miễn phí trước 48h · trước 24h giữ cọc cho lần sau · không đến mất cọc.</p>
        ${canManage ? `
          <div class="manage-actions manage-actions--change">
            <label class="sr-only" for="manage-next-slot">Chọn buổi mới</label>
            <select id="manage-next-slot" ${availableSessions.length ? "" : "disabled"}>
              ${availableSessions.length
                ? availableSessions.map((session) => `<option value="${escapeHtml(session.key)}">${escapeHtml(session.slot)} · còn ${session.remaining} ${b.quantityLabel === "Số cặp" ? "cặp" : "chỗ"}</option>`).join("")
                : '<option value="">Chưa có buổi khác còn đủ chỗ</option>'}
            </select>
            <button type="button" class="btn-mini" data-manage="change" ${availableSessions.length ? "" : "disabled"}>Đổi buổi</button>
            <button type="button" class="linkish linkish--danger" data-manage="cancel">Huỷ đặt chỗ</button>
          </div>
        ` : '<p class="manage-policy">Đặt chỗ này đã kết thúc; không thể đổi lịch hoặc huỷ từ đây.</p>'}
      `;

      box.querySelector("[data-copy]")?.addEventListener("click", (e) => {
        const code = e.currentTarget.getAttribute("data-copy");
        if (navigator.clipboard && code) navigator.clipboard.writeText(code);
        e.currentTarget.textContent = "Đã chép";
      });

      box.querySelector('[data-manage="change"]')?.addEventListener("click", () => {
        const nextKey = $("#manage-next-slot")?.value;
        const next = bookingApi.getAvailableSessions().find(
          (session) =>
            session.key === nextKey &&
            session.classId === b.classId &&
            session.key !== b.sessionKey &&
            session.remaining >= b.qty
        );
        if (!next) return;
        const updated = bookingApi.updateBooking(b.code, {
          classId: next.classId,
          className: next.className,
          slot: next.slot,
          sessionKey: next.key,
          sessionDate: next.date,
          sessionStart: next.start,
        });
        renderManage(updated || b);
      });

      box.querySelector('[data-manage="cancel"]')?.addEventListener("click", () => {
        if (!confirm("Huỷ đặt chỗ? Phần cọc được xử lý theo chính sách hiển thị ở trên.")) return;
        const updated = bookingApi.updateBooking(b.code, { status: "cancelled" });
        renderManage(updated || b);
      });
    }
  };

  boot();
})();
