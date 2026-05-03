import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, MapPin, X, ArrowLeft, Sparkles, ArrowRight } from 'lucide-react';
import { api } from '@/api/client';
import { LogoMark } from '@/components/icons/EasyPoultryLogo';
import { CATEGORY_ICONS, ChickenIcon, EggIcon, FeedIcon, EquipmentIcon } from '@/components/icons/PoultryIcons';
import ListingCard from '@/components/marketplace/ListingCard';
import { ListingSkeleton } from '@/components/shell/SkeletonCard';
import { createPageUrl } from '../utils';

const QUICK_CATEGORIES = [
  { label: 'Chickens',  value: 'chickens',   Icon: ChickenIcon },
  { label: 'Eggs',      value: 'eggs_table', Icon: EggIcon },
  { label: 'Chicks',    value: 'chicks',     Icon: ChickenIcon },
  { label: 'Feed',      value: 'feed',       Icon: FeedIcon },
  { label: 'Equipment', value: 'equipment',  Icon: EquipmentIcon },
];

const SUGGESTIONS = [
  'Boschveld hens',
  'Day-old broiler chicks',
  'Layer feed 50kg',
  'Cabinet incubator 1000 eggs',
  'Indigenous Koekoek',
  'Fertile eggs Eastern Cape',
];

export default function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const inputRef = useRef(null);

  // Auto-focus when the page loads (and re-focus after a search clears)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep input synced if URL changes externally
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setQuery(q);
    setSearchTerm(q);
  }, [searchParams]);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const listings = await api.entities.Listing.filter({ status: 'active' }, '-created_date', 60);
      const term = searchTerm.toLowerCase();
      return listings.filter((l) =>
        l.title?.toLowerCase().includes(term) ||
        l.description?.toLowerCase().includes(term) ||
        l.breed?.toLowerCase().includes(term) ||
        l.category?.toLowerCase().includes(term) ||
        l.city?.toLowerCase().includes(term) ||
        l.province?.toLowerCase().includes(term)
      );
    },
    enabled: !!searchTerm,
  });

  const handleSearch = (e) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearchTerm(q);
    setSearchParams({ q }, { replace: true });
    inputRef.current?.blur();
  };

  const handleQuickPick = (term) => {
    setQuery(term);
    setSearchTerm(term);
    setSearchParams({ q: term }, { replace: true });
  };

  const clearSearch = () => {
    setQuery('');
    setSearchTerm('');
    setSearchParams({}, { replace: true });
    inputRef.current?.focus();
  };

  const isCompact = !!searchTerm;

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      {/* Decorative warmth */}
      <div className="absolute inset-0 -z-10 hero-warm" />
      <div className="absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-moss-200/30 blur-3xl -z-10 animate-float" />
      <div className="absolute -bottom-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-terracotta-100/40 blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }} />

      {/* Top bar — back link only */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to={createPageUrl('Home')}
          className="inline-flex items-center gap-1.5 text-sm text-ink/60 hover:text-moss-700 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Easy Poultry
        </Link>
      </div>

      {/* ============ HERO ============ */}
      <motion.section
        layout
        transition={{ duration: 0.4, ease: [0.2, 0.7, 0.3, 1] }}
        className={`max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 ${isCompact ? 'pt-6 pb-8' : 'pt-20 sm:pt-28 pb-10'}`}
      >
        <motion.div
          layout
          className="flex flex-col items-center text-center"
        >
          <Link to={createPageUrl('Home')} className="group">
            <LogoMark className={isCompact ? 'w-12 h-12' : 'w-20 h-20'} />
          </Link>
          {!isCompact && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              <h1 className="h-display text-4xl sm:text-5xl text-ink mt-6">
                Find your <span className="italic text-moss-700">flock</span>.
              </h1>
              <p className="text-ink/60 mt-3 text-base sm:text-lg">
                Search across thousands of live birds, eggs, feed and equipment.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Search panel — premium, brand-coherent */}
        <motion.form
          layout
          onSubmit={handleSearch}
          className={`mt-${isCompact ? '4' : '8'} card-premium p-2 flex items-center gap-1`}
          style={{ marginTop: isCompact ? '1rem' : '2rem' }}
        >
          <div className="relative flex-1 flex items-center">
            <SearchIcon className="absolute left-4 w-5 h-5 text-ink/40 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Try 'Boschveld hens' or 'broiler feed'…"
              className="w-full pl-12 pr-10 py-3.5 bg-transparent text-base placeholder:text-ink/40 focus:outline-none"
              autoComplete="off"
              spellCheck="false"
            />
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2 w-7 h-7 rounded-full hover:bg-cream-deep flex items-center justify-center transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5 text-ink/50" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!query.trim()}
            className="btn-cta px-5 py-3 text-sm gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <SearchIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </motion.form>

        {/* Quick category chips */}
        <motion.div
          layout
          className="flex items-center justify-center flex-wrap gap-2 mt-5"
        >
          {QUICK_CATEGORIES.map((c, i) => (
            <motion.button
              key={c.value}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i + 0.2 }}
              onClick={() => handleQuickPick(c.label)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/80 backdrop-blur-sm border border-border text-ink/70 hover:border-moss-300 hover:text-moss-700 hover:bg-white transition-all"
            >
              <c.Icon className="w-3.5 h-3.5" />
              {c.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Inspiration row — only when no search */}
        {!isCompact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-12"
          >
            <p className="eyebrow text-center mb-4 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              Trending searches
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleQuickPick(s)}
                  className="link-underline text-sm text-ink/70 hover:text-moss-700 px-1"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* ============ RESULTS ============ */}
      <AnimatePresence>
        {searchTerm && (
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.35 }}
            className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
          >
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-ink/60">
                {isLoading ? (
                  'Searching…'
                ) : (
                  <>
                    <span className="font-semibold text-ink">{results.length}</span>{' '}
                    {results.length === 1 ? 'result' : 'results'} for{' '}
                    <span className="font-medium text-moss-700">"{searchTerm}"</span>
                  </>
                )}
              </p>
              <Link
                to={createPageUrl('Marketplace') + `?search=${encodeURIComponent(searchTerm)}`}
                className="text-sm text-moss-700 hover:underline inline-flex items-center gap-1"
              >
                Open in marketplace
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => <ListingSkeleton key={i} />)}
              </div>
            ) : results.length === 0 ? (
              <div className="card-premium p-10 lg:p-16 text-center">
                <div className="mx-auto w-20 h-20 rounded-2xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700 mb-6">
                  <SearchIcon className="w-9 h-9" strokeWidth={1.5} />
                </div>
                <h3 className="font-display text-2xl text-ink mb-2">No matches for "{searchTerm}"</h3>
                <p className="text-ink/60 max-w-md mx-auto leading-relaxed">
                  Try a broader search, browse by category, or post a wanted-listing in the marketplace.
                </p>
                <div className="mt-7 flex justify-center gap-3">
                  <button
                    onClick={clearSearch}
                    className="btn-ghost px-5 py-2.5 text-sm border border-border"
                  >
                    Clear search
                  </button>
                  <Link to={createPageUrl('Marketplace')}>
                    <button className="btn-cta px-5 py-2.5 text-sm">Browse marketplace</button>
                  </Link>
                </div>
              </div>
            ) : (
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  show: { transition: { staggerChildren: 0.05 } },
                }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {results.map((listing) => (
                  <motion.div
                    key={listing.id}
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show:   { opacity: 1, y: 0 },
                    }}
                  >
                    <ListingCard listing={listing} />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
