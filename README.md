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

## Bachs payment flow
1. `POST /api/payments/checkout` creates a `PENDING` SlotPurchase, then `bachs.checkoutSessions.create({ pricing, reference, metadata, success_url })`; the buyer is sent to `checkout_url`.
2. Bachs sends a signed webhook to `POST /api/webhooks/bachs`. Create the endpoint in the Bachs dashboard/API and put its signing secret in `BACHS_WEBHOOK_SECRET`.
3. The webhook is verified with `bachs.webhooks.constructEvent(rawBody, headers, secret)`. On `collection.succeeded` (status `SUCCEEDED`/`OVERPAID`) the backend matches `data.reference`, checks currency and amount, then in one transaction marks the purchase `PAID` and adds the slots. Event ids are stored so replays do nothing.
4. The browser redirect never grants slots; the `#paid` page polls `GET /api/payments/latest`.

## Things to confirm
- Bachs prices in a currency + decimal amount (default `USD`, set `BACHS_CURRENCY`). Prices in `.env` are placeholders.
- `checkout.completed` is intentionally ignored; only a confirmed collection grants slots.
- Passing `req.headers` into `constructEvent` as a `Headers` object follows the SDK docs' fetch-style example; confirm against a real sandbox delivery (`docs.bachs.io/developer-portal/local-testing`).
- SMS: `src/sms.js` only logs codes. Plug in a real gateway before launch.
- Not yet tested against a live Postgres/Prisma; run the flows once in your environment.
