import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import SearchBar from '../components/marketplace/SearchBar';
import FilterPanel from '../components/marketplace/FilterPanel';
import ListingCard from '../components/marketplace/ListingCard';
import { Loader2, Star } from 'lucide-react';
import { createPageUrl } from '../utils';

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    province: '',
    city: ''
  });

  const urlParams = new URLSearchParams(window.location.search);
  
  useEffect(() => {
    const urlSearch = urlParams.get('search');
    const urlCategory = urlParams.get('category');
    
    if (urlSearch) setSearchQuery(urlSearch);
    if (urlCategory) setFilters(prev => ({ ...prev, category: urlCategory }));
  }, []);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['listings', filters, searchQuery],
    queryFn: async () => {
      let allListings = await api.entities.Listing.filter({ status: 'active' });
      
      // Sort: featured first, then by date
      allListings.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return new Date(b.created_date) - new Date(a.created_date);
      });
      
      return allListings.filter(listing => {
        const matchesSearch = !searchQuery || 
          listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.breed?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCategory = !filters.category || listing.category === filters.category;
        
        const matchesMinPrice = !filters.minPrice || listing.price >= parseFloat(filters.minPrice);
        const matchesMaxPrice = !filters.maxPrice || listing.price <= parseFloat(filters.maxPrice);
        
        const matchesProvince = !filters.province || 
          listing.province?.toLowerCase().includes(filters.province.toLowerCase());
        
        const matchesCity = !filters.city || 
          listing.city?.toLowerCase().includes(filters.city.toLowerCase());
        
        return matchesSearch && matchesCategory && matchesMinPrice && 
               matchesMaxPrice && matchesProvince && matchesCity;
      });
    }
  });

  const handleClearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      province: '',
      city: ''
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Browse Marketplace</h1>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={() => {}}
            onFilterClick={() => setShowFilters(!showFilters)}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              onClear={handleClearFilters}
              onClose={() => setShowFilters(false)}
            />
          </div>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600">
                {isLoading ? 'Loading...' : `${listings.length} listings found`}
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xl text-gray-500 mb-2">No listings found</p>
                <p className="text-gray-400">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                {listings.filter(l => l.featured).length > 0 && (
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Star className="w-5 h-5 text-[#E07A5F] fill-[#E07A5F]" />
                      <h2 className="text-xl font-bold text-gray-900">Featured Listings</h2>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.filter(l => l.featured).map((listing) => (
                        <div key={listing.id} className="ring-2 ring-[#E07A5F] rounded-xl relative">
                          <div className="absolute -top-3 left-4 z-10 bg-[#E07A5F] text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" />
                            FEATURED
                          </div>
                          <ListingCard listing={listing} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {listings.filter(l => !l.featured).length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">All Listings</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {listings.filter(l => !l.featured).map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}