import { Router } from 'express';
import express from 'express';
import { prisma } from '../db.js';
import { bachs } from '../bachs.js';
import { config } from '../config.js';

export const webhooks = Router();

// Raw body is required for signature verification, so this router is mounted BEFORE express.json().
webhooks.post('/bachs', express.raw({ type: '*/*', limit: '1mb' }), async (req, res) => {
  let event;
  try {
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) headers.set(k, Array.isArray(v) ? v.join(',') : String(v));
    event = bachs.webhooks.constructEvent(req.body.toString('utf8'), headers, config.bachsWebhookSecret);
  } catch (err) {
    console.warn('Rejected webhook: bad signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    await handle(event);
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handling failed', err);
    res.status(500).json({ error: 'Try again' }); // non-2xx makes Bachs retry
  }
});

const PAID_STATUSES = new Set(['SUCCEEDED', 'OVERPAID']);

export async function handle(event) {
  if (event.type === 'collection.succeeded') return fulfil(event);
  if (event.type === 'checkout.expired') {
    const id = event.data?.checkout_id;
    if (id) await prisma.slotPurchase.updateMany({ where: { checkoutId: id, status: 'PENDING' }, data: { status: 'EXPIRED' } });
  }
  // checkout.completed is deliberately not used to grant slots: only a confirmed collection is.
}

async function fulfil(event) {
  const d = event.data || {};
  if (!PAID_STATUSES.has(d.status)) return;
  const purchase = await prisma.slotPurchase.findUnique({ where: { reference: String(d.reference || '') } });
  if (!purchase) return;
  // Independent checks: what was charged must cover what we asked for, in the same currency.
  if (d.currency !== purchase.currency || Number(d.amount) < Number(purchase.amount)) {
    console.error('Payment amount mismatch', purchase.reference, d.amount, d.currency);
    return;
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.processedEvent.create({ data: { id: event.id } }); // unique: a replayed event throws
      const flipped = await tx.slotPurchase.updateMany({
        where: { id: purchase.id, status: { in: ['PENDING', 'EXPIRED'] } },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (flipped.count === 1 && purchase.userId) {
        await tx.user.update({ where: { id: purchase.userId }, data: { contactLimit: { increment: purchase.slots } } });
      }
    });
  } catch (err) {
    if (err.code === 'P2002') return; // already processed
    throw err;
  }
}
