import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search, MapPin, ShieldCheck, Store, ArrowRight, Star, Package,
  TrendingUp, Sparkles, X,
} from 'lucide-react';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { ListingSkeleton } from '@/components/shell/SkeletonCard';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createPageUrl } from '../utils';

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most popular',  icon: TrendingUp },
  { value: 'rating',     label: 'Highest rated', icon: Star },
  { value: 'verified',   label: 'Verified first', icon: ShieldCheck },
  { value: 'newest',     label: 'Newest shops',  icon: Sparkles },
];

const businessNameOf = (s) =>
  s?.business_name || s?.farm_name || s?.shop_name || s?.display_name || 'Shop';

export default function Shops() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity');

  // Sync state to URL
  React.useEffect(() => {
    const next = new URLSearchParams();
    if (searchQuery) next.set('q', searchQuery);
    if (sortBy && sortBy !== 'popularity') next.set('sort', sortBy);
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, sortBy]);

  // Pull all shops + (in parallel) all active listings + reviews so we can compute stats
  const { data, isLoading } = useQuery({
    queryKey: ['shops-directory'],
    staleTime: 60_000,
    queryFn: async () => {
      const [profiles, listings, reviews] = await Promise.all([
        api.entities.SellerProfile.list(),
        api.entities.Listing.filter({ status: 'active' }).catch(() => []),
        api.entities.SellerReview.list().catch(() => []),
      ]);

      // Build a lookup of listings + reviews per seller email
      const byEmail = new Map();
      for (const p of profiles) {
        byEmail.set(p.user_email, {
          profile: p,
          listings: 0,
          totalSold: 0,
          rating: 0,
          reviewCount: 0,
        });
      }

      for (const l of listings) {
        const bucket = byEmail.get(l.created_by);
        if (bucket) {
          bucket.listings += 1;
          bucket.totalSold += l.sold_quantity || 0;
        }
      }

      for (const r of reviews) {
        const bucket = byEmail.get(r.seller_email);
        if (bucket && typeof r.rating === 'number') {
          bucket.rating = (bucket.rating * bucket.reviewCount + r.rating) / (bucket.reviewCount + 1);
          bucket.reviewCount += 1;
        }
      }

      return Array.from(byEmail.values());
    },
  });

  const shops = useMemo(() => {
    if (!data) return [];
    let list = [...data];

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter((s) => {
        const name = businessNameOf(s.profile).toLowerCase();
        return (
          name.includes(q) ||
          s.profile.bio?.toLowerCase().includes(q) ||
          s.profile.city?.toLowerCase().includes(q) ||
          s.profile.province?.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    switch (sortBy) {
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0) || b.reviewCount - a.reviewCount);
        break;
      case 'verified':
        list.sort((a, b) => Number(!!b.profile.seller_verified) - Number(!!a.profile.seller_verified) || b.listings - a.listings);
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.profile.created_date || 0) - new Date(a.profile.created_date || 0));
        break;
      default: // popularity
        list.sort((a, b) =>
          (b.totalSold * 2 + b.listings) - (a.totalSold * 2 + a.listings) ||
          (b.rating || 0) - (a.rating || 0)
        );
    }
    return list;
  }, [data, sortBy, searchQuery]);

  const sortLabel = SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Sort';
  const totalShops = data?.length || 0;
  const verifiedCount = (data || []).filter((s) => s.profile.seller_verified).length;

  return (
    <PageShell
      eyebrow="Shops"
      title="Browse poultry shops."
      subtitle={
        totalShops > 0
          ? `${totalShops} ${totalShops === 1 ? 'farm' : 'farms'} on Easy Poultry, ${verifiedCount} verified.`
          : 'Verified breeders, hatcheries and feed merchants across South Africa.'
      }
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Shops' }]}
    >
      {/* ============ Search + Sort panel ============ */}
      <div className="card-premium p-2 -mt-6 lg:-mt-10 mb-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-stretch gap-2 p-1.5">
          <div className="relative flex-1 flex items-center md:border-r md:border-border md:pr-3 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 pointer-events-none transition-colors group-focus-within:text-moss-700" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shops by name, location or bio…"
              className="w-full bg-transparent pl-11 pr-10 py-3 text-base placeholder:text-ink/40 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-cream-deep flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 text-ink/50" />
              </button>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-ink/70 hover:bg-moss-50 hover:text-moss-700 transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                {sortLabel}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => setSortBy(opt.value)}
                  className={sortBy === opt.value ? 'bg-moss-50 text-moss-700 font-medium' : ''}
                >
                  <opt.icon className="w-4 h-4 mr-2 opacity-70" />
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ============ Result meta ============ */}
      {!isLoading && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-ink/60">
            <span className="font-semibold text-ink">{shops.length}</span> {shops.length === 1 ? 'shop' : 'shops'}
            {searchQuery && (
              <> matching <span className="font-medium text-moss-700">"{searchQuery}"</span></>
            )}
          </p>
        </div>
      )}

      {/* ============ Grid ============ */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <ShopCardSkeleton key={i} />)}
        </div>
      ) : shops.length === 0 ? (
        <EmptyState
          icon={Store}
          title={searchQuery ? `No shops match "${searchQuery}"` : 'No shops yet'}
          subtitle={
            searchQuery
              ? 'Try a different name, city, or province — or be the first to set up a shop in your area.'
              : "Be the first to set up shop. List your farm, configure your branding, and start selling in minutes."
          }
          action={
            <Link to={createPageUrl('ProfileSettings')}>
              <button className="btn-cta px-5 py-2.5 text-sm">Set up your shop</button>
            </Link>
          }
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {shops.map((s) => <ShopCard key={s.profile.id} shop={s} />)}
        </motion.div>
      )}
    </PageShell>
  );
}

/* ====================================================================== */
/*  ShopCard                                                              */
/* ====================================================================== */
function ShopCard({ shop }) {
  const { profile, listings, totalSold, rating, reviewCount } = shop;
  const businessName = businessNameOf(profile);
  const ownerName = profile.display_name;
  const showOwner = ownerName && ownerName !== businessName;

  const shopUrl = profile.subdomain
    ? createPageUrl('SellerShop') + `?shop=${profile.subdomain}`
    : null;

  return (
    <motion.article
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
      className="group card-premium overflow-hidden flex flex-col relative"
    >
      {/* Stretched link covers card; action buttons stop propagation */}
      {shopUrl && (
        <Link to={shopUrl} className="absolute inset-0 z-10" aria-label={`Visit ${businessName}`} />
      )}

      {/* Banner */}
      <div className="relative aspect-[16/9] overflow-hidden bg-moss-gradient">
        {profile.cover_image_url ? (
          <img
            src={profile.cover_image_url}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <>
            <div className="absolute inset-0 grain opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center text-cream/30">
              <Store className="w-12 h-12" strokeWidth={1.5} />
            </div>
          </>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />

        {/* Top-left: rating chip (if any) */}
        {rating > 0 && (
          <div className="absolute top-3 left-3 z-20 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream/95 backdrop-blur-sm shadow-sm">
            <Star className="w-3.5 h-3.5 text-yolk-400 fill-yolk-300" />
            <span className="text-xs font-semibold text-ink">{rating.toFixed(1)}</span>
            <span className="text-[10px] text-ink/50">({reviewCount})</span>
          </div>
        )}

        {/* Top-right: verified badge */}
        {profile.seller_verified && (
          <div className="absolute top-3 right-3 z-20">
            <Badge className="bg-cream/95 text-moss-700 border-0 backdrop-blur-sm gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </Badge>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-5 pt-5 pb-5 flex-1 flex flex-col">
        <h3 className="font-display text-xl text-ink leading-tight line-clamp-2 group-hover:text-moss-700 transition-colors">
          {businessName}
        </h3>
        {showOwner && (
          <p className="text-xs text-ink/55 mt-1">
            Run by <span className="font-medium text-ink/75">{ownerName}</span>
          </p>
        )}

        {(profile.city || profile.province) && (
          <p className="mt-2 text-xs text-ink/55 inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {[profile.city, profile.province].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Description */}
        <p
          className={`mt-3 text-sm leading-relaxed line-clamp-3 ${
            profile.bio ? 'text-ink/70' : 'text-ink/30 italic'
          }`}
        >
          {profile.bio || 'No description set yet.'}
        </p>

        {/* Stats strip */}
        <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="font-display text-lg font-bold text-ink">{listings}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink/50">Listings</p>
          </div>
          <div className="border-x border-border">
            <p className="font-display text-lg font-bold text-ink">{totalSold}</p>
            <p className="text-[10px] uppercase tracking-wider text-ink/50">Sold</p>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-ink">
              {rating > 0 ? rating.toFixed(1) : '—'}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-ink/50">Rating</p>
          </div>
        </div>

        {/* CTA */}
        {shopUrl && (
          <div className="mt-5 inline-flex items-center justify-between text-sm font-medium text-moss-700 group-hover:text-moss-800 transition-colors">
            <span>Visit shop</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        )}
      </div>
    </motion.article>
  );
}

function ShopCardSkeleton() {
  return (
    <div className="card-premium overflow-hidden animate-pulse">
      <div className="aspect-[16/9] bg-cream-deep" />
      <div className="px-5 pt-5 pb-5 space-y-3">
        <div className="h-5 bg-cream-deep rounded w-3/4" />
        <div className="h-3 bg-cream-deep rounded w-1/2" />
        <div className="h-3 bg-cream-deep rounded w-full" />
        <div className="h-3 bg-cream-deep rounded w-5/6" />
        <div className="pt-4 border-t border-border h-12" />
      </div>
    </div>
  );
}
