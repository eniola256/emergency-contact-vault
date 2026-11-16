import React, { useEffect, useState, useCallback, useRef } from 'react';

/* ---------- helpers ---------- */
const ROUTES = ['home', 'register', 'login', 'forgot', 'dashboard', 'retrieve', 'paid', 'privacy'];
const readRoute = () => { const h = (window.location.hash || '').replace('#', ''); return ROUTES.includes(h) ? h : 'home'; };
const go = (r) => { window.location.hash = r === 'home' ? '' : r; if (r === 'home') window.dispatchEvent(new Event('hashchange')); window.scrollTo(0, 0); };
export const fmt = (p) => { const m = /^\+234(\d{3})(\d{3})(\d{4})$/.exec(p || ''); return m ? `+234 ${m[1]} ${m[2]} ${m[3]}` : p; };
const money = (cur, n) => `${cur === 'USD' ? '$' : cur + ' '}${n}`;

function Pips({ used, limit }) {
  const shown = Math.min(limit, 30);
  return <div className="pips" role="img" aria-label={`${used} of ${limit} slots used`}>{Array.from({ length: shown }, (_, i) => <i key={i} className={i < used ? 'on' : ''} />)}</div>;
}
function Msg({ kind = 'err', children }) { return children ? <div className={`msg ${kind}`} role={kind === 'err' ? 'alert' : 'status'}>{children}</div> : null; }
function Field({ id, label, hint, ...p }) {
  return <label className="f" htmlFor={id}>{label}{hint && <small>{hint}</small>}<input id={id} className="in" {...p} /></label>;
}
function Brand() {
  return <a className="brand" href="#" onClick={(e) => { e.preventDefault(); go('home'); }} aria-label="Contact Vault home">
    <span className="mark" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} className={i === 4 ? 'on' : ''} />)}</span>Contact Vault</a>;
}

/* ---------- app shell ---------- */
export default function App({ api }) {
  const [route, setRoute] = useState(readRoute);
  const [user, setUser] = useState(null);
  const [sms, setSms] = useState(null);
  const [toast, setToast] = useState('');
  const say = useCallback((t) => { setToast(t); setTimeout(() => setToast(''), 3500); }, []);

  useEffect(() => { const f = () => setRoute(readRoute()); window.addEventListener('hashchange', f); return () => window.removeEventListener('hashchange', f); }, []);
  useEffect(() => { const f = (e) => setSms(e.detail); window.addEventListener('demo-sms', f); return () => window.removeEventListener('demo-sms', f); }, []);
  useEffect(() => { api.me().then((r) => setUser(r.user)).catch(() => setUser(null)); }, [api]);

  const logout = async () => { await api.logout().catch(() => {}); setUser(null); say('Signed out. Nothing from your vault is left on this screen.'); go('home'); };
  const ctx = { api, user, setUser, say, go };
  const Page = { home: Home, register: Register, login: Login, forgot: Forgot, dashboard: Dashboard, retrieve: Retrieve, paid: Paid, privacy: Privacy }[route];

  return (
    <>
      {api.demo && <div className="demo-bar"><div className="wrap">
        <b>Demo mode.</b> <span>Everything stays in this browser. Texts and card payments are simulated.</span>
        <span className="muted" style={{ color: 'inherit', opacity: .8 }}>Demo login: <span className="num">{api.demoPhone}</span> / {api.demoPassword}</span>
      </div></div>}
      <header className="top"><div className="wrap">
        <Brand />
        <nav aria-label="Main">
          {user ? <>
            <button className="btn ghost sm" onClick={() => go('dashboard')}>My contacts</button>
            <button className="btn ghost sm" onClick={() => go('retrieve')}>Retrieve</button>
            <button className="btn sm" onClick={logout}>Log out</button>
          </> : <>
            <button className="btn ghost sm" onClick={() => go('login')}>Sign in</button>
            <button className="btn sm" onClick={() => go('register')}>Create account</button>
            <button className="btn signal sm" onClick={() => go('retrieve')}>Retrieve my contacts</button>
          </>}
        </nav>
      </div></header>
      {sms && <div className="wrap" style={{ paddingTop: 14 }}><div className="msg sms" role="status">
        <b>Simulated text message to <span className="num">{sms.phone}</span>:</b> “Your Contact Vault code is <b className="num">{sms.code}</b>.”{' '}
        <button className="linkbtn" onClick={() => setSms(null)}>Dismiss</button></div></div>}
      <main><Page {...ctx} /></main>
      <footer><div className="wrap">
        <span>Contact Vault stores numbers you choose to save. It needs an internet connection and the service to be running.</span>
        <span><a href="#privacy" onClick={(e) => { e.preventDefault(); go('privacy'); }}>Privacy and data requests</a></span>
      </div></footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </>
  );
}

/* ---------- landing ---------- */
function Home({ go, api }) {
  const [pk, setPk] = useState({ currency: 'USD', packages: [] });
  useEffect(() => { api.packages().then(setPk).catch(() => {}); }, [api]);
  return <>
    <div className="wrap hero">
      <div>
        <h1>Your phone is lost. Your people’s numbers aren’t.</h1>
        <p className="lead">Save the numbers that matter in one secure place. On any device with internet, sign in with your phone number and password and read them back in seconds.</p>
        <div className="cta-row">
          <button className="btn solid big" onClick={() => go('register')}>Create an account</button>
          <button className="btn signal big" onClick={() => go('retrieve')}>Retrieve my contacts</button>
        </div>
        <p className="fine">3 contact slots are free, permanently. Need more? Buy extra slots once and keep them.</p>
      </div>
      <div className="vault" aria-label="Example vault">
        <div className="vault-head"><h3>Example vault</h3><span className="tag">3 of 3 slots used</span></div>
        {[['Mum', '+234 803 555 0142'], ['Tunde (brother)', '+234 902 555 0177'], ['Pastor Ade', '+234 705 555 0119']].map(([n, t]) =>
          <div className="row" key={n}><div className="who"><b>{n}</b><span className="muted">Saved contact</span></div><span className="tel">{t}</span></div>)}
        <div style={{ marginTop: 10 }}><Pips used={3} limit={3} /></div>
      </div>
    </div>

    <section className="block"><div className="wrap">
      <h2>Three steps, then it waits for you</h2>
      <div className="cols">
        <div><span className="step-no">1</span><h3>Save your numbers</h3><p className="muted">Create an account with your phone number. We text you a code to confirm it is yours.</p></div>
        <div><span className="step-no">2</span><h3>Add the people who matter</h3><p className="muted">Name and number for family and close friends. Edit or delete any time.</p></div>
        <div><span className="step-no">3</span><h3>Get them back anywhere</h3><p className="muted">Open the retrieval page on any device, enter your number and password, and read your contacts.</p></div>
      </div>
    </div></section>

    <section className="block"><div className="wrap">
      <h2>Slots, free and paid</h2>
      <p className="muted" style={{ marginTop: 10, maxWidth: '60ch' }}>Every account starts with 3 slots that never expire. Extra slots are a one-time payment and stack on top of what you have. Deleting a contact frees a slot but never takes away slots you bought.</p>
      <div className="table-scroll"><table>
        <thead><tr><th>Plan</th><th>Contact slots</th><th>Price</th></tr></thead>
        <tbody>
          <tr><td>Free</td><td className="big num">3</td><td>Free, permanent</td></tr>
          {pk.packages.map((p) => <tr key={p.id}><td>{p.name}</td><td className="big num">+{p.slots}</td><td className="num">{money(pk.currency, p.price)} once</td></tr>)}
        </tbody></table></div>
      <p className="fine">Example: 3 free slots plus a +10 pack gives you 13 slots. Prices shown are placeholders until final pricing is set.</p>
    </div></section>

    <section className="block"><div className="wrap">
      <h2>Before you rely on it</h2>
      <div className="two">
        <div><h3>What to know</h3><ul>
          <li>Retrieval needs an internet connection and the service being available. Keep a paper copy of your most critical number as well.</li>
          <li>Your contact numbers are encrypted when stored. Passwords are hashed and never readable.</li>
          <li>Sessions end after 2 hours, and the retrieval page leaves nothing behind on the device.</li></ul></div>
        <div><h3>Saving other people’s numbers</h3><ul>
          <li>Only save numbers of people you have a good reason to keep, such as family and close friends, and who would expect you to.</li>
          <li>If someone finds their number here and wants it gone, they can <a href="#privacy" onClick={(e) => { e.preventDefault(); go('privacy'); }}>send a removal request</a>.</li></ul></div>
      </div>
    </div></section>
  </>;
}

/* ---------- auth ---------- */
function Register({ api, setUser, go, say }) {
  const [step, setStep] = useState(1); const [phone, setPhone] = useState(''); const [pw, setPw] = useState(''); const [code, setCode] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const run = (fn) => async (e) => { e.preventDefault(); setErr(''); setBusy(true); try { await fn(); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return <div className="wrap page"><div className="narrow">
    <h1 style={{ fontSize: '2.3rem' }}>{step === 1 ? 'Create your vault' : 'Confirm your number'}</h1>
    <p className="muted" style={{ marginTop: 10 }}>{step === 1 ? 'Your phone number and password are all you need to get your contacts back later.' : `Enter the 6-digit code we texted to ${fmt(phone)}.`}</p>
    {step === 1 ? <form className="form" onSubmit={run(async () => { const r = await api.register(phone, pw); setPhone(r.phone); setStep(2); })}>
      <Field id="reg-phone" label="Phone number" hint="Include your country code if it is not local." type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <Field id="reg-pw" label="Password" hint="At least 8 characters. Choose one you will remember without your phone." type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
      <Msg>{err}</Msg>
      <button className="btn solid big" disabled={busy}>{busy ? 'Sending code…' : 'Send code'}</button>
    </form> : <form className="form" onSubmit={run(async () => { const r = await api.verifyRegistration(phone, code); setUser(r.user); say('Account created with 3 free slots.'); go('dashboard'); })}>
      <label className="f" htmlFor="reg-code">Code<input id="reg-code" className="in otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required /></label>
      <Msg>{err}</Msg>
      <button className="btn solid big" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Create account'}</button>
      <button type="button" className="linkbtn" onClick={() => { setStep(1); setCode(''); setErr(''); }}>Use a different number</button>
    </form>}
    <div className="links"><span className="muted">Already have an account?</span><button className="linkbtn" onClick={() => go('login')}>Sign in</button></div>
  </div></div>;
}

function Login({ api, setUser, go }) {
  const [phone, setPhone] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setErr(''); setBusy(true); try { const r = await api.login(phone, pw); setUser(r.user); go('dashboard'); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return <div className="wrap page"><div className="narrow">
    <h1 style={{ fontSize: '2.3rem' }}>Sign in</h1>
    <form className="form" onSubmit={submit}>
      <Field id="login-phone" label="Phone number" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <Field id="login-pw" label="Password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
      <Msg>{err}</Msg>
      <button className="btn solid big" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      {api.demo && <button type="button" className="btn sm" onClick={() => { setPhone(api.demoPhone); setPw(api.demoPassword); }}>Fill in demo account</button>}
    </form>
    <div className="links"><button className="linkbtn" onClick={() => go('forgot')}>Forgot your password?</button><button className="linkbtn" onClick={() => go('register')}>Create an account</button></div>
    <p className="fine">Only need your numbers right now? <button className="linkbtn" onClick={() => go('retrieve')}>Use the quick retrieval page</button>.</p>
  </div></div>;
}

function Forgot({ api, go, say }) {
  const [step, setStep] = useState(1); const [phone, setPhone] = useState(''); const [code, setCode] = useState(''); const [pw, setPw] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const run = (fn) => async (e) => { e.preventDefault(); setErr(''); setBusy(true); try { await fn(); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return <div className="wrap page"><div className="narrow">
    <h1 style={{ fontSize: '2.3rem' }}>Reset your password</h1>
    <p className="muted" style={{ marginTop: 10 }}>{step === 1 ? 'We will text a code to your registered number.' : 'If that number has an account, a code is on its way. Enter it with a new password.'}</p>
    {step === 1 ? <form className="form" onSubmit={run(async () => { await api.forgot(phone); setStep(2); })}>
      <Field id="fp-phone" label="Phone number" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <Msg>{err}</Msg><button className="btn solid big" disabled={busy}>Send code</button>
    </form> : <form className="form" onSubmit={run(async () => { await api.reset(phone, code, pw); say('Password changed. Sign in with the new one.'); go('login'); })}>
      <label className="f" htmlFor="fp-code">Code<input id="fp-code" className="in otp" inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required /></label>
      <Field id="fp-pw" label="New password" hint="At least 8 characters." type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
      <Msg>{err}</Msg><button className="btn solid big" disabled={busy || code.length !== 6}>Change password</button>
    </form>}
    <div className="links"><button className="linkbtn" onClick={() => go('login')}>Back to sign in</button></div>
  </div></div>;
}

/* ---------- dashboard ---------- */
function Dashboard({ api, user, setUser, go, say }) {
  const [data, setData] = useState(null); const [err, setErr] = useState('');
  const [editing, setEditing] = useState(null);       // null | {} (new) | contact
  const [confirmDel, setConfirmDel] = useState(null);
  const [pk, setPk] = useState({ currency: 'USD', packages: [] });
  const [checkout, setCheckout] = useState(null);
  const [delAcct, setDelAcct] = useState(false);

  const load = useCallback(async () => {
    try { setData(await api.listContacts()); const r = await api.me(); setUser(r.user); }
    catch (e) { if (e.status === 401) { say('Your session ended. Sign in again.'); go('login'); } else setErr(e.message); }
  }, [api]);
  useEffect(() => { load(); api.packages().then(setPk).catch(() => {}); }, [load]);

  if (!data) return <div className="wrap page"><p className="muted">{err || 'Loading your contacts…'}</p></div>;
  const full = data.used >= data.limit;
  const remove = async (id) => { try { await api.removeContact(id); setConfirmDel(null); say('Contact deleted. One slot is free again.'); load(); } catch (e) { setErr(e.message); } };
  const buy = async (id) => {
    setErr('');
    try { const r = await api.checkout(id); if (r.checkoutUrl) window.location.href = r.checkoutUrl; else setCheckout(r.demo); }
    catch (e) { setErr(e.message); }
  };

  return <div className="wrap page">
    <h1 style={{ fontSize: 'clamp(2rem,5vw,2.8rem)' }}>Your contacts</h1>
    <p className="muted" style={{ marginTop: 8 }}>Signed in as <span className="num">{fmt(data && user?.phone)}</span></p>
    <div className="dash">
      <div className="panel">
        <div className="vault-head"><h3>Saved numbers</h3>
          <button className="btn solid sm" disabled={full} onClick={() => setEditing({})}>Add contact</button></div>
        <Msg>{err}</Msg>
        {full && <Msg kind="info">All {data.limit} slots are in use. Delete a contact or buy more slots to add another.</Msg>}
        {data.contacts.length === 0 && <div className="empty"><b>No contacts yet.</b><br />Add the people you would need to reach if your phone were gone.</div>}
        {data.contacts.map((c) => <div className="row" key={c.id}>
          <div className="who"><b>{c.name}</b><span className="tel">{fmt(c.phone)}</span></div>
          <div className="actions">
            {confirmDel === c.id ? <>
              <button className="btn danger sm" onClick={() => remove(c.id)}>Confirm delete</button>
              <button className="btn ghost sm" onClick={() => setConfirmDel(null)}>Keep</button></> : <>
              <button className="btn sm" onClick={() => setEditing(c)} aria-label={`Edit ${c.name}`}>Edit</button>
              <button className="btn ghost sm" onClick={() => setConfirmDel(c.id)} aria-label={`Delete ${c.name}`}>Delete</button></>}
          </div>
        </div>)}
      </div>

      <aside className="panel meter">
        <h3>Slots</h3>
        <div className="big num">{data.used} <span className="muted" style={{ fontSize: '1.2rem', fontWeight: 600 }}>of {data.limit} used</span></div>
        <Pips used={data.used} limit={data.limit} />
        <p className="muted" style={{ fontSize: '.92rem' }}>3 are free forever. Extra slots never expire and stack.</p>
        <h3 style={{ marginTop: 8 }}>Buy more slots</h3>
        <div className="pkgs">{pk.packages.map((p) => <button key={p.id} className="pkg" onClick={() => buy(p.id)}>
          <span><b>+{p.slots} slots</b><br /><span className="muted" style={{ fontSize: '.88rem' }}>{p.name}, one-time</span></span><b className="num">{money(pk.currency, p.price)}</b></button>)}</div>
        <button className="btn signal" onClick={() => go('retrieve')}>Open retrieval page</button>
      </aside>
    </div>

    <div className="panel" style={{ marginTop: 24 }}>
      <h3>Delete my account</h3>
      <p className="muted" style={{ marginTop: 6, maxWidth: '62ch' }}>Removes your account and every saved contact. Only payment records that must be kept stay on file.</p>
      {delAcct ? <DeleteAccount api={api} go={go} say={say} setUser={setUser} onCancel={() => setDelAcct(false)} /> : <button className="btn danger sm" style={{ marginTop: 12 }} onClick={() => setDelAcct(true)}>Delete account</button>}
    </div>

    {editing && <ContactForm api={api} initial={editing} onClose={() => setEditing(null)} onSaved={(m) => { setEditing(null); say(m); load(); }} onFull={() => { setEditing(null); load(); }} />}
    {checkout && <DemoCheckout api={api} info={checkout} onClose={() => { setCheckout(null); load(); }} onPaid={() => { setCheckout(null); go('paid'); }} />}
  </div>;
}

function DeleteAccount({ api, go, say, setUser, onCancel }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  const submit = async (e) => { e.preventDefault(); try { await api.deleteAccount(pw); setUser(null); say('Your account and contacts were deleted.'); go('home'); } catch (x) { setErr(x.message); } };
  return <form className="form" style={{ maxWidth: 360 }} onSubmit={submit}>
    <Field id="del-pw" label="Enter your password to confirm" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
    <Msg>{err}</Msg>
    <div style={{ display: 'flex', gap: 8 }}><button className="btn danger">Delete everything</button><button type="button" className="btn ghost" onClick={onCancel}>Cancel</button></div>
  </form>;
}

function ContactForm({ api, initial, onClose, onSaved, onFull }) {
  const [name, setName] = useState(initial.name || ''); const [phone, setPhone] = useState(initial.phone || ''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { if (initial.id) { await api.updateContact(initial.id, name, phone); onSaved('Contact updated.'); } else { await api.addContact(name, phone); onSaved('Contact saved.'); } }
    catch (x) { if (x.code === 'SLOTS_FULL') { setErr(x.message); setTimeout(onFull, 1800); } else setErr(x.message); } finally { setBusy(false); }
  };
  return <div className="scrim" onClick={onClose}><form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="cf-title">
    <h3 id="cf-title">{initial.id ? 'Edit contact' : 'Add a contact'}</h3>
    <div className="form">
      <Field id="cf-name" label="Name" value={name} onChange={(e) => setName(e.target.value)} autoFocus required maxLength={80} />
      <Field id="cf-phone" label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
      <p className="fine" style={{ marginTop: 0 }}>Only save numbers of people you have a legitimate reason and permission to keep.</p>
      <Msg>{err}</Msg>
      <div style={{ display: 'flex', gap: 8 }}><button className="btn solid" disabled={busy}>{busy ? 'Saving…' : 'Save contact'}</button><button type="button" className="btn ghost" onClick={onClose}>Cancel</button></div>
    </div></form></div>;
}

// Stand-in for the hosted Bachs checkout page, used only in demo mode.
function DemoCheckout({ api, info, onClose, onPaid }) {
  const [busy, setBusy] = useState(false);
  const pay = async () => { setBusy(true); await api.simulateWebhook(info.reference); onPaid(); };
  const cancel = async () => { await api.cancelDemoPurchase(info.reference); onClose(); };
  return <div className="scrim"><div className="modal sandbox" role="dialog" aria-modal="true" aria-labelledby="co-title">
    <span className="tag warn">Bachs sandbox, simulated</span>
    <h3 id="co-title" style={{ marginTop: 12 }}>Pay {money(info.currency, info.pkg.price)}</h3>
    <p className="muted" style={{ marginTop: 6 }}>{info.pkg.name} pack: +{info.pkg.slots} contact slots, one-time. In the live site you are sent to the hosted Bachs checkout here. No real payment happens in this demo.</p>
    <p className="fine num">Reference {info.reference}</p>
    <div style={{ display: 'flex', gap: 8, marginTop: 18, flexWrap: 'wrap' }}>
      <button className="btn solid" onClick={pay} disabled={busy}>{busy ? 'Confirming…' : `Pay ${money(info.currency, info.pkg.price)}`}</button>
      <button className="btn ghost" onClick={cancel} disabled={busy}>Cancel</button></div>
  </div></div>;
}

/* ---------- payment return ---------- */
function Paid({ api, go }) {
  const [state, setState] = useState({ purchase: null, contactLimit: null }); const [tries, setTries] = useState(0);
  useEffect(() => {
    let live = true;
    const tick = async () => {
      try { const r = await api.latestPurchase(); if (live) setState(r); if (r.purchase?.status === 'PENDING' && live) setTimeout(() => setTries((t) => t + 1), 2000); }
      catch { if (live) go('login'); }
    };
    if (tries < 15) tick();
    return () => { live = false; };
  }, [tries]);
  const p = state.purchase;
  return <div className="wrap page"><div className="narrow">
    {p?.status === 'PAID' ? <><span className="tag ok">Payment confirmed</span><h1 style={{ fontSize: '2.3rem', marginTop: 12 }}>+{p.slots} slots added</h1>
      <p className="muted" style={{ marginTop: 10 }}>Your account now has <b className="num">{state.contactLimit}</b> contact slots. They never expire.</p></> :
     p?.status === 'PENDING' ? <><span className="tag warn">Waiting for confirmation</span><h1 style={{ fontSize: '2.3rem', marginTop: 12 }}>Confirming your payment</h1>
      <p className="muted" style={{ marginTop: 10 }}>{tries < 15 ? 'This usually takes a few seconds. Slots are added only after Bachs confirms the payment to our server.' : 'Still waiting. If you were charged, your slots appear as soon as the confirmation arrives. Check back shortly.'}</p></> :
     <><h1 style={{ fontSize: '2.3rem' }}>No payment found</h1><p className="muted" style={{ marginTop: 10 }}>Your slot count has not changed.</p></>}
    <div className="cta-row"><button className="btn solid" onClick={() => go('dashboard')}>Back to my contacts</button></div>
  </div></div>;
}

/* ---------- emergency retrieval ---------- */
function Retrieve({ api, go }) {
  const [phone, setPhone] = useState(''); const [pw, setPw] = useState(''); const [list, setList] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const timer = useRef();
  const clear = () => { setList(null); setPw(''); setPhone(''); clearTimeout(timer.current); };
  useEffect(() => () => clearTimeout(timer.current), []);
  const submit = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { const r = await api.retrieve(phone, pw); setList(r.contacts); setPw(''); timer.current = setTimeout(clear, 5 * 60_000); }
    catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return <div className="wrap page retrieve"><div style={{ maxWidth: 640 }}>
    {!list ? <>
      <h1>Get your contacts back</h1>
      <p className="muted" style={{ marginTop: 10 }}>Enter the phone number and password you registered with.</p>
      <form className="form" onSubmit={submit}>
        <Field id="rt-phone" label="Your registered phone number" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoFocus required />
        <Field id="rt-pw" label="Password" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} required />
        <Msg>{err}</Msg>
        <button className="btn signal big" disabled={busy}>{busy ? 'Looking up…' : 'Show my contacts'}</button>
        {api.demo && <button type="button" className="btn sm" onClick={() => { setPhone(api.demoPhone); setPw(api.demoPassword); }}>Fill in demo account</button>}
      </form>
      <div className="links"><button className="linkbtn" onClick={() => go('forgot')}>Forgot your password?</button></div>
      <p className="fine">This page keeps no sign-in on the device. Your contacts clear from the screen after 5 minutes or when you press Done.</p>
    </> : <>
      <h1>{list.length ? `${list.length} contact${list.length === 1 ? '' : 's'}` : 'No contacts saved'}</h1>
      <div className="found" role="list">{list.map((c) => <div className="row" role="listitem" key={c.id}>
        <div className="who"><b>{c.name}</b><span className="tel">{fmt(c.phone)}</span></div>
        <a className="btn solid sm" href={`tel:${c.phone}`}>Call</a></div>)}</div>
      <div className="cta-row"><button className="btn big" onClick={clear}>Done, clear this screen</button></div>
      <p className="fine">If calling does not start from this device, read the number off the screen.</p>
    </>}
  </div></div>;
}

/* ---------- privacy ---------- */
function Privacy({ api, go }) {
  const [kind, setKind] = useState('remove-my-number'); const [phone, setPhone] = useState(''); const [message, setMessage] = useState('');
  const [done, setDone] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => { e.preventDefault(); setErr(''); setBusy(true); try { await api.report(kind, phone, message); setDone(true); } catch (x) { setErr(x.message); } finally { setBusy(false); } };
  return <div className="wrap page"><div className="two" style={{ marginTop: 0 }}>
    <div>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,2.8rem)' }}>Privacy and your data</h1>
      <div style={{ display: 'grid', gap: 18, marginTop: 22 }}>
        <div><h3>What we store</h3><p className="muted">Your phone number, a hashed password, and the names and numbers you save. Saved numbers are encrypted at rest. Payment records keep a reference, amount and status.</p></div>
        <div><h3>Who can see your contacts</h3><p className="muted">Only someone who signs in with your phone number and password. Contacts are never on a public page or readable by the browser without signing in.</p></div>
        <div><h3>Saving someone else’s number</h3><p className="muted">Account holders agree to save only numbers they have a legitimate reason and permission to keep. If your number was saved and you want it removed, tell us using the form.</p></div>
        <div><h3>Deleting your account</h3><p className="muted">Signed-in users can delete their account and all contacts from the dashboard. Only payment records that must legally be kept remain.</p></div>
      </div>
    </div>
    <div className="panel" style={{ alignSelf: 'start' }}>
      <h3>Send a data request</h3>
      {done ? <div className="form"><Msg kind="ok">Request received. We will act on it and contact you at that number if we need more.</Msg><button className="btn" onClick={() => go('home')}>Back to home</button></div> :
      <form className="form" onSubmit={submit}>
        <label className="f" htmlFor="pv-kind">Request<select id="pv-kind" className="in" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="remove-my-number">Remove my number from someone’s vault</option><option value="correct-data">Correct my data</option><option value="other">Something else</option></select></label>
        <Field id="pv-phone" label="Your phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <label className="f" htmlFor="pv-msg">Details <small>Optional</small><textarea id="pv-msg" className="in" rows={4} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} /></label>
        <Msg>{err}</Msg><button className="btn solid" disabled={busy}>Send request</button>
      </form>}
    </div>
  </div></div>;
}
