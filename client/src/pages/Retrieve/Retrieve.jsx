import React, { useEffect, useRef, useState } from 'react';
import Field from '../../components/Field/Field.jsx';
import Msg from '../../components/Msg/Msg.jsx';
import ContactRow from '../../components/ContactRow/ContactRow.jsx';
import './Retrieve.css';

export default function Retrieve({ api, go }) {
  const [phone, setPhone] = useState('');
  const [pw, setPw] = useState('');
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const timer = useRef();
  const clear = () => {
    setList(null);
    setPw('');
    setPhone('');
    clearTimeout(timer.current);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api.retrieve(phone, pw);
      setList(r.contacts);
      setPw('');
      timer.current = setTimeout(clear, 5 * 60_000);
    } catch (x) {
      setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth retrieve">
      {!list ? (
        <>
          <h1>Get your contacts back</h1>
          <p className="muted" style={{ marginTop: 10 }}>
            Enter the phone number and password you registered with.
          </p>
          <form className="form" onSubmit={submit}>
            <Field
              id="rt-phone"
              label="Your registered phone number"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoFocus
              required
            />
            <Field
              id="rt-pw"
              label="Password"
              type="password"
              autoComplete="current-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              required
            />
            <Msg>{err}</Msg>
            <button className="btn accent big" disabled={busy}>
              {busy ? 'Looking up…' : 'Show my contacts'}
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
          </div>
          <p className="fine">
            This page keeps no sign-in on the device. Your contacts clear from the screen after 5
            minutes or when you press Done.
          </p>
        </>
      ) : (
        <>
          <h1>
            {list.length
              ? `${list.length} contact${list.length === 1 ? '' : 's'}`
              : 'No contacts saved'}
          </h1>
          <div className="found" role="list">
            {list.map((c) => (
              <ContactRow key={c.id} role="listitem" name={c.name} phone={c.phone}>
                <a className="btn solid sm" href={`tel:${c.phone}`}>
                  Call
                </a>
              </ContactRow>
            ))}
          </div>
          <div className="cta-row">
            <button
              className="btn big"
              onClick={() => {
                clear();
                go('home');
              }}
            >
              Done, clear this screen
            </button>
          </div>
          <p className="fine">
            If calling does not start from this device, read the number off the screen.
          </p>
        </>
      )}
    </div>
  );
}
