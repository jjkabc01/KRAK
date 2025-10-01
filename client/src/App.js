import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Modes from './Modes';
import Chat from './Chat';
import { Chart } from "recharts"; // Import Chart

const socket = io('http://localhost:3000');

function App() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on('message', msg => setMessages(msgs => [...msgs, msg]));
    return () => socket.off('message');
  }, []);

  const download = async type => {
    const res = await axios.get(`/api/download/${type}`, { responseType:'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div>
      <h2>Trading Bot Web</h2>
      <Modes />
      <button onClick={() => download('backtest')}>Download Backtest CSV</button>
      <Chat messages={messages}/>
    </div>
  );
}

export default App;