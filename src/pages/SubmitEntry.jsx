import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Upload, Loader2, X, ImagePlus, Lock, Info, Calendar, Star } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPageUrl } from '../utils';

export default function SubmitEntry() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const urlParams = new URLSearchParams(window.location.search);
  const competitionId = urlParams.get('competition');
  const editEntryId = urlParams.get('edit');

  const [formData, setFormData] = useState({
    chicken_name: '',
    description: '',
    age: '',
    breed: '',
    images: []
  });
  const [uploadingImages, setUploadingImages] = useState(false);

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

  const { data: competition } = useQuery({
    queryKey: ['competition', competitionId],
    queryFn: async () => {
      const comps = await api.entities.Competition.filter({ id: competitionId });
      return comps[0] || null;
    },
    enabled: !!competitionId
  });

  const { data: existingEntry } = useQuery({
    queryKey: ['competition-entry', editEntryId],
    queryFn: async () => {
      const entries = await api.entities.CompetitionEntry.filter({ id: editEntryId });
      return entries[0] || null;
    },
    enabled: !!editEntryId
  });

  useEffect(() => {
    if (existingEntry) {
      setFormData({
        chicken_name: existingEntry.chicken_name || '',
        description: existingEntry.description || '',
        age: existingEntry.age || '',
        breed: existingEntry.breed || '',
        images: existingEntry.images || []
      });
    }
  }, [existingEntry]);

  const submitEntryMutation = useMutation({
    mutationFn: async (data) => {
      if (editEntryId) {
        await api.entities.CompetitionEntry.update(editEntryId, {
          chicken_name: data.chicken_name,
          description: data.description,
          age: data.age,
          breed: data.breed,
          images: data.images
        });
      } else {
        await api.entities.CompetitionEntry.create({
          competition_id: competitionId,
          competition_name: competition.name,
          chicken_name: data.chicken_name,
          description: data.description,
          age: data.age,
          breed: data.breed,
          images: data.images,
          owner_name: user.full_name,
          owner_email: user.email
        });

        await api.entities.Competition.update(competitionId, {
          total_entries: (competition.total_entries || 0) + 1
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['competition-entries']);
      queryClient.invalidateQueries(['competition']);
      toast.success(editEntryId ? 'Entry updated successfully!' : 'Entry submitted successfully!');
      navigate(createPageUrl('CompetitionDetail') + `?id=${competitionId}`);
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (formData.images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    setUploadingImages(true);
    const uploadedUrls = [];

    for (const file of files) {
      try {
        const { file_url } = await api.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      } catch (error) {
        toast.error('Failed to upload image');
      }
    }

    setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
    setUploadingImages(false);
    e.target.value = '';
  };

  const removeImage = (index) => {
    // Check if this is an existing image (from existingEntry) that cannot be removed
    if (existingEntry && existingEntry.images && index < existingEntry.images.length) {
      toast.error('Cannot remove existing images during voting period');
      return;
    }

    const newImages = [...formData.images];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.chicken_name || !formData.description) {
      toast.error('Please fill in required fields');
      return;
    }
    if (formData.images.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }
    submitEntryMutation.mutate(formData);
  };

  if (!user || !competition) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  const hasVotes = existingEntry && existingEntry.vote_count > 0;
  const heading = hasVotes ? 'Add more photos' : (editEntryId ? 'Edit your entry' : 'Submit your entry');
  const submitLabel = submitEntryMutation.isPending
    ? (hasVotes ? 'Adding photos…' : (editEntryId ? 'Updating…' : 'Submitting…'))
    : (hasVotes ? 'Add photos' : (editEntryId ? 'Update entry' : 'Submit entry'));
  const backUrl = createPageUrl('CompetitionDetail') + `?id=${competitionId}`;
  const inputCls = 'mt-1.5 bg-cream border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300 disabled:opacity-60';
  const slotsLeft = 5 - formData.images.length;

  return (
    <PageShell
      variant="compact"
      eyebrow="Competitions"
      title={heading}
      subtitle={<>for <span className="font-medium text-ink">{competition.name}</span>. Great photos win — show plumage, posture and comb clearly.</>}
      breadcrumb={[{ label: 'Competitions', href: createPageUrl('Competitions') }, { label: competition.name, href: backUrl }, { label: editEntryId ? 'Edit entry' : 'Enter' }]}
    >
      <div className="grid lg:grid-cols-[1fr_300px] gap-8 items-start">
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-premium p-6 sm:p-8 space-y-7 min-w-0">
          {hasVotes && (
            <div className="rounded-xl bg-yolk-50 border border-yolk-200 p-4 flex gap-3 text-sm">
              <Lock className="w-4 h-4 text-yolk-600 flex-shrink-0 mt-0.5" />
              <p className="text-ink/75"><strong className="text-ink">Voting has started.</strong> Your entry has received votes, so you can only add more photos. Other details are locked.</p>
            </div>
          )}

          {/* Bird details */}
          <section>
            <p className="eyebrow mb-1">Step 1</p>
            <h3 className="font-display text-xl text-ink mb-4">About your bird</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="chicken_name">Chicken name <span className="text-terracotta-500">*</span></Label>
                <Input id="chicken_name" value={formData.chicken_name}
                  onChange={(e) => setFormData({ ...formData, chicken_name: e.target.value })}
                  placeholder="e.g., Golden Feather" required disabled={hasVotes} className={inputCls} />
              </div>
              <div>
                <Label htmlFor="description">Description <span className="text-terracotta-500">*</span></Label>
                <Textarea id="description" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us about your chicken — lineage, temperament, what makes it stand out…" rows={4} required disabled={hasVotes} className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g., 8 months" disabled={hasVotes} className={inputCls} />
                </div>
                <div>
                  <Label htmlFor="breed">Breed</Label>
                  <Input id="breed" value={formData.breed} onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="e.g., Rhode Island Red" disabled={hasVotes} className={inputCls} />
                </div>
              </div>
            </div>
          </section>

          {/* Photos */}
          <section className="pt-6 border-t border-border">
            <div className="flex items-end justify-between mb-4 gap-3">
              <div>
                <p className="eyebrow mb-1">Step 2</p>
                <h3 className="font-display text-xl text-ink">Photos <span className="text-terracotta-500">*</span></h3>
              </div>
              <span className="text-xs text-ink/55">{formData.images.length}/5 uploaded</span>
            </div>

            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload}
              disabled={uploadingImages || formData.images.length >= 5} className="sr-only" />

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {formData.images.map((url, index) => {
                const isExistingImage = existingEntry && existingEntry.images && index < existingEntry.images.length;
                return (
                  <motion.div key={url + index} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-cream-deep group">
                    <img src={url} alt={`Entry ${index + 1}`} className="w-full h-full object-cover" />
                    {index === 0 && <span className="absolute bottom-2 left-2 chip bg-ink/70 text-cream border-0 !py-0.5 text-[10px]"><Star className="w-3 h-3" />Cover</span>}
                    {isExistingImage ? (
                      <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/90 text-ink/60 flex items-center justify-center" title="Locked during voting"><Lock className="w-3 h-3" /></span>
                    ) : (
                      <button type="button" onClick={() => removeImage(index)} aria-label="Remove image"
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-terracotta-500 hover:bg-terracotta-600 text-white flex items-center justify-center shadow-soft">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </motion.div>
                );
              })}

              {slotsLeft > 0 && (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImages}
                  className={`aspect-square rounded-xl border-2 border-dashed border-border bg-cream hover:bg-moss-50 hover:border-moss-300 transition-colors flex flex-col items-center justify-center gap-1.5 text-ink/55 hover:text-moss-700 disabled:opacity-60 ${formData.images.length === 0 ? 'col-span-2 sm:col-span-3 lg:col-span-5 aspect-auto py-10' : ''}`}>
                  {uploadingImages ? <Loader2 className="w-6 h-6 animate-spin text-moss-600" /> : formData.images.length === 0 ? <Upload className="w-8 h-8" strokeWidth={1.5} /> : <ImagePlus className="w-6 h-6" strokeWidth={1.5} />}
                  <span className="text-sm font-medium">{uploadingImages ? 'Uploading…' : formData.images.length === 0 ? 'Upload photos' : 'Add more'}</span>
                  {formData.images.length === 0 && <span className="text-xs text-ink/45">JPG or PNG · up to 5 images · first photo becomes the cover</span>}
                </button>
              )}
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-border">
            <Link to={backUrl}>
              <Button type="button" variant="outline" className="rounded-full w-full sm:w-auto">Cancel</Button>
            </Link>
            <Button type="submit" className="btn-cta px-6 py-2.5" disabled={submitEntryMutation.isPending || uploadingImages}>
              {submitEntryMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{submitLabel}
            </Button>
          </div>
        </motion.form>

        {/* Side rail */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card-premium overflow-hidden">
            <div className="aspect-[16/9] relative bg-moss-gradient">
              {competition.banner_image_url
                ? <img src={competition.banner_image_url} alt="" className="w-full h-full object-cover" />
                : <div className="absolute inset-0 grain opacity-50 flex items-center justify-center"><Trophy className="w-10 h-10 text-cream/30" /></div>}
            </div>
            <div className="p-5">
              <p className="eyebrow mb-1">Entering</p>
              <h3 className="font-display text-lg text-ink leading-snug">{competition.name}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-ink/65">
                <li className="inline-flex items-center gap-2"><Calendar className="w-4 h-4 text-ink/40" />Closes {moment(competition.end_date).format('D MMM YYYY')}</li>
                <li className="inline-flex items-center gap-2"><Star className="w-4 h-4 text-ink/40" />Scored 1–{competition.max_rating}, by {competition.scoring_method === 'total' ? 'total points' : 'average rating'}</li>
              </ul>
            </div>
          </div>
          <div className="card-premium p-5 flex gap-3">
            <Info className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-ink/65">Once your entry receives its first vote, the name, description and existing photos are locked to keep voting fair. You can always add more photos.</p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
