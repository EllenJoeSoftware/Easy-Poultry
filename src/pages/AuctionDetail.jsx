import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MapPin, Clock, Users, Gavel, AlertCircle, CheckCircle2, Loader2, History } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import moment from 'moment';
import ImageCarousel from '../components/marketplace/ImageCarousel';

function LiveCountdown({ endTime, onEnd }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = moment();
      const end = moment(endTime);
      const diff = end.diff(now);

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        onEnd?.();
        return;
      }

      const duration = moment.duration(diff);
      setTimeLeft({
        days: Math.floor(duration.asDays()),
        hours: duration.hours(),
        minutes: duration.minutes(),
        seconds: duration.seconds()
      });
      setIsUrgent(diff < 300000); // Less than 5 minutes
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime, onEnd]);

  return (
    <div className={`grid grid-cols-4 gap-2 ${isUrgent ? 'animate-pulse' : ''}`}>
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Min', value: timeLeft.minutes },
        { label: 'Sec', value: timeLeft.seconds }
      ].map(({ label, value }) => (
        <div key={label} className={`text-center p-3 rounded-lg ${isUrgent ? 'bg-red-100' : 'bg-cream-deep'}`}>
          <p className={`text-2xl font-bold ${isUrgent ? 'text-terracotta-600' : 'text-ink'}`}>{value}</p>
          <p className="text-xs text-ink/55">{label}</p>
        </div>
      ))}
    </div>
  );
}

export default function AuctionDetail() {
  const [user, setUser] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(window.location.search);
  const auctionId = urlParams.get('id');

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

  const { data: auction, isLoading } = useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      const auctions = await api.entities.Auction.filter({ id: auctionId });
      if (auctions.length > 0) {
        await api.entities.Auction.update(auctionId, {
          view_count: (auctions[0].view_count || 0) + 1
        });
        return auctions[0];
      }
      return null;
    },
    enabled: !!auctionId,
    refetchInterval: 5000
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['auction-bids', auctionId],
    queryFn: () => api.entities.AuctionBid.filter({ auction_id: auctionId }, '-created_date'),
    enabled: !!auctionId,
    refetchInterval: 5000
  });

  const { data: registration } = useQuery({
    queryKey: ['auction-registration', auctionId, user?.email],
    queryFn: async () => {
      const regs = await api.entities.AuctionRegistration.filter({ 
        auction_id: auctionId, 
        bidder_email: user?.email 
      });
      return regs[0];
    },
    enabled: !!auctionId && !!user
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      await api.entities.AuctionRegistration.create({
        auction_id: auctionId,
        bidder_email: user.email,
        bidder_name: user.full_name,
        status: 'registered'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-registration']);
      toast.success('Registered for auction!');
    }
  });

  const placeBidMutation = useMutation({
    mutationFn: async (amount) => {
      // Create bid
      await api.entities.AuctionBid.create({
        auction_id: auctionId,
        bidder_email: user.email,
        bidder_name: user.full_name,
        amount
      });

      // Update auction
      const updateData = {
        current_bid: amount,
        current_bidder: user.email,
        current_bidder_name: user.full_name,
        bid_count: (auction.bid_count || 0) + 1,
        reserve_met: auction.reserve_price ? amount >= auction.reserve_price : true
      };

      // Auto-extend if within last 5 minutes
      if (auction.auto_extend) {
        const timeLeft = moment(auction.end_time).diff(moment());
        if (timeLeft < 300000 && timeLeft > 0) {
          updateData.end_time = moment(auction.end_time).add(auction.auto_extend_minutes || 2, 'minutes').toISOString();
          toast.info(`Auction extended by ${auction.auto_extend_minutes || 2} minutes!`);
        }
      }

      await api.entities.Auction.update(auctionId, updateData);

      // Notify previous bidder
      if (auction.current_bidder && auction.current_bidder !== user.email) {
        await api.entities.Notification.create({
          user_email: auction.current_bidder,
          type: 'system',
          title: 'Outbid!',
          message: `You've been outbid on "${auction.title}". New bid: R${amount}`,
          link: createPageUrl('AuctionDetail') + `?id=${auctionId}`
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction']);
      queryClient.invalidateQueries(['auction-bids']);
      toast.success('Bid placed successfully!');
      setBidAmount('');
    }
  });

  const handlePlaceBid = () => {
    const amount = parseFloat(bidAmount);
    const minBid = (auction.current_bid || auction.starting_bid) + (auction.min_increment || 10);
    
    if (amount < minBid) {
      toast.error(`Minimum bid is R${minBid}`);
      return;
    }
    
    placeBidMutation.mutate(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-terracotta-600" />
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-ink/55">Auction not found</p>
      </div>
    );
  }

  const currentBid = auction.current_bid || auction.starting_bid;
  const minNextBid = currentBid + (auction.min_increment || 10);
  const hasStarted = moment().isAfter(auction.start_time);
  const hasEnded = moment().isAfter(auction.end_time);
  const isOwner = user?.email === auction.created_by;
  const canBid = user && !isOwner && hasStarted && !hasEnded && registration?.status !== 'disqualified';

  const poultryLabels = {
    chickens: 'Chickens', ducks: 'Ducks', geese: 'Geese', turkeys: 'Turkeys',
    quail: 'Quail', guinea_fowl: 'Guinea Fowl', peafowl: 'Peafowl', pigeons: 'Pigeons', other: 'Other'
  };

  return (
    <div className="min-h-[80vh] bg-cream">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to={createPageUrl('Auctions')} className="inline-flex items-center text-ink/65 hover:text-ink">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            <ImageCarousel images={auction.images} />

            <Card className="p-6 card-premium">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-terracotta-500/10 text-terracotta-600 border-0">
                      <Gavel className="w-3 h-3 mr-1" />
                      Auction
                    </Badge>
                    <Badge className="bg-moss-50 text-moss-600 border-0">
                      {poultryLabels[auction.poultry_type]}
                    </Badge>
                    {auction.reserve_met && (
                      <Badge className="bg-fresh-50 text-moss-700 border-0">Reserve Met</Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-ink">{auction.title}</h1>
                  {auction.breed && <p className="text-lg text-ink/65">{auction.breed}</p>}
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                {auction.quantity && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cream-deep flex items-center justify-center">
                      <Users className="w-5 h-5 text-ink/55" />
                    </div>
                    <div>
                      <p className="text-xs text-ink/55">Quantity</p>
                      <p className="font-medium">{auction.quantity}</p>
                    </div>
                  </div>
                )}
                {auction.age && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cream-deep flex items-center justify-center">
                      <Clock className="w-5 h-5 text-ink/55" />
                    </div>
                    <div>
                      <p className="text-xs text-ink/55">Age</p>
                      <p className="font-medium">{auction.age}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cream-deep flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-ink/55" />
                  </div>
                  <div>
                    <p className="text-xs text-ink/55">Location</p>
                    <p className="font-medium">{auction.city}, {auction.province}</p>
                  </div>
                </div>
              </div>

              {auction.description && (
                <div className="mb-6">
                  <h3 className="font-semibold text-ink mb-2">Description</h3>
                  <p className="text-ink/65 whitespace-pre-line">{auction.description}</p>
                </div>
              )}

              {auction.health_details && (
                <div className="mb-6">
                  <h3 className="font-semibold text-ink mb-2">Health Information</h3>
                  <p className="text-ink/65">{auction.health_details}</p>
                </div>
              )}

              {auction.terms_conditions && (
                <div>
                  <h3 className="font-semibold text-ink mb-2">Terms & Conditions</h3>
                  <p className="text-ink/65 text-sm whitespace-pre-line">{auction.terms_conditions}</p>
                </div>
              )}
            </Card>

            {/* Bid History */}
            <Card className="p-6 card-premium">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-ink/55" />
                <h3 className="font-semibold text-ink">Bid History</h3>
              </div>
              {bids.length === 0 ? (
                <p className="text-ink/55 text-center py-8">No bids yet. Be the first!</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {bids.map((bid, index) => (
                    <div key={bid.id} className={`flex items-center justify-between p-3 rounded-lg ${index === 0 ? 'bg-terracotta-500/10 border border-terracotta-500/20' : 'bg-cream'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cream-deep flex items-center justify-center text-sm font-medium">
                          {bid.bidder_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-medium text-ink">{bid.bidder_name || 'Anonymous'}</p>
                          <p className="text-xs text-ink/55">{moment(bid.created_date).format('MMM D, h:mm A')}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${index === 0 ? 'text-terracotta-600' : 'text-ink/75'}`}>R{bid.amount.toLocaleString()}</p>
                        {index === 0 && <Badge className="bg-terracotta-500 text-white text-xs">Highest</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right - Bidding Panel */}
          <div className="sticky top-24">
            <Card className="p-6 card-premium">
              {hasEnded ? (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-cream-deep flex items-center justify-center mx-auto mb-4">
                    <Gavel className="w-8 h-8 text-ink/40" />
                  </div>
                  <h3 className="text-xl font-bold text-ink mb-2">Auction Ended</h3>
                  {auction.winner_name ? (
                    <div className="bg-fresh-50 rounded-lg p-4 mt-4">
                      <p className="text-sm text-ink/65">Winner</p>
                      <p className="font-semibold text-ink">{auction.winner_name}</p>
                      <p className="text-2xl font-bold text-moss-700 mt-2">R{auction.final_price?.toLocaleString()}</p>
                    </div>
                  ) : (
                    <p className="text-ink/55">No bids received</p>
                  )}
                </div>
              ) : !hasStarted ? (
                <div className="text-center">
                  <Clock className="w-12 h-12 text-moss-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-ink mb-2">Starts Soon</h3>
                  <p className="text-ink/65 mb-4">{moment(auction.start_time).format('MMM D, YYYY h:mm A')}</p>
                  <p className="text-sm text-ink/55">{moment(auction.start_time).fromNow()}</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-sm text-ink/55 mb-1">Time Remaining</p>
                    <LiveCountdown endTime={auction.end_time} onEnd={() => queryClient.invalidateQueries(['auction'])} />
                  </div>

                  <div className="bg-cream rounded-lg p-4 mb-6">
                    <p className="text-sm text-ink/55 mb-1">{auction.bid_count > 0 ? 'Current Bid' : 'Starting Bid'}</p>
                    <p className="text-4xl font-bold text-terracotta-600">R{currentBid.toLocaleString()}</p>
                    <p className="text-sm text-ink/55 mt-2">{auction.bid_count || 0} bids • {auction.view_count || 0} views</p>
                  </div>

                  {!user ? (
                    <Button onClick={() => api.auth.redirectToLogin(window.location.href)} className="w-full btn-cta">
                      Login to Bid
                    </Button>
                  ) : isOwner ? (
                    <div className="bg-moss-50 rounded-lg p-4 text-center">
                      <p className="text-moss-800">This is your auction</p>
                    </div>
                  ) : !registration ? (
                    <Button onClick={() => registerMutation.mutate()} disabled={registerMutation.isPending} className="w-full btn-cta">
                      {registerMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Register to Bid
                    </Button>
                  ) : registration.status === 'disqualified' ? (
                    <div className="bg-terracotta-50 rounded-lg p-4 text-center">
                      <AlertCircle className="w-6 h-6 text-terracotta-500 mx-auto mb-2" />
                      <p className="text-terracotta-700">You have been disqualified from this auction</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-ink/55 mb-2">Your Bid (Min: R{minNextBid.toLocaleString()})</p>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            placeholder={`R${minNextBid}`}
                            min={minNextBid}
                          />
                          <Button
                            onClick={handlePlaceBid}
                            disabled={!bidAmount || placeBidMutation.isPending}
                            className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-8"
                          >
                            {placeBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Bid'}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {[minNextBid, minNextBid + 50, minNextBid + 100].map((amount) => (
                          <Button key={amount} variant="outline" size="sm" onClick={() => setBidAmount(amount.toString())} className="flex-1">
                            R{amount}
                          </Button>
                        ))}
                      </div>
                      {auction.auto_extend && (
                        <p className="text-xs text-ink/55 text-center">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          Auto-extends {auction.auto_extend_minutes || 2}min on last-minute bids
                        </p>
                      )}
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