require("dotenv").config();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const express = require("express");
const path = require("path");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);app.use(express.static(path.join(__dirname, "public")));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(limiter);
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


app.use(limiter);

// ==========================
// DATABASE
// ==========================

const pool = new Pool({
  user: "WooBarber",
  host: "localhost",
  database: "mymarketplace",
  password: "",
  port: 5432,
});
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
      "SELECT balance FROM users WHERE id = $1",
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
app.get("/admin", (req, res) => {
  res.send(`
    <h1>Admin Dashboard</h1>
    <ul>
      <li><a href="/admin/users">Voir utilisateurs</a></li>
      <li><a href="/admin/withdrawals">Voir withdrawals</a></li>
    </ul>
  `);
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
      "SELECT balance FROM users WHERE id = $1",
      [req.user.id]
    );

    res.json({
      balance: result.rows[0].balance
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Balance error" });
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

app.listen(3000, () => {
  console.log("Serveur actif sur le port 3000");
});
