import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { ArrowLeft, MapPin, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ListingCard from '../components/marketplace/ListingCard';

export default function SellerListings() {
  const urlParams = new URLSearchParams(window.location.search);
  const sellerEmail = decodeURIComponent(urlParams.get('email') || '');

  console.log('SellerListings - email param:', sellerEmail);

  const { data: sellerProfile } = useQuery({
    queryKey: ['seller-profile', sellerEmail],
    queryFn: async () => {
      console.log('Fetching seller profile for:', sellerEmail);
      const profiles = await api.entities.SellerProfile.filter({ user_email: sellerEmail });
      console.log('Found profiles:', profiles);
      return profiles[0] || null;
    },
    enabled: !!sellerEmail
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['seller-listings', sellerEmail],
    queryFn: async () => {
      console.log('Fetching listings for:', sellerEmail);
      const allListings = await api.entities.Listing.filter({ status: 'active' });
      console.log('All active listings:', allListings);
      const filtered = allListings.filter(l => l.created_by === sellerEmail);
      console.log('Filtered listings:', filtered);
      return filtered;
    },
    enabled: !!sellerEmail
  });

  const profilePhoto = sellerProfile?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerProfile?.display_name || 'Seller')}&background=7A9D7A&color=fff`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to={createPageUrl('Marketplace')} className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Marketplace
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {sellerProfile && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-6">
              <img
                src={profilePhoto}
                alt={sellerProfile.display_name}
                className="w-24 h-24 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold text-gray-900">{sellerProfile.display_name}</h1>
                  {sellerProfile.seller_verified && (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center" title="Verified Seller">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {sellerProfile.farm_name && (
                  <p className="text-gray-600 mb-2">{sellerProfile.farm_name}</p>
                )}
                {(sellerProfile.city || sellerProfile.province) && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4" />
                    <span>{[sellerProfile.city, sellerProfile.province].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                {sellerProfile.bio && (
                  <p className="text-sm text-gray-600 mt-3">{sellerProfile.bio}</p>
                )}
              </div>
            </div>
          </div>
        )}

        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {listings.length} {listings.length === 1 ? 'Listing' : 'Listings'}
        </h2>

        {listings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-gray-600">This seller has no active listings</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}