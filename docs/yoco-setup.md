# Yoco payments setup

Step-by-step. Total time: about 20 minutes.

## 1. Create a Yoco account & get API keys

1. Sign up at <https://portal.yoco.com/> (free; no monthly fee, only per-transaction).
2. Complete the basic onboarding (business details + bank account for payouts).
3. Go to **Online Sales** → **API Keys** in the sidebar.
4. You'll see two pairs of keys: **Test** (for development) and **Live** (for production).
5. **Start with the test keys** so you can run the full flow without real money. Copy:
   - **Secret key** (starts with `sk_test_...`)
   - **Webhook signing secret** — generated when you create a webhook in step 4 below.

⚠️ Never commit these to git. Never expose the secret key to the browser. We store them in Firebase Functions secrets.

## 2. Install Firebase Functions dependencies

```bash
cd "F:\2026\code\repos\EasyPoultry\Easy Poultry\functions"
npm install
```

## 3. Set the secrets in Firebase

```bash
cd "F:\2026\code\repos\EasyPoultry\Easy Poultry"
firebase functions:secrets:set YOCO_SECRET_KEY
# Paste your sk_test_... key when prompted, press Enter

firebase functions:secrets:set YOCO_WEBHOOK_SECRET
# Leave blank for now — we'll set this after step 4 generates it
```

## 4. Deploy the Cloud Functions

```bash
firebase deploy --only functions
```

This deploys **three** functions:

- `createYocoCheckout` (callable) — starts a Yoco checkout from the frontend
- `yocoWebhook` (HTTPS) — receives Yoco's payment confirmation
- `getSellerProfile` (callable) — used by ProductDetail to enrich seller info

After deploy, the terminal prints the URLs. **Copy the `yocoWebhook` URL** — it'll look like:

```
https://europe-west1-easy-poultry.cloudfunctions.net/yocoWebhook
```

## 5. Configure the Yoco webhook

1. Back in <https://portal.yoco.com/> → **Online Sales** → **Webhooks**.
2. Click **Create webhook**.
3. **URL**: paste the `yocoWebhook` URL from step 4.
4. **Events**: tick `payment.succeeded` and `payment.failed`.
5. **Mode**: Test (matches your `sk_test_` key).
6. Click **Create**. Yoco shows the **signing secret** once — copy it immediately.
7. Back in your terminal:

```bash
firebase functions:secrets:set YOCO_WEBHOOK_SECRET
# Paste the signing secret, press Enter

firebase deploy --only functions
# Redeploy so the function picks up the new secret value
```

## 6. Deploy updated Firestore rules

The new `Order` collection needs rules. From step 5's deploy, also run:

```bash
firebase deploy --only firestore:rules
```

## 7. Test the full flow

1. Open your site → publish a **digital listing** (CreateListing → Digital → upload a small test PDF → set price to R5 → publish).
2. Open the listing from the marketplace.
3. Click **Pay R5 & download** — you'll be redirected to Yoco's hosted checkout.
4. Use Yoco's **test card**: `4111 1111 1111 1111`, any future expiry, CVV `123`.
5. Complete the payment. Yoco redirects you back to `/ProductDetail?id=...&order=...&yoco_status=success`.
6. The page polls the Order document. Within 1–3 seconds, the webhook fires, the function flips Order.status to `paid`, and your download link unlocks.
7. Click **Download your file** — file downloads.

## 8. Going live

When you're ready to accept real payments:

1. Yoco portal → **Online Sales** → **API Keys** → copy the **Live secret key** (`sk_live_...`).
2. Yoco portal → **Webhooks** → create a **second** webhook with mode **Live** pointing to the same `yocoWebhook` URL. Copy the live signing secret.
3. Update Firebase secrets:
   ```bash
   firebase functions:secrets:set YOCO_SECRET_KEY     # paste sk_live_...
   firebase functions:secrets:set YOCO_WEBHOOK_SECRET # paste live signing secret
   firebase deploy --only functions
   ```
4. Test once with a small real amount (R1) to confirm the live flow works end-to-end.

## Troubleshooting

**Pay button does nothing / "Yoco not configured"**

→ Cloud Functions aren't deployed yet, or `YOCO_SECRET_KEY` secret isn't set. Run `firebase functions:log` to see the actual error.

**Redirected to Yoco but the page polls forever and never unlocks**

→ The webhook isn't reaching your function. Check:

1. Webhook URL in Yoco portal matches the deployed function URL exactly.
2. Webhook events include `payment.succeeded`.
3. `firebase functions:log` shows the webhook hit (look for `[yocoWebhook]` lines).
4. If you see "invalid signature" — the `YOCO_WEBHOOK_SECRET` doesn't match the signing secret Yoco generated. Re-copy it, re-set, redeploy.

**"Price mismatch" error**

→ The frontend sent a different amount than the listing's stored price. Check that the listing's `price` field hasn't been edited mid-checkout. (This is intentional security — we never trust the client amount.)

**Order shows `paid` but the download isn't there**

→ The Cloud Function stores a snapshot of the file URL on the Order at checkout time. If the seller edited/removed the file after you started checkout, the URL on the Order may be stale. The buyer-side code reads `paidOrder.digital_file_url` which is the snapshot, so this should always work — if it doesn't, check `firebase functions:log`.

**Webhook works in test mode but not live**

→ You need a **separate webhook configuration in live mode** with its own signing secret. Yoco doesn't share signing secrets between test and live.

## What's stored where

- **`Order` collection** (Firestore) — every checkout creates an Order doc. Status flows: `pending` → `paid` / `failed`. Buyer and seller both can read it. Only Cloud Functions write to it.
- **`Listing` collection** — updated on `payment.succeeded` for physical products: `stock_quantity` decremented, `sold_quantity` incremented, status set to `sold` when stock hits zero.
- **Yoco secrets** — only stored in Firebase Functions secret manager, never on disk, never in code, never in the browser.
