(function () {
  function pickPersonalInputs() {
    const form = document.querySelector(".user-profile form");
    if (!form) return {};
    const textInputs = form.querySelectorAll('input[type="text"]');
    const emailInput = form.querySelector('input[type="email"]');
    const phoneInput = form.querySelector('input[type="tel"], input[placeholder*="phone" i]');
    return {
      first: textInputs[0] || null,
      last: textInputs[1] || null,
      email: emailInput || null,
      phone: phoneInput || textInputs[2] || null,
      form
    };
  }

  async function loadProfile() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const res = await fetch("/api/me", { headers: { Authorization: "Bearer " + token } });
    if (!res.ok) return;
    const me = await res.json();

    const refs = pickPersonalInputs();
    if (refs.first) refs.first.value = me.first_name || "";
    if (refs.last) refs.last.value = me.last_name || "";
    if (refs.email) refs.email.value = me.email || "";
    if (refs.phone) refs.phone.value = me.phone || "";

    const head = document.querySelector(".user-profile .heading");
    if (head && me.email) head.textContent = "User Profile - " + me.email;
  }

  async function bindSave() {
    const refs = pickPersonalInputs();
    if (!refs.form) return;

    refs.form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const token = localStorage.getItem("token");
      if (!token) return;

      await fetch("/api/me/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          first_name: refs.first ? refs.first.value : "",
          last_name: refs.last ? refs.last.value : "",
          phone: refs.phone ? refs.phone.value : ""
        })
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    loadProfile();
    bindSave();
  });
})();
