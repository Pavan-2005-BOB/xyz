
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const getAISuggestion = require("./aiService"); 

const app = express();

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// health check
app.get("/", (req, res) => {
  res.send("Backend is running on port 5000");
});

// REAL market data endpoint using CoinGecko
app.get("/price/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  // map symbol to CoinGecko ID
  const map = {
    BTC: "bitcoin",
    ETH: "ethereum",
    XRP: "ripple",
    SOL: "solana",
  };

  const id = map[symbol];
  if (!id) {
    return res.status(400).json({ error: "Unsupported symbol" });
  }

  try {
    const cgRes = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd&include_24hr_vol=true&include_24hr_change=true`
    );

    const data = cgRes.data[id];

    if (!data || data.usd === undefined) {
      return res.status(404).json({ error: "Price not found" });
    }

    const response = {
      symbol,
      price: data.usd,
      volume24h: data.usd_24h_vol,
      change24h: data.usd_24h_change,
    };

    res.json(response);
  } catch (err) {
    console.error("Error fetching market data:", err.message);
    res.status(500).json({ error: "Failed to fetch market data" });
  }
});

// 🚀 AI suggestion endpoint (this is what your frontend calls)
app.post("/ai/suggestion", (req, res) => {
  const { price } = req.body;

  console.log("AI request body:", req.body); // debug log

  if (!price) {
    return res.status(400).json({ error: "Price required" });
  }

  try {
    const result = getAISuggestion(price);
    res.json(result);
  } catch (err) {
    console.error("AI error:", err.message);
    res.status(500).json({ error: "AI suggestion failed" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend started on http://localhost:${PORT}`);
});
