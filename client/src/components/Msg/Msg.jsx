import React from 'react';
import './Msg.css';

export default function Msg({ kind = 'err', children }) {
  return children ? (
    <div className={`msg ${kind}`} role={kind === 'err' ? 'alert' : 'status'}>
      {children}
    </div>
  ) : null;
}
