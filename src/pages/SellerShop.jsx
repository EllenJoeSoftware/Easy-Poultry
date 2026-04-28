import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { MapPin, Loader2, Phone, MessageCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import ListingCard from '../components/marketplace/ListingCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function SellerShop() {
  const urlParams = new URLSearchParams(window.location.search);
  const subdomain = urlParams.get('shop');

  const { data: sellerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['seller-profile-subdomain', subdomain],
    queryFn: async () => {
      const profiles = await api.entities.SellerProfile.filter({ subdomain: subdomain });
      return profiles[0] || null;
    },
    enabled: !!subdomain
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['seller-shop-listings', sellerProfile?.user_email],
    queryFn: async () => {
      return await api.entities.Listing.filter({ 
        status: 'active',
        created_by: sellerProfile.user_email 
      });
    },
    enabled: !!sellerProfile?.user_email
  });

  const profilePhoto = sellerProfile?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerProfile?.display_name || 'Shop')}&background=7A9D7A&color=fff`;

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  if (!sellerProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Shop Not Found</h1>
          <p className="text-gray-600 mb-4">This shop doesn't exist or has been removed.</p>
          <Link to={createPageUrl('Marketplace')}>
            <Button className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">Browse Marketplace</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shop Header */}
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">{sellerProfile.display_name}'s Shop</h1>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Products Column (Left - Larger) */}
          <div className="flex-1 lg:w-2/3">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Products ({listings.length})
            </h2>

            {listingsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl">
                <p className="text-gray-600">This shop has no products available at the moment</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-6">
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

          {/* Profile Column (Right - Smaller) */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24">
              <div className="text-center mb-6">
                <img
                  src={profilePhoto}
                  alt={sellerProfile.display_name}
                  className="w-32 h-32 rounded-full object-cover border-4 border-[#7A9D7A] shadow-lg mx-auto mb-4"
                />
                <div className="flex items-center gap-2 justify-center mb-2">
                  <h3 className="text-2xl font-bold text-gray-900">{sellerProfile.display_name}</h3>
                  {sellerProfile.seller_verified && (
                    <Badge className="bg-blue-500 text-white">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified
                    </Badge>
                  )}
                </div>
                {sellerProfile.farm_name && (
                  <p className="text-lg text-gray-700 font-medium mb-3">{sellerProfile.farm_name}</p>
                )}
              </div>

              {sellerProfile.bio && (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">About</h4>
                  <p className="text-sm text-gray-600">{sellerProfile.bio}</p>
                </div>
              )}

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                
                {(sellerProfile.city || sellerProfile.province) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{[sellerProfile.city, sellerProfile.province].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                
                {sellerProfile.contact_number && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{sellerProfile.contact_number}</span>
                  </div>
                )}
                
                {sellerProfile.whatsapp_number && (
                  <div className="flex items-start gap-3">
                    <MessageCircle className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{sellerProfile.whatsapp_number}</span>
                  </div>
                )}
                
                {sellerProfile.business_hours && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{sellerProfile.business_hours}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}