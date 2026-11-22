import React, { useState } from 'react';
import Field from '../../components/Field/Field.jsx';
import Msg from '../../components/Msg/Msg.jsx';
import '../../components/Modal/Modal.css';

export default function ContactForm({ api, initial, onClose, onSaved, onFull }) {
  const [name, setName] = useState(initial.name || '');
  const [phone, setPhone] = useState(initial.phone || '');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (initial.id) {
        await api.updateContact(initial.id, name, phone);
        onSaved('Contact updated.');
      } else {
        await api.addContact(name, phone);
        onSaved('Contact saved.');
      }
    } catch (x) {
      if (x.code === 'SLOTS_FULL') {
        setErr(x.message);
        setTimeout(onFull, 1800);
      } else setErr(x.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="scrim" onClick={onClose}>
      <form
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cf-title"
      >
        <h3 id="cf-title">{initial.id ? 'Edit contact' : 'Add a contact'}</h3>
        <div className="form">
          <Field
            id="cf-name"
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            required
            maxLength={80}
          />
          <Field
            id="cf-phone"
            label="Phone number"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <p className="fine" style={{ marginTop: 0 }}>
            Only save numbers of people you have a legitimate reason and permission to keep.
          </p>
          <Msg>{err}</Msg>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn solid" disabled={busy}>
              {busy ? 'Saving…' : 'Save contact'}
            </button>
            <button type="button" className="btn ghost" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
