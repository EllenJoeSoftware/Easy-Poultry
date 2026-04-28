import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Package, Eye, Loader2 } from 'lucide-react';

export default function SellerFinances() {
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

  const { data: myListings = [] } = useQuery({
    queryKey: ['my-listings-finance'],
    queryFn: () => api.entities.Listing.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const { data: myPayments = [] } = useQuery({
    queryKey: ['my-payments'],
    queryFn: () => api.entities.FeaturePayment.filter({ seller_id: user?.email }, '-created_date'),
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const soldListings = myListings.filter(l => (l.sold_quantity || 0) > 0);
  const totalRevenue = myListings.reduce((sum, l) => {
    const soldQty = l.sold_quantity || 0;
    const pricePerItem = l.price_type === 'batch' ? l.price / Math.max(1, (l.stock_quantity + soldQty)) : l.price;
    return sum + (pricePerItem * soldQty);
  }, 0);
  const totalViews = myListings.reduce((sum, l) => sum + (l.view_count || 0), 0);
  const totalSpent = myPayments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount_paid, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Sales & Finances</h1>
          <p className="text-white/90">Track your sales performance and spending</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-lg">
            <DollarSign className="w-8 h-8 text-[#7A9D7A] mb-2" />
            <p className="text-3xl font-bold text-gray-900 mb-1">R{totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Total Sales Revenue</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <Package className="w-8 h-8 text-[#E07A5F] mb-2" />
            <p className="text-3xl font-bold text-gray-900 mb-1">{soldListings.length}</p>
            <p className="text-sm text-gray-600">Items Sold</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <Eye className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900 mb-1">{totalViews}</p>
            <p className="text-sm text-gray-600">Total Views</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900 mb-1">R{totalSpent.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Promotion Spending</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Recent Sales</h3>
            </div>
            {soldListings.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600">No sales yet</p>
              </div>
            ) : (
              <div className="divide-y max-h-96 overflow-auto">
                {soldListings.map((listing) => (
                  <div key={listing.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100'}
                        alt={listing.title}
                        className="w-12 h-12 rounded object-cover"
                      />
                      <div>
                       <p className="font-medium text-gray-900">{listing.title}</p>
                       <p className="text-sm text-gray-600">
                         {listing.sold_date ? new Date(listing.sold_date).toLocaleDateString() : 'Recent'}
                       </p>
                       <p className="text-xs text-gray-500">
                         Sold: {listing.sold_quantity} / {listing.stock_quantity + (listing.sold_quantity || 0)} items
                       </p>
                      </div>
                      </div>
                      <div className="text-right">
                      <p className="font-bold text-[#7A9D7A]">
                       R{(() => {
                         const pricePerItem = listing.price_type === 'batch' 
                           ? listing.price / Math.max(1, (listing.stock_quantity + (listing.sold_quantity || 0)))
                           : listing.price;
                         return (pricePerItem * (listing.sold_quantity || 0)).toFixed(2);
                       })()}
                      </p>
                      </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="border-0 shadow-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Featured Listing Payments</h3>
            </div>
            {myPayments.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-gray-600">No promotion payments yet</p>
              </div>
            ) : (
              <div className="divide-y max-h-96 overflow-auto">
                {myPayments.map((payment) => (
                  <div key={payment.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">R{payment.amount_paid}</p>
                      <Badge variant={payment.status === 'verified' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
                        {payment.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>{payment.duration_days} days featured</p>
                      <p>{new Date(payment.created_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}