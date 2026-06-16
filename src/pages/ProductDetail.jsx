import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { ArrowLeft, MapPin, Calendar, Package, DollarSign, Loader2, User, Phone, MessageCircle, Mail, Clock, Download, FileText, ShieldCheck, ExternalLink, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ImageCarousel from '../components/marketplace/ImageCarousel';
import { createPageUrl } from '../utils';
import { ReviewSummary, ReviewForm } from '../components/reviews/SellerReviews';
import ChatButton from '../components/chat/ChatButton';

import { toast } from 'sonner';

function VerifiedSellerContact({ sellerProfile, onInquire }) {
  const [showPhone, setShowPhone] = useState(false);

  return (
    <div className="space-y-2">
      {(sellerProfile.whatsapp_number || sellerProfile.contact_number) && (
        <a
          href={`https://wa.me/${(sellerProfile.whatsapp_number || sellerProfile.contact_number).replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5C] text-white h-11 rounded-md font-medium"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp Seller
        </a>
      )}
      <div className="grid grid-cols-2 gap-2">
        {sellerProfile.contact_number && (
          showPhone ? (
            <a
              href={`tel:${sellerProfile.contact_number}`}
              className="flex items-center justify-center gap-2 h-11 border rounded-md bg-gray-50 font-medium text-gray-900 hover:bg-gray-100"
            >
              {sellerProfile.contact_number}
            </a>
          ) : (
            <Button
              onClick={() => setShowPhone(true)}
              variant="outline"
              className="h-11"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
          )
        )}
        <Button
          onClick={onInquire}
          variant="outline"
          className="h-11"
        >
          <Mail className="w-4 h-4 mr-2" />
          Inquire
        </Button>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const listingId = urlParams.get('id');
  const shouldOpenContact = urlParams.get('contact') === 'true';
  const yocoOrderId = urlParams.get('order');
  const yocoStatus  = urlParams.get('yoco_status');

  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null); // 'pending' | 'paid' | 'failed' | 'cancelled' | null
  const [paidOrder, setPaidOrder] = useState(null);
  const inquiryFormRef = useRef(null);

  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      const listings = await api.entities.Listing.filter({ id: listingId });
      if (listings.length > 0) {
        await api.entities.Listing.update(listingId, {
          view_count: (listings[0].view_count || 0) + 1
        });
        return listings[0];
      }
      return null;
    },
    enabled: !!listingId
  });



  const { data: sellerData, isLoading: sellerLoading } = useQuery({
    queryKey: ['seller-profile-detail', listing?.created_by_id],
    queryFn: async () => {
      if (!listing?.created_by_id) return null;
      const response = await api.functions.invoke('getSellerProfile', { created_by_id: listing.created_by_id });
      return response.data;
    },
    enabled: !!listing?.created_by_id
  });

  const sellerProfile = sellerData?.sellerProfile;
  const sellerUser = sellerData?.user;

  const { data: relatedListings = [] } = useQuery({
    queryKey: ['related-listings', listing?.category],
    queryFn: () => api.entities.Listing.filter({ 
      category: listing.category, 
      status: 'active' 
    }, '-created_date', 4),
    enabled: !!listing?.category
  });

  const createInquiryMutation = useMutation({
    mutationFn: async (data) => {
      let currentUser;
      try {
        currentUser = await api.auth.me();
      } catch (error) {
        // User not logged in, proceed with anonymous inquiry
        currentUser = { email: 'anonymous', full_name: 'Anonymous User' };
      }

      // Create inquiry in database
      await api.entities.Inquiry.create(data);
      
      // Create notification for seller
      await api.entities.Notification.create({
        user_email: listing.created_by,
        type: 'inquiry',
        title: 'New Inquiry',
        message: `Someone is interested in your listing: ${listing.title}`,
        link: createPageUrl('Dashboard'),
        related_id: listingId
      });

      // Send email to seller
      try {
        await api.integrations.Core.SendEmail({
          to: listing.created_by,
          subject: `New Inquiry: ${listing.title}`,
          body: `
            <h2>New Inquiry Received</h2>
            <p>You have received a new inquiry for your listing: <strong>${listing.title}</strong></p>
            <p><strong>Message:</strong></p>
            <p>${data.message}</p>
            ${data.buyer_contact ? `<p><strong>Contact:</strong> ${data.buyer_contact}</p>` : ''}
            <p><strong>From:</strong> ${currentUser.full_name || currentUser.email}</p>
            <p><a href="${window.location.origin}${createPageUrl('Dashboard')}">View in Dashboard</a></p>
          `
        });
      } catch (emailError) {
        console.error('Failed to send email:', emailError);
        // Continue even if email fails
      }

      // Send WhatsApp message if seller has WhatsApp number
      if (sellerProfile?.whatsapp_number) {
        const whatsappNumber = sellerProfile.whatsapp_number.replace(/\D/g, '');
        const message = encodeURIComponent(
          `New inquiry for "${listing.title}"\n\nFrom: ${currentUser.full_name || currentUser.email}\n\nMessage: ${data.message}${data.buyer_contact ? `\n\nContact: ${data.buyer_contact}` : ''}`
        );
        window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
      }

      // Update listing inquiry count
      await api.entities.Listing.update(listingId, {
        inquiry_count: (listing.inquiry_count || 0) + 1
      });
    },
    onSuccess: () => {
      toast.success('Your inquiry has been sent to the seller!');
      setShowInquiryForm(false);
      setInquiryMessage('');
      setBuyerContact('');
      queryClient.invalidateQueries(['received-inquiries']);
      queryClient.invalidateQueries(['sent-inquiries']);
    },
    onError: (error) => {
      console.error('Inquiry error:', error);
      toast.error('Failed to send inquiry. Please try again.');
    }
  });

  const handleSendInquiry = () => {
    if (!inquiryMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    createInquiryMutation.mutate({
      listing_id: listingId,
      seller_id: listing.created_by,
      message: inquiryMessage,
      buyer_contact: buyerContact
    });
  };

  const categoryLabels = {
    chickens: 'Chickens', ducks: 'Ducks', geese: 'Geese', turkeys: 'Turkeys',
    quail: 'Quail', guinea_fowl: 'Guinea Fowl', peafowl: 'Peafowl',
    pigeons: 'Pigeons', eggs_table: 'Table Eggs', eggs_fertile: 'Fertile Eggs',
    chicks: 'Chicks', growers: 'Growers', layers: 'Layers', broilers: 'Broilers',
    feed: 'Feed', supplements: 'Supplements', incubators: 'Incubators',
    equipment: 'Equipment', other: 'Other'
  };

  // Auto-open inquiry form if contact=true in URL
  useEffect(() => {
    if (shouldOpenContact && listing && !isLoading) {
      setShowInquiryForm(true);
    }
  }, [shouldOpenContact, listing, isLoading]);

  // ----- Yoco return-from-checkout handler -----
  useEffect(() => {
    if (!yocoOrderId) return;
    if (yocoStatus === 'cancel') {
      setOrderStatus('cancelled');
      toast.info('Payment cancelled. No charge was made.');
      return;
    }
    if (yocoStatus === 'failure') {
      setOrderStatus('failed');
      toast.error('Payment failed. Please try again.');
      return;
    }
    if (yocoStatus !== 'success') return;

    setOrderStatus('pending');
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      if (cancelled) return;
      attempts++;
      try {
        // Ask the backend to verify with Yoco directly (no webhook needed)
        await api.functions.invoke('verifyYocoCheckout', { orderId: yocoOrderId });
        const order = await api.entities.Order.get(yocoOrderId);
        if (cancelled) return;
        if (order?.status === 'paid') {
          setOrderStatus('paid');
          setPaidOrder(order);
          toast.success('Payment received — your file is unlocked.');
          return;
        }
        if (order?.status === 'failed' || order?.status === 'cancelled') {
          setOrderStatus(order.status);
          toast.error(order.status === 'cancelled' ? 'Payment cancelled.' : 'Payment failed. Please try again.');
          return;
        }
      } catch (e) {
        console.warn('[order poll]', e);
      }
      if (attempts < 10) setTimeout(poll, 2000); // poll for ~20s
      else {
        setOrderStatus('slow');
        toast.warning('Payment is taking longer than expected. Refresh in a moment.');
      }
    };
    poll();

    return () => { cancelled = true; };
  }, [yocoOrderId, yocoStatus]);

  const handlePayAndDownload = async () => {
    if (!listing) return;
    setCheckoutLoading(true);
    try {
      const me = await api.auth.me().catch(() => null);
      if (!me) {
        toast.error('Please sign in to purchase.');
        api.auth.redirectToLogin(window.location.href);
        return;
      }
      const successUrl = `${window.location.origin}${createPageUrl('ProductDetail')}?id=${listing.id}`;
      const res = await api.functions.invoke('createYocoCheckout', {
        amount: Number(listing.price),
        listingId: listing.id,
        quantity: 1,
        successUrl,
        cancelUrl:  successUrl,
        failureUrl: successUrl,
      });
      const redirectUrl = res?.data?.redirectUrl || res?.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        toast.error(res?.data?.message || 'Could not start checkout. Yoco may not be configured yet.');
      }
    } catch (err) {
      console.error('[Yoco checkout]', err);
      toast.error(err?.message || 'Could not start checkout. Try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Scroll to inquiry form when opened
  useEffect(() => {
    if (showInquiryForm && inquiryFormRef.current) {
      inquiryFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [showInquiryForm]);

  // Update document meta tags for social sharing
  useEffect(() => {
    if (!listing) return;
    
    const ogImage = listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=1200';
    const ogDescription = `R${listing.price} - ${listing.description?.slice(0, 120) || `${listing.title} in ${listing.city}, ${listing.province}`}`;
    const ogTitle = `${listing.title} - R${listing.price} | Easy Poultry`;
    
    document.title = ogTitle;
    
    // Update or create meta tags
    const updateMeta = (property, content, isName = false) => {
      const attr = isName ? 'name' : 'property';
      let meta = document.querySelector(`meta[${attr}="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Standard meta
    updateMeta('description', ogDescription, true);
    
    // Open Graph (Facebook, WhatsApp, etc.)
    updateMeta('og:title', ogTitle);
    updateMeta('og:description', ogDescription);
    updateMeta('og:image', ogImage);
    updateMeta('og:image:width', '1200');
    updateMeta('og:image:height', '630');
    updateMeta('og:url', window.location.href);
    updateMeta('og:type', 'product');
    updateMeta('og:site_name', 'Easy Poultry Marketplace');
    
    // Product-specific Open Graph
    updateMeta('product:price:amount', listing.price.toString());
    updateMeta('product:price:currency', listing.currency || 'ZAR');
    
    // Twitter Card
    updateMeta('twitter:card', 'summary_large_image', true);
    updateMeta('twitter:title', ogTitle, true);
    updateMeta('twitter:description', ogDescription, true);
    updateMeta('twitter:image', ogImage, true);
    
    // Cleanup on unmount
    return () => {
      document.title = 'Easy Poultry Marketplace';
    };
  }, [listing]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500">Listing not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
          <div className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <Link to={createPageUrl('Marketplace')} className="inline-flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Link>
            </div>
          </div>



      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <ImageCarousel images={listing.images} />

            {/* ----- DIGITAL DOWNLOAD PANEL ----- */}
            {listing.product_type === 'digital' && (
              <Card className="p-6 border-0 shadow-lg bg-gradient-to-br from-terracotta-50 to-yolk-50 border border-terracotta-100">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-terracotta-600">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-display text-xl text-ink">Digital download</h3>
                      <Badge className="bg-terracotta-400 text-white border-0 text-[10px]">PDF / file</Badge>
                    </div>
                    <p className="text-sm text-ink/65 mb-4">
                      {listing.digital_file_name || 'Your file'}
                      {listing.digital_file_size > 0 && (
                        <span className="text-ink/45">
                          {' · '}
                          {listing.digital_file_size < 1024 * 1024
                            ? `${(listing.digital_file_size / 1024).toFixed(0)} KB`
                            : `${(listing.digital_file_size / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                      )}
                    </p>
                    {/* Three states: paid (show download), pending (poll msg), default (pay button) */}
                    {orderStatus === 'paid' && paidOrder?.digital_file_url ? (
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={paidOrder.digital_file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={paidOrder.digital_file_name || true}
                          className="btn-cta px-5 py-2.5 text-sm gap-1.5"
                        >
                          <Download className="w-4 h-4" />
                          Download your file
                        </a>
                        <span className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-moss-700">
                          <CheckCircle2 className="w-4 h-4" />
                          Paid R{paidOrder.amount}
                        </span>
                      </div>
                    ) : orderStatus === 'pending' ? (
                      <div className="flex items-center gap-2 text-sm text-ink/70">
                        <Loader2 className="w-4 h-4 animate-spin text-moss-600" />
                        Confirming your payment with Yoco…
                      </div>
                    ) : orderStatus === 'slow' ? (
                      <div className="flex items-center gap-2 text-sm text-yolk-600">
                        <Clock className="w-4 h-4" />
                        Payment confirmation is slow — refresh the page in a moment.
                      </div>
                    ) : orderStatus === 'failed' ? (
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm text-terracotta-600">
                          <XCircle className="w-4 h-4" />
                          Payment failed
                        </span>
                        <button
                          type="button"
                          onClick={handlePayAndDownload}
                          disabled={checkoutLoading}
                          className="btn-cta px-5 py-2.5 text-sm gap-1.5"
                        >
                          {checkoutLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                          Try again
                        </button>
                      </div>
                    ) : listing.digital_file_url ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handlePayAndDownload}
                          disabled={checkoutLoading}
                          className="btn-cta px-5 py-2.5 text-sm gap-1.5"
                        >
                          {checkoutLoading ? (
                            <><Loader2 className="w-4 h-4 animate-spin" />Starting checkout…</>
                          ) : (
                            <><CreditCard className="w-4 h-4" />Pay R{listing.price} & download</>
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-terracotta-600 italic">File not yet uploaded by the seller.</p>
                    )}
                    <p className="text-[11px] text-ink/45 mt-3 inline-flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      Secured by Yoco · download immediately after payment
                    </p>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-6 border-0 shadow-lg">
              <div className="mb-4">
                <Badge className="bg-[#7A9D7A]/10 text-[#7A9D7A] border-0 mb-3">
                  {categoryLabels[listing.category] || listing.category}
                </Badge>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {listing.title}
                </h1>
                {listing.breed && (
                  <p className="text-lg text-gray-600">
                    {listing.product_type === 'digital' ? `by ${listing.breed}` : listing.breed}
                  </p>
                )}
              </div>

              <div className="flex items-center mb-6 pb-6 border-b">
                <div>
                  <span className="text-4xl font-bold text-[#E07A5F]">
                    R{listing.price}
                  </span>
                  {listing.product_type === 'digital' ? (
                    <span className="text-sm text-gray-600 ml-2">per download</span>
                  ) : (
                    <>
                      {listing.price_type === 'batch' && listing.stock_quantity > 1 && (
                        <span className="text-sm text-gray-600 ml-2">for entire batch</span>
                      )}
                      {listing.price_type === 'per_item' && (
                        <span className="text-sm text-gray-600 ml-2">per item</span>
                      )}
                    </>
                  )}
                </div>
                {listing.product_type !== 'digital' && listing.stock_quantity > 0 && (
                  <span className="ml-4 text-gray-600">
                    {listing.stock_quantity} available
                  </span>
                )}
              </div>

              {/* Physical product metadata only */}
              {listing.product_type !== 'digital' && (
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {listing.age && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Age</p>
                        <p className="font-medium text-gray-900">{listing.age}</p>
                      </div>
                    </div>
                  )}
                  {listing.gender && listing.gender !== 'n/a' && (
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Gender</p>
                        <p className="font-medium text-gray-900 capitalize">{listing.gender}</p>
                      </div>
                    </div>
                  )}
                  {(listing.city || listing.province) && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{listing.city}, {listing.province}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {listing.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>
              )}
            </Card>

            {showInquiryForm && (
              <Card ref={inquiryFormRef} className="p-6 border-0 shadow-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Send Inquiry</h3>
                <div className="space-y-4">
                  <div>
                    <Input
                      placeholder="Your contact number (optional)"
                      value={buyerContact}
                      onChange={(e) => setBuyerContact(e.target.value)}
                    />
                  </div>
                  <Textarea
                    placeholder="Hi, I'm interested in this listing..."
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSendInquiry}
                      disabled={createInquiryMutation.isPending}
                      className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                    >
                      {createInquiryMutation.isPending ? 'Sending...' : 'Send Inquiry'}
                    </Button>
                    <Button
                      onClick={() => setShowInquiryForm(false)}
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Seller Profile Sidebar */}
          <div className="sticky top-24">
            <Card className="p-6 border-0 shadow-lg">
              {sellerLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#7A9D7A]" />
                </div>
              ) : sellerProfile ? (
                <div>
                  <div className="flex items-start gap-4 mb-6">
                    <img
                      src={sellerProfile.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerProfile.display_name || 'Seller')}&background=7A9D7A&color=fff`}
                      alt={sellerProfile.display_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{sellerProfile.display_name}</h3>
                        {sellerProfile.seller_verified && (
                          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center" title="Verified Seller">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      {sellerProfile.farm_name && (
                        <p className="text-sm text-gray-600">{sellerProfile.farm_name}</p>
                          )}
                          <ReviewSummary sellerEmail={sellerProfile.user_email} />
                        </div>
                        </div>

                  <div className="space-y-3 mb-6 text-sm">
                    {sellerProfile.subdomain && (
                      <Link 
                        to={createPageUrl('SellerShop') + `?shop=${sellerProfile.subdomain}`}
                        className="block text-[#7A9D7A] hover:text-[#6A8D6A] font-medium hover:underline"
                      >
                        Visit Shop →
                      </Link>
                    )}
                    {(sellerProfile.city || sellerProfile.province) && (
                      <div className="flex items-start gap-3 text-gray-600">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{[sellerProfile.city, sellerProfile.province].filter(Boolean).join(', ')}</span>
                      </div>
                    )}
                    {sellerProfile.business_hours && (
                      <div className="flex items-start gap-3 text-gray-600">
                        <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{sellerProfile.business_hours}</span>
                      </div>
                    )}
                    {sellerProfile.bio && (
                      <p className="text-gray-600 leading-relaxed">{sellerProfile.bio}</p>
                    )}
                  </div>

                  <VerifiedSellerContact 
                    sellerProfile={sellerProfile} 
                    onInquire={() => setShowInquiryForm(true)} 
                  />

                  <ChatButton 
                    sellerEmail={sellerProfile.user_email} 
                    listingId={listingId}
                    className="w-full mt-3 bg-[#3D405B] hover:bg-[#2D3142]"
                  />

                  <div className="pt-4 border-t mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="w-full"
                    >
                      Leave a Review
                    </Button>
                    {showReviewForm && (
                      <div className="mt-4">
                        <ReviewForm
                          sellerEmail={sellerProfile.user_email}
                          listingId={listingId}
                          onSuccess={() => setShowReviewForm(false)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-4">Seller: {listing.created_by?.split('@')[0]}</p>
                  <Button
                    onClick={() => setShowInquiryForm(true)}
                    className="w-full bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                  >
                    Contact Seller
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {relatedListings.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Listings</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedListings.filter(l => l.id !== listing.id).slice(0, 4).map((related) => (
                <Link key={related.id} to={createPageUrl('ProductDetail') + `?id=${related.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square overflow-hidden bg-gray-100">
                      <img
                        src={related.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'}
                        alt={related.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {related.title}
                      </h3>
                      <p className="text-lg font-bold text-[#E07A5F]">
                        R{related.price}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}