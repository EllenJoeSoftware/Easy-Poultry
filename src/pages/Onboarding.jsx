import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    user_type: 'both',
    contact_number: '',
    whatsapp_number: '',
    province: '',
    city: '',
    exact_location: '',
    profile_photo_url: '',
    farm_name: '',
    seller_description: '',
    business_hours: ''
  });

  // Fetch admin settings to check if account approval is required
  const { data: adminSettings } = useQuery({
    queryKey: ['admin-settings-onboarding'],
    queryFn: async () => {
      const settings = await api.entities.AdminSettings.filter({ setting_key: 'main' });
      return settings[0] || null;
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => {
      const paymentRef = Math.floor(1000000 + Math.random() * 9000000).toString();
      const isSeller = data.user_type === 'seller' || data.user_type === 'both';
      
      // Auto-activate all accounts (buyers and sellers)
      const sellerActivated = true;
      
      await api.auth.updateMe({ 
        ...data, 
        payment_reference_number: paymentRef,
        seller_tier: 'basic',
        seller_activated: sellerActivated
      });
      
      // Create SellerProfile if user is a seller
      if (isSeller) {
        const currentUser = await api.auth.me();
        await api.entities.SellerProfile.create({
          user_email: currentUser.email,
          display_name: currentUser.full_name || currentUser.email.split('@')[0],
          farm_name: data.farm_name || '',
          profile_photo_url: data.profile_photo_url || '',
          bio: data.seller_description || '',
          province: data.province || '',
          city: data.city || '',
          contact_number: data.contact_number || '',
          whatsapp_number: data.whatsapp_number || '',
          seller_verified: false,
          seller_tier: 'basic',
          business_hours: data.business_hours || ''
        });
      }
      
    },
    onSuccess: () => {
      toast.success('Welcome to Easy Poultry!');
      navigate(createPageUrl('Home'));
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, profile_photo_url: file_url }));
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && !formData.user_type) {
      toast.error('Please select your account type');
      return;
    }
    if (step === 2 && (!formData.contact_number || !formData.province || !formData.city)) {
      toast.error('Please fill in all required fields');
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = () => {
    updateProfileMutation.mutate(formData);
  };

  const isSeller = formData.user_type === 'seller' || formData.user_type === 'both';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F4F1DE] to-white flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 border-0 shadow-2xl">
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69217b962ad6e0119f66201f/6a47c0425_CroppedLogo.png" 
            alt="Easy Poultry Logo" 
            className="w-16 h-16 object-contain mx-auto mb-4"
          />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Easy Poultry</h1>
          <p className="text-gray-600">Let's set up your account in {isSeller ? '3' : '2'} quick steps</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          {[1, 2, isSeller && 3].filter(Boolean).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-[#7A9D7A] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {i < (isSeller ? 2 : 1) && (
                <div className={`w-16 h-1 mx-2 ${step > s ? 'bg-[#7A9D7A]' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-lg font-semibold mb-4 block">I want to:</Label>
              <div className="grid grid-cols-3 gap-4">
                {['buyer', 'seller', 'both'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, user_type: type })}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      formData.user_type === type
                        ? 'border-[#7A9D7A] bg-[#7A9D7A]/5 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {type === 'buyer' ? '🛒' : type === 'seller' ? '🏪' : '🤝'}
                    </div>
                    <p className="font-semibold capitalize">{type === 'both' ? 'Buy & Sell' : type}</p>
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleNext} className="w-full bg-[#7A9D7A] hover:bg-[#6A8D6A] h-12">
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                  {formData.profile_photo_url ? (
                    <img src={formData.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">👤</div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#7A9D7A] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#6A8D6A] shadow-lg">
                  <Upload className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_number">Contact Number *</Label>
                <Input
                  id="contact_number"
                  value={formData.contact_number}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="+27..."
                />
              </div>
              <div>
                <Label htmlFor="whatsapp_number">WhatsApp (Optional)</Label>
                <Input
                  id="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  placeholder="+27..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="province">Province *</Label>
                <Select value={formData.province} onValueChange={(value) => setFormData({ ...formData, province: value })}>
                  <SelectTrigger>
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
                  placeholder="e.g., Cape Town"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="exact_location">Address (Optional)</Label>
              <Input
                id="exact_location"
                value={formData.exact_location}
                onChange={(e) => setFormData({ ...formData, exact_location: e.target.value })}
                placeholder="Street address or landmark"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(1)} variant="outline" className="flex-1 h-12">
                Back
              </Button>
              <Button onClick={isSeller ? handleNext : handleSubmit} className="flex-1 bg-[#7A9D7A] hover:bg-[#6A8D6A] h-12">
                {isSeller ? 'Continue' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && isSeller && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="farm_name">Farm/Business Name (Optional)</Label>
              <Input
                id="farm_name"
                value={formData.farm_name}
                onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                placeholder="Your farm name"
              />
            </div>

            <div>
              <Label htmlFor="seller_description">About Your Farm (Optional)</Label>
              <Textarea
                id="seller_description"
                value={formData.seller_description}
                onChange={(e) => setFormData({ ...formData, seller_description: e.target.value })}
                placeholder="Tell buyers about your farm..."
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="business_hours">Business Hours (Optional)</Label>
              <Input
                id="business_hours"
                value={formData.business_hours}
                onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                placeholder="e.g., Mon-Sat 8AM-6PM"
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep(2)} variant="outline" className="flex-1 h-12">
                Back
              </Button>
              <Button onClick={handleSubmit} disabled={updateProfileMutation.isPending} className="flex-1 bg-[#7A9D7A] hover:bg-[#6A8D6A] h-12">
                {updateProfileMutation.isPending ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}