import React, { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Loader2, Star } from 'lucide-react';
import { ReviewList } from '../components/reviews/SellerReviews';

export default function SellerReviews() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {
        api.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">My Reviews</h1>
              <p className="text-white/80">See what buyers are saying about you</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="p-6 border-0 shadow-lg">
          <ReviewList sellerEmail={user.email} isOwner={true} />
        </Card>
      </div>
    </div>
  );
}