import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Gavel, Plus, Clock, CheckCircle2, XCircle, Eye, Users, Loader2, Edit, Trash2, MessageCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import moment from 'moment';
import ChatButton from '../components/chat/ChatButton';

export default function MyAuctions() {
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

  const { data: auctions = [], isLoading } = useQuery({
    queryKey: ['my-auctions', user?.email],
    queryFn: () => api.entities.Auction.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  const { data: registrations = [] } = useQuery({
    queryKey: ['my-auction-registrations', user?.email],
    queryFn: () => api.entities.AuctionRegistration.filter({ auction_id: auctions.map(a => a.id) }),
    enabled: auctions.length > 0
  });

  const cancelAuctionMutation = useMutation({
    mutationFn: (auctionId) => api.entities.Auction.update(auctionId, { status: 'cancelled' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-auctions']);
      toast.success('Auction cancelled');
    }
  });

  const markCollectedMutation = useMutation({
    mutationFn: (auctionId) => api.entities.Auction.update(auctionId, { 
      item_collected: true,
      collection_date: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-auctions']);
      toast.success('Marked as collected');
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-cream-deep text-ink/70',
      pending_payment: 'bg-yolk-50 text-yolk-700',
      awaiting_verification: 'bg-moss-100 text-moss-800',
      active: 'bg-fresh-50 text-moss-700',
      ended: 'bg-cream-deep text-ink/70',
      cancelled: 'bg-terracotta-50 text-terracotta-600',
      rejected: 'bg-terracotta-50 text-terracotta-600'
    };
    const labels = {
      draft: 'Draft',
      pending_payment: 'Pending Payment',
      awaiting_verification: 'Awaiting Verification',
      active: 'Active',
      ended: 'Ended',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    return <Badge className={styles[status]}>{labels[status]}</Badge>;
  };

  const activeAuctions = auctions.filter(a => a.status === 'active');
  const pendingAuctions = auctions.filter(a => ['draft', 'pending_payment', 'awaiting_verification'].includes(a.status));
  const endedAuctions = auctions.filter(a => ['ended', 'cancelled', 'rejected'].includes(a.status));

  const AuctionItem = ({ auction, showActions = true }) => {
    const auctionRegs = registrations.filter(r => r.auction_id === auction.id);
    const hasEnded = moment().isAfter(auction.end_time);

    return (
      <Card key={auction.id} className="p-6 card-premium">
        <div className="flex gap-6">
          <img
            src={auction.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200'}
            alt={auction.title}
            className="w-32 h-32 rounded-lg object-cover"
          />
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-display text-xl font-semibold text-ink">{auction.title}</h3>
                {auction.breed && <p className="text-ink/65">{auction.breed}</p>}
              </div>
              {getStatusBadge(auction.status)}
            </div>
            
            <div className="flex items-center gap-6 text-sm text-ink/65 mb-4">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {auction.view_count || 0} views
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {auction.bid_count || 0} bids
              </span>
              <span className="font-semibold text-terracotta-600">
                R{(auction.current_bid || auction.starting_bid).toLocaleString()}
              </span>
            </div>

            {auction.status === 'active' && !hasEnded && (
              <p className="text-sm text-ink/55 mb-4">
                Ends: {moment(auction.end_time).format('MMM D, h:mm A')} ({moment(auction.end_time).fromNow()})
              </p>
            )}

            {auction.status === 'ended' && auction.winner_email && (
              <div className="bg-fresh-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-ink/65">Winner: <span className="font-semibold">{auction.winner_name}</span></p>
                <p className="text-sm text-ink/65">Final Price: <span className="font-bold text-moss-700">R{auction.final_price?.toLocaleString()}</span></p>
                {!auction.item_collected && (
                  <div className="flex items-center gap-2 mt-2">
                    <ChatButton sellerEmail={auction.winner_email} variant="outline" className="text-sm h-8" />
                    <Button size="sm" onClick={() => markCollectedMutation.mutate(auction.id)} className="bg-moss-600 hover:bg-moss-700 h-8">
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Mark Collected
                    </Button>
                  </div>
                )}
                {auction.item_collected && (
                  <Badge className="bg-fresh-50 text-moss-700 mt-2">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Collected
                  </Badge>
                )}
              </div>
            )}

            {showActions && (
              <div className="flex gap-3 flex-wrap">
                <Link to={createPageUrl('AuctionDetail') + `?id=${auction.id}`}>
                  <Button variant="outline" size="sm">View</Button>
                </Link>
                {auction.status === 'pending_payment' && (
                  <Link to={createPageUrl('AuctionPayment') + `?auctionId=${auction.id}`}>
                    <Button size="sm" className="bg-terracotta-500 hover:bg-terracotta-600 text-white">
                      Complete Payment
                    </Button>
                  </Link>
                )}
                {['draft', 'pending_payment'].includes(auction.status) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => cancelAuctionMutation.mutate(auction.id)}
                    className="text-terracotta-600 hover:text-terracotta-700"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-[80vh] bg-cream">
      <div className="bg-terracotta-gradient text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">My Auctions</h1>
              <p className="text-white/90">Manage your auction houses</p>
            </div>
            <Link to={createPageUrl('CreateAuction')}>
              <Button className="bg-white text-terracotta-600 hover:bg-cream-deep">
                <Plus className="w-4 h-4 mr-2" />
                Create Auction
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="active">Active ({activeAuctions.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({pendingAuctions.length})</TabsTrigger>
            <TabsTrigger value="ended">Ended ({endedAuctions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-terracotta-600" />
              </div>
            ) : activeAuctions.length === 0 ? (
              <Card className="p-12 text-center card-premium">
                <Gavel className="w-16 h-16 text-ink/25 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-ink mb-2">No active auctions</h3>
                <p className="text-ink/65 mb-6">Create your first auction to get started</p>
                <Link to={createPageUrl('CreateAuction')}>
                  <Button className="bg-terracotta-500 hover:bg-terracotta-600 text-white">Create Auction</Button>
                </Link>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeAuctions.map((auction) => (
                  <AuctionItem key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingAuctions.length === 0 ? (
              <Card className="p-12 text-center card-premium">
                <Clock className="w-16 h-16 text-ink/25 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-ink mb-2">No pending auctions</h3>
              </Card>
            ) : (
              <div className="space-y-4">
                {pendingAuctions.map((auction) => (
                  <AuctionItem key={auction.id} auction={auction} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="ended">
            {endedAuctions.length === 0 ? (
              <Card className="p-12 text-center card-premium">
                <CheckCircle2 className="w-16 h-16 text-ink/25 mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-ink mb-2">No ended auctions</h3>
              </Card>
            ) : (
              <div className="space-y-4">
                {endedAuctions.map((auction) => (
                  <AuctionItem key={auction.id} auction={auction} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}