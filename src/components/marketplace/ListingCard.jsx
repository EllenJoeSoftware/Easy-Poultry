import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Eye, Heart, ShoppingCart, Share2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { api } from '@/api/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function ListingCard({ listing, showSellerContact = false, sellerProfile = null, shopUrl = null }) {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const primaryImage = listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400';



  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {
        // Not logged in
      }
    };
    loadUser();
  }, []);

  const { data: savedListings = [] } = useQuery({
    queryKey: ['saved-listings-check', user?.email],
    queryFn: () => api.entities.SavedListing.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const isSaved = savedListings.some(s => s.listing_id === listing.id);

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        const saved = savedListings.find(s => s.listing_id === listing.id);
        if (saved) await api.entities.SavedListing.delete(saved.id);
      } else {
        await api.entities.SavedListing.create({ listing_id: listing.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-listings-check']);
      queryClient.invalidateQueries(['saved-listings']);
      toast.success(isSaved ? 'Removed from saved' : 'Saved successfully');
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to save listings');
      return;
    }
    toggleSaveMutation.mutate();
  };
  
  const categoryLabels = {
    chickens: 'Chickens',
    ducks: 'Ducks',
    geese: 'Geese',
    turkeys: 'Turkeys',
    quail: 'Quail',
    guinea_fowl: 'Guinea Fowl',
    peafowl: 'Peafowl',
    pigeons: 'Pigeons',
    eggs_table: 'Table Eggs',
    eggs_fertile: 'Fertile Eggs',
    chicks: 'Chicks',
    growers: 'Growers',
    layers: 'Layers',
    broilers: 'Broilers',
    feed: 'Feed',
    supplements: 'Supplements',
    incubators: 'Incubators',
    equipment: 'Equipment',
    other: 'Other'
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-0 bg-white">
      <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
          <img
            src={primaryImage}
            alt={listing.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/95 text-gray-800 backdrop-blur-sm border-0 shadow-sm">
              {categoryLabels[listing.category]}
            </Badge>
          </div>
          <button
            onClick={handleSave}
            disabled={toggleSaveMutation.isPending}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-all shadow-sm"
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>
          {listing.view_count > 0 && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs">
              <Eye className="w-3 h-3" />
              {listing.view_count}
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                <Button variant="secondary" size="icon" className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-lg h-10 w-10">
                  <Share2 className="w-4 h-4 text-gray-700" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem onClick={() => {
                  const url = shopUrl ? `${window.location.origin}${shopUrl}` : `${window.location.origin}${createPageUrl('ProductDetail')}?id=${listing.id}`;
                  const text = shopUrl ? `Check out my shop!` : `Check out this listing: ${listing.title} - R${listing.price}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
                }}>
                  WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const url = shopUrl ? `${window.location.origin}${shopUrl}` : `${window.location.origin}${createPageUrl('ProductDetail')}?id=${listing.id}`;
                  const subject = shopUrl ? `Check out my shop!` : `Check out: ${listing.title}`;
                  const body = shopUrl ? `Visit my shop on Easy Poultry:\n\n${url}` : `I found this listing on Easy Poultry:\n\n${listing.title}\nPrice: R${listing.price}\n\n${url}`;
                  window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                }}>
                  Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  const url = shopUrl ? `${window.location.origin}${shopUrl}` : `${window.location.origin}${createPageUrl('ProductDetail')}?id=${listing.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Link copied!');
                }}>
                  Copy Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {showSellerContact && sellerProfile?.contact_number ? (
              <Button 
                className="bg-[#E07A5F] text-white shadow-lg cursor-default hover:bg-[#E07A5F]"
                onClick={(e) => e.preventDefault()}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {sellerProfile.contact_number}
              </Button>
            ) : (
              <Link 
                to={createPageUrl('ProductDetail') + `?id=${listing.id}&contact=true`}
                onClick={(e) => e.stopPropagation()}
              >
                <Button className="bg-[#E07A5F] hover:bg-[#D06A4F] text-white shadow-lg">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Buy Now
                </Button>
              </Link>
            )}
          </div>
        </div>
      </Link>
      
      <div className="p-4">
        <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`}>
          <h3 className="font-semibold text-gray-900 text-lg mb-1 group-hover:text-[#7A9D7A] transition-colors line-clamp-1">
            {listing.title}
          </h3>
        </Link>
        
        {listing.breed && (
          <p className="text-sm text-gray-600 mb-2">{listing.breed}</p>
        )}
        
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="w-4 h-4" />
            <span>{listing.city}, {listing.province}</span>
          </div>
          {listing.age && (
            <span className="text-sm text-gray-500">{listing.age}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div>
            <div>
              <span className="text-2xl font-bold text-[#E07A5F]">
                R{listing.price}
              </span>
              {listing.price_type === 'batch' && listing.stock_quantity > 1 && (
                <span className="text-xs text-gray-500 ml-1">/ batch</span>
              )}
            </div>
            {listing.stock_quantity > 0 && (
              <span className="text-xs text-gray-500">
                {listing.stock_quantity} available
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}