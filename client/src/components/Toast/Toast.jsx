import React from 'react';
import './Toast.css';

export default function Toast({ text }) {
  return (
    <div className="toast" role="status">
      {text}
    </div>
  );
}
