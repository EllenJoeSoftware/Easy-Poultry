import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search as SearchIcon, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Search() {
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      setQuery(q);
      setSearchTerm(q);
    }
  }, []);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: async () => {
      if (!searchTerm) return [];
      const listings = await api.entities.Listing.filter({ status: 'active' }, '-created_date', 50);
      return listings.filter(listing => 
        listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    },
    enabled: !!searchTerm
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchTerm(query);
    window.history.pushState({}, '', `${createPageUrl('Search')}?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Google-like Header */}
      <div className={`${searchTerm ? 'py-4 border-b' : 'py-20'} transition-all`}>
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69217b962ad6e0119f66201f/6a47c0425_CroppedLogo.png" 
              alt="Easy Poultry" 
              className="w-12 h-12"
            />
            <span className="text-3xl font-bold text-gray-900">Easy Poultry</span>
          </div>

          <form onSubmit={handleSearch} className="relative">
            <div className="relative flex items-center">
              <SearchIcon className="absolute left-4 w-5 h-5 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search poultry, breeds, equipment..."
                className="pl-12 pr-24 h-12 text-lg border-2 rounded-full shadow-lg focus:shadow-xl"
                autoFocus
              />
              <Button
                type="submit"
                className="absolute right-1 h-10 px-6 bg-[#7A9D7A] hover:bg-[#6A8D6A] rounded-full"
              >
                Search
              </Button>
            </div>
          </form>

          {!searchTerm && (
            <div className="flex gap-3 justify-center mt-6">
              {['Chickens', 'Eggs', 'Feed', 'Equipment'].map((cat) => (
                <Button
                  key={cat}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuery(cat);
                    setSearchTerm(cat);
                  }}
                  className="rounded-full"
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {searchTerm && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <p className="text-sm text-gray-600 mb-4">
            {isLoading ? 'Searching...' : `About ${results.length} results`}
          </p>

          <div className="space-y-6">
            {results.map((listing) => (
              <Card key={listing.id} className="p-4 hover:shadow-md transition-shadow">
                <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`}>
                  <div className="flex gap-4">
                    {listing.images?.[0] && (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-xl text-blue-600 hover:underline font-medium mb-1">
                        {listing.title}
                      </h3>
                      <p className="text-sm text-green-700 mb-2">
                        {window.location.origin}{createPageUrl('ProductDetail')}?id={listing.id}
                      </p>
                      <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          R{listing.price}
                        </span>
                        {listing.province && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {listing.city}, {listing.province}
                          </span>
                        )}
                        {listing.breed && (
                          <span className="text-gray-500">
                            {listing.breed}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            ))}

            {!isLoading && results.length === 0 && searchTerm && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-2">No results found for "{searchTerm}"</p>
                <p className="text-sm text-gray-500">Try different keywords</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}