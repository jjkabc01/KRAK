const fs = require('fs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const axios = require('axios');

let tradeCount = 0;
let positions = [];
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

function log(message, io) {
  console.log(message);
  if (io) io.emit('message', message);
  // Telegram alert (BUY/SELL)
  if (/BUY|SELL/.test(message) && TELEGRAM_TOKEN && TELEGRAM_CHAT_ID) {
    axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message
    }).catch(() => {
      console.error('Erreur Telegram.');
    });
  }
}

function checkTradeLimit() {
  if (tradeCount >= 5) return true; // Limite (prudence)
  tradeCount++;
  return false;
}

function applyRiskManagement(decision, data) {
  log('Gestion du risque...', null);
  const closes = data.map(row => parseFloat(row[4]));
  const price = closes[closes.length - 1];
  const stopLoss = price * 0.95; // Stop-loss (-5%)
  const takeProfit = price * 1.10; // Take-profit (+10%)
  const size = 0.001; // Petite position (prudence)
  return {
    ...decision,
    size,
    stopLoss,
    takeProfit
  };
}

async function isProfitableAfterFees(position, data) {
  // Calcule frais Kraken (dynamic tiers via API si possible)
  log('Calcul frais Kraken...', null);
  const closes = data.map(row => parseFloat(row[4]));
  const price = closes[closes.length - 1];
  const fee = 0.0026; // Taker fee (exemple)
  const slippage = 0.0005; // Slippage (0.05%)
  const breakeven = price * (1 + 2 * fee + slippage);
  return (position.takeProfit || 0) > breakeven;
}

function monitorPosition(position, io) {
  positions.push(position);
  log(`Position monitorée: SL=${position.stopLoss}, TP=${position.takeProfit}`, io);
}

function exportData(type, data) {
  const csvWriter = createCsvWriter({
    path: `data/${type}.csv`,
    header: Object.keys(data[0]).map(k => ({ id: k, title: k }))
  });
  csvWriter.writeRecords(data).then(() => {
    log(`Export CSV data/${type}.csv terminé.`, null);
  });
}

module.exports = { log, checkTradeLimit, applyRiskManagement, isProfitableAfterFees, monitorPosition, exportData };