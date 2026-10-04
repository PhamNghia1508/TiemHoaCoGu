/* SÁPA Studio — Custom / Pre-order flower request form (shop page) */
(() => {
  const form = document.getElementById("co-form");
  if (!form) return;

  const msg = document.getElementById("co-msg");
  const $ = (id) => document.getElementById(id);

  function setMsg(text, ok) {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.toggle("is-ok", ok);
    msg.classList.toggle("is-err", !ok);
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // honeypot
    if ($("co-website").value) return;

    const name = $("co-name").value.trim();
    const phone = $("co-phone").value.trim();
    const type = $("co-type").value;
    const occasion = $("co-occasion").value;

    if (!name || !phone || !type || !occasion) {
      setMsg("Vui lòng điền họ tên, số điện thoại, loại hoa và dịp.", false);
      return;
    }

    const phoneOK = /^0\d{8,10}$/.test(phone.replace(/\s/g, ""));
    if (!phoneOK) {
      setMsg("Số điện thoại không hợp lệ — vui lòng kiểm tra lại.", false);
      return;
    }

    // Static site: simulate success
    setMsg(
      `Đã gửi yêu cầu! SÁPA sẽ liên hệ ${name} qua ${phone} trong 30 phút để báo giá.`,
      true
    );
    form.reset();
  });
})();
