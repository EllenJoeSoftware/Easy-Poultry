import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Package, Eye, MessageCircle, Star, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function SellerAnalytics({ userEmail }) {
  const { data: listings = [] } = useQuery({
    queryKey: ['seller-listings-analytics', userEmail],
    queryFn: () => api.entities.Listing.filter({ created_by: userEmail }),
    enabled: !!userEmail
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['seller-reviews-analytics', userEmail],
    queryFn: () => api.entities.SellerReview.filter({ seller_email: userEmail }),
    enabled: !!userEmail
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ['seller-inquiries-analytics', userEmail],
    queryFn: () => api.entities.Inquiry.filter({ seller_id: userEmail }),
    enabled: !!userEmail
  });

  // Calculate metrics
  const activeListings = listings.filter(l => l.status === 'active');
  const soldListings = listings.filter(l => l.status === 'sold');
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count || 0), 0);
  const totalInquiries = listings.reduce((sum, l) => sum + (l.inquiry_count || 0), 0);
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;
  const totalSales = soldListings.reduce((sum, l) => sum + (l.price || 0), 0);
  const conversionRate = totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : 0;

  // Prepare chart data
  const categoryData = Object.entries(
    listings.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value }));

  const viewsData = listings
    .filter(l => l.view_count > 0)
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 5)
    .map(l => ({ name: l.title.slice(0, 15) + '...', views: l.view_count, inquiries: l.inquiry_count || 0 }));

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating: `${rating} Star`,
    count: reviews.filter(r => r.rating === rating).length
  }));

  const COLORS = ['#7A9D7A', '#E07A5F', '#3D405B', '#81B29A', '#F2CC8F'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#7A9D7A]/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-[#7A9D7A]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeListings.length}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{soldListings.length}</p>
              <p className="text-xs text-gray-500">Sold</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#E07A5F]/10 flex items-center justify-center">
              <Eye className="w-5 h-5 text-[#E07A5F]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalViews}</p>
              <p className="text-xs text-gray-500">Views</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalInquiries}</p>
              <p className="text-xs text-gray-500">Inquiries</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgRating}</p>
              <p className="text-xs text-gray-500">Avg Rating</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{conversionRate}%</p>
              <p className="text-xs text-gray-500">Conversion</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">R{totalSales.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Total Sales</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Listings by Views */}
        <Card className="p-6 border-0 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Top Listings Performance</h3>
          {viewsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={viewsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#7A9D7A" name="Views" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inquiries" fill="#E07A5F" name="Inquiries" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No data yet
            </div>
          )}
        </Card>

        {/* Category Distribution */}
        <Card className="p-6 border-0 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Listings by Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-400">
              No data yet
            </div>
          )}
        </Card>
      </div>

      {/* Rating Distribution */}
      {reviews.length > 0 && (
        <Card className="p-6 border-0 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" />
              <YAxis dataKey="rating" type="category" width={60} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#F2CC8F" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}