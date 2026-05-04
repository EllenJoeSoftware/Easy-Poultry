import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin, Loader2, Phone, MessageCircle, Clock, ShieldCheck,
  Package, Star, ArrowLeft, ExternalLink,
} from 'lucide-react';
import { api } from '@/api/client';
import { createPageUrl } from '../utils';
import ListingCard from '../components/marketplace/ListingCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/shell/EmptyState';
import { ListingSkeleton } from '@/components/shell/SkeletonCard';
import { LogoMark } from '@/components/icons/EasyPoultryLogo';

export default function SellerShop() {
  const [searchParams] = useSearchParams();
  const subdomain = searchParams.get('shop');

  const { data: sellerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['seller-profile-subdomain', subdomain],
    queryFn: async () => {
      const profiles = await api.entities.SellerProfile.filter({ subdomain });
      return profiles[0] || null;
    },
    enabled: !!subdomain,
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['seller-shop-listings', sellerProfile?.user_email],
    queryFn: () => api.entities.Listing.filter({
      status: 'active',
      created_by: sellerProfile.user_email,
    }),
    enabled: !!sellerProfile?.user_email,
  });

  // ---- Resolve the business name with sensible fallbacks ----
  const businessName =
    sellerProfile?.business_name ||
    sellerProfile?.farm_name ||
    sellerProfile?.shop_name ||
    sellerProfile?.display_name ||
    'Shop';

  const ownerName = sellerProfile?.display_name;

  // ---- Update browser tab title to match the configured business name ----
  useEffect(() => {
    if (!businessName) return;
    const previous = document.title;
    document.title = `${businessName} · Easy Poultry`;
    return () => { document.title = previous; };
  }, [businessName]);

  const profilePhoto =
    sellerProfile?.profile_photo_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(businessName)}&background=3A5A40&color=FAF7F2&bold=true&size=256`;

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LogoMark className="w-12 h-12" />
          <Loader2 className="w-5 h-5 animate-spin text-moss-600" />
        </div>
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4">
        <EmptyState
          icon={Package}
          title="Shop not found"
          subtitle="This shop doesn't exist, has been removed, or the link is incorrect."
          action={
            <Link to={createPageUrl('Marketplace')}>
              <Button className="btn-cta px-5 py-2.5 text-sm">Browse marketplace</Button>
            </Link>
          }
          className="max-w-md"
        />
      </div>
    );
  }

  const totalSales = listings.reduce((sum, l) => sum + (l.sold_quantity || 0), 0);
  const memberSinceYear = sellerProfile.created_date
    ? new Date(sellerProfile.created_date).getFullYear()
    : null;

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* ============ COVER + HERO ============ */}
      <section className="relative overflow-hidden">
        {/* Cover band */}
        <div className="h-48 sm:h-56 lg:h-64 bg-moss-gradient relative overflow-hidden">
          <div className="absolute inset-0 grain pointer-events-none opacity-50" />
          {sellerProfile.cover_image_url && (
            <img
              src={sellerProfile.cover_image_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent" />
          {/* Back link */}
          <div className="absolute top-4 left-4 right-4 max-w-7xl mx-auto">
            <Link
              to={createPageUrl('Marketplace')}
              className="inline-flex items-center gap-1.5 text-xs text-cream/80 hover:text-cream backdrop-blur-sm bg-ink/20 hover:bg-ink/30 px-3 py-1.5 rounded-full transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              Marketplace
            </Link>
          </div>
        </div>

        {/* Identity block — banner is the visual; title lives on cream below */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="pt-8 pb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
          >
            {/* Identity text */}
            <div className="max-w-3xl flex-1 min-w-0">
              <p className="eyebrow mb-2">Easy Poultry shop</p>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-none">
                  {businessName}
                </h1>
                {sellerProfile.seller_verified && (
                  <Badge className="bg-moss-50 text-moss-700 hover:bg-moss-50 gap-1 border border-moss-100">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified
                  </Badge>
                )}
              </div>
              {ownerName && ownerName !== businessName && (
                <p className="mt-2 text-sm text-ink/65">
                  Run by <span className="font-medium text-ink">{ownerName}</span>
                </p>
              )}
              {(sellerProfile.city || sellerProfile.province) && (
                <p className="mt-1 text-sm text-ink/55 inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {[sellerProfile.city, sellerProfile.province].filter(Boolean).join(', ')}
                </p>
              )}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 flex-shrink-0">
              {sellerProfile.whatsapp_number && (
                <a
                  href={`https://wa.me/${sellerProfile.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#25D366] hover:bg-[#20BD5C] text-white text-sm font-medium shadow-soft transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
              {sellerProfile.contact_number && (
                <a
                  href={`tel:${sellerProfile.contact_number}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-cream-deep text-ink border border-border text-sm font-medium shadow-soft transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span className="hidden sm:inline">Call</span>
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============ TWO-COL: PRODUCTS + ABOUT ============ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* ---- Products (left, 2 cols) ---- */}
          <div className="lg:col-span-2">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="eyebrow mb-2">From {businessName}</p>
                <h2 className="font-display text-3xl text-ink">Products</h2>
              </div>
              <span className="text-sm text-ink/50">
                {listingsLoading
                  ? 'Loading…'
                  : <><span className="font-semibold text-ink">{listings.length}</span> {listings.length === 1 ? 'listing' : 'listings'}</>}
              </span>
            </div>

            {listingsLoading ? (
              <div className="grid sm:grid-cols-2 gap-5">
                {[...Array(4)].map((_, i) => <ListingSkeleton key={i} />)}
              </div>
            ) : listings.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No products available right now"
                subtitle={`${businessName} doesn't have any active listings at the moment. Check back soon or message them directly.`}
                action={
                  sellerProfile.whatsapp_number && (
                    <a
                      href={`https://wa.me/${sellerProfile.whatsapp_number.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5">
                        <MessageCircle className="w-4 h-4" />
                        Message on WhatsApp
                      </Button>
                    </a>
                  )
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-5">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    showSellerContact={true}
                    sellerProfile={sellerProfile}
                    shopUrl={createPageUrl('SellerShop') + `?shop=${subdomain}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ---- About (right, sticky) ---- */}
          <aside className="lg:sticky lg:top-8 self-start">
            <div className="card-premium p-6">
              <h3 className="font-display text-xl text-ink mb-4">About {businessName}</h3>

              {sellerProfile.bio ? (
                <p className="text-sm text-ink/70 leading-relaxed mb-6">{sellerProfile.bio}</p>
              ) : (
                <p className="text-sm text-ink/40 italic mb-6">No bio set yet.</p>
              )}

              {/* Stats strip */}
              <div className="grid grid-cols-3 gap-3 py-4 border-y border-border">
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-ink">{listings.length}</p>
                  <p className="text-[10px] uppercase tracking-wider text-ink/50 mt-1">Live</p>
                </div>
                <div className="text-center border-x border-border">
                  <p className="font-display text-2xl font-bold text-ink">{totalSales}</p>
                  <p className="text-[10px] uppercase tracking-wider text-ink/50 mt-1">Sold</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-2xl font-bold text-ink">
                    {memberSinceYear || '—'}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-ink/50 mt-1">Since</p>
                </div>
              </div>

              {/* Contact details */}
              <div className="mt-5 space-y-3">
                <h4 className="eyebrow">Contact</h4>

                {(sellerProfile.city || sellerProfile.province) && (
                  <div className="flex items-start gap-3 text-sm text-ink/70">
                    <MapPin className="w-4 h-4 text-moss-600 mt-0.5 flex-shrink-0" />
                    <span>{[sellerProfile.city, sellerProfile.province].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                {sellerProfile.contact_number && (
                  <a
                    href={`tel:${sellerProfile.contact_number}`}
                    className="flex items-start gap-3 text-sm text-ink/70 hover:text-moss-700 transition-colors"
                  >
                    <Phone className="w-4 h-4 text-moss-600 mt-0.5 flex-shrink-0" />
                    <span>{sellerProfile.contact_number}</span>
                  </a>
                )}

                {sellerProfile.whatsapp_number && (
                  <a
                    href={`https://wa.me/${sellerProfile.whatsapp_number.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 text-sm text-ink/70 hover:text-moss-700 transition-colors group"
                  >
                    <MessageCircle className="w-4 h-4 text-moss-600 mt-0.5 flex-shrink-0" />
                    <span className="inline-flex items-center gap-1">
                      {sellerProfile.whatsapp_number}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </span>
                  </a>
                )}

                {sellerProfile.business_hours && (
                  <div className="flex items-start gap-3 text-sm text-ink/70">
                    <Clock className="w-4 h-4 text-moss-600 mt-0.5 flex-shrink-0" />
                    <span>{sellerProfile.business_hours}</span>
                  </div>
                )}
              </div>

              {/* Shop URL */}
              {subdomain && (
                <div className="mt-6 pt-5 border-t border-border">
                  <p className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold mb-2">Shop URL</p>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(`${window.location.origin}${createPageUrl('SellerShop')}?shop=${subdomain}`);
                    }}
                    className="text-xs text-moss-700 break-all link-underline"
                  >
                    {window.location.host}{createPageUrl('SellerShop')}?shop={subdomain}
                  </button>
                </div>
              )}
            </div>

            {/* Trust badge */}
            {sellerProfile.seller_verified && (
              <div className="mt-4 card-premium p-5 bg-moss-50/50 border-moss-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-moss-600 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-cream" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Verified seller</p>
                    <p className="text-xs text-ink/55">Identity & address confirmed by Easy Poultry</p>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
