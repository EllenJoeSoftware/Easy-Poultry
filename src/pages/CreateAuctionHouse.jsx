import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, Building2, Check, Gavel, Star, Package, ImagePlus, FileText, ScrollText, CreditCard, Info } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '../utils';

function FormSection({ icon: Icon, title, hint, children }) {
  return (
    <section className="card-premium p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700 flex-shrink-0"><Icon className="w-4 h-4" /></div>
        <div>
          <h2 className="font-display text-lg text-ink leading-tight">{title}</h2>
          {hint && <p className="text-xs text-ink/55 mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function CreateAuctionHouse() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    province: '',
    city: '',
    contact_number: '',
    whatsapp_number: '',
    terms_conditions: ''
  });

  const { data: tiers = [] } = useQuery({
    queryKey: ['auction-house-tiers'],
    queryFn: () => api.entities.AuctionHouseTier.filter({ is_active: true }, 'sort_order')
  });

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

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const house = await api.entities.AuctionHouse.create({
        ...data,
        logo_url: logoUrl,
        cover_image_url: coverUrl,
        tier_id: selectedTier?.id,
        tier_name: selectedTier?.name,
        status: 'pending_payment'
      });
      return house;
    },
    onSuccess: (house) => {
      toast.success('Auction house created! Complete payment to activate.');
      navigate(createPageUrl('AuctionHousePayment') + `?houseId=${house.id}&tierId=${selectedTier?.id}`);
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    if (type === 'logo') setLogoUrl(file_url);
    else setCoverUrl(file_url);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Please enter a name');
      return;
    }
    if (!selectedTier) {
      toast.error('Please select a tier');
      return;
    }
    createMutation.mutate(form);
  };

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const inputCls = 'mt-1.5 rounded-xl';

  return (
    <PageShell
      variant="compact"
      eyebrow="Auction house"
      title="Create your auction house"
      subtitle="Host branded live auction events with multiple lots. Pick a plan, add your branding and you are ready to schedule."
      breadcrumb={[{ label: 'Live auctions', href: createPageUrl('Auctions') }, { label: 'Create auction house' }]}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plan selection */}
        <FormSection icon={CreditCard} title="Choose your plan" hint="Billed monthly. You can change plans later.">
          {tiers.length === 0 ? (
            <EmptyState variant="plain" icon={CreditCard} title="No plans available" subtitle="Please contact the admin team to enable auction house plans." className="!py-8" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiers.map((tier) => {
                const on = selectedTier?.id === tier.id;
                return (
                  <button type="button" key={tier.id} onClick={() => setSelectedTier(tier)}
                    className={`relative text-left p-5 rounded-2xl border-2 transition-all ${on ? 'border-moss-600 bg-moss-50/50 shadow-lift' : 'border-border bg-white hover:border-moss-300'}`}>
                    {on && <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-moss-600 text-cream flex items-center justify-center"><Check className="w-3.5 h-3.5" /></span>}
                    {tier.featured_placement && <span className="absolute -top-3 left-4 chip chip-yolk gap-1"><Star className="w-3 h-3 fill-current" /> Popular</span>}
                    <h3 className="font-display text-xl text-ink mb-1">{tier.name}</h3>
                    <p className="font-display text-3xl font-bold text-moss-700 mb-4 tabular-nums">R{tier.monthly_price}<span className="text-sm font-normal text-ink/50">/month</span></p>
                    <ul className="space-y-2 text-sm text-ink/70">
                      <li className="flex items-center gap-2"><Gavel className="w-4 h-4 text-moss-600 flex-shrink-0" />{tier.max_live_auctions} live auction{tier.max_live_auctions > 1 ? 's' : ''} at a time</li>
                      <li className="flex items-center gap-2"><Package className="w-4 h-4 text-moss-600 flex-shrink-0" />Up to {tier.max_items_per_auction} lots per auction</li>
                      {tier.featured_placement && <li className="flex items-center gap-2"><Star className="w-4 h-4 text-yolk-500 flex-shrink-0" />Featured placement</li>}
                      {tier.priority_support && <li className="flex items-center gap-2"><Check className="w-4 h-4 text-moss-600 flex-shrink-0" />Priority support</li>}
                    </ul>
                  </button>
                );
              })}
            </div>
          )}
        </FormSection>

        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <FormSection icon={FileText} title="House details" hint="How bidders will find and contact you.">
              <div className="grid gap-4">
                <div>
                  <Label>Auction house name *</Label>
                  <Input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Premium Poultry Auctions" />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell buyers about your auction house..." rows={4} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Province</Label>
                    <Input className={inputCls} value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
                  </div>
                  <div>
                    <Label>City</Label>
                    <Input className={inputCls} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Contact number</Label>
                    <Input className={inputCls} value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
                  </div>
                  <div>
                    <Label>WhatsApp number</Label>
                    <Input className={inputCls} value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection icon={ScrollText} title="Default terms & conditions" hint="Pre-filled into every auction event you create.">
              <Textarea className="rounded-xl" value={form.terms_conditions} onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })} placeholder="Default terms for your auctions..." rows={4} />
            </FormSection>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <FormSection icon={ImagePlus} title="Branding" hint="Logo and cover shown on your public house card.">
              <div className="space-y-5">
                <div>
                  <Label>Logo</Label>
                  {logoUrl ? (
                    <div className="relative w-28 h-28 mt-2">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-2xl border border-border" />
                      <button type="button" onClick={() => setLogoUrl('')} aria-label="Remove logo" className="absolute -top-2 -right-2 w-6 h-6 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full flex items-center justify-center shadow-sm"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <label className="mt-2 w-28 h-28 rounded-2xl border-2 border-dashed border-border bg-cream flex flex-col items-center justify-center cursor-pointer hover:border-moss-400 hover:bg-moss-50/40 transition-colors">
                      {uploading ? <Loader2 className="w-6 h-6 animate-spin text-moss-600" /> : <Building2 className="w-6 h-6 text-ink/40" />}
                      <span className="text-xs text-ink/55 mt-1">Upload logo</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
                    </label>
                  )}
                </div>
                <div>
                  <Label>Cover image</Label>
                  {coverUrl ? (
                    <div className="relative w-full aspect-[3/1] mt-2">
                      <img src={coverUrl} alt="Cover" className="w-full h-full object-cover rounded-xl border border-border" />
                      <button type="button" onClick={() => setCoverUrl('')} aria-label="Remove cover" className="absolute -top-2 -right-2 w-6 h-6 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full flex items-center justify-center shadow-sm"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ) : (
                    <label className="mt-2 w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border bg-cream flex flex-col items-center justify-center cursor-pointer hover:border-moss-400 hover:bg-moss-50/40 transition-colors">
                      {uploading ? <Loader2 className="w-6 h-6 animate-spin text-moss-600" /> : <Upload className="w-6 h-6 text-ink/40" />}
                      <span className="text-xs text-ink/55 mt-1">Upload cover</span>
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </FormSection>

            <div className="card-premium p-5 space-y-3">
              {selectedTier && (
                <div className="rounded-xl bg-cream p-3 flex items-center justify-between text-sm">
                  <span className="text-ink/65">{selectedTier.name} plan</span>
                  <span className="font-display font-bold text-moss-700 tabular-nums">R{selectedTier.monthly_price}/mo</span>
                </div>
              )}
              <Button type="submit" disabled={createMutation.isPending} className="w-full btn-cta py-3 gap-2">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
                Create & proceed to payment
              </Button>
              <Link to={createPageUrl('Auctions')} className="block">
                <Button type="button" variant="outline" className="w-full rounded-full">Cancel</Button>
              </Link>
              <p className="text-xs text-ink/50 inline-flex items-start gap-1.5 pt-1"><Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> Your house is activated once the first month's payment is verified.</p>
            </div>
          </aside>
        </div>
      </form>
    </PageShell>
  );
}
