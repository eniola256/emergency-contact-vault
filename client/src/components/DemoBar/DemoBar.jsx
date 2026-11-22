import React from 'react';
import './DemoBar.css';

// Strip shown only in the demo build, which runs entirely in the browser.
export default function DemoBar({ api }) {
  return (
    <div className="demo-bar">
      <div className="wrap">
        <b>Demo mode.</b>{' '}
        <span className="demo-note">
          Everything stays in this browser. The Telegram bot and card payments are simulated.
        </span>
        <span className="muted" style={{ color: 'inherit', opacity: 0.8 }}>
          Demo login: <span className="num">{api.demoPhone}</span> / {api.demoPassword}
        </span>
      </div>
    </div>
  );
}
