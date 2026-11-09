# Redesign conventions (read before touching any page)

Repo: `C:\Users\Wycliffe\source\repos\Easypoultryweb` (Vite + React 18 JSX + Tailwind + shadcn/ui). Pages live in `src/pages/*.jsx`, routed by `src/pages.config.js` (`/PageName`), link with `createPageUrl('PageName')` from `../utils`.

## Hard rules
- PRESERVE every data call, mutation, field name, query key and business rule exactly. Only the presentation changes. Keep `api.entities.X.*`, `api.auth.*`, `api.functions.invoke`, `api.integrations.Core.UploadFile` usage as-is.
- No new dependencies. Allowed libs already present: lucide-react, framer-motion, moment, recharts, sonner, @tanstack/react-query, shadcn components under `@/components/ui/*`.
- Must compile. Balanced JSX; every icon you reference must be imported from `lucide-react`. Don't leave unused imports that don't exist (e.g. `Card` if you removed the import).
- Add `onError: (e) => toast.error(e?.message || 'Something went wrong')` to mutations that lack it.
- Mobile first: tables must collapse to stacked rows (`hidden md:grid` headers, `md:hidden` meta), grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`.

## Page skeleton
```jsx
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton, LineSkeleton, ListingSkeleton } from '@/components/shell/SkeletonCard';

<PageShell variant="compact" eyebrow="Farm" title="Batches" subtitle="…"
  breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Batches' }]}
  action={<Button className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> New</Button>}>
  …content…
</PageShell>
```
- Public pages use `variant="hero"` (default) with an expressive title like `<>Bid on <span className="italic text-moss-700">premium</span> poultry.</>`; app (sidebar) pages use `variant="compact"`.
- Signed-in gate: `if (!user) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;`
- `EmptyState` props: `icon`, `title`, `subtitle`, `action`, `variant="card"|"plain"`.
- `StatCard` props: `icon`, `label`, `value`, `delta`, `deltaLabel`, `tint="moss"|"terracotta"|"yolk"|"sage"`.

## Tokens / utilities (in `src/index.css`, Tailwind config)
- Colours: `moss-50…900` (primary green, #174D35 ≈ moss-600/700), `fresh-50…` (accent #83AA62), `yolk-50…700` (highlight #E5A23C), `terracotta-50…700` (alerts/sale), `cream` / `cream-deep` (backgrounds), `ink` (text; use `text-ink`, `text-ink/70`, `text-ink/55`, `text-ink/40`), `border-border`.
- Surfaces: `card-premium` (white rounded-2xl soft shadow border), `glass-nav`.
- Buttons: `btn-cta` (primary pill), `btn-accent`, `btn-ghost` (+ `border border-border bg-white` for outlined look). Destructive: `rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white`.
- Chips: `chip`, `chip-accent`, `chip-yolk`; status: active `bg-fresh-50 text-moss-700 border-fresh-200`, sold/ended `bg-ink/70 text-cream border-0`, pending `bg-yolk-50 text-yolk-700 border-yolk-200`, inactive `bg-cream-deep text-ink/60 border-border`, live `bg-terracotta-500 text-white` with pulsing dot.
- Type: `font-display` (Manrope) for headings and big numbers (`stat-num`), `eyebrow` for small uppercase labels, `h-display` for hero titles.
- Gradients: `bg-moss-gradient` (dark green band, pair with `text-cream` and `<div className="absolute inset-0 grain opacity-50" />`), `bg-amber-gradient`, `bg-cream-gradient`.
- Pill tabs (shadcn Tabs): `TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex"`, `TabsTrigger className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream"`.
- Dialogs: `DialogContent className="rounded-2xl"`, titles `font-display`; cancel buttons `variant="outline" className="rounded-full"`.
- Inputs inside custom panels: `bg-cream border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300`.
- Lists animate with framer-motion stagger: parent `initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}`, child `variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}`.
- Recharts palette: `#174D35 #287A4C #83AA62 #E5A23C #C8673D`; grid `#E7EBE1`; tick fill `#6B7A70`; dark tooltip `rounded-xl bg-ink text-cream px-3 py-2 text-xs`.
- Never use raw hex (`#7A9D7A`, `#E07A5F`), `gray-*`, `blue-*`, `green-*`, `red-*`, `purple-*`, `orange-*` Tailwind classes.

## Reference implementations (copy patterns from these)
`src/pages/MyListings.jsx` (table/row list + bulk bar), `src/pages/BatchManagement.jsx` (cards with progress bars + dropdown actions), `src/pages/FarmFinancials.jsx` (recharts), `src/pages/Notifications.jsx`, `src/pages/Messages.jsx`, `src/pages/Auctions.jsx`, `src/pages/Competitions.jsx`, `src/pages/CreateListing.jsx`.
