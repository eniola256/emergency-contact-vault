import React, { useState } from 'react';
import Field from '../../components/Field/Field.jsx';
import Msg from '../../components/Msg/Msg.jsx';

export default function DeleteAccount({ api, go, say, setUser, onCancel }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.deleteAccount(pw);
      setUser(null);
      say('Your account and contacts were deleted.');
      go('home');
    } catch (x) {
      setErr(x.message);
    }
  };
  return (
    <form className="form" style={{ maxWidth: 360 }} onSubmit={submit}>
      <Field
        id="del-pw"
        label="Enter your password to confirm"
        type="password"
        autoComplete="current-password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        required
      />
      <Msg>{err}</Msg>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn danger">Delete everything</button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
