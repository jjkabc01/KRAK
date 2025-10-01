import React from 'react';
import axios from 'axios';

export default function Modes() {
  const startMode = async mode => {
    try {
      await axios.get(`/api/modes/${mode}`);  // Auto select via ML
      alert(`${mode} lancé`);
    } catch (e) {
      alert(`Erreur lancement mode: ${e.message}`);
    }
  };

  return (
    <div>
      <button onClick={() => startMode('backtest')}>Backtest</button>
      <button onClick={() => startMode('paper')}>Paper</button>
      <button onClick={() => startMode('live')}>Live (prudence)</button>
    </div>
  );
}