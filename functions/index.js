/**
 * Easy Poultry — Firebase Cloud Functions
 *
 * Exports:
 *   createYocoCheckout (HTTPS callable) — creates a Yoco checkout session
 *   yocoWebhook        (HTTPS request)  — receives & verifies Yoco webhook events
 *
 * Configuration (set once via Firebase CLI, never commit to git):
 *   firebase functions:secrets:set YOCO_SECRET_KEY
 *   firebase functions:secrets:set YOCO_WEBHOOK_SECRET
 *
 * Get these from https://portal.yoco.com → Online Sales → API Keys (use test
 * keys first; switch to live once verified).
 */
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import crypto from 'node:crypto';

initializeApp();
const db = getFirestore();

const YOCO_SECRET_KEY     = defineSecret('YOCO_SECRET_KEY');
const YOCO_WEBHOOK_SECRET = defineSecret('YOCO_WEBHOOK_SECRET');

const YOCO_API = 'https://payments.yoco.com/api/checkouts';

// Origins allowed to call our callable functions. Add new ones (Vercel
// preview URLs, custom domains) here when needed.
const ALLOWED_ORIGINS = [
  'https://www.easypoultry.co.za',
  'https://easypoultry.co.za',
  'https://easy-poultry.web.app',
  'https://easy-poultry.firebaseapp.com',
  'http://localhost:5173',
  'http://localhost:4173',
  /\.vercel\.app$/,
];

/* ============================================================
   createYocoCheckout — callable from the frontend
   Payload:
     {
       amount: number,         // ZAR (decimal, e.g. 285.50)
       listingId: string,
       quantity?: number,      // default 1
       successUrl: string,
       cancelUrl?: string,
       failureUrl?: string,
     }
   Returns:
     { data: { redirectUrl, orderId } }
   ============================================================ */
export const createYocoCheckout = onCall(
  {
    secrets: [YOCO_SECRET_KEY],
    cors: ALLOWED_ORIGINS,
    region: 'europe-west1',
    invoker: 'public',
  },
  async (request) => {
    const auth = request.auth;
    if (!auth) throw new HttpsError('unauthenticated', 'Sign in to checkout.');

    const {
      amount,
      listingId,
      quantity = 1,
      successUrl,
      cancelUrl,
      failureUrl,
    } = request.data || {};

    if (!amount || amount <= 0) throw new HttpsError('invalid-argument', 'Amount must be > 0.');
    if (!listingId)            throw new HttpsError('invalid-argument', 'listingId is required.');
    if (!successUrl)           throw new HttpsError('invalid-argument', 'successUrl is required.');

    // ---- Load listing to verify price, get seller, get file URL ------
    const listingSnap = await db.collection('Listing').doc(listingId).get();
    if (!listingSnap.exists) throw new HttpsError('not-found', 'Listing not found.');
    const listing = listingSnap.data();

    if (listing.status !== 'active') throw new HttpsError('failed-precondition', 'Listing is not active.');

    // Server-side price check — never trust client amount
    const expectedTotal = Number(listing.price) * Number(quantity);
    if (Math.abs(expectedTotal - amount) > 0.01) {
      throw new HttpsError('failed-precondition', `Price mismatch. Expected R${expectedTotal.toFixed(2)}.`);
    }

    // ---- Create a pending Order document ----------------------------
    const orderRef = db.collection('Order').doc();
    const orderId = orderRef.id;

    await orderRef.set({
      buyer_email:    auth.token.email || null,
      buyer_uid:      auth.uid,
      seller_email:   listing.created_by || null,
      listing_id:     listingId,
      listing_title:  listing.title || '',
      listing_image:  listing.images?.[0] || null,
      product_type:   listing.product_type || 'physical',
      digital_file_url: listing.digital_file_url || null,
      digital_file_name: listing.digital_file_name || null,
      amount,
      currency:       'ZAR',
      quantity,
      status:         'pending',
      yoco_checkout_id: null,
      created_date:   FieldValue.serverTimestamp(),
      updated_date:   FieldValue.serverTimestamp(),
    });

    // ---- Create Yoco checkout ----------------------------------------
    // Yoco wants amounts in CENTS as integers.
    const amountInCents = Math.round(amount * 100);

    const sep = successUrl.includes('?') ? '&' : '?';
    const yocoBody = {
      amount: amountInCents,
      currency: 'ZAR',
      successUrl: `${successUrl}${sep}order=${orderId}&yoco_status=success`,
      cancelUrl:  cancelUrl  ? `${cancelUrl}${cancelUrl.includes('?') ? '&' : '?'}order=${orderId}&yoco_status=cancel`  : undefined,
      failureUrl: failureUrl ? `${failureUrl}${failureUrl.includes('?') ? '&' : '?'}order=${orderId}&yoco_status=failure` : undefined,
      metadata: {
        order_id: orderId,
        listing_id: listingId,
        buyer_uid: auth.uid,
      },
    };

    let resp;
    try {
      const r = await fetch(YOCO_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${YOCO_SECRET_KEY.value()}`,
          'Idempotency-Key': orderId,
        },
        body: JSON.stringify(yocoBody),
      });
      resp = await r.json();
      if (!r.ok) {
        console.error('[Yoco] checkout API error', resp);
        await orderRef.update({ status: 'failed', failure_reason: resp.errorMessage || 'Yoco API error', updated_date: FieldValue.serverTimestamp() });
        throw new HttpsError('internal', resp.errorMessage || 'Yoco rejected the checkout.');
      }
    } catch (err) {
      console.error('[Yoco] fetch failed', err);
      await orderRef.update({ status: 'failed', failure_reason: String(err), updated_date: FieldValue.serverTimestamp() });
      throw new HttpsError('internal', 'Failed to reach Yoco.');
    }

    // Save the Yoco checkout id to the order so webhook can match it back
    await orderRef.update({
      yoco_checkout_id: resp.id,
      updated_date: FieldValue.serverTimestamp(),
    });

    return {
      data: {
        redirectUrl: resp.redirectUrl,
        orderId,
      },
    };
  }
);

/* ============================================================
   yocoWebhook — receives signed events from Yoco
   Configure in Yoco portal: Webhook URL = https://<region>-<project>.cloudfunctions.net/yocoWebhook
   ============================================================ */
export const yocoWebhook = onRequest(
  {
    secrets: [YOCO_WEBHOOK_SECRET],
    region: 'europe-west1',
    cors: false,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    // ---- Verify signature -------------------------------------------
    // Yoco signs the payload with HMAC-SHA256(timestamp + '.' + body, secret).
    // Header: 'webhook-signature: v1=<hex>'  Header: 'webhook-timestamp: <unix>'  Header: 'webhook-id: <id>'
    const signatureHeader = req.get('webhook-signature') || '';
    const timestamp       = req.get('webhook-timestamp');
    const webhookId       = req.get('webhook-id');

    if (!timestamp || !webhookId || !signatureHeader) {
      res.status(400).send('Missing webhook signature headers');
      return;
    }

    // Reject events older than 3 minutes — guards against replay attacks
    const tsSeconds = Number(timestamp);
    if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 180) {
      console.warn('[yocoWebhook] timestamp out of tolerance', timestamp);
      res.status(401).send('Stale timestamp');
      return;
    }

    // Yoco secret comes as 'whsec_<base64>' — strip the prefix before decoding
    let secret = YOCO_WEBHOOK_SECRET.value() || '';
    if (secret.startsWith('whsec_')) secret = secret.slice(6);
    const secretBytes = Buffer.from(secret, 'base64');

    const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(req.body);
    const signedContent = `${webhookId}.${timestamp}.${rawBody}`;
    const expectedSig = crypto
      .createHmac('sha256', secretBytes)
      .update(signedContent)
      .digest('base64');

    // Header format: "v1,<base64sig> v1,<base64sig2>"
    const received = signatureHeader
      .split(' ')
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf(',');
        return idx >= 0 ? part.slice(idx + 1) : part;
      });

    const isValid = received.some((sig) => {
      try {
        const a = Buffer.from(sig, 'utf8');
        const b = Buffer.from(expectedSig, 'utf8');
        return a.length === b.length && crypto.timingSafeEqual(a, b);
      } catch { return false; }
    });

    if (!isValid) {
      console.warn('[yocoWebhook] invalid signature', {
        receivedFirst: received[0]?.slice(0, 8),
        expectedFirst: expectedSig.slice(0, 8),
        bodyLen: rawBody.length,
      });
      res.status(401).send('Invalid signature');
      return;
    }

    // ---- Handle event -----------------------------------------------
    const event = req.body;
    const type = event?.type;
    const payload = event?.payload || {};
    const orderId =
      payload?.metadata?.order_id ||
      payload?.metadata?.orderId ||
      null;

    if (!orderId) {
      console.warn('[yocoWebhook] no order_id in metadata, ignoring event', type);
      res.status(200).send('OK (no order match)');
      return;
    }

    const orderRef = db.collection('Order').doc(orderId);

    if (type === 'payment.succeeded') {
      await orderRef.set({
        status: 'paid',
        paid_date: FieldValue.serverTimestamp(),
        yoco_payment_id: payload.id || null,
        yoco_amount_cents: payload.amount || null,
        yoco_payload: payload,
        updated_date: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Optional: increment listing sold_quantity & decrement stock
      try {
        const snap = await orderRef.get();
        const order = snap.data();
        if (order?.product_type !== 'digital' && order?.listing_id && order?.quantity) {
          const lref = db.collection('Listing').doc(order.listing_id);
          const lsnap = await lref.get();
          if (lsnap.exists) {
            const l = lsnap.data();
            const newStock = Math.max(0, (l.stock_quantity || 0) - order.quantity);
            const newSold  = (l.sold_quantity || 0) + order.quantity;
            await lref.update({
              stock_quantity: newStock,
              sold_quantity:  newSold,
              status:         newStock === 0 ? 'sold' : 'active',
              sold_date:      newStock === 0 ? FieldValue.serverTimestamp() : (l.sold_date || null),
              updated_date:   FieldValue.serverTimestamp(),
            });
          }
        }
      } catch (e) {
        console.error('[yocoWebhook] stock update failed', e);
      }
    } else if (type === 'payment.failed') {
      await orderRef.set({
        status: 'failed',
        yoco_payload: payload,
        updated_date: FieldValue.serverTimestamp(),
      }, { merge: true });
    } else {
      console.info('[yocoWebhook] unhandled event type', type);
    }

    res.status(200).send('OK');
  }
);

/* ============================================================
   verifyYocoCheckout — frontend calls this after user returns from Yoco.
   Reads the checkout status from Yoco's API and updates the Order doc.
   Eliminates the need for a separate webhook registration.
   ============================================================ */
export const verifyYocoCheckout = onCall(
  {
    secrets: [YOCO_SECRET_KEY],
    cors: ALLOWED_ORIGINS,
    region: 'europe-west1',
    invoker: 'public',
  },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in.');
    const { orderId } = request.data || {};
    if (!orderId) throw new HttpsError('invalid-argument', 'orderId required');

    const orderRef = db.collection('Order').doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) throw new HttpsError('not-found', 'Order not found');
    const order = snap.data();

    // Owner check
    if (order.buyer_uid !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'Not your order');
    }
    if (order.status === 'paid') return { data: { status: 'paid' } };
    if (!order.yoco_checkout_id) throw new HttpsError('failed-precondition', 'No Yoco checkout id on order');

    const r = await fetch(`${YOCO_API}/${order.yoco_checkout_id}`, {
      headers: { Authorization: `Bearer ${YOCO_SECRET_KEY.value()}` },
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('[verifyYocoCheckout] Yoco GET failed', data);
      throw new HttpsError('internal', data.errorMessage || 'Yoco lookup failed');
    }

    // Yoco statuses: created | cancelled | failed | successful
    if (data.status === 'successful') {
      await orderRef.set({
        status: 'paid',
        paid_date: FieldValue.serverTimestamp(),
        yoco_payload: data,
        updated_date: FieldValue.serverTimestamp(),
      }, { merge: true });

      // Decrement stock for physical products
      if (order.product_type !== 'digital' && order.listing_id && order.quantity) {
        try {
          const lref = db.collection('Listing').doc(order.listing_id);
          const lsnap = await lref.get();
          if (lsnap.exists) {
            const l = lsnap.data();
            const newStock = Math.max(0, (l.stock_quantity || 0) - order.quantity);
            await lref.update({
              stock_quantity: newStock,
              sold_quantity: (l.sold_quantity || 0) + order.quantity,
              status: newStock === 0 ? 'sold' : 'active',
              updated_date: FieldValue.serverTimestamp(),
            });
          }
        } catch (e) { console.error('[verifyYocoCheckout] stock update failed', e); }
      }
      return { data: { status: 'paid' } };
    }
    if (data.status === 'cancelled' || data.status === 'failed') {
      await orderRef.set({ status: data.status, yoco_payload: data, updated_date: FieldValue.serverTimestamp() }, { merge: true });
      return { data: { status: data.status } };
    }
    return { data: { status: 'pending' } };
  }
);

/* ============================================================
   getSellerProfile — used by ProductDetail to enrich seller info
   ============================================================ */
export const getSellerProfile = onCall(
  { cors: ALLOWED_ORIGINS, region: 'europe-west1', invoker: 'public' },
  async (request) => {
    const { created_by_id } = request.data || {};
    if (!created_by_id) return { data: { profile: null } };

    const snap = await db.collection('SellerProfile').where('created_by_id', '==', created_by_id).limit(1).get();
    if (snap.empty) return { data: { profile: null } };

    const doc = snap.docs[0];
    return { data: { profile: { id: doc.id, ...doc.data() } } };
  }
);
