(function () {
  var state = {};

  function token() {
    return localStorage.getItem("token") || "";
  }

  async function request(path, opts) {
    var res = await fetch(path, opts || {});
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function setStatus(message, isError) {
    var el = document.getElementById("fiatStatus");
    if (!el) return;
    el.textContent = message || "";
    el.style.color = isError ? "#ff9b9b" : "#92a4bf";
  }

  function renderHistoryRows(items) {
    var html = (items || [])
      .map(function (d) {
        var date = d.created_at ? new Date(d.created_at).toLocaleString() : "-";
        var link = d.checkout_url
          ? '<a href="' + d.checkout_url + '" target="_blank" rel="noopener">Open</a>'
          : "-";
        return "<tr>" +
          "<td>" + d.id + "</td>" +
          "<td>" + (d.provider_ref || "-") + "</td>" +
          "<td>" + Number(d.amount_usd || 0).toFixed(2) + " USD</td>" +
          "<td>" + String(d.status || "pending") + "</td>" +
          "<td>" + date + "</td>" +
          "<td>" + link + "</td>" +
        "</tr>";
      })
      .join("");

    document.getElementById("fiatHistoryBody").innerHTML =
      html || '<tr><td colspan="6" class="muted">No available record</td></tr>';
  }

  async function loadHistory() {
    try {
      var data = await request("/api/deposits", {
        headers: { Authorization: "Bearer " + token() }
      });
      renderHistoryRows(data);
    } catch (_) {
      document.getElementById("fiatHistoryBody").innerHTML =
        '<tr><td colspan="6" class="muted">History unavailable</td></tr>';
    }
  }

  async function submitFiatDeposit(e) {
    e.preventDefault();
    var submitBtn = document.getElementById("fiatSubmitBtn");
    var amount = Number(document.getElementById("fiatAmount").value || 0);
    var coin = "BTC";

    if (!Number.isFinite(amount) || amount < 20) {
      setStatus("Minimum crypto deposit is 20 USD.", true);
      return;
    }

    submitBtn.disabled = true;
    setStatus("Creating invoice...");

    try {
      var payload = {
        amount: amount,
        currency: "USD",
        coin: coin,
        redirect_url: window.location.origin + "/user-center/assets/deposit/fiat.html"
      };

      var data = await request("/api/deposit/wolvpay/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token()
        },
        body: JSON.stringify(payload)
      });

      if (!data.checkout_url) {
        throw new Error("Deposit created but checkout URL is missing");
      }

      setStatus("Invoice created. Redirecting to checkout...");
      window.location.href = data.checkout_url;
    } catch (err) {
      setStatus(err.message || "Crypto deposit failed", true);
      submitBtn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("fiatCoin").value = "BTC";

    document.getElementById("fiatDepositForm").addEventListener("submit", submitFiatDeposit);

    loadHistory();
    setInterval(loadHistory, 30000);
  });
})();
