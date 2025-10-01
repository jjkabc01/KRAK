import sys
import json
import numpy as np
import torch
import torch.nn as nn

print("Chargement données marché pour sélection ML...")
raw = sys.stdin.read()
market_data = json.loads(raw)
closes = np.array([float(row[4]) for row in market_data if float(row[4]) > 0])

# Calcul features (volatilité, trend, RSI, volume)
volatility = np.std(closes[-30:]) if len(closes) > 30 else 0
trend = (closes[-1] - np.mean(closes[-30:])) if len(closes) > 30 else 0
rsi = 50
if len(closes) > 14:
    diffs = np.diff(closes[-15:])
    gains = diffs[diffs > 0].sum() / 14
    losses = -diffs[diffs < 0].sum() / 14
    rs = gains / (losses+1e-6)
    rsi = 100 - (100 / (1 + rs))
volume = np.mean([float(row[6]) for row in market_data[-30:]]) if len(market_data) > 30 else 0

X = np.array([[volatility, trend, rsi, volume]])

# NN simple (3 layers)
class Net(nn.Module):
    def __init__(self):
        super().__init__()
        self.fc = nn.Sequential(
            nn.Linear(4, 16),
            nn.ReLU(),
            nn.Linear(16, 8),
            nn.ReLU(),
            nn.Linear(8, 5)  # 5 stratégies
        )

    def forward(self, x):
        return self.fc(x)

model = Net()
model.load_state_dict(torch.load('model.pth')) # Charger le modèle pré-entraîné

print("Prédiction stratégie ML...")
with torch.no_grad():
    y = model(torch.tensor(X, dtype=torch.float32))
    strategy_idx = int(torch.argmax(y))
    strategies = ['hybridMomentum', 'momentum', 'breakout', 'meanReversion', 'trendFollowing']
    best = strategies[strategy_idx % len(strategies)]

print(json.dumps({"best_strategy": best}))
