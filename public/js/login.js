cdocument.addEventListener("DOMContentLoaded", function () {

  const loginBtn = document.getElementById("loginBtn");

  loginBtn.addEventListener("click", async function () {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        alert("Connexion réussie");
      } else {
        alert(data.error || "Erreur login");
      }

    } catch (error) {
      alert("Erreur serveur");
      console.error(error);
    }

  });

});


