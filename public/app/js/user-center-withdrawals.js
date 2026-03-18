(function () {
  function fmtUsd(v) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v || 0));
  }

  async function request(path, opts) {
    var res = await fetch(path, opts || {});
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  async function loadBalance() {
    var token = localStorage.getItem("token");
    var bal = await request("/balance", { headers: { Authorization: "Bearer " + token } });
    var cash = Number(bal.cash_balance || bal.usd_balance || 0);
    document.getElementById("availableBalance").value = fmtUsd(cash);
    return cash;
  }

  async function submitWithdrawal() {
    var btn = document.getElementById("submitWithdrawBtn");
    var status = document.getElementById("withdrawStatus");
    var token = localStorage.getItem("token");
    var amount = Number(document.getElementById("withdrawAmount").value || 0);

    if (!Number.isFinite(amount) || amount <= 0) {
      status.textContent = "Enter a valid amount.";
      return;
    }

    btn.disabled = true;
    status.textContent = "Submitting withdrawal request...";

    try {
      var data = await request("/withdraw", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ amount: amount })
      });

      var fee = Number(data.fee || 0);
      status.textContent = "Request submitted. Fee: " + fmtUsd(fee) + ". Status: pending.";
      document.getElementById("withdrawAmount").value = "";
      await loadBalance();
    } catch (err) {
      status.textContent = err.message || "Withdrawal failed";
    } finally {
      btn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = document.getElementById("submitWithdrawBtn");
    if (btn) btn.addEventListener("click", submitWithdrawal);

    loadBalance().catch(function (err) {
      var status = document.getElementById("withdrawStatus");
      if (status) status.textContent = err.message || "Failed to load balance";
    });
  });
})();
