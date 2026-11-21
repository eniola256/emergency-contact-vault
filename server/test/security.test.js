import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SESSION_SECRET ||= 'x'.repeat(32);
process.env.CONTACT_ENCRYPTION_KEY ||= '0'.repeat(64);
const { passwordProblem, makeLockout, originCheck, LOCK_AFTER } = await import('../src/security.js');

test('password policy', () => {
  assert.ok(passwordProblem('short1'));
  assert.ok(passwordProblem('password123'));
  assert.ok(passwordProblem('aaaaaaaaaaaa'));
  assert.ok(passwordProblem('call08012345678x', '+2348012345678'));
  assert.equal(passwordProblem('blue-river-lamp-42'), null);
});

function fakeDb(u) { return { user: { update: async ({ data }) => Object.assign(u, data) } }; }

test('account locks after repeated failures and unlocks after the window', async () => {
  let t = 1_000_000; const user = { id: 'u1', failedLogins: 0, lockedUntil: null };
  const l = makeLockout(fakeDb(user), () => t);
  for (let i = 0; i < LOCK_AFTER - 1; i++) assert.equal(await l.fail(user), false);
  assert.equal(await l.fail(user), true);
  assert.equal(l.isLocked(user), true);
  t += 16 * 60_000;
  assert.equal(l.isLocked(user), false);
});

test('success clears the failure count', async () => {
  const user = { id: 'u1', failedLogins: 3, lockedUntil: null };
  await makeLockout(fakeDb(user)).succeed(user);
  assert.equal(user.failedLogins, 0);
});

test('origin check blocks other sites, allows ours and non-browser calls', () => {
  const mw = originCheck('https://vault.example');
  const run = (method, origin) => { let st = 200, nexted = false;
    mw({ method, headers: origin ? { origin } : {} }, { status: (c) => ({ json: () => { st = c; } }) }, () => { nexted = true; });
    return nexted ? 'next' : st; };
  assert.equal(run('POST', 'https://evil.example'), 403);
  assert.equal(run('POST', 'https://vault.example'), 'next');
  assert.equal(run('POST'), 'next');
  assert.equal(run('GET', 'https://evil.example'), 'next');
});
