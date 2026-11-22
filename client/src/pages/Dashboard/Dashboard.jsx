import React, { useCallback, useEffect, useState } from 'react';
import Msg from '../../components/Msg/Msg.jsx';
import Pips from '../../components/Pips/Pips.jsx';
import ContactRow from '../../components/ContactRow/ContactRow.jsx';
import { fmt, money } from '../../lib/format.js';
import DeleteAccount from './DeleteAccount.jsx';
import ContactForm from './ContactForm.jsx';
import DemoCheckout from './DemoCheckout.jsx';
import './Dashboard.css';

export default function Dashboard({ api, user, setUser, go, say }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null); // null | {} (new) | contact
  const [confirmDel, setConfirmDel] = useState(null);
  const [pk, setPk] = useState({ currency: 'USD', packages: [] });
  const [checkout, setCheckout] = useState(null);
  const [delAcct, setDelAcct] = useState(false);

  const load = useCallback(async () => {
    try {
      setData(await api.listContacts());
      const r = await api.me();
      setUser(r.user);
    } catch (e) {
      if (e.status === 401) {
        say('Your session ended. Sign in again.');
        go('login');
      } else setErr(e.message);
    }
  }, [api]);
  useEffect(() => {
    load();
    api
      .packages()
      .then(setPk)
      .catch(() => {});
  }, [load]);

  if (!data)
    return (
      <div className="wrap page">
        <p className="muted">{err || 'Loading your contacts…'}</p>
      </div>
    );
  const full = data.used >= data.limit;
  const remove = async (id) => {
    try {
      await api.removeContact(id);
      setConfirmDel(null);
      say('Contact deleted. One slot is free again.');
      load();
    } catch (e) {
      setErr(e.message);
    }
  };
  const buy = async (id) => {
    setErr('');
    try {
      const r = await api.checkout(id);
      if (r.checkoutUrl) window.location.href = r.checkoutUrl;
      else setCheckout(r.demo);
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="wrap page">
      <h1 style={{ fontSize: 'clamp(2rem,5vw,2.8rem)' }}>Your contacts</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        Signed in as <span className="num">{fmt(data && user?.phone)}</span>
      </p>
      <div className="dash">
        <div className="panel">
          <div className="vault-head">
            <h3>Saved numbers</h3>
            <button className="btn solid sm" disabled={full} onClick={() => setEditing({})}>
              Add contact
            </button>
          </div>
          <Msg>{err}</Msg>
          {full && (
            <Msg kind="info">
              All {data.limit} slots are in use. Delete a contact to add another.
            </Msg>
          )}
          {data.contacts.length === 0 && (
            <div className="empty">
              <b>No contacts yet.</b>
              <br />
              Add the people you would need to reach if your phone were gone.
            </div>
          )}
          {data.contacts.map((c) => (
            <ContactRow key={c.id} name={c.name} phone={c.phone}>
              <div className="actions">
                {confirmDel === c.id ? (
                  <>
                    <button className="btn danger sm" onClick={() => remove(c.id)}>
                      Confirm delete
                    </button>
                    <button className="btn ghost sm" onClick={() => setConfirmDel(null)}>
                      Keep
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn sm"
                      onClick={() => setEditing(c)}
                      aria-label={`Edit ${c.name}`}
                    >
                      Edit
                    </button>
                    <button
                      className="btn ghost sm"
                      onClick={() => setConfirmDel(c.id)}
                      aria-label={`Delete ${c.name}`}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </ContactRow>
          ))}
        </div>

        <aside className="panel meter">
          <h3>Slots</h3>
          <div className="big num">
            {data.used}{' '}
            <span className="muted" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
              of {data.limit} used
            </span>
          </div>
          <Pips used={data.used} limit={data.limit} />
          <p className="muted" style={{ fontSize: '.92rem' }}>
            3 slots are free, permanently.
          </p>
          <h3 style={{ marginTop: 8 }}>More slots</h3>
          {pk.enabled ? (
            <div className="pkgs">
              {pk.packages.map((p) => (
                <button key={p.id} className="pkg" onClick={() => buy(p.id)}>
                  <span>
                    <b>+{p.slots} slots</b>
                    <br />
                    <span className="muted" style={{ fontSize: '.88rem' }}>
                      {p.name}, one-time
                    </span>
                  </span>
                  <b className="num">{money(pk.currency, p.price)}</b>
                </button>
              ))}
            </div>
          ) : (
            <div className="msg info">Payments are not accepted at this time.</div>
          )}
          <button className="btn accent" onClick={() => go('retrieve')}>
            Open retrieval page
          </button>
        </aside>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <h3>Delete my account</h3>
        <p className="muted" style={{ marginTop: 6, maxWidth: '62ch' }}>
          Removes your account and every saved contact. Only payment records that must be kept stay
          on file.
        </p>
        {delAcct ? (
          <DeleteAccount
            api={api}
            go={go}
            say={say}
            setUser={setUser}
            onCancel={() => setDelAcct(false)}
          />
        ) : (
          <button
            className="btn danger sm"
            style={{ marginTop: 12 }}
            onClick={() => setDelAcct(true)}
          >
            Delete account
          </button>
        )}
      </div>

      {editing && (
        <ContactForm
          api={api}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={(m) => {
            setEditing(null);
            say(m);
            load();
          }}
          onFull={() => {
            setEditing(null);
            load();
          }}
        />
      )}
      {checkout && (
        <DemoCheckout
          api={api}
          info={checkout}
          onClose={() => {
            setCheckout(null);
            load();
          }}
          onPaid={() => {
            setCheckout(null);
            go('paid');
          }}
        />
      )}
    </div>
  );
}
