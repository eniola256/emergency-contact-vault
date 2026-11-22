import test from 'node:test';
import assert from 'node:assert/strict';

// config.js insists on these; the values only need to be well-formed for this test.
process.env.SESSION_SECRET ??= 'test';
process.env.CONTACT_ENCRYPTION_KEY ??= '0'.repeat(64);
const { makeHandler } = await import('../src/telegram/handler.js');
const { sha256 } = await import('../src/crypto.js');

// Tiny in-memory stand-in for prisma.otpCode
function fakeDb(rows) {
  const match = (r, w) => Object.entries(w).every(([k, v]) =>
    v && typeof v === 'object' && 'gt' in v ? r[k] > v.gt : r[k] === v);
  return { rows, otpCode: {
    findUnique: async ({ where }) => rows.find((r) => r.startHash === where.startHash) ?? null,
    findFirst: async ({ where }) => rows.filter((r) => match(r, where)).at(-1) ?? null,
    update: async ({ where, data }) => {
      const r = rows.find((x) => x.id === where.id);
      for (const [k, v] of Object.entries(data)) r[k] = v && typeof v === 'object' && 'increment' in v ? r[k] + v.increment : v;
      return r;
    },
  } };
}
const setup = (over = {}) => {
  const row = { id: 1, purpose: 'REGISTER', phone: '+2348012345678', startHash: sha256('tok123'), codeHash: null,
                telegramId: null, attempts: 0, expiresAt: new Date(Date.now() + 600_000), ...over };
  const db = fakeDb([row]); const sent = [];
  const handle = makeHandler({ db, send: async (chat, text, extra) => sent.push({ chat, text, extra }) });
  return { row, sent, handle };
};
const start = (id, token) => ({ message: { chat: { id, type: 'private' }, from: { id }, text: token ? `/start ${token}` : '/start' } });
const share = (id, phone, userId = id) => ({ message: { chat: { id, type: 'private' }, from: { id }, contact: { phone_number: phone, user_id: userId } } });

test('start with valid token links the telegram account and asks for the contact', async () => {
  const { row, sent, handle } = setup();
  await handle(start(42, 'tok123'));
  assert.equal(row.telegramId, '42');
  assert.equal(sent[0].extra.reply_markup.keyboard[0][0].request_contact, true);
});
test('expired or unknown token is refused and links nothing', async () => {
  const a = setup({ expiresAt: new Date(Date.now() - 1000) }); await a.handle(start(42, 'tok123'));
  assert.equal(a.row.telegramId, null); assert.match(a.sent[0].text, /expired/);
  const b = setup(); await b.handle(start(42, 'nope')); assert.equal(b.row.telegramId, null);
});
test('matching own number issues a code that is stored hashed and sent once', async () => {
  const { row, sent, handle } = setup();
  await handle(start(42, 'tok123')); await handle(share(42, '2348012345678'));
  const code = /code is (\d{6})/.exec(sent.at(-1).text)[1];
  assert.equal(row.codeHash, sha256(`+2348012345678:${code}`));
  assert.ok(!JSON.stringify(row).includes(code));
});
test('number with a plus sign and spaces also matches', async () => {
  const { row, handle } = setup(); await handle(start(42, 'tok123')); await handle(share(42, '+234 801 234 5678'));
  assert.ok(row.codeHash);
});
test('someone else\'s contact is refused', async () => {
  const { row, handle } = setup(); await handle(start(42, 'tok123')); await handle(share(42, '2348012345678', 99));
  assert.equal(row.codeHash, null);
});
test('a different number is refused, counted, and locks after 5 tries', async () => {
  const { row, sent, handle } = setup(); await handle(start(42, 'tok123'));
  for (let i = 0; i < 5; i++) await handle(share(42, '2349099999999'));
  assert.equal(row.codeHash, null); assert.equal(row.attempts, 5);
  await handle(share(42, '2348012345678'));           // even the right number is now refused
  assert.equal(row.codeHash, null); assert.match(sent.at(-1).text, /Too many/);
});
test('sharing without ever opening the link sends no code', async () => {
  const { row, handle } = setup(); await handle(share(7, '2348012345678'));
  assert.equal(row.codeHash, null);
});
test('group chats are ignored', async () => {
  const { sent, handle } = setup(); await handle({ message: { chat: { id: 1, type: 'group' }, from: { id: 1 }, text: '/start tok123' } });
  assert.equal(sent.length, 0);
});
