import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bird, Plus, Edit, Trash2, TrendingUp, Loader2, Archive, DollarSign, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import moment from 'moment';

export default function BatchManagement() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [showEggForm, setShowEggForm] = useState(false);
  const [showMortalityForm, setShowMortalityForm] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [eggFormData, setEggFormData] = useState({
    eggs_collected: '',
    production_date: moment().format('YYYY-MM-DD'),
    eggs_sold: 0,
    eggs_damaged: 0,
    revenue: 0,
    notes: ''
  });
  const [mortalityFormData, setMortalityFormData] = useState({
    count: '',
    date: moment().format('YYYY-MM-DD'),
    cause: '',
    notes: ''
  });
  const [formData, setFormData] = useState({
    batch_name: '',
    bird_type: 'broilers',
    breed: '',
    initial_quantity: '',
    current_quantity: '',
    available_quantity: '',
    date_acquired: moment().format('YYYY-MM-DD'),
    expected_maturity_weeks: '',
    daily_feed_per_bird_kg: '0.12',
    housing_location: '',
    notes: '',
    images: []
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [listingFormData, setListingFormData] = useState({
    quantity: '',
    price: '',
    price_type: 'per_item'
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

  const { data: batches = [], isLoading } = useQuery({
    queryKey: ['batches'],
    queryFn: () => api.entities.PoultryBatch.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  const { data: sellerTiers = [] } = useQuery({
    queryKey: ['seller-tiers-batches'],
    queryFn: () => api.entities.SellerTier.list(),
    enabled: !!user
  });

  const createBatchMutation = useMutation({
    mutationFn: async (data) => {
      const batchNumber = `B${Date.now()}`;
      const currentQuantity = parseInt(data.current_quantity || data.initial_quantity);
      const ageInWeeks = moment().diff(moment(data.date_acquired), 'weeks');
      const expectedHarvestDate = data.expected_maturity_weeks 
        ? moment(data.date_acquired).add(parseInt(data.expected_maturity_weeks), 'weeks').format('YYYY-MM-DD')
        : null;

      await api.entities.PoultryBatch.create({
        batch_number: batchNumber,
        batch_name: data.batch_name,
        bird_type: data.bird_type,
        breed: data.breed,
        initial_quantity: parseInt(data.initial_quantity),
        current_quantity: currentQuantity,
        available_quantity: currentQuantity,
        date_acquired: data.date_acquired,
        age_in_weeks: ageInWeeks,
        expected_maturity_weeks: data.expected_maturity_weeks ? parseInt(data.expected_maturity_weeks) : undefined,
        expected_harvest_date: expectedHarvestDate,
        daily_feed_per_bird_kg: parseFloat(data.daily_feed_per_bird_kg || 0.12),
        housing_location: data.housing_location,
        notes: data.notes,
        images: data.images || [],
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch created successfully');
      resetForm();
    }
  });

  const updateBatchMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.PoultryBatch.update(id, {
      batch_name: data.batch_name,
      bird_type: data.bird_type,
      breed: data.breed,
      initial_quantity: parseInt(data.initial_quantity),
      current_quantity: parseInt(data.current_quantity),
      available_quantity: parseInt(data.available_quantity),
      date_acquired: data.date_acquired,
      expected_maturity_weeks: data.expected_maturity_weeks ? parseInt(data.expected_maturity_weeks) : undefined,
      daily_feed_per_bird_kg: parseFloat(data.daily_feed_per_bird_kg || 0.12),
      housing_location: data.housing_location,
      notes: data.notes,
      images: data.images || []
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch updated');
      resetForm();
    }
  });

  const deleteBatchMutation = useMutation({
    mutationFn: (id) => api.entities.PoultryBatch.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch deleted');
    }
  });

  const archiveBatchMutation = useMutation({
    mutationFn: (id) => api.entities.PoultryBatch.update(id, { status: 'archived' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch archived');
    }
  });

  const unarchiveBatchMutation = useMutation({
    mutationFn: (id) => api.entities.PoultryBatch.update(id, { status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Batch unarchived');
    }
  });

  const recordEggsMutation = useMutation({
    mutationFn: async (data) => {
      const batch = batches.find(b => b.id === selectedBatch.id);
      const eggsCollected = parseInt(data.eggs_collected);
      const productionRate = (eggsCollected / batch.current_quantity) * 100;

      await api.entities.EggProduction.create({
        batch_id: batch.id,
        batch_name: batch.batch_name,
        production_date: data.production_date,
        eggs_collected: eggsCollected,
        birds_count: batch.current_quantity,
        production_rate: productionRate,
        eggs_sold: parseInt(data.eggs_sold) || 0,
        eggs_damaged: parseInt(data.eggs_damaged) || 0,
        revenue: parseFloat(data.revenue) || 0,
        notes: data.notes
      });

      await api.entities.PoultryBatch.update(batch.id, {
        total_eggs_produced: (batch.total_eggs_produced || 0) + eggsCollected,
        total_revenue: (batch.total_revenue || 0) + (parseFloat(data.revenue) || 0)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Egg production recorded');
      setShowEggForm(false);
      setSelectedBatch(null);
      setEggFormData({
        eggs_collected: '',
        production_date: moment().format('YYYY-MM-DD'),
        eggs_sold: 0,
        eggs_damaged: 0,
        revenue: 0,
        notes: ''
      });
    }
  });

  const recordMortalityMutation = useMutation({
    mutationFn: async (data) => {
      const batch = batches.find(b => b.id === selectedBatch.id);
      const count = parseInt(data.count);

      await api.entities.BatchExpense.create({
        batch_id: batch.id,
        batch_name: batch.batch_name,
        expense_type: 'mortality_loss',
        amount: 0,
        expense_date: data.date,
        description: `Mortality: ${count} birds. ${data.cause ? 'Cause: ' + data.cause : ''} ${data.notes || ''}`
      });

      await api.entities.PoultryBatch.update(batch.id, {
        mortality_count: (batch.mortality_count || 0) + count,
        current_quantity: Math.max(0, batch.current_quantity - count),
        available_quantity: Math.max(0, (batch.available_quantity || batch.current_quantity) - count)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Mortality recorded');
      setShowMortalityForm(false);
      setSelectedBatch(null);
      setMortalityFormData({
        count: '',
        date: moment().format('YYYY-MM-DD'),
        cause: '',
        notes: ''
      });
    }
  });

  const resetForm = () => {
    setFormData({
      batch_name: '',
      bird_type: 'broilers',
      breed: '',
      initial_quantity: '',
      current_quantity: '',
      available_quantity: '',
      date_acquired: moment().format('YYYY-MM-DD'),
      expected_maturity_weeks: '',
      daily_feed_per_bird_kg: '0.12',
      housing_location: '',
      notes: '',
      images: []
    });
    setEditingBatch(null);
    setShowForm(false);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
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
    
    setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...uploadedUrls] }));
    setUploadingImages(false);
    e.target.value = '';
  };

  const removeImage = (index) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      batch_name: batch.batch_name,
      bird_type: batch.bird_type,
      breed: batch.breed || '',
      initial_quantity: batch.initial_quantity,
      current_quantity: batch.current_quantity,
      available_quantity: batch.available_quantity,
      date_acquired: batch.date_acquired,
      expected_maturity_weeks: batch.expected_maturity_weeks || '',
      daily_feed_per_bird_kg: batch.daily_feed_per_bird_kg || '0.12',
      housing_location: batch.housing_location || '',
      notes: batch.notes || '',
      images: batch.images || []
    });
    setShowForm(true);
  };

  const createListingFromBatch = async (batch) => {
    setSelectedBatch(batch);
    setListingFormData({
      quantity: batch.available_quantity.toString(),
      price: '',
      price_type: 'per_item'
    });
    setShowListingForm(true);
  };

  const createListingMutation = useMutation({
    mutationFn: async (data) => {
      const batch = selectedBatch;
      const quantity = parseInt(data.quantity);

      await api.entities.Listing.create({
        title: `${batch.breed || batch.bird_type} - ${batch.batch_name}`,
        breed: batch.breed || '',
        category: batch.bird_type === 'layers' ? 'layers' : batch.bird_type === 'broilers' ? 'broilers' : 'chickens',
        age: `${batch.age_in_weeks} weeks`,
        gender: 'mixed',
        stock_quantity: quantity,
        price: parseFloat(data.price),
        price_type: data.price_type,
        description: `${batch.bird_type} from ${batch.batch_name}. ${batch.notes || ''}`,
        images: batch.images || [],
        province: user.province || '',
        city: user.city || '',
        status: 'active'
      });

      await api.entities.PoultryBatch.update(batch.id, {
        available_quantity: batch.available_quantity - quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['batches']);
      toast.success('Listing created successfully');
      setShowListingForm(false);
      setSelectedBatch(null);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.batch_name || !formData.initial_quantity) {
      toast.error('Please fill required fields');
      return;
    }

    // Check tier limits when creating new batch
    if (!editingBatch) {
      const userTier = sellerTiers.find(t => t.name === (user?.seller_tier || 'basic'));
      const maxBatches = userTier?.max_batches || 10;
      const activeBatchesCount = batches.filter(b => b.status === 'active').length;
      
      if (activeBatchesCount >= maxBatches) {
        toast.error(`You've reached your batch limit (${maxBatches}). Upgrade your tier for more.`);
        return;
      }
    }

    if (editingBatch) {
      updateBatchMutation.mutate({ id: editingBatch.id, data: formData });
    } else {
      createBatchMutation.mutate(formData);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const activeBatches = batches.filter(b => b.status === 'active');
  const archivedBatches = batches.filter(b => b.status === 'archived');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('FarmDashboard')} className="inline-flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Farm Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Batch Management</h1>
              <p className="text-white/90">
                Manage your poultry batches
                {(() => {
                  const userTier = sellerTiers.find(t => t.name === (user?.seller_tier || 'basic'));
                  const maxBatches = userTier?.max_batches || 10;
                  const activeBatchesCount = batches.filter(b => b.status === 'active').length;
                  return ` (${activeBatchesCount}/${maxBatches})`;
                })()}
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-white text-[#7A9D7A] hover:bg-gray-50">
              <Plus className="w-5 h-5 mr-2" />
              New Batch
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList className="bg-white border shadow-sm">
            <TabsTrigger value="active">Active ({activeBatches.length})</TabsTrigger>
            <TabsTrigger value="archived">Archived ({archivedBatches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeBatches.length === 0 ? (
              <Card className="p-12 text-center border-0 shadow-lg">
                <Bird className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No active batches</h3>
                <p className="text-gray-600 mb-6">Create your first poultry batch to start managing your farm</p>
                <Button onClick={() => setShowForm(true)} className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
                  <Plus className="w-5 h-5 mr-2" />
                  Create Batch
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeBatches.map((batch) => (
                  <Card key={batch.id} className="p-6 border-0 shadow-lg hover:shadow-xl transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{batch.batch_name}</h3>
                        <Badge className="capitalize">{batch.bird_type}</Badge>
                      </div>
                      <Bird className="w-8 h-8 text-[#7A9D7A]" />
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Birds:</span>
                        <span className="font-semibold">{batch.current_quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-semibold">{batch.available_quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Age:</span>
                        <span className="font-semibold">{batch.age_in_weeks} weeks</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Breed:</span>
                        <span className="font-semibold">{batch.breed}</span>
                      </div>
                      {batch.mortality_count > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Mortality:</span>
                          <span className="font-semibold">{batch.mortality_count}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <Link to={createPageUrl('BatchDetail') + `?id=${batch.id}`}>
                        <Button variant="outline" className="w-full" size="sm">
                          <TrendingUp className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      {batch.available_quantity > 0 && (
                        <Button variant="default" size="sm" className="w-full bg-[#E07A5F] hover:bg-[#D06A4F] mb-2" onClick={() => createListingFromBatch(batch)}>
                          Create Listing
                        </Button>
                      )}
                      <div className="flex gap-2">
                        {batch.bird_type === 'layers' && (
                          <Button variant="outline" size="sm" onClick={() => { setSelectedBatch(batch); setShowEggForm(true); }} className="flex-1">
                            🥚
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => { setSelectedBatch(batch); setShowMortalityForm(true); }} className="flex-1">
                          ➖
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(batch)} className="flex-1">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => archiveBatchMutation.mutate(batch.id)} className="flex-1">
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteBatchMutation.mutate(batch.id)} className="flex-1 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived">
            {archivedBatches.length === 0 ? (
              <Card className="p-12 text-center border-0 shadow-lg">
                <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No archived batches</h3>
                <p className="text-gray-600">Archived batches will appear here</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedBatches.map((batch) => (
                  <Card key={batch.id} className="p-6 border-0 shadow-lg opacity-75">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{batch.batch_name}</h3>
                        <Badge variant="secondary">Archived</Badge>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p>Initial: {batch.initial_quantity} birds</p>
                      <p>Sold: {batch.sold_count} birds</p>
                      <p>Revenue: R{batch.total_revenue || 0}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Link to={createPageUrl('BatchDetail') + `?id=${batch.id}`} className="flex-1">
                        <Button variant="outline" className="w-full" size="sm">View History</Button>
                      </Link>
                      <Button variant="outline" size="sm" onClick={() => unarchiveBatchMutation.mutate(batch.id)}>
                        Unarchive
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBatch ? 'Edit Batch' : 'Create New Batch'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Batch Name *</Label>
                <Input
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  placeholder="e.g., Batch A - Layers 2024"
                  required
                />
              </div>
              <div>
                <Label>Bird Type *</Label>
                <Select value={formData.bird_type} onValueChange={(value) => setFormData({ ...formData, bird_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="layers">Layers</SelectItem>
                    <SelectItem value="broilers">Broilers</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Breed</Label>
                <Input
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="e.g., Rhode Island Red"
                />
              </div>
              <div>
                <Label>Initial Quantity *</Label>
                <Input
                  type="number"
                  value={formData.initial_quantity}
                  onChange={(e) => setFormData({ ...formData, initial_quantity: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date Acquired *</Label>
                <Input
                  type="date"
                  value={formData.date_acquired}
                  onChange={(e) => setFormData({ ...formData, date_acquired: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Expected Maturity (weeks)</Label>
                <Input
                  type="number"
                  value={formData.expected_maturity_weeks}
                  onChange={(e) => setFormData({ ...formData, expected_maturity_weeks: e.target.value })}
                  placeholder="20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Daily Feed per Bird (kg)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.daily_feed_per_bird_kg}
                  onChange={(e) => setFormData({ ...formData, daily_feed_per_bird_kg: e.target.value })}
                  placeholder="0.12"
                />
              </div>
              <div>
                <Label>Housing Location</Label>
                <Input
                  value={formData.housing_location}
                  onChange={(e) => setFormData({ ...formData, housing_location: e.target.value })}
                  placeholder="e.g., Coop A"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information..."
                rows={3}
              />
            </div>

            <div>
              <Label>Batch Images (up to 10)</Label>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImages || (formData.images?.length >= 10)}
              />
              {uploadingImages && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
              {formData.images?.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {formData.images.map((url, index) => (
                    <div key={index} className="relative">
                      <img src={url} alt={`Batch ${index + 1}`} className="w-full h-20 object-cover rounded" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
                {editingBatch ? 'Update Batch' : 'Create Batch'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Egg Collection Dialog */}
      <Dialog open={showEggForm} onOpenChange={(open) => { if (!open) { setShowEggForm(false); setSelectedBatch(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collect Eggs - {selectedBatch?.batch_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordEggsMutation.mutate(eggFormData); }} className="space-y-4">
            <div>
              <Label>Eggs Collected *</Label>
              <Input
                type="number"
                value={eggFormData.eggs_collected}
                onChange={(e) => setEggFormData({ ...eggFormData, eggs_collected: e.target.value })}
                placeholder="Number of eggs"
                required
              />
            </div>

            <div>
              <Label>Collection Date</Label>
              <Input
                type="date"
                value={eggFormData.production_date}
                onChange={(e) => setEggFormData({ ...eggFormData, production_date: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Eggs Sold</Label>
                <Input
                  type="number"
                  value={eggFormData.eggs_sold}
                  onChange={(e) => setEggFormData({ ...eggFormData, eggs_sold: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Eggs Damaged</Label>
                <Input
                  type="number"
                  value={eggFormData.eggs_damaged}
                  onChange={(e) => setEggFormData({ ...eggFormData, eggs_damaged: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Revenue (R)</Label>
              <Input
                type="number"
                step="0.01"
                value={eggFormData.revenue}
                onChange={(e) => setEggFormData({ ...eggFormData, revenue: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={eggFormData.notes}
                onChange={(e) => setEggFormData({ ...eggFormData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setShowEggForm(false); setSelectedBatch(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">Record Collection</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mortality Dialog */}
      <Dialog open={showMortalityForm} onOpenChange={(open) => { if (!open) { setShowMortalityForm(false); setSelectedBatch(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Mortality - {selectedBatch?.batch_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordMortalityMutation.mutate(mortalityFormData); }} className="space-y-4">
            <div>
              <Label>Number of Birds *</Label>
              <Input
                type="number"
                value={mortalityFormData.count}
                onChange={(e) => setMortalityFormData({ ...mortalityFormData, count: e.target.value })}
                placeholder="Number of birds lost"
                required
              />
            </div>

            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={mortalityFormData.date}
                onChange={(e) => setMortalityFormData({ ...mortalityFormData, date: e.target.value })}
              />
            </div>

            <div>
              <Label>Cause (Optional)</Label>
              <Input
                value={mortalityFormData.cause}
                onChange={(e) => setMortalityFormData({ ...mortalityFormData, cause: e.target.value })}
                placeholder="e.g., Disease, predator, etc."
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={mortalityFormData.notes}
                onChange={(e) => setMortalityFormData({ ...mortalityFormData, notes: e.target.value })}
                placeholder="Additional details"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setShowMortalityForm(false); setSelectedBatch(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-red-600 hover:bg-red-700">Record Mortality</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Listing Dialog */}
      <Dialog open={showListingForm} onOpenChange={(open) => { if (!open) { setShowListingForm(false); setSelectedBatch(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Listing from {selectedBatch?.batch_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createListingMutation.mutate(listingFormData); }} className="space-y-4">
            <div>
              <Label>Quantity to Sell *</Label>
              <Input
                type="number"
                value={listingFormData.quantity}
                onChange={(e) => setListingFormData({ ...listingFormData, quantity: e.target.value })}
                max={selectedBatch?.available_quantity}
                placeholder={`Max: ${selectedBatch?.available_quantity}`}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Available: {selectedBatch?.available_quantity} birds</p>
            </div>

            <div>
              <Label>Price Type *</Label>
              <Select value={listingFormData.price_type} onValueChange={(value) => setListingFormData({ ...listingFormData, price_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_item">Per Bird</SelectItem>
                  <SelectItem value="batch">Entire Batch</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Price (R) *</Label>
              <Input
                type="number"
                step="0.01"
                value={listingFormData.price}
                onChange={(e) => setListingFormData({ ...listingFormData, price: e.target.value })}
                placeholder={listingFormData.price_type === 'per_item' ? 'Price per bird' : 'Total price'}
                required
              />
            </div>

            {selectedBatch?.images?.length > 0 && (
              <div>
                <Label>Images ({selectedBatch.images.length})</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {selectedBatch.images.slice(0, 4).map((url, index) => (
                    <img key={index} src={url} alt={`Preview ${index + 1}`} className="w-full h-16 object-cover rounded" />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">These images will be used in the listing</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setShowListingForm(false); setSelectedBatch(null); }}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#E07A5F] hover:bg-[#D06A4F]">Create Listing</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}