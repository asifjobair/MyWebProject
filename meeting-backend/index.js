const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import routers
const usersRouter = require("./routes/users");
const meetingsRouter = require("./routes/meetings");
const dashboardRouter = require("./routes/dashboard");
const notificationsRouter = require("./routes/notifications");
const authRouter = require("./routes/auth");
const companiesRouter = require("./routes/companies");
const meetingMinutesRouter = require("./routes/meetingMinutes");
const zoomRouter = require("./routes/zoom");
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Register routes
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/meetings", meetingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/companies", companiesRouter);
app.use("/api/meeting-minutes", meetingMinutesRouter);
app.use("/api/zoom", zoomRouter);

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
