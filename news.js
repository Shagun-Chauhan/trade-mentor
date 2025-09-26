const mongoose = require("mongoose");

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  content: String,
  url: { type: String, required: true, unique: true, index: true },
  urlToImage: String,
  publishedAt: { type: Date, index: true },
  sourceName: String,
  tags: [String],     // e.g. ["NSE","BSE","NIFTY","INFY"]
  fetchedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model("News", ArticleSchema, "news");
