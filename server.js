const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// Root test
app.get("/", (req, res) => {
  res.send("Backend Running 🚀");
});

// API
app.get("/api/price", async (req, res) => {
  try {
    const symbol = req.query.symbol || "^NSEI";

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

    const response = await fetch(url);
    const data = await response.json();

    const price = data.chart.result[0].meta.regularMarketPrice;

    res.json({ price });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed" });
  }
});

// 🔥 IMPORTANT (Render fix)
app.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port " + PORT);
});
