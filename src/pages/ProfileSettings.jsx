import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageShell from '@/components/shell/PageShell';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, User, Store, LogOut, TrendingUp, Share2, Image as ImageIcon, ShieldCheck, Lock, Check, Clock, ExternalLink, FileCheck, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import TierUpgradeModal from '../components/seller/TierUpgradeModal';
import VerificationPaymentModal from '../components/seller/VerificationPaymentModal';

export default function ProfileSettings() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showTierUpgrade, setShowTierUpgrade] = useState(false);
  const [showVerificationPayment, setShowVerificationPayment] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    full_name: '',
    user_type: '',
    contact_number: '',
    whatsapp_number: '',
    province: '',
    city: '',
    exact_location: '',
    profile_photo_url: '',
    cover_image_url: '',
    farm_name: '',
    seller_description: '',
    business_hours: '',
    id_document_url: '',
    proof_of_address_url: ''
  });
  const [uploadingCover, setUploadingCover] = useState(false);

  const [sellerInfo, setSellerInfo] = useState({
    subdomain: ''
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
        setFormData({
          full_name: currentUser.full_name || '',
          user_type: currentUser.user_type || '',
          contact_number: currentUser.contact_number || '',
          whatsapp_number: currentUser.whatsapp_number || '',
          province: currentUser.province || '',
          city: currentUser.city || '',
          exact_location: currentUser.exact_location || '',
          profile_photo_url: currentUser.profile_photo_url || '',
          cover_image_url: currentUser.cover_image_url || '',
          farm_name: currentUser.farm_name || '',
          seller_description: currentUser.seller_description || '',
          business_hours: currentUser.business_hours || '',
          id_document_url: currentUser.id_document_url || '',
          proof_of_address_url: currentUser.proof_of_address_url || ''
        });

        // Load seller profile for subdomain
        if (currentUser.user_type === 'seller' || currentUser.user_type === 'both') {
          const profiles = await api.entities.SellerProfile.filter({ user_email: currentUser.email });
          if (profiles.length > 0) {
            setSellerInfo({
              subdomain: profiles[0].subdomain || ''
            });
          }
        }
      } catch (error) {
        api.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();

    // Check for payment success in URL
    const urlParams = new URLSearchParams(window.location.search);
    const newTier = urlParams.get('tier');
    if (urlParams.get('tier_upgrade_success') === 'true' && newTier) {
      // Activate tier immediately as fallback to webhook
      const activateTier = async () => {
        try {
          await api.auth.updateMe({ seller_tier: newTier });
          toast.success('Payment successful! Your tier has been upgraded.');
          queryClient.invalidateQueries(['user']);
          window.location.reload();
        } catch (error) {
          console.error('Tier activation error:', error);
          toast.success('Payment received! Tier will activate shortly.');
        }
      };
      activateTier();
      window.history.replaceState({}, '', window.location.pathname);
    }
    if (urlParams.get('verification_payment_success') === 'true') {
      // Activate verification immediately as fallback to webhook
      const activateVerification = async () => {
        try {
          await api.auth.updateMe({ 
            seller_verified: true,
            verification_payment_pending: false,
            verification_submitted: true
          });
          toast.success('Payment successful! Your account has been verified.');
          queryClient.invalidateQueries(['user']);
          window.location.reload();
        } catch (error) {
          console.error('Verification activation error:', error);
          toast.success('Payment received! Verification will activate shortly.');
        }
      };
      activateVerification();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      await api.auth.updateMe(data);
      
      // Sync to SellerProfile if user is a seller
      if (data.user_type === 'seller' || data.user_type === 'both') {
        const currentUser = await api.auth.me();
        const existingProfiles = await api.entities.SellerProfile.filter({ user_email: currentUser.email });
        
        const profileData = {
          user_email: currentUser.email,
          display_name: data.full_name || currentUser.full_name,
          farm_name: data.farm_name || '',
          business_name: data.farm_name || '',
          subdomain: data.subdomain || '',
          profile_photo_url: data.profile_photo_url || '',
          cover_image_url: data.cover_image_url || '',
          bio: data.seller_description || '',
          province: data.province || '',
          city: data.city || '',
          contact_number: data.contact_number || '',
          whatsapp_number: data.whatsapp_number || '',
          seller_verified: currentUser.seller_verified || false,
          seller_tier: currentUser.seller_tier || 'basic',
          business_hours: data.business_hours || ''
        };
        
        if (existingProfiles.length > 0) {
          await api.entities.SellerProfile.update(existingProfiles[0].id, profileData);
        } else {
          await api.entities.SellerProfile.create(profileData);
        }
      }
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries(['user']);
      queryClient.invalidateQueries(['seller-profile']);
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_photo_url: file_url }));
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, cover_image_url: file_url }));
      toast.success('Banner uploaded');
    } catch (error) {
      toast.error('Failed to upload banner');
    } finally {
      setUploadingCover(false);
    }
  };

  const removeCover = () => {
    setFormData(prev => ({ ...prev, cover_image_url: '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.user_type || !formData.contact_number || !formData.province || !formData.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    updateProfileMutation.mutate({ ...formData, subdomain: sellerInfo.subdomain });
  };

  const handleLogout = () => {
    api.auth.logout();
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  const isSeller = formData.user_type === 'seller' || formData.user_type === 'both';
  const tierLabel = (user?.seller_tier || 'basic').charAt(0).toUpperCase() + (user?.seller_tier || 'basic').slice(1);

  const SECTIONS = [
    { id: 'profile', label: 'Profile', icon: User },
    ...(isSeller ? [
      { id: 'plan', label: 'Plan & tier', icon: TrendingUp },
      { id: 'branding', label: 'Branding', icon: ImageIcon },
      { id: 'business', label: 'Business', icon: Store },
      { id: 'verification', label: 'Verification', icon: ShieldCheck },
    ] : []),
    { id: 'security', label: 'Security', icon: Lock },
  ];

  const scrollTo = (id) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };


  return (
    <PageShell
      variant="compact"
      eyebrow="Account"
      title="Settings"
      subtitle="Your profile, shop branding, business details and security — all in one place."
      breadcrumb={[{ label: 'App', href: createPageUrl('Dashboard') }, { label: 'Settings' }]}
      action={
        <Button onClick={handleLogout} variant="outline" className="rounded-full gap-1.5 text-terracotta-600 hover:text-terracotta-700">
          <LogOut className="w-4 h-4" /> Sign out
        </Button>
      }
    >
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:items-start">
        {/* Section nav */}
        <nav className="mb-5 lg:mb-0 lg:sticky lg:top-24">
          <div className="card-premium p-2 flex lg:flex-col gap-1 overflow-x-auto scrollbar-none">
            {SECTIONS.map(s => (
              <button key={s.id} type="button" onClick={() => scrollTo(s.id)}
                className="whitespace-nowrap flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink/70 hover:bg-moss-50 hover:text-moss-700 transition-colors text-left">
                <s.icon className="w-4 h-4 flex-shrink-0" strokeWidth={1.75} />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
          <div className="hidden lg:block mt-4 card-premium p-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full overflow-hidden bg-cream-deep border border-border flex-shrink-0">
                {formData.profile_photo_url ? <img src={formData.profile_photo_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-ink/35"><User className="w-5 h-5" /></div>}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink truncate">{formData.full_name || user.full_name || 'Your account'}</p>
                <p className="text-xs text-ink/50 truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              <span className="chip text-[11px] capitalize">{formData.user_type || 'buyer'}</span>
              {isSeller && <span className="chip chip-accent text-[11px]">{tierLabel} tier</span>}
              {user.seller_verified && <span className="chip text-[11px] bg-fresh-50 text-moss-700 border-fresh-200 gap-1"><ShieldCheck className="w-3 h-3" /> Verified</span>}
            </div>
          </div>
        </nav>

        <div className="min-w-0 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ===== Profile ===== */}
            <SectionCard id="profile" title="Profile" description="Your public identity and how people can reach you." icon={User}>
              <div className="space-y-6">
                <div className="flex items-center gap-5 rounded-2xl bg-cream border border-border p-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-cream-deep border-4 border-white shadow-soft">
                      {formData.profile_photo_url ? (
                        <img src={formData.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink/35"><User className="w-9 h-9" /></div>
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-moss-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-moss-700 shadow-soft" title="Upload photo">
                      {uploading ? <Loader2 className="w-4 h-4 text-cream animate-spin" /> : <Upload className="w-4 h-4 text-cream" />}
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                  <div>
                    <h3 className="font-medium text-ink">Profile photo</h3>
                    <p className="text-sm text-ink/55">Square image works best. JPG or PNG.</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="full_name">Full name</Label>
                  <Input className="mt-1.5 rounded-xl"
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <Label htmlFor="user_type">I am a *</Label>
                  <div className="grid grid-cols-3 gap-3 mt-2">
                    {['buyer', 'seller', 'both'].map((type) => {
                      const on = formData.user_type === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, user_type: type })}
                          className={`relative p-3.5 rounded-xl border-2 text-sm font-medium capitalize transition-all ${on ? 'border-moss-600 bg-moss-50/60 text-moss-800' : 'border-border bg-white text-ink/70 hover:border-moss-200'}`}
                        >
                          {on && <Check className="absolute top-2 right-2 w-3.5 h-3.5 text-moss-600" />}
                          {type === 'both' ? 'Buy & sell' : type}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_number">Contact Number *</Label>
                    <Input className="mt-1.5 rounded-xl"
                      id="contact_number"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      placeholder="+1234567890"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input className="mt-1.5 rounded-xl"
                      id="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="province">Province/State *</Label>
                    <Select
                      value={formData.province}
                      onValueChange={(value) => setFormData({ ...formData, province: value })}
                    >
                      <SelectTrigger id="province" className="mt-1.5 rounded-xl">
                        <SelectValue placeholder="Select province" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                        <SelectItem value="Free State">Free State</SelectItem>
                        <SelectItem value="Gauteng">Gauteng</SelectItem>
                        <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                        <SelectItem value="Limpopo">Limpopo</SelectItem>
                        <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                        <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                        <SelectItem value="North West">North West</SelectItem>
                        <SelectItem value="Western Cape">Western Cape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="city">City/Town *</Label>
                    <Input className="mt-1.5 rounded-xl"
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g., Cape Town, Johannesburg"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="exact_location">Exact Location/Address</Label>
                  <Input className="mt-1.5 rounded-xl"
                    id="exact_location"
                    value={formData.exact_location}
                    onChange={(e) => setFormData({ ...formData, exact_location: e.target.value })}
                    placeholder="Street address or landmark"
                  />
                </div>
              </div>
            </SectionCard>

            {isSeller && (
              <>
                {/* ===== Plan ===== */}
                <section id="section-plan" className="relative overflow-hidden rounded-2xl bg-moss-gradient text-cream p-6 scroll-mt-24">
                  <div className="absolute inset-0 grain opacity-50" />
                  <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <p className="eyebrow text-cream/60 mb-1">Current plan</p>
                      <p className="font-display text-3xl">{tierLabel}</p>
                      <p className="text-sm text-cream/70 mt-1">Upgrade for more listings, images, CRM prospects and farm batches.</p>
                    </div>
                    <Button type="button" onClick={() => setShowTierUpgrade(true)} className="btn-accent px-5 py-2.5 text-sm gap-1.5">
                      <TrendingUp className="w-4 h-4" /> Upgrade tier
                    </Button>
                  </div>
                </section>

                {/* ===== Shop branding (banner + logo) ===== */}
                <SectionCard id="branding" title="Shop branding" description="Your banner and logo appear on your shop page and in the shops directory." icon={ImageIcon}>
                  <div className="space-y-6">
                    {/* Banner upload */}
                    <div>
                      <Label>Shop banner</Label>
                      <p className="text-xs text-ink/55 mb-2">Recommended: <strong>1500×500px</strong> (3:1 ratio). Wider images will be cropped on the shops directory cards. Important text/logos should sit in the center.</p>
                      <div className="relative aspect-[3/1] rounded-2xl overflow-hidden border-2 border-dashed border-border hover:border-moss-600 bg-cream-gradient group transition-colors">
                        {formData.cover_image_url ? (
                          <>
                            <img
                              src={formData.cover_image_url}
                              alt="Shop banner"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={removeCover}
                              className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white text-xs font-medium text-terracotta-600 shadow-soft opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-ink/55">
                            {uploadingCover ? (
                              <Loader2 className="w-7 h-7 animate-spin" />
                            ) : (
                              <>
                                <Upload className="w-7 h-7 mb-2" strokeWidth={1.5} />
                                <p className="text-sm font-medium">Click to upload banner</p>
                                <p className="text-xs mt-1">JPG or PNG, up to 8MB</p>
                              </>
                            )}
                          </div>
                        )}
                        <label className="absolute inset-0 cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleCoverUpload}
                            className="hidden"
                            disabled={uploadingCover}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Logo upload */}
                    <div>
                      <Label>Shop logo</Label>
                      <p className="text-xs text-ink/55 mb-2">Recommended: square, 256×256px or larger. Shown on your shop page and in the directory.</p>
                      <div className="flex items-center gap-5">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-border bg-cream-gradient group">
                          {formData.profile_photo_url ? (
                            <img
                              src={formData.profile_photo_url}
                              alt="Shop logo"
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-ink/40">
                              {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-6 h-6" strokeWidth={1.5} />}
                            </div>
                          )}
                          <label className="absolute inset-0 cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                              disabled={uploading}
                            />
                          </label>
                        </div>
                        <div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.currentTarget.previousElementSibling?.querySelector('input')?.click();
                            }}
                            className="rounded-full h-9"
                          >
                            {formData.profile_photo_url ? 'Change logo' : 'Upload logo'}
                          </Button>
                          {formData.profile_photo_url && (
                            <button
                              type="button"
                              onClick={() => setFormData((p) => ({ ...p, profile_photo_url: '' }))}
                              className="ml-3 text-xs text-terracotta-600 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>

                {/* ===== Business ===== */}
                <SectionCard id="business" title="Business details" description="What buyers see on your shop page." icon={Store}>
                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="farm_name">Farm/Business Name</Label>
                      <Input className="mt-1.5 rounded-xl"
                        id="farm_name"
                        value={formData.farm_name}
                        onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                        placeholder="Your farm or business name"
                      />
                    </div>

                    <div>
                      <Label htmlFor="subdomain">Shop Subdomain (Your Unique Shop URL)</Label>
                      <div className="flex items-center mt-1.5 rounded-xl border border-border bg-cream overflow-hidden focus-within:ring-2 focus-within:ring-moss-300">
                        <span className="pl-3 pr-2 text-xs text-ink/50 whitespace-nowrap font-mono">SellerShop?shop=</span>
                        <Input
                          id="subdomain"
                          value={sellerInfo.subdomain}
                          onChange={(e) => setSellerInfo({ ...sellerInfo, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                          placeholder="your-shop-name"
                          className="flex-1 border-0 bg-white rounded-none focus-visible:ring-0"
                        />
                      </div>
                      <p className="text-xs text-ink/55 mt-1">Choose a unique name for your shop URL (letters, numbers, hyphens only)</p>
                      {sellerInfo.subdomain && (
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <a
                            href={`${window.location.origin}${createPageUrl('SellerShop')}?shop=${sellerInfo.subdomain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-moss-700 hover:underline inline-flex items-center gap-1 truncate max-w-full"
                          >
                            <ExternalLink className="w-3 h-3 flex-shrink-0" /> {window.location.origin}{createPageUrl('SellerShop')}?shop={sellerInfo.subdomain}
                          </a>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = `${window.location.origin}${createPageUrl('SellerShop')}?shop=${sellerInfo.subdomain}`;
                              navigator.clipboard.writeText(url);
                              toast.success('Shop URL copied to clipboard!');
                            }}
                            className="rounded-full h-7 text-xs gap-1"
                          >
                            <Share2 className="w-3 h-3" /> Copy shop URL
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="seller_description">About Your Farm/Business</Label>
                      <Textarea className="mt-1.5 rounded-xl"
                        id="seller_description"
                        value={formData.seller_description}
                        onChange={(e) => setFormData({ ...formData, seller_description: e.target.value })}
                        placeholder="Tell buyers about your farm, experience, and what you offer..."
                        rows={5}
                      />
                    </div>

                    <div>
                      <Label htmlFor="business_hours">Business Hours</Label>
                      <Input className="mt-1.5 rounded-xl"
                        id="business_hours"
                        value={formData.business_hours}
                        onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                        placeholder="e.g., Mon-Sat 8AM-6PM"
                      />
                    </div>
                  </div>
                </SectionCard>

                {/* ===== Verification ===== */}
                <SectionCard id="verification" title="Seller verification" description="Verified sellers can show their contact number to buyers and earn a trust badge." icon={ShieldCheck}>
                  {user.seller_verified ? (
                    <div className="bg-fresh-50 border border-fresh-200 rounded-xl p-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-moss-600 text-cream flex items-center justify-center flex-shrink-0">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-moss-800">Verified seller</p>
                        <p className="text-sm text-moss-700">Your account is verified</p>
                      </div>
                    </div>
                  ) : user.verification_payment_pending ? (
                    <div className="bg-yolk-50 border border-yolk-200 rounded-xl p-4 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-yolk-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-yolk-700">Payment under review</p>
                        <p className="text-sm text-yolk-700/80">Your verification payment is being reviewed by admin</p>
                      </div>
                    </div>
                  ) : user.verification_submitted ? (
                    <div className="bg-yolk-50 border border-yolk-200 rounded-xl p-4 flex items-center gap-3">
                      <Clock className="w-5 h-5 text-yolk-600 flex-shrink-0" />
                      <div>
                        <p className="font-semibold text-yolk-700">Verification pending</p>
                        <p className="text-sm text-yolk-700/80">Your documents are under review by admin</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-ink/65 text-sm">Upload your ID and proof of address, then pay the verification fee to get verified.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label>ID Document</Label>
                          <div className="mt-2">
                            {formData.id_document_url ? (
                              <div className="flex items-center justify-between gap-3 bg-fresh-50 border border-fresh-200 rounded-xl p-3">
                                <span className="text-sm text-moss-800 inline-flex items-center gap-2"><FileCheck className="w-4 h-4" /> Document uploaded</span>
                                <Button type="button" variant="ghost" size="sm" className="rounded-full h-7 text-xs" onClick={() => setFormData({ ...formData, id_document_url: '' })}>Remove</Button>
                              </div>
                            ) : (
                              <label className="block cursor-pointer">
                                <div className="border-2 border-dashed border-border rounded-xl p-5 hover:border-moss-600 bg-cream transition-colors text-center">
                                  <Upload className="w-6 h-6 text-ink/40 mx-auto mb-2" />
                                  <span className="text-sm text-ink/65">Upload ID</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      setUploading(true);
                                      try {
                                        const { file_url } = await api.integrations.Core.UploadFile({ file });
                                        setFormData(prev => ({ ...prev, id_document_url: file_url }));
                                        toast.success('ID document uploaded');
                                      } catch (error) {
                                        toast.error('Failed to upload document');
                                      } finally {
                                        setUploading(false);
                                      }
                                    }
                                  }}
                                  className="hidden"
                                  disabled={uploading}
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Proof of Address</Label>
                          <div className="mt-2">
                            {formData.proof_of_address_url ? (
                              <div className="flex items-center justify-between gap-3 bg-fresh-50 border border-fresh-200 rounded-xl p-3">
                                <span className="text-sm text-moss-800 inline-flex items-center gap-2"><FileCheck className="w-4 h-4" /> Document uploaded</span>
                                <Button type="button" variant="ghost" size="sm" className="rounded-full h-7 text-xs" onClick={() => setFormData({ ...formData, proof_of_address_url: '' })}>Remove</Button>
                              </div>
                            ) : (
                              <label className="block cursor-pointer">
                                <div className="border-2 border-dashed border-border rounded-xl p-5 hover:border-moss-600 bg-cream transition-colors text-center">
                                  <Upload className="w-6 h-6 text-ink/40 mx-auto mb-2" />
                                  <span className="text-sm text-ink/65">Upload Proof of Address</span>
                                </div>
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (file) {
                                      setUploading(true);
                                      try {
                                        const { file_url } = await api.integrations.Core.UploadFile({ file });
                                        setFormData(prev => ({ ...prev, proof_of_address_url: file_url }));
                                        toast.success('Proof of address uploaded');
                                      } catch (error) {
                                        toast.error('Failed to upload document');
                                      } finally {
                                        setUploading(false);
                                      }
                                    }
                                  }}
                                  className="hidden"
                                  disabled={uploading}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      {formData.id_document_url && formData.proof_of_address_url && (
                        <Button
                          type="button"
                          onClick={() => setShowVerificationPayment(true)}
                          className="btn-cta px-5 py-2.5 text-sm gap-1.5"
                        >
                          <ShieldCheck className="w-4 h-4" /> Pay & submit for verification
                        </Button>
                      )}
                    </div>
                  )}
                </SectionCard>
              </>
            )}

            {/* Sticky save bar */}
            <div className="sticky bottom-4 z-10">
              <div className="card-premium px-4 py-3 flex items-center justify-between gap-3 shadow-lift">
                <p className="text-xs text-ink/55 hidden sm:block">Changes are saved to your profile{isSeller ? ' and shop page' : ''}.</p>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="btn-cta px-6 py-2.5 text-sm gap-1.5 ml-auto"
                >
                  {updateProfileMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save changes</>}
                </Button>
              </div>
            </div>
          </form>

          {/* ===== Security (own form — must stay outside the profile form) ===== */}
          <PasswordCard />
        </div>
      </div>

      {showTierUpgrade && (
        <TierUpgradeModal
          isOpen={showTierUpgrade}
          onClose={() => setShowTierUpgrade(false)}
          currentUser={user}
        />
      )}

      {showVerificationPayment && (
        <VerificationPaymentModal
          isOpen={showVerificationPayment}
          onClose={() => setShowVerificationPayment(false)}
          currentUser={user}
          formData={formData}
        />
      )}
    </PageShell>
  );
}

function PasswordCard() {
  const [current, setCurrent] = React.useState('');
  const [next, setNext] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [show, setShow] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next !== confirm) return toast.error('New passwords do not match');
    if (next.length < 6) return toast.error('New password must be at least 6 characters');
    setBusy(true);
    try {
      await api.auth.changePassword(current, next);
      toast.success('Password updated');
      setCurrent(''); setNext(''); setConfirm('');
    } catch (err) {
      const code = err?.code || '';
      toast.error(
        code.includes('wrong-password') || code.includes('invalid-credential')
          ? 'Current password is incorrect'
          : code.includes('weak-password')
            ? 'New password is too weak (minimum 6 characters)'
            : code.includes('requires-recent-login')
              ? 'Please sign out and back in, then try again'
              : (err?.message || 'Could not update password')
      );
    } finally { setBusy(false); }
  };

  return (
    <section id="section-security" className="card-premium p-6 scroll-mt-24">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-moss-50 text-moss-700 flex items-center justify-center flex-shrink-0"><Lock className="w-5 h-5" /></div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Security</h2>
          <p className="text-sm text-ink/55 mt-0.5">Change your password. You'll stay signed in on this device after the change.</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="cur_pw">Current password</Label>
          <Input id="cur_pw" type={show ? 'text' : 'password'} value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className="mt-1.5 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="new_pw">New password</Label>
            <Input id="new_pw" type={show ? 'text' : 'password'} value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" minLength={6} required className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="cfm_pw">Confirm new password</Label>
            <Input id="cfm_pw" type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" minLength={6} required className="mt-1.5 rounded-xl" />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-ink/65 cursor-pointer">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="rounded accent-moss-600" />
          Show passwords
        </label>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={busy || !current || !next || !confirm} className="btn-cta px-6 py-2.5 text-sm gap-1.5">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating…</> : <><Lock className="w-4 h-4" /> Update password</>}
          </Button>
        </div>
      </form>
    </section>
  );
}

function SectionCard({ id, title, description, icon: Icon, children, action }) {
  return (
  <section id={`section-${id}`} className="card-premium p-6 scroll-mt-24">
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-moss-50 text-moss-700 flex items-center justify-center flex-shrink-0"><Icon className="w-5 h-5" /></div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {description && <p className="text-sm text-ink/55 mt-0.5">{description}</p>}
        </div>
      </div>
      {action}
    </div>
    {children}
  </section>
  );
}

