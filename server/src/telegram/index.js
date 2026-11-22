import { config } from '../config.js';
import { prisma } from '../db.js';
import { makeHandler } from './handler.js';

async function api(method, body = {}) {
  if (!config.telegramToken) throw new Error('TELEGRAM_BOT_TOKEN is not set');
  const res = await fetch(`https://api.telegram.org/bot${config.telegramToken}/${method}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.ok) throw new Error(`Telegram ${method} failed: ${data.description || res.status}`); // never log the URL: it contains the token
  return data.result;
}

export const sendTelegram = (chatId, text, extra = {}) => api('sendMessage', { chat_id: chatId, text, ...extra });
export const handleUpdate = makeHandler({ db: prisma, send: sendTelegram });

export async function startBot() {
  if (!config.telegramToken) return console.warn('TELEGRAM_BOT_TOKEN is not set: sign-up verification is disabled.');
  if (config.telegramMode === 'webhook') {
    await api('setWebhook', { url: `${config.apiUrl}/api/telegram/webhook`, secret_token: config.telegramWebhookSecret, allowed_updates: ['message'] });
    return console.log('Telegram webhook set');
  }
  await api('deleteWebhook').catch(() => {});   // polling and webhooks cannot run together
  console.log(`Telegram bot @${config.telegramBot} is listening (polling)`);
  let offset = 0;
  (async () => {
    for (;;) {
      try {
        const updates = await api('getUpdates', { offset, timeout: 30, allowed_updates: ['message'] });
        for (const u of updates) {
          offset = u.update_id + 1;
          await handleUpdate(u).catch((e) => console.error('Telegram update failed:', e.message));
        }
      } catch (e) {
        console.error('Telegram polling error:', e.message);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  })();
}
