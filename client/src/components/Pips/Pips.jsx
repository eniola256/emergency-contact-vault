import React from 'react';
import './Pips.css';

export default function Pips({ used, limit }) {
  const shown = Math.min(limit, 30);
  return (
    <div className="pips" role="img" aria-label={`${used} of ${limit} slots used`}>
      {Array.from({ length: shown }, (_, i) => (
        <i key={i} className={i < used ? 'on' : ''} />
      ))}
    </div>
  );
}
