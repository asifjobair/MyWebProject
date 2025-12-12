const express = require("express");
const router = express.Router();
const axios = require("axios");
const db = require("../db"); // assume this is mysql2 promise pool
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware to verify JWT
function verifyToken(req, res, next) {
  let token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "No token provided" });
  if (token.startsWith("Bearer ")) token = token.slice(7);
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Invalid token" });
    req.userId = decoded.id;
    next();
  });
}

// Get Zoom Access Token
async function getZoomToken() {
  try {
    const url = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${process.env.ZOOM_ACCOUNT_ID}`;
    const auth = Buffer.from(
      `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
    ).toString("base64");

    const res = await axios.post(
      url,
      {},
      { headers: { Authorization: `Basic ${auth}` } }
    );
    return res.data.access_token;
  } catch (err) {
    console.error(
      "Error getting Zoom token:",
      err.response?.data || err.message
    );
    throw new Error("Failed to get Zoom access token");
  }
}

// Create Zoom Meeting
router.post("/meeting", verifyToken, async (req, res) => {
  const { topic, start_time, duration = 60, type = 2 } = req.body;

  if (!topic || (type === 2 && !start_time)) {
    return res
      .status(400)
      .json({ message: "Topic and start_time required for scheduled meeting" });
  }

  try {
    const token = await getZoomToken();

    const meetingData = {
      topic,
      type, // 1 = instant, 2 = scheduled
      duration,
    };

    if (type === 2) meetingData.start_time = new Date(start_time).toISOString();

    const zoomRes = await axios.post(
      "https://api.zoom.us/v2/users/me/meetings",
      meetingData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const zoomMeeting = zoomRes.data;

    // Save to DB using async/await
    try {
      const [result] = await db.query(
        `INSERT INTO zoom_meetings 
          (topic, start_time, duration, type, zoom_meeting_id, join_url, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          topic,
          zoomMeeting.start_time || new Date(),
          duration,
          type,
          zoomMeeting.id,
          zoomMeeting.join_url,
          req.userId,
        ]
      );

      res.json({ message: "Meeting created", meeting: zoomMeeting });
    } catch (err) {
      console.error("DB Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  } catch (err) {
    console.error("Zoom Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to create Zoom meeting" });
  }
});

// List Zoom meetings
router.get("/meetings", verifyToken, async (req, res) => {
  try {
    const [results] = await db.query(
      "SELECT * FROM zoom_meetings WHERE created_by=? ORDER BY start_time DESC",
      [req.userId]
    );
    res.json(results);
  } catch (err) {
    console.error("DB Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
