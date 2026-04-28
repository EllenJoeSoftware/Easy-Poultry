import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X, Loader2, Building2, Check, Gavel, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

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
    }
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to={createPageUrl('Auctions')} className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#E07A5F]/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Auction House</h1>
            <p className="text-gray-600">Set up your auction house to host unlimited auctions</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tier Selection */}
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Select Your Plan</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  onClick={() => setSelectedTier(tier)}
                  className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTier?.id === tier.id 
                      ? 'border-[#E07A5F] bg-[#E07A5F]/5' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {selectedTier?.id === tier.id && (
                    <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#E07A5F] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {tier.featured_placement && (
                    <div className="absolute -top-3 left-4 bg-[#E07A5F] text-white text-xs font-bold px-2 py-1 rounded">
                      POPULAR
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                  <p className="text-3xl font-bold text-[#E07A5F] mb-4">
                    R{tier.monthly_price}<span className="text-sm font-normal text-gray-500">/month</span>
                  </p>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <Gavel className="w-4 h-4 text-[#7A9D7A]" />
                      {tier.max_live_auctions} live auction{tier.max_live_auctions > 1 ? 's' : ''} at a time
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-[#7A9D7A]" />
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
                        <Check className="w-4 h-4 text-[#7A9D7A]" />
                        Priority support
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
            {tiers.length === 0 && (
              <p className="text-gray-500 text-center py-8">No tiers available. Please contact admin.</p>
            )}
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Branding</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <Label>Logo</Label>
                {logoUrl ? (
                  <div className="relative w-32 h-32 mt-2">
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                    <button type="button" onClick={() => setLogoUrl('')} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-2 w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#7A9D7A]">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
                    <span className="text-xs text-gray-500 mt-1">Upload</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
                  </label>
                )}
              </div>
              <div>
                <Label>Cover Image</Label>
                {coverUrl ? (
                  <div className="relative w-full h-32 mt-2">
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover rounded-lg" />
                    <button type="button" onClick={() => setCoverUrl('')} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="mt-2 w-full h-32 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#7A9D7A]">
                    {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
                    <span className="text-xs text-gray-500 mt-1">Upload cover</span>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} className="hidden" />
                  </label>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Details</h2>
            <div className="grid gap-4">
              <div>
                <Label>Auction House Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Premium Poultry Auctions" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tell buyers about your auction house..." rows={4} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Province</Label>
                  <Input value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Number</Label>
                  <Input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} />
                </div>
                <div>
                  <Label>WhatsApp Number</Label>
                  <Input value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Default Terms & Conditions</h2>
            <Textarea value={form.terms_conditions} onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })} placeholder="Default terms for your auctions..." rows={4} />
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={createMutation.isPending} className="bg-[#E07A5F] hover:bg-[#D06A4F] px-8">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create & Proceed to Payment
            </Button>
            <Link to={createPageUrl('Auctions')}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}