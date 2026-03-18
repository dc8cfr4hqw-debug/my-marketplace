(function () {
  const state = {
    balances: { usd: 0, btc: 0 },
    prices: {},
    activeTab: "futures",
    historyTab: "all",
    deposits: []
  };

  const tabSymbols = {
    futures: ["USDT", "BTC", "ETH", "XRP"],
    spot: ["USDT", "BTC", "ETH", "SOL", "XRP"],
    tradfi: ["USDT", "BTC"],
    wallets: ["USDT", "BTC", "ETH", "XRP", "SOL", "BNB"]
  };

  function usd(v) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v || 0));
  }

  async function request(path, opts) {
    const res = await fetch(path, opts || {});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function allRows() {
    return [
      { symbol: "USDT", qty: state.balances.usd, usd: state.balances.usd },
      { symbol: "BTC", qty: state.balances.btc, usd: state.balances.btc * (state.prices.BTC || 0) },
      { symbol: "ETH", qty: 0, usd: 0 },
      { symbol: "XRP", qty: 0, usd: 0 },
      { symbol: "SOL", qty: 0, usd: 0 },
      { symbol: "BNB", qty: 0, usd: 0 }
    ];
  }

  function buildRows() {
    const search = (document.getElementById("assetSearch").value || "").toLowerCase();
    const hideZero = document.getElementById("hideZero").checked;
    const allowed = tabSymbols[state.activeTab] || tabSymbols.futures;

    const html = allRows()
      .filter((r) => allowed.includes(r.symbol))
      .filter((r) => r.symbol.toLowerCase().includes(search))
      .filter((r) => !hideZero || Number(r.qty) > 0)
      .map((r) => {
        const s = r.symbol.toLowerCase();
        const qtyDecimals = r.symbol === "USDT" ? 2 : 8;
        return `<tr>
          <td>
            <div class="uc-coin">${r.symbol}</div>
          </td>
          <td>
            <div class="uc-bal">${Number(r.qty).toFixed(qtyDecimals)}</div>
            <div class="uc-bal-sub">≈ ${usd(r.usd)}</div>
          </td>
          <td class="uc-actions">
            <a href="/user-center/assets/deposit/fiat.html?coin=BTC">Crypto Deposit</a>
            <a href="/trade.html?symbol=${encodeURIComponent(s)}">Transfer</a>
            <a href="/trade.html?symbol=${encodeURIComponent(s)}">Trade</a>
          </td>
        </tr>`;
      })
      .join("");

    document.getElementById("assetRows").innerHTML = html || '<tr><td colspan="3" style="color:#8ea0bd;font-size:20px;padding:18px 6px;">No assets</td></tr>';
  }

  function renderTotals() {
    const totalUsd = state.balances.usd + state.balances.btc * (state.prices.BTC || 0);
    document.getElementById("totalUsd").textContent = "$" + Number(totalUsd).toFixed(2);
    document.getElementById("totalBtc").textContent = `≈ ${Number(state.balances.btc).toFixed(8)} BTC`;
    document.getElementById("earnUsdt").textContent = Number(state.balances.usd).toFixed(2);
  }

  function statusMeta(d) {
    const created = d.created_at ? new Date(d.created_at).getTime() : Date.now();
    const elapsedMs = Date.now() - created;
    const sessionMs = 24 * 60 * 60 * 1000;
    const isExpiredPending = String(d.status || "").toLowerCase() === "pending" && elapsedMs >= sessionMs;

    if (isExpiredPending) {
      return { key: "unpaid", color: "#ef4444", icon: "fa-circle-xmark", label: "Unpaid" };
    }
    if (String(d.status || "").toLowerCase() === "completed") {
      return { key: "paid", color: "#22c55e", icon: "fa-circle-check", label: "Paid" };
    }
    return { key: "pending", color: "#f59e0b", icon: "fa-clock", label: "Pending" };
  }

  function pendingRemaining(d) {
    const created = d.created_at ? new Date(d.created_at).getTime() : Date.now();
    const remaining = Math.max(0, (24 * 60 * 60 * 1000) - (Date.now() - created));
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return `${h}h ${m}m`;
  }

  function renderDepositHistory() {
    const wrap = document.getElementById("depositHistoryList");
    if (!wrap) return;

    const filtered = (state.deposits || []).filter((d) => {
      const meta = statusMeta(d);
      if (state.historyTab === "paid") return meta.key === "paid";
      return true;
    });

    if (!filtered.length) {
      wrap.className = "uc-empty";
      wrap.style.height = "320px";
      wrap.innerHTML = '<div class="icon">⌕</div><div>No available record</div>';
      return;
    }

    wrap.className = "";
    wrap.style.height = "auto";
    wrap.innerHTML = filtered.slice(0, 15).map((d) => {
      const meta = statusMeta(d);
      const amount = Number(d.amount_usd || 0).toFixed(2);
      const created = d.created_at ? new Date(d.created_at).toLocaleString() : "-";
      const note = meta.key === "pending" ? `Checkout expires in ${pendingRemaining(d)}` : meta.key === "unpaid" ? "Checkout session expired (24h)" : "Funds credited";
      return `<div style="padding:10px 0;border-bottom:1px solid #26354c;">
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
          <div style="font-weight:700;">$${amount}</div>
          <div style="display:inline-flex;align-items:center;gap:6px;color:${meta.color};font-weight:700;">
            <i class="fa-solid ${meta.icon}"></i><span>${meta.label}</span>
          </div>
        </div>
        <div style="font-size:12px;color:#95a8c2;margin-top:4px;">${created}</div>
        <div style="font-size:12px;color:#8ea4c0;margin-top:2px;">${note}</div>
      </div>`;
    }).join("");
  }

  async function loadData() {
    const token = localStorage.getItem("token");
    const [balance, markets, deposits] = await Promise.all([
      request("/balance", { headers: { Authorization: "Bearer " + token } }),
      request("/markets"),
      request("/api/deposits", { headers: { Authorization: "Bearer " + token } })
    ]);

    state.balances.usd = Number(balance.cash_balance || balance.usd_balance || 0);
    state.balances.btc = Number(balance.total_btc_balance || balance.btc_balance || 0);
    state.deposits = deposits || [];

    (markets || []).forEach((m) => {
      state.prices[String(m.symbol || "").toUpperCase()] = Number(m.current_price || 0);
    });

    renderTotals();
    buildRows();
    renderDepositHistory();
  }

  function fiatDeposit() {
    window.location.href = "/user-center/assets/deposit/fiat.html";
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".uc-tab").forEach((tab) => {
      tab.addEventListener("click", function () {
        document.querySelectorAll(".uc-tab").forEach((x) => x.classList.remove("active"));
        tab.classList.add("active");
        state.activeTab = tab.getAttribute("data-tab") || "futures";
        buildRows();
      });
    });

    document.getElementById("assetSearch").addEventListener("input", buildRows);
    document.getElementById("hideZero").addEventListener("change", buildRows);
    document.getElementById("fiatDepositBtn").addEventListener("click", fiatDeposit);
    document.querySelectorAll("[data-history-tab]").forEach((tab) => {
      tab.addEventListener("click", function () {
        document.querySelectorAll("[data-history-tab]").forEach((x) => x.classList.remove("active"));
        tab.classList.add("active");
        state.historyTab = tab.getAttribute("data-history-tab") || "all";
        renderDepositHistory();
      });
    });

    loadData().catch((e) => console.error(e));
    setInterval(() => loadData().catch(() => {}), 30000);
    setInterval(renderDepositHistory, 60000);
  });
})();
