(function () {
  function consumeTokenFromUrl() {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      localStorage.setItem("token", token);
      url.searchParams.delete("token");
      window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
    }
  }

  async function ensureAuthenticated() {
    consumeTokenFromUrl();

    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login.html";
      return;
    }

    try {
      const response = await fetch("/balance", {
        headers: {
          Authorization: "Bearer " + token
        }
      });

      if (!response.ok) {
        localStorage.removeItem("token");
        window.location.href = "/login.html";
        return;
      }
    } catch (error) {
      localStorage.removeItem("token");
      window.location.href = "/login.html";
    }
  }

  document.addEventListener("DOMContentLoaded", ensureAuthenticated);
})();
