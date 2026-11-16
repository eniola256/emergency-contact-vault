import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { prisma } from './db.js';

const COOKIE = 'vault_session';

export function startSession(res, userId) {
  const token = jwt.sign({ sub: userId }, config.sessionSecret, { expiresIn: `${config.sessionHours}h` });
  res.cookie(COOKIE, token, {
    httpOnly: true, sameSite: config.prod ? 'none' : 'lax', secure: config.prod,
    maxAge: config.sessionHours * 3600_000, path: '/', // session expires; not remembered across devices
  });
}
export function endSession(res) {
  res.clearCookie(COOKIE, { httpOnly: true, sameSite: config.prod ? 'none' : 'lax', secure: config.prod, path: '/' });
}
export async function requireUser(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE];
    if (!token) return res.status(401).json({ error: 'Sign in to continue.' });
    const { sub } = jwt.verify(token, config.sessionSecret);
    const user = await prisma.user.findUnique({ where: { id: sub } });
    if (!user) return res.status(401).json({ error: 'Sign in to continue.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Sign in again.' });
  }
}
export const publicUser = async (u) => ({
  id: u.id, phone: u.phone, contactLimit: u.contactLimit,
  contactsUsed: await prisma.contact.count({ where: { userId: u.id } }),
});
