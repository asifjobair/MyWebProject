const express = require("express");
const router = express.Router();
const db = require("../db"); // your MySQL connection

// Add Meeting Minutes
router.post("/", async (req, res) => {
  try {
    const {
      summary,
      decisions,
      action_items = [],
      attendees = [],
      created_by,
    } = req.body;

    if (!summary || !created_by) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const sql = `
      INSERT INTO meeting_minutes
      (summary, decisions, action_items, attendees, created_by)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      summary,
      decisions || "",
      JSON.stringify(action_items),
      JSON.stringify(attendees),
      created_by,
    ]);

    res.status(201).json({ message: "Meeting minutes added successfully" });
  } catch (err) {
    console.error("DB Error:", err);
    res
      .status(500)
      .json({ message: "Failed to save minutes", error: err.message });
  }
});

// Get all meeting minutes
router.get("/all", async (req, res) => {
  try {
    const sql = `SELECT * FROM meeting_minutes`;
    const [result] = await db.query(sql);

    const parsed = result.map((r) => ({
      ...r,
      action_items: JSON.parse(r.action_items || "[]"),
      attendees: JSON.parse(r.attendees || "[]"),
    }));

    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load meeting minutes" });
  }
});

// Get minutes by ID
router.get("/:id", async (req, res) => {
  try {
    const sql = `SELECT * FROM meeting_minutes WHERE id = ?`;
    const [result] = await db.query(sql, [req.params.id]);

    if (!result.length)
      return res.status(404).json({ message: "Minutes not found" });

    const parsed = {
      ...result[0],
      action_items: JSON.parse(result[0].action_items || "[]"),
      attendees: JSON.parse(result[0].attendees || "[]"),
    };

    res.json(parsed);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to load meeting minutes" });
  }
});

module.exports = router;
