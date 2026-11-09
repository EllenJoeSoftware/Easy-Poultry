import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Upload, X, Loader2, Calendar, ImagePlus, FileText, ScrollText, Building2, Info, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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

export default function CreateAuctionEvent() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [coverUrl, setCoverUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    auto_extend: true,
    auto_extend_minutes: 2,
    terms_conditions: ''
  });

  const urlParams = new URLSearchParams(window.location.search);
  const houseId = urlParams.get('houseId');

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

  const { data: house } = useQuery({
    queryKey: ['auction-house', houseId],
    queryFn: async () => {
      const houses = await api.entities.AuctionHouse.filter({ id: houseId });
      return houses[0];
    },
    enabled: !!houseId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const event = await api.entities.AuctionEvent.create({
        ...data,
        auction_house_id: houseId,
        cover_image_url: coverUrl,
        status: 'draft'
      });
      return event;
    },
    onSuccess: (event) => {
      toast.success('Auction created! Now add items.');
      navigate(createPageUrl('ManageAuctionEvent') + `?eventId=${event.id}`);
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    setCoverUrl(file_url);
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title || !form.start_time || !form.end_time) {
      toast.error('Please fill required fields');
      return;
    }
    createMutation.mutate({
      ...form,
      auto_extend_minutes: parseInt(form.auto_extend_minutes)
    });
  };

  if (!user || !house) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const inputCls = 'mt-1.5 rounded-xl';

  return (
    <PageShell
      variant="compact"
      eyebrow="Auction house"
      title="New auction event"
      subtitle={<span className="inline-flex items-center gap-1.5"><Building2 className="w-4 h-4 text-moss-700" />{house.name} — set the schedule now, add lots on the next step.</span>}
      breadcrumb={[{ label: 'Live auctions', href: createPageUrl('Auctions') }, { label: 'My auction house', href: createPageUrl('MyAuctionHouse') }, { label: 'New auction' }]}
    >
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <FormSection icon={ImagePlus} title="Cover image" hint="Shown on the auctions page and the event header.">
            {coverUrl ? (
              <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden border border-border">
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setCoverUrl('')} aria-label="Remove cover"
                  className="absolute top-2 right-2 w-8 h-8 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full flex items-center justify-center shadow-sm">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-full aspect-[3/1] rounded-xl border-2 border-dashed border-border bg-cream flex flex-col items-center justify-center cursor-pointer hover:border-moss-400 hover:bg-moss-50/40 transition-colors">
                {uploading ? <Loader2 className="w-8 h-8 animate-spin text-moss-600" /> : <Upload className="w-8 h-8 text-ink/40" />}
                <span className="text-sm text-ink/55 mt-2">Upload cover image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </FormSection>

          <FormSection icon={FileText} title="Event details" hint="Give bidders a clear idea of what is on offer.">
            <div className="grid gap-4">
              <div>
                <Label>Title *</Label>
                <Input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Weekly Poultry Auction" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
            </div>
          </FormSection>

          <FormSection icon={ScrollText} title="Terms & conditions" hint="Pre-filled from your auction house defaults.">
            <Textarea className="rounded-xl" value={form.terms_conditions || house.terms_conditions} onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })} rows={4} />
          </FormSection>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <FormSection icon={Calendar} title="Schedule" hint="The event goes live automatically at the start time.">
            <div className="grid gap-4">
              <div>
                <Label>Start time *</Label>
                <Input className={inputCls} type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div>
                <Label>End time *</Label>
                <Input className={inputCls} type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
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
            <Button type="submit" disabled={createMutation.isPending} className="w-full btn-cta py-3 gap-2">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create & add lots <ArrowRight className="w-4 h-4" />
            </Button>
            <Link to={createPageUrl('MyAuctionHouse')} className="block">
              <Button type="button" variant="outline" className="w-full rounded-full">Cancel</Button>
            </Link>
            <p className="text-xs text-ink/50 inline-flex items-start gap-1.5 pt-1"><Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> The event is saved as a draft until you schedule it from the manage page.</p>
          </div>
        </aside>
      </form>
    </PageShell>
  );
}
