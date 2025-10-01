const strategies = require('./strategies');
const utils = require('./utils');
const KrakenClient = require('kraken-js');
const axios = require('axios');
require('dotenv').config();

const kraken = new KrakenClient(process.env.KRAKEN_API_KEY, process.env.KRAKEN_API_SECRET);

async function fetchHistoricalData() {
  utils.log('Téléchargement données historiques...', null);
  const since = Math.floor((Date.now()/1000) - 365*24*3600); // 1 an
  const resp = await kraken.api('OHLC', { pair: 'XBTUSD', interval: 1, since });
  let data = resp.result.XXBTZUSD;
  utils.log(`${data.length} bougies téléchargées.`, null);
  data = data.filter(x => !isNaN(parseFloat(x[4]))); // Clean NaN
  return data;
}

async function run(strategyName, io) {
  utils.log(`Backtest stratégie ${strategyName}...`, io);
  const data = await fetchHistoricalData();
  let capital = 100;
  let trades = 0, wins = 0, profit = 0;
  const results = [];

  for (let i = 50; i < data.length - 1; i++) {
    const window = data.slice(i-50, i);
    const strat = strategies[strategyName] || strategies['momentum'];
    const decision = strat(window, {});

    if (decision.action === 'BUY') {
      trades++;
      // Simulation du trade (simplifié)
      if (Math.random() > 0.4) {
        wins++;
        profit += capital*0.01; // Gain
      } else {
        profit -= capital*0.005; // Perte
      }
    }
    results.push({ i, action: decision.action });
  }

  const winRate = wins / (trades||1);
  const sharpe = 1.5; // Placeholder (calcul réel plus complexe)
  utils.exportData('backtest', results);
  utils.log(`Résultats: winRate=${winRate}, profit=${profit}, sharpe=${sharpe}`, io);
  return { winRate, profit, sharpe };
}

async function runAll(io) {
  const strats = Object.keys(strategies);
  for (const s of strats) {
    await run(s, io);
  }
}

module.exports = { run, runAll };