// routes/auth.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // must be mysql2/promise
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET =
  "3a6f1c7d9e2b4f6a8d0e1c2b3f4a5d6e7b8c9f0a1d2e3f4b5c6d7e8f9a0b1c2d";

// Register a user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name, email, hashed]
    );

    res.json({ message: "User registered!" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing email or password" });

    const [results] = await db.query("SELECT * FROM users WHERE email=?", [
      email,
    ]);
    if (results.length === 0)
      return res.status(400).json({ message: "User not found" });

    const valid = await bcrypt.compare(password, results[0].password_hash);
    if (!valid) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: results[0].id, role: results[0].role },
      SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, user: results[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

module.exports = router;
