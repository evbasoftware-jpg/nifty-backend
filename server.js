const express = require("express");
const yahooFinance = require("yahoo-finance2").default;
const cors = require("cors");

const app = express();
app.use(cors());

const symbols = [
    "^NSEI", "RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS"
];

// ===== INDICATORS =====
function EMA(prices, period){
    let k = 2/(period+1);
    let ema = prices[0];

    for(let i=1;i<prices.length;i++){
        ema = prices[i]*k + ema*(1-k);
    }
    return ema;
}

function RSI(prices, period=14){
    let gains=0, losses=0;

    for(let i=prices.length-period;i<prices.length;i++){
        let diff = prices[i]-prices[i-1];
        if(diff>0) gains+=diff;
        else losses-=diff;
    }

    let rs = gains/(losses||1);
    return 100 - (100/(1+rs));
}

function MACD(prices){
    let ema12 = EMA(prices,12);
    let ema26 = EMA(prices,26);
    return ema12 - ema26;
}

function Bollinger(prices){
    let slice = prices.slice(-20);
    let avg = slice.reduce((a,b)=>a+b,0)/20;

    let std = Math.sqrt(
        slice.map(x=>Math.pow(x-avg,2)).reduce((a,b)=>a+b)/20
    );

    return {
        upper: avg + 2*std,
        lower: avg - 2*std
    }
}

// ===== SIGNAL ENGINE =====
function getSignal(prices){
    let price = prices[prices.length-1];

    let rsi = RSI(prices);
    let ema = EMA(prices,20);
    let macd = MACD(prices);
    let bb = Bollinger(prices);

    let score = 0;

    if(rsi < 30) score++;
    if(rsi > 70) score--;

    if(price > ema) score++;
    else score--;

    if(macd > 0) score++;
    else score--;

    if(price <= bb.lower) score++;
    if(price >= bb.upper) score--;

    let signal = "WAIT";
    if(score >= 2) signal = "BUY";
    if(score <= -2) signal = "SELL";

    return { price, rsi, signal };
}

// ===== API =====
app.get("/api/market", async (req,res)=>{
    try{
        let result = [];

        for(let s of symbols){
            let data = await yahooFinance.chart(s, { range:"1d", interval:"5m" });

            let prices = data.indicators.quote[0].close.filter(x=>x);

            let analysis = getSignal(prices);

            result.push({
                symbol: s,
                ...analysis
            });
        }

        res.json(result);

    }catch(e){
        res.json({error:e.message});
    }
});

app.listen(3000, ()=>console.log("Server running"));
