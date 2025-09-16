const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const sequelize = require("./config/db");

const Admin = require("./module/Admin");
const adminRoutes = require("./route/Admin");

const Supervisor = require("./module/Supervisor");
const supervisorRoutes = require("./route/Supervisor");

// Load env variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());

// ✅ CORS setup
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,              
  })
);

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/supervisors", supervisorRoutes);

// Sync DB
sequelize
  .sync()
  .then(() => {
    console.log("✅ Database synced");
  })
  .catch((err) => {
    console.error("❌ Database sync error:", err);
  });

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
