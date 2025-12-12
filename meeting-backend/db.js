const mysql = require("mysql2/promise"); // <-- promise version
const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "meeting_scheduler",
  waitForConnections: true,
  connectionLimit: 10,
});
module.exports = db;
