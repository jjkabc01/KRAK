const ti = require('technicalindicators');
const utils = require('./utils');
const axios = require('axios'); // Pour web_search sentiment

// --- Stratégies Hybrides Tech+Fund ---
module.exports = {
  async hybridMomentum(data, fundData) {
    utils.log('Calcul hybridMomentum...', null);
    const closes = data.map(row => parseFloat(row[4]));
    const rsi = ti.RSI.calculate({ period: 14, values: closes });
    const macd = ti.MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
    const lastRSI = rsi[rsi.length - 1];
    const lastMACD = macd[macd.length - 1];

    // Placeholder: sentiment via web_search (ou API X)
    let sentiment = 0.5;
    try {
      // Utilise axios pour web_search (attention: coûteux, limiter)
      // const search = await axios.get(`https://api.example.com/web_search?q=Bitcoin+sentiment`);
      // sentiment = search.data.score;
    } catch (e) {
      utils.log('Erreur web_search sentiment, utilise valeur par défaut.', null);
    }

    let score = 0;
    if (lastRSI < 30) score += 0.4;
    if (lastMACD && lastMACD.MACD > lastMACD.signal) score += 0.2;
    if (sentiment > 0.7) score += 0.4;

    const action = score > 0.7 ? 'BUY' : score < 0.3 ? 'SELL' : 'HOLD';
    return {
      action,
      confidence: score,
      expectedWinRate: 0.65,
      reason: `RSI=${lastRSI}, MACD=${lastMACD?.MACD}, Sentiment=${sentiment}`
    };
  },

  deltaNeutralArbitrage(data) {
    utils.log('Calcul deltaNeutralArbitrage...', null);
    // Placeholder: funding rate fetch, Bollinger squeeze
    return {
      action: 'HOLD',
      confidence: 0.5,
      expectedWinRate: 0.6,
      reason: 'Funding rate neutre, pas d\'arbitrage.'
    };
  },

  aiScalping(data) {
    utils.log('Calcul aiScalping...', null);
    // Placeholder: VWAP + ML
    return {
      action: 'HOLD',
      confidence: 0.5,
      expectedWinRate: 0.65,
      reason: 'Scalping AI (simulé).'
    };
  },

  yieldTrend(data, fund) {
    utils.log('Calcul yieldTrend...', null);
    // Placeholder: ETF inflows, SMA
    return {
      action: 'HOLD',
      confidence: 0.5,
      expectedWinRate: 0.62,
      reason: 'ETF inflows neutres.'
    };
  },

  sentimentBreakout(data, fund) {
    utils.log('Calcul sentimentBreakout...', null);
    // Placeholder: pattern breakout + news
    return {
      action: 'HOLD',
      confidence: 0.5,
      expectedWinRate: 0.6,
      reason: 'Pas de news spike.'
    };
  },

  // --- Stratégies classiques (momentum, etc.) ---
  momentum(data) {
    utils.log('Calcul momentum...', null);
    const closes = data.map(row => parseFloat(row[4]));
    const rsi = ti.RSI.calculate({ period: 14, values: closes });
    const macd = ti.MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 });
    const sma = ti.SMA.calculate({ period: 50, values: closes });
    const lastRSI = rsi[rsi.length - 1];
    const lastMACD = macd[macd.length - 1];
    const lastSMA = sma[sma.length - 1];
    const price = closes[closes.length - 1];
    let score = 0;
    if (lastRSI < 30) score++;
    if (lastMACD && lastMACD.MACD > lastMACD.signal) score++;
    if (price > lastSMA) score++;
    const action = score >= 2 ? 'BUY' : score <= 1 ? 'SELL' : 'HOLD';
    return {
      action,
      confidence: score / 3,
      reason: `RSI=${lastRSI}, MACD=${lastMACD?.MACD}, SMA=${lastSMA}`
    };
  },

  meanReversion(data) {
    utils.log('Calcul meanReversion...', null);
    const closes = data.map(row => parseFloat(row[4]));
    const rsi = ti.RSI.calculate({ period: 14, values: closes });
    const lastRSI = rsi[rsi.length - 1];
    let action = 'HOLD';
    if (lastRSI < 30) action = 'BUY';
    if (lastRSI > 70) action = 'SELL';
    return {
      action,
      confidence: 0.5,
      reason: `RSI=${lastRSI}`
    };
  },

  breakout(data) {
    utils.log('Calcul breakout...', null);
    const highs = data.slice(-20).map(row => parseFloat(row[2]));
    const closes = data.map(row => parseFloat(row[4]));
    const volume = data.slice(-20).map(row => parseFloat(row[6]));
    const maxHigh = Math.max(...highs);
    const lastClose = closes[closes.length - 1];
    const lastVol = volume[volume.length - 1];
    let action = 'HOLD';
    if (lastClose > maxHigh && lastVol > (volume.reduce((a,b) => a+b,0) / volume.length) * 1.2) action = 'BUY';
    if (lastClose < Math.min(...highs)) action = 'SELL';
    return {
      action,
      confidence: 0.6,
      reason: `Breakout avec volume, close=${lastClose}, maxHigh=${maxHigh}`
    };
  },

  trendFollowing(data) {
    utils.log('Calcul trendFollowing...', null);
    const closes = data.map(row => parseFloat(row[4]));
    const sma50 = ti.SMA.calculate({ period: 50, values: closes });
    const sma200 = ti.SMA.calculate({ period: 200, values: closes });
    const lastSMA50 = sma50[sma50.length - 1];
    const lastSMA200 = sma200[sma200.length - 1];

    let action = 'HOLD';
    if (lastSMA50 > lastSMA200) action = 'BUY';
    if (lastSMA50 < lastSMA200) action = 'SELL';
    return {
      action,
      confidence: 0.7,
      reason: `SMA50=${lastSMA50}, SMA200=${lastSMA200}`
    };
  },

  arbitrage() {
    utils.log('Calcul arbitrage...', null);
    // Placeholder: Kraken vs Binance (API call)
    return {
      action: 'HOLD',
      confidence: 0.5,
      reason: 'Pas d\'opportunité arbitrage.'
    };
  },

  gridTrading(data, basePrice) {
    utils.log('Calcul gridTrading...', null);
    // Placeholder: set buy/sell orders at intervals
    return {
      action: 'HOLD',
      confidence: 0.5,
      reason: 'Grid trading (simulé).'
    };
  },

  sentimentAnalysis() {
    utils.log('Calcul sentimentAnalysis...', null);
    // Placeholder: X semantic search
    return {
      action: 'HOLD',
      confidence: 0.5,
      reason: 'Sentiment neutre.'
    };
  },

  dayTrading(data) {
    utils.log('Calcul dayTrading...', null);
    // Placeholder: day trading logic
    return {
      action: 'HOLD',
      confidence: 0.5,
      reason: 'Day trading (simulé).'
    };
  },

  swingTrading(data) {
    utils.log('Calcul swingTrading...', null);
    // Placeholder: swing trading logic
    return {
      action: 'HOLD',
      confidence: 0.5,
      reason: 'Swing trading (simulé).'
    };
  },

  supportResistance(data) {
    utils.log('Calcul supportResistance...', null);
    // Placeholder: support/resistance levels
    return {
      action: 'HOLD',
      confidence: 0.5,
      reason: 'Support/resistance (simulé).'
    };
  }
};
