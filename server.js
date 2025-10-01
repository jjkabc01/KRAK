require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const bot = require('./bot');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*' }
});

// Serve React build (frontend)
app.use(express.static(path.join(__dirname, 'client/build')));

// Endpoint pour démarrer le bot (auto-select strat via AI)
app.get('/api/modes/:mode', async (req, res) => {
  const mode = req.params.mode;
  bot.start(mode, io); // Sélection stratégie auto via ML dans bot.js
  res.json({ status: 'Bot lancé', mode });
});

// Endpoint pour télécharger les résultats (CSV)
app.get('/api/download/:type', (req, res) => {
  const type = req.params.type;
  const filePath = path.join(__dirname, 'data', `${type}.csv`);
  if (fs.existsSync(filePath)) {
    res.download(filePath);
  } else {
    res.status(404).json({ error: 'Fichier non trouvé' });
  }
});

// Catch-all pour React (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Socket.io pour logs live
io.on('connection', (socket) => {
  console.log('User connecté au chat live');
});

// Lancer le serveur (port 3000)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});