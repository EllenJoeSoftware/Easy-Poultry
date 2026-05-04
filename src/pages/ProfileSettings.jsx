import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, User, Store, LogOut, TrendingUp, Share2 } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const isSeller = formData.user_type === 'seller' || formData.user_type === 'both';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="text-red-600 hover:text-red-700">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="space-y-6">
            <TabsList className="bg-white border shadow-sm">
              <TabsTrigger value="basic">
                <User className="w-4 h-4 mr-2" />
                Basic Info
              </TabsTrigger>
              {isSeller && (
                <TabsTrigger value="seller">
                  <Store className="w-4 h-4 mr-2" />
                  Seller Info
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="basic">
              <Card className="p-6 border-0 shadow-lg space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100">
                      {formData.profile_photo_url ? (
                        <img
                          src={formData.profile_photo_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <User className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#7A9D7A] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6A8D6A] shadow-lg">
                      <Upload className="w-4 h-4 text-white" />
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
                    <h3 className="font-semibold text-gray-900 mb-1">Profile Photo</h3>
                    <p className="text-sm text-gray-600">Upload a profile picture</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="user_type">I am a *</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {['buyer', 'seller', 'both'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, user_type: type })}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.user_type === type
                            ? 'border-[#7A9D7A] bg-[#7A9D7A]/5'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium capitalize">{type}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_number">Contact Number *</Label>
                    <Input
                      id="contact_number"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      placeholder="+1234567890"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp_number">WhatsApp Number</Label>
                    <Input
                      id="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                      placeholder="+1234567890"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="province">Province/State *</Label>
                    <Select
                      value={formData.province}
                      onValueChange={(value) => setFormData({ ...formData, province: value })}
                    >
                      <SelectTrigger id="province">
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
                    <Input
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
                  <Input
                    id="exact_location"
                    value={formData.exact_location}
                    onChange={(e) => setFormData({ ...formData, exact_location: e.target.value })}
                    placeholder="Street address or landmark"
                  />
                </div>
              </Card>
            </TabsContent>

            {isSeller && (
              <TabsContent value="seller">
                <Card className="p-6 border-0 shadow-lg mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Current Tier</h3>
                      <p className="text-2xl font-bold text-[#7A9D7A] mt-1">
                        {(user?.seller_tier || 'basic').charAt(0).toUpperCase() + (user?.seller_tier || 'basic').slice(1)}
                      </p>
                    </div>
                    <Button onClick={() => setShowTierUpgrade(true)} className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Upgrade Tier
                    </Button>
                  </div>
                </Card>

                {/* ============ Shop branding (banner + logo) ============ */}
                <Card className="p-6 border-0 shadow-lg space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Shop branding</h3>
                    <p className="text-sm text-gray-500">Your banner and logo appear on your shop page and in the shops directory.</p>
                  </div>

                  {/* Banner upload */}
                  <div>
                    <Label>Shop banner</Label>
                    <p className="text-xs text-gray-500 mb-2">Recommended: <strong>1500×500px</strong> (3:1 ratio). Wider images will be cropped on the shops directory cards. Important text/logos should sit in the center.</p>
                    <div className="relative aspect-[3/1] rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-[#7A9D7A] bg-gradient-to-br from-[#3A5A40]/10 to-[#E07A5F]/10 group transition-colors">
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
                            className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm hover:bg-white text-xs font-medium text-red-600 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
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
                    <p className="text-xs text-gray-500 mb-2">Recommended: square, 256×256px or larger. Shown on your shop page and in the directory.</p>
                    <div className="flex items-center gap-5">
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 bg-gradient-to-br from-[#3A5A40]/10 to-[#E07A5F]/10 group">
                        {formData.profile_photo_url ? (
                          <img
                            src={formData.profile_photo_url}
                            alt="Shop logo"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
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
                          className="h-9"
                        >
                          {formData.profile_photo_url ? 'Change logo' : 'Upload logo'}
                        </Button>
                        {formData.profile_photo_url && (
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, profile_photo_url: '' }))}
                            className="ml-2 text-xs text-red-600 hover:underline"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 border-0 shadow-lg space-y-6">
                  <div>
                    <Label htmlFor="farm_name">Farm/Business Name</Label>
                    <Input
                      id="farm_name"
                      value={formData.farm_name}
                      onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                      placeholder="Your farm or business name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subdomain">Shop Subdomain (Your Unique Shop URL)</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-500 whitespace-nowrap">Shop URL: SellerShop?shop=</span>
                      <Input
                        id="subdomain"
                        value={sellerInfo.subdomain}
                        onChange={(e) => setSellerInfo({ ...sellerInfo, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        placeholder="your-shop-name"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Choose a unique name for your shop URL (letters, numbers, hyphens only)</p>
                    {sellerInfo.subdomain && (
                      <div className="flex items-center gap-2 mt-2">
                        <a 
                          href={`${window.location.origin}${createPageUrl('SellerShop')}?shop=${sellerInfo.subdomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#7A9D7A] hover:underline"
                        >
                          Preview: {window.location.origin}{createPageUrl('SellerShop')}?shop={sellerInfo.subdomain} →
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
                          className="h-7"
                        >
                          <Share2 className="w-3 h-3 mr-1" />
                          Copy Shop URL
                        </Button>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="seller_description">About Your Farm/Business</Label>
                    <Textarea
                      id="seller_description"
                      value={formData.seller_description}
                      onChange={(e) => setFormData({ ...formData, seller_description: e.target.value })}
                      placeholder="Tell buyers about your farm, experience, and what you offer..."
                      rows={5}
                    />
                  </div>

                  <div>
                    <Label htmlFor="business_hours">Business Hours</Label>
                    <Input
                      id="business_hours"
                      value={formData.business_hours}
                      onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                      placeholder="e.g., Mon-Sat 8AM-6PM"
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Seller Verification</h3>
                    
                    {user.seller_verified ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">Verified Seller</p>
                          <p className="text-sm text-green-700">Your account is verified</p>
                        </div>
                      </div>
                    ) : user.verification_payment_pending ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="font-semibold text-yellow-900 mb-1">Payment Under Review</p>
                        <p className="text-sm text-yellow-700">Your verification payment is being reviewed by admin</p>
                      </div>
                    ) : user.verification_submitted ? (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="font-semibold text-yellow-900 mb-1">Verification Pending</p>
                        <p className="text-sm text-yellow-700">Your documents are under review by admin</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-600 text-sm">Upload your ID and proof of address, then pay the verification fee to get verified. Verified sellers can show their contact number to buyers.</p>
                        
                        <div>
                          <Label>ID Document</Label>
                          <div className="mt-2 flex items-center gap-4">
                            {formData.id_document_url ? (
                              <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                <span className="text-sm text-gray-700">Document uploaded</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setFormData({ ...formData, id_document_url: '' })}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <label className="flex-1 cursor-pointer">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#7A9D7A] transition-colors text-center">
                                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                  <span className="text-sm text-gray-600">Upload ID</span>
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
                          <div className="mt-2 flex items-center gap-4">
                            {formData.proof_of_address_url ? (
                              <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                                <span className="text-sm text-gray-700">Document uploaded</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setFormData({ ...formData, proof_of_address_url: '' })}
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <label className="flex-1 cursor-pointer">
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-[#7A9D7A] transition-colors text-center">
                                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                                  <span className="text-sm text-gray-600">Upload Proof of Address</span>
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

                        {formData.id_document_url && formData.proof_of_address_url && (
                          <Button
                            type="button"
                            onClick={() => setShowVerificationPayment(true)}
                            className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                          >
                            Pay & Submit for Verification
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            )}
          </Tabs>

          <div className="flex justify-end gap-4 mt-6">
            <Button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-[#7A9D7A] hover:bg-[#6A8D6A] px-8 h-11"
            >
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>

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
      </div>
    </div>
  );
}