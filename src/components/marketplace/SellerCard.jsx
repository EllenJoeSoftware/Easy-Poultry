import React, { useState } from 'react';
import { MapPin, Phone, MessageCircle, Mail, Clock, ChevronRight, Star, BadgeCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function SellerCard({ seller, onContact, isLoading }) {
  const [showPhone, setShowPhone] = useState(false);
  const profilePhoto = seller?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.full_name || 'Seller')}&background=174D35&color=fff`;

  if (isLoading) {
    return (
      <div className="card-premium p-6">
        <div className="flex items-center gap-4 animate-pulse">
          <div className="w-16 h-16 rounded-full bg-cream-deep" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded bg-cream-deep" />
            <div className="h-3 w-1/2 rounded bg-cream-deep" />
          </div>
        </div>
      </div>
    );
  }

  const handleWhatsApp = () => {
    const number = seller?.whatsapp_number || seller?.contact_number;
    if (number) {
      window.open(`https://wa.me/${number.replace(/\D/g, '')}`, '_blank');
    }
  };

  const handleCall = () => {
    if (seller?.contact_number) {
      setShowPhone(true);
    }
  };

  const rating = Number(seller?.rating || seller?.average_rating || 0);
  const reviewCount = seller?.review_count || seller?.total_reviews || 0;

  return (
    <div className="card-premium p-6 sticky top-28">
      <p className="eyebrow mb-3">Seller</p>
      <Link to={createPageUrl('SellerListings') + `?email=${encodeURIComponent(seller?.email)}`} className="block">
        <div className="flex items-start gap-4 mb-5 group cursor-pointer">
          <div className="relative flex-shrink-0">
            <img
              src={profilePhoto}
              alt={seller?.full_name}
              className="w-16 h-16 rounded-full object-cover ring-2 ring-cream-deep"
            />
            {seller?.seller_verified && (
              <span
                className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-white flex items-center justify-center"
                title="Verified Seller"
              >
                <BadgeCheck className="w-5 h-5 text-moss-600 fill-fresh-100" />
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-display text-lg text-ink truncate group-hover:text-moss-700 transition-colors">{seller?.full_name}</h3>
              <ChevronRight className="w-4 h-4 text-ink/40 group-hover:text-moss-600 transition-colors flex-shrink-0" />
            </div>
            {seller?.farm_name && (
              <p className="text-sm text-ink/60 truncate">{seller.farm_name}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {rating > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs text-ink/70">
                  <Star className="w-3.5 h-3.5 text-yolk-500 fill-yolk-500" />
                  <span className="font-semibold text-ink">{rating.toFixed(1)}</span>
                  {reviewCount > 0 && <span className="text-ink/45">({reviewCount})</span>}
                </span>
              ) : (
                <span className="text-xs text-ink/45">No ratings yet</span>
              )}
              {seller?.seller_verified && (
                <span className="chip text-[10px] !py-0.5 bg-fresh-50 text-moss-700 border-fresh-200">Verified</span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {seller?.seller_description && (
        <p className="text-sm text-ink/65 mb-5 leading-relaxed">
          {seller.seller_description}
        </p>
      )}

      <div className="space-y-2.5 mb-5 text-sm">
        {(seller?.city || seller?.province) && (
          <div className="flex items-start gap-3 text-ink/65">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-moss-600" />
            <span>
              {seller.exact_location && `${seller.exact_location}, `}
              {[seller.city, seller.province].filter(Boolean).join(', ')}
            </span>
          </div>
        )}

        {seller?.business_hours && (
          <div className="flex items-start gap-3 text-ink/65">
            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0 text-moss-600" />
            <span>{seller.business_hours}</span>
          </div>
        )}

        {seller?.bio && (
          <p className="text-ink/65 leading-relaxed">
            {seller.bio}
          </p>
        )}
      </div>

      {seller?.seller_verified ? (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleWhatsApp}
            className="w-full h-11 rounded-full bg-moss-700 hover:bg-moss-800 text-cream text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!seller?.whatsapp_number && !seller?.contact_number}
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Seller
          </button>

          <div className="grid grid-cols-2 gap-2">
            {showPhone && seller?.contact_number ? (
              <a
                href={`tel:${seller.contact_number}`}
                className="flex items-center justify-center h-11 rounded-full border border-border bg-cream font-medium text-ink text-sm"
              >
                {seller.contact_number}
              </a>
            ) : (
              <button
                type="button"
                onClick={handleCall}
                className="h-11 rounded-full border border-border bg-white hover:bg-cream-deep text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!seller?.contact_number}
              >
                <Phone className="w-4 h-4" />
                Call
              </button>
            )}
            <button
              type="button"
              onClick={onContact}
              className="h-11 rounded-full border border-border bg-white hover:bg-cream-deep text-ink text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Inquire
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-cream border border-border text-center">
            <p className="text-xs text-ink/60">Contact seller through inquiry to exchange numbers</p>
          </div>
          <button
            type="button"
            onClick={onContact}
            className="btn-cta w-full h-11 text-sm inline-flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send Inquiry
          </button>
        </div>
      )}
    </div>
  );
}
