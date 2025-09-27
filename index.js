const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Helper to load JSON file
function loadFile(level) {
  const filePath = path.join(__dirname, `${level}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

// Get content by level
app.get("/api/content/:level", (req, res) => {
  const level = req.params.level.toLowerCase();
  const validLevels = ["beginner", "intermediate", "advance"];

  if (!validLevels.includes(level)) {
    return res.status(400).json({ error: "Invalid level" });
  }

  try {
    const data = loadFile(level);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error reading file" });
  }
});

// Search content by keyword within a level
app.get("/api/content/:level/search", (req, res) => {
  const level = req.params.level.toLowerCase();
  const keyword = req.query.q?.toLowerCase();

  if (!keyword) return res.status(400).json({ error: "Keyword is required" });

  try {
    const data = loadFile(level);
    const results = data.filter(item =>
      item.topic.toLowerCase().includes(keyword) ||
      item.content.toLowerCase().includes(keyword)
    );

    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error searching file" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
