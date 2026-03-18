(function () {
  var state = { rows: [] };

  function token() {
    return localStorage.getItem("token") || "";
  }

  function money(v) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v || 0));
  }

  async function request(path) {
    var res = await fetch(path, { headers: { Authorization: "Bearer " + token() } });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }

  function renderWidgets(rows) {
    var totalUsers = rows.length;
    var totalUsd = rows.reduce(function (s, r) { return s + Number(r.balance || 0); }, 0);
    var totalBtc = rows.reduce(function (s, r) { return s + Number(r.btc_balance || 0); }, 0);
    var totalDep = rows.reduce(function (s, r) { return s + Number(r.deposit_count || 0); }, 0);

    document.getElementById("wTotalUsers").textContent = String(totalUsers);
    document.getElementById("wUsd").textContent = money(totalUsd);
    document.getElementById("wBtc").textContent = totalBtc.toFixed(8);
    document.getElementById("wDep").textContent = String(totalDep);
  }

  function renderTable(rows) {
    var body = document.getElementById("adminUsersBody");
    body.innerHTML = rows.map(function (r) {
      var name = [r.first_name || "", r.last_name || ""].join(" ").trim() || r.username || "-";
      var created = r.created_at ? new Date(r.created_at).toLocaleString() : "-";
      return "<tr>" +
        "<td>" + (r.id || "-") + "</td>" +
        "<td>" + (r.email || "-") + "</td>" +
        "<td>" + name + "</td>" +
        "<td>" + (r.phone || "-") + "</td>" +
        "<td>" + (r.role || "user") + "</td>" +
        "<td>" + money(r.balance || 0) + "</td>" +
        "<td>" + Number(r.btc_balance || 0).toFixed(8) + "</td>" +
        "<td>" + Number(r.asset_count || 0) + "</td>" +
        "<td>" + Number(r.trade_count || 0) + "</td>" +
        "<td>" + Number(r.deposit_count || 0) + "</td>" +
        "<td>" + Number(r.withdraw_count || 0) + "</td>" +
        "<td>" + created + "</td>" +
      "</tr>";
    }).join("") || '<tr><td colspan="12">No users</td></tr>';
  }

  function applyFilter() {
    var q = String(document.getElementById("adminSearch").value || "").toLowerCase();
    var rows = state.rows.filter(function (r) {
      var name = [r.first_name || "", r.last_name || "", r.username || "", r.email || "", r.phone || ""].join(" ").toLowerCase();
      return name.indexOf(q) !== -1;
    });
    renderWidgets(rows);
    renderTable(rows);
  }

  async function load() {
    try {
      state.rows = await request("/api/admin/users/details");
      applyFilter();
    } catch (err) {
      alert(err.message || "Failed to load admin dashboard");
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("adminSearch").addEventListener("input", applyFilter);
    load();
  });
})();
