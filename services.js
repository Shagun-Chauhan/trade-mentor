const axios = require("axios");
const Article = require("./news");

const NEWSAPI_URL = "https://newsapi.org/v2/everything";
const API_KEY = process.env.NEWSAPI_KEY;

// default query keywords that signal NSE/BSE related articles
const DEFAULT_KEYWORDS = [
  "NSE", "BSE", "Nifty", "Sensex", "stocks", "shares", "stock market", "market"
];

function buildQuery(extraQuery) {
  // join default keywords with OR and include extraQuery if provided
  const base = DEFAULT_KEYWORDS.map(k => `"${k}"`).join(" OR ");
  if (extraQuery && extraQuery.trim().length > 0) {
    // add user-provided symbol/company e.g. "INFY OR Infosys"
    return `${base} OR (${extraQuery})`;
  }
  return base;
}

async function fetchFromNewsAPI({ q = "", pageSize = 100, page = 1 } = {}) {
  if (!API_KEY) throw new Error("NEWSAPI_KEY not set in env");

  const query = buildQuery(q);
  const params = {
    q: query,
    language: "en",
    pageSize: Math.min(100, pageSize),
    page,
    sortBy: "publishedAt",
    apiKey: API_KEY
  };

  const res = await axios.get(NEWSAPI_URL, { params, timeout: 15000 });
  return res.data;
}

function extractTagsFromArticle(article) {
  const tags = new Set();
  const text = `${article.title || ""} ${article.description || ""} ${article.content || ""}`.toUpperCase();
  if (text.includes("NSE")) tags.add("NSE");
  if (text.includes("BSE")) tags.add("BSE");
  if (text.includes("NIFTY")) tags.add("NIFTY");
  if (text.includes("SENSEX")) tags.add("SENSEX");
  // you can detect tickers or common company names if you wish (INFY, TCS, etc.)
  return Array.from(tags);
}

async function saveArticlesToDB(articles = []) {
  let inserted = 0;
  for (const a of articles) {
    if (!a.url || !a.title) continue;
    const payload = {
      title: a.title,
      description: a.description,
      content: a.content,
      url: a.url,
      urlToImage: a.urlToImage,
      publishedAt: a.publishedAt ? new Date(a.publishedAt) : new Date(),
      sourceName: a.source && a.source.name ? a.source.name : "",
      tags: extractTagsFromArticle(a)
    };
    try {
      // upsert by url to avoid duplicates
      const result = await Article.updateOne(
        { url: payload.url },
        { $setOnInsert: payload },
        { upsert: true }
      );
      // result.upsertedId indicates insertion
      if (result.upsertedCount && result.upsertedCount > 0) inserted++;
    } catch (err) {
      // ignore duplicate errors, log others
      if (err.code !== 11000) console.warn("saveArticlesToDB error:", err.message);
    }
  }
  return inserted;
}

/**
 * High-level convenience: fetch multiple pages until maxArticles or no more results.
 * Be careful with rate limits on free plan (100 requests/day).
 */
async function fetchAndStore({ q = "", maxArticles = 100 } = {}) {
  const pageSize = 50;
  let fetchedTotal = 0;
  let page = 1;
  let insertedTotal = 0;

  while (fetchedTotal < maxArticles) {
    const remaining = maxArticles - fetchedTotal;
    const ps = Math.min(pageSize, remaining);
    const resp = await fetchFromNewsAPI({ q, pageSize: ps, page });
    const articles = resp.articles || [];
    if (articles.length === 0) break;

    fetchedTotal += articles.length;
    const inserted = await saveArticlesToDB(articles);
    insertedTotal += inserted;

    if (articles.length < ps) break; // no more results
    page++;
    // small pause could be added if you worry about throttling
  }

  return { fetchedTotal, insertedTotal };
}

module.exports = {
  fetchFromNewsAPI,
  fetchAndStore,
  buildQuery
};
