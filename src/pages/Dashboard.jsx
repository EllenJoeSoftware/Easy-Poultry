import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Package, Eye, MessageCircle, Heart, TrendingUp, Loader2, CheckCircle2, Archive, Star, BarChart3, ShoppingBag, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ListingCard from '../components/marketplace/ListingCard';
import FeatureListingModal from '../components/listings/FeatureListingModal';
import SellerAnalytics from '../components/dashboard/SellerAnalytics';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [selectedListingToFeature, setSelectedListingToFeature] = useState(null);
  const [markSoldDialog, setMarkSoldDialog] = useState(null);
  const [soldQuantity, setSoldQuantity] = useState('');

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

    // Check for payment success in URL
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('listing_id');
    if (urlParams.get('feature_payment_success') === 'true' && listingId) {
      // Activate feature immediately as fallback to webhook
      const activateFeature = async () => {
        try {
          const listings = await api.entities.Listing.filter({ id: listingId });
          if (listings.length > 0 && !listings[0].featured) {
            const now = new Date();
            const featureEnds = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
            await api.entities.Listing.update(listingId, {
              featured: true,
              featured_until: featureEnds.toISOString()
            });
          }
          toast.success('Payment successful! Your listing is now featured.');
          queryClient.invalidateQueries(['my-listings']);
        } catch (error) {
          console.error('Feature activation error:', error);
          toast.success('Payment received! Feature will activate shortly.');
        }
      };
      activateFeature();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [queryClient]);

  const { data: myListings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.entities.Listing.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  const { data: savedListings = [] } = useQuery({
    queryKey: ['saved-listings'],
    queryFn: async () => {
      const saved = await api.entities.SavedListing.filter({ created_by: user?.email });
      const listingIds = saved.map(s => s.listing_id);
      if (listingIds.length === 0) return [];
      const allListings = await api.entities.Listing.list();
      return allListings.filter(l => listingIds.includes(l.id));
    },
    enabled: !!user
  });

  const { data: myInquiries = [] } = useQuery({
    queryKey: ['my-inquiries'],
    queryFn: () => api.entities.Inquiry.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  const { data: receivedInquiries = [] } = useQuery({
    queryKey: ['received-inquiries'],
    queryFn: () => api.entities.Inquiry.filter({ seller_id: user?.email }, '-created_date'),
    enabled: !!user && (user?.user_type === 'seller' || user?.user_type === 'both')
  });

  const { data: recentTransactions = [] } = useQuery({
    queryKey: ['recent-transactions'],
    queryFn: async () => {
      const [featurePayments, tierPayments, verificationPayments] = await Promise.all([
        api.entities.FeaturePayment.filter({ seller_id: user?.email }, '-created_date', 10),
        api.entities.TierUpgradePayment.filter({ seller_id: user?.email }, '-created_date', 10),
        api.entities.VerificationPayment.filter({ seller_id: user?.email }, '-created_date', 10)
      ]);

      const transactions = [
        ...featurePayments.map(p => ({ ...p, type: 'Feature Listing', amount: p.amount_paid })),
        ...tierPayments.map(p => ({ ...p, type: `Tier Upgrade (${p.to_tier})`, amount: p.amount_paid })),
        ...verificationPayments.map(p => ({ ...p, type: 'Seller Verification', amount: p.amount_paid }))
      ];

      return transactions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10);
    },
    enabled: !!user && (user?.user_type === 'seller' || user?.user_type === 'both')
  });

  const markAsSoldMutation = useMutation({
    mutationFn: ({ id, quantity, listing }) => {
      const newStockQuantity = listing.stock_quantity - quantity;
      const newSoldQuantity = (listing.sold_quantity || 0) + quantity;
      const newStatus = newStockQuantity === 0 ? 'sold' : 'active';
      
      return api.entities.Listing.update(id, { 
        stock_quantity: newStockQuantity,
        sold_quantity: newSoldQuantity,
        status: newStatus,
        sold_date: newStatus === 'sold' ? new Date().toISOString() : listing.sold_date
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-listings']);
      queryClient.invalidateQueries(['my-listings-finance']);
      toast.success('Sale recorded successfully');
      setMarkSoldDialog(null);
      setSoldQuantity('');
    }
  });

  const handleMarkSold = () => {
    const quantity = parseInt(soldQuantity);
    if (!quantity || quantity <= 0 || quantity > markSoldDialog.stock_quantity) {
      toast.error('Please enter a valid quantity');
      return;
    }
    markAsSoldMutation.mutate({ 
      id: markSoldDialog.id, 
      quantity,
      listing: markSoldDialog
    });
  };

  const replyMutation = useMutation({
    mutationFn: async ({ inquiryId, message, inquiry }) => {
      const responses = inquiry.responses || [];
      responses.push({
        from: user.email,
        message,
        timestamp: new Date().toISOString()
      });
      await api.entities.Inquiry.update(inquiryId, {
        responses,
        status: 'responded'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['received-inquiries']);
      queryClient.invalidateQueries(['my-inquiries']);
      toast.success('Reply sent');
      setReplyingTo(null);
      setReplyMessage('');
    }
  });

  const handleReply = (inquiry) => {
    if (!replyMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    replyMutation.mutate({ inquiryId: inquiry.id, message: replyMessage, inquiry });
  };

  const handleFeatureListing = (listing) => {
    setSelectedListingToFeature(listing);
    setFeatureModalOpen(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  const isSeller = user.user_type === 'seller' || user.user_type === 'both';
  const activeListings = myListings.filter(l => l.status === 'active');
  const soldListings = myListings.filter(l => l.status === 'sold');
  const totalViews = myListings.reduce((sum, l) => sum + (l.view_count || 0), 0);
  const totalInquiries = receivedInquiries.length;
  const totalRevenue = soldListings.reduce((sum, l) => sum + (l.price || 0) * (l.sold_quantity || l.stock_quantity || 0), 0);
  const firstName = (user.full_name || user.email || 'there').split(' ')[0];

  return (
    <PageShell
      eyebrow={`Welcome back, ${firstName}`}
      title={isSeller ? 'Your seller dashboard' : 'Your account'}
      subtitle={isSeller
        ? 'Track listings, inquiries and sales — all in one place.'
        : 'Saved listings, inquiries you sent, and your account.'}
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Dashboard' }]}
      action={
        isSeller && user.seller_activated && (
          <Link to={createPageUrl('CreateListing')}>
            <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5">
              <Plus className="w-4 h-4" />
              New listing
            </Button>
          </Link>
        )
      }
    >
      {isSeller && !user.seller_activated && (
        <div className="mb-8 flex items-start gap-3 p-4 rounded-2xl bg-yolk-50 border border-yolk-100">
          <AlertCircle className="w-5 h-5 text-yolk-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-ink">Seller account pending activation</p>
            <p className="text-sm text-ink/60 mt-0.5">An admin will review your account shortly. You can still browse and message buyers.</p>
          </div>
        </div>
      )}

      {/* Stats row */}
      {isSeller && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard icon={Package}       label="Active listings" value={activeListings.length}                                      tint="moss" />
          <StatCard icon={Eye}           label="Total views"     value={totalViews.toLocaleString()}                                tint="sage" />
          <StatCard icon={MessageCircle} label="Inquiries"       value={totalInquiries}                                             tint="terracotta" />
          <StatCard icon={ShoppingBag}   label="Revenue"         value={`R${totalRevenue.toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`} tint="yolk" />
        </div>
      )}

      <div>
        {isSeller && (
          <SellerAnalytics userEmail={user.email} />
        )}

        {isSeller && recentTransactions.length > 0 && (
          <Card className="p-6 border-0 shadow-lg mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Transactions</h2>
            <div className="divide-y">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.type}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(transaction.created_date).toLocaleDateString()} • {transaction.payment_reference || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">R{transaction.amount?.toFixed(2)}</p>
                    <Badge className={
                      transaction.status === 'verified' ? 'bg-green-500' :
                      transaction.status === 'pending' ? 'bg-yellow-500' :
                      transaction.status === 'active' ? 'bg-blue-500' :
                      'bg-gray-500'
                    }>
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Tabs defaultValue={isSeller ? "listings" : "saved"} className="space-y-6 mt-8">
          <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
            {isSeller && <TabsTrigger value="listings" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream data-[state=active]:shadow-soft">Active listings</TabsTrigger>}
            {isSeller && <TabsTrigger value="sold" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Sold history</TabsTrigger>}
            <TabsTrigger value="saved" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Saved</TabsTrigger>
            {isSeller && <TabsTrigger value="inquiries" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Inquiries</TabsTrigger>}
            <TabsTrigger value="my-inquiries" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">My inquiries</TabsTrigger>
          </TabsList>

          {isSeller && (
            <TabsContent value="listings">
              {activeListings.length === 0 ? (
                <EmptyState
                  icon={Package}
                  title="No active listings"
                  subtitle="Start selling by creating your first listing. Free to list, free to message buyers."
                  action={user.seller_activated && (
                    <Link to={createPageUrl('CreateListing')}>
                      <Button className="btn-cta px-5 py-2.5 text-sm gap-1.5">
                        <Plus className="w-4 h-4" />
                        Create your first listing
                      </Button>
                    </Link>
                  )}
                />
              ) : (
                <div className="space-y-4">
                  {activeListings.map((listing) => (
                    <Card key={listing.id} className="p-6 border-0 shadow-lg">
                      <div className="flex gap-6">
                        <img
                          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200'}
                          alt={listing.title}
                          className="w-32 h-32 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{listing.title}</h3>
                              {listing.breed && <p className="text-gray-600">{listing.breed}</p>}
                            </div>
                            <Badge className={listing.featured ? 'bg-yellow-500' : ''}>
                              {listing.featured ? 'Featured' : listing.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {listing.view_count || 0} views
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-4 h-4" />
                              {listing.inquiry_count || 0} inquiries
                            </span>
                            <span className="font-semibold text-[#E07A5F]">R{listing.price}</span>
                            <span className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {listing.stock_quantity} available
                            </span>
                          </div>
                          <div className="flex gap-3 flex-wrap">
                            <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`}>
                              <Button variant="outline" size="sm">View</Button>
                            </Link>
                            <Link to={createPageUrl('EditListing') + `?id=${listing.id}`}>
                              <Button variant="outline" size="sm">Edit</Button>
                            </Link>
                            {!listing.featured && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFeatureListing(listing)}
                                className="text-yellow-600 hover:text-yellow-700"
                              >
                                <Star className="w-4 h-4 mr-2" />
                                Feature
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setMarkSoldDialog(listing);
                                setSoldQuantity(listing.stock_quantity.toString());
                              }}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              Mark as Sold
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {isSeller && (
            <TabsContent value="sold">
              {soldListings.length === 0 ? (
                <EmptyState
                  icon={Archive}
                  title="No sold items yet"
                  subtitle="Your sold items history will appear here once you've made your first sale."
                />
              ) : (
                <div className="space-y-4">
                  {soldListings.map((listing) => (
                    <Card key={listing.id} className="p-6 border-0 shadow-lg opacity-75">
                      <div className="flex gap-6">
                        <img
                          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200'}
                          alt={listing.title}
                          className="w-32 h-32 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">{listing.title}</h3>
                              {listing.breed && <p className="text-gray-600">{listing.breed}</p>}
                            </div>
                            <Badge variant="secondary">Sold</Badge>
                          </div>
                          <div className="flex items-center gap-6 text-sm text-gray-600">
                            <span className="font-semibold">R{listing.price}</span>
                            <span>Sold: {listing.sold_quantity || listing.stock_quantity} items</span>
                            {listing.sold_date && (
                              <span>on {new Date(listing.sold_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="saved">
            {savedListings.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No saved listings"
                subtitle="Save listings you're interested in by clicking the heart icon to view them here."
                action={
                  <Link to={createPageUrl('Marketplace')}>
                    <Button className="btn-cta px-5 py-2.5 text-sm">Browse marketplace</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} isSaved={true} />
                ))}
              </div>
            )}
          </TabsContent>

          {isSeller && (
            <TabsContent value="inquiries">
              <Card className="border-border shadow-soft rounded-2xl overflow-hidden">
                {receivedInquiries.length === 0 ? (
                  <EmptyState
                    variant="plain"
                    icon={MessageCircle}
                    title="No inquiries yet"
                    subtitle="Buyer inquiries about your listings will appear here."
                  />
                ) : (
                  <div className="divide-y">
                    {receivedInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-gray-900">{inquiry.created_by}</p>
                            {inquiry.buyer_contact && (
                              <p className="text-sm text-gray-600">{inquiry.buyer_contact}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant={inquiry.status === 'pending' ? 'secondary' : 'default'}>
                              {inquiry.status}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(inquiry.created_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <p className="text-gray-700">{inquiry.message}</p>
                        </div>

                        {inquiry.responses?.length > 0 && (
                          <div className="space-y-3 mb-4">
                            {inquiry.responses.map((response, idx) => (
                              <div key={idx} className={`rounded-lg p-4 ${
                                response.from === user.email ? 'bg-[#7A9D7A]/10' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {response.from === user.email ? 'You' : response.from}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(response.timestamp).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-700">{response.message}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {replyingTo === inquiry.id ? (
                          <div className="space-y-3">
                            <Textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Type your reply..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleReply(inquiry)}
                                disabled={replyMutation.isPending}
                                size="sm"
                                className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                              >
                                Send Reply
                              </Button>
                              <Button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyMessage('');
                                }}
                                variant="outline"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            onClick={() => setReplyingTo(inquiry.id)}
                            variant="outline"
                            size="sm"
                          >
                            Reply
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>
          )}

          <TabsContent value="my-inquiries">
            <Card className="border-border shadow-soft rounded-2xl overflow-hidden">
              {myInquiries.length === 0 ? (
                <EmptyState
                  variant="plain"
                  icon={MessageCircle}
                  title="No inquiries sent"
                  subtitle="When you contact a seller from a listing, your message thread will appear here."
                  action={
                    <Link to={createPageUrl('Marketplace')}>
                      <Button className="btn-cta px-5 py-2.5 text-sm">Find listings</Button>
                    </Link>
                  }
                />
              ) : (
                <div className="divide-y">
                  {myInquiries.map((inquiry) => (
                    <div key={inquiry.id} className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-gray-900">To: {inquiry.seller_id}</p>
                          <p className="text-sm text-gray-600">Listing: {inquiry.listing_id}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant={inquiry.status === 'pending' ? 'secondary' : 'default'}>
                            {inquiry.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(inquiry.created_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <p className="text-gray-700">{inquiry.message}</p>
                      </div>

                      {inquiry.responses?.length > 0 && (
                        <div className="space-y-3">
                          {inquiry.responses.map((response, idx) => (
                            <div key={idx} className={`rounded-lg p-4 ${
                              response.from === user.email ? 'bg-[#7A9D7A]/10' : 'bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {response.from === user.email ? 'You' : 'Seller'}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(response.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700">{response.message}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedListingToFeature && (
        <FeatureListingModal
          listing={selectedListingToFeature}
          isOpen={featureModalOpen}
          onClose={() => {
            setFeatureModalOpen(false);
            setSelectedListingToFeature(null);
          }}
        />
      )}

      {markSoldDialog && (
        <Dialog open={!!markSoldDialog} onOpenChange={() => setMarkSoldDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">{markSoldDialog.title}</p>
                <p className="text-sm text-gray-600">Available: {markSoldDialog.stock_quantity} items</p>
                {markSoldDialog.sold_quantity > 0 && (
                  <p className="text-sm text-gray-600">Previously sold: {markSoldDialog.sold_quantity} items</p>
                )}
              </div>
              <div>
                <Label htmlFor="sold_quantity">Quantity Sold</Label>
                <Input
                  id="sold_quantity"
                  type="number"
                  min="1"
                  max={markSoldDialog.stock_quantity}
                  value={soldQuantity}
                  onChange={(e) => setSoldQuantity(e.target.value)}
                  placeholder="Enter quantity sold"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  Sale Value: R{(markSoldDialog.price * (parseInt(soldQuantity) || 0)).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleMarkSold}
                  disabled={markAsSoldMutation.isPending}
                  className="flex-1 bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                >
                  {markAsSoldMutation.isPending ? 'Recording...' : 'Confirm Sale'}
                </Button>
                <Button
                  onClick={() => setMarkSoldDialog(null)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageShell>
  );
}