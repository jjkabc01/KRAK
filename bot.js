const KrakenClient = require('kraken-js');
const strategies = require('./strategies');
const utils = require('./utils');
const backtest = require('./backtest');
const paperTrade = require('./paperTrade');
const axios = require('axios');
const { spawn } = require('child_process');

require('dotenv').config();

const kraken = new KrakenClient(process.env.KRAKEN_API_KEY, process.env.KRAKEN_API_SECRET);

let activeMode = null;
let intervalId = null;
let capitalCAD = 100;  // Capital initial

async function selectBestStrategy(marketData, io) {
  utils.log('Lancement ML pour sélection stratégie...', io);
  return new Promise((resolve) => {
    const py = spawn('python', ['ml_strategy_selector.py']);
    py.stdin.write(JSON.stringify(JSON.stringify(marketData)));  // Envoie marketData au script Python
    py.stdin.end();
    let output = '';
    py.stdout.on('data', (data) => {
      output += data;
      utils.log(`ML output: ${data}`, io);
    });
    py.on('close', () => {
      try {
        const { best_strategy } = JSON.parse(output);
        resolve(best_strategy);
      } catch (e) {
        utils.log('Erreur ML, fallback momentum.', io);
        resolve('momentum'); // Stratégie par défaut si erreur
      }
    });
  });
}

async function start(mode, io) {
  activeMode = mode;
  utils.log(`=== Démarrage du bot en mode ${mode} ===`, io);

  // Conversion CAD->USD (prudence: API pour taux)
  let capital = capitalCAD;
  try {
    const fx = await axios.get('https://api.exchangerate.host/latest?base=CAD&symbols=USD');
    const usdRate = fx.data.rates.USD;
    capital = capitalCAD * usdRate;
    utils.log(`Capital initial: ${capitalCAD} CAD ≈ ${capital.toFixed(2)} USD`, io);
  } catch (e) {
    utils.log('Erreur conversion CAD->USD. Utilise 100 USD.', io);
    capital = 100; // Fallback
  }

  // Interval principal (30s)
  clearInterval(intervalId);
  intervalId = setInterval(async () => {
    try {
      utils.log('--- Nouvelle itération trading ---', io);

      // 1. Télécharger les données du marché (Kraken API)
      utils.log('Téléchargement données marché...', io);
      const resp = await kraken.api('OHLC', { pair: 'XBTUSD', interval: 1 });
      const marketData = resp.result.XXBTZUSD;
      utils.log(`Données marché reçues : ${marketData.length} bougies.`, io);

      // 2. Sélectionner la meilleure stratégie via ML (Python)
      const bestStrategy = await selectBestStrategy(marketData, io);
      utils.log(`Stratégie ML sélectionnée : ${bestStrategy}`, io);

      // 3. Appliquer la stratégie (avec données fondamentales)
      const fundData = {}; // Placeholder: scraping/search pour sentiment
      const stratFn = strategies[bestStrategy] || strategies['momentum'];
      const decision = stratFn(marketData, fundData);

      // 4. Gestion du risque et calcul des frais
      const withRisk = utils.applyRiskManagement(decision, marketData);
      const isOk = utils.isProfitableAfterFees(withRisk, marketData);
      utils.log(`Décision : ${JSON.stringify(withRisk)} | Profitable après frais ? ${isOk}`, io);

      // 5. Exécuter le trade (si profitable et action BUY/SELL)
      if (isOk && (decision.action === 'BUY' || decision.action === 'SELL') && !utils.checkTradeLimit()) {
        await executeTrade(withRisk, io, mode);
      } else {
        utils.log('Trade non exécuté (pas profitable, limite atteinte, ou HOLD)', io);
      }

      // 6. Monitoring des positions (trailing stops)
      utils.monitorPosition(withRisk, io);

      // 7. Auto-backtest quotidien (à 00:01)
      if (new Date().getHours() === 0 && new Date().getMinutes() < 1) {
        await backtest.runAll(io);
      }

    } catch (e) {
      utils.log('Erreur dans le bot : ' + (e.message || e), io);
    }
  }, 30000); // Intervalle de 30 secondes

  // Paper trading simulation
  if (mode === 'paper') {
    paperTrade.simulate('momentum', io);
  }
}

async function executeTrade(position, io, mode) {
  utils.log(`Exécution trade : ${position.action} ${position.size || '?'} BTC`, io);
  if (mode === 'live') {
    try {
      const order = await kraken.api('AddOrder', {
        pair: 'XBTUSD',
        type: position.action.toLowerCase(),
        ordertype: 'market',
        volume: position.size
      });
      utils.log(`Ordre exécuté: ${JSON.stringify(order)}`, io);
    } catch (e) {
      utils.log('Erreur exécution ordre Kraken : ' + (e.message || e), io);
    }
  } else {
    utils.log(`[Paper] Trade simulé: ${JSON.stringify(position)}`, io);
  }
}

module.exports = { start };