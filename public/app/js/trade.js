(function () {
  function qp(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function fmtNum(v, digits) {
    return Number(v || 0).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  const state = {
    symbol: (qp("symbol") || "btc").toLowerCase(),
    isAiq: false,
    pair: "",
    price: 0,
    cashUsdBalance: 0,
    totalUsdBalance: 0,
    mode: "buy",
    wsTicker: null,
    wsTrades: null,
    wsStrip: null,
    stripMap: {},
    aiqTick: 0,
    aiqPrice: 48.35,
    aiqTrend: [],
    aiqRange: "5y",
    aiqHistory: [],
    aiqTimer: null,
    aiqTradesTimer: null
  };

  function tvSymbol(symbol) {
    const map = {
      btc: "BINANCE:BTCUSDT",
      eth: "BINANCE:ETHUSDT",
      bnb: "BINANCE:BNBUSDT",
      usdt: "CRYPTOCAP:USDT",
      sol: "BINANCE:SOLUSDT",
      xrp: "BINANCE:XRPUSDT"
    };
    return map[symbol] || "BINANCE:BTCUSDT";
  }

  function normalizeSymbol(sym) {
    var s = String(sym || "").toLowerCase();
    return s === "aiqusdt" ? "aiq" : s;
  }

  function coinLabel(symbol) {
    return String(symbol || "").replace(/usdt$/i, "").toUpperCase();
  }

  function coinColor(sym) {
    var s = String(sym || "").toLowerCase();
    if (s === "aiq") return "#2563eb";
    if (s === "btc") return "#f59e0b";
    if (s === "eth") return "#94a3b8";
    if (s === "bnb") return "#facc15";
    if (s === "xrp") return "#334155";
    if (s === "sol") return "#10b981";
    if (s === "usdt") return "#14b8a6";
    return "#3b82f6";
  }

  function iconifyForSymbol(sym) {
    var s = String(sym || "").toLowerCase();
    if (s === "btc") return "cryptocurrency-color:btc";
    if (s === "eth") return "cryptocurrency-color:eth";
    if (s === "bnb") return "simple-icons:binance";
    if (s === "usdt") return "lucide:badge-dollar-sign";
    if (s === "aiq") return "tabler:chart-candle";
    if (s === "coinbase") return "simple-icons:coinbase";
    return "tabler:chart-candle";
  }

  function templateCoinIcon(symbol) {
    var s = String(symbol || "").toLowerCase();
    if (s === "btc") return '<span class="icon-btc"><span class="path1"></span><span class="path2"></span></span>';
    if (s === "eth") return '<span class="icon-eth"><span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span></span>';
    if (s === "usdt") return '<span class="icon-tether"><span class="path1"></span><span class="path2"></span></span>';
    if (s === "bnb") return '<span class="icon-bnb"><span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span><span class="path5"></span><span class="path6"></span></span>';
    return "";
  }

  function buildAiqTicker() {
    state.aiqTick += 1;
    var drift = 0.012;
    var wave = Math.sin(state.aiqTick / 6) * 0.02;
    var noise = (Math.random() - 0.5) * 0.02;
    state.aiqPrice = Math.max(44, state.aiqPrice + drift + wave + noise);
    var close = Number(state.aiqPrice.toFixed(2));
    var prev = 48.59;
    var changeValue = close - prev;
    var changePct = (changeValue / prev) * 100;
    return {
      s: "AIQUSDT",
      c: close,
      h: 49.41,
      l: 48.23,
      q: 2557319 + Math.round(Math.random() * 18000),
      p: Number(changeValue.toFixed(2)),
      P: Number(changePct.toFixed(2))
    };
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
  }

  function setStatus(msg, ok) {
    const el = document.getElementById("tradeStatus");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("up", "down");
    el.classList.add(ok ? "up" : "down");
  }

  function numInput(id, fallback) {
    var el = document.getElementById(id);
    var v = Number(el && el.value);
    return Number.isFinite(v) ? v : fallback;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function aiqLaunchYear() {
    return new Date().getFullYear() - 5;
  }

  function buildAiqHistory() {
    if (state.aiqHistory.length) return state.aiqHistory;
    var out = [];
    var year = aiqLaunchYear();
    var month = 0;
    var price = 15.2; // ETF launch zone, 5 years ago
    for (var i = 0; i < 60; i++) {
      var progress = i / 59;
      var drift = i < 24 ? 0.17 : 0.49; // strong bullish trend in the latest 3 years
      var seasonal = Math.sin(i / 2.8) * 0.36;
      var noise = (Math.random() - 0.5) * 0.28;
      var pullback = i > 23 && i % 7 === 0 ? -(0.55 + Math.random() * 0.48) : 0; // small decreases
      price = price + drift + seasonal + noise + pullback;
      price = clamp(price, 12, 53.8);
      out.push({
        year: year + Math.floor(month / 12),
        month: month % 12,
        t: i,
        price: Number(price.toFixed(2)),
        p: Number(progress.toFixed(4))
      });
      month += 1;
    }
    state.aiqHistory = out;
    state.aiqPrice = out[out.length - 1].price;
    state.aiqTrend = out.map(function (x) { return x.price; });
    return out;
  }

  function aiqPointsForRange() {
    var history = buildAiqHistory();
    if (state.aiqRange === "1y") return history.slice(-12);
    if (state.aiqRange === "3y") return history.slice(-36);
    return history.slice(-60);
  }

  function updateAiqPerfChip() {
    var chip = document.getElementById("aiqPerfChip");
    if (!chip) return;
    var pts = aiqPointsForRange();
    if (!pts.length) return;
    var first = pts[0].price || 1;
    var last = pts[pts.length - 1].price || first;
    var pct = ((last - first) / first) * 100;
    chip.textContent = (pct >= 0 ? "+" : "") + pct.toFixed(2) + "%";
    chip.style.borderColor = pct >= 0 ? "rgba(45,203,137,.4)" : "rgba(239,79,95,.45)";
    chip.style.background = pct >= 0 ? "rgba(27,152,102,.18)" : "rgba(192,53,73,.18)";
    chip.style.color = pct >= 0 ? "#68e0a8" : "#ff8d99";
  }

  function renderRiskSummary() {
    var usd = numInput("usdAmount", 0);
    var lev = clamp(numInput("leverageInput", 2), 1, 10);
    var tp = Math.max(0, numInput("tpInput", 0));
    var sl = Math.max(0, numInput("slInput", 0));
    var notional = usd * lev;
    var buffer = Math.max(1.5, (100 / lev) * 0.62);
    var rr = sl > 0 ? tp / sl : 0;
    setText("notionalValue", fmtNum(notional, 2) + " USDT");
    setText("liqBuffer", fmtNum(buffer, 2) + "%");
    setText("rrValue", rr > 0 ? fmtNum(rr, 2) : "0.00");
  }

  function setRangeButtons() {
    var buttons = document.querySelectorAll(".range-btn[data-range]");
    buttons.forEach(function (btn) {
      btn.classList.toggle("active", btn.getAttribute("data-range") === state.aiqRange);
    });
  }

  function setOrderTypeMode() {
    var orderTypeEl = document.getElementById("orderType");
    var priceEl = document.getElementById("priceInput");
    if (!orderTypeEl || !priceEl) return;
    var isLimit = orderTypeEl.value === "limit";
    priceEl.readOnly = !isLimit;
    if (!isLimit) {
      priceEl.value = fmtNum(state.price, 2);
      priceEl.style.opacity = "1";
    } else {
      priceEl.style.opacity = "1";
      if (!priceEl.value) priceEl.value = fmtNum(state.price, 2);
    }
  }

  function renderEstimate() {
    const usd = Number(document.getElementById("usdAmount").value || 0);
    const lev = clamp(numInput("leverageInput", 2), 1, 10);
    const qty = state.price > 0 ? (usd * lev) / state.price : 0;
    setText("estimatedQty", "Estimated: " + qty.toFixed(8) + " " + state.symbol.toUpperCase());
    renderRiskSummary();
  }

  function renderBalance() {
    const cashUsd = Number(state.cashUsdBalance || 0);
    const totalUsd = Number(state.totalUsdBalance || 0);
    setText("freeUsdt", fmtNum(cashUsd, 2) + " USDT");
    setText("assetBalance", fmtNum(totalUsd, 2));
  }

  async function loadUserTrades() {
    var body = document.getElementById("userTradesBody");
    if (!body) return;
    var t = localStorage.getItem("token");
    if (!t) {
      body.innerHTML = '<tr><td colspan="8" style="color:#8ea2be;">Login required to view trade history</td></tr>';
      return;
    }
    try {
      var res = await fetch("/transactions", { headers: { Authorization: "Bearer " + t } });
      if (!res.ok) throw new Error("Failed to fetch history");
      var rows = await res.json();
      if (!Array.isArray(rows) || !rows.length) {
        body.innerHTML = '<tr><td colspan="8" style="color:#8ea2be;">No available record</td></tr>';
        return;
      }
      var symbolFilter = String(state.symbol || "").toUpperCase();
      var filtered = rows.filter(function (r) {
        return !symbolFilter || String(r.symbol || "").toUpperCase() === symbolFilter;
      }).slice(0, 12);
      if (!filtered.length) {
        body.innerHTML = '<tr><td colspan="8" style="color:#8ea2be;">No records for this pair</td></tr>';
        return;
      }
      body.innerHTML = filtered.map(function (r) {
        var qty = Number(r.quantity || 0);
        var px = Number(r.price || state.price || 0);
        var side = String(r.type || "").toUpperCase();
        var positionValue = qty * px;
        var pnl = side === "BUY" ? qty * (state.price - px) : qty * (px - state.price);
        var pnlCls = pnl >= 0 ? "up" : "down";
        return "<tr>" +
          "<td>" + String(r.symbol || "").toUpperCase() + "USDT</td>" +
          "<td>" + fmtNum(qty, 6) + "</td>" +
          "<td>" + fmtNum(px, 2) + "</td>" +
          "<td>" + fmtNum(state.price || px, 2) + "</td>" +
          "<td>" + fmtNum(positionValue, 2) + "</td>" +
          "<td class='" + pnlCls + "'>" + (pnl >= 0 ? "+" : "") + fmtNum(pnl, 2) + "</td>" +
          "<td>TP " + fmtNum(numInput("tpInput", 8), 1) + "% / SL " + fmtNum(numInput("slInput", 3), 1) + "%</td>" +
          "<td>" + side + "</td>" +
          "</tr>";
      }).join("");
    } catch (_) {
      body.innerHTML = '<tr><td colspan="8" style="color:#ef9aa4;">Could not load trade history</td></tr>';
    }
  }

  function renderFromTicker(ticker) {
    const pair = String(ticker.s || state.pair || "");
    const price = Number(ticker.c || ticker.lastPrice || 0);
    const high = Number(ticker.h || ticker.highPrice || 0);
    const low = Number(ticker.l || ticker.lowPrice || 0);
    const vol = Number(ticker.q || ticker.quoteVolume || 0);
    const changePct = Number(ticker.P || ticker.priceChangePercent || 0);
    const changeValue = Number(ticker.p || ticker.priceChange || 0);

    if (price > 0) {
      state.price = price;
      setValue("priceInput", fmtNum(price, 2));
    }

    setText("tradePair", pair || (state.symbol.toUpperCase() + "USDT"));
    setText("tradePrice", fmtNum(price, 2));
    setText("k24High", fmtNum(high, 2));
    setText("k24Low", fmtNum(low, 2));
    setText("k24Vol", fmtNum(vol, 0));
    setText("k24Change", fmtNum(changeValue, 2));

    const ch = (changePct >= 0 ? "+" : "") + fmtNum(changePct, 2) + "%";
    setText("tradeChange", ch);
    const chEl = document.getElementById("tradeChange");
    if (chEl) {
      chEl.classList.remove("up", "down");
      chEl.classList.add(changePct >= 0 ? "up" : "down");
    }

    var badge = document.getElementById("tradeCoinBadge");
    if (badge) {
      var sym = coinLabel(pair);
      var tpl = templateCoinIcon(sym.toLowerCase());
      if (tpl) {
        badge.innerHTML = tpl;
        badge.style.background = "#101927";
      } else {
        badge.textContent = sym.slice(0, 3);
        badge.style.background = coinColor(sym.toLowerCase());
        badge.style.color = sym === "BTC" || sym === "BNB" ? "#111" : "#fff";
      }
    }

    renderEstimate();
    if (state.isAiq) updateAiqPerfChip();
  }

  function drawAiqChart() {
    var container = document.getElementById("tv_chart_container");
    if (!container) return;
    if (!container.querySelector("canvas")) {
      container.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #1b2536;color:#a1b5d0;font-size:12px;">' +
          '<div style="font-weight:700;color:#e8f0ff;">AIQ Performance</div>' +
          '<div>Simulated live ETF stream</div>' +
        "</div>" +
        '<canvas id="aiqChartCanvas" style="display:block;width:100%;height:calc(100% - 42px);"></canvas>';
    }
    var canvas = document.getElementById("aiqChartCanvas");
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);

    var w = rect.width;
    var h = rect.height;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#141e2c";
    ctx.lineWidth = 1;
    for (var i = 1; i < 8; i++) {
      var y = (h / 8) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    for (var j = 1; j < 12; j++) {
      var xg = (w / 12) * j;
      ctx.beginPath();
      ctx.moveTo(xg, 0);
      ctx.lineTo(xg, h);
      ctx.stroke();
    }

    var points = aiqPointsForRange();
    if (!points.length) return;
    var prices = points.map(function (p) { return p.price; });
    var min = Math.min.apply(null, prices);
    var max = Math.max.apply(null, prices);
    var span = Math.max(0.5, max - min);

    ctx.beginPath();
    prices.forEach(function (val, idx) {
      var x = (idx / (prices.length - 1)) * w;
      var y = h - ((val - min) / span) * (h - 22) - 10;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#21d48d";
    ctx.stroke();

    var grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "rgba(33,212,141,0.25)");
    grad.addColorStop(1, "rgba(33,212,141,0)");
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.fillStyle = "#8aa1bf";
    ctx.font = "12px sans-serif";
    var first = points[0];
    var last = points[points.length - 1];
    ctx.fillText(String(first.year), 10, h - 8);
    ctx.fillText(String(last.year), w - 40, h - 8);
    state.aiqPrice = Number(last.price || state.aiqPrice);
    updateAiqPerfChip();
  }

  function appendTradeRow(price, qty, side) {
    const body = document.getElementById("marketTradesBody");
    if (!body) return;

    const tr = document.createElement("tr");
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    tr.innerHTML = "<td class='" + (side === "buy" ? "up" : "down") + "'>" + fmtNum(price, 2) + "</td><td>" + fmtNum(qty, 4) + "</td><td>" + time + "</td>";

    body.prepend(tr);
    while (body.children.length > 120) {
      body.removeChild(body.lastChild);
    }
  }

  function renderStripFromMap() {
    var strip = document.getElementById("marketStrip");
    if (!strip) return;

    var pairs = state.isAiq
      ? ["AIQUSDT", "BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "SOLUSDT"]
      : ["BTCUSDT", "ETHUSDT", "BNBUSDT", "XRPUSDT", "SOLUSDT", "USDTUSDT"];
    var html = pairs
      .map(function (pair) {
        var t = state.stripMap[pair];
        if (!t) return "";
        var ch = Number(t.P || 0);
        var cls = ch >= 0 ? "up" : "down";
        var plus = ch >= 0 ? "+" : "";
        var sym = coinLabel(pair);
        var tpl = templateCoinIcon(sym.toLowerCase());
        var iconHtml = tpl
          ? ('<span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:#121a28;">' + tpl + "</span>")
          : ('<span style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:' + coinColor(sym.toLowerCase()) + ';color:#fff;font-size:9px;font-weight:700"><iconify-icon icon="' + iconifyForSymbol(sym.toLowerCase()) + '"></iconify-icon></span>');
        return '<span class="ticker">' + iconHtml + ' ' + pair + ' <span class="' + cls + '">' + plus + fmtNum(ch, 2) + '%</span> ' + fmtNum(Number(t.c || 0), 2) + "</span>";
      })
      .filter(Boolean)
      .join("");

    strip.innerHTML = html;
  }

  async function loadInitialData() {
    const token = localStorage.getItem("token");
    const pair = state.symbol.toUpperCase() + "USDT";
    state.pair = pair;
    setText("qtyUnit", state.symbol.toUpperCase());
    setText("cdUnit", "1 " + state.symbol.toUpperCase());

    if (state.isAiq) {
      buildAiqHistory();
      const balanceRes = await fetch("/balance", { headers: { Authorization: "Bearer " + token } });
      if (balanceRes.ok) {
        const b = await balanceRes.json();
        state.cashUsdBalance = Number(b.cash_balance || b.usd_balance || 0);
        state.totalUsdBalance = Number(b.total_usd_balance || b.balance || state.cashUsdBalance || 0);
        renderBalance();
      }
      renderFromTicker(buildAiqTicker());
      setText("tradePair", "AIQUSDT");
      await loadUserTrades();
      return;
    }

    const [balanceRes, tickerRes] = await Promise.all([
      fetch("/balance", { headers: { Authorization: "Bearer " + token } }),
      fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=" + pair)
    ]);

    if (balanceRes.ok) {
      const b = await balanceRes.json();
      state.cashUsdBalance = Number(b.cash_balance || b.usd_balance || 0);
      state.totalUsdBalance = Number(b.total_usd_balance || b.balance || state.cashUsdBalance || 0);
      renderBalance();
    }

    if (tickerRes.ok) {
      const ticker = await tickerRes.json();
      renderFromTicker(ticker);
    }
    await loadUserTrades();
  }

  function setupTickerSocket() {
    if (state.isAiq) {
      if (state.aiqTimer) clearInterval(state.aiqTimer);
      state.aiqTimer = setInterval(function () {
        renderFromTicker(buildAiqTicker());
        drawAiqChart();
        setConn(true);
      }, 1800);
      return;
    }
    const pair = state.symbol.toLowerCase() + "usdt";
    const url = "wss://stream.binance.com:9443/ws/" + pair + "@ticker";
    try {
      state.wsTicker = new WebSocket(url);
      state.wsTicker.onopen = function () { setConn(true); };
      state.wsTicker.onmessage = function (evt) {
        const ticker = JSON.parse(evt.data || "{}");
        renderFromTicker(ticker);
      };
      state.wsTicker.onclose = function () { setConn(false); setTimeout(setupTickerSocket, 2000); };
      state.wsTicker.onerror = function () { setConn(false); try { state.wsTicker.close(); } catch (_) {} };
    } catch (_) {
      setConn(false);
      setTimeout(setupTickerSocket, 2500);
    }
  }

  function setupTradesSocket() {
    if (state.isAiq) {
      if (state.aiqTradesTimer) clearInterval(state.aiqTradesTimer);
      state.aiqTradesTimer = setInterval(function () {
        var px = Number((state.aiqPrice + (Math.random() - 0.5) * 0.15).toFixed(2));
        var qty = Number((0.2 + Math.random() * 1.5).toFixed(4));
        appendTradeRow(px, qty, Math.random() > 0.52 ? "buy" : "sell");
      }, 1600);
      return;
    }
    const pair = state.symbol.toLowerCase() + "usdt";
    const url = "wss://stream.binance.com:9443/ws/" + pair + "@trade";
    try {
      state.wsTrades = new WebSocket(url);
      state.wsTrades.onopen = function () { setConn(true); };
      state.wsTrades.onmessage = function (evt) {
        const t = JSON.parse(evt.data || "{}");
        const price = Number(t.p || 0);
        const qty = Number(t.q || 0);
        const side = t.m ? "sell" : "buy";
        if (price > 0) appendTradeRow(price, qty, side);
      };
      state.wsTrades.onclose = function () { setConn(false); setTimeout(setupTradesSocket, 2000); };
      state.wsTrades.onerror = function () { setConn(false); try { state.wsTrades.close(); } catch (_) {} };
    } catch (_) {
      setConn(false);
      setTimeout(setupTradesSocket, 2500);
    }
  }

  function setupStripSocket() {
    if (state.isAiq) {
      state.stripMap = {
        AIQUSDT: { s: "AIQUSDT", c: state.aiqPrice, P: 221.48 },
        BTCUSDT: { s: "BTCUSDT", c: 70389.3, P: 0.34 },
        ETHUSDT: { s: "ETHUSDT", c: 3920.5, P: 0.77 },
        BNBUSDT: { s: "BNBUSDT", c: 608.2, P: -0.21 },
        XRPUSDT: { s: "XRPUSDT", c: 0.71, P: 0.42 },
        SOLUSDT: { s: "SOLUSDT", c: 189.9, P: 1.02 }
      };
      renderStripFromMap();
      return;
    }
    var url = "wss://stream.binance.com:9443/ws/!ticker@arr";
    try {
      state.wsStrip = new WebSocket(url);
      state.wsStrip.onopen = function () { setConn(true); };
      state.wsStrip.onmessage = function (evt) {
        var arr = JSON.parse(evt.data || "[]");
        if (!Array.isArray(arr)) return;
        arr.forEach(function (t) {
          var s = String(t.s || "").toUpperCase();
          if (s.endsWith("USDT")) state.stripMap[s] = t;
        });
        renderStripFromMap();
      };
      state.wsStrip.onclose = function () { setConn(false); setTimeout(setupStripSocket, 2000); };
      state.wsStrip.onerror = function () { setConn(false); try { state.wsStrip.close(); } catch (_) {} };
    } catch (_) {
      setConn(false);
      setTimeout(setupStripSocket, 2500);
    }
  }

  function setConn(ok) {
    var left = document.getElementById("tradeConnLeft");
    var right = document.getElementById("tradeConnRight");
    if (!left || !right) return;
    right.textContent = new Date().toLocaleTimeString();
    if (ok) {
      left.innerHTML = '<iconify-icon icon="tabler:chart-candle"></iconify-icon> <span class="ok">Stable connection</span>';
    } else {
      left.innerHTML = '<iconify-icon icon="lucide:badge-dollar-sign"></iconify-icon> <span class="bad">Reconnecting...</span>';
    }
  }

  async function openLong() {
    const token = localStorage.getItem("token");
    const usd = Number(document.getElementById("usdAmount").value || 0);
    const orderType = document.getElementById("orderType").value;
    const leverage = clamp(numInput("leverageInput", 2), 1, 10);
    const tp = Math.max(0, numInput("tpInput", 8));
    const sl = Math.max(0, numInput("slInput", 3));
    if (!usd || usd <= 0) return setStatus("Enter a valid amount.", false);

    try {
      const authOk = await confirmTradePassword(token, "open a long position");
      if (!authOk) return;

      const res = await fetch("/api/trade/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ symbol: state.symbol, usd_amount: usd })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Trade failed");

      setStatus("Long filled (" + orderType + ", " + leverage + "x, TP " + tp + "%, SL " + sl + "%): +" + Number(data.quantity || 0).toFixed(8) + " " + state.symbol.toUpperCase(), true);
      document.getElementById("usdAmount").value = "";
      document.getElementById("sizeRange").value = "0";
      await loadInitialData();
      renderEstimate();
      await loadUserTrades();
    } catch (e) {
      setStatus(e.message || "Open long failed", false);
    }
  }

  async function openShort() {
    const token = localStorage.getItem("token");
    const usd = Number(document.getElementById("usdAmount").value || 0);
    const orderType = document.getElementById("orderType").value;
    const leverage = clamp(numInput("leverageInput", 2), 1, 10);
    const tp = Math.max(0, numInput("tpInput", 8));
    const sl = Math.max(0, numInput("slInput", 3));
    if (!usd || usd <= 0) return setStatus("Enter a valid amount.", false);

    try {
      const authOk = await confirmTradePassword(token, "open a short position");
      if (!authOk) return;

      const res = await fetch("/api/trade/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ symbol: state.symbol, usd_amount: usd })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Trade failed");

      setStatus("Close filled (" + orderType + ", " + leverage + "x, TP " + tp + "%, SL " + sl + "%): -" + Number(data.quantity || 0).toFixed(8) + " " + state.symbol.toUpperCase(), true);
      document.getElementById("usdAmount").value = "";
      document.getElementById("sizeRange").value = "0";
      await loadInitialData();
      renderEstimate();
      await loadUserTrades();
    } catch (e) {
      setStatus(e.message || "Open short failed", false);
    }
  }

  function syncSliderToAmount() {
    const slider = document.getElementById("sizeRange");
    const pct = Number(slider.value || 0) / 100;
    const usd = state.cashUsdBalance * pct;
    document.getElementById("usdAmount").value = usd > 0 ? usd.toFixed(2) : "";
    renderEstimate();
  }

  function syncAmountToSlider() {
    const usd = Number(document.getElementById("usdAmount").value || 0);
    const pct = state.cashUsdBalance > 0 ? Math.min(100, Math.max(0, (usd / state.cashUsdBalance) * 100)) : 0;
    document.getElementById("sizeRange").value = String(Math.round(pct));
    renderEstimate();
  }

  function toggleMode(mode) {
    state.mode = mode;
    document.getElementById("modeBuy").classList.toggle("active", mode === "buy");
    document.getElementById("modeBuy").classList.toggle("buy", mode === "buy");
    document.getElementById("modeSell").classList.toggle("active", mode === "sell");
    document.getElementById("modeSell").classList.toggle("sell", mode === "sell");
  }

  function initTv() {
    if (state.isAiq) {
      setRangeButtons();
      drawAiqChart();
      return;
    }
    var tools = document.querySelector(".chart-tools");
    if (tools) tools.style.display = "none";
    if (!window.TradingView) return;
    new window.TradingView.widget({
      container_id: "tv_chart_container",
      symbol: tvSymbol(state.symbol),
      interval: "1",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      toolbar_bg: "#000000",
      withdateranges: true,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      enable_publishing: false,
      autosize: true,
      overrides: {
        "paneProperties.background": "#000000",
        "paneProperties.vertGridProperties.color": "#151b24",
        "paneProperties.horzGridProperties.color": "#151b24",
        "mainSeriesProperties.candleStyle.upColor": "#16c784",
        "mainSeriesProperties.candleStyle.downColor": "#ea3943",
        "mainSeriesProperties.candleStyle.borderUpColor": "#16c784",
        "mainSeriesProperties.candleStyle.borderDownColor": "#ea3943",
        "mainSeriesProperties.candleStyle.wickUpColor": "#16c784",
        "mainSeriesProperties.candleStyle.wickDownColor": "#ea3943"
      }
    });
  }

  function ensureAuthModal() {
    if (document.getElementById("tradeAuthModal")) return;

    var style = document.createElement("style");
    style.id = "trade-auth-modal-styles";
    style.textContent = [
      ".trade-auth-modal{position:fixed;inset:0;display:none;align-items:center;justify-content:center;background:rgba(3,8,15,.7);z-index:3000;padding:16px;}",
      ".trade-auth-modal.open{display:flex;}",
      ".trade-auth-card{width:min(430px,96vw);background:linear-gradient(145deg,rgba(11,20,33,.98),rgba(9,16,27,.98));border:1px solid rgba(73,106,153,.45);border-radius:16px;padding:18px;box-shadow:0 24px 54px rgba(0,0,0,.45);}",
      ".trade-auth-title{font-size:20px;font-weight:800;margin:0 0 6px;}",
      ".trade-auth-sub{font-size:13px;color:#9db1cc;margin:0 0 12px;}",
      ".trade-auth-input{width:100%;min-height:44px;border:1px solid #2f4460;border-radius:10px;background:#121e2f;color:#e6eef8;padding:0 12px;}",
      ".trade-auth-row{display:flex;gap:10px;justify-content:flex-end;margin-top:14px;}",
      ".trade-auth-btn{min-height:40px;padding:0 14px;border-radius:10px;border:1px solid #324a67;background:#111b2b;color:#dce9fa;font-weight:700;}",
      ".trade-auth-btn.primary{background:#2d7dff;border-color:#2d7dff;color:#fff;}",
      ".trade-auth-error{min-height:18px;margin-top:8px;font-size:12px;color:#ff9ea2;}"
    ].join("");
    document.head.appendChild(style);

    var modal = document.createElement("div");
    modal.id = "tradeAuthModal";
    modal.className = "trade-auth-modal";
    modal.innerHTML =
      '<div class="trade-auth-card" role="dialog" aria-modal="true" aria-labelledby="tradeAuthTitle">' +
        '<h4 class="trade-auth-title" id="tradeAuthTitle">Confirm Trade</h4>' +
        '<p class="trade-auth-sub" id="tradeAuthSub">Enter your account password to continue.</p>' +
        '<input id="tradeAuthPassword" class="trade-auth-input" type="password" placeholder="Account password" />' +
        '<div id="tradeAuthError" class="trade-auth-error"></div>' +
        '<div class="trade-auth-row">' +
          '<button type="button" class="trade-auth-btn" id="tradeAuthCancel">Cancel</button>' +
          '<button type="button" class="trade-auth-btn primary" id="tradeAuthConfirm">Confirm</button>' +
        '</div>' +
      "</div>";
    document.body.appendChild(modal);
  }

  function showTradeAuthModal(actionLabel) {
    ensureAuthModal();
    var modal = document.getElementById("tradeAuthModal");
    var input = document.getElementById("tradeAuthPassword");
    var err = document.getElementById("tradeAuthError");
    var sub = document.getElementById("tradeAuthSub");
    var cancel = document.getElementById("tradeAuthCancel");
    var confirm = document.getElementById("tradeAuthConfirm");

    if (sub) sub.textContent = "Enter your account password to " + actionLabel + ".";
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

  async function confirmTradePassword(token, actionLabel) {
    var label = actionLabel || (state.mode === "sell" ? "close this trade" : "open this trade");
    var modalResult = await showTradeAuthModal(label);
    const password = modalResult.password;

    if (!modalResult.ok) {
      setStatus("Trade canceled.", false);
      return false;
    }
    if (!String(password).trim()) {
      setStatus("Password is required.", false);
      return false;
    }

    const res = await fetch("/api/auth/verify-password", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ password: password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus(data.error || "Authentication failed", false);
      return false;
    }
    return true;
  }

  document.addEventListener("DOMContentLoaded", function () {
    state.symbol = normalizeSymbol(state.symbol);
    state.isAiq = state.symbol === "aiq";
    ensureAuthModal();
    document.getElementById("usdAmount").addEventListener("input", syncAmountToSlider);
    document.getElementById("sizeRange").addEventListener("input", syncSliderToAmount);
    document.getElementById("openLongBtn").addEventListener("click", openLong);
    document.getElementById("openShortBtn").addEventListener("click", openShort);
    document.getElementById("modeBuy").addEventListener("click", function () { toggleMode("buy"); });
    document.getElementById("modeSell").addEventListener("click", function () { toggleMode("sell"); });
    document.getElementById("orderType").addEventListener("change", setOrderTypeMode);
    document.getElementById("leverageInput").addEventListener("input", renderEstimate);
    document.getElementById("tpInput").addEventListener("input", renderRiskSummary);
    document.getElementById("slInput").addEventListener("input", renderRiskSummary);
    document.querySelectorAll(".range-btn[data-range]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!state.isAiq) return;
        state.aiqRange = btn.getAttribute("data-range") || "5y";
        setRangeButtons();
        drawAiqChart();
      });
    });
    setOrderTypeMode();
    renderRiskSummary();

    loadInitialData()
      .then(function () {
        setupTickerSocket();
        setupTradesSocket();
        setupStripSocket();
        initTv();
      })
      .catch(function (e) {
        setStatus(e.message || "Failed to load trade data", false);
      });
  });
})();
