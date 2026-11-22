import React, { useState } from 'react';
import Field from '../../components/Field/Field.jsx';
import Msg from '../../components/Msg/Msg.jsx';
import './Auth.css';

export default function Login({ api, setUser, go }) {
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api.login(phone, pw);
      setUser(r.user);
      go('dashboard');
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth">
      <h1>Sign in</h1>
      <form className="form" onSubmit={submit}>
        <Field
          id="login-phone"
          autoFocus
          label="Phone number"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Field
          id="login-pw"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          required
        />
        <Msg>{err}</Msg>
        <button className="btn solid big" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        {api.demo && (
          <button
            type="button"
            className="btn sm"
            onClick={() => {
              setPhone(api.demoPhone);
              setPw(api.demoPassword);
            }}
          >
            Fill in demo account
          </button>
        )}
      </form>
      <div className="links">
        <button className="linkbtn" onClick={() => go('forgot')}>
          Forgot your password?
        </button>
        <button className="linkbtn" onClick={() => go('register')}>
          Create an account
        </button>
      </div>
      <p className="fine">
        Only need your numbers right now?{' '}
        <button className="linkbtn" onClick={() => go('retrieve')}>
          Use the quick retrieval page
        </button>
        .
      </p>
    </div>
  );
}
