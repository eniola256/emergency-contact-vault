import React, { useEffect, useState } from 'react';

export default function Paid({ api, go }) {
  const [state, setState] = useState({ purchase: null, contactLimit: null });
  const [tries, setTries] = useState(0);
  useEffect(() => {
    let live = true;
    const tick = async () => {
      try {
        const r = await api.latestPurchase();
        if (live) setState(r);
        if (r.purchase?.status === 'PENDING' && live)
          setTimeout(() => setTries((t) => t + 1), 2000);
      } catch {
        if (live) go('login');
      }
    };
    if (tries < 15) tick();
    return () => {
      live = false;
    };
  }, [tries]);
  const p = state.purchase;
  return (
    <div className="wrap page">
      <div className="narrow">
        {p?.status === 'PAID' ? (
          <>
            <span className="tag ok">Payment confirmed</span>
            <h1 style={{ fontSize: '2.3rem', marginTop: 12 }}>+{p.slots} slots added</h1>
            <p className="muted" style={{ marginTop: 10 }}>
              Your account now has <b className="num">{state.contactLimit}</b> contact slots. They
              never expire.
            </p>
          </>
        ) : p?.status === 'PENDING' ? (
          <>
            <span className="tag warn">Waiting for confirmation</span>
            <h1 style={{ fontSize: '2.3rem', marginTop: 12 }}>Confirming your payment</h1>
            <p className="muted" style={{ marginTop: 10 }}>
              {tries < 15
                ? 'This usually takes a few seconds. Slots are added only after Bachs confirms the payment to our server.'
                : 'Still waiting. If you were charged, your slots appear as soon as the confirmation arrives. Check back shortly.'}
            </p>
          </>
        ) : (
          <>
            <h1 style={{ fontSize: '2.3rem' }}>No payment found</h1>
            <p className="muted" style={{ marginTop: 10 }}>
              Your slot count has not changed.
            </p>
          </>
        )}
        <div className="cta-row">
          <button className="btn solid" onClick={() => go('dashboard')}>
            Back to my contacts
          </button>
        </div>
      </div>
    </div>
  );
}
