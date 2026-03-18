(function () {
  function fmtUsd(v) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v || 0));
  }

  function emailToName(email) {
    var local = String(email || "").split("@")[0] || "";
    if (!local) return "";
    return local
      .replace(/[._-]+/g, " ")
      .split(" ")
      .filter(Boolean)
      .map(function (p) { return p.charAt(0).toUpperCase() + p.slice(1); })
      .join(" ");
  }

  async function request(path, opts) {
    const res = await fetch(path, opts || {});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function loadProfile() {
    const token = localStorage.getItem("token");
    const [me, bal] = await Promise.all([
      request("/api/me", { headers: { Authorization: "Bearer " + token } }),
      request("/balance", { headers: { Authorization: "Bearer " + token } })
    ]);

    var guess = emailToName(me.email || "");
    var guessFirst = guess.split(" ")[0] || "";
    var guessLast = guess.split(" ").slice(1).join(" ");

    document.getElementById("firstName").value = me.first_name || guessFirst || "";
    document.getElementById("lastName").value = me.last_name || guessLast || "";
    document.getElementById("email").value = me.email || "";
    document.getElementById("phone").value = me.phone || "";

    document.getElementById("usdBalance").textContent = fmtUsd(bal.usd_balance || bal.balance || 0);
    document.getElementById("btcBalance").textContent = Number(bal.btc_balance || 0).toFixed(8) + " BTC";
  }

  async function saveProfile(e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const status = document.getElementById("profileStatus");
    status.textContent = "";

    try {
      await request("/api/me/update", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          first_name: document.getElementById("firstName").value,
          last_name: document.getElementById("lastName").value,
          phone: document.getElementById("phone").value
        })
      });
      status.textContent = "Profile saved.";
      await loadProfile();
    } catch (err) {
      status.textContent = err.message || "Profile update failed";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("profileForm").addEventListener("submit", saveProfile);
    loadProfile().catch((e) => {
      document.getElementById("profileStatus").textContent = e.message || "Failed to load profile";
    });
  });
})();
