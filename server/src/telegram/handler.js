// Bot conversation logic. Kept free of database and network imports so it can be tested on its own.
import { normalizePhone } from '../phone.js';
import { sha256, randomCode } from '../crypto.js';

export const CODE_MINUTES = 10;
const MAX_ATTEMPTS = 5;
const SHARE_KEYBOARD = { keyboard: [[{ text: 'Share my phone number', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true };
const NO_KEYBOARD = { remove_keyboard: true };

export const codeMessage = (code) =>
  `Your AE Vault code is ${code}. It expires in ${CODE_MINUTES} minutes. If you did not ask for it, ignore this message.`;

export function makeHandler({ db, send }) {
  return async function handleUpdate(update) {
    const msg = update?.message;
    if (!msg || msg.chat?.type !== 'private' || !msg.from) return;
    const chat = msg.chat.id;
    const fromId = String(msg.from.id);
    const reply = (text, extra) => send(chat, text, extra ? { reply_markup: extra } : {});
    const now = new Date();

    // 1) Deep link: t.me/Bot?start=<token> arrives as "/start <token>"
    if (typeof msg.text === 'string' && msg.text.startsWith('/start')) {
      const token = msg.text.split(/\s+/)[1];
      if (!token) return reply('Welcome to AE Vault verification. To create an account, start on the website and press "Open Telegram bot".');
      const row = await db.otpCode.findUnique({ where: { startHash: sha256(token) } });
      if (!row || row.purpose !== 'REGISTER' || row.expiresAt < now) return reply('This link has expired. Go back to the website and start again.');
      await db.otpCode.update({ where: { id: row.id }, data: { telegramId: fromId } });
      return reply(`Confirm that ${row.phone} is your number. Tap the button below to share the phone number of this Telegram account.`, SHARE_KEYBOARD);
    }

    // 2) The user shared a contact. It must be their own, and match the number typed on the website.
    if (msg.contact) {
      if (String(msg.contact.user_id) !== fromId) return reply('Share your own number with the button, not another contact.', SHARE_KEYBOARD);
      const row = await db.otpCode.findFirst({
        where: { telegramId: fromId, purpose: 'REGISTER', expiresAt: { gt: now } },
        orderBy: { createdAt: 'desc' },
      });
      if (!row) return reply('No sign-up is waiting. Start on the website and press "Open Telegram bot".', NO_KEYBOARD);
      if (row.attempts >= MAX_ATTEMPTS) return reply('Too many wrong attempts. Go back to the website and start again.', NO_KEYBOARD);
      const shared = normalizePhone('+' + String(msg.contact.phone_number || '').replace(/\D/g, ''));
      if (shared !== row.phone) {
        await db.otpCode.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
        return reply(`This Telegram account's number does not match ${row.phone}. Check the number on the website, or use the Telegram account that has that number.`, SHARE_KEYBOARD);
      }
      const code = randomCode();
      await db.otpCode.update({ where: { id: row.id }, data: { codeHash: sha256(`${row.phone}:${code}`), attempts: 0 } });
      return reply(codeMessage(code), NO_KEYBOARD);
    }

    return reply('I only send verification codes. To create an account or reset a password, use the website.');
  };
}
