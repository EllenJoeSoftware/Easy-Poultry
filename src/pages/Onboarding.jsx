import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageShell from '@/components/shell/PageShell';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CheckCircle2, Check, ArrowRight, ArrowLeft, Loader2, UserRound, MapPin, Store, ShoppingBag, Handshake } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';

export default function Onboarding({ embedded = false, onComplete } = {}) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
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
        seller_activated: sellerActivated,
        onboarding_completed: true
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
    onSuccess: async () => {
      toast.success('Welcome to Easy Poultry!');
      try { await refreshUser?.(); } catch { /* ignore */ }
      if (embedded) onComplete?.();
      else navigate(createPageUrl('Home'));
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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

  const STEPS = [
    { n: 1, label: 'Account type', hint: 'How you will use Easy Poultry', icon: UserRound },
    { n: 2, label: 'Contact & location', hint: 'So buyers and sellers can reach you', icon: MapPin },
    ...(isSeller ? [{ n: 3, label: 'Your farm', hint: 'Tell buyers about your business', icon: Store }] : []),
  ];
  const total = STEPS.length;
  const progress = Math.round(((step - 1) / total) * 100 + (100 / total) * 0.15);
  const currentStep = STEPS.find(s => s.n === step) || STEPS[0];

  const TYPE_OPTIONS = [
    { value: 'buyer', label: 'Buy', desc: 'Browse the marketplace, bid in auctions and contact sellers.', icon: ShoppingBag },
    { value: 'seller', label: 'Sell', desc: 'List birds, eggs, feed and equipment; manage your farm.', icon: Store },
    { value: 'both', label: 'Buy & sell', desc: 'The full experience — the most popular choice.', icon: Handshake },
  ];

  const body = (
      <div className="max-w-3xl mx-auto">
        {/* Stepper */}
        <div className="card-premium p-4 sm:p-5 mb-6">
          <div className="flex items-center justify-between gap-3 mb-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink/45">Step {step} of {total}</p>
            <p className="text-xs text-ink/45 tabular-nums">{Math.min(100, progress)}%</p>
          </div>
          <div className="h-1.5 w-full rounded-full bg-cream-deep overflow-hidden">
            <motion.div className="h-full rounded-full bg-moss-600" initial={false} animate={{ width: `${Math.min(100, progress)}%` }} transition={{ duration: 0.4, ease: [0.2, 0.7, 0.3, 1] }} />
          </div>
          <ol className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            {STEPS.map((s) => {
              const done = step > s.n;
              const active = step === s.n;
              return (
                <li key={s.n}>
                  <button
                    type="button"
                    onClick={() => done && setStep(s.n)}
                    disabled={!done}
                    className={`w-full flex items-center gap-3 rounded-full px-3 py-2 text-left transition-colors ${active ? 'bg-moss-600 text-cream' : done ? 'bg-moss-50 text-moss-700 hover:bg-moss-100' : 'bg-cream text-ink/45'}`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${active ? 'bg-white/15' : done ? 'bg-moss-600 text-cream' : 'bg-cream-deep text-ink/50'}`}>
                      {done ? <Check className="w-3.5 h-3.5" /> : s.n}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium truncate">{s.label}</span>
                      <span className={`block text-[11px] truncate ${active ? 'text-cream/70' : 'text-ink/45'}`}>{s.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Step body */}
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="card-premium p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-moss-50 text-moss-700 flex items-center justify-center"><currentStep.icon className="w-5 h-5" /></div>
            <div>
              <h2 className="font-display text-xl text-ink">{currentStep.label}</h2>
              <p className="text-sm text-ink/55">{currentStep.hint}</p>
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TYPE_OPTIONS.map((opt) => {
                  const on = formData.user_type === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, user_type: opt.value })}
                      className={`relative text-left p-5 rounded-2xl border-2 transition-all ${on ? 'border-moss-600 bg-moss-50/60 shadow-soft' : 'border-border bg-white hover:border-moss-200'}`}
                    >
                      {on && <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-moss-600 text-cream flex items-center justify-center"><Check className="w-3 h-3" /></span>}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${on ? 'bg-moss-600 text-cream' : 'bg-cream text-moss-700'}`}><opt.icon className="w-5 h-5" /></div>
                      <p className="font-display font-semibold text-ink">{opt.label}</p>
                      <p className="text-xs text-ink/55 mt-1 leading-relaxed">{opt.desc}</p>
                      {opt.value === 'both' && <span className="chip chip-yolk !py-0 !px-2 text-[10px] mt-2">Popular</span>}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleNext} className="btn-cta px-6 py-2.5 text-sm gap-1.5 w-full sm:w-auto">
                  Continue <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 rounded-2xl bg-cream border border-border p-4">
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-cream-deep border-4 border-white shadow-soft">
                    {formData.profile_photo_url ? (
                      <img src={formData.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink/35"><UserRound className="w-8 h-8" /></div>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-moss-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-moss-700 shadow-soft" title="Upload photo">
                    {uploading ? <Loader2 className="w-4 h-4 text-cream animate-spin" /> : <Upload className="w-4 h-4 text-cream" />}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>
                </div>
                <div>
                  <p className="font-medium text-ink">Profile photo</p>
                  <p className="text-xs text-ink/55 mt-0.5">Optional, but profiles with a photo get more replies.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_number">Contact Number *</Label>
                  <Input className="mt-1.5 rounded-xl"
                    id="contact_number"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    placeholder="+27..."
                  />
                </div>
                <div>
                  <Label htmlFor="whatsapp_number">WhatsApp (Optional)</Label>
                  <Input className="mt-1.5 rounded-xl"
                    id="whatsapp_number"
                    value={formData.whatsapp_number}
                    onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                    placeholder="+27..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Select value={formData.province} onValueChange={(value) => setFormData({ ...formData, province: value })}>
                    <SelectTrigger className="mt-1.5 rounded-xl">
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
                    placeholder="e.g., Cape Town"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="exact_location">Address (Optional)</Label>
                <Input className="mt-1.5 rounded-xl"
                  id="exact_location"
                  value={formData.exact_location}
                  onChange={(e) => setFormData({ ...formData, exact_location: e.target.value })}
                  placeholder="Street address or landmark"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
                <Button onClick={() => setStep(1)} variant="outline" className="rounded-full gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={isSeller ? handleNext : handleSubmit} disabled={!isSeller && updateProfileMutation.isPending} className="btn-cta px-6 py-2.5 text-sm gap-1.5">
                  {isSeller ? <>Continue <ArrowRight className="w-4 h-4" /></> : updateProfileMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : <>Complete setup <CheckCircle2 className="w-4 h-4" /></>}
                </Button>
              </div>
            </div>
          )}

          {step === 3 && isSeller && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="farm_name">Farm/Business Name (Optional)</Label>
                <Input className="mt-1.5 rounded-xl"
                  id="farm_name"
                  value={formData.farm_name}
                  onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                  placeholder="Your farm name"
                />
              </div>

              <div>
                <Label htmlFor="seller_description">About Your Farm (Optional)</Label>
                <Textarea className="mt-1.5 rounded-xl"
                  id="seller_description"
                  value={formData.seller_description}
                  onChange={(e) => setFormData({ ...formData, seller_description: e.target.value })}
                  placeholder="Tell buyers about your farm..."
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="business_hours">Business Hours (Optional)</Label>
                <Input className="mt-1.5 rounded-xl"
                  id="business_hours"
                  value={formData.business_hours}
                  onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                  placeholder="e.g., Mon-Sat 8AM-6PM"
                />
              </div>

              {adminSettings?.require_account_approval && (
                <div className="rounded-xl bg-yolk-50 border border-yolk-200 p-4 text-sm text-yolk-700">
                  New seller accounts are reviewed by our team before listings go live. We'll notify you once approved.
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-2">
                <Button onClick={() => setStep(2)} variant="outline" className="rounded-full gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={handleSubmit} disabled={updateProfileMutation.isPending} className="btn-cta px-6 py-2.5 text-sm gap-1.5">
                  {updateProfileMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Setting up…</> : <>Complete setup <CheckCircle2 className="w-4 h-4" /></>}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
  );

  if (embedded) {
    return (
      <div>
        <div className="mb-5">
          <p className="eyebrow mb-1">Welcome</p>
          <h2 className="font-display text-2xl sm:text-3xl text-ink leading-tight">Let's set up your <span className="italic text-moss-700">account</span>.</h2>
          <p className="text-sm text-ink/60 mt-1">{total} quick steps — required before you can use Easy Poultry. You can change any of this later in Settings.</p>
        </div>
        {body}
      </div>
    );
  }

  return (
    <PageShell
      variant="compact"
      eyebrow="Welcome"
      title={<>Let's set up your <span className="italic text-moss-700">account</span>.</>}
      subtitle={`${total} quick steps — you can change any of this later in Settings.`}
    >
      {body}
    </PageShell>
  );
}
