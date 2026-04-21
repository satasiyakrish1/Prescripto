# Zoho Payments Integration

This backend exposes endpoints to create Zoho Payment Orders and verify Zoho webhooks securely.

## Environment Variables
Create `backend/.env` with:

```
ZOHO_PAYMENTS_SIGNING_KEY=""
ZOHO_PAYMENTS_WEBHOOK_ID=""
ZOHO_PAYMENTS_API_ROOT="https://payments.zoho.in/api/v1"
ZOHO_PAYMENTS_ACCOUNT_ID=""
ZOHO_API_KEY=""

# Option A: Static OAuth access token (simple)
ZOHO_PAYMENTS_OAUTH_TOKEN="YOUR_OAUTH_ACCESS_TOKEN"

# Option B: Full OAuth (recommended for production)
ZOHO_CLIENT_ID=""
ZOHO_CLIENT_SECRET=""
ZOHO_REFRESH_TOKEN=""
ZOHO_ACCOUNTS_BASE="https://accounts.zoho.in"

CURRENCY="INR"
```

## Endpoints

- Create order: `POST /api/payments/create`
  - Body JSON:
  ```json
  { "amount": 499.0, "customer_email": "user@example.com", "description": "Order #1234" }
  ```
  - Response:
  ```json
  { "success": true, "orderId": "...", "paymentLink": "https://...", "data": { /* Zoho response */ } }
  ```

- Webhook: `POST /api/webhooks/zoho`
  - Expects `x-zoho-signature` header. Body must be sent raw.
  - On valid signature returns `{ "success": true }`.

## Compute Webhook Signature (local testing)

Signature is HMAC-SHA256 over the raw JSON string with `ZOHO_PAYMENTS_SIGNING_KEY`, hex-encoded.

Example Node snippet:

```js
const crypto = require('crypto');
const body = JSON.stringify({ event: 'payment_link.paid', payment_link: { id: 'plink_123', reference_id: 'YOUR_REFERENCE_ID', amount: 499.00, currency: 'INR', status: 'paid' } });
const sig = crypto.createHmac('sha256', process.env.ZOHO_PAYMENTS_SIGNING_KEY).update(body).digest('hex');
console.log(sig);
```

## cURL Examples

Create order:

```bash
curl -X POST http://localhost:4000/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{"amount":499,"customer_email":"user@example.com","description":"Order #1234"}'
```

Webhook (replace SIGNATURE):

```bash
curl -X POST http://localhost:4000/api/webhooks/zoho \
  -H "Content-Type: application/json" \
  -H "x-zoho-signature: SIGNATURE" \
  -d '{"event":"payment_link.paid","payment_link":{"id":"plink_123","reference_id":"YOUR_REFERENCE_ID","amount":499.00,"currency":"INR","status":"paid"}}'
```

## Notes
- `X-Account-Id` header is set from `ZOHO_PAYMENTS_ACCOUNT_ID`.
- For production, prefer OAuth refresh flow (`ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`).
- Webhook uses raw body parsing configured in `server.js`.
