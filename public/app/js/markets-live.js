(function () {
  var state = {
    all: [],
    q: "",
    selected: "btc",
    connOk: false,
    lastSync: null
  };

  function token() { return localStorage.getItem("token") || ""; }

  function fmtUsd(value) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(Number(value || 0));
  }

  function fmtVol(value) {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(Number(value || 0));
  }

  function templateCoinIcon(symbol) {
    var s = String(symbol || "").toLowerCase();
    if (s === "btc") return '<span class="icon-btc"><span class="path1"></span><span class="path2"></span></span>';
    if (s === "eth") return '<span class="icon-eth"><span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span></span>';
    if (s === "usdt") return '<span class="icon-tether"><span class="path1"></span><span class="path2"></span></span>';
    if (s === "bnb") return '<span class="icon-bnb"><span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span><span class="path5"></span><span class="path6"></span></span>';
    return "";
  }

  function coinVisual(symbol) {
    var s = String(symbol || "").toLowerCase();
    var map = {
      aiq: { icon: "tabler:chart-candle", bg: "linear-gradient(135deg,#2563eb,#1e40af)" },
      btc: { icon: "cryptocurrency-color:btc", bg: "linear-gradient(135deg,#f59e0b,#f97316)" },
      eth: { icon: "cryptocurrency-color:eth", bg: "linear-gradient(135deg,#94a3b8,#64748b)" },
      sol: { icon: "tabler:chart-candle", bg: "linear-gradient(135deg,#22c55e,#06b6d4)" },
      xrp: { icon: "tabler:chart-candle", bg: "linear-gradient(135deg,#64748b,#111827)" },
      doge: { icon: "tabler:chart-candle", bg: "linear-gradient(135deg,#fbbf24,#ca8a04)" },
      bnb: { icon: "simple-icons:binance", bg: "linear-gradient(135deg,#facc15,#f59e0b)" },
      usdt: { icon: "lucide:badge-dollar-sign", bg: "linear-gradient(135deg,#14b8a6,#0f766e)" }
    };
    return map[s] || { icon: "tabler:chart-candle", bg: "linear-gradient(135deg,#3b82f6,#1d4ed8)" };
  }

  function coinBadge(symbol) {
    var iconTpl = templateCoinIcon(symbol);
    if (iconTpl) {
      return '<span class="mk-badge" style="background:#121a28;">' + iconTpl + "</span>";
    }
    var c = coinVisual(symbol);
    return '<span class="mk-badge" style="background:' + c.bg + '"><iconify-icon icon="' + c.icon + '"></iconify-icon></span>';
  }

  function rowHtml(coin, idx) {
    var sym = String(coin.symbol || "").toUpperCase();
    var isUp = Number(coin.price_change_percentage_24h || 0) >= 0;
    var change = (isUp ? "+" : "") + Number(coin.price_change_percentage_24h || 0).toFixed(2) + "%";
    var tradeHref = "/trade.html?symbol=" + encodeURIComponent(String(coin.symbol || "").toLowerCase());

    return '<tr class="mk-row" data-symbol="' + String(coin.symbol || "").toLowerCase() + '">' +
      '<td>' + (idx + 1) + '</td>' +
      '<td>' +
        '<div class="mk-coin">' +
          coinBadge(coin.symbol) +
          '<span>' + coin.name + '<span class="mk-pair"> ' + sym + '/USDT</span></span>' +
        '</div>' +
      '</td>' +
      '<td>' + fmtUsd(coin.current_price) + '</td>' +
      '<td class="mk-change ' + (isUp ? "up" : "down") + '">' + change + '</td>' +
      '<td>' + fmtUsd(coin.high_24h) + '</td>' +
      '<td>' + fmtUsd(coin.low_24h) + '</td>' +
      '<td>' + fmtVol(coin.total_volume || 0) + '</td>' +
      '<td><a class="mk-trade" href="' + tradeHref + '"><iconify-icon icon="tabler:chart-candle"></iconify-icon><span>Trade</span></a></td>' +
      '</tr>';
  }

  function aiqMarket() {
    return {
      symbol: "aiq",
      name: "Global X AIQ ETF",
      current_price: 48.35,
      high_24h: 49.41,
      low_24h: 48.23,
      total_volume: 2557319,
      price_change_percentage_24h: -0.5
    };
  }

  function filteredRows() {
    var q = String(state.q || "").toLowerCase();
    return state.all.filter(function (c) {
      var name = String(c.name || "").toLowerCase();
      var sym = String(c.symbol || "").toLowerCase();
      return !q || name.indexOf(q) !== -1 || sym.indexOf(q) !== -1 || (sym + "usdt").indexOf(q) !== -1;
    });
  }

  function selectedCoin() {
    var sym = String(state.selected || "btc").toLowerCase();
    var c = state.all.find(function (x) { return String(x.symbol || "").toLowerCase() === sym; });
    return c || state.all[0] || null;
  }

  function renderQuickPanel() {
    var coin = selectedCoin();
    if (!coin) return;

    var pair = String(coin.symbol || "").toUpperCase() + "/USDT";
    var price = Number(coin.current_price || 0);
    var usd = Number(document.getElementById("mkOrderUsd").value || 0);
    var qty = price > 0 ? usd / price : 0;

    document.getElementById("mkSelectedPair").value = pair;
    document.getElementById("mkSelectedPrice").value = fmtUsd(price);
    document.getElementById("mkOrderQty").value = qty.toFixed(8);
    document.getElementById("mkOpenTrade").setAttribute("href", "/trade.html?symbol=" + encodeURIComponent(String(coin.symbol || "").toLowerCase()));
  }

  function applyFilter() {
    var rows = filteredRows();
    var body = document.getElementById("marketsTableBody");
    if (!body) return;
    body.innerHTML = rows.map(rowHtml).join("") || '<tr><td colspan="8" style="color:#8ea4c0;padding:14px;">No matching markets</td></tr>';

    body.querySelectorAll("tr[data-symbol]").forEach(function (tr) {
      tr.addEventListener("click", function (e) {
        if (e.target.closest("a")) return;
        state.selected = tr.getAttribute("data-symbol") || "btc";
        renderQuickPanel();
      });
    });
    renderQuickPanel();
  }

  function setTopCards(markets) {
    var cards = document.querySelectorAll("#marketTopCards .mk-card");
    if (!cards.length || !markets.length) return;

    var topVol = markets.slice().sort(function (a, b) { return Number(b.total_volume || 0) - Number(a.total_volume || 0); })[0];
    var topGain = markets.slice().sort(function (a, b) { return Number(b.price_change_percentage_24h || -999) - Number(a.price_change_percentage_24h || -999); })[0];
    var topDrop = markets.slice().sort(function (a, b) { return Number(a.price_change_percentage_24h || 999) - Number(b.price_change_percentage_24h || 999); })[0];

    [topVol, topGain, topDrop].forEach(function (coin, i) {
      var card = cards[i];
      if (!card || !coin) return;
      var isUp = Number(coin.price_change_percentage_24h || 0) >= 0;
      var sym = String(coin.symbol || "").toUpperCase() + "USDT";
      card.querySelector(".v").textContent = sym + " " + fmtUsd(coin.current_price);
      var s = card.querySelector(".s");
      s.className = "s " + (isUp ? "up" : "down");
      s.innerHTML = '<iconify-icon icon=\"lucide:badge-dollar-sign\"></iconify-icon>' + (isUp ? '+' : '') + Number(coin.price_change_percentage_24h || 0).toFixed(2) + '%';
    });
  }

  function updateConn(ok) {
    state.connOk = !!ok;
    state.lastSync = new Date();
    var left = document.getElementById("mkConnLeft");
    var right = document.getElementById("mkConnRight");
    if (!left || !right) return;

    if (ok) {
      left.innerHTML = '<iconify-icon icon=\"tabler:chart-candle\"></iconify-icon> <span class="ok">Stable connection</span>';
    } else {
      left.innerHTML = '<iconify-icon icon=\"lucide:badge-dollar-sign\"></iconify-icon> <span class="bad">Connection degraded</span>';
    }
    right.textContent = state.lastSync.toLocaleTimeString();
  }

  function ensureAuthModal() {
    if (document.getElementById("mkAuthModal")) return;

    var style = document.createElement("style");
    style.id = "mk-auth-modal-styles";
    style.textContent = [
      ".mk-auth-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(4,10,18,.72);z-index:3200;padding:16px;}",
      ".mk-auth-modal.open{display:flex;}",
      ".mk-auth-card{width:min(430px,96vw);background:linear-gradient(145deg,rgba(11,20,33,.98),rgba(9,16,27,.98));border:1px solid rgba(73,106,153,.45);border-radius:16px;padding:18px;box-shadow:0 24px 54px rgba(0,0,0,.45);}",
      ".mk-auth-title{font-size:20px;font-weight:800;margin:0 0 6px;}",
      ".mk-auth-sub{font-size:13px;color:#9db1cc;margin:0 0 12px;}",
      ".mk-auth-input{width:100%;min-height:44px;border:1px solid #2f4460;border-radius:10px;background:#121e2f;color:#e6eef8;padding:0 12px;}",
      ".mk-auth-row{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;}",
      ".mk-auth-btn{min-height:40px;padding:0 14px;border-radius:10px;border:1px solid #324a67;background:#111b2b;color:#dce9fa;font-weight:700;}",
      ".mk-auth-btn.primary{background:#2d7dff;border-color:#2d7dff;color:#fff;}",
      ".mk-auth-error{min-height:18px;margin-top:8px;font-size:12px;color:#ff9ea2;}"
    ].join("");
    document.head.appendChild(style);

    var modal = document.createElement("div");
    modal.id = "mkAuthModal";
    modal.className = "mk-auth-modal";
    modal.innerHTML =
      '<div class="mk-auth-card" role="dialog" aria-modal="true" aria-labelledby="mkAuthTitle">' +
        '<h4 class="mk-auth-title" id="mkAuthTitle">Confirm Order</h4>' +
        '<p class="mk-auth-sub" id="mkAuthSub">Enter your account password to continue.</p>' +
        '<input id="mkAuthPassword" class="mk-auth-input" type="password" placeholder="Account password" />' +
        '<div id="mkAuthError" class="mk-auth-error"></div>' +
        '<div class="mk-auth-row">' +
          '<button type="button" class="mk-auth-btn" id="mkAuthCancel">Cancel</button>' +
          '<button type="button" class="mk-auth-btn primary" id="mkAuthConfirm">Confirm</button>' +
        '</div>' +
      "</div>";
    document.body.appendChild(modal);
  }

  function showOrderAuthModal() {
    ensureAuthModal();
    var modal = document.getElementById("mkAuthModal");
    var input = document.getElementById("mkAuthPassword");
    var err = document.getElementById("mkAuthError");
    var cancel = document.getElementById("mkAuthCancel");
    var confirm = document.getElementById("mkAuthConfirm");

    if (input) input.value = "";
    if (err) err.textContent = "";
    modal.classList.add("open");
    setTimeout(function () { if (input) input.focus(); }, 10);

    return new Promise(function (resolve) {
      var done = false;
      function close(ok, password) {
        if (done) return;
        done = true;
        modal.classList.remove("open");
        cancel.removeEventListener("click", onCancel);
        confirm.removeEventListener("click", onConfirm);
        modal.removeEventListener("click", onBackdrop);
        document.removeEventListener("keydown", onKey);
        resolve({ ok: ok, password: password || "" });
      }
      function onCancel() { close(false, ""); }
      function onBackdrop(e) { if (e.target === modal) close(false, ""); }
      function onKey(e) {
        if (e.key === "Escape") close(false, "");
        if (e.key === "Enter") onConfirm();
      }
      function onConfirm() {
        var password = String(input && input.value || "").trim();
        if (!password) {
          if (err) err.textContent = "Password is required.";
          return;
        }
        close(true, password);
      }
      cancel.addEventListener("click", onCancel);
      confirm.addEventListener("click", onConfirm);
      modal.addEventListener("click", onBackdrop);
      document.addEventListener("keydown", onKey);
    });
  }

  async function ensureTradePassword() {
    var modalResult = await showOrderAuthModal();
    if (!modalResult.ok) return false;
    if (!String(modalResult.password).trim()) return false;

    var res = await fetch("/api/auth/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
      body: JSON.stringify({ password: modalResult.password })
    });
    return res.ok;
  }

  async function placeOrder(side) {
    var coin = selectedCoin();
    if (!coin) return;
    var usd = Number(document.getElementById("mkOrderUsd").value || 0);
    var status = document.getElementById("mkOrderStatus");
    if (!Number.isFinite(usd) || usd <= 0) {
      status.textContent = "Enter valid amount.";
      status.style.color = "#ef9aa4";
      return;
    }

    if (!token()) {
      status.textContent = "Please login first.";
      status.style.color = "#ef9aa4";
      return;
    }

    status.textContent = "Verifying password...";
    status.style.color = "#9bb1ce";
    var passOk = await ensureTradePassword();
    if (!passOk) {
      status.textContent = "Password verification failed.";
      status.style.color = "#ef9aa4";
      return;
    }

    status.textContent = "Submitting order...";
    try {
      var endpoint = side === "buy" ? "/api/trade/buy" : "/api/trade/sell";
      var res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token() },
        body: JSON.stringify({ symbol: String(coin.symbol || "").toLowerCase(), usd_amount: usd })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) throw new Error(data.error || "Order failed");
      status.textContent = (side === "buy" ? "Buy" : "Sell") + " filled: " + Number(data.quantity || 0).toFixed(8) + " " + String(coin.symbol || "").toUpperCase();
      status.style.color = "#2bd28a";
    } catch (err) {
      status.textContent = err.message || "Order failed";
      status.style.color = "#ef9aa4";
    }
  }

  async function refresh() {
    try {
      var res = await fetch("/markets");
      if (!res.ok) throw new Error("Markets unavailable");
      var all = await res.json();
      if (!Array.isArray(all)) throw new Error("Invalid payload");

      state.all = all.slice(0, 40).filter(function (coin) {
        return String(coin.symbol || "").toLowerCase() !== "aiq";
      });
      state.all.unshift(aiqMarket());
      setTopCards(state.all);
      applyFilter();
      updateConn(true);
    } catch (_) {
      updateConn(false);
      var body = document.getElementById("marketsTableBody");
      if (body) body.innerHTML = '<tr><td colspan="8" style="color:#ef949f;padding:14px;">Failed to load live markets</td></tr>';
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    ensureAuthModal();
    var search = document.getElementById("marketSearch");
    if (search) {
      search.addEventListener("input", function () {
        state.q = search.value || "";
        applyFilter();
      });
    }

    var usdInput = document.getElementById("mkOrderUsd");
    if (usdInput) usdInput.addEventListener("input", renderQuickPanel);
    var buy = document.getElementById("mkBuyBtn");
    var sell = document.getElementById("mkSellBtn");
    if (buy) buy.addEventListener("click", function () { placeOrder("buy"); });
    if (sell) sell.addEventListener("click", function () { placeOrder("sell"); });

    refresh();
    setInterval(refresh, 15000);
  });
})();
