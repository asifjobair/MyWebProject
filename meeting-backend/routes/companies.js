// routes/companies.js
const express = require("express");
const router = express.Router();
const db = require("../db"); // promise-based pool
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

// Accept raw token or "Bearer <token>"
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

// GET /api/companies - list all companies with contacts
router.get("/", verifyToken, async (req, res) => {
  try {
    const [companies] = await db.query(
      "SELECT * FROM companies ORDER BY id DESC"
    );
    if (!companies.length) return res.json([]);

    const ids = companies.map((c) => c.id);
    const [contacts] = await db.query(
      "SELECT * FROM company_contacts WHERE company_id IN (?) ORDER BY id ASC",
      [ids]
    );

    const grouped = {};
    contacts.forEach((ct) => {
      if (!grouped[ct.company_id]) grouped[ct.company_id] = [];
      grouped[ct.company_id].push(ct);
    });

    const out = companies.map((c) => ({
      ...c,
      contacts: grouped[c.id] || [],
    }));

    res.json(out);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch companies", error: err.message });
  }
});

// GET /api/companies/:id - get one company with contacts
router.get("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  try {
    const [rows] = await db.query("SELECT * FROM companies WHERE id=?", [id]);
    if (!rows.length)
      return res.status(404).json({ message: "Company not found" });

    const company = rows[0];
    const [contacts] = await db.query(
      "SELECT * FROM company_contacts WHERE company_id=? ORDER BY id ASC",
      [id]
    );
    company.contacts = contacts;
    res.json(company);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to fetch company", error: err.message });
  }
});

// POST /api/companies - add new company with contacts
router.post("/", verifyToken, async (req, res) => {
  const { name, address, contacts } = req.body;
  if (!name) return res.status(400).json({ message: "Company name required" });

  try {
    const [result] = await db.query(
      "INSERT INTO companies (name, address) VALUES (?, ?)",
      [name, address || ""]
    );
    const companyId = result.insertId;

    if (contacts && Array.isArray(contacts) && contacts.length) {
      const values = contacts.map((c) => [
        companyId,
        c.name || "",
        c.designation || "",
        c.phone || "",
        c.email || "",
      ]);
      await db.query(
        "INSERT INTO company_contacts (company_id, name, designation, phone, email) VALUES ?",
        [values]
      );
      return res.json({
        message: "Company added with contacts",
        id: companyId,
      });
    }

    res.json({ message: "Company added", id: companyId });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to add company", error: err.message });
  }
});

// PUT /api/companies/:id - update company and replace contacts
router.put("/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const { name, address, contacts } = req.body;

  try {
    await db.query("UPDATE companies SET name=?, address=? WHERE id=?", [
      name,
      address || "",
      id,
    ]);

    // remove old contacts
    await db.query("DELETE FROM company_contacts WHERE company_id=?", [id]);

    if (contacts && Array.isArray(contacts) && contacts.length) {
      const values = contacts.map((c) => [
        id,
        c.name || "",
        c.designation || "",
        c.phone || "",
        c.email || "",
      ]);
      await db.query(
        "INSERT INTO company_contacts (company_id, name, designation, phone, email) VALUES ?",
        [values]
      );
      return res.json({ message: "Company and contacts updated" });
    }

    res.json({ message: "Company updated (no contacts)" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "Failed to update company", error: err.message });
  }
});

module.exports = router;
