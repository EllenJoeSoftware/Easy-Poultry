import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Package, MessageCircle, Shield, Trash2, Eye, Loader2, CheckCircle2, XCircle, Star, Settings, DollarSign, Gavel, Building2, Plus, Mail, UserCog, ArrowLeft, Trophy, BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import moment from 'moment';
import EmailCampaignManager from '../components/admin/EmailCampaignManager';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Admin() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [tierFormData, setTierFormData] = useState({
    name: '',
    max_listings: 10,
    max_images_per_listing: 10,
    max_prospects: 50,
    max_batches: 10,
    can_show_phone: false,
    can_feature_listings: false,
    price: 0
  });
  const [pricingFormData, setPricingFormData] = useState({
    name: '',
    duration_days: 7,
    price: 0
  });
  const [editingTier, setEditingTier] = useState(null);
  const [editingPricing, setEditingPricing] = useState(null);
  const [viewingDocument, setViewingDocument] = useState(null);
  const [bankingFormData, setBankingFormData] = useState({
    bank_name: '',
    account_holder: '',
    account_number: '',
    account_type: '',
    branch_code: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        if (currentUser.role !== 'admin') {
          toast.error('Access denied. Admin only.');
          navigate(createPageUrl('Home'));
          return;
        }
        setUser(currentUser);
      } catch (error) {
        api.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, [navigate]);

  const { data: users = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => api.entities.User.list(),
    enabled: !!user && user.role === 'admin'
  });

  const { data: listings = [] } = useQuery({
    queryKey: ['all-listings'],
    queryFn: () => api.entities.Listing.list('-created_date'),
    enabled: !!user
  });

  const { data: inquiries = [] } = useQuery({
    queryKey: ['all-inquiries'],
    queryFn: () => api.entities.Inquiry.list('-created_date'),
    enabled: !!user
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['tiers'],
    queryFn: () => api.entities.SellerTier.list(),
    enabled: !!user
  });

  const { data: featurePricing = [] } = useQuery({
    queryKey: ['feature-pricing-admin'],
    queryFn: () => api.entities.FeaturePricing.list(),
    enabled: !!user
  });

  const { data: featurePayments = [] } = useQuery({
    queryKey: ['feature-payments'],
    queryFn: () => api.entities.FeaturePayment.list('-created_date'),
    enabled: !!user
  });

  const { data: pendingPayments = [] } = useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const payments = await api.entities.FeaturePayment.filter({ status: 'pending' }, '-created_date');
      return payments;
    },
    enabled: !!user
  });

  const { data: bankingInfo = [] } = useQuery({
    queryKey: ['banking-info-admin'],
    queryFn: () => api.entities.BankingInfo.list(),
    enabled: !!user
  });

  const { data: pendingVerifications = [] } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: async () => {
      const allUsers = await api.entities.User.list();
      return allUsers.filter(u => u.verification_submitted && !u.seller_verified);
    },
    enabled: !!user
  });

  const { data: pendingTierUpgrades = [] } = useQuery({
    queryKey: ['pending-tier-upgrades'],
    queryFn: async () => {
      const upgrades = await api.entities.TierUpgradePayment.filter({ status: 'pending' }, '-created_date');
      return upgrades;
    },
    enabled: !!user
  });

  const { data: pendingVerificationPayments = [] } = useQuery({
    queryKey: ['pending-verification-payments'],
    queryFn: async () => {
      const payments = await api.entities.VerificationPayment.filter({ status: 'pending' }, '-created_date');
      return payments;
    },
    enabled: !!user
  });

  const { data: yocoTransactionLogs = [] } = useQuery({
    queryKey: ['yoco-transaction-logs'],
    queryFn: () => api.entities.YocoTransactionLog.list('-created_date', 100),
    enabled: !!user && activeTab === 'payments'
  });

  const { data: adminSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const settings = await api.entities.AdminSettings.filter({ setting_key: 'main' });
      return settings[0] || null;
    },
    enabled: !!user
  });

  const { data: pendingAuctionHousePayments = [] } = useQuery({
    queryKey: ['pending-auction-house-payments'],
    queryFn: () => api.entities.AuctionHousePayment.filter({ status: 'pending' }, '-created_date'),
    enabled: !!user
  });

  const { data: allAuctionHouses = [] } = useQuery({
    queryKey: ['all-auction-houses'],
    queryFn: () => api.entities.AuctionHouse.list('-created_date'),
    enabled: !!user
  });

  const { data: allAuctionEvents = [] } = useQuery({
    queryKey: ['all-auction-events'],
    queryFn: () => api.entities.AuctionEvent.list('-created_date'),
    enabled: !!user
  });

  const { data: auctionHouseTiers = [] } = useQuery({
    queryKey: ['auction-house-tiers'],
    queryFn: () => api.entities.AuctionHouseTier.list('sort_order'),
    enabled: !!user
  });

  const { data: competitions = [] } = useQuery({
    queryKey: ['admin-competitions'],
    queryFn: () => api.entities.Competition.list('-created_date'),
    enabled: !!user
  });

  const { data: allCompetitionEntries = [] } = useQuery({
    queryKey: ['all-competition-entries'],
    queryFn: () => api.entities.CompetitionEntry.list('-created_date'),
    enabled: !!user && activeTab === 'competitions'
  });

  const [auctionTierForm, setAuctionTierForm] = useState({
    name: '',
    monthly_price: 500,
    max_live_auctions: 1,
    max_items_per_auction: 20,
    featured_placement: false,
    priority_support: false
  });
  const [editingAuctionTier, setEditingAuctionTier] = useState(null);
  const [verificationFee, setVerificationFee] = useState(0);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [requireAccountApproval, setRequireAccountApproval] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(20);
  const [usersSortBy, setUsersSortBy] = useState('inactive_first');
  const [competitionForm, setCompetitionForm] = useState({
    name: '',
    description: '',
    banner_image_url: '',
    start_date: '',
    end_date: '',
    min_rating: 1,
    max_rating: 10,
    scoring_method: 'average'
  });
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [editingCompetition, setEditingCompetition] = useState(null);
  const [disqualifyingEntry, setDisqualifyingEntry] = useState(null);
  const [disqualificationReason, setDisqualificationReason] = useState('');

  const deleteListingMutation = useMutation({
    mutationFn: (id) => api.entities.Listing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-listings']);
      toast.success('Listing deleted');
    }
  });

  const verifySellerMutation = useMutation({
    mutationFn: async ({ userId, approved }) => {
      const users = await api.entities.User.filter({ id: userId });
      if (users.length > 0) {
        await api.entities.User.update(userId, {
          seller_verified: approved,
          seller_activated: approved
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-verifications']);
      queryClient.invalidateQueries(['all-users']);
      toast.success('Verification updated');
    }
  });

  const activateSellerMutation = useMutation({
    mutationFn: async ({ userId, activated }) => {
      const users = await api.entities.User.filter({ id: userId });
      if (users.length > 0) {
        await api.entities.User.update(userId, {
          seller_activated: activated
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      toast.success('Seller activation updated');
    }
  });

  const updateUserTypeMutation = useMutation({
    mutationFn: async ({ userId, userType }) => {
      await api.entities.User.update(userId, { user_type: userType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      toast.success('User type updated');
    }
  });

  const createTierMutation = useMutation({
    mutationFn: (data) => api.entities.SellerTier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiers']);
      toast.success('Tier created');
      setTierFormData({
        name: '',
        max_listings: 10,
        max_images_per_listing: 10,
        max_prospects: 50,
        max_batches: 10,
        can_show_phone: false,
        can_feature_listings: false,
        price: 0
      });
    }
  });

  const deleteTierMutation = useMutation({
    mutationFn: (id) => api.entities.SellerTier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiers']);
      toast.success('Tier deleted');
    }
  });

  const createPricingMutation = useMutation({
    mutationFn: (data) => api.entities.FeaturePricing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feature-pricing-admin']);
      toast.success('Pricing plan created');
      setPricingFormData({ name: '', duration_days: 7, price: 0 });
    }
  });

  const deletePricingMutation = useMutation({
    mutationFn: (id) => api.entities.FeaturePricing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['feature-pricing-admin']);
      toast.success('Pricing plan deleted');
    }
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.SellerTier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiers']);
      toast.success('Tier updated');
      setEditingTier(null);
    }
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.FeaturePricing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feature-pricing-admin']);
      toast.success('Pricing plan updated');
      setEditingPricing(null);
    }
  });

  const createBankingInfoMutation = useMutation({
    mutationFn: async (data) => {
      // Deactivate all existing banking info
      const existing = await api.entities.BankingInfo.list();
      for (const info of existing) {
        await api.entities.BankingInfo.update(info.id, { is_active: false });
      }
      // Create new active one
      await api.entities.BankingInfo.create({ ...data, is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['banking-info-admin']);
      toast.success('Banking info updated');
      setBankingFormData({ bank_name: '', account_holder: '', account_number: '', account_type: '', branch_code: '' });
    }
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, approved, payment }) => {
      const now = new Date().toISOString();
      const currentUser = await api.auth.me();
      
      if (approved) {
        await api.entities.FeaturePayment.update(paymentId, {
          status: 'verified',
          verified_by: currentUser.email,
          verified_date: now
        });
        
        // Feature the listing
        await api.entities.Listing.update(payment.listing_id, {
          featured: true,
          featured_until: payment.feature_ends
        });
      } else {
        await api.entities.FeaturePayment.update(paymentId, {
          status: 'rejected',
          verified_by: currentUser.email,
          verified_date: now
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-payments']);
      queryClient.invalidateQueries(['feature-payments']);
      queryClient.invalidateQueries(['listings']);
      toast.success('Payment verification updated');
    }
  });

  const verifyTierUpgradeMutation = useMutation({
    mutationFn: async ({ upgradeId, approved, upgrade }) => {
      const now = new Date().toISOString();
      const currentUser = await api.auth.me();
      
      if (approved) {
        await api.entities.TierUpgradePayment.update(upgradeId, {
          status: 'verified',
          verified_by: currentUser.email,
          verified_date: now
        });
        
        // Update user's tier
        const users = await api.entities.User.filter({ email: upgrade.seller_id });
        if (users.length > 0) {
          await api.entities.User.update(users[0].id, {
            seller_tier: upgrade.to_tier
          });
        }
      } else {
        await api.entities.TierUpgradePayment.update(upgradeId, {
          status: 'rejected',
          verified_by: currentUser.email,
          verified_date: now
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-tier-upgrades']);
      queryClient.invalidateQueries(['all-users']);
      toast.success('Tier upgrade verification updated');
    }
  });

  const verifyVerificationPaymentMutation = useMutation({
    mutationFn: async ({ paymentId, approved, payment }) => {
      const now = new Date().toISOString();
      const currentUser = await api.auth.me();
      
      if (approved) {
        await api.entities.VerificationPayment.update(paymentId, {
          status: 'verified',
          verified_by: currentUser.email,
          verified_date: now
        });
        
        // Update user as verified
        const users = await api.entities.User.filter({ email: payment.seller_id });
        if (users.length > 0) {
          await api.entities.User.update(users[0].id, {
            seller_verified: true,
            seller_activated: true,
            verification_payment_pending: false
          });

          // Update seller profile
          const profiles = await api.entities.SellerProfile.filter({ user_email: payment.seller_id });
          if (profiles.length > 0) {
            await api.entities.SellerProfile.update(profiles[0].id, { seller_verified: true });
          }
        }
      } else {
        await api.entities.VerificationPayment.update(paymentId, {
          status: 'rejected',
          verified_by: currentUser.email,
          verified_date: now
        });

        // Reset verification flags
        const users = await api.entities.User.filter({ email: payment.seller_id });
        if (users.length > 0) {
          await api.entities.User.update(users[0].id, {
            verification_payment_pending: false,
            verification_submitted: false
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-verification-payments']);
      queryClient.invalidateQueries(['all-users']);
      toast.success('Verification payment updated');
    }
  });

  const updateAdminSettingsMutation = useMutation({
    mutationFn: async (data) => {
      const existing = await api.entities.AdminSettings.filter({ setting_key: 'main' });
      if (existing.length > 0) {
        await api.entities.AdminSettings.update(existing[0].id, data);
      } else {
        await api.entities.AdminSettings.create({ ...data, setting_key: 'main' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings']);
      toast.success('Settings updated');
    }
  });

  const endAuctionMutation = useMutation({
    mutationFn: async (eventId) => {
      await api.entities.AuctionEvent.update(eventId, { status: 'ended' });
      
      // Mark all items as sold/unsold
      const items = await api.entities.AuctionItem.filter({ auction_event_id: eventId });
      for (const item of items) {
        if (item.current_bid > 0) {
          await api.entities.AuctionItem.update(item.id, {
            status: 'sold',
            final_price: item.current_bid,
            winner_email: item.current_bidder,
            winner_name: item.current_bidder_name
          });
        } else {
          await api.entities.AuctionItem.update(item.id, { status: 'unsold' });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-auction-events']);
      toast.success('Auction ended and finalized');
    }
  });

  const verifyAuctionHousePaymentMutation = useMutation({
    mutationFn: async ({ paymentId, approved, payment }) => {
      const now = new Date().toISOString();
      const currentUser = await api.auth.me();
      
      if (approved) {
        await api.entities.AuctionHousePayment.update(paymentId, {
          status: 'verified',
          verified_by: currentUser.email,
          verified_date: now
        });
        
        await api.entities.AuctionHouse.update(payment.auction_house_id, {
          status: 'active',
          verified: true,
          tier_id: payment.tier_id,
          tier_name: payment.tier_name,
          subscription_start: payment.period_start,
          subscription_end: payment.period_end,
          payment_reminder_sent: false
        });

        await api.entities.Notification.create({
          user_email: payment.seller_email,
          type: 'system',
          title: 'Auction House Approved!',
          message: `Your ${payment.tier_name} subscription is now active until ${new Date(payment.period_end).toLocaleDateString()}.`,
          link: createPageUrl('MyAuctionHouse')
        });
      } else {
        await api.entities.AuctionHousePayment.update(paymentId, {
          status: 'rejected',
          verified_by: currentUser.email,
          verified_date: now
        });

        await api.entities.AuctionHouse.update(payment.auction_house_id, {
          status: 'pending_payment'
        });

        await api.entities.Notification.create({
          user_email: payment.seller_email,
          type: 'system',
          title: 'Payment Rejected',
          message: 'Your auction house payment was rejected. Please retry.',
          link: createPageUrl('MyAuctionHouse')
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pending-auction-house-payments']);
      queryClient.invalidateQueries(['all-auction-houses']);
      toast.success('Auction house payment verified');
    }
  });

  const createAuctionTierMutation = useMutation({
    mutationFn: (data) => api.entities.AuctionHouseTier.create({ ...data, is_active: true, sort_order: auctionHouseTiers.length }),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-house-tiers']);
      toast.success('Tier created');
      setAuctionTierForm({ name: '', monthly_price: 500, max_live_auctions: 1, max_items_per_auction: 20, featured_placement: false, priority_support: false });
    }
  });

  const updateAuctionTierMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.AuctionHouseTier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-house-tiers']);
      toast.success('Tier updated');
      setEditingAuctionTier(null);
    }
  });

  const deleteAuctionTierMutation = useMutation({
    mutationFn: (id) => api.entities.AuctionHouseTier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-house-tiers']);
      toast.success('Tier deleted');
    }
  });

  const sendPaymentRemindersMutation = useMutation({
    mutationFn: async () => {
      const houses = await api.entities.AuctionHouse.filter({ status: 'active' });
      const now = moment();
      let count = 0;
      
      for (const house of houses) {
        if (!house.subscription_end || house.payment_reminder_sent) continue;
        
        const daysUntilExpiry = moment(house.subscription_end).diff(now, 'days');
        if (daysUntilExpiry <= 5 && daysUntilExpiry > 0) {
          await api.entities.Notification.create({
            user_email: house.created_by,
            type: 'payment',
            title: 'Subscription Renewal Reminder',
            message: `Your auction house "${house.name}" subscription expires in ${daysUntilExpiry} days. Renew now to avoid interruption.`,
            link: createPageUrl('MyAuctionHouse')
          });
          
          await api.entities.AuctionHouse.update(house.id, { payment_reminder_sent: true });
          count++;
        }
      }
      return count;
    },
    onSuccess: (count) => {
      toast.success(`Sent ${count} payment reminder(s)`);
    }
  });

  const createCompetitionMutation = useMutation({
    mutationFn: (data) => api.entities.Competition.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-competitions']);
      toast.success('Competition created');
      setCompetitionForm({
        name: '',
        description: '',
        banner_image_url: '',
        start_date: '',
        end_date: '',
        min_rating: 1,
        max_rating: 10,
        scoring_method: 'average'
      });
    }
  });

  const updateCompetitionMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Competition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-competitions']);
      toast.success('Competition updated');
      setEditingCompetition(null);
    }
  });

  const deleteCompetitionMutation = useMutation({
    mutationFn: (id) => api.entities.Competition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-competitions']);
      toast.success('Competition deleted');
    }
  });

  const disqualifyEntryMutation = useMutation({
    mutationFn: async ({ entryId, reason }) => {
      await api.entities.CompetitionEntry.update(entryId, {
        disqualified: true,
        disqualification_reason: reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-competition-entries']);
      queryClient.invalidateQueries(['competition-entries']);
      toast.success('Entry disqualified');
      setDisqualifyingEntry(null);
      setDisqualificationReason('');
    }
  });

  const finalizeCompetitionMutation = useMutation({
    mutationFn: async (competitionId) => {
      const competition = competitions.find(c => c.id === competitionId);
      const entries = await api.entities.CompetitionEntry.filter({ competition_id: competitionId });
      
      if (entries.length === 0) {
        throw new Error('No entries to finalize');
      }

      const sortedEntries = [...entries].sort((a, b) => {
        if (competition.scoring_method === 'average') {
          return (b.average_rating || 0) - (a.average_rating || 0);
        } else {
          return (b.total_score || 0) - (a.total_score || 0);
        }
      });

      const winner = sortedEntries[0];
      const displayUntil = moment().add(7, 'days').toISOString();

      await api.entities.CompetitionWinner.create({
        competition_id: competitionId,
        competition_name: competition.name,
        entry_id: winner.id,
        chicken_name: winner.chicken_name,
        owner_name: winner.owner_name,
        owner_email: winner.owner_email,
        final_score: competition.scoring_method === 'average' ? winner.average_rating : winner.total_score,
        vote_count: winner.vote_count,
        image_url: winner.images?.[0],
        display_until: displayUntil
      });

      await api.entities.Competition.update(competitionId, {
        status: 'ended',
        winner_id: winner.id
      });

      await api.entities.Notification.create({
        user_email: winner.owner_email,
        type: 'system',
        title: '🏆 You Won!',
        message: `Congratulations! Your entry "${winner.chicken_name}" won the ${competition.name} competition!`,
        link: createPageUrl('WinnersHallOfFame')
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-competitions']);
      toast.success('Competition finalized and winner announced!');
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const activeListings = listings.filter(l => l.status === 'active').length;
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          </div>
          <p className="text-white/90">Manage users, listings, and platform activity</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-[#7A9D7A]" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{users.length}</p>
            <p className="text-sm text-gray-600">Total Users</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-[#E07A5F]" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{activeListings}</p>
            <p className="text-sm text-gray-600">Active Listings</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 text-[#7A9D7A]" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{totalViews}</p>
            <p className="text-sm text-gray-600">Total Views</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <MessageCircle className="w-8 h-8 text-[#E07A5F]" />
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{pendingVerifications.length}</p>
            <p className="text-sm text-gray-600">Pending Verifications</p>
          </Card>
        </div>

        {activeTab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { value: 'users', icon: Users, label: 'Users', desc: 'Manage all users', color: 'from-blue-500 to-blue-600', count: users.length },
              { value: 'verifications', icon: Shield, label: 'Verifications', desc: 'Pending approvals', color: 'from-amber-500 to-orange-500', count: pendingVerifications.length },
              { value: 'payments', icon: DollarSign, label: 'Payments', desc: 'Verify payments', color: 'from-green-500 to-emerald-600', count: pendingPayments.length + pendingVerificationPayments.length + pendingTierUpgrades.length },
              { value: 'tiers', icon: Star, label: 'Seller Tiers', desc: 'Subscription plans', color: 'from-purple-500 to-purple-600', count: tiers.length },
              { value: 'feature-pricing', icon: Star, label: 'Feature Pricing', desc: 'Promotion pricing', color: 'from-pink-500 to-rose-500', count: featurePricing.length },
              { value: 'settings', icon: Settings, label: 'Settings', desc: 'Platform config', color: 'from-slate-500 to-slate-600' },
              { value: 'banking', icon: Building2, label: 'Banking', desc: 'Payment details', color: 'from-cyan-500 to-teal-500' },
              { value: 'finances', icon: DollarSign, label: 'Finances', desc: 'Revenue overview', color: 'from-emerald-500 to-green-600' },
              { value: 'listings', icon: Package, label: 'Listings', desc: 'All marketplace items', color: 'from-indigo-500 to-indigo-600', count: listings.length },
              { value: 'featured-listings', icon: Star, label: 'Featured Listings', desc: 'Featured items tracking', color: 'from-yellow-500 to-amber-500', count: listings.filter(l => l.featured).length },
              { value: 'auctions', icon: Gavel, label: 'Auctions', desc: 'Auction management', color: 'from-red-500 to-rose-600', count: pendingAuctionHousePayments.length },
              { value: 'auction-tiers', icon: Building2, label: 'Auction Tiers', desc: 'Auction house plans', color: 'from-orange-500 to-amber-500', count: auctionHouseTiers.length },
              { value: 'email-marketing', icon: Mail, label: 'Email Marketing', desc: 'Campaign management', color: 'from-violet-500 to-purple-600' },
              { value: 'competitions', icon: UserCog, label: 'Competitions', desc: 'Manage competitions', color: 'from-yellow-500 to-amber-500', count: competitions.length },
              { value: 'stats', icon: BarChart3, label: 'Statistics', desc: 'Site analytics', color: 'from-teal-500 to-cyan-600' },
            ].map((tile) => (
              <Card 
                key={tile.value}
                onClick={() => setActiveTab(tile.value)}
                className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`bg-gradient-to-br ${tile.color} p-4 text-white`}>
                  <div className="flex items-start justify-between">
                    <tile.icon className="w-8 h-8 opacity-90" />
                    {tile.count !== undefined && tile.count > 0 && (
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full">
                        {tile.count}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-semibold text-gray-900 mb-1">{tile.label}</h3>
                  <p className="text-xs text-gray-500">{tile.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'users' && (() => {
          // Sort users
          const sortedUsers = [...users].sort((a, b) => {
            if (usersSortBy === 'inactive_first') {
              if (a.seller_activated === b.seller_activated) return 0;
              return a.seller_activated ? 1 : -1;
            } else if (usersSortBy === 'active_first') {
              if (a.seller_activated === b.seller_activated) return 0;
              return a.seller_activated ? -1 : 1;
            }
            return 0;
          });

          // Paginate
          const totalPages = Math.ceil(sortedUsers.length / usersPerPage);
          const startIndex = (usersPage - 1) * usersPerPage;
          const paginatedUsers = sortedUsers.slice(startIndex, startIndex + usersPerPage);

          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">Sort:</Label>
                    <Select value={usersSortBy} onValueChange={setUsersSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="inactive_first">Inactive First</SelectItem>
                        <SelectItem value="active_first">Active First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-gray-600">Per page:</Label>
                    <Select value={usersPerPage.toString()} onValueChange={(val) => { setUsersPerPage(parseInt(val)); setUsersPage(1); }}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verification</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {paginatedUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={u.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}`}
                                alt={u.full_name}
                                className="w-10 h-10 rounded-full"
                              />
                              <div>
                                <p className="font-medium text-gray-900">{u.full_name}</p>
                                {u.farm_name && <p className="text-xs text-gray-500">{u.farm_name}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                          <td className="px-6 py-4">
                            <Badge className="capitalize">{u.user_type || 'buyer'}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              {u.seller_verified && (
                                <Badge className="bg-green-500">Verified</Badge>
                              )}
                              {u.seller_activated ? (
                                <Badge>Activated</Badge>
                              ) : (
                                <Badge variant="secondary">Not Activated</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {u.seller_verified ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => verifySellerMutation.mutate({
                                  userId: u.id,
                                  approved: false
                                })}
                                className="text-red-600 hover:text-red-700"
                              >
                                Unverify
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => verifySellerMutation.mutate({
                                  userId: u.id,
                                  approved: true
                                })}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Verify
                              </Button>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              variant={u.seller_activated ? "outline" : "default"}
                              onClick={() => activateSellerMutation.mutate({
                                userId: u.id,
                                activated: !u.seller_activated
                              })}
                            >
                              {u.seller_activated ? 'Deactivate' : 'Activate'}
                            </Button>
                          </td>
                          <td className="px-6 py-4">
                            <Select
                              value={u.user_type || 'buyer'}
                              onValueChange={(value) => updateUserTypeMutation.mutate({ userId: u.id, userType: value })}
                            >
                              <SelectTrigger className="w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="buyer">Buyer</SelectItem>
                                <SelectItem value="seller">Seller</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, sortedUsers.length)} of {sortedUsers.length} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                      Page {usersPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUsersPage(p => Math.min(totalPages, p + 1))}
                      disabled={usersPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          );
        })()}

        {activeTab === 'verifications' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <Card className="border-0 shadow-lg overflow-hidden">
              {pendingVerifications.length === 0 ? (
                <div className="p-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending verifications</h3>
                  <p className="text-gray-600">All verification requests have been processed</p>
                </div>
              ) : (
                <div className="divide-y">
                  {pendingVerifications.map((seller) => (
                    <div key={seller.id} className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={seller.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.full_name)}`}
                            alt={seller.full_name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{seller.full_name}</p>
                            <p className="text-sm text-gray-600">{seller.email}</p>
                            {seller.farm_name && <p className="text-sm text-gray-600">{seller.farm_name}</p>}
                          </div>
                        </div>
                        <Badge variant="secondary">Pending Review</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <Label className="text-sm text-gray-600 mb-2 block">ID Document</Label>
                          {seller.id_document_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingDocument({ url: seller.id_document_url, title: 'ID Document' })}
                              className="text-[#7A9D7A]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Document
                            </Button>
                          ) : (
                            <p className="text-sm text-gray-500">Not uploaded</p>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm text-gray-600 mb-2 block">Proof of Address</Label>
                          {seller.proof_of_address_url ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingDocument({ url: seller.proof_of_address_url, title: 'Proof of Address' })}
                              className="text-[#7A9D7A]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Document
                            </Button>
                          ) : (
                            <p className="text-sm text-gray-500">Not uploaded</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => verifySellerMutation.mutate({ userId: seller.id, approved: true })}
                          disabled={verifySellerMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Approve & Verify
                        </Button>
                        <Button
                          onClick={() => verifySellerMutation.mutate({ userId: seller.id, approved: false })}
                          disabled={verifySellerMutation.isPending}
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <div className="space-y-6">
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-semibold text-gray-900">Featured Listing Payments</h3>
                </div>
                {pendingPayments.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending payments</h3>
                    <p className="text-gray-600">All payment verifications are up to date</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingPayments.map((payment) => (
                      <div key={payment.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-medium text-gray-900">Seller: {payment.seller_id}</p>
                            <p className="text-sm text-gray-600">Listing ID: {payment.listing_id}</p>
                            <p className="text-sm text-gray-600">Reference: {payment.payment_reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#7A9D7A]">R{payment.amount_paid}</p>
                            <p className="text-sm text-gray-600">{payment.duration_days} days</p>
                          </div>
                        </div>

                        {payment.payment_proof_url && (
                          <div className="mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingDocument({ url: payment.payment_proof_url, title: 'Payment Proof' })}
                              className="text-[#7A9D7A]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Payment Proof
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={() => verifyPaymentMutation.mutate({ paymentId: payment.id, approved: true, payment })}
                            disabled={verifyPaymentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve & Feature
                          </Button>
                          <Button
                            onClick={() => verifyPaymentMutation.mutate({ paymentId: payment.id, approved: false, payment })}
                            disabled={verifyPaymentMutation.isPending}
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-semibold text-gray-900">Verification Payments</h3>
                </div>
                {pendingVerificationPayments.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending verification payments</h3>
                    <p className="text-gray-600">All verification payments are up to date</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingVerificationPayments.map((payment) => (
                      <div key={payment.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-medium text-gray-900">Seller: {payment.seller_id}</p>
                            <p className="text-sm text-gray-600">Reference: {payment.payment_reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#7A9D7A]">R{payment.amount_paid}</p>
                            <Badge variant="secondary">Verification Fee</Badge>
                          </div>
                        </div>

                        {payment.payment_proof_url && (
                          <div className="mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingDocument({ url: payment.payment_proof_url, title: 'Payment Proof' })}
                              className="text-[#7A9D7A]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Payment Proof
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={() => verifyVerificationPaymentMutation.mutate({ paymentId: payment.id, approved: true, payment })}
                            disabled={verifyVerificationPaymentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve & Verify Seller
                          </Button>
                          <Button
                            onClick={() => verifyVerificationPaymentMutation.mutate({ paymentId: payment.id, approved: false, payment })}
                            disabled={verifyVerificationPaymentMutation.isPending}
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-semibold text-gray-900">Tier Upgrade Payments</h3>
                </div>
                {pendingTierUpgrades.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending tier upgrades</h3>
                    <p className="text-gray-600">All tier upgrade verifications are up to date</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingTierUpgrades.map((upgrade) => (
                      <div key={upgrade.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-medium text-gray-900">Seller: {upgrade.seller_id}</p>
                            <p className="text-sm text-gray-600">From: {upgrade.from_tier} → To: {upgrade.to_tier}</p>
                            <p className="text-sm text-gray-600">Reference: {upgrade.payment_reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#7A9D7A]">R{upgrade.amount_paid}</p>
                          </div>
                        </div>

                        {upgrade.payment_proof_url && (
                          <div className="mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingDocument({ url: upgrade.payment_proof_url, title: 'Payment Proof' })}
                              className="text-[#7A9D7A]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Payment Proof
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={() => verifyTierUpgradeMutation.mutate({ upgradeId: upgrade.id, approved: true, upgrade })}
                            disabled={verifyTierUpgradeMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve & Upgrade
                          </Button>
                          <Button
                            onClick={() => verifyTierUpgradeMutation.mutate({ upgradeId: upgrade.id, approved: false, upgrade })}
                            disabled={verifyTierUpgradeMutation.isPending}
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    </div>
                    )}
                    </Card>

                    <Card className="border-0 shadow-lg overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b">
                    <h3 className="font-semibold text-gray-900">Yoco Transaction Logs</h3>
                    </div>
                    <div className="overflow-x-auto">
                    <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {yocoTransactionLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(log.created_date).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{log.user_email}</td>
                          <td className="px-6 py-4">
                            <Badge variant={log.transaction_type === 'webhook_event' ? 'default' : 'secondary'}>
                              {log.transaction_type === 'webhook_event' ? log.event_type : log.transaction_type}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                            {log.payment_type?.replace('_', ' ') || '-'}
                          </td>
                          <td className="px-6 py-4 font-medium">
                            {log.amount ? `R${(log.amount / 100).toFixed(2)}` : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={log.status === 'succeeded' ? 'default' : 'secondary'}>
                              {log.status || '-'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                                <DialogHeader>
                                  <DialogTitle>Transaction Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-900 mb-2">Request Payload</h4>
                                    <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
                                      {JSON.stringify(log.request_payload, null, 2)}
                                    </pre>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm text-gray-900 mb-2">Response Payload</h4>
                                    <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto">
                                      {JSON.stringify(log.response_payload, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    </table>
                    </div>
                    </Card>
                    </div>
                    </div>
                    )}

                    {activeTab === 'tiers' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <div className="space-y-6">
              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Tier</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tier Name</Label>
                    <Input
                      value={tierFormData.name}
                      onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                      placeholder="e.g., Premium"
                    />
                  </div>
                  <div>
                    <Label>Monthly Price (R)</Label>
                    <Input
                      type="number"
                      value={tierFormData.price}
                      onChange={(e) => setTierFormData({ ...tierFormData, price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Max Listings (how many products they can list)</Label>
                    <Input
                      type="number"
                      value={tierFormData.max_listings}
                      onChange={(e) => setTierFormData({ ...tierFormData, max_listings: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Max Images per Listing</Label>
                    <Input
                      type="number"
                      value={tierFormData.max_images_per_listing}
                      onChange={(e) => setTierFormData({ ...tierFormData, max_images_per_listing: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Max CRM Prospects (customer leads)</Label>
                    <Input
                      type="number"
                      value={tierFormData.max_prospects}
                      onChange={(e) => setTierFormData({ ...tierFormData, max_prospects: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Max Poultry Batches (farm management)</Label>
                    <Input
                      type="number"
                      value={tierFormData.max_batches}
                      onChange={(e) => setTierFormData({ ...tierFormData, max_batches: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="can_show_phone"
                      checked={tierFormData.can_show_phone}
                      onChange={(e) => setTierFormData({ ...tierFormData, can_show_phone: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="can_show_phone">Can Show Phone Number</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="can_feature_listings"
                      checked={tierFormData.can_feature_listings}
                      onChange={(e) => setTierFormData({ ...tierFormData, can_feature_listings: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <Label htmlFor="can_feature_listings">Can Feature Listings</Label>
                  </div>
                </div>
                <Button
                  onClick={() => createTierMutation.mutate(tierFormData)}
                  disabled={!tierFormData.name || createTierMutation.isPending}
                  className="mt-4 bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                >
                  Create Tier
                </Button>
              </Card>

              <div className="grid sm:grid-cols-2 gap-6">
                {tiers.map((tier) => (
                  <Card key={tier.id} className="p-6 border-0 shadow-lg">
                    {editingTier?.id === tier.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Tier Name</Label>
                          <Input
                            value={editingTier.name}
                            onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                            placeholder="Tier name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Price (R/month)</Label>
                          <Input
                            type="number"
                            value={editingTier.price}
                            onChange={(e) => setEditingTier({ ...editingTier, price: parseFloat(e.target.value) })}
                            placeholder="Price"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Listings</Label>
                          <Input
                            type="number"
                            value={editingTier.max_listings}
                            onChange={(e) => setEditingTier({ ...editingTier, max_listings: parseInt(e.target.value) })}
                            placeholder="Max listings"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Images per Listing</Label>
                          <Input
                            type="number"
                            value={editingTier.max_images_per_listing}
                            onChange={(e) => setEditingTier({ ...editingTier, max_images_per_listing: parseInt(e.target.value) })}
                            placeholder="Max images"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max CRM Prospects</Label>
                          <Input
                            type="number"
                            value={editingTier.max_prospects || 50}
                            onChange={(e) => setEditingTier({ ...editingTier, max_prospects: parseInt(e.target.value) })}
                            placeholder="Max prospects"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Poultry Batches</Label>
                          <Input
                            type="number"
                            value={editingTier.max_batches || 10}
                            onChange={(e) => setEditingTier({ ...editingTier, max_batches: parseInt(e.target.value) })}
                            placeholder="Max batches"
                          />
                        </div>
                        <div className="flex gap-3">
                          <Button
                            onClick={() => updateTierMutation.mutate({ id: tier.id, data: editingTier })}
                            size="sm"
                            className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                          >
                            Save
                          </Button>
                          <Button onClick={() => setEditingTier(null)} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                            <p className="text-2xl font-bold text-[#7A9D7A] mt-1">R{tier.price}/mo</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingTier(tier)}
                              className="text-blue-600"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTierMutation.mutate(tier.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>• <strong>Listings:</strong> {tier.max_listings} max</p>
                          <p>• <strong>Images:</strong> {tier.max_images_per_listing} per listing</p>
                          <p>• <strong>CRM Prospects:</strong> {tier.max_prospects || 50} max</p>
                          <p>• <strong>Poultry Batches:</strong> {tier.max_batches || 10} max</p>
                          {tier.can_show_phone && <p>• Phone number visible</p>}
                          {tier.can_feature_listings && <p>• Can feature listings</p>}
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'feature-pricing' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <Card className="p-6 border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#7A9D7A]" />
                Create Feature Pricing Plan
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Plan Name</Label>
                    <Input
                      value={pricingFormData.name}
                      onChange={(e) => setPricingFormData({ ...pricingFormData, name: e.target.value })}
                      placeholder="e.g., 7 Days Featured"
                    />
                  </div>
                  <div>
                    <Label>Duration (days)</Label>
                    <Input
                      type="number"
                      value={pricingFormData.duration_days}
                      onChange={(e) => setPricingFormData({ ...pricingFormData, duration_days: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={pricingFormData.price}
                      onChange={(e) => setPricingFormData({ ...pricingFormData, price: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
                <Button
                  onClick={() => createPricingMutation.mutate({ ...pricingFormData, is_active: true })}
                  disabled={!pricingFormData.name || createPricingMutation.isPending}
                  className="mt-4 bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                >
                  Create Pricing Plan
                </Button>
              </Card>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Pricing Plans</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  {featurePricing.map((plan) => (
                    <Card key={plan.id} className="p-6 border-0 shadow-lg">
                      {editingPricing?.id === plan.id ? (
                        <div className="space-y-3">
                          <Input
                            value={editingPricing.name}
                            onChange={(e) => setEditingPricing({ ...editingPricing, name: e.target.value })}
                            placeholder="Plan name"
                          />
                          <Input
                            type="number"
                            value={editingPricing.duration_days}
                            onChange={(e) => setEditingPricing({ ...editingPricing, duration_days: parseInt(e.target.value) })}
                            placeholder="Days"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={editingPricing.price}
                            onChange={(e) => setEditingPricing({ ...editingPricing, price: parseFloat(e.target.value) })}
                            placeholder="Price"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => updatePricingMutation.mutate({ id: plan.id, data: editingPricing })}
                              size="sm"
                              className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                            >
                              Save
                            </Button>
                            <Button onClick={() => setEditingPricing(null)} variant="outline" size="sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingPricing(plan)}
                                className="text-blue-600 -mt-2"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deletePricingMutation.mutate(plan.id)}
                                className="text-red-600 -mt-2 -mr-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h4>
                          <p className="text-3xl font-bold text-[#7A9D7A] mb-2">R{plan.price}</p>
                          <p className="text-sm text-gray-600">{plan.duration_days} days featured</p>
                        </>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <Card className="border-0 shadow-lg">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Feature Payments</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ends</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {featurePayments.slice(0, 20).map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{payment.seller_id}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.listing_id}</td>
                          <td className="px-6 py-4 font-medium">R{payment.amount_paid}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.duration_days} days</td>
                          <td className="px-6 py-4">
                            <Badge variant={payment.status === 'active' ? 'default' : 'secondary'}>
                              {payment.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(payment.feature_ends).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
            </Card>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <div className="space-y-6">
              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Approval Settings</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Require Admin Approval for New Accounts</p>
                    <p className="text-sm text-gray-600">When enabled, new seller accounts will need admin approval before they can create listings. When disabled, all new accounts are automatically active.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="require_approval"
                      checked={adminSettings?.require_account_approval ?? false}
                      onChange={(e) => {
                        updateAdminSettingsMutation.mutate({
                          require_account_approval: e.target.checked
                        });
                      }}
                      className="w-5 h-5"
                    />
                    <Label htmlFor="require_approval" className="text-sm">
                      {adminSettings?.require_account_approval ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Yoco Webhook Settings</h3>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Validate Yoco Webhook Signature</p>
                    <p className="text-sm text-gray-600">When enabled, validates incoming webhook requests using YOCO_WEBHOOK_SECRET for security. Disable for testing.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="validate_webhook"
                      checked={adminSettings?.validate_yoco_webhook ?? false}
                      onChange={(e) => {
                        updateAdminSettingsMutation.mutate({
                          validate_yoco_webhook: e.target.checked
                        });
                      }}
                      className="w-5 h-5"
                    />
                    <Label htmlFor="validate_webhook" className="text-sm">
                      {adminSettings?.validate_yoco_webhook ? 'Enabled' : 'Disabled'}
                    </Label>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Fee Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Verification Fee (R)</Label>
                    <Input
                      type="number"
                      value={verificationFee || adminSettings?.verification_fee || 0}
                      onChange={(e) => setVerificationFee(parseFloat(e.target.value))}
                      placeholder="e.g., 150"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Verification Message</Label>
                    <Input
                      value={verificationMessage || adminSettings?.verification_fee_message || ''}
                      onChange={(e) => setVerificationMessage(e.target.value)}
                      placeholder="Message displayed to sellers about verification fee"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => updateAdminSettingsMutation.mutate({
                    verification_fee: verificationFee || adminSettings?.verification_fee || 0,
                    verification_fee_message: verificationMessage || adminSettings?.verification_fee_message || ''
                  })}
                  className="mt-4 bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                >
                  Save Fee Settings
                </Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'banking' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <div className="space-y-6">
              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Banking Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Bank Name</Label>
                    <Input
                      value={bankingFormData.bank_name}
                      onChange={(e) => setBankingFormData({ ...bankingFormData, bank_name: e.target.value })}
                      placeholder="e.g., FNB"
                    />
                  </div>
                  <div>
                    <Label>Account Holder</Label>
                    <Input
                      value={bankingFormData.account_holder}
                      onChange={(e) => setBankingFormData({ ...bankingFormData, account_holder: e.target.value })}
                      placeholder="Account holder name"
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={bankingFormData.account_number}
                      onChange={(e) => setBankingFormData({ ...bankingFormData, account_number: e.target.value })}
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <Label>Account Type</Label>
                    <Input
                      value={bankingFormData.account_type}
                      onChange={(e) => setBankingFormData({ ...bankingFormData, account_type: e.target.value })}
                      placeholder="e.g., Cheque, Savings"
                    />
                  </div>
                  <div>
                    <Label>Branch Code</Label>
                    <Input
                      value={bankingFormData.branch_code}
                      onChange={(e) => setBankingFormData({ ...bankingFormData, branch_code: e.target.value })}
                      placeholder="Branch code"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => createBankingInfoMutation.mutate(bankingFormData)}
                  disabled={!bankingFormData.bank_name || !bankingFormData.account_holder || !bankingFormData.account_number}
                  className="mt-4 bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                >
                  Update Banking Info
                </Button>
              </Card>

              {bankingInfo.length > 0 && (
                <Card className="p-6 border-0 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Banking Information</h3>
                  {bankingInfo.filter(info => info.is_active).map((info) => (
                    <div key={info.id} className="bg-blue-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Bank:</span>
                          <span className="ml-2 font-medium">{info.bank_name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Account Holder:</span>
                          <span className="ml-2 font-medium">{info.account_holder}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Account Number:</span>
                          <span className="ml-2 font-medium">{info.account_number}</span>
                        </div>
                        {info.account_type && (
                          <div>
                            <span className="text-gray-600">Account Type:</span>
                            <span className="ml-2 font-medium">{info.account_type}</span>
                          </div>
                        )}
                        {info.branch_code && (
                          <div>
                            <span className="text-gray-600">Branch Code:</span>
                            <span className="ml-2 font-medium">{info.branch_code}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'finances' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-6">
                <Card className="p-6 border-0 shadow-lg">
                  <DollarSign className="w-8 h-8 text-[#7A9D7A] mb-2" />
                  <p className="text-3xl font-bold text-gray-900">R{featurePayments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount_paid, 0).toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </Card>
                <Card className="p-6 border-0 shadow-lg">
                  <CheckCircle2 className="w-8 h-8 text-green-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{featurePayments.filter(p => p.status === 'verified').length}</p>
                  <p className="text-sm text-gray-600">Verified Payments</p>
                </Card>
                <Card className="p-6 border-0 shadow-lg">
                  <Loader2 className="w-8 h-8 text-yellow-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{pendingPayments.length}</p>
                  <p className="text-sm text-gray-600">Pending Verification</p>
                </Card>
                <Card className="p-6 border-0 shadow-lg">
                  <XCircle className="w-8 h-8 text-red-600 mb-2" />
                  <p className="text-3xl font-bold text-gray-900">{featurePayments.filter(p => p.status === 'rejected').length}</p>
                  <p className="text-sm text-gray-600">Rejected</p>
                </Card>
              </div>

              <Card className="border-0 shadow-lg">
                <div className="p-6 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {featurePayments.slice(0, 20).map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(payment.created_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{payment.seller_id}</td>
                          <td className="px-6 py-4 font-medium">R{payment.amount_paid}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{payment.duration_days} days</td>
                          <td className="px-6 py-4">
                            <Badge variant={payment.status === 'verified' ? 'default' : payment.status === 'pending' ? 'secondary' : 'destructive'}>
                              {payment.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'featured-listings' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="p-4 bg-yellow-50 border-b">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Featured Listings
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured Start</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Featured End</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listings.filter(l => l.featured).map((listing) => {
                      const now = new Date();
                      const featuredEnd = new Date(listing.featured_until);
                      const isActive = featuredEnd > now;
                      const daysRemaining = Math.ceil((featuredEnd - now) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <tr key={listing.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100'}
                                alt={listing.title}
                                className="w-12 h-12 rounded object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                                <Badge className="mt-1 bg-yellow-500">Featured</Badge>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{listing.created_by}</td>
                          <td className="px-6 py-4 font-medium">R{listing.price}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {featurePayments.find(p => p.listing_id === listing.id)?.feature_starts 
                              ? new Date(featurePayments.find(p => p.listing_id === listing.id).feature_starts).toLocaleDateString()
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {listing.featured_until ? new Date(listing.featured_until).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4">
                            {isActive ? (
                              <div>
                                <Badge className="bg-green-500">Active</Badge>
                                <p className="text-xs text-gray-500 mt-1">{daysRemaining} days left</p>
                              </div>
                            ) : (
                              <Badge variant="secondary">Expired</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`}>
                                <Button variant="ghost" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  await api.entities.Listing.update(listing.id, {
                                    featured: false,
                                    featured_until: null
                                  });
                                  queryClient.invalidateQueries(['all-listings']);
                                  toast.success('Listing unfeatured');
                                }}
                                className="text-yellow-600 hover:text-yellow-700"
                                title="Unfeature listing"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {listings.filter(l => l.featured).length === 0 && (
                <div className="p-12 text-center">
                  <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No featured listings</h3>
                  <p className="text-gray-600">No listings are currently featured</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listings.map((listing) => (
                      <tr key={listing.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100'}
                              alt={listing.title}
                              className="w-12 h-12 rounded object-cover"
                            />
                            <div>
                              <p className="font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                              {listing.featured && <Badge className="mt-1 bg-yellow-500">Featured</Badge>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{listing.created_by}</td>
                        <td className="px-6 py-4 font-medium">R{listing.price}</td>
                        <td className="px-6 py-4">
                          <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                            {listing.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {listing.featured && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={async () => {
                                  await api.entities.Listing.update(listing.id, {
                                    featured: false,
                                    featured_until: null
                                  });
                                  queryClient.invalidateQueries(['all-listings']);
                                  toast.success('Listing unfeatured');
                                }}
                                className="text-yellow-600 hover:text-yellow-700"
                                title="Unfeature listing"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteListingMutation.mutate(listing.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'auctions' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <div className="space-y-6">
              {/* Send Reminders Button */}
              <div className="flex justify-end">
                <Button 
                  onClick={() => sendPaymentRemindersMutation.mutate()}
                  disabled={sendPaymentRemindersMutation.isPending}
                  variant="outline"
                  className="text-[#E07A5F]"
                >
                  {sendPaymentRemindersMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Send Payment Reminders (5 days before expiry)
                </Button>
              </div>

              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-[#E07A5F]" />
                  <h3 className="font-semibold text-gray-900">Pending Auction House Payments</h3>
                </div>
                {pendingAuctionHousePayments.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No pending payments</h3>
                  </div>
                ) : (
                  <div className="divide-y">
                    {pendingAuctionHousePayments.map((payment) => (
                      <div key={payment.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <p className="font-medium text-gray-900">Seller: {payment.seller_email}</p>
                            <p className="text-sm text-gray-600">Auction House ID: {payment.auction_house_id}</p>
                            <p className="text-sm text-gray-600">Reference: {payment.payment_reference}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-[#E07A5F]">R{payment.amount}</p>
                            <Badge variant="secondary">{payment.tier_name || 'Basic'} - {payment.payment_type || 'initial'}</Badge>
                          </div>
                        </div>

                        {payment.payment_proof_url && (
                          <div className="mb-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingDocument({ url: payment.payment_proof_url, title: 'Payment Proof' })}
                              className="text-[#7A9D7A]"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Payment Proof
                            </Button>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Button
                            onClick={() => verifyAuctionHousePaymentMutation.mutate({ paymentId: payment.id, approved: true, payment })}
                            disabled={verifyAuctionHousePaymentMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Approve & Activate
                          </Button>
                          <Button
                            onClick={() => verifyAuctionHousePaymentMutation.mutate({ paymentId: payment.id, approved: false, payment })}
                            disabled={verifyAuctionHousePaymentMutation.isPending}
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-semibold text-gray-900">Active Auction Events</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Event</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {allAuctionEvents.filter(e => e.status !== 'ended').map((event) => (
                        <tr key={event.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{event.title}</td>
                          <td className="px-6 py-4">
                            <Badge className={event.status === 'live' ? 'bg-green-500' : event.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-500'}>
                              {event.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{event.total_items || 0} lots</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{new Date(event.end_time).toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <Link to={createPageUrl('AuctionEventDetail') + `?id=${event.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => endAuctionMutation.mutate(event.id)}
                                disabled={endAuctionMutation.isPending}
                              >
                                End & Finalize
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-semibold text-gray-900">All Auction Houses</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auction House</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscription</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {allAuctionHouses.map((house) => (
                        <tr key={house.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {house.logo_url ? (
                                <img src={house.logo_url} alt={house.name} className="w-10 h-10 rounded-full object-cover" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-[#E07A5F]/10 flex items-center justify-center">
                                  <Gavel className="w-5 h-5 text-[#E07A5F]" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{house.name}</p>
                                <p className="text-xs text-gray-500">{house.city}, {house.province}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{house.created_by}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline">{house.tier_name || 'Basic'}</Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {house.subscription_end ? new Date(house.subscription_end).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={house.status === 'active' ? 'default' : 'secondary'}>
                              {house.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'auction-tiers' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <div className="space-y-6">
              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#E07A5F]" />
                  Create Auction House Tier
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Tier Name</Label>
                    <Input
                      value={auctionTierForm.name}
                      onChange={(e) => setAuctionTierForm({ ...auctionTierForm, name: e.target.value })}
                      placeholder="e.g., Basic, Professional, Enterprise"
                    />
                  </div>
                  <div>
                    <Label>Monthly Price (R)</Label>
                    <Input
                      type="number"
                      value={auctionTierForm.monthly_price}
                      onChange={(e) => setAuctionTierForm({ ...auctionTierForm, monthly_price: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Max Live Auctions</Label>
                    <Input
                      type="number"
                      value={auctionTierForm.max_live_auctions}
                      onChange={(e) => setAuctionTierForm({ ...auctionTierForm, max_live_auctions: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>
                  <div>
                    <Label>Max Items Per Auction</Label>
                    <Input
                      type="number"
                      value={auctionTierForm.max_items_per_auction}
                      onChange={(e) => setAuctionTierForm({ ...auctionTierForm, max_items_per_auction: parseInt(e.target.value) })}
                      min="1"
                    />
                  </div>
                  <div className="flex items-center gap-4 col-span-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ah_featured"
                        checked={auctionTierForm.featured_placement}
                        onChange={(e) => setAuctionTierForm({ ...auctionTierForm, featured_placement: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="ah_featured">Featured Placement</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="ah_priority"
                        checked={auctionTierForm.priority_support}
                        onChange={(e) => setAuctionTierForm({ ...auctionTierForm, priority_support: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="ah_priority">Priority Support</Label>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => createAuctionTierMutation.mutate(auctionTierForm)}
                  disabled={!auctionTierForm.name || createAuctionTierMutation.isPending}
                  className="mt-4 bg-[#E07A5F] hover:bg-[#D06A4F]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tier
                </Button>
              </Card>

              <div className="grid sm:grid-cols-3 gap-6">
                {auctionHouseTiers.map((tier) => (
                  <Card key={tier.id} className="p-6 border-0 shadow-lg relative">
                    {editingAuctionTier?.id === tier.id ? (
                      <div className="space-y-3">
                        <Input
                          value={editingAuctionTier.name}
                          onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, name: e.target.value })}
                          placeholder="Tier name"
                        />
                        <Input
                          type="number"
                          value={editingAuctionTier.monthly_price}
                          onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, monthly_price: parseFloat(e.target.value) })}
                          placeholder="Monthly price"
                        />
                        <Input
                          type="number"
                          value={editingAuctionTier.max_live_auctions}
                          onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, max_live_auctions: parseInt(e.target.value) })}
                          placeholder="Max live auctions"
                        />
                        <Input
                          type="number"
                          value={editingAuctionTier.max_items_per_auction}
                          onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, max_items_per_auction: parseInt(e.target.value) })}
                          placeholder="Max items"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editingAuctionTier.featured_placement}
                            onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, featured_placement: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Featured</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => updateAuctionTierMutation.mutate({ id: tier.id, data: editingAuctionTier })}
                            size="sm"
                            className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                          >
                            Save
                          </Button>
                          <Button onClick={() => setEditingAuctionTier(null)} variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {tier.featured_placement && (
                          <div className="absolute -top-3 left-4 bg-[#E07A5F] text-white text-xs font-bold px-2 py-1 rounded">
                            POPULAR
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                            <p className="text-3xl font-bold text-[#E07A5F] mt-1">
                              R{tier.monthly_price}<span className="text-sm font-normal text-gray-500">/mo</span>
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingAuctionTier(tier)}
                              className="text-blue-600"
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteAuctionTierMutation.mutate(tier.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <ul className="space-y-2 text-sm text-gray-600">
                          <li className="flex items-center gap-2">
                            <Gavel className="w-4 h-4 text-[#7A9D7A]" />
                            {tier.max_live_auctions} live auction{tier.max_live_auctions > 1 ? 's' : ''} at a time
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#7A9D7A]" />
                            Up to {tier.max_items_per_auction} items per auction
                          </li>
                          {tier.featured_placement && (
                            <li className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-yellow-500" />
                              Featured placement
                            </li>
                          )}
                          {tier.priority_support && (
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-[#7A9D7A]" />
                              Priority support
                            </li>
                          )}
                        </ul>
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-xs text-gray-500">
                            {allAuctionHouses.filter(h => h.tier_id === tier.id).length} auction house(s) using this tier
                          </p>
                        </div>
                      </>
                    )}
                  </Card>
                ))}
              </div>

              {auctionHouseTiers.length === 0 && (
                <Card className="p-12 text-center border-0 shadow-lg">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No tiers created yet</h3>
                  <p className="text-gray-600">Create your first auction house tier above</p>
                </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'email-marketing' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>
            <EmailCampaignManager />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="w-8 h-8 text-[#7A9D7A]" />
                  <div>
                    <p className="text-sm text-gray-600">Total Listings</p>
                    <p className="text-3xl font-bold text-gray-900">{listings.length}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Active: {listings.filter(l => l.status === 'active').length}
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Eye className="w-8 h-8 text-[#E07A5F]" />
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-3xl font-bold text-gray-900">{totalViews}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Avg: {listings.length > 0 ? Math.round(totalViews / listings.length) : 0} per listing
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <MessageCircle className="w-8 h-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Inquiries</p>
                    <p className="text-3xl font-bold text-gray-900">{inquiries.length}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Engagement rate: {listings.length > 0 ? ((inquiries.length / totalViews) * 100).toFixed(1) : 0}%
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-8 h-8 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Sellers: {users.filter(u => u.user_type === 'seller' || u.user_type === 'both').length}
                </div>
              </Card>
            </div>

            <Card className="p-6 border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Most Viewed Listings</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquiries</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {listings
                      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                      .slice(0, 10)
                      .map((listing) => (
                        <tr key={listing.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100'}
                                alt={listing.title}
                                className="w-10 h-10 rounded object-cover"
                              />
                              <div>
                                <p className="font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                                {listing.featured && <Badge className="mt-1 bg-yellow-500 text-xs">Featured</Badge>}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{listing.created_by}</td>
                          <td className="px-6 py-4 font-medium">{listing.view_count || 0}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{listing.inquiry_count || 0}</td>
                          <td className="px-6 py-4">
                            <Badge variant={
                              (listing.view_count || 0) > 0 && ((listing.inquiry_count || 0) / (listing.view_count || 1)) > 0.1 
                                ? 'default' 
                                : 'secondary'
                            }>
                              {(listing.view_count || 0) > 0 
                                ? `${(((listing.inquiry_count || 0) / (listing.view_count || 1)) * 100).toFixed(1)}%`
                                : '0%'
                              }
                            </Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Listings by Category</h3>
                <div className="space-y-3">
                  {Object.entries(
                    listings.reduce((acc, listing) => {
                      acc[listing.category] = (acc[listing.category] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .map(([category, count]) => {
                      const percentage = (count / listings.length) * 100;
                      const categoryLabels = {
                        chickens: 'Chickens', ducks: 'Ducks', geese: 'Geese', turkeys: 'Turkeys',
                        quail: 'Quail', guinea_fowl: 'Guinea Fowl', peafowl: 'Peafowl',
                        pigeons: 'Pigeons', eggs_table: 'Table Eggs', eggs_fertile: 'Fertile Eggs',
                        chicks: 'Chicks', growers: 'Growers', layers: 'Layers', broilers: 'Broilers',
                        feed: 'Feed', supplements: 'Supplements', incubators: 'Incubators',
                        equipment: 'Equipment', other: 'Other'
                      };
                      return (
                        <div key={category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700 capitalize">{categoryLabels[category] || category}</span>
                            <span className="font-medium text-gray-900">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#7A9D7A] h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>

              <Card className="p-6 border-0 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Listings by Province</h3>
                <div className="space-y-3">
                  {Object.entries(
                    listings.reduce((acc, listing) => {
                      const province = listing.province || 'Unknown';
                      acc[province] = (acc[province] || 0) + 1;
                      return acc;
                    }, {})
                  )
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 9)
                    .map(([province, count]) => {
                      const percentage = (count / listings.length) * 100;
                      return (
                        <div key={province}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{province}</span>
                            <span className="font-medium text-gray-900">{count} ({percentage.toFixed(1)}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-[#E07A5F] h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Card>
            </div>

            <Card className="p-6 border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Sellers by Views</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Views</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Inquiries</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Views/Listing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Object.entries(
                      listings.reduce((acc, listing) => {
                        const seller = listing.created_by;
                        if (!acc[seller]) {
                          acc[seller] = { views: 0, inquiries: 0, count: 0 };
                        }
                        acc[seller].views += listing.view_count || 0;
                        acc[seller].inquiries += listing.inquiry_count || 0;
                        acc[seller].count += 1;
                        return acc;
                      }, {})
                    )
                      .sort(([, a], [, b]) => b.views - a.views)
                      .slice(0, 10)
                      .map(([seller, stats]) => (
                        <tr key={seller} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">{seller}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{stats.count}</td>
                          <td className="px-6 py-4 font-medium">{stats.views}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">{stats.inquiries}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {Math.round(stats.views / stats.count)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'competitions' && (
          <div className="space-y-6">
            <div className="mb-4">
              <Button variant="outline" onClick={() => setActiveTab('overview')} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </div>

            <Card className="p-6 border-0 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Competition</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Competition Name *</Label>
                  <Input
                    value={competitionForm.name}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, name: e.target.value })}
                    placeholder="e.g., Top Rooster of the Week"
                  />
                </div>
                <div>
                  <Label>Scoring Method</Label>
                  <Select value={competitionForm.scoring_method} onValueChange={(value) => setCompetitionForm({ ...competitionForm, scoring_method: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="average">Average Rating</SelectItem>
                      <SelectItem value="total">Total Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={competitionForm.description}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, description: e.target.value })}
                    placeholder="Competition description"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Banner Image (for homepage)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingBanner(true);
                      try {
                        const { file_url } = await api.integrations.Core.UploadFile({ file });
                        setCompetitionForm({ ...competitionForm, banner_image_url: file_url });
                        toast.success('Banner uploaded');
                      } catch (error) {
                        toast.error('Failed to upload banner');
                      }
                      setUploadingBanner(false);
                      e.target.value = '';
                    }}
                    disabled={uploadingBanner}
                  />
                  {uploadingBanner && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                  {competitionForm.banner_image_url && (
                    <div className="mt-2">
                      <img src={competitionForm.banner_image_url} alt="Banner preview" className="h-24 object-cover rounded" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Start Date *</Label>
                  <Input
                    type="datetime-local"
                    value={competitionForm.start_date}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input
                    type="datetime-local"
                    value={competitionForm.end_date}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Min Rating</Label>
                  <Input
                    type="number"
                    value={competitionForm.min_rating}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, min_rating: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max Rating</Label>
                  <Input
                    type="number"
                    value={competitionForm.max_rating}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, max_rating: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button
                onClick={() => createCompetitionMutation.mutate(competitionForm)}
                disabled={!competitionForm.name || !competitionForm.start_date || !competitionForm.end_date}
                className="mt-4 bg-[#7A9D7A] hover:bg-[#6A8D6A]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Competition
              </Button>
            </Card>

            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-900">All Competitions</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entries</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {competitions.map((comp) => {
                      const now = new Date();
                      const isPast = new Date(comp.end_date) < now;
                      const canFinalize = isPast && !comp.winner_id;
                      
                      return (
                        <tr key={comp.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <p className="font-medium text-gray-900">{comp.name}</p>
                            <p className="text-xs text-gray-500">{comp.description}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {moment(comp.start_date).format('MMM D')} - {moment(comp.end_date).format('MMM D, YYYY')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{comp.total_entries || 0}</td>
                          <td className="px-6 py-4">
                            <Badge variant={comp.status === 'active' ? 'default' : comp.status === 'ended' ? 'secondary' : 'outline'}>
                              {comp.status || 'upcoming'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {canFinalize && (
                                <Button
                                  size="sm"
                                  className="bg-yellow-500 hover:bg-yellow-600"
                                  onClick={() => finalizeCompetitionMutation.mutate(comp.id)}
                                  disabled={finalizeCompetitionMutation.isPending}
                                >
                                  <Trophy className="w-4 h-4 mr-1" />
                                  Finalize
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingCompetition(comp)}
                                className="text-blue-600"
                              >
                                <Settings className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteCompetitionMutation.mutate(comp.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Competition Entries Table */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="p-4 bg-gray-50 border-b">
                <h3 className="font-semibold text-gray-900">All Competition Entries</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Competition</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {allCompetitionEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {entry.images?.[0] && (
                              <img src={entry.images[0]} alt={entry.chicken_name} className="w-12 h-12 rounded object-cover" />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{entry.chicken_name}</p>
                              <p className="text-xs text-gray-500">{entry.breed}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{entry.competition_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{entry.owner_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{entry.vote_count || 0}</td>
                        <td className="px-6 py-4 text-sm font-medium">{(entry.average_rating || 0).toFixed(1)}</td>
                        <td className="px-6 py-4">
                          {entry.disqualified ? (
                            <Badge variant="destructive">Disqualified</Badge>
                          ) : (
                            <Badge>Active</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Link to={createPageUrl('CompetitionDetail') + `?id=${entry.competition_id}`}>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            {!entry.disqualified && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDisqualifyingEntry(entry);
                                  setDisqualificationReason('');
                                }}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Disqualify Entry Dialog */}
            <Dialog open={!!disqualifyingEntry} onOpenChange={(open) => !open && setDisqualifyingEntry(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Disqualify Entry</DialogTitle>
                </DialogHeader>
                {disqualifyingEntry && (
                  <div className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-900">
                        You are about to disqualify <strong>{disqualifyingEntry.chicken_name}</strong> by {disqualifyingEntry.owner_name}
                      </p>
                    </div>
                    <div>
                      <Label>Disqualification Reason *</Label>
                      <Textarea
                        value={disqualificationReason}
                        onChange={(e) => setDisqualificationReason(e.target.value)}
                        placeholder="e.g., Violated competition rules"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">This message will be visible to the entry owner</p>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setDisqualifyingEntry(null)}>Cancel</Button>
                      <Button 
                        onClick={() => disqualifyEntryMutation.mutate({ 
                          entryId: disqualifyingEntry.id, 
                          reason: disqualificationReason 
                        })}
                        disabled={!disqualificationReason || disqualifyEntryMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Disqualify Entry
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Edit Competition Dialog */}
            <Dialog open={!!editingCompetition} onOpenChange={(open) => !open && setEditingCompetition(null)}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Competition</DialogTitle>
                </DialogHeader>
                {editingCompetition && (
                  <div className="space-y-4">
                    <div>
                      <Label>Competition Name</Label>
                      <Input
                        value={editingCompetition.name}
                        onChange={(e) => setEditingCompetition({ ...editingCompetition, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input
                        value={editingCompetition.description || ''}
                        onChange={(e) => setEditingCompetition({ ...editingCompetition, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Banner Image</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingBanner(true);
                          try {
                            const { file_url } = await api.integrations.Core.UploadFile({ file });
                            setEditingCompetition({ ...editingCompetition, banner_image_url: file_url });
                            toast.success('Banner uploaded');
                          } catch (error) {
                            toast.error('Failed to upload banner');
                          }
                          setUploadingBanner(false);
                          e.target.value = '';
                        }}
                        disabled={uploadingBanner}
                      />
                      {uploadingBanner && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                      {editingCompetition.banner_image_url && (
                        <div className="mt-2">
                          <img src={editingCompetition.banner_image_url} alt="Banner preview" className="h-24 object-cover rounded" />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="datetime-local"
                        value={moment(editingCompetition.start_date).format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => setEditingCompetition({ ...editingCompetition, start_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="datetime-local"
                        value={moment(editingCompetition.end_date).format('YYYY-MM-DDTHH:mm')}
                        onChange={(e) => setEditingCompetition({ ...editingCompetition, end_date: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Min Rating</Label>
                        <Input
                          type="number"
                          value={editingCompetition.min_rating}
                          onChange={(e) => setEditingCompetition({ ...editingCompetition, min_rating: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Max Rating</Label>
                        <Input
                          type="number"
                          value={editingCompetition.max_rating}
                          onChange={(e) => setEditingCompetition({ ...editingCompetition, max_rating: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Scoring Method</Label>
                      <Select 
                        value={editingCompetition.scoring_method} 
                        onValueChange={(value) => setEditingCompetition({ ...editingCompetition, scoring_method: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="average">Average Rating</SelectItem>
                          <SelectItem value="total">Total Score</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setEditingCompetition(null)}>Cancel</Button>
                      <Button 
                        onClick={() => updateCompetitionMutation.mutate({ id: editingCompetition.id, data: editingCompetition })}
                        className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                      >
                        Update Competition
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {viewingDocument && (
        <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>{viewingDocument.title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto">
              {viewingDocument.url.endsWith('.pdf') ? (
                <iframe src={viewingDocument.url} className="w-full h-[70vh]" />
              ) : (
                <img src={viewingDocument.url} alt={viewingDocument.title} className="w-full" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}