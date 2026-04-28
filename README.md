# Easy Poultry

The complete poultry platform — marketplace, auctions, competitions, farm management, and incubation — rebuilt as a standalone Vite + React + Tailwind app backed by **Firebase** (Auth, Firestore, Storage).

This is a fork of the original Base44-hosted app. The page UI (44 pages, 30+ components, full shadcn/ui design system) is preserved 1:1; only the data layer was swapped out so the app runs anywhere without the Base44 platform.

---

## Quick start (60 seconds)

```bash
npm install
cp .env.example .env.local      # add your Firebase config (or skip for DEMO MODE)
npm run dev
```

Then open http://localhost:5173.

> **Demo mode:** if `.env.local` is missing or empty, the app boots in **demo mode** with an in-memory store. You can click around every screen, sign in with any email/password (it'll be ignored), and explore the UI — but data won't persist between page refreshes.

## Production build

```bash
npm run build       # outputs to dist/
npm run preview     # local preview of the production build
```

---

## Wire up Firebase (5 minutes)

1. Go to <https://console.firebase.google.com/> and create a new project (e.g. `easy-poultry`).
2. In the project, click **Add app → Web (</>)**. Register the app and copy the `firebaseConfig` object.
3. Paste those values into `.env.local`:

   ```env
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=easy-poultry.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=easy-poultry
   VITE_FIREBASE_STORAGE_BUCKET=easy-poultry.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```

4. **Enable Authentication providers**: Authentication → Sign-in method → enable **Email/Password** and **Google**.
5. **Create Firestore database**: Firestore Database → Create database → Production mode → pick a region close to your users.
6. **Deploy security rules**: install the Firebase CLI (`npm i -g firebase-tools`), log in (`firebase login`), then:
   ```bash
   firebase init firestore       # accept firestore.rules as the rules file
   firebase deploy --only firestore:rules
   ```
7. **Enable Storage**: Storage → Get started → Production mode → same region as Firestore.

That's it. Restart `npm run dev`, sign up with an email, and you're live.

---

## Architecture

### The shim approach

All 17,000 lines of page code call `base44.entities.<Entity>.{list, filter, create, update, delete}` and `base44.auth.{me, logout, signIn, ...}`. Instead of rewriting every page, we replaced the **single file** that defines `base44` with a Firebase-backed shim — `src/api/base44Client.js`.

The shim:

- Exposes the exact same surface as the Base44 SDK, so pages import it the same way.
- Maps each "entity" to a Firestore collection of the same name (e.g. `Listing` → `/Listing/{docId}`).
- Translates `filter({ field: value }, '-created_date', 10)` → Firestore `where(...)` + `orderBy('created_date', 'desc')` + `limit(10)`.
- Adds `created_by`, `created_date`, `updated_date` automatically using server timestamps.
- Falls back to an in-memory store when Firebase isn't configured, so the app still boots for demos.

### Files that were replaced

| File | Purpose |
|------|---------|
| `src/api/base44Client.js` | Firebase shim — heart of the migration. |
| `src/api/entities.js` | Re-exports of all entities for convenience. |
| `src/api/integrations.js` | Stubs for SendEmail, SendSMS, InvokeLLM, etc. |
| `src/lib/firebase.js` | Firebase SDK init (Auth + Firestore + Storage). |
| `src/lib/AuthContext.jsx` | React context wired to Firebase Auth state. |
| `src/lib/app-params.js` | Slimmed-down URL param helper (no Base44 token). |
| `src/lib/VisualEditAgent.jsx` | Stubbed — was a Base44 platform editing tool. |
| `src/pages/Login.jsx` | New polished login/signup page (didn't exist in source). |
| `vite.config.js` | Removed `@base44/vite-plugin`. |
| `package.json` | Removed `@base44/sdk`, added `firebase`. |
| `index.html` | Easy Poultry branding. |
| `firestore.rules` | Security rules for all 45 collections. |
| `.env.example` | Firebase config template. |

The 44 pages, all components, and the entire shadcn/ui design system in `src/components/` are **untouched** from the source.

---

## Features

The app preserves every feature of the original:

**Marketplace** — browse, search, filter listings by category. Save listings, message sellers, view product detail with image carousel.

**Auctions** — auction houses, auction events, individual auctions, bidding, payment via Yoco *(payment requires Cloud Function — see "Wiring payments" below)*, registration.

**Competitions** — competition entries, ratings, winner announcements, hall of fame.

**Farm management** — poultry batches, batch detail, feed inventory, feed usage, vaccination scheduler, batch expense tracking, farm financials dashboard.

**Incubation** — egg incubation tracking, day-by-day logs, hatch rate analytics.

**Seller tools** — create/edit listings, seller shop, finances, reviews, tier upgrades, verification.

**CRM** — prospect tracking, inquiry management.

**Messaging** — chat with sellers/buyers, real-time-ish messaging, AI assistant ("CliffieChat").

**Admin** — admin dashboard, email campaigns, settings.

**Auth & profile** — Firebase Email/Password + Google sign-in, profile settings, banking info, onboarding.

---

## What's stubbed (and how to enable it)

A few features depend on services that need their own credentials. They're stubbed so the UI works, but they don't actually do anything until you wire them up:

### Yoco payments
The original used Base44's serverless function `createYocoCheckout`. To enable real payments:

1. Sign up at <https://yoco.co.za/> and get a secret key.
2. Create a Firebase Cloud Function `createYocoCheckout` that POSTs to Yoco's checkout API.
3. Replace the stub at the bottom of `src/api/base44Client.js` (`functions.invoke('createYocoCheckout', ...)`) with `httpsCallable(getFunctions(app), 'createYocoCheckout')(payload)`.

### Email & SMS (`SendEmail`, `SendSMS`)
The stubs in `src/api/base44Client.js` (`Core.SendEmail`, `Core.SendSMS`) just `console.info`. Wire them to:
- **Email**: SendGrid / Resend / Mailgun via a Cloud Function.
- **SMS**: Twilio / Clickatell / Bulksms via a Cloud Function.

### LLM (`InvokeLLM`)
Used by CliffieChat. Wire to Anthropic Claude or OpenAI via a Cloud Function for security (don't ship API keys in the frontend).

### Image generation (`GenerateImage`)
Wire to OpenAI DALL-E or Replicate via a Cloud Function.

---

## File map

```
Easy Poultry/
├── .env.example              ← Firebase config template
├── firestore.rules           ← Deploy these rules
├── package.json
├── vite.config.js
├── index.html
├── tailwind.config.js
├── components.json           ← shadcn/ui config
├── public/
│   └── favicon.svg
└── src/
    ├── App.jsx               ← root, routing, auth provider
    ├── Layout.jsx            ← top nav + footer + chat widget
    ├── main.jsx
    ├── pages.config.js       ← page registry
    ├── index.css             ← Tailwind base + design tokens
    ├── api/
    │   ├── base44Client.js   ← FIREBASE SHIM (the magic file)
    │   ├── entities.js       ← entity re-exports
    │   └── integrations.js   ← Core.* re-exports
    ├── lib/
    │   ├── firebase.js       ← Firebase init
    │   ├── AuthContext.jsx   ← Firebase auth context
    │   ├── app-params.js
    │   ├── PageNotFound.jsx
    │   └── ...
    ├── components/
    │   ├── ui/               ← 60+ shadcn/ui primitives
    │   ├── chat/, dashboard/, marketplace/, auctions/, ...
    │   └── ProtectedRoute.jsx
    ├── pages/                ← 44 pages
    │   ├── Home, Marketplace, Auctions, Competitions
    │   ├── Dashboard, FarmDashboard, BatchManagement, ...
    │   ├── Login.jsx         ← NEW polished login screen
    │   └── ...
    └── utils/
        └── index.ts
```

---

## Deploy to production

### Firebase Hosting (easiest, free tier)

```bash
npm i -g firebase-tools
firebase login
firebase init hosting
# - Use existing project → pick your easy-poultry project
# - Public directory: dist
# - Configure as single-page app: Yes
# - Set up automatic builds with GitHub: optional

npm run build
firebase deploy --only hosting
```

Your app will be live at `https://<project-id>.web.app`.

### Other options
- **Vercel**: `vercel` from the project root. Set the env vars in the Vercel dashboard.
- **Netlify**: drag-and-drop the `dist/` folder, or connect the GitHub repo.
- **Cloudflare Pages**: similar to Netlify; build command `npm run build`, output `dist`.

For all of the above, add the Firebase env vars in the hosting platform's settings.

---

## Roadmap / known gaps

- **Real-time bidding**: auctions currently use polling via React Query. Move to Firestore `onSnapshot` for true real-time.
- **CliffieChat (AI assistant)**: needs a Cloud Function backed by Claude / OpenAI.
- **Push notifications**: enable Firebase Cloud Messaging for browser push.
- **PWA / offline**: the Firestore SDK already uses persistent local cache. Add a service worker + manifest to make it installable.
- **TypeScript migration**: the new shim/lib code is type-safe via JSDoc, but the page tree is still JSX. Convert page-by-page when you have time.

---

## License

This project follows the original `EllenJoeSoftware/easypoultry` repository's license. The shadcn/ui components are MIT.
