(function () {
  const state = {
    coin: "USDT",
    network: "TRC20",
    deposits: []
  };

  function token() {
    return localStorage.getItem("token") || "";
  }

  async function request(path, opts) {
    const res = await fetch(path, opts || {});
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function setChips() {
    const coins = ["USDT", "BTC", "ETH", "XRP", "SOL", "BNB"];
    const wrap = document.getElementById("coinChips");
    wrap.innerHTML = coins
      .map((c) => `<button class="chip ${c === state.coin ? "active" : ""}" data-coin="${c}" type="button">${c}</button>`)
      .join("");

    wrap.querySelectorAll("button[data-coin]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.coin = btn.getAttribute("data-coin");
        document.getElementById("coinSelect").value = state.coin;
        refreshAddress();
        setChips();
      });
    });
  }

  function normalizeNetworkForCoin(coin) {
    const el = document.getElementById("networkSelect");
    const preferred = coin === "BTC" ? "BTC" : coin === "ETH" ? "ERC20" : "TRC20";
    if ([...el.options].some((o) => o.value === preferred)) {
      el.value = preferred;
      state.network = preferred;
    }
  }

  async function refreshAddress() {
    const out = document.getElementById("depositAddress");
    const tag = document.getElementById("destinationTag");
    const status = document.getElementById("addressStatus");
    out.value = "";
    tag.value = "";
    status.textContent = "Loading deposit address...";

    try {
      const data = await request(
        "/api/deposit/address?coin=" + encodeURIComponent(state.coin) + "&network=" + encodeURIComponent(state.network),
        { headers: { Authorization: "Bearer " + token() } }
      );
      out.value = data.address || "";
      tag.value = data.tag || "";
      status.textContent = "Address ready.";
    } catch (e) {
      status.textContent = e.message || "Address fetch failed";
    }
  }

  function renderHistory() {
    const coinFilter = document.getElementById("historyCoinFilter").value;
    const statusFilter = document.getElementById("historyStatusFilter").value;

    const rows = state.deposits
      .filter((d) => coinFilter === "ALL" || String((d.payload_json && d.payload_json.coin) || "").toUpperCase() === coinFilter)
      .filter((d) => statusFilter === "ALL" || String(d.status || "").toLowerCase() === statusFilter)
      .map((d) => {
        const payload = d.payload_json || {};
        const coin = String(payload.coin || "USDT").toUpperCase();
        const network = String(payload.network || payload.chain || state.network || "-").toUpperCase();
        const txid = payload.txid || payload.transaction_id || d.provider_ref || "-";
        const date = d.created_at ? new Date(d.created_at).toLocaleString() : "-";
        return `<tr>
          <td>${d.id}</td>
          <td>${coin}</td>
          <td>${network}</td>
          <td>${Number(d.amount_usd || 0).toFixed(2)} USD</td>
          <td>${String(d.status || "pending")}</td>
          <td>${date}</td>
          <td>${txid}</td>
        </tr>`;
      })
      .join("");

    document.getElementById("depositHistoryBody").innerHTML = rows || '<tr><td colspan="7" class="muted">No available record</td></tr>';
  }

  async function loadHistory() {
    try {
      const data = await request("/api/deposits", { headers: { Authorization: "Bearer " + token() } });
      state.deposits = (data || []).map((d) => {
        let payload = {};
        try {
          payload = d.payload ? JSON.parse(d.payload) : {};
        } catch (_) {
          payload = {};
        }
        return Object.assign({}, d, { payload_json: payload });
      });
      renderHistory();
    } catch (e) {
      document.getElementById("depositHistoryBody").innerHTML = '<tr><td colspan="7" class="muted">History unavailable</td></tr>';
    }
  }

  function fiatDeposit() {
    const params = new URLSearchParams({ coin: state.coin, network: state.network });
    window.location.href = "/user-center/assets/deposit/fiat.html?" + params.toString();
  }

  document.addEventListener("DOMContentLoaded", function () {
    const q = new URLSearchParams(location.search);
    const coin = (q.get("coin") || "USDT").toUpperCase();
    state.coin = ["USDT", "BTC", "ETH", "XRP", "SOL", "BNB"].includes(coin) ? coin : "USDT";

    const coinSelect = document.getElementById("coinSelect");
    coinSelect.value = state.coin;
    normalizeNetworkForCoin(state.coin);
    setChips();

    coinSelect.addEventListener("change", function () {
      state.coin = String(coinSelect.value || "USDT").toUpperCase();
      normalizeNetworkForCoin(state.coin);
      setChips();
      refreshAddress();
    });

    document.getElementById("networkSelect").addEventListener("change", function (e) {
      state.network = String(e.target.value || "TRC20").toUpperCase();
      refreshAddress();
    });

    document.getElementById("copyAddressBtn").addEventListener("click", async function () {
      const address = document.getElementById("depositAddress").value || "";
      if (!address) return;
      await navigator.clipboard.writeText(address).catch(() => {});
      document.getElementById("addressStatus").textContent = "Address copied.";
    });

    document.getElementById("historyCoinFilter").addEventListener("change", renderHistory);
    document.getElementById("historyStatusFilter").addEventListener("change", renderHistory);
    document.getElementById("fiatDepositLink").addEventListener("click", function (e) {
      e.preventDefault();
      fiatDeposit();
    });

    refreshAddress();
    loadHistory();
    setInterval(loadHistory, 30000);
  });
})();
