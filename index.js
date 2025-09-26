// index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const cors = require("cors");

const newsRoutes = require("./newsRoutes");
const { startCronJobs } = require("./cronJobs");

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan("tiny"));

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
    // mount routes
    app.use("/api/news", newsRoutes);

    // simple healthcheck
    app.get("/", (req, res) => res.send("📡 Trade Mentor News (NewsAPI) backend is running"));

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      // start cron jobs after server up
      startCronJobs();
    });
  } catch (err) {
    console.error("Startup error:", err.message);
    process.exit(1);
  }
}

start();
