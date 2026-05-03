import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, X, Star, MapPin, ArrowDownAZ, Flame, Plus,
} from 'lucide-react';
import { api } from '@/api/client';
import ListingCard from '../components/marketplace/ListingCard';
import FilterPanel from '../components/marketplace/FilterPanel';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import PageShell, { Section } from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { ListingSkeleton } from '@/components/shell/SkeletonCard';
import { CATEGORY_ICONS } from '@/components/icons/PoultryIcons';
import { createPageUrl } from '../utils';

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first',     icon: Flame },
  { value: 'oldest',     label: 'Oldest first',     icon: ArrowDownAZ },
  { value: 'price_asc',  label: 'Price: low → high', icon: ArrowDownAZ },
  { value: 'price_desc', label: 'Price: high → low', icon: ArrowDownAZ },
];

const CATEGORY_PILLS = [
  { value: '',           label: 'All' },
  { value: 'chickens',   label: 'Chickens' },
  { value: 'ducks',      label: 'Ducks' },
  { value: 'turkeys',    label: 'Turkeys' },
  { value: 'quail',      label: 'Quail' },
  { value: 'eggs_table', label: 'Eggs' },
  { value: 'chicks',     label: 'Chicks' },
  { value: 'feed',       label: 'Feed' },
  { value: 'equipment',  label: 'Equipment' },
];

export default function Marketplace() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: '',
    maxPrice: '',
    province: '',
    city: '',
  });

  // Sync search & category back into the URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchQuery) next.set('search', searchQuery); else next.delete('search');
    if (filters.category) next.set('category', filters.category); else next.delete('category');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters.category]);

  const { data: rawListings = [], isLoading } = useQuery({
    queryKey: ['marketplace', filters.category],
    queryFn: () => api.entities.Listing.filter({ status: 'active' }),
    staleTime: 60_000,
  });

  const listings = useMemo(() => {
    let l = rawListings.filter((listing) => {
      const matchesSearch =
        !searchQuery ||
        listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !filters.category || listing.category === filters.category;
      const matchesMinPrice = !filters.minPrice || listing.price >= parseFloat(filters.minPrice);
      const matchesMaxPrice = !filters.maxPrice || listing.price <= parseFloat(filters.maxPrice);
      const matchesProvince =
        !filters.province ||
        listing.province?.toLowerCase().includes(filters.province.toLowerCase());
      const matchesCity =
        !filters.city || listing.city?.toLowerCase().includes(filters.city.toLowerCase());
      return matchesSearch && matchesCategory && matchesMinPrice && matchesMaxPrice && matchesProvince && matchesCity;
    });

    // Sort
    l = [...l];
    switch (sortBy) {
      case 'price_asc':  l.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price_desc': l.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'oldest':     l.sort((a, b) => new Date(a.created_date) - new Date(b.created_date)); break;
      default:           l.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    }
    // featured first within sort group
    l.sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    return l;
  }, [rawListings, searchQuery, filters, sortBy]);

  const featured = listings.filter((l) => l.featured);
  const standard = listings.filter((l) => !l.featured);

  const activeFilterCount =
    Object.values(filters).filter((v) => v && v !== '').length +
    (searchQuery ? 1 : 0);

  const clearAll = () => {
    setSearchQuery('');
    setFilters({ category: '', minPrice: '', maxPrice: '', province: '', city: '' });
  };

  const sortLabel = SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Sort';

  return (
    <PageShell
      eyebrow="Marketplace"
      title={
        filters.category
          ? CATEGORY_PILLS.find((c) => c.value === filters.category)?.label || 'Browse'
          : 'Browse the marketplace'
      }
      subtitle="Live birds, eggs, feed and equipment from verified breeders across South Africa."
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Marketplace' }]}
      action={
        <Button
          onClick={() => navigate(createPageUrl('CreateListing'))}
          className="btn-cta px-5 py-2.5 text-sm gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Sell something
        </Button>
      }
    >
      {/* ============ Search panel — flows from the hero ============ */}
      <div className="card-premium p-2 -mt-6 lg:-mt-10 mb-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-stretch gap-2 p-1.5">
          {/* Search */}
          <div className="relative flex-1 flex items-center md:border-r md:border-border md:pr-3 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40 pointer-events-none transition-colors group-focus-within:text-moss-700" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search listings, breeds, sellers…"
              className="w-full bg-transparent pl-11 pr-10 py-3 text-base placeholder:text-ink/40 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-cream-deep flex items-center justify-center transition-colors"
                aria-label="Clear search"
                type="button"
              >
                <X className="w-3.5 h-3.5 text-ink/50" />
              </button>
            )}
          </div>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-ink/70 hover:bg-moss-50 hover:text-moss-700 transition-colors md:border-r md:border-border md:rounded-none"
              >
                <ArrowDownAZ className="w-4 h-4" />
                <span className="hidden sm:inline">{sortLabel}</span>
                <span className="sm:hidden">Sort</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl">
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => setSortBy(opt.value)}
                  className={sortBy === opt.value ? 'bg-moss-50 text-moss-700 font-medium' : ''}
                >
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile filters */}
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="lg:hidden flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl text-sm font-medium text-ink/70 hover:bg-moss-50 hover:text-moss-700 transition-colors"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-terracotta-400 text-white text-[10px] font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto p-6 bg-cream w-full sm:max-w-sm">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onClear={clearAll}
                onClose={() => setShowMobileFilters(false)}
              />
            </SheetContent>
          </Sheet>

          {/* Search action */}
          <button
            type="button"
            className="btn-cta px-5 py-3 text-sm gap-1.5 hidden md:inline-flex"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* ============ Category pills — chip rail ============ */}
      <div className="mb-8 -mx-4 sm:mx-0 px-4 sm:px-0 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2 min-w-max sm:min-w-0 sm:flex-wrap">
          {CATEGORY_PILLS.map((c) => {
            const Icon = c.value ? CATEGORY_ICONS[c.value] : null;
            const active = filters.category === c.value;
            return (
              <button
                key={c.value || 'all'}
                onClick={() => setFilters((f) => ({ ...f, category: c.value }))}
                className={`group flex items-center gap-2 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  active
                    ? 'bg-moss-700 text-cream border-moss-700 shadow-soft'
                    : 'bg-white text-ink/70 border-border hover:border-moss-300 hover:text-moss-700 hover:bg-moss-50'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active filter pills (above results) */}
      {activeFilterCount > 0 && (
        <div className="flex items-center flex-wrap gap-2 mb-6 text-sm">
          <span className="text-ink/50">Active:</span>
          {searchQuery && (
            <FilterChip onRemove={() => setSearchQuery('')}>
              "{searchQuery}"
            </FilterChip>
          )}
          {filters.category && (
            <FilterChip onRemove={() => setFilters((f) => ({ ...f, category: '' }))}>
              {CATEGORY_PILLS.find((c) => c.value === filters.category)?.label}
            </FilterChip>
          )}
          {filters.minPrice && (
            <FilterChip onRemove={() => setFilters((f) => ({ ...f, minPrice: '' }))}>
              ≥ R{filters.minPrice}
            </FilterChip>
          )}
          {filters.maxPrice && (
            <FilterChip onRemove={() => setFilters((f) => ({ ...f, maxPrice: '' }))}>
              ≤ R{filters.maxPrice}
            </FilterChip>
          )}
          {filters.province && (
            <FilterChip onRemove={() => setFilters((f) => ({ ...f, province: '' }))}>
              <MapPin className="w-3 h-3" />
              {filters.province}
            </FilterChip>
          )}
          {filters.city && (
            <FilterChip onRemove={() => setFilters((f) => ({ ...f, city: '' }))}>
              <MapPin className="w-3 h-3" />
              {filters.city}
            </FilterChip>
          )}
          <button
            onClick={clearAll}
            className="text-xs text-terracotta-600 hover:underline ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden lg:block w-72 flex-shrink-0">
          <div className="sticky top-44">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClear={clearAll}
            />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Result meta */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-ink/60">
              {isLoading ? 'Loading…' : (
                <>
                  <span className="font-semibold text-ink">{listings.length}</span>{' '}
                  {listings.length === 1 ? 'listing' : 'listings'}
                </>
              )}
            </p>
          </div>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <ListingSkeleton key={i} />)}
            </div>
          ) : listings.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No listings match"
              subtitle="Try removing a filter, broadening your search, or browsing a different category."
              action={
                <Button onClick={clearAll} className="btn-cta px-5 py-2.5 text-sm">
                  Clear filters
                </Button>
              }
            />
          ) : (
            <>
              {featured.length > 0 && (
                <Section
                  eyebrow="Promoted"
                  title="Featured listings"
                  className="mb-12"
                >
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {featured.map((l) => (
                      <div key={l.id} className="relative">
                        <div className="absolute -top-2.5 left-4 z-30 inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-yolk-300 text-ink text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          <Star className="w-3 h-3 fill-ink" />
                          Featured
                        </div>
                        <ListingCard listing={l} />
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {standard.length > 0 && (
                <Section
                  title={featured.length > 0 ? 'All listings' : null}
                >
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {standard.map((l) => <ListingCard key={l.id} listing={l} />)}
                  </div>
                </Section>
              )}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function FilterChip({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-moss-50 text-moss-700 border border-moss-100 text-xs">
      {children}
      <button
        onClick={onRemove}
        className="w-5 h-5 rounded-full hover:bg-moss-100 flex items-center justify-center"
        aria-label="Remove filter"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}
