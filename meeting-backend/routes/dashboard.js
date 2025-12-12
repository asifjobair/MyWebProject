// routes/dashboard.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // promise-based pool
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config"); // use the same secret as auth.js

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

// GET /api/dashboard/:userId → meetings for the user
router.get("/:userId", verifyToken, async (req, res) => {
  const userId = req.params.userId;

  const query = `
    SELECT m.*
    FROM meetings m
    JOIN meeting_participants mp ON m.id = mp.meeting_id
    WHERE mp.user_id = ? OR m.created_by = ?
    ORDER BY m.meeting_date ASC
  `;

  try {
    const [results] = await db.query(query, [userId, userId]);
    res.json(results);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch meetings", error: err.message });
  }
});

module.exports = router;
