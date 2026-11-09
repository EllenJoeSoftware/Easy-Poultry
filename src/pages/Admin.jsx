import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Package, MessageCircle, Trash2, Eye, Loader2, CheckCircle2, XCircle, Star, Settings, DollarSign, Gavel, Building2, Plus, Mail, ArrowLeft, Trophy, BarChart3, Search, X, MoreHorizontal, Pencil, ExternalLink, Wallet, TrendingUp, Layers, LayoutGrid, Ban, Clock, ShieldCheck, FileText, Landmark } from 'lucide-react';
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
          navigate('/');
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
  const [adminSearch, setAdminSearch] = useState('');
  const [listingStatusFilter, setListingStatusFilter] = useState('all');

  const deleteListingMutation = useMutation({
    mutationFn: (id) => api.entities.Listing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['all-listings']);
      toast.success('Listing deleted');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const updateUserTypeMutation = useMutation({
    mutationFn: async ({ userId, userType }) => {
      await api.entities.User.update(userId, { user_type: userType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-users']);
      toast.success('User type updated');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const deleteTierMutation = useMutation({
    mutationFn: (id) => api.entities.SellerTier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiers']);
      toast.success('Tier deleted');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const createPricingMutation = useMutation({
    mutationFn: (data) => api.entities.FeaturePricing.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feature-pricing-admin']);
      toast.success('Pricing plan created');
      setPricingFormData({ name: '', duration_days: 7, price: 0 });
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const deletePricingMutation = useMutation({
    mutationFn: (id) => api.entities.FeaturePricing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['feature-pricing-admin']);
      toast.success('Pricing plan deleted');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const updateTierMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.SellerTier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['tiers']);
      toast.success('Tier updated');
      setEditingTier(null);
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const updatePricingMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.FeaturePricing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feature-pricing-admin']);
      toast.success('Pricing plan updated');
      setEditingPricing(null);
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const createAuctionTierMutation = useMutation({
    mutationFn: (data) => api.entities.AuctionHouseTier.create({ ...data, is_active: true, sort_order: auctionHouseTiers.length }),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-house-tiers']);
      toast.success('Tier created');
      setAuctionTierForm({ name: '', monthly_price: 500, max_live_auctions: 1, max_items_per_auction: 20, featured_placement: false, priority_support: false });
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const updateAuctionTierMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.AuctionHouseTier.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-house-tiers']);
      toast.success('Tier updated');
      setEditingAuctionTier(null);
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const deleteAuctionTierMutation = useMutation({
    mutationFn: (id) => api.entities.AuctionHouseTier.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-house-tiers']);
      toast.success('Tier deleted');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const updateCompetitionMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Competition.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-competitions']);
      toast.success('Competition updated');
      setEditingCompetition(null);
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const deleteCompetitionMutation = useMutation({
    mutationFn: (id) => api.entities.Competition.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-competitions']);
      toast.success('Competition deleted');
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  const activeListings = listings.filter(l => l.status === 'active').length;
  const totalViews = listings.reduce((sum, l) => sum + (l.view_count || 0), 0);
  const pendingPaymentCount = pendingPayments.length + pendingVerificationPayments.length + pendingTierUpgrades.length;
  const q = adminSearch.trim().toLowerCase();
  const matches = (...vals) => !q || vals.some(v => String(v ?? '').toLowerCase().includes(q));

  const NAV = [
    { label: 'Platform', items: [
      { value: 'overview', icon: LayoutGrid, label: 'Overview' },
      { value: 'users', icon: Users, label: 'Users', count: users.length },
      { value: 'verifications', icon: ShieldCheck, label: 'Verifications', count: pendingVerifications.length, alert: true },
      { value: 'payments', icon: Wallet, label: 'Payments', count: pendingPaymentCount, alert: true },
      { value: 'listings', icon: Package, label: 'Listings', count: listings.length },
      { value: 'featured-listings', icon: Star, label: 'Featured', count: listings.filter(l => l.featured).length },
    ]},
    { label: 'Commerce', items: [
      { value: 'tiers', icon: Layers, label: 'Seller tiers', count: tiers.length },
      { value: 'feature-pricing', icon: DollarSign, label: 'Feature pricing', count: featurePricing.length },
      { value: 'finances', icon: TrendingUp, label: 'Finances' },
      { value: 'banking', icon: Landmark, label: 'Banking' },
    ]},
    { label: 'Auctions & events', items: [
      { value: 'auctions', icon: Gavel, label: 'Auctions', count: pendingAuctionHousePayments.length, alert: true },
      { value: 'auction-tiers', icon: Building2, label: 'Auction tiers', count: auctionHouseTiers.length },
      { value: 'competitions', icon: Trophy, label: 'Competitions', count: competitions.length },
    ]},
    { label: 'Growth', items: [
      { value: 'email-marketing', icon: Mail, label: 'Email campaigns' },
      { value: 'stats', icon: BarChart3, label: 'Statistics' },
      { value: 'settings', icon: Settings, label: 'Settings' },
    ]},
  ];
  const allNav = NAV.flatMap(g => g.items);
  const current = allNav.find(i => i.value === activeTab) || allNav[0];
  const goTab = (value) => { setActiveTab(value); setAdminSearch(''); };

  const unfeatureListing = async (listing) => {
    await api.entities.Listing.update(listing.id, {
      featured: false,
      featured_until: null
    });
    queryClient.invalidateQueries(['all-listings']);
    toast.success('Listing unfeatured');
  };

  const proofButton = (url, title = 'Payment Proof') => url ? (
    <Button variant="outline" size="sm" className="rounded-full gap-1.5 text-xs" onClick={() => setViewingDocument({ url, title })}>
      <Eye className="w-3.5 h-3.5" /> {title}
    </Button>
  ) : null;

  const approveReject = ({ onApprove, onReject, approveLabel, pending }) => (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onApprove} disabled={pending} className="btn-cta px-4 py-2 text-sm gap-1.5">
        <CheckCircle2 className="w-4 h-4" /> {approveLabel}
      </Button>
      <Button onClick={onReject} disabled={pending} variant="outline" className="rounded-full gap-1.5 text-terracotta-600 hover:text-terracotta-700">
        <XCircle className="w-4 h-4" /> Reject
      </Button>
    </div>
  );

  const PaymentQueue = ({ title, icon, items, emptyTitle, emptySubtitle, render }) => (
    <Panel title={title} icon={icon} padded={false} action={<Chip tone={items.length ? 'pending' : 'inactive'}>{items.length} pending</Chip>}>
      {items.length === 0 ? (
        <EmptyState variant="plain" icon={CheckCircle2} title={emptyTitle} subtitle={emptySubtitle} />
      ) : (
        <ul className="divide-y divide-border">{items.map(render)}</ul>
      )}
    </Panel>
  );

  return (
    <PageShell
      variant="compact"
      eyebrow="Admin"
      title="Administration"
      subtitle="Users, listings, payments, auctions and platform configuration — all in one place."
      breadcrumb={[{ label: 'App', href: createPageUrl('Dashboard') }, { label: 'Administration' }]}
      action={
        <Link to={createPageUrl('AdminPayouts')}>
          <Button className="btn-ghost border border-border bg-white px-5 py-2.5 text-sm gap-1.5"><Wallet className="w-4 h-4" /> Payout requests</Button>
        </Link>
      }
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Users} label="Total users" value={users.length.toLocaleString()} tint="moss" />
        <StatCard icon={Package} label="Active listings" value={activeListings.toLocaleString()} deltaLabel={`${listings.length} total`} tint="sage" />
        <StatCard icon={Eye} label="Total views" value={totalViews.toLocaleString()} tint="yolk" />
        <StatCard icon={ShieldCheck} label="Pending approvals" value={(pendingVerifications.length + pendingPaymentCount + pendingAuctionHousePayments.length).toLocaleString()} deltaLabel="verifications + payments" tint="terracotta" />
      </div>

      <div className="lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-8 lg:items-start">
        {/* Section nav — left rail on lg, horizontal pills below */}
        <nav className="mb-5 lg:mb-0 lg:sticky lg:top-24">
          <div className="lg:hidden card-premium p-2 flex gap-1 overflow-x-auto scrollbar-none">
            {allNav.map(item => {
              const on = activeTab === item.value;
              return (
                <button key={item.value} onClick={() => goTab(item.value)}
                  className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${on ? 'bg-moss-600 text-cream' : 'text-ink/65 hover:bg-moss-50 hover:text-moss-700'}`}>
                  <item.icon className="w-3.5 h-3.5" /> {item.label}
                  {item.count > 0 && <span className={`text-[10px] px-1.5 rounded-full ${on ? 'bg-white/20' : item.alert ? 'bg-terracotta-50 text-terracotta-600' : 'bg-cream-deep text-ink/50'}`}>{item.count}</span>}
                </button>
              );
            })}
          </div>
          <div className="hidden lg:block card-premium p-2 space-y-4">
            {NAV.map(group => (
              <div key={group.label}>
                <p className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-[0.18em] font-semibold text-ink/40">{group.label}</p>
                <ul className="space-y-0.5">
                  {group.items.map(item => {
                    const on = activeTab === item.value;
                    return (
                      <li key={item.value}>
                        <button onClick={() => goTab(item.value)}
                          className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors ${on ? 'bg-moss-600 text-cream font-medium shadow-sm' : 'text-ink/70 hover:bg-moss-50 hover:text-moss-700'}`}>
                          <item.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                          <span className="truncate">{item.label}</span>
                          {item.count > 0 && (
                            <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums ${on ? 'bg-white/20 text-cream' : item.alert ? 'bg-terracotta-50 text-terracotta-600' : 'bg-cream-deep text-ink/50'}`}>{item.count}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Section body */}
        <div className="min-w-0 space-y-6">
          {/* Section heading */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-moss-50 text-moss-700 flex items-center justify-center flex-shrink-0"><current.icon className="w-4 h-4" /></div>
              <h2 className="font-display text-xl text-ink truncate">{current.label}</h2>
            </div>
            {activeTab !== 'overview' && (
              <button onClick={() => goTab('overview')} className="hidden sm:inline-flex items-center gap-1 text-xs text-ink/55 hover:text-moss-700"><ArrowLeft className="w-3.5 h-3.5" /> Overview</button>
            )}
          </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {(pendingVerifications.length + pendingPaymentCount + pendingAuctionHousePayments.length) > 0 && (
              <div className="relative overflow-hidden rounded-2xl bg-moss-gradient text-cream p-5">
                <div className="absolute inset-0 grain opacity-50" />
                <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="eyebrow text-cream/60 mb-1">Needs attention</p>
                    <p className="font-display text-lg">You have items waiting for review.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pendingVerifications.length > 0 && <button onClick={() => goTab('verifications')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20">{pendingVerifications.length} verifications</button>}
                    {pendingPaymentCount > 0 && <button onClick={() => goTab('payments')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20">{pendingPaymentCount} payments</button>}
                    {pendingAuctionHousePayments.length > 0 && <button onClick={() => goTab('auctions')} className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 hover:bg-white/20">{pendingAuctionHousePayments.length} auction payments</button>}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allNav.filter(i => i.value !== 'overview').map(tile => (
                <button key={tile.value} onClick={() => goTab(tile.value)}
                  className="group text-left card-premium p-4 hover:shadow-lift transition-all duration-300 hover:-translate-y-0.5 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-moss-50 text-moss-700 flex items-center justify-center flex-shrink-0 group-hover:bg-moss-600 group-hover:text-cream transition-colors"><tile.icon className="w-5 h-5" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{tile.label}</p>
                    <p className="text-xs text-ink/50 mt-0.5">{TILE_DESC[tile.value]}</p>
                  </div>
                  {tile.count > 0 && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full tabular-nums ${tile.alert ? 'bg-terracotta-50 text-terracotta-600' : 'bg-cream-deep text-ink/60'}`}>{tile.count}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && (() => {
          // Sort users
          const sortedUsers = [...users].filter(u => matches(u.full_name, u.email, u.farm_name)).sort((a, b) => {
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
          const totalPages = Math.max(1, Math.ceil(sortedUsers.length / usersPerPage));
          const startIndex = (usersPage - 1) * usersPerPage;
          const paginatedUsers = sortedUsers.slice(startIndex, startIndex + usersPerPage);
          const cols = 'md:grid-cols-[minmax(0,1.6fr)_130px_minmax(0,1fr)_56px]';

          return (
            <div className="space-y-4">
              <div className="card-premium p-3 flex flex-col md:flex-row md:items-center gap-3">
                <SearchBox value={adminSearch} onChange={(v) => { setAdminSearch(v); setUsersPage(1); }} placeholder="Search name, email or farm…" />
                <div className="flex items-center gap-2 md:ml-auto">
                  <Select value={usersSortBy} onValueChange={setUsersSortBy}>
                    <SelectTrigger className="w-40 rounded-xl bg-cream border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inactive_first">Inactive First</SelectItem>
                      <SelectItem value="active_first">Active First</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={usersPerPage.toString()} onValueChange={(val) => { setUsersPerPage(parseInt(val)); setUsersPage(1); }}>
                    <SelectTrigger className="w-24 rounded-xl bg-cream border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="card-premium overflow-hidden">
                <ListHeader cols={cols} headers={['User', 'Type', 'Status', '']} />
                {paginatedUsers.length === 0 ? (
                  <EmptyState variant="plain" icon={Users} title="No users match" subtitle="Try a different search term." />
                ) : (
                  <ul className="divide-y divide-border">
                    {paginatedUsers.map((u) => (
                      <Row key={u.id} cols={cols}>
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={u.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name)}`}
                            alt={u.full_name}
                            className="w-10 h-10 rounded-full border border-border object-cover flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{u.full_name}</p>
                            <p className="text-xs text-ink/55 truncate">{u.email}{u.farm_name ? ` · ${u.farm_name}` : ''}</p>
                          </div>
                        </div>
                        <Cell label="Type">
                          <Select
                            value={u.user_type || 'buyer'}
                            onValueChange={(value) => updateUserTypeMutation.mutate({ userId: u.id, userType: value })}
                          >
                            <SelectTrigger className="h-8 w-28 rounded-full text-xs bg-cream border-border"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buyer">Buyer</SelectItem>
                              <SelectItem value="seller">Seller</SelectItem>
                              <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                          </Select>
                        </Cell>
                        <Cell label="Status">
                          <div className="flex flex-wrap gap-1.5">
                            {u.seller_verified && <Chip tone="active"><ShieldCheck className="w-3 h-3" /> Verified</Chip>}
                            {u.seller_activated ? <Chip tone="active">Activated</Chip> : <Chip tone="inactive">Not activated</Chip>}
                          </div>
                        </Cell>
                        <div className="flex md:justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="User actions"><MoreHorizontal className="w-4 h-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-52">
                              {u.seller_verified ? (
                                <DropdownMenuItem onSelect={() => verifySellerMutation.mutate({ userId: u.id, approved: false })} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><XCircle className="w-4 h-4" /> Unverify seller</DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onSelect={() => verifySellerMutation.mutate({ userId: u.id, approved: true })} className="gap-2"><ShieldCheck className="w-4 h-4 text-moss-600" /> Verify seller</DropdownMenuItem>
                              )}
                              <DropdownMenuItem onSelect={() => activateSellerMutation.mutate({ userId: u.id, activated: !u.seller_activated })} className="gap-2">
                                {u.seller_activated ? <><Ban className="w-4 h-4" /> Deactivate</> : <><CheckCircle2 className="w-4 h-4 text-moss-600" /> Activate</>}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild><a href={`mailto:${u.email}`} className="gap-2"><ExternalLink className="w-4 h-4" /> Email user</a></DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Row>
                    ))}
                  </ul>
                )}

                <div className="px-5 py-3 bg-cream border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-xs text-ink/55">
                    Showing {sortedUsers.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + usersPerPage, sortedUsers.length)} of {sortedUsers.length} users
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}>Previous</Button>
                    <span className="text-xs text-ink/55 tabular-nums">Page {usersPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => setUsersPage(p => Math.min(totalPages, p + 1))} disabled={usersPage >= totalPages}>Next</Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'verifications' && (
          <Panel title="Pending seller verifications" icon={ShieldCheck} padded={false} action={<Chip tone={pendingVerifications.length ? 'pending' : 'inactive'}>{pendingVerifications.length} pending</Chip>}>
            {pendingVerifications.length === 0 ? (
              <EmptyState variant="plain" icon={CheckCircle2} title="No pending verifications" subtitle="All verification requests have been processed." />
            ) : (
              <ul className="divide-y divide-border">
                {pendingVerifications.map((seller) => (
                  <li key={seller.id} className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={seller.profile_photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(seller.full_name)}`}
                          alt={seller.full_name}
                          className="w-12 h-12 rounded-full border border-border object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-ink">{seller.full_name}</p>
                          <p className="text-sm text-ink/60 truncate">{seller.email}</p>
                          {seller.farm_name && <p className="text-xs text-ink/50">{seller.farm_name}</p>}
                        </div>
                      </div>
                      <Chip tone="pending"><Clock className="w-3 h-3" /> Pending review</Chip>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="rounded-xl bg-cream border border-border p-3">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-ink/45 mb-2">ID Document</p>
                        {seller.id_document_url ? proofButton(seller.id_document_url, 'ID Document') : <p className="text-sm text-ink/50">Not uploaded</p>}
                      </div>
                      <div className="rounded-xl bg-cream border border-border p-3">
                        <p className="text-[11px] uppercase tracking-wider font-semibold text-ink/45 mb-2">Proof of Address</p>
                        {seller.proof_of_address_url ? proofButton(seller.proof_of_address_url, 'Proof of Address') : <p className="text-sm text-ink/50">Not uploaded</p>}
                      </div>
                    </div>

                    {approveReject({
                      onApprove: () => verifySellerMutation.mutate({ userId: seller.id, approved: true }),
                      onReject: () => verifySellerMutation.mutate({ userId: seller.id, approved: false }),
                      approveLabel: 'Approve & verify',
                      pending: verifySellerMutation.isPending,
                    })}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <PaymentQueue title="Featured listing payments" icon={Star} items={pendingPayments}
              emptyTitle="No pending payments" emptySubtitle="All payment verifications are up to date."
              render={(payment) => (
                <li key={payment.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-ink">Seller: {payment.seller_id}</p>
                      <p className="text-ink/60">Listing ID: {payment.listing_id}</p>
                      <p className="text-ink/60">Reference: <span className="font-mono text-xs">{payment.payment_reference}</span></p>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-display text-2xl font-bold text-moss-700">R{payment.amount_paid}</p>
                      <p className="text-xs text-ink/55">{payment.duration_days} days</p>
                    </div>
                  </div>
                  {payment.payment_proof_url && <div className="mb-4">{proofButton(payment.payment_proof_url)}</div>}
                  {approveReject({
                    onApprove: () => verifyPaymentMutation.mutate({ paymentId: payment.id, approved: true, payment }),
                    onReject: () => verifyPaymentMutation.mutate({ paymentId: payment.id, approved: false, payment }),
                    approveLabel: 'Approve & feature',
                    pending: verifyPaymentMutation.isPending,
                  })}
                </li>
              )} />

            <PaymentQueue title="Verification payments" icon={ShieldCheck} items={pendingVerificationPayments}
              emptyTitle="No pending verification payments" emptySubtitle="All verification payments are up to date."
              render={(payment) => (
                <li key={payment.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-ink">Seller: {payment.seller_id}</p>
                      <p className="text-ink/60">Reference: <span className="font-mono text-xs">{payment.payment_reference}</span></p>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-display text-2xl font-bold text-moss-700">R{payment.amount_paid}</p>
                      <Chip tone="inactive">Verification fee</Chip>
                    </div>
                  </div>
                  {payment.payment_proof_url && <div className="mb-4">{proofButton(payment.payment_proof_url)}</div>}
                  {approveReject({
                    onApprove: () => verifyVerificationPaymentMutation.mutate({ paymentId: payment.id, approved: true, payment }),
                    onReject: () => verifyVerificationPaymentMutation.mutate({ paymentId: payment.id, approved: false, payment }),
                    approveLabel: 'Approve & verify seller',
                    pending: verifyVerificationPaymentMutation.isPending,
                  })}
                </li>
              )} />

            <PaymentQueue title="Tier upgrade payments" icon={Layers} items={pendingTierUpgrades}
              emptyTitle="No pending tier upgrades" emptySubtitle="All tier upgrade verifications are up to date."
              render={(upgrade) => (
                <li key={upgrade.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-ink">Seller: {upgrade.seller_id}</p>
                      <p className="text-ink/60">From <span className="font-medium text-ink">{upgrade.from_tier}</span> → <span className="font-medium text-ink">{upgrade.to_tier}</span></p>
                      <p className="text-ink/60">Reference: <span className="font-mono text-xs">{upgrade.payment_reference}</span></p>
                    </div>
                    <p className="font-display text-2xl font-bold text-moss-700 sm:text-right">R{upgrade.amount_paid}</p>
                  </div>
                  {upgrade.payment_proof_url && <div className="mb-4">{proofButton(upgrade.payment_proof_url)}</div>}
                  {approveReject({
                    onApprove: () => verifyTierUpgradeMutation.mutate({ upgradeId: upgrade.id, approved: true, upgrade }),
                    onReject: () => verifyTierUpgradeMutation.mutate({ upgradeId: upgrade.id, approved: false, upgrade }),
                    approveLabel: 'Approve & upgrade',
                    pending: verifyTierUpgradeMutation.isPending,
                  })}
                </li>
              )} />

            <Panel title="Yoco transaction logs" icon={FileText} padded={false}>
              {(() => {
                const cols = 'md:grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_110px_100px_90px_44px]';
                return (
                  <>
                    <ListHeader cols={cols} headers={['Date', 'User', 'Type', 'Payment type', 'Amount', 'Status', '']} />
                    {yocoTransactionLogs.length === 0 ? (
                      <EmptyState variant="plain" icon={FileText} title="No transactions logged yet" />
                    ) : (
                      <ul className="divide-y divide-border">
                        {yocoTransactionLogs.map((log) => (
                          <Row key={log.id} cols={cols}>
                            <Cell label="Date"><span className="text-xs text-ink/60">{new Date(log.created_date).toLocaleString()}</span></Cell>
                            <Cell label="User"><span className="text-sm text-ink truncate block">{log.user_email}</span></Cell>
                            <Cell label="Type"><Chip tone={log.transaction_type === 'webhook_event' ? 'active' : 'inactive'} className="normal-case">{log.transaction_type === 'webhook_event' ? log.event_type : log.transaction_type}</Chip></Cell>
                            <Cell label="Payment"><span className="text-sm text-ink/65 capitalize">{log.payment_type?.replace('_', ' ') || '-'}</span></Cell>
                            <Cell label="Amount"><span className="font-display font-bold text-ink tabular-nums">{log.amount ? `R${(log.amount / 100).toFixed(2)}` : '-'}</span></Cell>
                            <Cell label="Status"><Chip tone={log.status === 'succeeded' ? 'active' : 'inactive'}>{log.status || '-'}</Chip></Cell>
                            <div className="flex md:justify-end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Transaction details"><Eye className="w-4 h-4" /></button>
                                </DialogTrigger>
                                <DialogContent className="rounded-2xl max-w-4xl max-h-[80vh] overflow-auto">
                                  <DialogHeader>
                                    <DialogTitle className="font-display">Transaction details</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <h4 className="font-semibold text-sm text-ink mb-2">Request payload</h4>
                                      <pre className="bg-cream border border-border p-4 rounded-xl text-xs overflow-auto">
                                        {JSON.stringify(log.request_payload, null, 2)}
                                      </pre>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-sm text-ink mb-2">Response payload</h4>
                                      <pre className="bg-cream border border-border p-4 rounded-xl text-xs overflow-auto">
                                        {JSON.stringify(log.response_payload, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </Row>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </Panel>
          </div>
        )}

        {activeTab === 'tiers' && (
          <div className="space-y-6">
            <Panel title="Create new tier" icon={Plus}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Tier Name</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={tierFormData.name}
                    onChange={(e) => setTierFormData({ ...tierFormData, name: e.target.value })}
                    placeholder="e.g., Premium"
                  />
                </div>
                <div>
                  <Label>Monthly Price (R)</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={tierFormData.price}
                    onChange={(e) => setTierFormData({ ...tierFormData, price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max Listings (how many products they can list)</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={tierFormData.max_listings}
                    onChange={(e) => setTierFormData({ ...tierFormData, max_listings: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max Images per Listing</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={tierFormData.max_images_per_listing}
                    onChange={(e) => setTierFormData({ ...tierFormData, max_images_per_listing: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max CRM Prospects (customer leads)</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={tierFormData.max_prospects}
                    onChange={(e) => setTierFormData({ ...tierFormData, max_prospects: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max Poultry Batches (farm management)</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={tierFormData.max_batches}
                    onChange={(e) => setTierFormData({ ...tierFormData, max_batches: parseInt(e.target.value) })}
                  />
                </div>
                <label className="flex items-center gap-2 rounded-xl bg-cream border border-border px-3 py-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    id="can_show_phone"
                    checked={tierFormData.can_show_phone}
                    onChange={(e) => setTierFormData({ ...tierFormData, can_show_phone: e.target.checked })}
                    className="w-4 h-4 accent-moss-600"
                  />
                  Can Show Phone Number
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-cream border border-border px-3 py-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    id="can_feature_listings"
                    checked={tierFormData.can_feature_listings}
                    onChange={(e) => setTierFormData({ ...tierFormData, can_feature_listings: e.target.checked })}
                    className="w-4 h-4 accent-moss-600"
                  />
                  Can Feature Listings
                </label>
              </div>
              <Button
                onClick={() => createTierMutation.mutate(tierFormData)}
                disabled={!tierFormData.name || createTierMutation.isPending}
                className="mt-5 btn-cta px-5 py-2.5 text-sm gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create tier
              </Button>
            </Panel>

            {tiers.length === 0 ? (
              <EmptyState icon={Layers} title="No seller tiers yet" subtitle="Create your first subscription tier above." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {tiers.map((tier) => (
                  <div key={tier.id} className="card-premium p-5">
                    {editingTier?.id === tier.id ? (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs">Tier Name</Label>
                          <Input className="mt-1 rounded-xl"
                            value={editingTier.name}
                            onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                            placeholder="Tier name"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Price (R/month)</Label>
                          <Input className="mt-1 rounded-xl"
                            type="number"
                            value={editingTier.price}
                            onChange={(e) => setEditingTier({ ...editingTier, price: parseFloat(e.target.value) })}
                            placeholder="Price"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Listings</Label>
                          <Input className="mt-1 rounded-xl"
                            type="number"
                            value={editingTier.max_listings}
                            onChange={(e) => setEditingTier({ ...editingTier, max_listings: parseInt(e.target.value) })}
                            placeholder="Max listings"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Images per Listing</Label>
                          <Input className="mt-1 rounded-xl"
                            type="number"
                            value={editingTier.max_images_per_listing}
                            onChange={(e) => setEditingTier({ ...editingTier, max_images_per_listing: parseInt(e.target.value) })}
                            placeholder="Max images"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max CRM Prospects</Label>
                          <Input className="mt-1 rounded-xl"
                            type="number"
                            value={editingTier.max_prospects || 50}
                            onChange={(e) => setEditingTier({ ...editingTier, max_prospects: parseInt(e.target.value) })}
                            placeholder="Max prospects"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Max Poultry Batches</Label>
                          <Input className="mt-1 rounded-xl"
                            type="number"
                            value={editingTier.max_batches || 10}
                            onChange={(e) => setEditingTier({ ...editingTier, max_batches: parseInt(e.target.value) })}
                            placeholder="Max batches"
                          />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button onClick={() => updateTierMutation.mutate({ id: tier.id, data: editingTier })} size="sm" className="btn-cta px-4">Save</Button>
                          <Button onClick={() => setEditingTier(null)} variant="outline" size="sm" className="rounded-full">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <h3 className="font-display text-lg font-semibold text-ink">{tier.name}</h3>
                            <p className="font-display text-2xl font-bold text-moss-700 mt-0.5">R{tier.price}<span className="text-sm font-normal text-ink/50">/mo</span></p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Tier actions"><MoreHorizontal className="w-4 h-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-44">
                              <DropdownMenuItem onSelect={() => setEditingTier(tier)} className="gap-2"><Pencil className="w-4 h-4" /> Edit tier</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => deleteTierMutation.mutate(tier.id)} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="rounded-xl bg-cream px-3 py-2"><dt className="text-[11px] uppercase tracking-wider text-ink/45">Listings</dt><dd className="font-medium text-ink">{tier.max_listings} max</dd></div>
                          <div className="rounded-xl bg-cream px-3 py-2"><dt className="text-[11px] uppercase tracking-wider text-ink/45">Images</dt><dd className="font-medium text-ink">{tier.max_images_per_listing} / listing</dd></div>
                          <div className="rounded-xl bg-cream px-3 py-2"><dt className="text-[11px] uppercase tracking-wider text-ink/45">CRM prospects</dt><dd className="font-medium text-ink">{tier.max_prospects || 50} max</dd></div>
                          <div className="rounded-xl bg-cream px-3 py-2"><dt className="text-[11px] uppercase tracking-wider text-ink/45">Batches</dt><dd className="font-medium text-ink">{tier.max_batches || 10} max</dd></div>
                        </dl>
                        {(tier.can_show_phone || tier.can_feature_listings) && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {tier.can_show_phone && <span className="chip text-[11px]">Phone visible</span>}
                            {tier.can_feature_listings && <span className="chip chip-yolk text-[11px]">Can feature listings</span>}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'feature-pricing' && (
          <div className="space-y-6">
            <Panel title="Create feature pricing plan" icon={DollarSign}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Plan Name</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={pricingFormData.name}
                    onChange={(e) => setPricingFormData({ ...pricingFormData, name: e.target.value })}
                    placeholder="e.g., 7 Days Featured"
                  />
                </div>
                <div>
                  <Label>Duration (days)</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={pricingFormData.duration_days}
                    onChange={(e) => setPricingFormData({ ...pricingFormData, duration_days: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Price (R)</Label>
                  <Input className="mt-1.5 rounded-xl"
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
                className="mt-5 btn-cta px-5 py-2.5 text-sm gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create pricing plan
              </Button>
            </Panel>

            <div>
              <h3 className="font-display text-lg text-ink mb-3">Active pricing plans</h3>
              {featurePricing.length === 0 ? (
                <EmptyState icon={Star} title="No pricing plans yet" subtitle="Create a plan above so sellers can feature listings." />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {featurePricing.map((plan) => (
                    <div key={plan.id} className="card-premium p-5">
                      {editingPricing?.id === plan.id ? (
                        <div className="space-y-3">
                          <Input className="rounded-xl"
                            value={editingPricing.name}
                            onChange={(e) => setEditingPricing({ ...editingPricing, name: e.target.value })}
                            placeholder="Plan name"
                          />
                          <Input className="rounded-xl"
                            type="number"
                            value={editingPricing.duration_days}
                            onChange={(e) => setEditingPricing({ ...editingPricing, duration_days: parseInt(e.target.value) })}
                            placeholder="Days"
                          />
                          <Input className="rounded-xl"
                            type="number"
                            step="0.01"
                            value={editingPricing.price}
                            onChange={(e) => setEditingPricing({ ...editingPricing, price: parseFloat(e.target.value) })}
                            placeholder="Price"
                          />
                          <div className="flex gap-2">
                            <Button onClick={() => updatePricingMutation.mutate({ id: plan.id, data: editingPricing })} size="sm" className="btn-cta px-4">Save</Button>
                            <Button onClick={() => setEditingPricing(null)} variant="outline" size="sm" className="rounded-full">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-yolk-50 flex items-center justify-center"><Star className="w-5 h-5 text-yolk-500 fill-yolk-500" /></div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Plan actions"><MoreHorizontal className="w-4 h-4" /></button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-44">
                                <DropdownMenuItem onSelect={() => setEditingPricing(plan)} className="gap-2"><Pencil className="w-4 h-4" /> Edit plan</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => deletePricingMutation.mutate(plan.id)} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <h4 className="font-display text-lg font-semibold text-ink">{plan.name}</h4>
                          <p className="font-display text-3xl font-bold text-moss-700 my-1">R{plan.price}</p>
                          <p className="text-sm text-ink/55">{plan.duration_days} days featured</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Panel title="Recent feature payments" icon={Wallet} padded={false}>
              {(() => {
                const cols = 'md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_100px_90px_100px_110px]';
                const rows = featurePayments.slice(0, 20);
                return (
                  <>
                    <ListHeader cols={cols} headers={['Seller', 'Listing', 'Amount', 'Duration', 'Status', 'Ends']} />
                    {rows.length === 0 ? <EmptyState variant="plain" icon={Wallet} title="No feature payments yet" /> : (
                      <ul className="divide-y divide-border">
                        {rows.map((payment) => (
                          <Row key={payment.id} cols={cols}>
                            <Cell label="Seller"><span className="text-sm text-ink truncate block">{payment.seller_id}</span></Cell>
                            <Cell label="Listing"><span className="text-xs text-ink/60 font-mono truncate block">{payment.listing_id}</span></Cell>
                            <Cell label="Amount"><span className="font-display font-bold text-ink tabular-nums">R{payment.amount_paid}</span></Cell>
                            <Cell label="Duration"><span className="text-sm text-ink/65">{payment.duration_days} days</span></Cell>
                            <Cell label="Status"><Chip tone={payment.status === 'active' ? 'active' : 'inactive'}>{payment.status}</Chip></Cell>
                            <Cell label="Ends"><span className="text-sm text-ink/65">{new Date(payment.feature_ends).toLocaleDateString()}</span></Cell>
                          </Row>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </Panel>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Panel title="Account approval" icon={ShieldCheck}>
              <SettingToggle
                id="require_approval"
                title="Require admin approval for new accounts"
                description="When enabled, new seller accounts will need admin approval before they can create listings. When disabled, all new accounts are automatically active."
                checked={adminSettings?.require_account_approval ?? false}
                onChange={(checked) => {
                  updateAdminSettingsMutation.mutate({
                    require_account_approval: checked
                  });
                }}
              />
            </Panel>

            <Panel title="Yoco webhook" icon={FileText}>
              <SettingToggle
                id="validate_webhook"
                title="Validate Yoco webhook signature"
                description="When enabled, validates incoming webhook requests using YOCO_WEBHOOK_SECRET for security. Disable for testing."
                checked={adminSettings?.validate_yoco_webhook ?? false}
                onChange={(checked) => {
                  updateAdminSettingsMutation.mutate({
                    validate_yoco_webhook: checked
                  });
                }}
              />
            </Panel>

            <Panel title="Verification fee" icon={DollarSign}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Verification Fee (R)</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={verificationFee || adminSettings?.verification_fee || 0}
                    onChange={(e) => setVerificationFee(parseFloat(e.target.value))}
                    placeholder="e.g., 150"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Verification Message</Label>
                  <Input className="mt-1.5 rounded-xl"
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
                className="mt-5 btn-cta px-5 py-2.5 text-sm"
              >
                Save fee settings
              </Button>
            </Panel>
          </div>
        )}

        {activeTab === 'banking' && (
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 items-start">
            <Panel title="Update banking information" icon={Landmark}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={bankingFormData.bank_name}
                    onChange={(e) => setBankingFormData({ ...bankingFormData, bank_name: e.target.value })}
                    placeholder="e.g., FNB"
                  />
                </div>
                <div>
                  <Label>Account Holder</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={bankingFormData.account_holder}
                    onChange={(e) => setBankingFormData({ ...bankingFormData, account_holder: e.target.value })}
                    placeholder="Account holder name"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={bankingFormData.account_number}
                    onChange={(e) => setBankingFormData({ ...bankingFormData, account_number: e.target.value })}
                    placeholder="Account number"
                  />
                </div>
                <div>
                  <Label>Account Type</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={bankingFormData.account_type}
                    onChange={(e) => setBankingFormData({ ...bankingFormData, account_type: e.target.value })}
                    placeholder="e.g., Cheque, Savings"
                  />
                </div>
                <div>
                  <Label>Branch Code</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={bankingFormData.branch_code}
                    onChange={(e) => setBankingFormData({ ...bankingFormData, branch_code: e.target.value })}
                    placeholder="Branch code"
                  />
                </div>
              </div>
              <Button
                onClick={() => createBankingInfoMutation.mutate(bankingFormData)}
                disabled={!bankingFormData.bank_name || !bankingFormData.account_holder || !bankingFormData.account_number}
                className="mt-5 btn-cta px-5 py-2.5 text-sm"
              >
                Update banking info
              </Button>
            </Panel>

            <Panel title="Current banking information" icon={CheckCircle2}>
              {bankingInfo.filter(info => info.is_active).length === 0 ? (
                <EmptyState variant="plain" icon={Landmark} title="No active banking details" subtitle="Save your bank details on the left." />
              ) : bankingInfo.filter(info => info.is_active).map((info) => (
                <div key={info.id} className="relative overflow-hidden rounded-2xl bg-moss-gradient text-cream p-5">
                  <div className="absolute inset-0 grain opacity-50" />
                  <dl className="relative grid grid-cols-1 gap-3 text-sm">
                    <div><dt className="text-[11px] uppercase tracking-wider text-cream/55">Bank</dt><dd className="font-display text-lg">{info.bank_name}</dd></div>
                    <div><dt className="text-[11px] uppercase tracking-wider text-cream/55">Account holder</dt><dd className="font-medium">{info.account_holder}</dd></div>
                    <div><dt className="text-[11px] uppercase tracking-wider text-cream/55">Account number</dt><dd className="font-mono tracking-wider">{info.account_number}</dd></div>
                    <div className="grid grid-cols-2 gap-3">
                      {info.account_type && <div><dt className="text-[11px] uppercase tracking-wider text-cream/55">Account type</dt><dd className="font-medium">{info.account_type}</dd></div>}
                      {info.branch_code && <div><dt className="text-[11px] uppercase tracking-wider text-cream/55">Branch code</dt><dd className="font-mono">{info.branch_code}</dd></div>}
                    </div>
                  </dl>
                </div>
              ))}
            </Panel>
          </div>
        )}

        {activeTab === 'finances' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={DollarSign} label="Total revenue" value={`R${featurePayments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount_paid, 0).toFixed(2)}`} tint="moss" />
              <StatCard icon={CheckCircle2} label="Verified payments" value={featurePayments.filter(p => p.status === 'verified').length} tint="sage" />
              <StatCard icon={Clock} label="Pending verification" value={pendingPayments.length} tint="yolk" />
              <StatCard icon={XCircle} label="Rejected" value={featurePayments.filter(p => p.status === 'rejected').length} tint="terracotta" />
            </div>

            <Panel title="Recent transactions" icon={TrendingUp} padded={false}>
              {(() => {
                const cols = 'md:grid-cols-[120px_minmax(0,1.5fr)_110px_100px_110px]';
                const rows = featurePayments.slice(0, 20);
                return (
                  <>
                    <ListHeader cols={cols} headers={['Date', 'Seller', 'Amount', 'Duration', 'Status']} />
                    {rows.length === 0 ? <EmptyState variant="plain" icon={Wallet} title="No transactions yet" /> : (
                      <ul className="divide-y divide-border">
                        {rows.map((payment) => (
                          <Row key={payment.id} cols={cols}>
                            <Cell label="Date"><span className="text-sm text-ink/65">{new Date(payment.created_date).toLocaleDateString()}</span></Cell>
                            <Cell label="Seller"><span className="text-sm text-ink truncate block">{payment.seller_id}</span></Cell>
                            <Cell label="Amount"><span className="font-display font-bold text-ink tabular-nums">R{payment.amount_paid}</span></Cell>
                            <Cell label="Duration"><span className="text-sm text-ink/65">{payment.duration_days} days</span></Cell>
                            <Cell label="Status"><Chip tone={payment.status === 'verified' ? 'active' : payment.status === 'pending' ? 'pending' : 'danger'}>{payment.status}</Chip></Cell>
                          </Row>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </Panel>
          </div>
        )}

        {activeTab === 'featured-listings' && (() => {
          const featured = listings.filter(l => l.featured).filter(l => matches(l.title, l.created_by));
          const cols = 'md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_90px_110px_110px_120px_44px]';
          return (
            <div className="space-y-4">
              <div className="card-premium p-3 flex flex-col md:flex-row md:items-center gap-3">
                <SearchBox value={adminSearch} onChange={setAdminSearch} placeholder="Search featured listings or sellers…" />
                <Chip tone="pending" className="md:ml-auto"><Star className="w-3 h-3 fill-current" /> {listings.filter(l => l.featured).length} featured</Chip>
              </div>
              <div className="card-premium overflow-hidden">
                <ListHeader cols={cols} headers={['Listing', 'Seller', 'Price', 'Featured start', 'Featured end', 'Status', '']} />
                {featured.length === 0 ? (
                  <EmptyState variant="plain" icon={Star} title={q ? `No featured listings match "${adminSearch}"` : 'No featured listings'} subtitle={q ? 'Try a different search term.' : 'No listings are currently featured.'} />
                ) : (
                  <ul className="divide-y divide-border">
                    {featured.map((listing) => {
                      const now = new Date();
                      const featuredEnd = new Date(listing.featured_until);
                      const isActive = featuredEnd > now;
                      const daysRemaining = Math.ceil((featuredEnd - now) / (1000 * 60 * 60 * 24));
                      const starts = featurePayments.find(p => p.listing_id === listing.id)?.feature_starts;
                      return (
                        <Row key={listing.id} cols={cols}>
                          <div className="flex items-center gap-3 min-w-0">
                            <img
                              src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100'}
                              alt={listing.title}
                              className="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`} className="font-medium text-ink hover:text-moss-700 line-clamp-1">{listing.title}</Link>
                              <span className="chip chip-yolk !py-0 !px-2 text-[10px] gap-1 mt-1"><Star className="w-2.5 h-2.5 fill-current" />Featured</span>
                            </div>
                          </div>
                          <Cell label="Seller"><span className="text-sm text-ink/65 truncate block">{listing.created_by}</span></Cell>
                          <Cell label="Price"><span className="font-display font-bold text-ink tabular-nums">R{listing.price}</span></Cell>
                          <Cell label="Starts"><span className="text-sm text-ink/65">{starts ? new Date(starts).toLocaleDateString() : '-'}</span></Cell>
                          <Cell label="Ends"><span className="text-sm text-ink/65">{listing.featured_until ? new Date(listing.featured_until).toLocaleDateString() : '-'}</span></Cell>
                          <Cell label="Status">
                            {isActive ? (
                              <div><Chip tone="active">Active</Chip><p className="text-[11px] text-ink/50 mt-1">{daysRemaining} days left</p></div>
                            ) : <Chip tone="ended">Expired</Chip>}
                          </Cell>
                          <div className="flex md:justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Listing actions"><MoreHorizontal className="w-4 h-4" /></button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl w-48">
                                <DropdownMenuItem asChild><Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`} className="gap-2"><Eye className="w-4 h-4" /> View listing</Link></DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => unfeatureListing(listing)} className="gap-2 text-yolk-700 focus:text-yolk-700"><XCircle className="w-4 h-4" /> Unfeature</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </Row>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === 'listings' && (() => {
          const rows = listings.filter(l => matches(l.title, l.created_by, l.breed, l.category) && (listingStatusFilter === 'all' || l.status === listingStatusFilter));
          const statusCounts = listings.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});
          const cols = 'md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_100px_110px_44px]';
          return (
            <div className="space-y-4">
              <div className="card-premium p-3 flex flex-col lg:flex-row lg:items-center gap-3">
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                  {['all', 'active', 'reserved', 'sold', 'inactive'].map(s => {
                    const on = listingStatusFilter === s;
                    const n = s === 'all' ? listings.length : (statusCounts[s] || 0);
                    return (
                      <button key={s} onClick={() => setListingStatusFilter(s)}
                        className={`whitespace-nowrap capitalize px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${on ? 'bg-moss-600 text-cream' : 'text-ink/65 hover:bg-moss-50 hover:text-moss-700'}`}>
                        {s} <span className={`ml-1 text-xs ${on ? 'text-cream/70' : 'text-ink/40'}`}>{n}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="lg:ml-auto lg:w-80"><SearchBox value={adminSearch} onChange={setAdminSearch} placeholder="Search listings or sellers…" /></div>
              </div>
              <div className="card-premium overflow-hidden">
                <ListHeader cols={cols} headers={['Listing', 'Seller', 'Price', 'Status', '']} />
                {rows.length === 0 ? (
                  <EmptyState variant="plain" icon={Package} title="No listings match" subtitle="Try a different filter or search term." />
                ) : (
                  <ul className="divide-y divide-border">
                    {rows.map((listing) => (
                      <Row key={listing.id} cols={cols}>
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100'}
                            alt={listing.title}
                            className="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`} className="font-medium text-ink hover:text-moss-700 line-clamp-1">{listing.title}</Link>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-ink/55">
                              <span className="capitalize">{listing.breed || listing.category}</span>
                              {listing.featured && <span className="chip chip-yolk !py-0 !px-2 text-[10px] gap-1"><Star className="w-2.5 h-2.5 fill-current" />Featured</span>}
                            </div>
                          </div>
                        </div>
                        <Cell label="Seller"><span className="text-sm text-ink/65 truncate block">{listing.created_by}</span></Cell>
                        <Cell label="Price"><span className="font-display font-bold text-ink tabular-nums">R{listing.price}</span></Cell>
                        <Cell label="Status"><Chip tone={listing.status === 'active' ? 'active' : listing.status === 'sold' ? 'ended' : listing.status === 'reserved' ? 'pending' : 'inactive'}>{listing.status}</Chip></Cell>
                        <div className="flex md:justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Listing actions"><MoreHorizontal className="w-4 h-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-48">
                              <DropdownMenuItem asChild><Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`} className="gap-2"><Eye className="w-4 h-4" /> View listing</Link></DropdownMenuItem>
                              {listing.featured && <DropdownMenuItem onSelect={() => unfeatureListing(listing)} className="gap-2 text-yolk-700 focus:text-yolk-700"><XCircle className="w-4 h-4" /> Unfeature</DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => deleteListingMutation.mutate(listing.id)} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </Row>
                    ))}
                  </ul>
                )}
                <div className="px-5 py-3 bg-cream border-t border-border text-xs text-ink/50">{rows.length} of {listings.length} listings</div>
              </div>
            </div>
          );
        })()}

        {activeTab === 'auctions' && (
          <div className="space-y-6">
            <div className="card-premium p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-ink">Subscription reminders</p>
                <p className="text-xs text-ink/55">Email auction houses whose subscription expires within 5 days.</p>
              </div>
              <Button
                onClick={() => sendPaymentRemindersMutation.mutate()}
                disabled={sendPaymentRemindersMutation.isPending}
                variant="outline"
                className="rounded-full gap-1.5 text-terracotta-600"
              >
                {sendPaymentRemindersMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Send payment reminders
              </Button>
            </div>

            <PaymentQueue title="Pending auction house payments" icon={Gavel} items={pendingAuctionHousePayments}
              emptyTitle="No pending payments" emptySubtitle="All auction house payments are processed."
              render={(payment) => (
                <li key={payment.id} className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-ink">Seller: {payment.seller_email}</p>
                      <p className="text-ink/60">Auction House ID: <span className="font-mono text-xs">{payment.auction_house_id}</span></p>
                      <p className="text-ink/60">Reference: <span className="font-mono text-xs">{payment.payment_reference}</span></p>
                    </div>
                    <div className="sm:text-right">
                      <p className="font-display text-2xl font-bold text-terracotta-600">R{payment.amount}</p>
                      <Chip tone="inactive">{payment.tier_name || 'Basic'} · {payment.payment_type || 'initial'}</Chip>
                    </div>
                  </div>
                  {payment.payment_proof_url && <div className="mb-4">{proofButton(payment.payment_proof_url)}</div>}
                  {approveReject({
                    onApprove: () => verifyAuctionHousePaymentMutation.mutate({ paymentId: payment.id, approved: true, payment }),
                    onReject: () => verifyAuctionHousePaymentMutation.mutate({ paymentId: payment.id, approved: false, payment }),
                    approveLabel: 'Approve & activate',
                    pending: verifyAuctionHousePaymentMutation.isPending,
                  })}
                </li>
              )} />

            <Panel title="Active auction events" icon={Gavel} padded={false}>
              {(() => {
                const cols = 'md:grid-cols-[minmax(0,1.8fr)_100px_90px_170px_44px]';
                const rows = allAuctionEvents.filter(e => e.status !== 'ended');
                return (
                  <>
                    <ListHeader cols={cols} headers={['Event', 'Status', 'Items', 'End time', '']} />
                    {rows.length === 0 ? <EmptyState variant="plain" icon={Gavel} title="No active auction events" /> : (
                      <ul className="divide-y divide-border">
                        {rows.map((event) => (
                          <Row key={event.id} cols={cols}>
                            <Link to={createPageUrl('AuctionEventDetail') + `?id=${event.id}`} className="font-medium text-ink hover:text-moss-700 truncate">{event.title}</Link>
                            <Cell label="Status"><Chip tone={event.status === 'live' ? 'live' : event.status === 'scheduled' ? 'pending' : 'inactive'}>{event.status}</Chip></Cell>
                            <Cell label="Items"><span className="text-sm text-ink/65">{event.total_items || 0} lots</span></Cell>
                            <Cell label="Ends"><span className="text-sm text-ink/65">{new Date(event.end_time).toLocaleString()}</span></Cell>
                            <div className="flex md:justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Event actions"><MoreHorizontal className="w-4 h-4" /></button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-48">
                                  <DropdownMenuItem asChild><Link to={createPageUrl('AuctionEventDetail') + `?id=${event.id}`} className="gap-2"><Eye className="w-4 h-4" /> View event</Link></DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem disabled={endAuctionMutation.isPending} onSelect={() => endAuctionMutation.mutate(event.id)} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Ban className="w-4 h-4" /> End & finalize</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </Row>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </Panel>

            <Panel title="All auction houses" icon={Building2} padded={false}>
              {(() => {
                const cols = 'md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_100px_120px_100px]';
                return (
                  <>
                    <ListHeader cols={cols} headers={['Auction house', 'Owner', 'Tier', 'Subscription', 'Status']} />
                    {allAuctionHouses.length === 0 ? <EmptyState variant="plain" icon={Building2} title="No auction houses yet" /> : (
                      <ul className="divide-y divide-border">
                        {allAuctionHouses.map((house) => (
                          <Row key={house.id} cols={cols}>
                            <div className="flex items-center gap-3 min-w-0">
                              {house.logo_url ? (
                                <img src={house.logo_url} alt={house.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-terracotta-50 flex items-center justify-center flex-shrink-0">
                                  <Gavel className="w-5 h-5 text-terracotta-600" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-ink truncate">{house.name}</p>
                                <p className="text-xs text-ink/55">{house.city}, {house.province}</p>
                              </div>
                            </div>
                            <Cell label="Owner"><span className="text-sm text-ink/65 truncate block">{house.created_by}</span></Cell>
                            <Cell label="Tier"><span className="chip text-[11px]">{house.tier_name || 'Basic'}</span></Cell>
                            <Cell label="Subscription"><span className="text-sm text-ink/65">{house.subscription_end ? new Date(house.subscription_end).toLocaleDateString() : '-'}</span></Cell>
                            <Cell label="Status"><Chip tone={house.status === 'active' ? 'active' : 'inactive'}>{house.status}</Chip></Cell>
                          </Row>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </Panel>
          </div>
        )}

        {activeTab === 'auction-tiers' && (
          <div className="space-y-6">
            <Panel title="Create auction house tier" icon={Building2}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Tier Name</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={auctionTierForm.name}
                    onChange={(e) => setAuctionTierForm({ ...auctionTierForm, name: e.target.value })}
                    placeholder="e.g., Basic, Professional, Enterprise"
                  />
                </div>
                <div>
                  <Label>Monthly Price (R)</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={auctionTierForm.monthly_price}
                    onChange={(e) => setAuctionTierForm({ ...auctionTierForm, monthly_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max Live Auctions</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={auctionTierForm.max_live_auctions}
                    onChange={(e) => setAuctionTierForm({ ...auctionTierForm, max_live_auctions: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div>
                  <Label>Max Items Per Auction</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={auctionTierForm.max_items_per_auction}
                    onChange={(e) => setAuctionTierForm({ ...auctionTierForm, max_items_per_auction: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <label className="flex items-center gap-2 rounded-xl bg-cream border border-border px-3 py-2.5 text-sm cursor-pointer self-end">
                  <input
                    type="checkbox"
                    id="ah_featured"
                    checked={auctionTierForm.featured_placement}
                    onChange={(e) => setAuctionTierForm({ ...auctionTierForm, featured_placement: e.target.checked })}
                    className="w-4 h-4 accent-moss-600"
                  />
                  Featured Placement
                </label>
                <label className="flex items-center gap-2 rounded-xl bg-cream border border-border px-3 py-2.5 text-sm cursor-pointer self-end">
                  <input
                    type="checkbox"
                    id="ah_priority"
                    checked={auctionTierForm.priority_support}
                    onChange={(e) => setAuctionTierForm({ ...auctionTierForm, priority_support: e.target.checked })}
                    className="w-4 h-4 accent-moss-600"
                  />
                  Priority Support
                </label>
              </div>
              <Button
                onClick={() => createAuctionTierMutation.mutate(auctionTierForm)}
                disabled={!auctionTierForm.name || createAuctionTierMutation.isPending}
                className="mt-5 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white px-5 py-2.5 text-sm gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create tier
              </Button>
            </Panel>

            {auctionHouseTiers.length === 0 ? (
              <EmptyState icon={Building2} title="No tiers created yet" subtitle="Create your first auction house tier above." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {auctionHouseTiers.map((tier) => (
                  <div key={tier.id} className="card-premium p-5 relative">
                    {editingAuctionTier?.id === tier.id ? (
                      <div className="space-y-3">
                        <Input className="rounded-xl"
                          value={editingAuctionTier.name}
                          onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, name: e.target.value })}
                          placeholder="Tier name"
                        />
                        <Input className="rounded-xl"
                          type="number"
                          value={editingAuctionTier.monthly_price}
                          onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, monthly_price: parseFloat(e.target.value) })}
                          placeholder="Monthly price"
                        />
                        <Input className="rounded-xl"
                          type="number"
                          value={editingAuctionTier.max_live_auctions}
                          onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, max_live_auctions: parseInt(e.target.value) })}
                          placeholder="Max live auctions"
                        />
                        <Input className="rounded-xl"
                          type="number"
                          value={editingAuctionTier.max_items_per_auction}
                          onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, max_items_per_auction: parseInt(e.target.value) })}
                          placeholder="Max items"
                        />
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={editingAuctionTier.featured_placement}
                            onChange={(e) => setEditingAuctionTier({ ...editingAuctionTier, featured_placement: e.target.checked })}
                            className="w-4 h-4 accent-moss-600"
                          />
                          Featured
                        </label>
                        <div className="flex gap-2">
                          <Button onClick={() => updateAuctionTierMutation.mutate({ id: tier.id, data: editingAuctionTier })} size="sm" className="btn-cta px-4">Save</Button>
                          <Button onClick={() => setEditingAuctionTier(null)} variant="outline" size="sm" className="rounded-full">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {tier.featured_placement && (
                          <span className="absolute -top-2.5 left-4 chip-yolk chip text-[10px] font-bold">POPULAR</span>
                        )}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <h3 className="font-display text-lg font-semibold text-ink">{tier.name}</h3>
                            <p className="font-display text-2xl font-bold text-terracotta-600 mt-0.5">
                              R{tier.monthly_price}<span className="text-sm font-normal text-ink/50">/mo</span>
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Tier actions"><MoreHorizontal className="w-4 h-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-44">
                              <DropdownMenuItem onSelect={() => setEditingAuctionTier(tier)} className="gap-2"><Pencil className="w-4 h-4" /> Edit tier</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => deleteAuctionTierMutation.mutate(tier.id)} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <ul className="space-y-2 text-sm text-ink/70">
                          <li className="flex items-center gap-2"><Gavel className="w-4 h-4 text-moss-600" />{tier.max_live_auctions} live auction{tier.max_live_auctions > 1 ? 's' : ''} at a time</li>
                          <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-moss-600" />Up to {tier.max_items_per_auction} items per auction</li>
                          {tier.featured_placement && <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yolk-500" />Featured placement</li>}
                          {tier.priority_support && <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-moss-600" />Priority support</li>}
                        </ul>
                        <div className="mt-4 pt-3 border-t border-border">
                          <p className="text-xs text-ink/50">{allAuctionHouses.filter(h => h.tier_id === tier.id).length} auction house(s) using this tier</p>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'email-marketing' && (
          <EmailCampaignManager />
        )}

        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Package} label="Total listings" value={listings.length.toLocaleString()} deltaLabel={`Active: ${listings.filter(l => l.status === 'active').length}`} tint="moss" />
              <StatCard icon={Eye} label="Total views" value={totalViews.toLocaleString()} deltaLabel={`Avg ${listings.length > 0 ? Math.round(totalViews / listings.length) : 0} per listing`} tint="terracotta" />
              <StatCard icon={MessageCircle} label="Total inquiries" value={inquiries.length.toLocaleString()} deltaLabel={`Engagement ${listings.length > 0 && totalViews > 0 ? ((inquiries.length / totalViews) * 100).toFixed(1) : 0}%`} tint="yolk" />
              <StatCard icon={Users} label="Total users" value={users.length.toLocaleString()} deltaLabel={`Sellers: ${users.filter(u => u.user_type === 'seller' || u.user_type === 'both').length}`} tint="sage" />
            </div>

            <Panel title="Most viewed listings" icon={Eye} padded={false}>
              {(() => {
                const cols = 'md:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_80px_90px_110px]';
                const rows = [...listings].sort((a, b) => (b.view_count || 0) - (a.view_count || 0)).slice(0, 10);
                return (
                  <>
                    <ListHeader cols={cols} headers={['Listing', 'Seller', 'Views', 'Inquiries', 'Conversion']} />
                    {rows.length === 0 ? <EmptyState variant="plain" icon={Package} title="No listings yet" /> : (
                      <ul className="divide-y divide-border">
                        {rows.map((listing, i) => (
                          <Row key={listing.id} cols={cols}>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 text-xs font-semibold text-ink/40 tabular-nums">{i + 1}</span>
                              <img
                                src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100'}
                                alt={listing.title}
                                className="w-10 h-10 rounded-xl object-cover border border-border flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-medium text-ink line-clamp-1">{listing.title}</p>
                                {listing.featured && <span className="chip chip-yolk !py-0 !px-2 text-[10px] gap-1"><Star className="w-2.5 h-2.5 fill-current" />Featured</span>}
                              </div>
                            </div>
                            <Cell label="Seller"><span className="text-sm text-ink/65 truncate block">{listing.created_by}</span></Cell>
                            <Cell label="Views"><span className="font-display font-bold text-ink tabular-nums">{listing.view_count || 0}</span></Cell>
                            <Cell label="Inquiries"><span className="text-sm text-ink/65 tabular-nums">{listing.inquiry_count || 0}</span></Cell>
                            <Cell label="Conversion">
                              <Chip tone={(listing.view_count || 0) > 0 && ((listing.inquiry_count || 0) / (listing.view_count || 1)) > 0.1 ? 'active' : 'inactive'}>
                                {(listing.view_count || 0) > 0
                                  ? `${(((listing.inquiry_count || 0) / (listing.view_count || 1)) * 100).toFixed(1)}%`
                                  : '0%'}
                              </Chip>
                            </Cell>
                          </Row>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Panel title="Listings by category" icon={Layers}>
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
                            <span className="text-ink/75 capitalize">{categoryLabels[category] || category}</span>
                            <span className="font-medium text-ink tabular-nums">{count} <span className="text-ink/45">({percentage.toFixed(1)}%)</span></span>
                          </div>
                          <div className="w-full bg-cream-deep rounded-full h-2">
                            <div className="bg-moss-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Panel>

              <Panel title="Listings by province" icon={BarChart3}>
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
                            <span className="text-ink/75">{province}</span>
                            <span className="font-medium text-ink tabular-nums">{count} <span className="text-ink/45">({percentage.toFixed(1)}%)</span></span>
                          </div>
                          <div className="w-full bg-cream-deep rounded-full h-2">
                            <div className="bg-terracotta-500 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </Panel>
            </div>

            <Panel title="Top sellers by views" icon={TrendingUp} padded={false}>
              {(() => {
                const cols = 'md:grid-cols-[minmax(0,1.8fr)_90px_110px_110px_130px]';
                const rows = Object.entries(
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
                  .slice(0, 10);
                return (
                  <>
                    <ListHeader cols={cols} headers={['Seller', 'Listings', 'Total views', 'Inquiries', 'Avg views/listing']} />
                    {rows.length === 0 ? <EmptyState variant="plain" icon={Users} title="No sellers yet" /> : (
                      <ul className="divide-y divide-border">
                        {rows.map(([seller, stats], i) => (
                          <Row key={seller} cols={cols}>
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="w-6 text-xs font-semibold text-ink/40 tabular-nums">{i + 1}</span>
                              <span className="text-sm text-ink truncate">{seller}</span>
                            </div>
                            <Cell label="Listings"><span className="text-sm text-ink/65 tabular-nums">{stats.count}</span></Cell>
                            <Cell label="Views"><span className="font-display font-bold text-ink tabular-nums">{stats.views}</span></Cell>
                            <Cell label="Inquiries"><span className="text-sm text-ink/65 tabular-nums">{stats.inquiries}</span></Cell>
                            <Cell label="Avg"><span className="text-sm text-ink/65 tabular-nums">{Math.round(stats.views / stats.count)}</span></Cell>
                          </Row>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </Panel>
          </div>
        )}

        {activeTab === 'competitions' && (
          <div className="space-y-6">
            <Panel title="Create new competition" icon={Trophy}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Competition Name *</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={competitionForm.name}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, name: e.target.value })}
                    placeholder="e.g., Top Rooster of the Week"
                  />
                </div>
                <div>
                  <Label>Scoring Method</Label>
                  <Select value={competitionForm.scoring_method} onValueChange={(value) => setCompetitionForm({ ...competitionForm, scoring_method: value })}>
                    <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="average">Average Rating</SelectItem>
                      <SelectItem value="total">Total Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Description</Label>
                  <Input className="mt-1.5 rounded-xl"
                    value={competitionForm.description}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, description: e.target.value })}
                    placeholder="Competition description"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Banner Image (for homepage)</Label>
                  <Input className="mt-1.5 rounded-xl"
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
                  {uploadingBanner && <p className="text-sm text-ink/55 mt-1 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</p>}
                  {competitionForm.banner_image_url && (
                    <div className="mt-2">
                      <img src={competitionForm.banner_image_url} alt="Banner preview" className="h-24 object-cover rounded-xl border border-border" />
                    </div>
                  )}
                </div>
                <div>
                  <Label>Start Date *</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="datetime-local"
                    value={competitionForm.start_date}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>End Date *</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="datetime-local"
                    value={competitionForm.end_date}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Min Rating</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={competitionForm.min_rating}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, min_rating: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Max Rating</Label>
                  <Input className="mt-1.5 rounded-xl"
                    type="number"
                    value={competitionForm.max_rating}
                    onChange={(e) => setCompetitionForm({ ...competitionForm, max_rating: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <Button
                onClick={() => createCompetitionMutation.mutate(competitionForm)}
                disabled={!competitionForm.name || !competitionForm.start_date || !competitionForm.end_date}
                className="mt-5 btn-cta px-5 py-2.5 text-sm gap-1.5"
              >
                <Plus className="w-4 h-4" /> Create competition
              </Button>
            </Panel>

            <Panel title="All competitions" icon={Trophy} padded={false}>
              {(() => {
                const cols = 'md:grid-cols-[minmax(0,1.8fr)_170px_80px_100px_44px]';
                return (
                  <>
                    <ListHeader cols={cols} headers={['Name', 'Period', 'Entries', 'Status', '']} />
                    {competitions.length === 0 ? <EmptyState variant="plain" icon={Trophy} title="No competitions yet" subtitle="Create one above to get started." /> : (
                      <ul className="divide-y divide-border">
                        {competitions.map((comp) => {
                          const now = new Date();
                          const isPast = new Date(comp.end_date) < now;
                          const canFinalize = isPast && !comp.winner_id;
                          return (
                            <Row key={comp.id} cols={cols}>
                              <div className="min-w-0">
                                <p className="font-medium text-ink truncate">{comp.name}</p>
                                <p className="text-xs text-ink/55 line-clamp-1">{comp.description}</p>
                              </div>
                              <Cell label="Period"><span className="text-sm text-ink/65">{moment(comp.start_date).format('MMM D')} – {moment(comp.end_date).format('MMM D, YYYY')}</span></Cell>
                              <Cell label="Entries"><span className="text-sm text-ink/65 tabular-nums">{comp.total_entries || 0}</span></Cell>
                              <Cell label="Status"><Chip tone={comp.status === 'active' ? 'active' : comp.status === 'ended' ? 'ended' : 'pending'}>{comp.status || 'upcoming'}</Chip></Cell>
                              <div className="flex md:justify-end items-center gap-1">
                                {canFinalize && (
                                  <Button size="sm" className="rounded-full bg-yolk-500 hover:bg-yolk-600 text-ink text-xs gap-1 h-8"
                                    onClick={() => finalizeCompetitionMutation.mutate(comp.id)}
                                    disabled={finalizeCompetitionMutation.isPending}>
                                    <Trophy className="w-3.5 h-3.5" /> Finalize
                                  </Button>
                                )}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Competition actions"><MoreHorizontal className="w-4 h-4" /></button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl w-48">
                                    <DropdownMenuItem asChild><Link to={createPageUrl('CompetitionDetail') + `?id=${comp.id}`} className="gap-2"><Eye className="w-4 h-4" /> View competition</Link></DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => setEditingCompetition(comp)} className="gap-2"><Pencil className="w-4 h-4" /> Edit</DropdownMenuItem>
                                    {canFinalize && <DropdownMenuItem disabled={finalizeCompetitionMutation.isPending} onSelect={() => finalizeCompetitionMutation.mutate(comp.id)} className="gap-2"><Trophy className="w-4 h-4 text-yolk-600" /> Finalize & announce winner</DropdownMenuItem>}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => deleteCompetitionMutation.mutate(comp.id)} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </Row>
                          );
                        })}
                      </ul>
                    )}
                  </>
                );
              })()}
            </Panel>

            {/* Competition Entries */}
            <Panel title="All competition entries" icon={Users} padded={false}>
              {(() => {
                const cols = 'md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)_70px_70px_110px_44px]';
                return (
                  <>
                    <ListHeader cols={cols} headers={['Entry', 'Competition', 'Owner', 'Votes', 'Rating', 'Status', '']} />
                    {allCompetitionEntries.length === 0 ? <EmptyState variant="plain" icon={Trophy} title="No entries yet" /> : (
                      <ul className="divide-y divide-border">
                        {allCompetitionEntries.map((entry) => (
                          <Row key={entry.id} cols={cols}>
                            <div className="flex items-center gap-3 min-w-0">
                              {entry.images?.[0] ? (
                                <img src={entry.images[0]} alt={entry.chicken_name} className="w-12 h-12 rounded-xl object-cover border border-border flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-cream-deep border border-border flex items-center justify-center flex-shrink-0"><Trophy className="w-5 h-5 text-ink/30" /></div>
                              )}
                              <div className="min-w-0">
                                <p className="font-medium text-ink truncate">{entry.chicken_name}</p>
                                <p className="text-xs text-ink/55">{entry.breed}</p>
                              </div>
                            </div>
                            <Cell label="Competition"><span className="text-sm text-ink/65 truncate block">{entry.competition_name}</span></Cell>
                            <Cell label="Owner"><span className="text-sm text-ink/65 truncate block">{entry.owner_name}</span></Cell>
                            <Cell label="Votes"><span className="text-sm text-ink/65 tabular-nums">{entry.vote_count || 0}</span></Cell>
                            <Cell label="Rating"><span className="font-display font-bold text-ink tabular-nums">{(entry.average_rating || 0).toFixed(1)}</span></Cell>
                            <Cell label="Status">{entry.disqualified ? <Chip tone="danger">Disqualified</Chip> : <Chip tone="active">Active</Chip>}</Cell>
                            <div className="flex md:justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Entry actions"><MoreHorizontal className="w-4 h-4" /></button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl w-48">
                                  <DropdownMenuItem asChild><Link to={createPageUrl('CompetitionDetail') + `?id=${entry.competition_id}`} className="gap-2"><Eye className="w-4 h-4" /> View competition</Link></DropdownMenuItem>
                                  {!entry.disqualified && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onSelect={() => { setDisqualifyingEntry(entry); setDisqualificationReason(''); }} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Ban className="w-4 h-4" /> Disqualify</DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </Row>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </Panel>

            {/* Disqualify Entry Dialog */}
            <Dialog open={!!disqualifyingEntry} onOpenChange={(open) => !open && setDisqualifyingEntry(null)}>
              <DialogContent className="rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="font-display">Disqualify entry</DialogTitle>
                </DialogHeader>
                {disqualifyingEntry && (
                  <div className="space-y-4">
                    <div className="bg-yolk-50 border border-yolk-200 rounded-xl p-4">
                      <p className="text-sm text-yolk-700">
                        You are about to disqualify <strong>{disqualifyingEntry.chicken_name}</strong> by {disqualifyingEntry.owner_name}
                      </p>
                    </div>
                    <div>
                      <Label>Disqualification Reason *</Label>
                      <Textarea className="mt-1.5 rounded-xl"
                        value={disqualificationReason}
                        onChange={(e) => setDisqualificationReason(e.target.value)}
                        placeholder="e.g., Violated competition rules"
                        rows={3}
                      />
                      <p className="text-xs text-ink/55 mt-1">This message will be visible to the entry owner</p>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" className="rounded-full" onClick={() => setDisqualifyingEntry(null)}>Cancel</Button>
                      <Button
                        onClick={() => disqualifyEntryMutation.mutate({
                          entryId: disqualifyingEntry.id,
                          reason: disqualificationReason
                        })}
                        disabled={!disqualificationReason || disqualifyEntryMutation.isPending}
                        className="rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white"
                      >
                        Disqualify entry
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Edit Competition Dialog */}
            <Dialog open={!!editingCompetition} onOpenChange={(open) => !open && setEditingCompetition(null)}>
              <DialogContent className="rounded-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">Edit competition</DialogTitle>
                </DialogHeader>
                {editingCompetition && (
                  <div className="space-y-4">
                    <div>
                      <Label>Competition Name</Label>
                      <Input className="mt-1.5 rounded-xl"
                        value={editingCompetition.name}
                        onChange={(e) => setEditingCompetition({ ...editingCompetition, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Input className="mt-1.5 rounded-xl"
                        value={editingCompetition.description || ''}
                        onChange={(e) => setEditingCompetition({ ...editingCompetition, description: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Banner Image</Label>
                      <Input className="mt-1.5 rounded-xl"
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
                      {uploadingBanner && <p className="text-sm text-ink/55 mt-1">Uploading...</p>}
                      {editingCompetition.banner_image_url && (
                        <div className="mt-2">
                          <img src={editingCompetition.banner_image_url} alt="Banner preview" className="h-24 object-cover rounded-xl border border-border" />
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Start Date</Label>
                        <Input className="mt-1.5 rounded-xl"
                          type="datetime-local"
                          value={moment(editingCompetition.start_date).format('YYYY-MM-DDTHH:mm')}
                          onChange={(e) => setEditingCompetition({ ...editingCompetition, start_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>End Date</Label>
                        <Input className="mt-1.5 rounded-xl"
                          type="datetime-local"
                          value={moment(editingCompetition.end_date).format('YYYY-MM-DDTHH:mm')}
                          onChange={(e) => setEditingCompetition({ ...editingCompetition, end_date: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Min Rating</Label>
                        <Input className="mt-1.5 rounded-xl"
                          type="number"
                          value={editingCompetition.min_rating}
                          onChange={(e) => setEditingCompetition({ ...editingCompetition, min_rating: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Max Rating</Label>
                        <Input className="mt-1.5 rounded-xl"
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
                        <SelectTrigger className="mt-1.5 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="average">Average Rating</SelectItem>
                          <SelectItem value="total">Total Score</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" className="rounded-full" onClick={() => setEditingCompetition(null)}>Cancel</Button>
                      <Button
                        onClick={() => updateCompetitionMutation.mutate({ id: editingCompetition.id, data: editingCompetition })}
                        className="btn-cta px-5"
                      >
                        Update competition
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
        </div>
      </div>

      {viewingDocument && (
        <Dialog open={!!viewingDocument} onOpenChange={() => setViewingDocument(null)}>
          <DialogContent className="rounded-2xl sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle className="font-display">{viewingDocument.title}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-cream">
              {viewingDocument.url.endsWith('.pdf') ? (
                <iframe src={viewingDocument.url} title={viewingDocument.title} className="w-full h-[70vh]" />
              ) : (
                <img src={viewingDocument.url} alt={viewingDocument.title} className="w-full" />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </PageShell>
  );
}

/* ---------- presentational helpers (no data logic) ---------- */

const TILE_DESC = {
  users: 'Manage all users', verifications: 'Pending approvals', payments: 'Verify payments', tiers: 'Subscription plans',
  'feature-pricing': 'Promotion pricing', settings: 'Platform config', banking: 'Payment details', finances: 'Revenue overview',
  listings: 'All marketplace items', 'featured-listings': 'Featured items tracking', auctions: 'Auction management',
  'auction-tiers': 'Auction house plans', 'email-marketing': 'Campaign management', competitions: 'Manage competitions', stats: 'Site analytics',
};

const CHIP_TONES = {
  active: 'bg-fresh-50 text-moss-700 border-fresh-200',
  pending: 'bg-yolk-50 text-yolk-700 border-yolk-200',
  ended: 'bg-ink/70 text-cream border-transparent',
  inactive: 'bg-cream-deep text-ink/60 border-border',
  danger: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100',
  live: 'bg-terracotta-500 text-white border-transparent',
};

function Chip({ tone = 'inactive', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 w-fit px-2.5 py-1 rounded-full border text-[11px] font-medium capitalize ${CHIP_TONES[tone] || CHIP_TONES.inactive} ${className}`}>
      {tone === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
      {children}
    </span>
  );
}

function Panel({ title, icon: Icon, action, children, padded = true, className = '' }) {
  return (
    <section className={`card-premium overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-cream/60">
          <h3 className="font-display font-semibold text-ink flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-moss-600" />}{title}
          </h3>
          {action}
        </div>
      )}
      <div className={padded ? 'p-5' : ''}>{children}</div>
    </section>
  );
}

function ListHeader({ cols, headers }) {
  return (
    <div className={`hidden md:grid ${cols} items-center gap-4 px-5 py-3 bg-cream border-b border-border text-[11px] uppercase tracking-wider font-semibold text-ink/50`}>
      {headers.map((h, i) => <span key={i}>{h}</span>)}
    </div>
  );
}

function Row({ cols, children, className = '' }) {
  return (
    <li className={`grid grid-cols-1 ${cols} gap-2 md:gap-4 md:items-center px-4 md:px-5 py-3.5 transition-colors hover:bg-cream/70 ${className}`}>
      {children}
    </li>
  );
}

function Cell({ label, children, className = '' }) {
  return (
    <div className={`min-w-0 flex items-center gap-2 md:block ${className}`}>
      {label && <span className="md:hidden text-[10px] uppercase tracking-wider font-semibold text-ink/40 w-20 flex-shrink-0">{label}</span>}
      {children}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-cream border border-border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300" />
      {value && <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-cream-deep flex items-center justify-center" aria-label="Clear search"><X className="w-3.5 h-3.5 text-ink/50" /></button>}
    </div>
  );
}

function SettingToggle({ id, title, description, checked, onChange }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl bg-cream border border-border p-4">
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        <p className="text-sm text-ink/60 mt-0.5">{description}</p>
      </div>
      <label htmlFor={id} className="flex items-center gap-3 cursor-pointer flex-shrink-0">
        <span className={`text-xs font-medium ${checked ? 'text-moss-700' : 'text-ink/50'}`}>{checked ? 'Enabled' : 'Disabled'}</span>
        <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-moss-600' : 'bg-ink/20'}`}>
          <input id={id} type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
          <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </span>
      </label>
    </div>
  );
}
