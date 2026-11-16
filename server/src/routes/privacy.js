import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { prisma } from '../db.js';

export const privacy = Router();
const limiter = rateLimit({ windowMs: 60 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });

// For people who learn their number is stored and want it removed or corrected.
privacy.post('/report', limiter, async (req, res) => {
  const p = z.object({
    kind: z.enum(['remove-my-number', 'correct-data', 'other']),
    phone: z.string().min(6).max(24),
    message: z.string().max(1000).optional(),
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: 'Choose a request type and enter your phone number.' });
  await prisma.privacyReport.create({ data: p.data });
  res.json({ ok: true });
});
