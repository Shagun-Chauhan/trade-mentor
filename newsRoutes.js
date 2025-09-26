// routes/newsRoutes.js
const express = require("express");
const Article = require("./news");
const { fetchAndStore } = require("./services");

const router = express.Router();

/**
 * GET /api/news
 * Query params:
 *  - q        : extra search keywords or symbol (e.g. "INFY OR Infosys")
 *  - tag      : filter by tag like NSE, BSE, NIFTY
 *  - page     : pagination page (1-based)
 *  - limit    : items per page
 */
router.get("/", async (req, res) => {
  try {
    const { q = "", tag, page = 1, limit = 20 } = req.query;
    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Number(limit));
    const query = {};
    if (q && q.trim()) {
      // text search on title/description (simple)
      query.$or = [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { content: new RegExp(q, "i") }
      ];
    }
    if (tag) query.tags = tag.toUpperCase();

    const items = await Article.find(query).sort({ publishedAt: -1, createdAt: -1 }).skip(skip).limit(Math.min(100, Number(limit)));
    const total = await Article.countDocuments(query);
    res.json({ ok: true, total, page: Number(page), limit: Number(limit), items });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

/**
 * GET /api/news/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const item = await Article.findById(req.params.id);
    if (!item) return res.status(404).json({ ok: false, message: "Not found" });
    res.json({ ok: true, item });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

/**
 * POST /api/admin/refresh
 * Protected by ADMIN_SECRET header - triggers immediate fetch & store.
 * Body JSON: { q: "INFY OR Infosys", maxArticles: 50 }
 */
router.post("/admin/refresh", async (req, res) => {
  try {
    const secret = req.headers["x-admin-secret"] || req.headers["admin-secret"];
    if (!process.env.ADMIN_SECRET || secret !== process.env.ADMIN_SECRET) return res.status(401).json({ ok: false, message: "unauthorized" });

    const { q = "", maxArticles = 100 } = req.body || {};
    const result = await fetchAndStore({ q, maxArticles: Number(maxArticles) });
    res.json({ ok: true, message: "fetch completed", result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;
