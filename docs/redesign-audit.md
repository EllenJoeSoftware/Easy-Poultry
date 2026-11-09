# Easy Poultry — Redesign Audit & Phase Plan

_Phases 1–6 complete (all routes on the design system). Remaining: Phase 7–9 QA._

## Stack (preserved — do not change)

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 6, JSX pages, React Router v6 |
| Styling | Tailwind 3 + shadcn/ui (Radix) + custom tokens in `src/index.css` |
| Data | Firebase Firestore via `src/api/client.js` shim (`api.entities.<Name>.list/filter/get/create/update/delete`) |
| Auth | Firebase Auth (email/password + Google) via `src/lib/AuthContext.jsx` |
| Storage | Firebase Storage (base64 fallback) via `api.integrations.Core.UploadFile` |
| Server | Firebase Cloud Functions v2 (Node 22, `europe-west1`) — Yoco checkout/verify, payouts, seller profile |
| Payments | Yoco hosted checkout (`createYocoCheckout` → redirect → `verifyYocoCheckout`) |
| Hosting | Vercel (SPA rewrite in `vercel.json`, OG middleware in `middleware.js`) |
| State | TanStack Query v5; Sonner toasts; Framer Motion |

## Design system (Phase 2 — done)

- Tokens: `src/index.css` `:root` — Primary `#174D35` (moss scale), Secondary `#287A4C` (leaf), Accent `#83AA62` (fresh scale), Background `#F4F6F1` (cream), Highlight `#E5A23C` (yolk), Terracotta retained for sale/alert.
- Type: **Manrope** headings (`.font-display`, `h1–h4`, `.h-display`), **Inter** body. Loaded in `index.html`.
- Utilities: `.card-premium`, `.btn-cta`, `.btn-accent`, `.btn-ghost`, `.chip*`, `.eyebrow`, `.glass-nav`, `.rule`, `.hero-warm`, `.grain`, `.marquee`, `.scrollbar-none`.
- Shared components: `components/shell/PageShell` (+`Section`), `EmptyState`, `StatCard`, `SkeletonCard` (`ListingSkeleton`, `LineSkeleton`, `StatSkeleton`), `AppShell` (sidebar SaaS layout), `icons/PoultryIcons`, `icons/EasyPoultryLogo`.
- Tailwind scales: `moss`, `fresh`, `terracotta`, `yolk`, `cream`, `ink`, `sage`; gradients `moss-gradient`, `fresh-gradient`, `amber-gradient`, `cream-gradient`; shadows `soft`, `lift`.

## Two environments (Phase 2 — done)

- **Public** (`Layout.jsx`): horizontal glass nav → Marketplace · Live Auctions · Competitions · Shops · Learning Centre · Farm Management · Contact; footer with Support/Get-the-app.
- **App** (`components/shell/AppShell.jsx`): collapsible sidebar (persisted), top bar with breadcrumb + notifications + user menu, mobile drawer. Mounted by `Layout.jsx` for any page in `APP_PAGES` when signed in.

## Route inventory & redesign status

Legend: ✅ redesigned on new system · 🟡 partially (uses tokens, old structure) · ⬜ legacy skin

### Public
| Route | Status | Notes |
|---|---|---|
| Home | ✅ | Hero, categories (custom icons), featured, why, testimonial, CTA |
| Marketplace | ✅ | Search panel, pills, filters, sort, skeletons |
| ProductDetail | ✅ | Digital download + Yoco flow done; header/sidebar styling legacy |
| Shops | ✅ | Directory with banners, sort, search |
| SellerShop | ✅ | Banner hero, about rail |
| Auctions / AuctionDetail / AuctionEventDetail | ✅ | Needs live indicators, countdowns, bid history layout |
| Competitions / CompetitionDetail / WinnersHallOfFame | ✅ | Needs event layout, registration flow |
| Support | ✅ | FAQ + contact form |
| AppMarketing | ✅ | App landing |
| PrivacyPolicy / TermsOfService | ✅ | Content fine; wrap in PageShell |
| Login | ✅ | Split panel, reset flow |

### App (sidebar)
| Route | Status | Notes |
|---|---|---|
| Dashboard | ✅ | Stats + tabs; empty states |
| MyOrders | ✅ | |
| Messages / Notifications | ✅ | Convert to app layout, inbox pattern |
| MyListings / SellerListings | ✅ | Table/grid with actions |
| CreateListing | ✅ | Physical/digital toggle, live preview |
| EditListing | ✅ | Mirror CreateListing |
| CRM | ✅ | Error handling added; needs table + filters polish |
| SellerReviews / SellerFinances | ✅ | |
| Payouts | ✅ | |
| FarmDashboard | ✅ | Combined stats, listings, batches |
| BatchManagement / BatchDetail | ✅ | Tables, charts |
| IncubationManagement / IncubationDetail | ✅ | Save fixed; UI legacy |
| FeedManagement / VaccinationManagement / FarmFinancials | ✅ | Charts (recharts already a dep) |
| FarmTeam | ✅ | |
| MyAuctions / MyAuctionHouse / Create* / ManageAuctionEvent / SubmitEntry | ✅ | |
| Admin / AdminDashboard | ✅ | Enterprise dashboard pattern |
| AdminPayouts | ✅ | |
| ProfileSettings | ✅ | Password change added; branding card added; rest legacy |
| Onboarding | ✅ | Stepper |

## Known gaps / risks
- `Search` page is orphaned (route removed) — delete file.
- `functions/package.json` contains a self-referential `"easy-poultry": "file:.."` dependency that breaks Cloud Functions deploys — remove it.
- Firestore composite indexes: client has an automatic fallback; still deploy `firestore.indexes.json` for performance.
- Yoco webhook optional; `verifyYocoCheckout` polling is the active confirmation path.

## Remaining phases
- Phases 4–6 done in this pass (public detail pages, all app modules incl. EditListing parity, Admin enterprise layout, Onboarding stepper, ProfileSettings, Privacy/Terms).
- **Phase 4 Marketplace**: ProductDetail header/gallery/sidebar; EditListing parity; wishlist (SavedListing exists) surfacing.
- **Phase 5 App modules**: Auctions (public + seller), Competitions, Batch/Feed/Vaccination/Financials with recharts, Messages inbox, Notifications, Onboarding stepper, SellerFinances/Reviews.
- **Phase 6 Admin**: Admin/AdminDashboard enterprise layout; user/listing/auction/competition management tables.
- **Phase 7 Responsive QA**: 1440/1280/1024/768/390/360; tables → stacked cards on mobile.
- **Phase 8–9 Functional QA**: route-by-route click-through; rules + indexes deployed.
