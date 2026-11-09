import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, Gavel, ImagePlus, FileText, MapPin, Settings2, ScrollText, Info } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
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

export default function CreateAuction() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    poultry_type: 'chickens',
    breed: '',
    age: '',
    quantity: 1,
    health_details: '',
    video_url: '',
    province: '',
    city: '',
    start_time: '',
    end_time: '',
    starting_bid: '',
    reserve_price: '',
    min_increment: 10,
    max_bidders: '',
    auto_extend: true,
    auto_extend_minutes: 2,
    terms_conditions: ''
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

  const createAuctionMutation = useMutation({
    mutationFn: async (data) => {
      const auction = await api.entities.Auction.create({
        ...data,
        images,
        status: 'pending_payment'
      });
      return auction;
    },
    onSuccess: (auction) => {
      toast.success('Auction created! Please complete payment to activate.');
      navigate(createPageUrl('AuctionPayment') + `?auctionId=${auction.id}`);
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }
    setUploading(true);
    for (const file of files) {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setImages(prev => [...prev, file_url]);
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.starting_bid || !form.start_time || !form.end_time) {
      toast.error('Please fill in all required fields');
      return;
    }
    createAuctionMutation.mutate({
      ...form,
      starting_bid: parseFloat(form.starting_bid),
      reserve_price: form.reserve_price ? parseFloat(form.reserve_price) : null,
      min_increment: parseFloat(form.min_increment),
      max_bidders: form.max_bidders ? parseInt(form.max_bidders) : null,
      quantity: parseInt(form.quantity)
    });
  };

  const poultryTypes = [
    { value: 'chickens', label: 'Chickens' },
    { value: 'ducks', label: 'Ducks' },
    { value: 'geese', label: 'Geese' },
    { value: 'turkeys', label: 'Turkeys' },
    { value: 'quail', label: 'Quail' },
    { value: 'guinea_fowl', label: 'Guinea Fowl' },
    { value: 'peafowl', label: 'Peafowl' },
    { value: 'pigeons', label: 'Pigeons' },
    { value: 'other', label: 'Other' }
  ];

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const inputCls = 'mt-1.5 rounded-xl';

  return (
    <PageShell
      variant="compact"
      eyebrow="Sell"
      title="Create auction"
      subtitle="List a single lot for timed bidding. A small verification fee applies before it goes live."
      breadcrumb={[{ label: 'Live auctions', href: createPageUrl('Auctions') }, { label: 'My auctions', href: createPageUrl('MyAuctions') }, { label: 'Create auction' }]}
    >
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Photos */}
          <FormSection icon={ImagePlus} title="Photos" hint="Up to 10 images. The first one is used as the cover.">
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-cream-deep border border-border group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <span className="absolute bottom-1.5 left-1.5 chip chip-yolk !py-0 !px-2 text-[10px]">Cover</span>}
                  <button type="button" onClick={() => removeImage(i)} aria-label="Remove image"
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full flex items-center justify-center shadow-sm">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-border bg-cream flex flex-col items-center justify-center cursor-pointer hover:border-moss-400 hover:bg-moss-50/40 transition-colors">
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin text-moss-600" /> : <Upload className="w-6 h-6 text-ink/40" />}
                  <span className="text-xs text-ink/55 mt-1">Upload</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </FormSection>

          {/* Details */}
          <FormSection icon={FileText} title="Auction details" hint="What you are selling and why bidders should care.">
            <div className="grid gap-4">
              <div>
                <Label>Title *</Label>
                <Input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Premium Rhode Island Red Roosters" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detailed description of what's being auctioned..." rows={4} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Poultry type *</Label>
                  <Select value={form.poultry_type} onValueChange={(v) => setForm({ ...form, poultry_type: v })}>
                    <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {poultryTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Breed</Label>
                  <Input className={inputCls} value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="e.g., Rhode Island Red" />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input className={inputCls} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g., 6 months" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input className={inputCls} type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
                </div>
                <div>
                  <Label>Health details</Label>
                  <Input className={inputCls} value={form.health_details} onChange={(e) => setForm({ ...form, health_details: e.target.value })} placeholder="Vaccinations, health status..." />
                </div>
              </div>
              <div>
                <Label>Video URL (optional)</Label>
                <Input className={inputCls} value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="YouTube or direct video link" />
              </div>
            </div>
          </FormSection>

          {/* Location */}
          <FormSection icon={MapPin} title="Location" hint="Where the birds can be collected.">
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
          </FormSection>

          {/* Terms */}
          <FormSection icon={ScrollText} title="Terms & conditions" hint="Payment terms, collection details, buyer responsibilities.">
            <Textarea className="rounded-xl" value={form.terms_conditions} onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })}
              placeholder="Payment terms, collection details, buyer responsibilities..." rows={4} />
          </FormSection>
        </div>

        {/* Right rail — settings + submit */}
        <aside className="space-y-6 lg:sticky lg:top-24">
          <FormSection icon={Settings2} title="Auction settings" hint="Timing and pricing rules.">
            <div className="grid gap-4">
              <div>
                <Label>Start time *</Label>
                <Input className={inputCls} type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label>End time *</Label>
                <Input className={inputCls} type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
              <div className="pt-2 border-t border-border grid grid-cols-2 gap-4">
                <div>
                  <Label>Starting bid (R) *</Label>
                  <Input className={inputCls} type="number" value={form.starting_bid} onChange={(e) => setForm({ ...form, starting_bid: e.target.value })} min="1" />
                </div>
                <div>
                  <Label>Min increment (R)</Label>
                  <Input className={inputCls} type="number" value={form.min_increment} onChange={(e) => setForm({ ...form, min_increment: e.target.value })} min="1" />
                </div>
              </div>
              <div>
                <Label>Reserve price (R)</Label>
                <Input className={inputCls} type="number" value={form.reserve_price} onChange={(e) => setForm({ ...form, reserve_price: e.target.value })} placeholder="Optional minimum" />
              </div>
              <div>
                <Label>Max bidders (optional)</Label>
                <Input className={inputCls} type="number" value={form.max_bidders} onChange={(e) => setForm({ ...form, max_bidders: e.target.value })} placeholder="Leave empty for unlimited" />
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between gap-3">
                  <Label className="leading-snug">Auto-extend on last-minute bids</Label>
                  <Switch checked={form.auto_extend} onCheckedChange={(v) => setForm({ ...form, auto_extend: v })} />
                </div>
                {form.auto_extend && (
                  <div className="mt-3">
                    <Label>Extend by (minutes)</Label>
                    <Input className={inputCls} type="number" value={form.auto_extend_minutes} onChange={(e) => setForm({ ...form, auto_extend_minutes: e.target.value })} min="1" max="10" />
                  </div>
                )}
              </div>
            </div>
          </FormSection>

          <div className="card-premium p-5 space-y-3">
            <Button type="submit" disabled={createAuctionMutation.isPending} className="w-full btn-cta py-3 gap-2">
              {createAuctionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gavel className="w-4 h-4" />}
              Create & proceed to payment
            </Button>
            <Link to={createPageUrl('Auctions')} className="block">
              <Button type="button" variant="outline" className="w-full rounded-full">Cancel</Button>
            </Link>
            <p className="text-xs text-ink/50 inline-flex items-start gap-1.5 pt-1"><Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> Your auction is saved as pending until the verification fee is confirmed.</p>
          </div>
        </aside>
      </form>
    </PageShell>
  );
}
