import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, Plus, Calendar, Package, Eye, Loader2, Clock, CheckCircle2, Gavel, AlertTriangle, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import moment from 'moment';

export default function MyAuctionHouse() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const { data: myHouse, isLoading } = useQuery({
    queryKey: ['my-auction-house', user?.email],
    queryFn: async () => {
      const houses = await api.entities.AuctionHouse.filter({ created_by: user?.email });
      return houses[0];
    },
    enabled: !!user
  });

  const { data: events = [] } = useQuery({
    queryKey: ['my-auction-events', myHouse?.id],
    queryFn: () => api.entities.AuctionEvent.filter({ auction_house_id: myHouse?.id }, '-created_date'),
    enabled: !!myHouse?.id
  });

  const { data: items = [] } = useQuery({
    queryKey: ['my-auction-items', myHouse?.id],
    queryFn: () => api.entities.AuctionItem.filter({ auction_house_id: myHouse?.id }),
    enabled: !!myHouse?.id
  });

  const { data: tier } = useQuery({
    queryKey: ['my-auction-house-tier', myHouse?.tier_id],
    queryFn: async () => {
      if (!myHouse?.tier_id) return null;
      const tiers = await api.entities.AuctionHouseTier.filter({ id: myHouse.tier_id });
      return tiers[0];
    },
    enabled: !!myHouse?.tier_id
  });

  // Check subscription status
  const isExpired = myHouse?.subscription_end && moment().isAfter(myHouse.subscription_end);
  const daysUntilExpiry = myHouse?.subscription_end ? moment(myHouse.subscription_end).diff(moment(), 'days') : null;
  const needsRenewal = daysUntilExpiry !== null && daysUntilExpiry <= 5;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  if (!myHouse) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">No Auction House Yet</h1>
          <p className="text-gray-600 mb-8">Create your auction house to start hosting auctions and selling your poultry.</p>
          <Link to={createPageUrl('CreateAuctionHouse')}>
            <Button className="bg-[#E07A5F] hover:bg-[#D06A4F]">
              <Plus className="w-4 h-4 mr-2" />
              Create Auction House
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending_payment: 'bg-yellow-100 text-yellow-700',
      awaiting_verification: 'bg-blue-100 text-blue-700',
      active: 'bg-green-100 text-green-700',
      suspended: 'bg-red-100 text-red-700'
    };
    return <Badge className={styles[status]}>{status.replace('_', ' ')}</Badge>;
  };

  const liveEvents = events.filter(e => e.status === 'live');
  const scheduledEvents = events.filter(e => e.status === 'scheduled');
  const endedEvents = events.filter(e => e.status === 'ended');
  
  const maxLiveAuctions = tier?.max_live_auctions || 1;
  const canCreateAuction = liveEvents.length < maxLiveAuctions && !isExpired;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#E07A5F] to-[#D06A4F] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {myHouse.logo_url ? (
                <img src={myHouse.logo_url} alt={myHouse.name} className="w-20 h-20 rounded-xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center">
                  <Building2 className="w-10 h-10 text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{myHouse.name}</h1>
                  {getStatusBadge(myHouse.status)}
                </div>
                {myHouse.city && <p className="text-white/80">{myHouse.city}, {myHouse.province}</p>}
              </div>
            </div>
            {myHouse.status === 'active' && !isExpired && (
              <div className="flex gap-2">
                {canCreateAuction ? (
                  <Link to={createPageUrl('CreateAuctionEvent') + `?houseId=${myHouse.id}`}>
                    <Button className="bg-white text-[#E07A5F] hover:bg-gray-100">
                      <Plus className="w-4 h-4 mr-2" />
                      New Auction
                    </Button>
                  </Link>
                ) : (
                  <Button disabled className="bg-white/50 text-gray-500">
                    Max {maxLiveAuctions} live auction{maxLiveAuctions > 1 ? 's' : ''} reached
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Alerts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
        {myHouse.status !== 'active' && (
          <Card className="p-4 border-0 shadow bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {myHouse.status === 'pending_payment' && 'Complete payment to activate your auction house'}
                  {myHouse.status === 'awaiting_verification' && 'Your payment is being verified (24-48 hours)'}
                  {myHouse.status === 'expired' && 'Your subscription has expired'}
                </p>
                {(myHouse.status === 'pending_payment' || myHouse.status === 'expired') && (
                  <Link to={createPageUrl('AuctionHousePayment') + `?houseId=${myHouse.id}&tierId=${myHouse.tier_id}&renewal=true`}>
                    <Button size="sm" className="mt-2 bg-yellow-600 hover:bg-yellow-700">
                      {myHouse.status === 'expired' ? 'Renew Subscription' : 'Complete Payment'}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </Card>
        )}

        {isExpired && myHouse.status === 'active' && (
          <Card className="p-4 border-0 shadow bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Your subscription has expired! Renew to continue hosting auctions.</p>
                <Link to={createPageUrl('AuctionHousePayment') + `?houseId=${myHouse.id}&tierId=${myHouse.tier_id}&renewal=true`}>
                  <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700">Renew Now</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {needsRenewal && !isExpired && myHouse.status === 'active' && (
          <Card className="p-4 border-0 shadow bg-orange-50 border-orange-200">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  Your subscription expires in {daysUntilExpiry} day{daysUntilExpiry !== 1 ? 's' : ''} ({moment(myHouse.subscription_end).format('MMM D, YYYY')})
                </p>
                <Link to={createPageUrl('AuctionHousePayment') + `?houseId=${myHouse.id}&tierId=${myHouse.tier_id}&renewal=true`}>
                  <Button size="sm" className="mt-2 bg-orange-600 hover:bg-orange-700">Renew Subscription</Button>
                </Link>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-5 gap-4 mb-8">
          <Card className="p-4 border-0 shadow">
            <Calendar className="w-6 h-6 text-[#E07A5F] mb-2" />
            <p className="text-2xl font-bold">{events.length}</p>
            <p className="text-sm text-gray-600">Total Auctions</p>
          </Card>
          <Card className="p-4 border-0 shadow">
            <Gavel className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{liveEvents.length} / {maxLiveAuctions}</p>
            <p className="text-sm text-gray-600">Live Auctions</p>
          </Card>
          <Card className="p-4 border-0 shadow">
            <Package className="w-6 h-6 text-[#7A9D7A] mb-2" />
            <p className="text-2xl font-bold">{items.length}</p>
            <p className="text-sm text-gray-600">Total Items</p>
          </Card>
          <Card className="p-4 border-0 shadow">
            <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold">R{items.filter(i => i.status === 'sold').reduce((sum, i) => sum + (i.final_price || 0), 0).toLocaleString()}</p>
            <p className="text-sm text-gray-600">Total Sales</p>
          </Card>
          <Card className="p-4 border-0 shadow bg-gradient-to-br from-[#E07A5F]/10 to-[#E07A5F]/5">
            <CreditCard className="w-6 h-6 text-[#E07A5F] mb-2" />
            <p className="text-lg font-bold">{tier?.name || 'Basic'}</p>
            <p className="text-sm text-gray-600">
              {myHouse.subscription_end ? `Expires ${moment(myHouse.subscription_end).format('MMM D')}` : 'Current Plan'}
            </p>
          </Card>
        </div>

        {(myHouse.status === 'active' || isExpired) && (
          <Tabs defaultValue="live" className="space-y-6">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger value="live">Live ({liveEvents.length})</TabsTrigger>
              <TabsTrigger value="scheduled">Scheduled ({scheduledEvents.length})</TabsTrigger>
              <TabsTrigger value="ended">Ended ({endedEvents.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="live">
              {liveEvents.length === 0 ? (
                <Card className="p-12 text-center border-0 shadow">
                  <Gavel className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No live auctions</h3>
                  <p className="text-gray-600 mb-6">Create an auction to start selling</p>
                  <Link to={createPageUrl('CreateAuctionEvent') + `?houseId=${myHouse.id}`}>
                    <Button className="bg-[#E07A5F] hover:bg-[#D06A4F]">Create Auction</Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {liveEvents.map((event) => (
                    <EventCard key={event.id} event={event} items={items.filter(i => i.auction_event_id === event.id)} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="scheduled">
              {scheduledEvents.length === 0 ? (
                <Card className="p-12 text-center border-0 shadow">
                  <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No scheduled auctions</h3>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {scheduledEvents.map((event) => (
                    <EventCard key={event.id} event={event} items={items.filter(i => i.auction_event_id === event.id)} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="ended">
              {endedEvents.length === 0 ? (
                <Card className="p-12 text-center border-0 shadow">
                  <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No ended auctions</h3>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {endedEvents.map((event) => (
                    <EventCard key={event.id} event={event} items={items.filter(i => i.auction_event_id === event.id)} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function EventCard({ event, items }) {
  return (
    <Card className="p-6 border-0 shadow">
      <div className="flex gap-6">
        <img
          src={event.cover_image_url || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200'}
          alt={event.title}
          className="w-40 h-28 rounded-lg object-cover"
        />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-xl font-semibold">{event.title}</h3>
              <p className="text-sm text-gray-600">{moment(event.start_time).format('MMM D, h:mm A')} - {moment(event.end_time).format('MMM D, h:mm A')}</p>
            </div>
            <Badge className={event.status === 'live' ? 'bg-green-500' : event.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-500'}>
              {event.status}
            </Badge>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-1"><Package className="w-4 h-4" /> {items.length} items</span>
            <span className="flex items-center gap-1"><Gavel className="w-4 h-4" /> {items.reduce((s, i) => s + (i.bid_count || 0), 0)} bids</span>
            <span className="flex items-center gap-1"><Eye className="w-4 h-4" /> {event.view_count || 0} views</span>
          </div>
          <div className="flex gap-2">
            <Link to={createPageUrl('ManageAuctionEvent') + `?eventId=${event.id}`}>
              <Button size="sm" variant="outline">Manage</Button>
            </Link>
            <Link to={createPageUrl('AuctionEventDetail') + `?id=${event.id}`}>
              <Button size="sm" variant="outline">View</Button>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  );
}