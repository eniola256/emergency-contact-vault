// Security helpers: password policy, account lockout, and an origin check against forged requests.
import { config } from './config.js';

const COMMON = new Set(`password passw0rd password1 password12 password123 1234567890 12345678910 0123456789 0987654321 qwertyuiop qwerty12345 qwerty123456 1q2w3e4r5t 1qaz2wsx3edc asdfghjkl1 zxcvbnm123 iloveyou123 letmein1234 welcome1234 admin12345 administrator abcdefghij abcd123456 abc1234567 11111111111 00000000000 changeme123 monkey12345 dragon12345 football123 naijaboy123 lagos12345 nigeria1234 vault12345 emergency123 godisgood123 jesus12345`.split(/\s+/));

export const MIN_PASSWORD = 10;

// Returns an error message, or null when the password is acceptable.
export function passwordProblem(password, phone = '') {
  const pw = String(password || '');
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`;
  if (pw.length > 128) return 'Use 128 characters or fewer.';
  const lower = pw.toLowerCase();
  if (COMMON.has(lower) || /^(.)\1+$/.test(pw)) return 'That password is too easy to guess. Choose something less common.';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length >= 7 && pw.replace(/\D/g, '').includes(digits.slice(-9))) return 'Do not use your phone number in your password.';
  return null;
}

export const LOCK_AFTER = 5;
export const LOCK_MINUTES = 15;
export const LOCK_MESSAGE = `Too many wrong passwords. This account is locked for ${LOCK_MINUTES} minutes.`;

// Per-account lockout, on top of the per-IP rate limits (which a botnet can spread across).
export function makeLockout(db, now = () => Date.now()) {
  return {
    isLocked: (user) => !!user?.lockedUntil && new Date(user.lockedUntil).getTime() > now(),
    async fail(user) {
      const count = (user.failedLogins || 0) + 1;
      const lock = count >= LOCK_AFTER;
      await db.user.update({
        where: { id: user.id },
        data: { failedLogins: lock ? 0 : count, lockedUntil: lock ? new Date(now() + LOCK_MINUTES * 60_000) : user.lockedUntil },
      });
      return lock;
    },
    async succeed(user) {
      if (user.failedLogins || user.lockedUntil) await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
    },
  };
}

// Browsers always send Origin on cross-site POST/PUT/DELETE. If it is present and is not our site, refuse.
export function originCheck(allowed = config.clientUrl) {
  const ok = new Set([allowed.replace(/\/$/, '')]);
  return (req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (origin && !ok.has(origin.replace(/\/$/, ''))) return res.status(403).json({ error: 'Request blocked.' });
    next();
  };
}
