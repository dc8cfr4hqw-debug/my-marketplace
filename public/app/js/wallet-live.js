(function () {
  function formatUsd(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value || 0));
  }

  function formatBtc(value) {
    return Number(value || 0).toFixed(8);
  }

  function updateWalletActionsLabels() {
    document.querySelectorAll(".wallet .menu-tab li h6").forEach(function (el) {
      const txt = (el.textContent || "").trim().toLowerCase();
      if (txt === "buy crypto") el.textContent = "Deposit";
      if (txt === "sell crypto") el.textContent = "Withdraw";
    });
  }

  function ensureQuickActions() {
    const main = document.querySelector(".wallet-main .right");
    if (!main || document.getElementById("walletQuickActions")) return;

    const wrap = document.createElement("div");
    wrap.id = "walletQuickActions";
    wrap.style.display = "grid";
    wrap.style.gap = "8px";
    wrap.style.marginTop = "12px";

    const dep = document.createElement("a");
    dep.className = "btn-action";
    dep.href = "/user-center/assets/deposit/fiat.html";
    dep.textContent = "Crypto Deposit";
    dep.style.textAlign = "center";

    const fiat = document.createElement("button");
    fiat.className = "btn-action";
    fiat.type = "button";
    fiat.textContent = "Deposit with WolvPay";
    fiat.onclick = async function () {
      const amount = Number(prompt("Deposit amount (USD):", "100") || 0);
      if (!amount || amount <= 0) return;
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("/api/deposit/wolvpay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({ amount: amount, currency: "usd", coin: "btc" })
        });
        const data = await res.json();
        if (!res.ok) {
          const provider = data && data.raw ? JSON.stringify(data.raw).slice(0, 180) : "";
          throw new Error((data.error || "Deposit failed") + (provider ? " | " + provider : ""));
        }
        if (!data.checkout_url) {
          throw new Error("Checkout URL missing from provider response");
        }
        window.open(data.checkout_url, "_blank");
      } catch (e) {
        alert(e.message || "Deposit failed");
      }
    };

    const profile = document.createElement("a");
    profile.className = "btn-action";
    profile.href = "/user-center/profile-page.html";
    profile.textContent = "My Profile";
    profile.style.textAlign = "center";

    wrap.appendChild(dep);
    wrap.appendChild(fiat);
    wrap.appendChild(profile);
    main.appendChild(wrap);
  }

  function updateOverview(usd, btc) {
    document.querySelectorAll(".wallet-main .left").forEach(function (block) {
      const h6 = block.querySelector(".price h6");
      const usdP = block.querySelectorAll("p")[1];
      const badge = block.querySelector(".price .sale");
      if (h6) h6.textContent = formatBtc(btc);
      if (usdP) usdP.textContent = formatUsd(usd);
      if (badge) badge.textContent = "BTC";
    });
  }

  async function loadWalletLive() {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const [balanceRes, marketsRes] = await Promise.all([
        fetch("/balance", { headers: { Authorization: "Bearer " + token } }),
        fetch("/markets")
      ]);

      if (!balanceRes.ok) return;
      const balanceData = await balanceRes.json();
      const usdBalance = Number(balanceData.usd_balance || balanceData.balance || 0);
      let btcBalance = Number(balanceData.btc_balance || 0);

      if (!btcBalance && marketsRes.ok) {
        const markets = await marketsRes.json();
        const btc = Array.isArray(markets) ? markets.find((m) => String(m.symbol || "").toLowerCase() === "btc") : null;
        if (btc && btc.current_price) btcBalance = usdBalance / Number(btc.current_price);
      }

      updateOverview(usdBalance, btcBalance);
    } catch (error) {
      console.error("Wallet live update error:", error);
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    updateWalletActionsLabels();
    ensureQuickActions();
    loadWalletLive();
    setInterval(loadWalletLive, 30000);
  });
})();
