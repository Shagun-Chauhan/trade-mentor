require("dotenv").config();
const express = require("express");
const { CohereClient } = require("cohere-ai");

const app = express();
app.use(express.json());

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Chat memory
let conversationHistory = [
  { role: "System",
    content: "You are a financial mentor specializing in the stock market. Answer only questions related to stocks, trading, investing, and finance. Provide clear, beginner-friendly, and detailed explanations, including examples when possible." }
];

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "Message is required" });
    }

    conversationHistory.push({ role: "User", content: userMessage });

    const response = await cohere.chat({
      model: "command-a-03-2025", // or "command-r-08-2024"
      message: userMessage,
      chatHistory: conversationHistory.map(m => ({
        role: m.role,
        message: m.content
      })),
      temperature: 0.7,
    });

    const aiReply = response.text;

    conversationHistory.push({ role: "Chatbot", content: aiReply });

    res.json({ reply: aiReply });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Reset conversation
app.post("/reset", (req, res) => {
  conversationHistory = [
    { role: "System", content: "You are a helpful teacher. Always explain things in detailed but simple language so even a beginner can understand." }
  ];
  res.json({ message: "Conversation reset ✅" });
});

app.listen(5003, () => {
  console.log("🤖 Cohere Chatbot running on http://localhost:5003");
});
