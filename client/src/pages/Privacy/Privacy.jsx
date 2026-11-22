import React, { useState } from 'react';
import Field from '../../components/Field/Field.jsx';
import Msg from '../../components/Msg/Msg.jsx';

export default function Privacy({ api, go }) {
  const [kind, setKind] = useState('remove-my-number');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api.report(kind, phone, message);
      setDone(true);
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="wrap page">
      <div className="two" style={{ marginTop: 0 }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,2.8rem)' }}>Privacy and terms</h1>
          <Msg kind="ok">
            This is a demonstration project, not a guaranteed emergency service. Do not rely on it
            as your only copy of important numbers, and do not save real people’s numbers in the
            demo.
          </Msg>
          <div style={{ display: 'grid', gap: 18, marginTop: 22 }}>
            <div>
              <h3>What we store</h3>
              <p className="muted">
                Your phone number, a hashed password, and the names and numbers you save. Saved
                numbers are encrypted at rest. Payment records keep a reference, amount and status.
              </p>
            </div>
            <div>
              <h3>Who can see your contacts</h3>
              <p className="muted">
                Only someone who signs in with your phone number and password. Contacts are never on
                a public page or readable by the browser without signing in.
              </p>
            </div>
            <div>
              <h3>Saving someone else’s number</h3>
              <p className="muted">
                Account holders agree to save only numbers they have a legitimate reason and
                permission to keep. If your number was saved and you want it removed, tell us using
                the form.
              </p>
            </div>
            <div>
              <h3>How we protect it</h3>
              <p className="muted">
                Passwords are hashed, never stored as typed. Saved numbers are encrypted. Accounts
                lock for 15 minutes after repeated wrong passwords, and sign-in codes expire and can
                be tried only a few times. If your Telegram is linked, we message you when your
                account is signed in to.
              </p>
            </div>
            <div>
              <h3>Where your data is kept</h3>
              <p className="muted">
                Data is hosted with a cloud database provider and verification codes are sent
                through Telegram, both outside Nigeria. We keep your data until you delete your
                account.
              </p>
            </div>
            <div>
              <h3>Terms of use</h3>
              <p className="muted">
                Use AE Vault only for numbers you are entitled to keep, never to harass or track
                anyone. The service is provided as is, may be unavailable, and needs an internet
                connection. Accounts used for abuse may be removed.
              </p>
            </div>
            <div>
              <h3>Deleting your account</h3>
              <p className="muted">
                Signed-in users can delete their account and all contacts from the dashboard. Only
                payment records that must legally be kept remain.
              </p>
            </div>
          </div>
        </div>
        <div className="panel" style={{ alignSelf: 'start' }}>
          <h3>Send a data request</h3>
          {done ? (
            <div className="form">
              <Msg kind="ok">
                Request received. We will act on it and contact you at that number if we need more.
              </Msg>
              <button className="btn" onClick={() => go('home')}>
                Back to home
              </button>
            </div>
          ) : (
            <form className="form" onSubmit={submit}>
              <label className="f" htmlFor="pv-kind">
                Request
                <select
                  id="pv-kind"
                  className="in"
                  value={kind}
                  onChange={(e) => setKind(e.target.value)}
                >
                  <option value="remove-my-number">Remove my number from someone’s vault</option>
                  <option value="correct-data">Correct my data</option>
                  <option value="other">Something else</option>
                </select>
              </label>
              <Field
                id="pv-phone"
                label="Your phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <label className="f" htmlFor="pv-msg">
                Details <small>Optional</small>
                <textarea
                  id="pv-msg"
                  className="in"
                  rows={4}
                  maxLength={1000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>
              <Msg>{err}</Msg>
              <button className="btn solid" disabled={busy}>
                Send request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
