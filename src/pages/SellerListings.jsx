import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Loader2, Package, FileText, Star, Eye, Search, X, ArrowRight, BadgeCheck, Store } from 'lucide-react';
import moment from 'moment';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { ReviewSummary } from '../components/reviews/SellerReviews';
import { createPageUrl } from '../utils';

export default function SellerListings() {
  const urlParams = new URLSearchParams(window.location.search);
  const sellerEmail = decodeURIComponent(urlParams.get('email') || '');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  const { data: sellerProfile } = useQuery({
    queryKey: ['seller-profile', sellerEmail],
    queryFn: async () => {
      const profiles = await api.entities.SellerProfile.filter({ user_email: sellerEmail });
      return profiles[0] || null;
    },
    enabled: !!sellerEmail
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['seller-listings', sellerEmail],
    queryFn: async () => {
      const allListings = await api.entities.Listing.filter({ status: 'active' });
      const filtered = allListings.filter(l => l.created_by === sellerEmail);
      return filtered;
    },
    enabled: !!sellerEmail
  });

  const displayName = sellerProfile?.display_name || 'Seller';
  const profilePhoto = sellerProfile?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerProfile?.display_name || 'Seller')}&background=174D35&color=fff`;

  const categories = useMemo(() => [...new Set(listings.map(l => l.category).filter(Boolean))], [listings]);
  const filtered = listings.filter(l =>
    (category === 'all' || l.category === category) &&
    (!search || l.title?.toLowerCase().includes(search.toLowerCase()) || l.breed?.toLowerCase().includes(search.toLowerCase()))
  );
  const totalViews = listings.reduce((s, l) => s + (l.view_count || 0), 0);
  const featuredCount = listings.filter(l => l.featured).length;

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  return (
    <PageShell
      eyebrow="Seller"
      title={<>{displayName}<span className="italic text-moss-700">'s</span> listings.</>}
      subtitle={sellerProfile?.farm_name ? `${sellerProfile.farm_name} · ${listings.length} active ${listings.length === 1 ? 'listing' : 'listings'} on the marketplace.` : `${listings.length} active ${listings.length === 1 ? 'listing' : 'listings'} on the marketplace.`}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Marketplace', href: createPageUrl('Marketplace') }, { label: displayName }]}
      action={
        <Link to={createPageUrl('Marketplace')} className="btn-ghost px-5 py-2.5 text-sm gap-1.5 border border-border bg-white">
          <Store className="w-4 h-4" /> Back to marketplace
        </Link>
      }
    >
      <div className="grid lg:grid-cols-[320px_1fr] gap-8 items-start">
        {/* Profile rail */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card-premium overflow-hidden">
            <div className="h-20 bg-moss-gradient relative"><div className="absolute inset-0 grain opacity-50" /></div>
            <div className="px-6 pb-6 -mt-10">
              <img src={profilePhoto} alt={displayName} className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-soft bg-cream-deep" />
              <div className="flex items-center gap-2 mt-3">
                <h2 className="font-display text-xl text-ink">{displayName}</h2>
                {sellerProfile?.seller_verified && <span className="inline-flex items-center justify-center text-moss-600" title="Verified Seller"><BadgeCheck className="w-5 h-5" /></span>}
              </div>
              {sellerProfile?.farm_name && <p className="text-sm text-ink/60">{sellerProfile.farm_name}</p>}
              {(sellerProfile?.city || sellerProfile?.province) && (
                <p className="flex items-center gap-1.5 text-sm text-ink/55 mt-2"><MapPin className="w-4 h-4" />{[sellerProfile.city, sellerProfile.province].filter(Boolean).join(', ')}</p>
              )}
              <div className="mt-3"><ReviewSummary sellerEmail={sellerEmail} /></div>
              {sellerProfile?.bio && <p className="text-sm text-ink/65 mt-4 leading-relaxed">{sellerProfile.bio}</p>}
              {sellerProfile?.seller_verified && (
                <div className="mt-4 rounded-xl bg-fresh-50 border border-fresh-200 px-3 py-2 text-xs text-moss-800 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-moss-600" /> Verified by Easy Poultry</div>
              )}
              {sellerProfile?.created_date && <p className="text-xs text-ink/45 mt-4">Selling since {moment(sellerProfile.created_date).format('MMMM YYYY')}</p>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[{ l: 'Active', v: listings.length, I: Package }, { l: 'Views', v: totalViews.toLocaleString(), I: Eye }, { l: 'Featured', v: featuredCount, I: Star }].map(({ l, v, I }) => (
              <div key={l} className="card-premium p-3 text-center">
                <I className="w-4 h-4 text-moss-600 mx-auto mb-1" />
                <p className="font-display font-bold text-lg text-ink leading-none">{v}</p>
                <p className="text-[11px] uppercase tracking-wider text-ink/50 mt-1">{l}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Listings */}
        <div className="min-w-0">
          <div className="card-premium p-3 mb-5 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {['all', ...categories].map(c => {
                const on = category === c;
                const n = c === 'all' ? listings.length : listings.filter(l => l.category === c).length;
                return (
                  <button key={c} onClick={() => setCategory(c)}
                    className={`whitespace-nowrap capitalize px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${on ? 'bg-moss-600 text-cream' : 'text-ink/65 hover:bg-moss-50 hover:text-moss-700'}`}>
                    {c === 'all' ? 'All' : c.replace(/_/g, ' ')} <span className={`ml-1 text-xs ${on ? 'text-cream/70' : 'text-ink/40'}`}>{n}</span>
                  </button>
                );
              })}
            </div>
            <div className="relative flex-1 lg:max-w-xs lg:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search this seller…"
                className="w-full bg-cream border border-border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300" />
              {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-cream-deep flex items-center justify-center"><X className="w-3.5 h-3.5 text-ink/50" /></button>}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Package}
              title={listings.length === 0 ? 'No active listings' : `No listings match "${search || category.replace(/_/g, ' ')}"`}
              subtitle={listings.length === 0 ? 'This seller has nothing on the marketplace right now. Check back soon.' : 'Try a different filter or search term.'}
              action={listings.length === 0 && <Link to={createPageUrl('Marketplace')} className="btn-cta px-5 py-2.5 text-sm gap-1.5">Browse marketplace <ArrowRight className="w-4 h-4" /></Link>} />
          ) : (
            <div className="card-premium overflow-hidden">
              <div className="hidden md:grid grid-cols-[1fr_120px_110px_90px_40px] items-center gap-4 px-5 py-3 bg-cream border-b border-border text-[11px] uppercase tracking-wider font-semibold text-ink/50">
                <span>Listing</span><span>Price</span><span>Category</span><span className="text-right">Views</span><span />
              </div>
              <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="divide-y divide-border">
                {filtered.map(listing => <ListingRow key={listing.id} listing={listing} />)}
              </motion.ul>
              <div className="px-5 py-3 bg-cream border-t border-border text-xs text-ink/50">{filtered.length} of {listings.length} listings</div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

function ListingRow({ listing }) {
  const isDigital = listing.listing_type === 'digital' || listing.is_digital;
  const img = listing.images?.[0];
  const href = createPageUrl('ProductDetail') + `?id=${listing.id}`;
  const price = `R${Number(listing.price || 0).toLocaleString()}${listing.price_type === 'batch' ? ' / batch' : ''}`;

  return (
    <motion.li variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
      className="group relative grid grid-cols-[1fr_auto] md:grid-cols-[1fr_120px_110px_90px_40px] items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 hover:bg-cream/70 transition-colors">
      <Link to={href} className="absolute inset-0" aria-label={listing.title} />
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-14 h-14 rounded-xl overflow-hidden bg-cream-deep border border-border flex-shrink-0 flex items-center justify-center text-moss-600">
          {img ? <img src={img} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" /> : isDigital ? <FileText className="w-6 h-6" /> : <Package className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-ink group-hover:text-moss-700 line-clamp-1 transition-colors">{listing.title}</p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-ink/55">
            {listing.breed && <span className="capitalize">{listing.breed}</span>}
            {listing.location && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{listing.location}</span>}
            {isDigital && <span className="chip chip-accent !py-0 !px-2 text-[10px]">Digital</span>}
            {listing.stock_quantity > 1 && <span className="chip !py-0 !px-2 text-[10px]">Stock {listing.stock_quantity}</span>}
            {listing.featured && <span className="chip chip-yolk !py-0 !px-2 text-[10px] gap-1"><Star className="w-2.5 h-2.5 fill-current" />Featured</span>}
            <span className="md:hidden capitalize">· {(listing.category || '').replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>

      <span className="font-display font-bold text-ink tabular-nums text-right md:text-left">{price}</span>
      <span className="hidden md:inline-flex capitalize items-center w-fit px-2.5 py-1 rounded-full border text-[11px] font-medium bg-cream-deep text-ink/60 border-border">{(listing.category || '—').replace(/_/g, ' ')}</span>
      <span className="hidden md:inline-flex items-center justify-end gap-1 text-sm text-ink/70 tabular-nums"><Eye className="w-3.5 h-3.5 text-ink/40" />{listing.view_count || 0}</span>
      <span className="hidden md:flex items-center justify-end text-ink/40 group-hover:text-moss-700 transition-colors"><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" /></span>
    </motion.li>
  );
}
