(function () {
  function getPrimaryForm(sectionSelector) {
    const section = document.querySelector(sectionSelector);
    if (!section) return null;
    const forms = section.querySelectorAll(".content-tab .content-inner form");
    return forms.length > 0 ? forms[0] : null;
  }

  function getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    let data = {};
    try {
      data = await res.json();
    } catch (e) {
      data = {};
    }

    if (!res.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data;
  }

  function socialContainer(mode) {
    const wrap = document.createElement("div");
    wrap.style.marginTop = "12px";
    wrap.style.display = "grid";
    wrap.style.gap = "10px";

    const googleBtn = document.createElement("button");
    googleBtn.type = "button";
    googleBtn.className = "btn-action";
    googleBtn.textContent = mode === "register" ? "Sign up with Google" : "Continue with Google";
    googleBtn.addEventListener("click", function () {
      window.location.href = "/auth/google/start";
    });

    const appleBtn = document.createElement("button");
    appleBtn.type = "button";
    appleBtn.className = "btn-action";
    appleBtn.textContent = mode === "register" ? "Sign up with Apple" : "Continue with Apple";
    appleBtn.addEventListener("click", function () {
      window.location.href = "/auth/apple/start";
    });

    wrap.appendChild(googleBtn);
    wrap.appendChild(appleBtn);
    return wrap;
  }

  function injectSocialButtons(form, mode) {
    if (!form || form.dataset.socialReady === "1") return;
    const submitButton = form.querySelector('button[type="submit"]');
    const slot = socialContainer(mode);
    if (submitButton && submitButton.parentNode) {
      submitButton.parentNode.insertBefore(slot, submitButton.nextSibling);
    } else {
      form.appendChild(slot);
    }
    form.dataset.socialReady = "1";
  }

  function bindLogin() {
    const modernForm = document.getElementById("neuraLoginForm");
    if (modernForm) {
      bindModernLogin(modernForm);
      return;
    }

    const form = getPrimaryForm("section.register.login");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const emailInput = form.querySelector('input[type="email"]');
      const passwordInput = form.querySelector('input[type="password"]');
      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }

      try {
        const data = await postJson("/api/login", { email: email, password: password });
        if (data.token) {
          localStorage.setItem("token", data.token);
        }
        window.location.href = "/user-center/assets/dashboard.html";
      } catch (err) {
        alert(err.message || "Login failed");
      }
    });
  }

  function bindModernLogin(form) {
    const emailInput = form.querySelector("#loginEmail");
    const passwordInput = form.querySelector("#loginPassword");
    const statusEl = document.getElementById("loginStatus");
    const submitBtn = document.getElementById("loginSubmitBtn");

    function setStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.style.color = isError ? "#ff9ba2" : "#8de4b6";
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      const password = passwordInput ? passwordInput.value : "";
      if (!email || !password) {
        setStatus("Please enter email and password.", true);
        return;
      }
      if (submitBtn) submitBtn.disabled = true;
      setStatus("Logging in...");
      try {
        const data = await postJson("/api/login", { email: email, password: password });
        if (data.token) localStorage.setItem("token", data.token);
        window.location.href = "/user-center/assets/dashboard.html";
      } catch (err) {
        setStatus(err.message || "Login failed", true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    bindForgotPassword();
  }

  function bindForgotPassword() {
    const modal = document.getElementById("forgotPasswordModal");
    const openBtn = document.getElementById("forgotPasswordBtn");
    const cancelBtn = document.getElementById("fpCancelBtn");
    const sendBtn = document.getElementById("fpSendCodeBtn");
    const resetBtn = document.getElementById("fpResetBtn");
    const emailInput = document.getElementById("fpEmail");
    const codeInput = document.getElementById("fpCode");
    const newPasswordInput = document.getElementById("fpNewPassword");
    const statusEl = document.getElementById("fpStatus");
    if (!modal || !openBtn || !cancelBtn || !sendBtn || !resetBtn) return;

    function setStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.style.color = isError ? "#ff9ba2" : "#8de4b6";
    }

    function openModal() {
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      if (emailInput) emailInput.focus();
    }

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
    }

    openBtn.addEventListener("click", openModal);
    cancelBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", function (e) {
      if (e.target === modal) closeModal();
    });

    sendBtn.addEventListener("click", async function () {
      const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      if (!email) return setStatus("Enter your account email first.", true);
      sendBtn.disabled = true;
      setStatus("Sending reset code...");
      try {
        const data = await postJson("/api/auth/forgot-password/send-code", { email: email });
        if (!data || !data.sent) throw new Error("Reset code was not sent");
        setStatus("Reset code sent. Check your inbox.");
      } catch (err) {
        setStatus(err.message || "Failed to send reset code", true);
      } finally {
        sendBtn.disabled = false;
      }
    });

    resetBtn.addEventListener("click", async function () {
      const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      const code = codeInput ? codeInput.value.trim() : "";
      const newPassword = newPasswordInput ? newPasswordInput.value : "";
      if (!email || !code || !newPassword) {
        return setStatus("Email, code and new password are required.", true);
      }
      if (newPassword.length < 8) {
        return setStatus("Password must be at least 8 characters.", true);
      }
      resetBtn.disabled = true;
      setStatus("Resetting password...");
      try {
        await postJson("/api/auth/forgot-password/reset", {
          email: email,
          code: code,
          new_password: newPassword
        });
        setStatus("Password reset successful. You can login now.");
      } catch (err) {
        setStatus(err.message || "Password reset failed", true);
      } finally {
        resetBtn.disabled = false;
      }
    });
  }

  function bindRegister() {
    const modernForm = document.getElementById("neuraRegisterForm");
    if (modernForm) {
      bindModernRegister(modernForm);
      return;
    }

    const form = getPrimaryForm("section.register");
    if (!form) return;

    injectSocialButtons(form, "register");
    let verificationToken = "";
    let verifiedEmail = "";

    if (!document.getElementById("verifyWrap")) {
      const wrap = document.createElement("div");
      wrap.id = "verifyWrap";
      wrap.style.margin = "10px 0 14px";
      wrap.innerHTML =
        '<label style="display:block;margin-bottom:6px;">Email Verification Code</label>' +
        '<div style="display:grid;grid-template-columns:1fr auto;gap:8px;">' +
          '<input id="verifyCodeInput" type="text" class="form-control" placeholder="Enter 6-digit code" />' +
          '<button type="button" id="sendCodeBtn" class="btn-action" style="white-space:nowrap;padding:0 14px;">Send Code</button>' +
        "</div>" +
        '<div style="margin-top:8px;display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
          '<button type="button" id="verifyCodeBtn" class="btn-action" style="padding:0 14px;">Verify Email</button>' +
          '<span id="verifyStatus" style="font-size:12px;color:#9fb3cd;"></span>' +
        "</div>";
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton && submitButton.parentNode) {
        submitButton.parentNode.insertBefore(wrap, submitButton);
      } else {
        form.appendChild(wrap);
      }
    }

    const statusEl = form.querySelector("#verifyStatus");
    const codeInput = form.querySelector("#verifyCodeInput");
    const sendBtn = form.querySelector("#sendCodeBtn");
    const verifyBtn = form.querySelector("#verifyCodeBtn");
    const emailInput = form.querySelector('input[type="email"]');
    function setVerifyStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.style.color = isError ? "#ff9ba2" : "#9fd2ad";
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", async function () {
        const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        if (!email) return setVerifyStatus("Enter your email first.", true);
        verificationToken = "";
        verifiedEmail = "";
        sendBtn.disabled = true;
        setVerifyStatus("Sending code...");
        try {
          const data = await postJson("/api/auth/send-verification", { email: email });
          if (!data || !data.sent) {
            throw new Error("Verification email was not sent");
          }
          setVerifyStatus("Verification code sent. Check your inbox.");
        } catch (err) {
          setVerifyStatus(err.message || "Failed to send verification code", true);
        } finally {
          sendBtn.disabled = false;
        }
      });
    }

    if (verifyBtn) {
      verifyBtn.addEventListener("click", async function () {
        const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        const code = codeInput ? codeInput.value.trim() : "";
        if (!email || !code) return setVerifyStatus("Enter email and verification code.", true);
        verifyBtn.disabled = true;
        setVerifyStatus("Verifying...");
        try {
          const data = await postJson("/api/auth/verify-email", { email: email, code: code });
          verificationToken = data.verification_token || "";
          verifiedEmail = email;
          setVerifyStatus("Email verified successfully.");
        } catch (err) {
          setVerifyStatus(err.message || "Verification failed", true);
        } finally {
          verifyBtn.disabled = false;
        }
      });
    }

    if (emailInput) {
      emailInput.addEventListener("input", function () {
        if (verifiedEmail && verifiedEmail !== emailInput.value.trim().toLowerCase()) {
          verificationToken = "";
          verifiedEmail = "";
          setVerifyStatus("Email changed. Please verify again.", true);
        }
      });
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const passwordInputs = form.querySelectorAll('input[type="password"]');
      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInputs[0] ? passwordInputs[0].value : "";
      const passwordConfirm = passwordInputs[1] ? passwordInputs[1].value : password;

      if (!email || !password) {
        alert("Please enter email and password.");
        return;
      }

      if (password !== passwordConfirm) {
        alert("Passwords do not match.");
        return;
      }
      if (!verificationToken || verifiedEmail !== email.toLowerCase()) {
        alert("Please verify your email before creating your account.");
        return;
      }

      try {
        await registerAndLogin(email, password, verificationToken);
      } catch (err) {
        alert(err.message || "Registration failed");
      }
    });
  }

  async function registerAndLogin(email, password, verificationToken) {
    await postJson("/api/register", {
      email: email,
      password: password,
      verification_token: verificationToken
    });
    const loginData = await postJson("/api/login", { email: email, password: password });
    if (loginData.token) {
      localStorage.setItem("token", loginData.token);
    }
    window.location.href = "/user-center/assets/dashboard.html";
  }

  function bindModernRegister(form) {
    let verificationToken = "";
    let verifiedEmail = "";
    let sentEmail = "";

    const stepBasic = form.querySelector("#stepBasic");
    const stepVerify = form.querySelector("#stepVerify");
    const progress1 = document.getElementById("registerProgress1");
    const progress2 = document.getElementById("registerProgress2");

    const emailInput = form.querySelector("#registerEmail");
    const passwordInput = form.querySelector("#registerPassword");
    const passwordConfirmInput = form.querySelector("#registerPasswordConfirm");
    const codeInput = form.querySelector("#verifyCodeInput");

    const continueBtn = form.querySelector("#goToVerifyBtn");
    const backBtn = form.querySelector("#goBackBtn");
    const sendBtn = form.querySelector("#sendCodeBtn");
    const verifyBtn = form.querySelector("#verifyCodeBtn");
    const statusEl = form.querySelector("#verifyStatus");

    function setVerifyStatus(msg, isError) {
      if (!statusEl) return;
      statusEl.textContent = msg || "";
      statusEl.style.color = isError ? "#ff9ba2" : "#8de4b6";
    }

    function showStep(stepNumber) {
      const isBasic = stepNumber === 1;
      if (stepBasic) stepBasic.classList.toggle("hidden", !isBasic);
      if (stepVerify) stepVerify.classList.toggle("hidden", isBasic);
      if (progress1) progress1.classList.add("active");
      if (progress2) progress2.classList.toggle("active", !isBasic);
    }

    async function sendCode() {
      const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
      if (!email) {
        setVerifyStatus("Enter your email first.", true);
        return;
      }
      sendBtn.disabled = true;
      verificationToken = "";
      verifiedEmail = "";
      setVerifyStatus("Sending code...");
      try {
        const data = await postJson("/api/auth/send-verification", { email: email });
        if (!data || !data.sent) {
          throw new Error("Verification email was not sent");
        }
        sentEmail = email;
        setVerifyStatus("Verification code sent. Check your inbox.");
      } catch (err) {
        setVerifyStatus(err.message || "Failed to send verification code", true);
      } finally {
        sendBtn.disabled = false;
      }
    }

    if (emailInput) {
      emailInput.addEventListener("input", function () {
        if (verifiedEmail && verifiedEmail !== emailInput.value.trim().toLowerCase()) {
          verificationToken = "";
          verifiedEmail = "";
          setVerifyStatus("Email changed. Please verify again.", true);
        }
      });
    }

    if (continueBtn) {
      continueBtn.addEventListener("click", async function () {
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const passwordConfirm = passwordConfirmInput ? passwordConfirmInput.value : "";
        if (!email || !password || !passwordConfirm) {
          setVerifyStatus("Please complete email and password fields.", true);
          return;
        }
        if (password !== passwordConfirm) {
          setVerifyStatus("Passwords do not match.", true);
          return;
        }
        showStep(2);
        if (sentEmail !== email.toLowerCase()) {
          await sendCode();
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        showStep(1);
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", sendCode);
    }

    if (verifyBtn) {
      verifyBtn.addEventListener("click", async function () {
        const email = emailInput ? emailInput.value.trim().toLowerCase() : "";
        const code = codeInput ? codeInput.value.trim() : "";
        if (!email || !code) {
          setVerifyStatus("Enter email and verification code.", true);
          return;
        }
        verifyBtn.disabled = true;
        setVerifyStatus("Verifying...");
        try {
          const data = await postJson("/api/auth/verify-email", { email: email, code: code });
          verificationToken = data.verification_token || "";
          verifiedEmail = email;
          setVerifyStatus("Email verified successfully.");
        } catch (err) {
          setVerifyStatus(err.message || "Verification failed", true);
        } finally {
          verifyBtn.disabled = false;
        }
      });
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const email = emailInput ? emailInput.value.trim() : "";
      const password = passwordInput ? passwordInput.value : "";
      const passwordConfirm = passwordConfirmInput ? passwordConfirmInput.value : "";

      if (!email || !password || !passwordConfirm) {
        setVerifyStatus("Please complete all fields.", true);
        return;
      }
      if (password !== passwordConfirm) {
        setVerifyStatus("Passwords do not match.", true);
        return;
      }
      if (!verificationToken || verifiedEmail !== email.toLowerCase()) {
        setVerifyStatus("Please verify your email before creating your account.", true);
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      setVerifyStatus("Creating your account...");
      try {
        await registerAndLogin(email, password, verificationToken);
      } catch (err) {
        setVerifyStatus(err.message || "Registration failed", true);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  function handleOauthFeedback() {
    const oauthError = getQueryParam("oauth_error");
    if (oauthError) {
      alert("OAuth error: " + oauthError.replace(/_/g, " "));
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    const path = window.location.pathname;
    handleOauthFeedback();

    const hasModernRegister = !!document.getElementById("neuraRegisterForm");

    if (path.endsWith("/login.html") || path === "/login.html") {
      bindLogin();
    }
    if (hasModernRegister || path.endsWith("/register.html") || path === "/register.html" || path.endsWith("/register") || path === "/register") {
      bindRegister();
    }
  });
})();
