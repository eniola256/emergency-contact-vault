import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db.js';
import { requireUser } from '../auth.js';
import { encrypt, decrypt } from '../crypto.js';
import { normalizePhone } from '../phone.js';

export const contacts = Router();
contacts.use(requireUser);

const body = z.object({ name: z.string().trim().min(1, 'Enter a name.').max(80), phone: z.string().min(6).max(24) });
const out = (c) => ({ id: c.id, name: c.name, phone: decrypt(c.phoneEnc) });

contacts.get('/', async (req, res) => {
  const rows = await prisma.contact.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'asc' } });
  res.json({ contacts: rows.map(out), limit: req.user.contactLimit, used: rows.length });
});

contacts.post('/', async (req, res) => {
  const p = body.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  const phone = normalizePhone(p.data.phone);
  if (!phone) return res.status(400).json({ error: 'Enter a valid phone number for this contact.' });
  // Lock the user row so two simultaneous requests cannot both take the last slot.
  const result = await prisma.$transaction(async (tx) => {
    const [u] = await tx.$queryRaw`SELECT "contactLimit" FROM "User" WHERE id = ${req.user.id} FOR UPDATE`;
    const used = await tx.contact.count({ where: { userId: req.user.id } });
    if (used >= u.contactLimit) return null;
    return tx.contact.create({ data: { userId: req.user.id, name: p.data.name, phoneEnc: encrypt(phone) } });
  });
  if (!result) return res.status(403).json({ error: 'All your slots are in use. Delete a contact to add another.', code: 'SLOTS_FULL' });
  res.status(201).json({ contact: out(result) });
});

contacts.put('/:id', async (req, res) => {
  const p = body.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  const phone = normalizePhone(p.data.phone);
  if (!phone) return res.status(400).json({ error: 'Enter a valid phone number for this contact.' });
  const r = await prisma.contact.updateMany({ where: { id: req.params.id, userId: req.user.id }, data: { name: p.data.name, phoneEnc: encrypt(phone) } });
  if (!r.count) return res.status(404).json({ error: 'Contact not found.' });
  res.json({ contact: out(await prisma.contact.findUnique({ where: { id: req.params.id } })) });
});

contacts.delete('/:id', async (req, res) => {
  const r = await prisma.contact.deleteMany({ where: { id: req.params.id, userId: req.user.id } }); // frees a slot; limit unchanged
  if (!r.count) return res.status(404).json({ error: 'Contact not found.' });
  res.json({ ok: true });
});
