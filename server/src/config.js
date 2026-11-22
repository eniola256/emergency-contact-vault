const need = (k) => {
  const v = process.env[k];
  if (!v) throw new Error(`Missing env var ${k}`);
  return v;
};
export const config = {
  port: Number(process.env.PORT || 4000),
  prod: process.env.NODE_ENV === 'production',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  apiUrl: process.env.API_URL || 'http://localhost:4000',
  sessionSecret: need('SESSION_SECRET'),
  encKey: Buffer.from(need('CONTACT_ENCRYPTION_KEY'), 'hex'),
  bachsKey: process.env.BACHS_API_KEY || '',
  bachsWebhookSecret: process.env.BACHS_WEBHOOK_SECRET || '',
  currency: process.env.BACHS_CURRENCY || 'USD',
  paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true', // off: slot purchases are not available
  defaultCountry: process.env.DEFAULT_COUNTRY || 'NG',
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramBot: (process.env.TELEGRAM_BOT_USERNAME || '').replace(/^@/, ''),
  telegramMode: process.env.TELEGRAM_MODE || 'polling',          // polling (local) | webhook (production)
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || '',
  sessionHours: 2,
};
if (config.encKey.length !== 32) throw new Error('CONTACT_ENCRYPTION_KEY must be 64 hex chars');

export const FREE_SLOTS = 3;
export const PACKAGES = [
  { id: 'starter',  name: 'Starter',  slots: 5,  price: process.env.PRICE_STARTER  || '2.00' },
  { id: 'plus',     name: 'Plus',     slots: 10, price: process.env.PRICE_PLUS     || '3.50' },
  { id: 'extended', name: 'Extended', slots: 20, price: process.env.PRICE_EXTENDED || '6.00' },
];
