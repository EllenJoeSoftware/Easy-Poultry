import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Upload, X, Loader2, Gavel } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

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
    }
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
            <Gavel className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Auction</h1>
            <p className="text-gray-600">Set up your poultry auction house</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images */}
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Photos</h2>
            <div className="grid grid-cols-5 gap-3">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#7A9D7A]">
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6 text-gray-400" />}
                  <span className="text-xs text-gray-500 mt-1">Upload</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                </label>
              )}
            </div>
          </Card>

          {/* Basic Info */}
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Auction Details</h2>
            <div className="grid gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g., Premium Rhode Island Red Roosters"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed description of what's being auctioned..."
                  rows={4}
                />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Poultry Type *</Label>
                  <Select value={form.poultry_type} onValueChange={(v) => setForm({ ...form, poultry_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {poultryTypes.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Breed</Label>
                  <Input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} placeholder="e.g., Rhode Island Red" />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="e.g., 6 months" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
                </div>
                <div>
                  <Label>Health Details</Label>
                  <Input value={form.health_details} onChange={(e) => setForm({ ...form, health_details: e.target.value })} placeholder="Vaccinations, health status..." />
                </div>
              </div>
              <div>
                <Label>Video URL (optional)</Label>
                <Input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="YouTube or direct video link" />
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Location</h2>
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
          </Card>

          {/* Auction Settings */}
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Auction Settings</h2>
            <div className="grid gap-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Start Time *</Label>
                  <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
                </div>
                <div>
                  <Label>End Time *</Label>
                  <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label>Starting Bid (R) *</Label>
                  <Input type="number" value={form.starting_bid} onChange={(e) => setForm({ ...form, starting_bid: e.target.value })} min="1" />
                </div>
                <div>
                  <Label>Reserve Price (R)</Label>
                  <Input type="number" value={form.reserve_price} onChange={(e) => setForm({ ...form, reserve_price: e.target.value })} placeholder="Optional minimum" />
                </div>
                <div>
                  <Label>Min Increment (R)</Label>
                  <Input type="number" value={form.min_increment} onChange={(e) => setForm({ ...form, min_increment: e.target.value })} min="1" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label>Max Bidders (optional)</Label>
                  <Input type="number" value={form.max_bidders} onChange={(e) => setForm({ ...form, max_bidders: e.target.value })} placeholder="Leave empty for unlimited" />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <Switch checked={form.auto_extend} onCheckedChange={(v) => setForm({ ...form, auto_extend: v })} />
                  <Label>Auto-extend on last-minute bids</Label>
                </div>
              </div>
              {form.auto_extend && (
                <div className="sm:w-1/3">
                  <Label>Extend by (minutes)</Label>
                  <Input type="number" value={form.auto_extend_minutes} onChange={(e) => setForm({ ...form, auto_extend_minutes: e.target.value })} min="1" max="10" />
                </div>
              )}
            </div>
          </Card>

          {/* Terms */}
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
            <Textarea
              value={form.terms_conditions}
              onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })}
              placeholder="Payment terms, collection details, buyer responsibilities..."
              rows={4}
            />
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={createAuctionMutation.isPending} className="bg-[#E07A5F] hover:bg-[#D06A4F] px-8">
              {createAuctionMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
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