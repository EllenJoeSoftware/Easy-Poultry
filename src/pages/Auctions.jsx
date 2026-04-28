import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gavel, Plus, Search, Building2, Clock, Loader2, Calendar, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import moment from 'moment';

export default function Auctions() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('ending_soon');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {}
    };
    loadUser();
  }, []);

  const { data: auctionHouses = [] } = useQuery({
    queryKey: ['auction-houses'],
    queryFn: () => api.entities.AuctionHouse.filter({ status: 'active' })
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['auction-events', sort],
    queryFn: async () => {
      let results = await api.entities.AuctionEvent.filter({ status: 'live' });
      const scheduled = await api.entities.AuctionEvent.filter({ status: 'scheduled' });
      results = [...results, ...scheduled];
      
      if (sort === 'ending_soon') {
        results.sort((a, b) => new Date(a.end_time) - new Date(b.end_time));
      } else if (sort === 'newest') {
        results.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      }
      return results;
    }
  });

  const { data: myHouse } = useQuery({
    queryKey: ['my-auction-house', user?.email],
    queryFn: async () => {
      const houses = await api.entities.AuctionHouse.filter({ created_by: user?.email });
      return houses[0];
    },
    enabled: !!user
  });

  const filteredEvents = events.filter(e =>
    !search || e.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#E07A5F] to-[#D06A4F] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Gavel className="w-8 h-8" />
                <h1 className="text-3xl font-bold">Poultry Auctions</h1>
              </div>
              <p className="text-white/90">Bid on premium poultry from verified auction houses</p>
            </div>
            {user && (
              <div className="flex gap-2">
                {myHouse?.status === 'active' ? (
                  <Link to={createPageUrl('MyAuctionHouse')}>
                    <Button className="bg-white text-[#E07A5F] hover:bg-gray-100">
                      <Building2 className="w-4 h-4 mr-2" />
                      My Auction House
                    </Button>
                  </Link>
                ) : myHouse ? (
                  <Link to={createPageUrl('MyAuctionHouse')}>
                    <Button className="bg-white text-[#E07A5F] hover:bg-gray-100">
                      <Clock className="w-4 h-4 mr-2" />
                      Pending Verification
                    </Button>
                  </Link>
                ) : (
                  <Link to={createPageUrl('CreateAuctionHouse')}>
                    <Button className="bg-white text-[#E07A5F] hover:bg-gray-100">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Auction House
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search auctions..." className="pl-10" />
              </div>
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ending_soon">Ending Soon</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="auctions" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="auctions">Live & Upcoming Auctions</TabsTrigger>
            <TabsTrigger value="houses">Auction Houses ({auctionHouses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="auctions">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#E07A5F]" />
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-20">
                <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No active auctions</h3>
                <p className="text-gray-600">Check back soon for upcoming auctions</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <AuctionEventCard key={event.id} event={event} houses={auctionHouses} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="houses">
            {auctionHouses.length === 0 ? (
              <div className="text-center py-20">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No auction houses yet</h3>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {auctionHouses.map((house) => (
                  <Card key={house.id} className="overflow-hidden border-0 shadow hover:shadow-lg transition-all">
                    <div className="h-32 bg-gray-100">
                      {house.cover_image_url ? (
                        <img src={house.cover_image_url} alt={house.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E07A5F]/20 to-[#E07A5F]/10">
                          <Building2 className="w-12 h-12 text-[#E07A5F]/50" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-2">
                        {house.logo_url ? (
                          <img src={house.logo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#E07A5F]/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-[#E07A5F]" />
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900">{house.name}</h3>
                          {house.city && <p className="text-sm text-gray-500">{house.city}, {house.province}</p>}
                        </div>
                      </div>
                      {house.description && <p className="text-sm text-gray-600 line-clamp-2">{house.description}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function AuctionEventCard({ event, houses }) {
  const house = houses.find(h => h.id === event.auction_house_id);
  const hasStarted = moment().isAfter(event.start_time);
  const hasEnded = moment().isAfter(event.end_time);
  const isLive = event.status === 'live' || (hasStarted && !hasEnded && event.status !== 'ended');

  return (
    <Link to={createPageUrl('AuctionEventDetail') + `?id=${event.id}`}>
      <Card className="overflow-hidden border-0 shadow hover:shadow-lg transition-all">
        <div className="aspect-video bg-gray-100 relative">
          {event.cover_image_url ? (
            <img src={event.cover_image_url} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#E07A5F]/20 to-[#E07A5F]/10">
              <Gavel className="w-12 h-12 text-[#E07A5F]/50" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className={isLive ? 'bg-green-500' : hasEnded ? 'bg-gray-500' : 'bg-blue-500'}>
              {isLive ? 'LIVE' : hasEnded ? 'ENDED' : 'UPCOMING'}
            </Badge>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{event.title}</h3>
          {house && <p className="text-sm text-gray-600 mb-2">{house.name}</p>}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {hasStarted ? `Ends ${moment(event.end_time).fromNow()}` : `Starts ${moment(event.start_time).fromNow()}`}
            </div>
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {event.total_items || 0} lots
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}