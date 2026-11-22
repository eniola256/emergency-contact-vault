import React, { useState } from 'react';
import { fmt } from '../../lib/format.js';
import Field from '../../components/Field/Field.jsx';
import Msg from '../../components/Msg/Msg.jsx';
import './Auth.css';

export default function Register({ api, setUser, go, say }) {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [code, setCode] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [botUrl, setBotUrl] = useState(null);
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
      <h1>{step === 1 ? 'Create your vault' : 'Confirm your number'}</h1>
      <p className="muted" style={{ marginTop: 10 }}>
        {step === 1
          ? 'Your phone number and password are all you need to get your contacts back later.'
          : `Verify ${fmt(phone)} with our Telegram bot, then enter the code it sends you.`}
      </p>
      {step === 1 ? (
        <form
          className="form"
          onSubmit={run(async () => {
            const r = await api.register(phone, pw);
            setPhone(r.phone);
            setBotUrl(r.botUrl);
            setStep(2);
          })}
        >
          <Field
            id="reg-phone"
            autoFocus
            label="Phone number"
            hint="Include your country code if it is not local."
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <Field
            id="reg-pw"
            label="Password"
            hint="At least 10 characters, not a common password. Choose one you will remember without your phone."
            type="password"
            autoComplete="new-password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
          <Msg>{err}</Msg>
          <button className="btn solid big" disabled={busy}>
            {busy ? 'Starting…' : 'Continue'}
          </button>
          <p className="fine" style={{ marginTop: 0 }}>
            Next you will confirm this number in Telegram. You need the Telegram account that uses
            it.
          </p>
        </form>
      ) : (
        <form
          className="form"
          onSubmit={run(async () => {
            const r = await api.verifyRegistration(phone, code);
            setUser(r.user);
            say('Account created with 3 free slots.');
            go('dashboard');
          })}
        >
          <ol className="steps">
            <li>
              {api.demo ? (
                <button
                  type="button"
                  className="btn accent"
                  onClick={() => api.simulateTelegram(phone)}
                >
                  Simulate: press Start and share my number
                </button>
              ) : (
                <a className="btn accent" href={botUrl} target="_blank" rel="noreferrer">
                  Open Telegram bot
                </a>
              )}
            </li>
            <li>
              In Telegram press <b>Start</b>, then tap <b>Share my phone number</b>.
            </li>
            <li>Type the 6-digit code the bot sends you below.</li>
          </ol>
          <label className="f" htmlFor="reg-code">
            Code
            <input
              id="reg-code"
              className="in otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              required
            />
          </label>
          <Msg>{err}</Msg>
          <button className="btn solid big" disabled={busy || code.length !== 6}>
            {busy ? 'Checking…' : 'Create account'}
          </button>
          <button
            type="button"
            className="linkbtn"
            onClick={() => {
              setStep(1);
              setCode('');
              setErr('');
              setBotUrl(null);
            }}
          >
            Use a different number
          </button>
        </form>
      )}
      <div className="links">
        <span className="muted">Already have an account?</span>
        <button className="linkbtn" onClick={() => go('login')}>
          Sign in
        </button>
      </div>
    </div>
  );
}
