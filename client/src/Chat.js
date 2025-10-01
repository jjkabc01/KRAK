import React from 'react';

export default function Chat({ messages }) {
  return (
    <div style={{height:200, overflowY:'scroll', border:'1px solid #ccc'}}>
      {messages.map((m,i) => (
        <div key={i}>{m}</div>
      ))}
    </div>
  );
}
