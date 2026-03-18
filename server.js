require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const { Pool } = require("pg");
const fetch = require("node-fetch");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;
let marketsCache = [];
let marketsCacheUpdatedAt = 0;

app.use(express.json());


app.use(cors());
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);app.use(express.static(path.join(__dirname, "public")));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
// 🚫 Désactive l’application globale du rate limiter
// app.use(authLimiter);

// 🔒 Limite seulement certaines routes sensibles
app.use("/login", authLimiter);
app.use("/register", authLimiter);
app.use("/api/login", authLimiter);
app.use("/api/register", authLimiter);
// ==========================
// AUTH MIDDLEWARE
// ==========================

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }

    req.user = user;
    next();
  });
}


// Keep limiter on auth endpoints only to avoid global 429 on static/assets.

// ==========================
// DATABASE
// ==========================
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      user: process.env.DB_USER || "WooBarber",
      host: process.env.DB_HOST || "127.0.0.1",
      database: process.env.DB_NAME || "postgres",
      password: process.env.DB_PASSWORD || "",
      port: Number(process.env.DB_PORT || 5432),
    });

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendBrevoEmail(options) {
  const apiKey = String(process.env.BREVO_API_KEY || "").trim();
  if (!apiKey) {
    console.log("BREVO ERROR: missing API key");
    return { ok: false, reason: "BREVO_API_KEY missing" };
  }

  const senderEmail = String(process.env.BREVO_SENDER_EMAIL || "").trim();
  const senderName = String(process.env.BREVO_SENDER_NAME || "Neura").trim();
  const toEmail = normalizeEmail(options && options.to);

  if (!senderEmail) {
    console.log("BREVO ERROR: missing sender email");
    return { ok: false, reason: "BREVO_SENDER_EMAIL missing" };
  }

  if (!toEmail) {
    console.log("BREVO ERROR: missing recipient email");
    return { ok: false, reason: "Recipient email missing" };
  }

const body = {
  sender: { email: "no-reply@neura-wallet.org", name: "Neura" },
  to: [{ email: toEmail }],
  subject: String(options.subject || "Neura update"),
  htmlContent: String(options.htmlContent || ""),
  textContent: String(options.textContent || "")
};

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": apiKey
      },
      body: JSON.stringify(body)
    });

    const payload = await response.json().catch(() => ({}));

    console.log("BREVO STATUS:", response.status);
    console.log("BREVO RESPONSE:", payload);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        payload: payload,
        reason: payload.message || payload.code || "Brevo request failed"
      };
    }

    return { ok: true, payload: payload };
  } catch (error) {
    console.log("BREVO FETCH ERROR:", error.message);
    return { ok: false, reason: error.message };
  }
}

async function sendTradeEmail(userId, action, symbol, usdAmount, quantity, price) {
  try {
    const u = await pool.query("SELECT email, first_name FROM users WHERE id = $1", [userId]);
    if (!u.rows.length || !u.rows[0].email) return;
    const email = u.rows[0].email;
    const name = u.rows[0].first_name || "Trader";
    const side = String(action || "").toUpperCase();
    const html = "<p>Hi " + name + ",</p>" +
      "<p>Your <strong>" + side + "</strong> order was executed.</p>" +
      "<ul>" +
      "<li>Symbol: " + String(symbol || "").toUpperCase() + "</li>" +
      "<li>USD amount: $" + Number(usdAmount || 0).toFixed(2) + "</li>" +
      "<li>Quantity: " + Number(quantity || 0).toFixed(8) + "</li>" +
      "<li>Price: $" + Number(price || 0).toFixed(2) + "</li>" +
      "</ul>" +
      "<p>Neura</p>";
    await sendBrevoEmail({
      to: email,
      subject: "Neura " + side + " order confirmation",
      htmlContent: html,
      textContent: side + " " + String(symbol || "").toUpperCase() + " for $" + Number(usdAmount || 0).toFixed(2)
    });
  } catch (_) {}
}

async function sendDepositCheckoutEmail(userId, amount, checkoutUrl, providerRef) {
  try {
    const u = await pool.query("SELECT email, first_name FROM users WHERE id = $1", [userId]);
    if (!u.rows.length || !u.rows[0].email) return;
    const email = u.rows[0].email;
    const name = u.rows[0].first_name || "User";
    const html = "<p>Hi " + name + ",</p>" +
      "<p>Your deposit invoice is ready.</p>" +
      "<ul>" +
      "<li>Amount: $" + Number(amount || 0).toFixed(2) + "</li>" +
      "<li>Reference: " + String(providerRef || "-") + "</li>" +
      "</ul>" +
      "<p><a href=\"" + String(checkoutUrl || "#") + "\">Open checkout</a></p>" +
      "<p>This checkout session expires in 24 hours.</p>";
    await sendBrevoEmail({
      to: email,
      subject: "Neura deposit invoice checkout",
      htmlContent: html,
      textContent: "Deposit invoice ready. Amount $" + Number(amount || 0).toFixed(2) + ". Checkout: " + String(checkoutUrl || "")
    });
  } catch (_) {}
}

async function sendDepositSuccessEmail(userId, amount, providerRef) {
  try {
    const u = await pool.query("SELECT email, first_name FROM users WHERE id = $1", [userId]);
    if (!u.rows.length || !u.rows[0].email) return;
    const email = u.rows[0].email;
    const name = u.rows[0].first_name || "User";
    const amountNum = Number(amount || 0);
    const html = "<p>Hi " + name + ",</p>" +
      "<p>Your deposit has been confirmed and credited to your Neura Wallet.</p>" +
      "<ul>" +
      "<li>Amount: $" + amountNum.toFixed(2) + "</li>" +
      "<li>Reference: " + String(providerRef || "-") + "</li>" +
      "</ul>" +
      "<p>You can now start trading from your dashboard.</p>" +
      "<p>Neura</p>";
    await sendBrevoEmail({
      to: email,
      subject: "Deposit confirmed - funds credited",
      htmlContent: html,
      textContent:
        "Your deposit is confirmed and credited. Amount $" +
        amountNum.toFixed(2) +
        ". Reference: " +
        String(providerRef || "-")
    });
  } catch (_) {}
}

// ==========================
// LOGIN
// ==========================
app.post("/api/register", async (req, res) => {
  try {
    const { email, password, verification_token } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (!verification_token) {
      return res.status(400).json({ error: "Email verification is required" });
    }

    const normalizedEmail = normalizeEmail(email);
    let verificationData;
    try {
      verificationData = jwt.verify(String(verification_token), process.env.JWT_SECRET);
    } catch (_) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }
    if (!verificationData || verificationData.purpose !== "email_verification" || normalizeEmail(verificationData.email) !== normalizedEmail) {
      return res.status(400).json({ error: "Email verification mismatch" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userColResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'"
    );

    const userCols = new Set(userColResult.rows.map((r) => r.column_name));
    const passwordColumn = userCols.has("password_hash")
      ? "password_hash"
      : userCols.has("password")
      ? "password"
      : null;

    if (!passwordColumn) {
      return res.status(500).json({ error: "Users table must contain password_hash or password column" });
    }

    const fields = ["email", passwordColumn];
    const values = [normalizedEmail, hashedPassword];

    if (userCols.has("username")) {
      const base = normalizedEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 12) || "user";
      const username = `${base}_${Math.floor(Math.random() * 10000)}`;
      fields.push("username");
      values.push(username);
    }

    if (userCols.has("first_name")) {
      const rawName = normalizedEmail.split("@")[0] || "";
      const firstName = rawName
        .replace(/[._-]+/g, " ")
        .split(" ")
        .filter(Boolean)[0] || "User";
      fields.push("first_name");
      values.push(firstName.charAt(0).toUpperCase() + firstName.slice(1));
    }

    if (userCols.has("balance")) {
      fields.push("balance");
      values.push(0);
    }

    if (userCols.has("btc_balance")) {
      fields.push("btc_balance");
      values.push(0);
    }

    const placeholders = fields.map((_, i) => "$" + (i + 1)).join(", ");
    const inserted = await pool.query(`INSERT INTO users (${fields.join(", ")}) VALUES (${placeholders}) RETURNING id`, values);
    const newUserId = inserted.rows.length ? inserted.rows[0].id : null;
    await sendBrevoEmail({
      to: normalizedEmail,
      subject: "Welcome to Neura",
      htmlContent: "<p>Your account has been created successfully.</p><p>You can now log in and start trading.</p>",
      textContent: "Your Neura account has been created successfully."
    });
    if (newUserId) {
      await pool.query("UPDATE email_verifications SET verified = true, verified_at = NOW() WHERE email = $1", [normalizedEmail]);
    }

    res.json({ success: true });
  } catch (error) {
    console.log("Register error:", error);
    if (error && error.code === "23505") {
      return res.status(400).json({ error: "Email already registered" });
    }
    if (error && error.code === "23502") {
      return res.status(400).json({ error: `Missing required column value: ${error.column || "unknown"}` });
    }
    res.status(500).json({ error: "Registration failed" });
  }
});
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const storedPassword = user.password_hash || user.password;

    if (!storedPassword) {
      return res.status(500).json({ error: "User password is not configured correctly" });
    }

    let validPassword = false;
    try {
      validPassword = await bcrypt.compare(password, storedPassword);
    } catch (e) {
      validPassword = false;
    }

    if (!validPassword && password === storedPassword) {
      validPassword = true;
    }

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role || "user" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login error" });
  }
});

app.post("/api/auth/send-verification", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);
    await pool.query(
      "INSERT INTO email_verifications (email, code_hash, expires_at, verified) VALUES ($1,$2,NOW() + INTERVAL '15 minutes', false)",
      [email, codeHash]
    );

    const html = "<p>Your Neura verification code is:</p>" +
      "<h2 style='letter-spacing:2px;'>" + code + "</h2>" +
      "<p>This code expires in 15 minutes.</p>";
const sent = await sendBrevoEmail({
  to: email,
  subject: "Neura email verification code",
  htmlContent: html,
  textContent: "Your verification code is " + code + ". It expires in 15 minutes."
});

if (!sent.ok) {
  console.log("SEND VERIFICATION FAILED:", sent);
  return res.status(502).json({
    error: "Verification send failed",
    details: sent.reason || sent.status || "Unknown Brevo error"
  });
}

console.log("VERIFICATION EMAIL SENT OK TO:", email);

res.json({
  success: true,
  sent: true,
  message: "Verification code sent"
});
  } catch (error) {
    res.status(500).json({ error: "Verification send failed" });
  }
});

app.post("/api/auth/verify-email", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || "").trim();

    if (!email || !code) {
      return res.status(400).json({ error: "Email and code are required" });
    }

    const result = await pool.query(
      "SELECT id, code_hash, expires_at FROM email_verifications WHERE email = $1 AND verified = false ORDER BY id DESC LIMIT 1",
      [email]
    );

    if (!result.rows.length) {
      return res.status(400).json({ error: "No verification code found for this email" });
    }

    const row = result.rows[0];

// const expiryCheck = await pool.query(
//   "SELECT NOW() <= $1::timestamp AS still_valid",
//   [row.expires_at]
// );

// if (!expiryCheck.rows[0].still_valid) {
//   return res.status(400).json({ error: "Verification code expired" });
// }

    const valid = await bcrypt.compare(code, row.code_hash);

    if (!valid) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    await pool.query(
      "UPDATE email_verifications SET verified = true, verified_at = NOW() WHERE id = $1",
      [row.id]
    );

    const verificationToken = jwt.sign(
      { purpose: "email_verification", email: email },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    res.json({
      success: true,
      verification_token: verificationToken
    });
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    res.status(500).json({ error: "Email verification failed" });
  }
});

app.post("/api/auth/forgot-password/reset", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const code = String(req.body.code || "").trim();
    const newPassword = String(req.body.new_password || "");

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: "Email, code and new password are required" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const codeResult = await pool.query(
      "SELECT id, code_hash, expires_at FROM password_resets WHERE email = $1 AND used = false ORDER BY id DESC LIMIT 1",
      [email]
    );
    if (!codeResult.rows.length) {
      return res.status(400).json({ error: "No valid reset code found" });
    }
    const resetRow = codeResult.rows[0];
    if (new Date(resetRow.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: "Reset code expired" });
    }

    const valid = await bcrypt.compare(code, resetRow.code_hash);
    if (!valid) {
      return res.status(400).json({ error: "Invalid reset code" });
    }

    const userColResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'"
    );
    const userCols = new Set(userColResult.rows.map((r) => r.column_name));
    const passwordColumn = userCols.has("password_hash")
      ? "password_hash"
      : userCols.has("password")
      ? "password"
      : null;
    if (!passwordColumn) {
      return res.status(500).json({ error: "Users table password column is missing" });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE users SET " + passwordColumn + " = $1 WHERE email = $2", [hash, email]);
    await pool.query("UPDATE password_resets SET used = true, used_at = NOW() WHERE id = $1", [resetRow.id]);

    return res.json({ success: true, message: "Password has been reset" });
  } catch (error) {
    return res.status(500).json({ error: "Password reset failed" });
  }
});
function appTokenForUser(user) {
  return jwt.sign(
    { id: user.id, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

async function findOrCreateOauthUserByEmail(email) {
  const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  if (existing.rows.length > 0) return existing.rows[0];

  const colsResult = await pool.query(
    "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'"
  );
  const cols = new Set(colsResult.rows.map((r) => r.column_name));
  const fields = ["email"];
  const values = [email];

  if (cols.has("password_hash")) {
    fields.push("password_hash");
    values.push(await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10));
  } else if (cols.has("password")) {
    fields.push("password");
    values.push(await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10));
  }

  if (cols.has("username")) {
    const base = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "").slice(0, 12) || "user";
    fields.push("username");
    values.push(base + "_" + Math.floor(Math.random() * 10000));
  }

  if (cols.has("balance")) { fields.push("balance"); values.push(0); }
  if (cols.has("btc_balance")) { fields.push("btc_balance"); values.push(0); }

  const placeholders = fields.map((_, i) => "$" + (i + 1)).join(", ");
  const sql = "INSERT INTO users (" + fields.join(", ") + ") VALUES (" + placeholders + ") RETURNING *";
  const inserted = await pool.query(sql, values);
  return inserted.rows[0];
}

async function initializeDatabase() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS balance NUMERIC DEFAULT 0");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS btc_balance NUMERIC DEFAULT 0");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT");
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT");
    await pool.query("UPDATE users SET balance = COALESCE(balance, 0), btc_balance = COALESCE(btc_balance, 0)");

    await pool.query("CREATE TABLE IF NOT EXISTS portfolio (user_id INTEGER NOT NULL, symbol TEXT NOT NULL, quantity NUMERIC NOT NULL DEFAULT 0, PRIMARY KEY (user_id, symbol))");
    await pool.query("CREATE TABLE IF NOT EXISTS transactions (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, type TEXT NOT NULL, symbol TEXT, quantity NUMERIC, price NUMERIC, total NUMERIC, created_at TIMESTAMP NOT NULL DEFAULT NOW())");
    await pool.query("CREATE TABLE IF NOT EXISTS deposits (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, provider TEXT NOT NULL, provider_ref TEXT, status TEXT NOT NULL DEFAULT 'pending', amount_usd NUMERIC NOT NULL, checkout_url TEXT, payload TEXT, credited_at TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT NOW())");
    await pool.query("CREATE TABLE IF NOT EXISTS withdrawals (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL, amount NUMERIC NOT NULL, fee NUMERIC NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'pending', approved_at TIMESTAMP, approved_by INTEGER, created_at TIMESTAMP NOT NULL DEFAULT NOW())");
    await pool.query("CREATE TABLE IF NOT EXISTS admin_logs (id SERIAL PRIMARY KEY, admin_id INTEGER NOT NULL, action TEXT NOT NULL, target_id INTEGER, created_at TIMESTAMP NOT NULL DEFAULT NOW())");
    await pool.query("CREATE TABLE IF NOT EXISTS email_verifications (id SERIAL PRIMARY KEY, email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TIMESTAMP NOT NULL, verified BOOLEAN NOT NULL DEFAULT false, verified_at TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT NOW())");
    await pool.query("CREATE TABLE IF NOT EXISTS password_resets (id SERIAL PRIMARY KEY, email TEXT NOT NULL, code_hash TEXT NOT NULL, expires_at TIMESTAMP NOT NULL, used BOOLEAN NOT NULL DEFAULT false, used_at TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT NOW())");
  } catch (error) {
    console.error("Database init error:", error.message);
  }
}

app.get("/auth/google/start", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || (req.protocol + "://" + req.get("host") + "/auth/google/callback");
  if (!clientId) return res.redirect("/login.html?oauth_error=google_not_configured");

  const state = jwt.sign({ provider: "google" }, process.env.JWT_SECRET, { expiresIn: "10m" });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state: state
  });
  res.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + params.toString());
});

app.get("/auth/google/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state;
    if (!code || !state) return res.redirect("/login.html?oauth_error=google_callback_invalid");
    jwt.verify(state, process.env.JWT_SECRET);

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || (req.protocol + "://" + req.get("host") + "/auth/google/callback");
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: process.env.GOOGLE_CLIENT_ID || "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code"
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) return res.redirect("/login.html?oauth_error=google_token_failed");

    const userRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + tokenData.access_token }
    });
    const userData = await userRes.json();
    if (!userRes.ok || !userData.email) return res.redirect("/login.html?oauth_error=google_userinfo_failed");

    const user = await findOrCreateOauthUserByEmail(String(userData.email).toLowerCase());
    const token = appTokenForUser(user);
    res.redirect("/user-center/assets/dashboard.html?token=" + encodeURIComponent(token));
  } catch (error) {
    console.error("Google OAuth error:", error.message);
    res.redirect("/login.html?oauth_error=google_failed");
  }
});

app.get("/auth/apple/start", (req, res) => {
  const clientId = process.env.APPLE_CLIENT_ID;
  const redirectUri = process.env.APPLE_REDIRECT_URI || (req.protocol + "://" + req.get("host") + "/auth/apple/callback");
  if (!clientId) return res.redirect("/login.html?oauth_error=apple_not_configured");

  const state = jwt.sign({ provider: "apple" }, process.env.JWT_SECRET, { expiresIn: "10m" });
  const params = new URLSearchParams({
    response_type: "code",
    response_mode: "query",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "name email",
    state: state
  });
  res.redirect("https://appleid.apple.com/auth/authorize?" + params.toString());
});

app.get("/auth/apple/callback", async (req, res) => {
  try {
    const code = req.query.code;
    const state = req.query.state;
    if (!code || !state) return res.redirect("/login.html?oauth_error=apple_callback_invalid");
    jwt.verify(state, process.env.JWT_SECRET);
    if (!process.env.APPLE_CLIENT_SECRET) return res.redirect("/login.html?oauth_error=apple_client_secret_missing");

    const redirectUri = process.env.APPLE_REDIRECT_URI || (req.protocol + "://" + req.get("host") + "/auth/apple/callback");
    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: String(code),
        client_id: process.env.APPLE_CLIENT_ID || "",
        client_secret: process.env.APPLE_CLIENT_SECRET,
        redirect_uri: redirectUri
      })
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.id_token) return res.redirect("/login.html?oauth_error=apple_token_failed");
    const decoded = jwt.decode(tokenData.id_token) || {};
    if (!decoded.email) return res.redirect("/login.html?oauth_error=apple_email_missing");

    const user = await findOrCreateOauthUserByEmail(String(decoded.email).toLowerCase());
    const token = appTokenForUser(user);
    res.redirect("/user-center/assets/dashboard.html?token=" + encodeURIComponent(token));
  } catch (error) {
    console.error("Apple OAuth error:", error.message);
    res.redirect("/login.html?oauth_error=apple_failed");
  }
});
// ==========================
// BUY
// ==========================

app.post("/buy", authenticateToken, async (req, res) => {
  try {
const userId = 1;
    const { symbol, mode, amount } = req.body;

    const marketResult = await pool.query(
      "SELECT displayed_price FROM markets WHERE symbol = $1",
      [symbol]
    );

    if (marketResult.rows.length === 0) {
      return res.status(400).json({ error: "Asset not found" });
    }

    const price = parseFloat(marketResult.rows[0].displayed_price);

    let quantity;
    let cost;

    if (mode === "usd") {
      cost = amount;
      quantity = amount / price;
    } else if (mode === "quantity") {
      quantity = amount;
      cost = quantity * price;
    } else {
      return res.status(400).json({ error: "Invalid mode" });
    }

    if (cost < 20) {
      return res.status(400).json({ error: "Minimum trade is 20 USD" });
    }

    const userResult = await pool.query(
      "SELECT balance FROM users WHERE id = $1",
      [userId]
    );

    const balance = parseFloat(userResult.rows[0].balance);

    if (balance < cost) {
      return res.status(400).json({ error: "Not enough balance" });
    }

    await pool.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [cost, userId]
    );

    const existing = await pool.query(
      "SELECT quantity FROM portfolio WHERE user_id = $1 AND symbol = $2",
      [userId, symbol]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        "UPDATE portfolio SET quantity = quantity + $1 WHERE user_id = $2 AND symbol = $3",
        [quantity, userId, symbol]
      );
    } else {
      await pool.query(
        "INSERT INTO portfolio (user_id, symbol, quantity) VALUES ($1,$2,$3)",
        [userId, symbol, quantity]
      );
    }

    await pool.query(
      "INSERT INTO transactions (user_id, type, symbol, quantity, price, total) VALUES ($1,$2,$3,$4,$5,$6)",
      [userId, "BUY", symbol, quantity, price, cost]
    );

res.json({
  message: "Login successful",
  token,
  role: user.role
});

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Buy error" });
  }
});

// ==========================
// SELL
// ==========================

app.post("/sell", async (req, res) => {
  try {
    const userId = 1;
    const { symbol, quantity } = req.body;

    if (quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const marketResult = await pool.query(
      "SELECT displayed_price FROM markets WHERE symbol = $1",
      [symbol]
    );

    if (marketResult.rows.length === 0) {
      return res.status(400).json({ error: "Asset not found" });
    }

    const price = parseFloat(marketResult.rows[0].displayed_price);

    const portfolioResult = await pool.query(
      "SELECT quantity FROM portfolio WHERE user_id = $1 AND symbol = $2",
      [userId, symbol]
    );

    if (portfolioResult.rows.length === 0) {
      return res.status(400).json({ error: "Asset not owned" });
    }

    const owned = parseFloat(portfolioResult.rows[0].quantity);

    if (quantity > owned) {
      return res.status(400).json({ error: "Not enough quantity" });
    }

    const value = quantity * price;

    if (value < 20) {
      return res.status(400).json({ error: "Minimum sell is 20 USD" });
    }

    await pool.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2",
      [value, userId]
    );

    const remaining = owned - quantity;

    if (remaining > 0) {
      await pool.query(
        "UPDATE portfolio SET quantity = $1 WHERE user_id = $2 AND symbol = $3",
        [remaining, userId, symbol]
      );
    } else {
      await pool.query(
"DELETE FROM portfolio WHERE user_id = $1 AND symbol = $2",
        [userId, symbol]
      );
    }

    await pool.query(
      "INSERT INTO transactions (user_id, type, symbol, quantity, price, total) VALUES ($1,$2,$3,$4,$5,$6)",
      [userId, "SELL", symbol, quantity, price, value]
    );

    res.json({ message: "Sell successful", value });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Sell error" });
  }
});

// ==========================
// PORTFOLIO
// ==========================

app.get("/portfolio", authenticateToken, async (req, res) => {
  try {

const userId = req.user.id;

    const userResult = await pool.query(
      "SELECT balance FROM users WHERE id = $1",
      [userId]
    );

    const balance = parseFloat(userResult.rows[0].balance);

    const assets = await pool.query(
      `SELECT p.symbol, p.quantity, m.displayed_price
       FROM portfolio p
       JOIN markets m ON p.symbol = m.symbol
       WHERE p.user_id = $1`,
      [userId]
    );

    let totalAssets = 0;

    const formatted = assets.rows.map(asset => {
      const value = asset.quantity * asset.displayed_price;
      totalAssets += value;
      return {
        symbol: asset.symbol,
        quantity: asset.quantity,
        price: asset.displayed_price,
        value
      };
    });

    res.json({
      balance,
      assets: formatted,
      total_portfolio_value: balance + totalAssets
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Portfolio error" });
  }
});

// ==========================
// TRANSACTIONS
// ==========================

app.get("/transactions", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Transaction error" });
  }
});

// ==========================
// WITHDRAW REQUEST
// ==========================

app.post("/withdraw", authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Récupérer balance user
    const userResult = await pool.query(
      "SELECT COALESCE(balance, 0) AS balance, COALESCE(btc_balance, 0) AS btc_balance FROM users WHERE id = $1",
      [req.user.id]
    );

    const balance = parseFloat(userResult.rows[0].balance);

    if (balance < amount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Frais variable (exemple 5%)
    const fee = amount * 0.05;

    // Insérer withdrawal
    await pool.query(
      "INSERT INTO withdrawals (user_id, amount, fee) VALUES ($1, $2, $3)",
      [req.user.id, amount, fee]
    );

    res.json({
      message: "Withdrawal request submitted",
      amount,
      fee,
      status: "pending"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Withdrawal error" });
  }
});

// ==========================
// LOGIN
// ==========================

// ==========================
// LOGIN
// ==========================

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login error" });
  }
});

// ==========================
// ==========================
// REGISTER
// ==========================

app.post("/register", async (req, res) => {
  try {   

    const {
      first_name,
      last_name,
      username,
      email,
      phone,
      password,
      security_phrase
    } = req.body;

    // Vérification champs obligatoires
if (!email || !password || !username) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Vérifier si email existe déjà
    const existingEmail = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (existingEmail.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Vérifier si username existe déjà
    const existingUsername = await pool.query(
      "SELECT id FROM users WHERE username = $1",
      [username]
    );

    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Hash security phrase
    const security_phrase_hash = await bcrypt.hash(security_phrase, 10);

    // Insérer utilisateur
    const result = await pool.query(
      `INSERT INTO users 
      (first_name, last_name, username, email, phone, password_hash, security_phrase_hash)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id, email, username, role`,
      [
        first_name,
        last_name,
        username,
        email,
        phone,
        password_hash,
        security_phrase_hash
      ]
    );

    const user = result.rows[0];

    // Générer token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "User registered successfully",
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Register error" });
  }
});

// ==========================
// ADMIN - Voir tous les utilisateurs
// ==========================

app.get("/admin/users", authenticateToken, async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      "SELECT id, email, balance, role FROM users ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// ADMIN - Voir toutes les demandes de retrait
// ==========================

app.get("/admin/withdrawals", authenticateToken, async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      `SELECT withdrawals.id,
              withdrawals.user_id,
              users.email,
              withdrawals.amount,
              withdrawals.fee,
              withdrawals.status,
              withdrawals.created_at
       FROM withdrawals
       JOIN users ON withdrawals.user_id = users.id
       ORDER BY withdrawals.created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// ADMIN - Valider un retrait (SECURE PRO VERSION)
// ==========================

app.post("/admin/withdrawals/:id/approve", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {

    // Vérifier rôle admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const withdrawalId = req.params.id;

    await client.query("BEGIN");

    // 🔒 Lock withdrawal
    const withdrawalResult = await client.query(
      "SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE",
      [withdrawalId]
    );

    if (withdrawalResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    const withdrawal = withdrawalResult.rows[0];

    // Empêcher double validation
    if (withdrawal.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Already processed" });
    }

    // 🔒 Lock user balance
    const userResult = await client.query(
      "SELECT balance FROM users WHERE id = $1 FOR UPDATE",
      [withdrawal.user_id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Vérifier solde suffisant
    if (Number(user.balance) < Number(withdrawal.amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Déduire le solde
    await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [withdrawal.amount, withdrawal.user_id]
    );

    await client.query(
  "UPDATE withdrawals SET status = 'approved', approved_at = NOW(), approved_by = $2 WHERE id = $1",
  [withdrawalId, req.user.id]
);

await client.query("COMMIT");// Mettre à jour le retrait avec traçabilité
    await client.query(
      "UPDATE withdrawals SET status = 'approved', approved_at = NOW(), approved_by = $2 WHERE id = $1",
      [withdrawalId, req.user.id]
    );

    await client.query("COMMIT");

    res.json({
      message: "Withdrawal approved securely",
      withdrawal_id: withdrawalId
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ==========================
// ADMIN - Voir tous les utilisateurs
// ==========================
app.get("/admin/users", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      "SELECT id, email, balance, role FROM users ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


// ==========================
// ADMIN - Voir toutes les demandes de retrait
// ==========================
app.get("/admin/withdrawals", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const result = await pool.query(
      `SELECT withdrawals.id,
              withdrawals.user_id,
              users.email,
              withdrawals.amount,
              withdrawals.fee,
              withdrawals.status,
              withdrawals.created_at
       FROM withdrawals
       JOIN users ON withdrawals.user_id = users.id
       ORDER BY withdrawals.created_at DESC`
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// ==========================
// ADMIN - Valider un retrait (SECURE + LOG VERSION)
// ==========================

app.post("/admin/withdrawals/:id/approve", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    // Vérifier rôle admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const withdrawalId = req.params.id;

    await client.query("BEGIN");

    // 🔒 Lock withdrawal
    const withdrawalResult = await client.query(
      "SELECT * FROM withdrawals WHERE id = $1 FOR UPDATE",
      [withdrawalId]
    );

    if (withdrawalResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    const withdrawal = withdrawalResult.rows[0];

    // Empêcher double validation
    if (withdrawal.status !== "pending") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Already processed" });
    }

    // 🔒 Lock user
    const userResult = await client.query(
      "SELECT balance FROM users WHERE id = $1 FOR UPDATE",
      [withdrawal.user_id]
    );

    if (userResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "User not found" });
    }

    const user = userResult.rows[0];

    // Vérifier solde
    if (Number(user.balance) < Number(withdrawal.amount)) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Déduire solde
    await client.query(
      "UPDATE users SET balance = balance - $1 WHERE id = $2",
      [withdrawal.amount, withdrawal.user_id]
    );

    // Mettre à jour retrait
    await client.query(
      "UPDATE withdrawals SET status = 'approved', approved_at = NOW(), approved_by = $2 WHERE id = $1",
      [withdrawalId, req.user.id]
    );

    // Log admin
    await client.query(
      "INSERT INTO admin_logs (admin_id, action, target_id) VALUES ($1, $2, $3)",
      [req.user.id, "APPROVED_WITHDRAWAL", withdrawalId]
    );

    await client.query("COMMIT");

    res.json({
      message: "Withdrawal approved securely",
      withdrawal_id: withdrawalId
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Approve error:", error);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// ==========================
// ADMIN - Ajouter du solde
// ==========================
app.post("/admin/users/:id/credit", authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied" });
    }

    const userId = req.params.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    await pool.query(
      "UPDATE users SET balance = balance + $1 WHERE id = $2",
      [amount, userId]
    );

    res.json({ message: "Balance credited successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


// ==========================
// ADMIN DASHBOARD SIMPLE
// ==========================
app.get("/admin", authenticateToken, requireAdmin, (req, res) => {
  res.redirect("/admin/dashboard");
});

app.get("/test", (req, res) => {
  res.send("SERVER OK");
});
app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }

    let userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    let user;

    if (userResult.rows.length === 0) {
      const newUser = await pool.query(
        "INSERT INTO users (email, balance) VALUES ($1, 0) RETURNING *",
        [email]
      );
      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
    }

    res.json({ success: true, user });

  } catch (error) {
    console.log("ERREUR LOGIN:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
app.get("/balance", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT COALESCE(balance, 0) AS balance, COALESCE(btc_balance, 0) AS btc_balance FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const cashBalance = Number(result.rows[0].balance || 0);
    const portfolioUsd = await getUserPortfolioUsdValue(req.user.id);
    const totalUsdBalance = cashBalance + portfolioUsd;
    let totalBtcBalance = Number(result.rows[0].btc_balance || 0);
    try {
      const btcQuote = await getCoinQuote("btc");
      const btcPrice = Number(btcQuote.current_price || 0);
      if (Number.isFinite(btcPrice) && btcPrice > 0) {
        totalBtcBalance = totalUsdBalance / btcPrice;
      }
    } catch (_) {}

    res.json({
      usd_balance: cashBalance,
      cash_balance: cashBalance,
      portfolio_usd_value: portfolioUsd,
      total_usd_balance: totalUsdBalance,
      btc_balance: result.rows[0].btc_balance,
      total_btc_balance: totalBtcBalance,
      balance: totalUsdBalance
    });

  } catch (error) {
    console.log("Balance error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/dev/topup", authenticateToken, async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_TOPUP !== "true") {
      return res.status(403).json({ error: "Dev top-up disabled in production" });
    }

    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    await pool.query(
      "UPDATE users SET balance = COALESCE(balance, 0) + $1 WHERE id = $2",
      [amount, req.user.id]
    );

    const updated = await pool.query(
      "SELECT COALESCE(balance, 0) AS balance FROM users WHERE id = $1",
      [req.user.id]
    );

    res.json({
      success: true,
      credited: amount,
      cash_balance: Number(updated.rows[0].balance || 0)
    });
  } catch (error) {
    res.status(500).json({ error: "Top-up failed" });
  }
});
app.post("/login", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email requis" });
    }

    let userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    let user;

    if (userResult.rows.length === 0) {
      const newUser = await pool.query(
        "INSERT INTO users (email, balance) VALUES ($1, 0) RETURNING *",
        [email]
      );
      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
    }

    res.json({ success: true, user });

  } catch (error) {
    console.log("ERREUR LOGIN:", error.message);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.get("/markets/simple", async (req, res) => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd"
    );

    const data = await response.json();
    res.json(data);

  } catch (error) {
    res.status(500).json({ error: "Market fetch failed" });
  }
});

app.get("/markets", async (req, res) => {
  try {
    const now = Date.now();
    if (marketsCache.length > 0 && now - marketsCacheUpdatedAt < 30000) {
      return res.json(marketsCache);
    }

    const response = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=25&page=1&sparkline=true&price_change_percentage=24h",
      {
        headers: {
          "accept": "application/json",
          "user-agent": "my-marketplace/1.0"
        }
      }
    );

    if (!response.ok) {
      if (marketsCache.length > 0) {
        return res.json(marketsCache);
      }
      return res.status(response.status).json({ error: "Market fetch failed" });
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      if (marketsCache.length > 0) {
        return res.json(marketsCache);
      }
      return res.status(502).json({ error: "Invalid market payload" });
    }

    marketsCache = data;
    marketsCacheUpdatedAt = now;
    res.json(data);

  } catch (error) {
    if (marketsCache.length > 0) {
      return res.json(marketsCache);
    }
    res.status(500).json({ error: "Market fetch failed" });
  }
});
// ==========================
// CREATE PAYMENT
// ==========================

app.post("/create-payment", async (req, res) => {
  try {
    const { amount, currency, coin } = req.body;

    if (!amount || !currency || !coin) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const response = await fetch("https://wolvpay.com/api/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.WOLVPAY_API_KEY}`
      },
      body: JSON.stringify({
        amount: amount,
        currency: currency,
        coin: coin
      })
    });

    const data = await response.json();

    console.log("RAW RESPONSE:", data);

    res.json(data);

  } catch (error) {
    console.error("FULL ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

function extractCheckoutUrlFromObject(input, options) {
  const opts = options || {};
  const ignoredUrls = new Set((opts.ignoredUrls || []).filter(Boolean));
  const preferKey = /(checkout|hosted|invoice|payment).*url|url.*(checkout|hosted|invoice|payment)/i;
  const avoidKey = /(redirect|success|cancel|callback).*url|url.*(redirect|success|cancel|callback)/i;
  const seen = new Set();
  const q = [input];
  let fallback = "";

  while (q.length) {
    const cur = q.shift();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    for (const [k, v] of Object.entries(cur)) {
      if (typeof v === "string") {
        const isHttp = /^https?:\/\//i.test(v);
        if (!isHttp) continue;
        if (ignoredUrls.has(v)) continue;

        const looksLikeWolvCheckout = /wolv/i.test(v) && /(checkout|invoice|pay|payment)/i.test(v);
        if (preferKey.test(k) || looksLikeWolvCheckout) {
          return v;
        }

        if (!avoidKey.test(k) && !fallback) {
          fallback = v;
        }
      } else if (v && typeof v === "object") {
        q.push(v);
      }
    }
  }

  return fallback;
}
function extractWolvpayErrorMessage(data) {
  if (!data) return "";
  if (typeof data.message === "string" && data.message.trim()) return data.message.trim();
  if (typeof data.error === "string" && data.error.trim()) return data.error.trim();
  if (data.error && typeof data.error === "object") {
    if (typeof data.error.message === "string" && data.error.message.trim()) return data.error.message.trim();
    if (typeof data.error.type === "string" && typeof data.error.code === "string") {
      return data.error.type + " (" + data.error.code + ")";
    }
  }
  return "";
}
async function createWolvpayPayment(payload) {
  const configured = String(process.env.WOLVPAY_API_URL || "").trim();
  const configuredInvoices = configured
    ? (configured.replace(/\/$/, "").endsWith("/invoices")
      ? configured.replace(/\/$/, "")
      : configured.replace(/\/$/, "") + "/invoices")
    : "";
  const candidates = [
    configuredInvoices,
    "https://wolvpay.com/api/v1/invoices",
    "https://api.wolvpay.com/api/v1/invoices"
  ].filter(Boolean);

  const variants = [
    payload,
    {
      amount: payload.amount,
      currency: payload.currency,
      coin: payload.coin,
      description: payload.description,
      white_label: false,
      redirect_url: payload.redirect_url
    },
    {
      amount: payload.amount,
      currency: payload.currency,
      coin: payload.coin,
      description: payload.description,
      white_label: false
    },
    {
      amount: String(payload.amount),
      currency: payload.currency,
      coin: payload.coin,
      description: payload.description,
      white_label: false
    }
  ];

  const tried = [];
  for (const rawUrl of candidates) {
    const url = String(rawUrl).replace(/\/$/, "");
    for (const bodyPayload of variants) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": "Bearer " + process.env.WOLVPAY_API_KEY
          },
          body: JSON.stringify(bodyPayload)
        });

        const text = await response.text();
        let data = {};
        try { data = text ? JSON.parse(text) : {}; } catch (e) { data = { raw_text: text }; }

        if (response.ok) {
          return { ok: true, endpoint: url, data: data };
        }
        tried.push({
          endpoint: url,
          status: response.status,
          provider_message: extractWolvpayErrorMessage(data),
          payload: bodyPayload,
          data: data
        });
      } catch (error) {
        tried.push({
          endpoint: url,
          status: 0,
          provider_message: error.message,
          payload: bodyPayload,
          data: { error: error.message }
        });
      }
    }
  }
  return { ok: false, tried: tried };
}
function normalizeWolvpayCoin(inputCoin) {
  const c = String(inputCoin || "").toLowerCase();
  const map = {
    btc: "btc",
    eth: "eth",
    bnb: "bnb",
    sol: "sol_sol",
    xrp: "xrp",
    usdt: "trc20_usdt",
    usdc: "erc20_usdc"
  };
  return map[c] || c;
}

function findWebhookField(body, candidates) {
  const wanted = new Set((candidates || []).map((k) => String(k).toLowerCase()));
  const queue = [body];
  const seen = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (!cur || typeof cur !== "object") continue;
    if (seen.has(cur)) continue;
    seen.add(cur);

    if (Array.isArray(cur)) {
      for (const item of cur) queue.push(item);
      continue;
    }

    for (const [k, v] of Object.entries(cur)) {
      const lk = String(k).toLowerCase();
      if (wanted.has(lk) && (typeof v === "string" || typeof v === "number")) {
        const out = String(v).trim();
        if (out) return out;
      }
      if (v && typeof v === "object") queue.push(v);
    }
  }
  return "";
}

function coinIdFromSymbol(symbol) {
  const key = String(symbol || "").toLowerCase();
  const map = { btc: "bitcoin", eth: "ethereum", usdt: "tether", bnb: "binancecoin", sol: "solana", xrp: "ripple", ada: "cardano", doge: "dogecoin" };
  return map[key] || key;
}

async function getCoinQuote(symbol) {
  const sym = String(symbol || "").toLowerCase();
  const cached = Array.isArray(marketsCache) ? marketsCache.find((m) => String(m.symbol || "").toLowerCase() === sym) : null;
  if (cached && Number(cached.current_price) > 0) return cached;
  const response = await fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=" + encodeURIComponent(coinIdFromSymbol(sym)) + "&sparkline=true&price_change_percentage=24h");
  const data = await response.json();
  if (!response.ok || !Array.isArray(data) || !data.length) throw new Error("Unable to fetch quote");
  return data[0];
}

async function getUserPortfolioUsdValue(userId) {
  const p = await pool.query(
    "SELECT symbol, COALESCE(quantity,0) AS quantity FROM portfolio WHERE user_id = $1",
    [userId]
  );

  if (!p.rows.length) return 0;

  const values = await Promise.all(
    p.rows.map(async (row) => {
      const quantity = Number(row.quantity || 0);
      if (!Number.isFinite(quantity) || quantity <= 0) return 0;
      try {
        const quote = await getCoinQuote(String(row.symbol || ""));
        const price = Number(quote.current_price || 0);
        return Number.isFinite(price) && price > 0 ? quantity * price : 0;
      } catch (_) {
        return 0;
      }
    })
  );

  return values.reduce((sum, v) => sum + Number(v || 0), 0);
}

app.get("/api/quote/:symbol", async (req, res) => {
  try {
    const quote = await getCoinQuote(req.params.symbol);
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: "Quote fetch failed" });
  }
});

app.post("/api/trade/buy", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const symbol = String(req.body.symbol || "").toLowerCase();
    const usdAmount = Number(req.body.usd_amount);
    if (!symbol || !Number.isFinite(usdAmount) || usdAmount <= 0) return res.status(400).json({ error: "Invalid symbol or usd_amount" });

    const quote = await getCoinQuote(symbol);
    const price = Number(quote.current_price || 0);
    if (!price || !Number.isFinite(price)) return res.status(400).json({ error: "Invalid market price" });
    const quantity = usdAmount / price;

    await client.query("BEGIN");
    const userResult = await client.query("SELECT COALESCE(balance,0) AS balance FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
    if (!userResult.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "User not found" }); }
    if (Number(userResult.rows[0].balance) < usdAmount) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Insufficient USD balance" }); }

    await client.query("UPDATE users SET balance = balance - $1 WHERE id = $2", [usdAmount, req.user.id]);
    if (symbol === "btc") {
      await client.query("UPDATE users SET btc_balance = COALESCE(btc_balance,0) + $1 WHERE id = $2", [quantity, req.user.id]);
    }
    await client.query("INSERT INTO portfolio (user_id, symbol, quantity) VALUES ($1, $2, $3) ON CONFLICT (user_id, symbol) DO UPDATE SET quantity = portfolio.quantity + EXCLUDED.quantity", [req.user.id, symbol.toUpperCase(), quantity]);
    await client.query("INSERT INTO transactions (user_id, type, symbol, quantity, price, total) VALUES ($1,$2,$3,$4,$5,$6)", [req.user.id, "BUY", symbol.toUpperCase(), quantity, price, usdAmount]);
    await client.query("COMMIT");
    await sendTradeEmail(req.user.id, "buy", symbol, usdAmount, quantity, price);

    res.json({ success: true, symbol: symbol.toUpperCase(), usd_spent: usdAmount, price: price, quantity: quantity });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Trade buy failed" });
  } finally {
    client.release();
  }
});

app.post("/api/trade/sell", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  try {
    const symbol = String(req.body.symbol || "").toLowerCase();
    const usdAmount = Number(req.body.usd_amount);
    if (!symbol || !Number.isFinite(usdAmount) || usdAmount <= 0) return res.status(400).json({ error: "Invalid symbol or usd_amount" });

    const quote = await getCoinQuote(symbol);
    const price = Number(quote.current_price || 0);
    if (!price || !Number.isFinite(price)) return res.status(400).json({ error: "Invalid market price" });
    const quantity = usdAmount / price;

    await client.query("BEGIN");
    const userResult = await client.query("SELECT COALESCE(balance,0) AS balance, COALESCE(btc_balance,0) AS btc_balance FROM users WHERE id = $1 FOR UPDATE", [req.user.id]);
    if (!userResult.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "User not found" }); }

    if (symbol === "btc") {
      if (Number(userResult.rows[0].btc_balance) < quantity) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Insufficient BTC balance" }); }
      await client.query("UPDATE users SET btc_balance = COALESCE(btc_balance,0) - $1, balance = COALESCE(balance,0) + $2 WHERE id = $3", [quantity, usdAmount, req.user.id]);
      await client.query("INSERT INTO portfolio (user_id, symbol, quantity) VALUES ($1, $2, $3) ON CONFLICT (user_id, symbol) DO UPDATE SET quantity = GREATEST(portfolio.quantity - EXCLUDED.quantity, 0)", [req.user.id, symbol.toUpperCase(), quantity]);
    } else {
      const p = await client.query("SELECT COALESCE(quantity,0) AS quantity FROM portfolio WHERE user_id = $1 AND symbol = $2 FOR UPDATE", [req.user.id, symbol.toUpperCase()]);
      const owned = p.rows.length ? Number(p.rows[0].quantity) : 0;
      if (owned < quantity) { await client.query("ROLLBACK"); return res.status(400).json({ error: "Insufficient asset balance" }); }
      await client.query("UPDATE portfolio SET quantity = GREATEST(quantity - $1, 0) WHERE user_id = $2 AND symbol = $3", [quantity, req.user.id, symbol.toUpperCase()]);
      await client.query("UPDATE users SET balance = COALESCE(balance,0) + $1 WHERE id = $2", [usdAmount, req.user.id]);
    }

    await client.query("INSERT INTO transactions (user_id, type, symbol, quantity, price, total) VALUES ($1,$2,$3,$4,$5,$6)", [req.user.id, "SELL", symbol.toUpperCase(), quantity, price, usdAmount]);
    await client.query("COMMIT");
    await sendTradeEmail(req.user.id, "sell", symbol, usdAmount, quantity, price);

    res.json({ success: true, symbol: symbol.toUpperCase(), usd_received: usdAmount, price: price, quantity: quantity });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Trade sell failed" });
  } finally {
    client.release();
  }
});

app.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const colsResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'"
    );
    const cols = new Set(colsResult.rows.map((r) => r.column_name));

    const selectParts = ["id", "email"];
    if (cols.has("username")) selectParts.push("username");
    if (cols.has("first_name")) selectParts.push("first_name");
    if (cols.has("last_name")) selectParts.push("last_name");
    if (cols.has("phone")) selectParts.push("phone");
    if (cols.has("role")) selectParts.push("role");
    if (cols.has("balance")) selectParts.push("COALESCE(balance,0) AS balance");
    if (cols.has("btc_balance")) selectParts.push("COALESCE(btc_balance,0) AS btc_balance");

    const sql = "SELECT " + selectParts.join(", ") + " FROM users WHERE id = $1";
    const result = await pool.query(sql, [req.user.id]);
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });

    const row = result.rows[0];
    if (!Object.prototype.hasOwnProperty.call(row, "username")) row.username = null;
    if (!Object.prototype.hasOwnProperty.call(row, "first_name")) row.first_name = null;
    if (!Object.prototype.hasOwnProperty.call(row, "last_name")) row.last_name = null;
    if (!Object.prototype.hasOwnProperty.call(row, "phone")) row.phone = null;
    if (!Object.prototype.hasOwnProperty.call(row, "role")) row.role = "user";
    if (!Object.prototype.hasOwnProperty.call(row, "balance")) row.balance = 0;
    if (!Object.prototype.hasOwnProperty.call(row, "btc_balance")) row.btc_balance = 0;

    res.json(row);
  } catch (error) {
    console.error("/api/me error:", error.message);
    res.status(500).json({ error: "Profile fetch failed" });
  }
});

app.post("/api/auth/verify-password", authenticateToken, async (req, res) => {
  try {
    const password = String(req.body.password || "");
    if (!password) return res.status(400).json({ error: "Password is required" });

    const result = await pool.query(
      "SELECT password_hash, password FROM users WHERE id = $1",
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "User not found" });

    const row = result.rows[0];
    const stored = row.password_hash || row.password || "";
    if (!stored) return res.status(500).json({ error: "Password not configured for user" });

    let valid = false;
    try {
      valid = await bcrypt.compare(password, stored);
    } catch (_) {
      valid = false;
    }
    if (!valid && password === stored) valid = true;

    if (!valid) return res.status(401).json({ error: "Invalid password" });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Password verification failed" });
  }
});

app.post("/api/me/update", authenticateToken, async (req, res) => {
  try {
    await pool.query("UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4", [req.body.first_name || null, req.body.last_name || null, req.body.phone || null, req.user.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Profile update failed" });
  }
});

app.post("/api/deposit/wolvpay/create", authenticateToken, async (req, res) => {
  try {
    if (!process.env.WOLVPAY_API_KEY) {
      return res.status(500).json({ error: "WOLVPAY_API_KEY is missing on server" });
    }

    const amount = Number(req.body.amount);
    const currency = String(req.body.currency || "USD").toUpperCase();
    const coin = String(req.body.coin || "BTC").toUpperCase();
    const paymentMethod = String(req.body.payment_method || "checkout").toLowerCase();
    const redirectUrl = String(req.body.redirect_url || "");
    if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
    if (!["card", "bank_transfer", "checkout"].includes(paymentMethod)) return res.status(400).json({ error: "Invalid payment_method" });

    const normalizedCoin = normalizeWolvpayCoin(coin);
    const safeRedirectUrl = /^https?:\/\//i.test(redirectUrl)
      ? redirectUrl
      : (req.protocol + "://" + req.get("host") + "/user-center/assets/deposit/fiat.html");
    const payload = {
      amount: amount,
      currency: currency,
      coin: normalizedCoin,
      description: "Wallet deposit (" + paymentMethod + ") for user #" + req.user.id,
      white_label: false,
      redirect_url: safeRedirectUrl
    };

    const result = await createWolvpayPayment(payload);
    if (!result.ok) {
      const first = Array.isArray(result.tried) && result.tried.length ? result.tried[0] : null;
      return res.status(502).json({
        error: first && first.provider_message
          ? "WolvPay rejected request: " + first.provider_message
          : "WolvPay endpoint not found or rejected request",
        tried: result.tried
      });
    }

    const data = result.data || {};
    const providerRef = String(data.invoice_id || (data.data && data.data.invoice_id) || data.id || data.payment_id || data.reference || data.transaction_id || "");
    let checkoutUrl = extractCheckoutUrlFromObject(data, {
      ignoredUrls: [safeRedirectUrl]
    });
    if (!checkoutUrl && providerRef) {
      checkoutUrl = "https://invoices.wolvpay.com/" + encodeURIComponent(providerRef);
    }

    await pool.query(
      "INSERT INTO deposits (user_id, provider, provider_ref, status, amount_usd, checkout_url, payload) VALUES ($1,$2,$3,$4,$5,$6,$7)",
      [req.user.id, "wolvpay", providerRef || null, "pending", amount, checkoutUrl || null, JSON.stringify(data)]
    );

    if (!checkoutUrl) {
      return res.status(502).json({
        error: "WolvPay returned no checkout URL",
        provider_ref: providerRef || null,
        endpoint: result.endpoint,
        raw: data
      });
    }

    await sendDepositCheckoutEmail(req.user.id, amount, checkoutUrl, providerRef || "");

    res.json({ success: true, checkout_url: checkoutUrl, provider_ref: providerRef || null, endpoint: result.endpoint });
  } catch (error) {
    res.status(500).json({ error: "Deposit create failed", detail: error.message });
  }
});

app.post("/api/deposit/wolvpay/webhook", async (req, res) => {
  const client = await pool.connect();
  try {
    const body = req.body || {};
    const expectedSecret = String(process.env.WOLVPAY_WEBHOOK_SECRET || "").trim();
    if (expectedSecret) {
      const headerSecret = String(
        req.headers["x-wolvpay-webhook-secret"] ||
        req.headers["x-wolvpay-secret"] ||
        req.headers["x-webhook-secret"] ||
        req.headers["x-signature"] ||
        ""
      ).trim();
      if (!headerSecret || headerSecret !== expectedSecret) {
        return res.status(401).json({ error: "Invalid webhook secret" });
      }
    }

    const providerRef = String(findWebhookField(body, [
      "invoice_id",
      "invoiceid",
      "id",
      "payment_id",
      "paymentid",
      "reference",
      "transaction_id",
      "txid",
      "order_id",
      "orderid"
    ])).trim();
    const status = String(findWebhookField(body, [
      "status",
      "payment_status",
      "paymentstatus",
      "state"
    ])).toLowerCase().trim();
    const eventName = String(findWebhookField(body, ["event", "type", "event_type"])).toLowerCase().trim();
    if (!providerRef) return res.status(400).json({ error: "Missing provider reference" });

    let notifyUserId = null;
    let notifyAmount = null;
    let notifyProviderRef = null;

    await client.query("BEGIN");
    const dep = await client.query(
      "SELECT * FROM deposits WHERE provider = $1 AND LOWER(provider_ref) = LOWER($2) ORDER BY id DESC LIMIT 1 FOR UPDATE",
      ["wolvpay", providerRef]
    );
    if (!dep.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Deposit not found" }); }

    const deposit = dep.rows[0];
    const paid =
      ["paid", "completed", "success", "confirmed", "succeeded", "settled", "done"].includes(status) ||
      /paid|complete|success|confirm|settled|succeed|done/i.test(status) ||
      /invoice\.paid|payment\.succeeded|charge\.succeeded|checkout\.completed/i.test(eventName);
    if (paid && deposit.status !== "completed") {
      await client.query("UPDATE users SET balance = COALESCE(balance,0) + $1 WHERE id = $2", [Number(deposit.amount_usd), deposit.user_id]);
      await client.query("UPDATE deposits SET status = $1, credited_at = NOW(), payload = $2 WHERE id = $3", ["completed", JSON.stringify(body), deposit.id]);
      notifyUserId = deposit.user_id;
      notifyAmount = deposit.amount_usd;
      notifyProviderRef = providerRef;
    } else {
      await client.query("UPDATE deposits SET status = $1, payload = $2 WHERE id = $3", [status || "pending", JSON.stringify(body), deposit.id]);
    }
    await client.query("COMMIT");

    if (notifyUserId) {
      await sendDepositSuccessEmail(notifyUserId, notifyAmount, notifyProviderRef);
    }

    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: "Webhook process failed" });
  } finally {
    client.release();
  }
});

app.get("/api/deposit/address", authenticateToken, async (req, res) => {
  try {
    const coin = String(req.query.coin || "USDT").toUpperCase();
    const network = String(req.query.network || "TRC20").toUpperCase();
    const seed = req.user.id + ":" + coin + ":" + network + ":jackpott";
    const hash = crypto.createHash("sha256").update(seed).digest("hex");
    const address = (network.startsWith("TRC") ? "T" : network.startsWith("BTC") ? "bc1" : network.startsWith("ETH") || network.includes("ERC") ? "0x" : "x") + hash.slice(0, network.startsWith("ETH") || network.includes("ERC") ? 40 : 33);
    const tag = coin === "XRP" ? hash.slice(0, 10) : "";
    res.json({ coin: coin, network: network, address: address, tag: tag });
  } catch (error) {
    res.status(500).json({ error: "Address generation failed" });
  }
});

app.get("/api/deposits", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, provider_ref, status, amount_usd, checkout_url, created_at, credited_at, payload FROM deposits WHERE user_id = $1 ORDER BY id DESC LIMIT 200",
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Deposit history fetch failed" });
  }
});

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied" });
  }
  next();
}

app.get("/admin/dashboard", authenticateToken, requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin-dashboard.html"));
});

app.get("/api/admin/users/details", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const colResult = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'"
    );
    const cols = new Set(colResult.rows.map((r) => r.column_name));

    const baseSelect = ["u.id", "u.email"];
    if (cols.has("username")) baseSelect.push("u.username");
    if (cols.has("first_name")) baseSelect.push("u.first_name");
    if (cols.has("last_name")) baseSelect.push("u.last_name");
    if (cols.has("phone")) baseSelect.push("u.phone");
    if (cols.has("role")) baseSelect.push("u.role");
    if (cols.has("balance")) baseSelect.push("COALESCE(u.balance,0) AS balance");
    if (cols.has("btc_balance")) baseSelect.push("COALESCE(u.btc_balance,0) AS btc_balance");
    if (cols.has("created_at")) baseSelect.push("u.created_at");

    const sql =
      "SELECT " + baseSelect.join(", ") + "," +
      " COALESCE(p.asset_count,0) AS asset_count," +
      " COALESCE(t.trade_count,0) AS trade_count," +
      " COALESCE(d.deposit_count,0) AS deposit_count," +
      " COALESCE(w.withdraw_count,0) AS withdraw_count" +
      " FROM users u" +
      " LEFT JOIN (SELECT user_id, COUNT(*) AS asset_count FROM portfolio GROUP BY user_id) p ON p.user_id = u.id" +
      " LEFT JOIN (SELECT user_id, COUNT(*) AS trade_count FROM transactions GROUP BY user_id) t ON t.user_id = u.id" +
      " LEFT JOIN (SELECT user_id, COUNT(*) AS deposit_count FROM deposits GROUP BY user_id) d ON d.user_id = u.id" +
      " LEFT JOIN (SELECT user_id, COUNT(*) AS withdraw_count FROM withdrawals GROUP BY user_id) w ON w.user_id = u.id" +
      " ORDER BY u.id DESC";

    const result = await pool.query(sql);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch admin users data" });
  }
});

initializeDatabase().finally(() => {
  app.listen(PORT, () => {
    console.log("Serveur actif sur le port " + PORT);
  });
});
