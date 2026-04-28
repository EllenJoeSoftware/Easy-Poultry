import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Upload, X, Loader2, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

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
    }
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
          <Link to={createPageUrl('MyAuctionHouse')} className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Auction House
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#E07A5F]/10 flex items-center justify-center">
            <Calendar className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Auction</h1>
            <p className="text-gray-600">{house.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Cover Image</h2>
            {coverUrl ? (
              <div className="relative w-full h-48">
                <img src={coverUrl} alt="Cover" className="w-full h-full object-cover rounded-lg" />
                <button type="button" onClick={() => setCoverUrl('')} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="w-full h-48 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-[#7A9D7A]">
                {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8 text-gray-400" />}
                <span className="text-sm text-gray-500 mt-2">Upload cover image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
            )}
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Auction Details</h2>
            <div className="grid gap-4">
              <div>
                <Label>Title *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g., Weekly Poultry Auction" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
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
              <div className="flex items-center gap-4">
                <Switch checked={form.auto_extend} onCheckedChange={(v) => setForm({ ...form, auto_extend: v })} />
                <Label>Auto-extend on last-minute bids</Label>
              </div>
              {form.auto_extend && (
                <div className="sm:w-1/3">
                  <Label>Extend by (minutes)</Label>
                  <Input type="number" value={form.auto_extend_minutes} onChange={(e) => setForm({ ...form, auto_extend_minutes: e.target.value })} min="1" max="10" />
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Terms & Conditions</h2>
            <Textarea value={form.terms_conditions || house.terms_conditions} onChange={(e) => setForm({ ...form, terms_conditions: e.target.value })} rows={4} />
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={createMutation.isPending} className="bg-[#E07A5F] hover:bg-[#D06A4F] px-8">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create & Add Items
            </Button>
            <Link to={createPageUrl('MyAuctionHouse')}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}