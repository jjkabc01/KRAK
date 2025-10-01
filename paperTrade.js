const strategies = require('./strategies');
const utils = require('./utils');

let virtualCapital = 10000;

function simulate(strategyName, io) {
  setInterval(() => {
    // Simule data
    const data = Array.from({ length: 200 }, () => [
      0, 0, 0, 0, (30000 + Math.random() * 5000).toFixed(2), 0, (2 + Math.random()*3).toFixed(2)
    ]);
    const decision = strategies[strategyName](data, {});
    utils.log(`[Paper] Décision: ${JSON.stringify(decision)}`, io);

    // Simule update capital
    const delta = Math.random() > 0.5 ? 50 : -50;
    virtualCapital += delta;
    utils.log(`[Paper] Capital virtuel: ${virtualCapital}`, io);
  }, 30000);
}

module.exports = { simulate };