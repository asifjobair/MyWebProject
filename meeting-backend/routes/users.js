// routes/users.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // promise-based pool
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

// Middleware to verify token
function verifyToken(req, res, next) {
  let token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "No token provided" });
  if (token.startsWith("Bearer ")) token = token.slice(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// GET /api/users - list users
router.get("/", verifyToken, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role FROM users ORDER BY id DESC"
    );
    res.json(users);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: err.message });
  }
});

// POST /api/users - add user (admin)
router.post("/", verifyToken, async (req, res) => {
  if (req.userRole !== "Admin")
    return res.status(403).json({ message: "Only Admin can add users" });

  const { name, email, password, role } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password required" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [name || "", email, hashed, role || "User"]
    );
    res.json({ message: "User added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to add user", error: err.message });
  }
});

module.exports = router;
