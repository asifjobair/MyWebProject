// routes/meetings.js
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

// POST /api/meetings - Add new meeting
router.post("/", verifyToken, async (req, res) => {
  const {
    company_id,
    meeting_with = [],
    participants = [],
    medium,
    meeting_date,
    discussed_matter,
    outcome,
    next_meeting_date,
    next_meeting_topic,
  } = req.body;

  if (!company_id || !meeting_date) {
    return res.status(400).json({ message: "Company and date required" });
  }

  const meetingType = next_meeting_date ? "existing" : "new";

  const sql = `
    INSERT INTO meetings
      (company_id, medium, meeting_date, discussed_matter, outcome, next_meeting_date, next_meeting_topic, created_by, meeting_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  try {
    const [result] = await db.query(sql, [
      company_id,
      medium,
      meeting_date,
      discussed_matter || "",
      outcome || "",
      next_meeting_date || null,
      next_meeting_topic || "",
      req.userId,
      meetingType,
    ]);

    const meetingId = result.insertId;

    // Insert meeting_with and participants
    if (meeting_with.length > 0) {
      const contactValues = meeting_with.map((id) => [meetingId, id]);
      await db.query(
        "INSERT INTO meeting_with (meeting_id, user_id) VALUES ?",
        [contactValues]
      );
    }

    if (participants.length > 0) {
      const participantValues = participants.map((id) => [meetingId, id]);
      await db.query(
        "INSERT INTO meeting_participants (meeting_id, user_id) VALUES ?",
        [participantValues]
      );
    }

    res.json({ message: "Meeting added successfully", id: meetingId });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to add meeting", error: err.message });
  }
});

// GET /api/meetings/grouped - meetings for today, tomorrow, next 7 days
router.get("/grouped", verifyToken, async (req, res) => {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const next7Start = new Date();
  next7Start.setDate(today.getDate() + 2);
  const next7End = new Date();
  next7End.setDate(today.getDate() + 8);

  const formatDate = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  const todayStr = formatDate(today);
  const tomorrowStr = formatDate(tomorrow);
  const next7StartStr = formatDate(next7Start);
  const next7EndStr = formatDate(next7End);

  const sql = `
    SELECT 
      m.id,
      m.meeting_date,
      m.next_meeting_date,
      m.medium,
      m.discussed_matter,
      m.outcome,
      m.next_meeting_topic,
      c.name AS company_name,
      GROUP_CONCAT(DISTINCT cc.name SEPARATOR ', ') AS meeting_with
    FROM meetings m
    LEFT JOIN companies c ON m.company_id = c.id
    LEFT JOIN meeting_with mw ON m.id = mw.meeting_id
    LEFT JOIN company_contacts cc ON mw.user_id = cc.id
    GROUP BY m.id
    ORDER BY m.meeting_date ASC
  `;

  try {
    const [rows] = await db.query(sql);

    const data = { today: [], tomorrow: [], next7days: [] };

    rows.forEach((m) => {
      const meetingDate = new Date(m.meeting_date);
      const dateStr = formatDate(meetingDate);
      const timeStr = meetingDate.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      const meetingObj = { ...m, time: timeStr, date: dateStr };

      if (dateStr === todayStr) data.today.push(meetingObj);
      else if (dateStr === tomorrowStr) data.tomorrow.push(meetingObj);
      else if (dateStr >= next7StartStr && dateStr <= next7EndStr)
        data.next7days.push(meetingObj);

      // Next meeting
      if (m.next_meeting_date) {
        const nextDate = new Date(m.next_meeting_date);
        const nextDateStr = formatDate(nextDate);
        const nextTimeStr = nextDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        const nextMeetingObj = {
          ...m,
          meeting_date: m.next_meeting_date,
          time: nextTimeStr,
          date: nextDateStr,
        };

        if (nextDateStr === todayStr) data.today.push(nextMeetingObj);
        else if (nextDateStr === tomorrowStr)
          data.tomorrow.push(nextMeetingObj);
        else if (nextDateStr >= next7StartStr && nextDateStr <= next7EndStr)
          data.next7days.push(nextMeetingObj);
      }
    });

    res.json(data);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({
        message: "Failed to fetch grouped meetings",
        error: err.message,
      });
  }
});

// GET /api/meetings - list all meetings with company & contacts
router.get("/", verifyToken, async (req, res) => {
  const sql = `
    SELECT 
      m.*,
      c.name AS company_name,
      GROUP_CONCAT(DISTINCT cc.name SEPARATOR ', ') AS meeting_with,
      GROUP_CONCAT(DISTINCT u.name SEPARATOR ', ') AS participants
    FROM meetings m
    LEFT JOIN companies c ON m.company_id = c.id
    LEFT JOIN meeting_with mw ON m.id = mw.meeting_id
    LEFT JOIN company_contacts cc ON mw.user_id = cc.id
    LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
    LEFT JOIN users u ON mp.user_id = u.id
    GROUP BY m.id
    ORDER BY m.meeting_date DESC
  `;

  try {
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch meetings", error: err.message });
  }
});

module.exports = router;
