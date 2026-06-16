/**
 * Vercel Edge Middleware — server-side OG tag injection for social-media bots.
 *
 * When a crawler (WhatsApp, Facebook, Twitter, LinkedIn, Discord, Slack,
 * Telegram, etc.) fetches a /ProductDetail or /SellerShop URL, we fetch the
 * underlying document from the Firestore REST API and return a static HTML
 * page with proper og:title / og:description / og:image tags. Humans get the
 * SPA unchanged.
 *
 * No npm install needed — this uses Vercel's built-in Edge runtime + the
 * Firebase project's web API key (public, scoped to client-side use).
 */

const BOT_REGEX = /(facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|whatsapp|skypeuripreview|pinterest|googlebot|bingbot|duckduckbot|yandexbot|baiduspider|applebot|ia_archiver|crawler|bot\/|preview)/i;

const FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/easy-poultry/databases/(default)/documents';
const SITE_URL = 'https://www.easypoultry.co.za';
const DEFAULT_IMAGE = `${SITE_URL}/favicon.svg`;

export const config = {
  matcher: ['/ProductDetail/:path*', '/SellerShop/:path*'],
};

export default async function middleware(req) {
  const ua = req.headers.get('user-agent') || '';
  const isBot = BOT_REGEX.test(ua);
  if (!isBot) return; // let humans hit the SPA normally

  const url = new URL(req.url);
  try {
    if (url.pathname.startsWith('/ProductDetail')) {
      const id = url.searchParams.get('id');
      if (!id) return;
      const html = await renderListingHTML(id);
      if (html) return new Response(html, { headers: htmlHeaders() });
    } else if (url.pathname.startsWith('/SellerShop')) {
      const sub = url.searchParams.get('shop');
      if (!sub) return;
      const html = await renderShopHTML(sub);
      if (html) return new Response(html, { headers: htmlHeaders() });
    }
  } catch (e) {
    console.error('[og-middleware] error', e);
    // fall through to default rewrite
  }
}

// ---------- Helpers ----------
function htmlHeaders() {
  return {
    'content-type': 'text/html; charset=utf-8',
    'cache-control': 'public, s-maxage=300, stale-while-revalidate=86400',
  };
}

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Firestore REST returns docs with typed fields like { fields: { title: { stringValue: ... } } }
function unwrap(field) {
  if (!field) return undefined;
  if ('stringValue'    in field) return field.stringValue;
  if ('integerValue'   in field) return Number(field.integerValue);
  if ('doubleValue'    in field) return field.doubleValue;
  if ('booleanValue'   in field) return field.booleanValue;
  if ('timestampValue' in field) return field.timestampValue;
  if ('arrayValue'     in field) return (field.arrayValue.values || []).map(unwrap);
  if ('mapValue'       in field) return unwrapFields(field.mapValue.fields);
  return undefined;
}
function unwrapFields(fields = {}) {
  const out = {};
  for (const k of Object.keys(fields)) out[k] = unwrap(fields[k]);
  return out;
}

async function fetchDoc(path) {
  const r = await fetch(`${FIRESTORE_BASE}/${path}`);
  if (!r.ok) return null;
  const json = await r.json();
  return unwrapFields(json.fields);
}

async function queryDocs(collection, field, value) {
  const r = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: {
          fieldFilter: {
            field: { fieldPath: field },
            op: 'EQUAL',
            value: { stringValue: value },
          },
        },
        limit: 1,
      },
    }),
  });
  if (!r.ok) return null;
  const arr = await r.json();
  const hit = arr.find((x) => x.document)?.document;
  return hit ? unwrapFields(hit.fields) : null;
}

async function renderListingHTML(id) {
  const listing = await fetchDoc(`Listing/${encodeURIComponent(id)}`);
  if (!listing) return null;

  const title = listing.title || 'Easy Poultry listing';
  const price = listing.price != null ? `R${Number(listing.price).toLocaleString('en-ZA')}` : '';
  const where = [listing.city, listing.province].filter(Boolean).join(', ');
  const desc  = (listing.description || `${title} on Easy Poultry${where ? ' · ' + where : ''}`).slice(0, 200);
  const image = listing.images?.[0] || DEFAULT_IMAGE;
  const ogTitle = price ? `${title} — ${price}` : title;
  const canonical = `${SITE_URL}/ProductDetail?id=${id}`;

  return baseHTML({
    title: `${ogTitle} | Easy Poultry`,
    description: desc,
    image,
    url: canonical,
    type: 'product',
    extra: `
      <meta property="product:price:amount" content="${esc(listing.price ?? 0)}" />
      <meta property="product:price:currency" content="${esc(listing.currency || 'ZAR')}" />
    `,
  });
}

async function renderShopHTML(subdomain) {
  const shop = await queryDocs('SellerProfile', 'subdomain', subdomain);
  if (!shop) return null;

  const name  = shop.business_name || shop.farm_name || shop.shop_name || shop.display_name || 'Easy Poultry shop';
  const where = [shop.city, shop.province].filter(Boolean).join(', ');
  const desc  = (shop.bio || `${name}${where ? ' · ' + where : ''} — verified poultry seller on Easy Poultry.`).slice(0, 200);
  const image = shop.cover_image_url || shop.profile_photo_url || DEFAULT_IMAGE;
  const canonical = `${SITE_URL}/SellerShop?shop=${subdomain}`;

  return baseHTML({
    title: `${name} | Easy Poultry`,
    description: desc,
    image,
    url: canonical,
    type: 'profile',
  });
}

function baseHTML({ title, description, image, url, type = 'website', extra = '' }) {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="${esc(type)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:url" content="${esc(url)}">
<meta property="og:site_name" content="Easy Poultry">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
${extra}
</head><body>
<p>Redirecting to <a href="${esc(url)}">${esc(title)}</a>…</p>
<script>window.location.replace(${JSON.stringify(url)});</script>
</body></html>`;
}
