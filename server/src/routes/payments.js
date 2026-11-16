import { Router } from 'express';
import { prisma } from '../db.js';
import { requireUser } from '../auth.js';
import { bachs } from '../bachs.js';
import { config, PACKAGES } from '../config.js';
import { randomRef } from '../crypto.js';

export const payments = Router();

payments.get('/packages', (req, res) => res.json({ currency: config.currency, packages: PACKAGES }));

// Start checkout. Nothing is granted here; slots are only added by the verified webhook.
payments.post('/checkout', requireUser, async (req, res) => {
  const pkg = PACKAGES.find((p) => p.id === req.body?.packageId);
  if (!pkg) return res.status(400).json({ error: 'Choose a slot package.' });
  const reference = randomRef();
  const purchase = await prisma.slotPurchase.create({
    data: { userId: req.user.id, packageId: pkg.id, slots: pkg.slots, amount: pkg.price, currency: config.currency, reference },
  });
  try {
    const session = await bachs.checkoutSessions.create(
      {
        pricing: { currency: config.currency, amount: pkg.price },
        reference,
        metadata: { purchase_id: purchase.id, user_id: req.user.id, slots: String(pkg.slots), package: pkg.id },
        success_url: `${config.apiUrl}/api/payments/return`,
        cancel_url: `${config.clientUrl}/#dashboard`,
        expires_in_minutes: 60,
      },
      { idempotencyKey: `checkout-${purchase.id}` },
    );
    await prisma.slotPurchase.update({ where: { id: purchase.id }, data: { checkoutId: session.checkout_id } });
    res.json({ checkoutUrl: session.checkout_url, reference });
  } catch (err) {
    console.error('Bachs checkout failed', err);
    await prisma.slotPurchase.update({ where: { id: purchase.id }, data: { status: 'FAILED' } });
    res.status(502).json({ error: 'Payment could not be started. Try again in a moment.' });
  }
});

// Bachs sends the buyer here after paying (it appends ?checkout_id=...). We only redirect;
// the page they land on asks the backend whether the webhook has confirmed the payment.
payments.get('/return', (req, res) => res.redirect(`${config.clientUrl}/#paid`));

// Latest purchase for the signed-in user. The browser polls this; it never grants slots.
payments.get('/latest', requireUser, async (req, res) => {
  const p = await prisma.slotPurchase.findFirst({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
  const fresh = await prisma.user.findUnique({ where: { id: req.user.id } });
  res.json({ purchase: p && { reference: p.reference, status: p.status, slots: p.slots, amount: p.amount, currency: p.currency }, contactLimit: fresh.contactLimit });
});
