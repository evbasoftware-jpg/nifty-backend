const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const symbols = ["^NSEI","^NSEBANK","RELIANCE.NS","TCS.NS","INFY.NS"];

// ===== FETCH PRICE =====
async function getPrices(symbol){
    let url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=5m&range=1d`;
    let res = await axios.get(url);
    return res.data.chart.result[0].indicators.quote[0].close.filter(x=>x);
}

// ===== EMA =====
function EMA(prices, period){
    let k = 2/(period+1);
    let ema = prices[0];
    for(let i=1;i<prices.length;i++){
        ema = prices[i]*k + ema*(1-k);
    }
    return ema;
}

// ===== RSI =====
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

// ===== MACD =====
function MACD(prices){
    let ema12 = EMA(prices,12);
    let ema26 = EMA(prices,26);
    let macd = ema12 - ema26;
    let signal = macd * 0.8; // approx
    return {macd, signal};
}

// ===== BOLLINGER =====
function BB(prices){
    let slice = prices.slice(-20);
    let avg = slice.reduce((a,b)=>a+b,0)/20;
    let std = Math.sqrt(slice.map(x=>Math.pow(x-avg,2)).reduce((a,b)=>a+b)/20);
    return {
        upper: avg + 2*std,
        lower: avg - 2*std
    };
}

// ===== API =====
app.get("/api/market", async (req,res)=>{

    let result = [];

    for(let s of symbols){

        let prices = await getPrices(s);

        let price = prices[prices.length-1];

        let ema9 = EMA(prices,9);
        let ema21 = EMA(prices,21);

        let rsi = RSI(prices);

        let macdData = MACD(prices);

        let bb = BB(prices);

        let signal = "WAIT";

        if(
            ema9 > ema21 &&
            macdData.macd > macdData.signal &&
            rsi < 35 &&
            price <= bb.lower
        ){
            signal = "BUY";
        }

        else if(
            ema9 < ema21 &&
            macdData.macd < macdData.signal &&
            rsi > 65 &&
            price >= bb.upper
        ){
            signal = "SELL";
        }

        result.push({
            symbol:s,
            price,
            rsi,
            ema9,
            ema21,
            macd: macdData.macd,
            signal
        });
    }

    res.json(result);
});

app.listen(3000, ()=>console.log("🔥 AI Trading API Running"));
