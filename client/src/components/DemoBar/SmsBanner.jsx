import React from 'react';
import './DemoBar.css';

// Demo only: shows the code the simulated Telegram bot "sent".
export default function SmsBanner({ sms, onDismiss }) {
  return (
    <div className="wrap" style={{ paddingTop: 14 }}>
      <div className="msg sms" role="status">
        <b>
          Simulated Telegram message from @EmergencyNH_bot to{' '}
          <span className="num">{sms.phone}</span>:
        </b>{' '}
        “Your AE Vault code is <b className="num">{sms.code}</b>.”{' '}
        <button className="linkbtn" onClick={onDismiss}>
          Dismiss
        </button>
      </div>
    </div>
  );
}
