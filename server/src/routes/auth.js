import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';
import { normalizePhone } from '../phone.js';
import { sha256, randomCode } from '../crypto.js';
import { sendSms } from '../sms.js';
import { startSession, endSession, requireUser, publicUser } from '../auth.js';
import { FREE_SLOTS } from '../config.js';

export const auth = Router();

const ipLimit = (max, windowMin) => rateLimit({
  windowMs: windowMin * 60_000, limit: max, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts. Wait a few minutes and try again.' },
});
const loginLimiter = ipLimit(15, 15);
const otpLimiter = ipLimit(10, 60);

const phoneSchema = z.string().min(6).max(24);
const passwordSchema = z.string().min(8, 'Use at least 8 characters.').max(128);
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);
const OTP_MINUTES = 10, OTP_MAX_ATTEMPTS = 5, OTP_MAX_PER_HOUR = 3;

async function issueOtp(phone, purpose, passwordHash = null) {
  const since = new Date(Date.now() - 3600_000);
  const recent = await prisma.otpCode.count({ where: { phone, purpose, createdAt: { gte: since } } });
  if (recent >= OTP_MAX_PER_HOUR) return false;
  await prisma.otpCode.deleteMany({ where: { phone, purpose } });
  const code = randomCode();
  await prisma.otpCode.create({
    data: { phone, purpose, codeHash: sha256(`${phone}:${code}`), passwordHash,
            expiresAt: new Date(Date.now() + OTP_MINUTES * 60_000) },
  });
  await sendSms(phone, `Your Contact Vault code is ${code}. It expires in ${OTP_MINUTES} minutes.`);
  return true;
}
async function checkOtp(phone, purpose, code) {
  const row = await prisma.otpCode.findFirst({ where: { phone, purpose }, orderBy: { createdAt: 'desc' } });
  if (!row || row.expiresAt < new Date() || row.attempts >= OTP_MAX_ATTEMPTS) return null;
  if (row.codeHash !== sha256(`${phone}:${code}`)) {
    await prisma.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    return null;
  }
  return row;
}
const bad = (res, msg, status = 400) => res.status(status).json({ error: msg });

auth.post('/register', otpLimiter, async (req, res) => {
  const p = z.object({ phone: phoneSchema, password: passwordSchema }).safeParse(req.body);
  if (!p.success) return bad(res, p.error.issues[0].message);
  const phone = normalizePhone(p.data.phone);
  if (!phone) return bad(res, 'Enter a valid phone number, including your country code if it is not local.');
  if (await prisma.user.findUnique({ where: { phone } })) return bad(res, 'That number already has an account. Sign in instead.', 409);
  const ok = await issueOtp(phone, 'REGISTER', await bcrypt.hash(p.data.password, 12));
  if (!ok) return bad(res, 'Too many codes requested. Try again in an hour.', 429);
  res.json({ phone, expiresInMinutes: OTP_MINUTES });
});

auth.post('/register/verify', otpLimiter, async (req, res) => {
  const p = z.object({ phone: phoneSchema, code: z.string().length(6) }).safeParse(req.body);
  if (!p.success) return bad(res, 'Enter the 6-digit code.');
  const phone = normalizePhone(p.data.phone);
  const row = phone && await checkOtp(phone, 'REGISTER', p.data.code);
  if (!row) return bad(res, 'That code is wrong or has expired.');
  try {
    const user = await prisma.user.create({ data: { phone, passwordHash: row.passwordHash, contactLimit: FREE_SLOTS } });
    await prisma.otpCode.deleteMany({ where: { phone, purpose: 'REGISTER' } });
    startSession(res, user.id);
    res.json({ user: await publicUser(user) });
  } catch {
    bad(res, 'That number already has an account. Sign in instead.', 409);
  }
});

auth.post('/login', loginLimiter, async (req, res) => {
  const p = z.object({ phone: phoneSchema, password: z.string().min(1).max(128) }).safeParse(req.body);
  const phone = p.success && normalizePhone(p.data.phone);
  const user = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
  const ok = await bcrypt.compare(p.success ? p.data.password : '', user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) return bad(res, 'Phone number or password is wrong.', 401);
  startSession(res, user.id);
  res.json({ user: await publicUser(user) });
});

auth.post('/logout', (req, res) => { endSession(res); res.json({ ok: true }); });

auth.post('/forgot', otpLimiter, async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  if (phone && await prisma.user.findUnique({ where: { phone } })) await issueOtp(phone, 'RESET');
  res.json({ ok: true }); // same answer whether or not the number exists
});

auth.post('/reset', otpLimiter, async (req, res) => {
  const p = z.object({ phone: phoneSchema, code: z.string().length(6), password: passwordSchema }).safeParse(req.body);
  if (!p.success) return bad(res, p.error.issues[0].message);
  const phone = normalizePhone(p.data.phone);
  const row = phone && await checkOtp(phone, 'RESET', p.data.code);
  if (!row) return bad(res, 'That code is wrong or has expired.');
  await prisma.user.update({ where: { phone }, data: { passwordHash: await bcrypt.hash(p.data.password, 12) } });
  await prisma.otpCode.deleteMany({ where: { phone, purpose: 'RESET' } });
  res.json({ ok: true });
});

auth.get('/me', requireUser, async (req, res) => res.json({ user: await publicUser(req.user) }));

// Account deletion: removes the user and all contacts; purchase records stay with userId set to null.
auth.post('/delete-account', requireUser, loginLimiter, async (req, res) => {
  if (!(await bcrypt.compare(String(req.body?.password || ''), req.user.passwordHash))) return bad(res, 'Password is wrong.', 401);
  await prisma.user.delete({ where: { id: req.user.id } });
  endSession(res);
  res.json({ ok: true });
});
