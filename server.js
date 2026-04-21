const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;

// ===== INDICATORS =====
function EMA(data, period) {
    let k = 2 / (period + 1);
    let ema = data[0];

    for (let i = 1; i < data.length; i++) {
        ema = data[i] * k + ema * (1 - k);
    }
    return ema;
}

function RSI(prices, period = 14) {
    if (prices.length < period) return 50;

    let gains = 0, losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
        let diff = prices[i] - prices[i - 1];
        if (diff > 0) gains += diff;
        else losses -= diff;
    }

    let rs = gains / losses;
    return 100 - (100 / (1 + rs));
}

function signal(price, rsi, ema20, ema50) {
    if (price > ema20 && ema20 > ema50 && rsi < 35) return "BUY";
    if (price < ema20 && ema20 < ema50 && rsi > 65) return "SELL";
    return "WAIT";
}

// ===== API =====
app.get("/api/market", async (req, res) => {
    try {
        const symbols = ["AAPL", "MSFT", "TSLA", "GOOG"];

        let result = [];

        for (let sym of symbols) {
            let response = await axios.get(
                `https://api.polygon.io/v2/aggs/ticker/${sym}/prev?adjusted=true&apiKey=demo`
            );

            let price = response.data.results?.[0]?.c || 100;

            let prices = [];
            for (let i = 0; i < 50; i++) {
                prices.push(price + Math.random() * 5);
            }

            let rsi = RSI(prices);
            let ema20 = EMA(prices, 20);
            let ema50 = EMA(prices, 50);

            let sig = signal(price, rsi, ema20, ema50);

            result.push({
                symbol: sym,
                price,
                rsi,
                signal: sig
            });
        }

        res.json(result);

    } catch (err) {
        res.json({ error: err.message });
    }
});

app.get("/", (req, res) => {
    res.send("Backend Running 🚀");
});

app.listen(PORT, () => console.log("Server running on port " + PORT));
