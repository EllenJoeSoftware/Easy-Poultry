import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Heart, ShoppingCart, Share2, Check, Download, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { api } from '@/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * ListingCard
 * Uses the "stretched link" pattern — a single absolutely-positioned <Link>
 * covers the card body, and action buttons sit above it with a higher z-index.
 * This avoids nested <a> elements while keeping the entire card clickable.
 */
export default function ListingCard({
  listing,
  showSellerContact = false,
  sellerProfile = null,
  shopUrl = null,
}) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const primaryImage =
    listing.images?.[0] ||
    'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=600';

  useEffect(() => {
    let active = true;
    api.auth
      .me()
      .then((u) => active && setUser(u))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const { data: savedListings = [] } = useQuery({
    queryKey: ['saved-listings-check', user?.email],
    queryFn: () => api.entities.SavedListing.filter({ created_by: user?.email }),
    enabled: !!user,
  });

  const isSaved = savedListings.some((s) => s.listing_id === listing.id);

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        const saved = savedListings.find((s) => s.listing_id === listing.id);
        if (saved) await api.entities.SavedListing.delete(saved.id);
      } else {
        await api.entities.SavedListing.create({ listing_id: listing.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-listings-check']);
      queryClient.invalidateQueries(['saved-listings']);
      toast.success(isSaved ? 'Removed from saved' : 'Saved to your list');
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to save listings');
      return;
    }
    toggleSaveMutation.mutate();
  };

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(createPageUrl('ProductDetail') + `?id=${listing.id}&contact=true`);
  };

  const stop = (e) => e.stopPropagation();

  const detailUrl = createPageUrl('ProductDetail') + `?id=${listing.id}`;

  const categoryLabels = {
    chickens: 'Chickens', ducks: 'Ducks', geese: 'Geese', turkeys: 'Turkeys',
    quail: 'Quail', guinea_fowl: 'Guinea fowl', peafowl: 'Peafowl',
    pigeons: 'Pigeons', eggs_table: 'Table eggs', eggs_fertile: 'Fertile eggs',
    chicks: 'Chicks', growers: 'Growers', layers: 'Layers',
    broilers: 'Broilers', feed: 'Feed', supplements: 'Supplements',
    incubators: 'Incubators', equipment: 'Equipment', other: 'Other',
  };

  const formatPrice = (n) => {
    if (n == null) return '—';
    return new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(n);
  };

  return (
    <article className="group card-premium relative overflow-hidden flex flex-col">
      {/* Stretched link — sits above the card body, below interactive elements */}
      <Link
        to={detailUrl}
        aria-label={listing.title}
        className="absolute inset-0 z-10"
      />

      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-cream-deep">
        <img
          src={primaryImage}
          alt={listing.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Top row: category + digital + featured badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
          {listing.product_type === 'digital' && (
            <Badge className="bg-terracotta-400 text-white border-0 shadow-sm font-medium gap-1">
              <FileText className="w-3 h-3" />
              Digital
            </Badge>
          )}
          <Badge className="bg-white/95 text-ink backdrop-blur-sm border-0 shadow-sm font-medium">
            {categoryLabels[listing.category] || listing.category}
          </Badge>
          {listing.featured && (
            <Badge className="bg-yolk-300 text-ink border-0 shadow-sm font-semibold">
              ★ Featured
            </Badge>
          )}
        </div>

        {/* Save button (above stretched link) */}
        <button
          onClick={handleSave}
          onMouseDown={stop}
          disabled={toggleSaveMutation.isPending}
          className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-soft"
          aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
          type="button"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isSaved ? 'fill-terracotta-400 text-terracotta-400' : 'text-ink/60'
            }`}
          />
        </button>

        {/* Bottom-left: view count chip */}
        {listing.view_count > 0 && (
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink/60 backdrop-blur-sm text-cream text-xs font-medium">
            <Eye className="w-3 h-3" />
            {listing.view_count}
          </div>
        )}

        {/* Bottom-right: share + buy now */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={stop}>
              <button
                type="button"
                onMouseDown={stop}
                className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white hover:scale-110 shadow-soft flex items-center justify-center transition-all"
                aria-label="Share"
              >
                <Share2 className="w-4 h-4 text-ink/70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              onClick={stop}
              className="rounded-xl"
            >
              <DropdownMenuItem
                onClick={() => {
                  const url = shopUrl
                    ? `${window.location.origin}${shopUrl}`
                    : `${window.location.origin}${detailUrl}`;
                  const text = shopUrl
                    ? 'Check out my shop on Easy Poultry!'
                    : `Check out this listing: ${listing.title} — R${formatPrice(listing.price)}`;
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
                    '_blank'
                  );
                }}
              >
                Share to WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = shopUrl
                    ? `${window.location.origin}${shopUrl}`
                    : `${window.location.origin}${detailUrl}`;
                  const subject = shopUrl
                    ? 'My Easy Poultry shop'
                    : `Easy Poultry: ${listing.title}`;
                  const body = shopUrl
                    ? `Visit my shop on Easy Poultry:\n\n${url}`
                    : `I found this listing on Easy Poultry:\n\n${listing.title}\nPrice: R${formatPrice(listing.price)}\n\n${url}`;
                  window.open(
                    `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                    '_blank'
                  );
                }}
              >
                Email
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const url = shopUrl
                    ? `${window.location.origin}${shopUrl}`
                    : `${window.location.origin}${detailUrl}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied');
                }}
              >
                Copy link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {showSellerContact && sellerProfile?.contact_number ? (
            <button
              type="button"
              onClick={stop}
              onMouseDown={stop}
              className="btn-accent px-4 py-2 text-sm gap-1.5 cursor-default"
            >
              <ShoppingCart className="w-4 h-4" />
              {sellerProfile.contact_number}
            </button>
          ) : listing.product_type === 'digital' ? (
            <button
              type="button"
              onClick={handleBuyNow}
              onMouseDown={stop}
              className="btn-accent px-4 py-2 text-sm gap-1.5"
            >
              <Download className="w-4 h-4" />
              Get download
            </button>
          ) : (
            <button
              type="button"
              onClick={handleBuyNow}
              onMouseDown={stop}
              className="btn-accent px-4 py-2 text-sm gap-1.5"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy now
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display text-lg leading-snug text-ink mb-1 line-clamp-2 group-hover:text-moss-700 transition-colors">
          {listing.title}
        </h3>

        {listing.breed && (
          <p className="text-sm text-ink/60 mb-3">{listing.breed}</p>
        )}

        <div className="flex items-center gap-2 text-xs text-ink/50 mb-4">
          {listing.product_type === 'digital' ? (
            <>
              <FileText className="w-3.5 h-3.5 text-terracotta-500" />
              <span className="truncate">
                Instant download · {((listing.digital_file_type || '').split('/')[1] || 'file').toUpperCase()}
              </span>
            </>
          ) : (
            <>
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">
                {listing.city}{listing.city && listing.province && ', '}{listing.province}
              </span>
              {listing.age && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{listing.age}</span>
                </>
              )}
            </>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-border flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-2xl font-bold text-ink leading-none">
                R{formatPrice(listing.price)}
              </span>
              {listing.product_type === 'digital' ? (
                <span className="text-xs text-ink/40">/download</span>
              ) : (
                <>
                  {listing.price_type === 'batch' && listing.stock_quantity > 1 && (
                    <span className="text-xs text-ink/40">/batch</span>
                  )}
                  {listing.price_type === 'per_item' && (
                    <span className="text-xs text-ink/40">/each</span>
                  )}
                </>
              )}
            </div>
            {listing.product_type === 'digital' ? (
              <span className="text-xs text-terracotta-600 mt-1 inline-flex items-center gap-1">
                <Download className="w-3 h-3" />
                Instant access
              </span>
            ) : (
              listing.stock_quantity > 0 && (
                <span className="text-xs text-moss-600 mt-1 inline-flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  {listing.stock_quantity} available
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
