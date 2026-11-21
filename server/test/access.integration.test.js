// Cross-account access tests. They need a real database, so they only run when TEST_DATABASE_URL is set
// (use a throwaway database, NOT your real one):  TEST_DATABASE_URL=postgresql://... npm test
import test from 'node:test';
import assert from 'node:assert/strict';

const url = process.env.TEST_DATABASE_URL;
test('user A cannot read, edit or delete user B contacts', { skip: !url && 'set TEST_DATABASE_URL to run' }, async () => {
  process.env.DATABASE_URL = url;
  process.env.SESSION_SECRET ||= 'x'.repeat(32);
  process.env.CONTACT_ENCRYPTION_KEY ||= '0'.repeat(64);
  const { app } = await import('../src/app.js');
  const { prisma } = await import('../src/db.js');
  const { default: jwt } = await import('jsonwebtoken');
  const { encrypt } = await import('../src/crypto.js');
  const mk = (phone) => prisma.user.create({ data: { phone, passwordHash: 'x', contactLimit: 3 } });
  const a = await mk('+2348000000001'), b = await mk('+2348000000002');
  const c = await prisma.contact.create({ data: { userId: b.id, name: 'B contact', phoneEnc: encrypt('+2348111111111') } });
  const server = app.listen(0); const base = `http://127.0.0.1:${server.address().port}/api/contacts`;
  const cookie = `vault_session=${jwt.sign({ sub: a.id }, process.env.SESSION_SECRET)}`;
  const h = { 'content-type': 'application/json', cookie };
  try {
    const list = await (await fetch(base, { headers: h })).json();
    assert.equal(list.contacts.length, 0);
    const put = await fetch(`${base}/${c.id}`, { method: 'PUT', headers: h, body: JSON.stringify({ name: 'hacked', phone: '+2348222222222' }) });
    assert.equal(put.status, 404);
    const del = await fetch(`${base}/${c.id}`, { method: 'DELETE', headers: h });
    assert.equal(del.status, 404);
    assert.equal((await prisma.contact.findUnique({ where: { id: c.id } })).name, 'B contact');
  } finally {
    server.close();
    await prisma.user.deleteMany({ where: { id: { in: [a.id, b.id] } } });
    await prisma.$disconnect();
  }
});
