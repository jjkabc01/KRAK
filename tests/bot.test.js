const strategies = require('../strategies');
const utils = require('../utils');
const backtest = require('../backtest');

describe('Stratégies hybrides', () => {
  test('momentum retourne action valide', () => {
    const data = Array.from({ length: 100 }, (_, i) => [0,0,0,0,30000+100*i,0,2]);
    const res = strategies.momentum(data);
    expect(['BUY','SELL','HOLD']).toContain(res.action);
  });

  test('isProfitableAfterFees détecte bien', async () => {
    const pos = { takeProfit: 35000 };
    const data = Array.from({ length: 100 }, (_, i) => [0,0,0,0,30000+100*i,0,2]);
    const profitable = await utils.isProfitableAfterFees(pos, data);
    expect(typeof profitable).toBe('boolean');
  });

  test('backtest.run retourne winRate', async () => {
    const res = await backtest.run('momentum');
    expect(res).toHaveProperty('winRate');
  });
});
