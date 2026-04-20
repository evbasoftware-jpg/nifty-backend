const express = require("express");
const yahooFinance = require("yahoo-finance2").default;
const cors = require("cors");

const app = express();
app.use(cors());

// Home route
app.get("/", (req, res) => {
    res.send("✅ Nifty Backend Running");
});

// API route
app.get("/nifty", async (req, res) => {
    try {
        const result = await yahooFinance.chart("^NSEI", {
            interval: "5m",
            range: "1d"
        });

        const prices = result.indicators.quote[0].close.filter(x => x);

        res.json({
            price: prices[prices.length - 1],
            prices: prices
        });

    } catch (e) {
        res.status(500).json({ error: "Data fetch error" });
    }
});

// IMPORTANT: PORT fix
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
    console.log("Server running on port", PORT);
});
