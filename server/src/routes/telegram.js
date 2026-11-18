import { Router } from 'express';
import { config } from '../config.js';
import { handleUpdate } from '../telegram/index.js';

export const telegram = Router();

// Production only (TELEGRAM_MODE=webhook). Telegram sends our secret in this header on every call.
telegram.post('/webhook', async (req, res) => {
  const secret = req.get('x-telegram-bot-api-secret-token');
  if (!config.telegramWebhookSecret || secret !== config.telegramWebhookSecret) return res.sendStatus(401);
  await handleUpdate(req.body);
  res.sendStatus(200);
});
