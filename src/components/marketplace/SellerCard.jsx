import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Phone, MessageCircle, Mail, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';

export default function SellerCard({ seller, onContact, isLoading }) {
  const [showPhone, setShowPhone] = useState(false);
  const profilePhoto = seller?.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller?.full_name || 'Seller')}&background=7A9D7A&color=fff`;

  if (isLoading) {
    return (
      <Card className="p-6 border-0 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-[#7A9D7A] border-t-transparent rounded-full animate-spin" />
        </div>
      </Card>
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

  return (
    <Card className="p-6 border-0 shadow-lg sticky top-6">
      <Link to={createPageUrl('SellerListings') + `?email=${encodeURIComponent(seller?.email)}`} className="block">
        <div className="flex items-start gap-4 mb-6 group cursor-pointer">
          <img
            src={profilePhoto}
            alt={seller?.full_name}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 group-hover:text-[#7A9D7A] transition-colors">{seller?.full_name}</h3>
              {seller?.seller_verified && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center" title="Verified Seller">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#7A9D7A] transition-colors" />
            </div>
            {seller?.farm_name && (
              <p className="text-sm text-gray-600">{seller.farm_name}</p>
            )}
            <p className="text-xs text-[#7A9D7A] mt-1">View all listings</p>
          </div>
        </div>
      </Link>

      {seller?.seller_description && (
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          {seller.seller_description}
        </p>
      )}

      <div className="space-y-3 mb-6 text-sm">
        {(seller?.city || seller?.province) && (
          <div className="flex items-start gap-3 text-gray-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>
              {seller.exact_location && `${seller.exact_location}, `}
              {[seller.city, seller.province].filter(Boolean).join(', ')}
            </span>
          </div>
        )}
        
        {seller?.business_hours && (
          <div className="flex items-start gap-3 text-gray-600">
            <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{seller.business_hours}</span>
          </div>
        )}

        {seller?.bio && (
          <p className="text-gray-600 leading-relaxed">
            {seller.bio}
          </p>
        )}
      </div>

      {seller?.seller_verified ? (
        <div className="space-y-2">
          <Button
            onClick={handleWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#20BD5C] text-white h-11"
            disabled={!seller?.whatsapp_number && !seller?.contact_number}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            WhatsApp Seller
          </Button>
          
          <div className="grid grid-cols-2 gap-2">
            {showPhone && seller?.contact_number ? (
              <a href={`tel:${seller.contact_number}`} className="flex items-center justify-center h-11 border rounded-md bg-gray-50 font-medium text-gray-900">
                {seller.contact_number}
              </a>
            ) : (
              <Button
                onClick={handleCall}
                variant="outline"
                className="h-11"
                disabled={!seller?.contact_number}
              >
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            )}
            <Button
              onClick={onContact}
              variant="outline"
              className="h-11"
            >
              <Mail className="w-4 h-4 mr-2" />
              Inquire
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-center">
            <p className="text-sm text-gray-600">Contact seller through inquiry to exchange numbers</p>
          </div>
          <Button
            onClick={onContact}
            className="w-full bg-[#7A9D7A] hover:bg-[#6A8D6A] h-11"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Inquiry
          </Button>
        </div>
      )}
    </Card>
  );
}