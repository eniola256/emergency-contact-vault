import React, { useState } from 'react';
import Field from '../../components/Field/Field.jsx';
import Msg from '../../components/Msg/Msg.jsx';
import './Auth.css';

export default function Forgot({ api, go, say }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const run = (fn) => async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await fn();
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth">
      <h1>Reset your password</h1>
      <p className="muted" style={{ marginTop: 10 }}>
        {step === 1
          ? 'We will send a code through the Telegram bot, to the Telegram account you verified at sign-up.'
          : 'If that number has an account, the bot has sent a code. Open Telegram, then enter the code with a new password.'}
      </p>
      {step === 1 ? (
        <form
          className="form"
          onSubmit={run(async () => {
            await api.forgot(phone);
            setStep(2);
          })}
        >
          <Field
            id="fp-phone"
            autoFocus
            label="Phone number"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Msg>{err}</Msg>
          <button className="btn solid big" disabled={busy}>
            Send code
          </button>
        </form>
      ) : (
        <form
          className="form"
          onSubmit={run(async () => {
            await api.reset(phone, code, pw);
            say('Password changed. Sign in with the new one.');
            go('login');
          })}
        >
          <label className="f" htmlFor="fp-code">
            Code
            <input
              id="fp-code"
              className="in otp"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </label>
          <Field
            id="fp-pw"
            label="New password"
            hint="At least 10 characters, not a common password."
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
          <Msg>{err}</Msg>
          <button className="btn solid big" disabled={busy || code.length !== 6}>
            Change password
          </button>
        </form>
      )}
      <div className="links">
        <button className="linkbtn" onClick={() => go('login')}>
          Back to sign in
        </button>
      </div>
    </div>
  );
}
