// Demo backend that lives in the browser. Same interface and the same rules as the real API:
// 3 free slots, limit enforced here (not in the UI), slots granted only by the simulated webhook.
const KEY = 'vault-demo-v1';
let mem = null;
const read = () => {
  if (mem) return mem;
  try { const s = localStorage.getItem(KEY); if (s) return (mem = JSON.parse(s)); } catch {}
  return (mem = seed());
};
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch {} };
let sessionUser = null, nextOtp = {}, pendingReg = {};

const DEMO_PHONE = '+2348012345678', DEMO_PASS = 'vault-demo';
async function hash(phone, pw) {
  const b = new TextEncoder().encode(`${phone}:${pw}`);
  const d = await crypto.subtle.digest('SHA-256', b);
  return [...new Uint8Array(d)].map((x) => x.toString(16).padStart(2, '0')).join('');
}
function seed() {
  return { users: {}, contacts: {}, purchases: [], seeded: false };
}
async function ensureSeed() {
  const db = read();
  if (db.seeded) return;
  db.users[DEMO_PHONE] = { phone: DEMO_PHONE, hash: await hash(DEMO_PHONE, DEMO_PASS), limit: 3 };
  db.contacts[DEMO_PHONE] = [
    { id: 'c1', name: 'Amaka (sister)', phone: '+2348034567890' },
    { id: 'c2', name: 'Dr. Bello', phone: '+2348055501122' },
  ];
  db.seeded = true; save();
}
export function normalize(input) {
  let s = String(input || '').replace(/[\s()-]/g, '');
  if (s.startsWith('00')) s = '+' + s.slice(2);
  if (s.startsWith('0')) s = '+234' + s.slice(1);
  else if (/^234\d/.test(s)) s = '+' + s;
  else if (!s.startsWith('+') && /^[789]\d{9}$/.test(s)) s = '+234' + s;
  return /^\+\d{10,14}$/.test(s) ? s : null;
}
const fail = (m, status = 400, code) => { const e = new Error(m); e.status = status; e.code = code; return e; };
const used = (p) => (read().contacts[p] || []).length;
const pub = (u) => ({ id: u.phone, phone: u.phone, contactLimit: u.limit, contactsUsed: used(u.phone) });
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const need = () => { if (!sessionUser) throw fail('Sign in to continue.', 401); return read().users[sessionUser]; };
const smsCode = (phone) => {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  nextOtp[phone] = { code, tries: 0, at: Date.now() };
  window.dispatchEvent(new CustomEvent('demo-sms', { detail: { phone, code } }));
};
function checkCode(phone, code) {
  const o = nextOtp[phone];
  if (!o || Date.now() - o.at > 600000 || o.tries >= 5) return false;
  if (o.code !== code) { o.tries++; return false; }
  delete nextOtp[phone]; return true;
}
const PACKAGES = [
  { id: 'starter', name: 'Starter', slots: 5, price: '2.00' },
  { id: 'plus', name: 'Plus', slots: 10, price: '3.50' },
  { id: 'extended', name: 'Extended', slots: 20, price: '6.00' },
];

export const api = {
  demo: true, demoPhone: DEMO_PHONE, demoPassword: DEMO_PASS,
  async register(phone, password) {
    await ensureSeed(); await wait();
    if (password.length < 8) throw fail('Use at least 8 characters.');
    const p = normalize(phone); if (!p) throw fail('Enter a valid phone number, including your country code if it is not local.');
    if (read().users[p]) throw fail('That number already has an account. Sign in instead.', 409);
    pendingReg[p] = await hash(p, password); smsCode(p);
    return { phone: p, expiresInMinutes: 10 };
  },
  async verifyRegistration(phone, code) {
    await wait(); const p = normalize(phone);
    if (!p || !pendingReg[p] || !checkCode(p, code)) throw fail('That code is wrong or has expired.');
    const db = read(); db.users[p] = { phone: p, hash: pendingReg[p], limit: 3 }; db.contacts[p] = []; delete pendingReg[p]; save();
    sessionUser = p; return { user: pub(db.users[p]) };
  },
  async login(phone, password) {
    await ensureSeed(); await wait(); const p = normalize(phone); const u = p && read().users[p];
    if (!u || u.hash !== (await hash(p, password))) throw fail('Phone number or password is wrong.', 401);
    sessionUser = p; return { user: pub(u) };
  },
  async logout() { sessionUser = null; return { ok: true }; },
  async me() { await ensureSeed(); return { user: pub(need()) }; },
  async forgot(phone) { await ensureSeed(); await wait(); const p = normalize(phone); if (p && read().users[p]) smsCode(p); return { ok: true }; },
  async reset(phone, code, password) {
    await wait(); const p = normalize(phone);
    if (password.length < 8) throw fail('Use at least 8 characters.');
    if (!p || !read().users[p] || !checkCode(p, code)) throw fail('That code is wrong or has expired.');
    read().users[p].hash = await hash(p, password); save(); return { ok: true };
  },
  async deleteAccount(password) {
    const u = need(); await wait();
    if (u.hash !== (await hash(u.phone, password))) throw fail('Password is wrong.', 401);
    const db = read(); delete db.users[u.phone]; delete db.contacts[u.phone]; save(); sessionUser = null; return { ok: true };
  },
  async listContacts() { const u = need(); await wait(80); const c = read().contacts[u.phone] || []; return { contacts: c, limit: u.limit, used: c.length }; },
  async addContact(name, phone) {
    const u = need(); await wait(); name = String(name || '').trim();
    if (!name) throw fail('Enter a name.'); const p = normalize(phone); if (!p) throw fail('Enter a valid phone number for this contact.');
    const list = read().contacts[u.phone] || (read().contacts[u.phone] = []);
    if (list.length >= u.limit) throw fail('All your slots are in use. Delete a contact or buy more slots.', 403, 'SLOTS_FULL'); // enforced here, not in the UI
    const c = { id: 'c' + Date.now(), name, phone: p }; list.push(c); save(); return { contact: c };
  },
  async updateContact(id, name, phone) {
    const u = need(); await wait(); const p = normalize(phone); if (!String(name || '').trim()) throw fail('Enter a name.'); if (!p) throw fail('Enter a valid phone number for this contact.');
    const c = (read().contacts[u.phone] || []).find((x) => x.id === id); if (!c) throw fail('Contact not found.', 404);
    c.name = name.trim(); c.phone = p; save(); return { contact: c };
  },
  async removeContact(id) {
    const u = need(); await wait(120); const db = read(); db.contacts[u.phone] = (db.contacts[u.phone] || []).filter((x) => x.id !== id); save(); return { ok: true };
  },
  async retrieve(phone, password) {
    await ensureSeed(); await wait(350); const p = normalize(phone); const u = p && read().users[p];
    if (!u || u.hash !== (await hash(p, password))) throw fail('Phone number or password is wrong.', 401);
    return { contacts: read().contacts[p] || [] }; // no session is created
  },
  async packages() { return { currency: 'USD', packages: PACKAGES }; },
  async checkout(packageId) {
    const u = need(); await wait(); const pkg = PACKAGES.find((p) => p.id === packageId); if (!pkg) throw fail('Choose a slot package.');
    const reference = 'slt_' + Math.random().toString(16).slice(2, 14);
    read().purchases.push({ reference, phone: u.phone, slots: pkg.slots, amount: pkg.price, currency: 'USD', status: 'PENDING' }); save();
    return { demo: { reference, pkg, currency: 'USD' } };
  },
  // Stands in for Bachs sending a signed collection.succeeded webhook to the backend.
  async simulateWebhook(reference) {
    await wait(600); const db = read(); const p = db.purchases.find((x) => x.reference === reference);
    if (p && p.status === 'PENDING') { p.status = 'PAID'; db.users[p.phone].limit += p.slots; save(); }
  },
  async cancelDemoPurchase(reference) { const p = read().purchases.find((x) => x.reference === reference); if (p && p.status === 'PENDING') { p.status = 'EXPIRED'; save(); } },
  async latestPurchase() {
    const u = need(); const mine = read().purchases.filter((x) => x.phone === u.phone); const p = mine[mine.length - 1];
    return { purchase: p || null, contactLimit: u.limit };
  },
  async report() { await wait(); return { ok: true }; },
};
