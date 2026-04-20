const express = require("express");
const axios = require("axios");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connect
mongoose.connect("mongodb://127.0.0.1:27017/saas");

// User model
const User = mongoose.model("User", {
    email: String,
    password: String,
    plan: { type: String, default: "free" }
});

// 🔐 Register
app.post("/register", async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10);
    const user = new User({ email: req.body.email, password: hash });
    await user.save();
    res.json({ msg: "Registered" });
});

// 🔐 Login
app.post("/login", async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.json({ error: "User not found" });

    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) return res.json({ error: "Wrong password" });

    const token = jwt.sign({ id: user._id }, "secret");
    res.json({ token });
});

// 📊 Market Data API
app.get("/data", async (req, res) => {
    try {
        let symbol = req.query.symbol || "^NSEI";

        let url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`;

        let r = await axios.get(url);

        let result = r.data.chart.result[0];
        let prices = result.indicators.quote[0].close.filter(x => x);

        res.json({
            price: prices[prices.length - 1],
            prices: prices
        });

    } catch {
        res.json({ error: "API error" });
    }
});

app.listen(10000, () => console.log("SaaS API running 🚀"));
