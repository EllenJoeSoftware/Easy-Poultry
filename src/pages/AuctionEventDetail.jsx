import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Users, Gavel, Loader2, Building2, Trophy, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import moment from 'moment';

function LiveCountdown({ endTime }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = moment();
      const end = moment(endTime);
      const diff = end.diff(now);
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const duration = moment.duration(diff);
      setTimeLeft({
        days: Math.floor(duration.asDays()),
        hours: duration.hours(),
        minutes: duration.minutes(),
        seconds: duration.seconds()
      });
      setIsUrgent(diff < 300000);
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div className={`grid grid-cols-4 gap-2 ${isUrgent ? 'animate-pulse' : ''}`}>
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Min', value: timeLeft.minutes },
        { label: 'Sec', value: timeLeft.seconds }
      ].map(({ label, value }) => (
        <div key={label} className={`text-center p-3 rounded-lg ${isUrgent ? 'bg-red-100' : 'bg-gray-100'}`}>
          <p className={`text-2xl font-bold ${isUrgent ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function AuctionEventDetail() {
  const [user, setUser] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('id');

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
      } catch (error) {}
    };
    loadUser();
  }, []);

  // Auto-update auction status based on time
  const checkAndUpdateStatus = async (eventData) => {
    if (!eventData) return eventData;
    const now = moment();
    const hasStarted = now.isAfter(eventData.start_time);
    const hasEnded = now.isAfter(eventData.end_time);
    
    let newStatus = eventData.status;
    if (hasEnded && eventData.status !== 'ended') {
      newStatus = 'ended';
    } else if (hasStarted && !hasEnded && eventData.status === 'scheduled') {
      newStatus = 'live';
    }
    
    if (newStatus !== eventData.status) {
      await api.entities.AuctionEvent.update(eventData.id, { status: newStatus });
      return { ...eventData, status: newStatus };
    }
    return eventData;
  };

  const { data: event, isLoading } = useQuery({
    queryKey: ['auction-event', eventId],
    queryFn: async () => {
      const events = await api.entities.AuctionEvent.filter({ id: eventId });
      if (events.length > 0) {
        await api.entities.AuctionEvent.update(eventId, { view_count: (events[0].view_count || 0) + 1 });
        return await checkAndUpdateStatus(events[0]);
      }
      return null;
    },
    enabled: !!eventId,
    refetchInterval: 2000  // Faster refresh for real-time updates
  });

  const { data: house } = useQuery({
    queryKey: ['auction-house', event?.auction_house_id],
    queryFn: async () => {
      const houses = await api.entities.AuctionHouse.filter({ id: event.auction_house_id });
      return houses[0];
    },
    enabled: !!event?.auction_house_id
  });

  const { data: items = [] } = useQuery({
    queryKey: ['auction-event-items', eventId],
    queryFn: () => api.entities.AuctionItem.filter({ auction_event_id: eventId }, 'lot_number'),
    enabled: !!eventId,
    refetchInterval: 2000  // Faster refresh
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['item-bids', selectedItem?.id],
    queryFn: () => api.entities.AuctionBid.filter({ auction_id: selectedItem?.id }, '-created_date'),
    enabled: !!selectedItem?.id,
    refetchInterval: 2000  // Faster refresh
  });

  // Get all bids for all items to show bidder activity
  const { data: allBids = [] } = useQuery({
    queryKey: ['all-event-bids', eventId],
    queryFn: async () => {
      const itemIds = items.map(i => i.id);
      let allB = [];
      for (const itemId of itemIds) {
        const itemBids = await api.entities.AuctionBid.filter({ auction_id: itemId }, '-created_date');
        allB = [...allB, ...itemBids];
      }
      return allB;
    },
    enabled: items.length > 0,
    refetchInterval: 2000
  });

  // Get unique bidders
  const uniqueBidders = [...new Map(allBids.map(b => [b.bidder_email, { email: b.bidder_email, name: b.bidder_name }])).values()];

  const placeBidMutation = useMutation({
    mutationFn: async ({ item, amount }) => {
      await api.entities.AuctionBid.create({
        auction_id: item.id,
        bidder_email: user.email,
        bidder_name: user.full_name,
        amount
      });

      const updateData = {
        current_bid: amount,
        current_bidder: user.email,
        current_bidder_name: user.full_name,
        bid_count: (item.bid_count || 0) + 1,
        reserve_met: item.reserve_price ? amount >= item.reserve_price : true
      };

      await api.entities.AuctionItem.update(item.id, updateData);
      await api.entities.AuctionEvent.update(eventId, { total_bids: (event.total_bids || 0) + 1 });

      if (item.current_bidder && item.current_bidder !== user.email) {
        await api.entities.Notification.create({
          user_email: item.current_bidder,
          type: 'system',
          title: 'Outbid!',
          message: `You've been outbid on Lot ${item.lot_number}: ${item.title}`,
          link: createPageUrl('AuctionEventDetail') + `?id=${eventId}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-event-items']);
      queryClient.invalidateQueries(['item-bids']);
      toast.success('Bid placed!');
      setBidAmount('');
    }
  });

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    const currentBid = selectedItem.current_bid || 0;
    const startingBid = selectedItem.starting_bid;
    const minIncrement = selectedItem.min_increment || 10;
    
    // Must be at least starting bid if no bids yet
    const minBid = currentBid > 0 ? currentBid + minIncrement : startingBid;
    
    if (amount <= currentBid && currentBid > 0) {
      toast.error(`Your bid must be higher than the current bid of R${currentBid}`);
      return;
    }
    
    if (amount < minBid) {
      toast.error(`Minimum bid is R${minBid}`);
      return;
    }
    placeBidMutation.mutate({ item: selectedItem, amount });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#E07A5F]" /></div>;
  }

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-xl text-gray-500">Auction not found</p></div>;
  }

  const hasStarted = moment().isAfter(event.start_time);
  const hasEnded = moment().isAfter(event.end_time) || event.status === 'ended';
  const isLive = event.status === 'live' || (hasStarted && !hasEnded && event.status !== 'ended');

  const poultryLabels = {
    chickens: 'Chickens', ducks: 'Ducks', geese: 'Geese', turkeys: 'Turkeys',
    quail: 'Quail', guinea_fowl: 'Guinea Fowl', peafowl: 'Peafowl', pigeons: 'Pigeons', eggs: 'Eggs', other: 'Other'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to={createPageUrl('Auctions')} className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#E07A5F] to-[#D06A4F] text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={isLive ? 'bg-green-500' : hasEnded ? 'bg-gray-500' : 'bg-blue-500'}>
                  {isLive ? 'LIVE' : hasEnded ? 'ENDED' : 'UPCOMING'}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
              {house && (
                <div className="flex items-center gap-2 text-white/90">
                  <Building2 className="w-4 h-4" />
                  <span>{house.name}</span>
                  {house.city && <span>• {house.city}, {house.province}</span>}
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm mb-1">{items.length} lots • {event.view_count || 0} views</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items List */}
          <div className="lg:col-span-2">
            {/* Active Bidders */}
            {uniqueBidders.length > 0 && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-[#7A9D7A]" />
                  <h3 className="font-semibold">Active Bidders ({uniqueBidders.length})</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {uniqueBidders.map((bidder, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{bidder.name || bidder.email.split('@')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auction Results - Show when ended */}
            {hasEnded && (
              <div className="mb-6 p-6 bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] rounded-lg text-white">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Auction Results</h3>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  {items.filter(i => i.current_bid > 0).map(item => (
                    <div key={item.id} className="bg-white/20 rounded-lg p-4">
                      <p className="font-medium">Lot {item.lot_number}: {item.title}</p>
                      <p className="text-2xl font-bold">R{(item.current_bid || 0).toLocaleString()}</p>
                      <p className="text-sm text-white/80">Winner: {item.current_bidder_name || item.current_bidder?.split('@')[0] || 'No bids'}</p>
                    </div>
                  ))}
                  {items.filter(i => !i.current_bid || i.current_bid === 0).length > 0 && (
                    <div className="bg-white/10 rounded-lg p-4">
                      <p className="text-white/80">{items.filter(i => !i.current_bid || i.current_bid === 0).length} lots received no bids</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <h2 className="text-xl font-bold mb-4">Auction Lots</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden border-0 shadow cursor-pointer transition-all ${selectedItem?.id === item.id ? 'ring-2 ring-[#E07A5F]' : 'hover:shadow-lg'}`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-bold">Lot {item.lot_number}</div>
                    {item.status === 'sold' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge className="bg-green-500 text-lg px-4 py-2">SOLD</Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{item.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Badge variant="outline">{poultryLabels[item.poultry_type]}</Badge>
                      {item.breed && <span>{item.breed}</span>}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">{item.bid_count > 0 ? 'Current Bid' : 'Starting'}</p>
                        <p className="text-xl font-bold text-[#E07A5F]">R{(item.current_bid || item.starting_bid).toLocaleString()}</p>
                      </div>
                      {item.bid_count > 0 && (
                        <div className="text-right">
                          <span className="text-sm text-gray-500">{item.bid_count} bids</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Bidding Panel */}
          <div className="sticky top-24">
            <Card className="p-6 border-0 shadow-lg">
              {!hasStarted ? (
                <div className="text-center">
                  <Clock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Starts Soon</h3>
                  <p className="text-gray-600 mb-4">{moment(event.start_time).format('MMM D, YYYY h:mm A')}</p>
                </div>
              ) : hasEnded ? (
                <div className="text-center">
                  <Trophy className="w-12 h-12 text-[#7A9D7A] mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">Auction Ended</h3>
                  <p className="text-gray-600 mb-4">Final results are displayed above</p>
                  <div className="bg-gray-50 rounded-lg p-4 text-left">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-[#E07A5F]">R{items.reduce((sum, i) => sum + (i.current_bid || 0), 0).toLocaleString()}</p>
                    <p className="text-sm text-gray-500 mt-1">{items.filter(i => i.current_bid > 0).length} of {items.length} lots sold</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-sm text-gray-500 mb-2">Time Remaining</p>
                    <LiveCountdown endTime={event.end_time} />
                  </div>

                  {selectedItem ? (
                    <div>
                      <div className="border-t pt-4 mb-4">
                        <p className="text-sm text-gray-500 mb-1">Lot {selectedItem.lot_number}</p>
                        <h3 className="font-semibold text-gray-900">{selectedItem.title}</h3>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-sm text-gray-500">{selectedItem.bid_count > 0 ? 'Current Bid' : 'Starting Bid'}</p>
                        <p className="text-3xl font-bold text-[#E07A5F]">R{(selectedItem.current_bid || selectedItem.starting_bid).toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-1">{selectedItem.bid_count || 0} bids</p>
                      </div>

                      {!user ? (
                        <Button onClick={() => api.auth.redirectToLogin(window.location.href)} className="w-full bg-[#7A9D7A] hover:bg-[#6A8D6A]">
                          Login to Bid
                        </Button>
                      ) : selectedItem.status === 'sold' ? (
                        <div className="bg-green-50 p-4 rounded-lg text-center">
                          <p className="text-green-700 font-medium">This lot has been sold</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-500 mb-2">
                              Min: R{(selectedItem.current_bid > 0 
                                ? (selectedItem.current_bid + (selectedItem.min_increment || 10)) 
                                : selectedItem.starting_bid
                              ).toLocaleString()}
                            </p>
                            <div className="flex gap-2">
                              <Input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} placeholder="Your bid" />
                              <Button onClick={handlePlaceBid} disabled={!bidAmount || placeBidMutation.isPending} className="bg-[#E07A5F] hover:bg-[#D06A4F] px-6">
                                {placeBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bid'}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Recent bids for this item */}
                          {bids.length > 0 && (
                            <div className="border-t pt-3 mt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">Recent Bids</p>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {bids.slice(0, 5).map((bid, i) => (
                                  <div key={bid.id} className={`text-sm flex justify-between ${i === 0 ? 'text-[#E07A5F] font-medium' : 'text-gray-600'}`}>
                                    <span>{bid.bidder_name || bid.bidder_email.split('@')[0]}</span>
                                    <span>R{bid.amount.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Gavel className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>Select a lot to place a bid</p>
                    </div>
                  )}
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}