// routes/notifications.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // promise-based pool
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
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// GET /api/notifications/:userId - today’s meetings for a user
router.get("/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const sql = `
      SELECT m.*
      FROM meetings m
      JOIN meeting_participants mp ON m.id = mp.meeting_id
      WHERE mp.user_id = ? AND DATE(m.meeting_date) = CURDATE()
    `;
    const [results] = await db.query(sql, [userId]);
    res.json(results);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch notifications", error: err.message });
  }
});

module.exports = router;
