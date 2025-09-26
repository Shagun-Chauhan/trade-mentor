// cronJobs.js
const cron = require("node-cron");
const { fetchAndStore } = require("./services");

function startCronJobs() {
  const schedule = process.env.CRON_SCHEDULE || "*/30 * * * *"; // default 30 minutes
  cron.schedule(schedule, async () => {
    try {
      console.log("📡 Scheduled news fetch started:", new Date().toISOString());
      // default fetch: no extra query, fetch up to 100 articles
      const result = await fetchAndStore({ q: "", maxArticles: 100 });
      console.log("📡 Scheduled fetch finished:", result);
    } catch (err) {
      console.error("Cron fetch error:", err.message);
    }
  }, {
    timezone: "Asia/Kolkata"
  });

  console.log("✅ Cron jobs scheduled:", schedule);
}

module.exports = { startCronJobs };
