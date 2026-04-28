import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, ArrowLeft, Upload, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function SubmitEntry() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
    }
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const hasVotes = existingEntry && existingEntry.vote_count > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('CompetitionDetail') + `?id=${competitionId}`} className="inline-flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Competition
          </Link>
          <div className="flex items-center gap-3">
            <Trophy className="w-10 h-10" />
            <div>
              <h1 className="text-3xl font-bold">{hasVotes ? 'Add More Photos' : (editEntryId ? 'Edit Entry' : 'Submit Entry')}</h1>
              <p className="text-white/90">{competition.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {hasVotes && (
          <Card className="p-4 mb-6 border-blue-200 bg-blue-50">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Your entry has received votes, so you can only add more photos. Other details cannot be changed.
            </p>
          </Card>
        )}
        
        <Card className="p-6 border-0 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label>Chicken Name *</Label>
              <Input
                value={formData.chicken_name}
                onChange={(e) => setFormData({ ...formData, chicken_name: e.target.value })}
                placeholder="e.g., Golden Feather"
                required
                disabled={hasVotes}
              />
            </div>

            <div>
              <Label>Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Tell us about your chicken..."
                rows={4}
                required
                disabled={hasVotes}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Age</Label>
                <Input
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="e.g., 8 months"
                  disabled={hasVotes}
                />
              </div>
              <div>
                <Label>Breed</Label>
                <Input
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="e.g., Rhode Island Red"
                  disabled={hasVotes}
                />
              </div>
            </div>

            <div>
              <Label>Images * (Max 5)</Label>
              <div className="mt-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImages || formData.images.length >= 5}
                />
                {uploadingImages && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              </div>

              {formData.images.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-4">
                  {formData.images.map((url, index) => {
                    const isExistingImage = existingEntry && existingEntry.images && index < existingEntry.images.length;
                    return (
                      <div key={index} className="relative">
                        <img src={url} alt={`Entry ${index + 1}`} className="w-full h-24 object-cover rounded" />
                        {!isExistingImage && (
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Link to={createPageUrl('CompetitionDetail') + `?id=${competitionId}`}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-[#7A9D7A] hover:bg-[#6A8D6A]" disabled={submitEntryMutation.isPending}>
                {submitEntryMutation.isPending ? (hasVotes ? 'Adding Photos...' : (editEntryId ? 'Updating...' : 'Submitting...')) : (hasVotes ? 'Add Photos' : (editEntryId ? 'Update Entry' : 'Submit Entry'))}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}