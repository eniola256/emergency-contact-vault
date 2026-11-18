# Emergency Contact Vault

React + Vite client, Node/Express API, PostgreSQL via Prisma, payments via **Bachs** (bachs.io).

## Run it
```bash
# API
cd server && cp .env.example .env      # fill SESSION_SECRET, CONTACT_ENCRYPTION_KEY, BACHS_*
npm install && npx prisma db push && npm run dev

# Client (proxies /api to :4000)
cd client && npm install && npm run dev

# Client demo build (no backend, simulated SMS + Bachs checkout)
npm run build:demo && node build-artifact.mjs
```

## Bachs payment flow (currently switched off)
Slot purchases are disabled: the site shows "Payments are not accepted at this time." Set `PAYMENTS_ENABLED=true` (plus the `BACHS_*` and `PRICE_*` values) to turn the flow below back on; the client then shows the packages again.

1. `POST /api/payments/checkout` creates a `PENDING` SlotPurchase, then `bachs.checkoutSessions.create({ pricing, reference, metadata, success_url })`; the buyer is sent to `checkout_url`.
2. Bachs sends a signed webhook to `POST /api/webhooks/bachs`. Create the endpoint in the Bachs dashboard/API and put its signing secret in `BACHS_WEBHOOK_SECRET`.
3. The webhook is verified with `bachs.webhooks.constructEvent(rawBody, headers, secret)`. On `collection.succeeded` (status `SUCCEEDED`/`OVERPAID`) the backend matches `data.reference`, checks currency and amount, then in one transaction marks the purchase `PAID` and adds the slots. Event ids are stored so replays do nothing.
4. The browser redirect never grants slots; the `#paid` page polls `GET /api/payments/latest`.

## Things to confirm
- Bachs prices in a currency + decimal amount (default `USD`, set `BACHS_CURRENCY`). Prices in `.env` are placeholders.
- `checkout.completed` is intentionally ignored; only a confirmed collection grants slots.
- Passing `req.headers` into `constructEvent` as a `Headers` object follows the SDK docs' fetch-style example; confirm against a real sandbox delivery (`docs.bachs.io/developer-portal/local-testing`).
- Not yet tested against a live Postgres/Prisma; run the flows once in your environment.

## Telegram verification (replaces SMS)
1. Create the bot with @BotFather, then put `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` in `server/.env`. If the token ever leaks, send `/revoke` to @BotFather.
2. `POST /api/auth/register` stores the pending sign-up and returns a `t.me/<bot>?start=<token>` link. Only the hash of the token is stored.
3. The user opens the link, presses Start, and taps "Share my phone number". The bot only sends a code if the shared contact is the user's own Telegram account **and** its number equals the number typed on the site.
4. The user types the code on the site, which creates the account and links the Telegram account to it (one Telegram account per vault).
5. Password reset sends its code to that linked Telegram account. Users must have started the bot, which sign-up guarantees.
- Local development uses long polling (`TELEGRAM_MODE=polling`). In production use `TELEGRAM_MODE=webhook`, a public https `API_URL`, and a `TELEGRAM_WEBHOOK_SECRET`.
- Run `npm test` in `server` for the bot-logic tests.
- After pulling this change run `npx prisma db push` (adds `User.telegramId` and the new `OtpCode` columns).
