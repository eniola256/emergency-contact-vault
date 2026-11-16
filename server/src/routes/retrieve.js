import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';
import { normalizePhone } from '../phone.js';
import { decrypt } from '../crypto.js';

export const retrieve = Router();
const limiter = rateLimit({ windowMs: 15 * 60_000, limit: 15, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many attempts. Wait a few minutes and try again.' } });
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

// One step: phone + password in, contacts out. No cookie is set, so nothing stays on a borrowed device.
retrieve.post('/', limiter, async (req, res) => {
  const phone = normalizePhone(req.body?.phone);
  const user = phone ? await prisma.user.findUnique({ where: { phone } }) : null;
  const ok = await bcrypt.compare(String(req.body?.password || ''), user?.passwordHash || DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'Phone number or password is wrong.' });
  const rows = await prisma.contact.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'asc' } });
  res.json({ contacts: rows.map((c) => ({ id: c.id, name: c.name, phone: decrypt(c.phoneEnc) })) });
});
