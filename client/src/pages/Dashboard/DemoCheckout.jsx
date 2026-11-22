import React, { useState } from 'react';
import { money } from '../../lib/format.js';
import '../../components/Modal/Modal.css';

// Stand-in for the hosted Bachs checkout page, used only in demo mode.
export default function DemoCheckout({ api, info, onClose, onPaid }) {
  const [busy, setBusy] = useState(false);
  const pay = async () => {
    setBusy(true);
    await api.simulateWebhook(info.reference);
    onPaid();
  };
  const cancel = async () => {
    await api.cancelDemoPurchase(info.reference);
    onClose();
  };
  return (
    <div className="scrim">
      <div className="modal sandbox" role="dialog" aria-modal="true" aria-labelledby="co-title">
        <span className="tag warn">Bachs sandbox, simulated</span>
        <h3 id="co-title" style={{ marginTop: 12 }}>
          Pay {money(info.currency, info.pkg.price)}
        </h3>
        <p className="muted" style={{ marginTop: 6 }}>
          {info.pkg.name} pack: +{info.pkg.slots} contact slots, one-time. In the live site you are
          sent to the hosted Bachs checkout here. No real payment happens in this demo.
        </p>
        <p className="fine num">Reference {info.reference}</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
          <button className="btn solid" onClick={pay} disabled={busy}>
            {busy ? 'Confirming…' : `Pay ${money(info.currency, info.pkg.price)}`}
          </button>
          <button className="btn ghost" onClick={cancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
