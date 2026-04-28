import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function CreateListing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    breed: '',
    category: '',
    age: '',
    gender: 'n/a',
    stock_quantity: 1,
    price: '',
    price_type: 'per_item',
    currency: 'USD',
    description: '',
    images: []
  });

  const { data: sellerTiers = [] } = useQuery({
    queryKey: ['seller-tiers'],
    queryFn: () => api.entities.SellerTier.list()
  });

  const { data: adminSettings } = useQuery({
    queryKey: ['admin-settings-create-listing'],
    queryFn: async () => {
      const settings = await api.entities.AdminSettings.filter({ setting_key: 'main' });
      return settings[0] || null;
    }
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await api.auth.me();
        setUser(currentUser);
        
        if (!currentUser.user_type || currentUser.user_type === 'buyer') {
          toast.error('You need to be a seller to create listings');
          navigate(createPageUrl('ProfileSettings'));
          return;
        }
        
        // Only check seller_activated if admin approval is required
        const requireApproval = adminSettings?.require_account_approval === true;
        if (requireApproval && !currentUser.seller_activated) {
          toast.error('Your seller account needs to be activated by admin');
          navigate(createPageUrl('Dashboard'));
          return;
        }

        const myListings = await api.entities.Listing.filter({ created_by: currentUser.email });
        const activeListing = myListings.filter(l => l.status === 'active');
        
        const userTier = sellerTiers.find(t => t.name === (currentUser.seller_tier || 'basic')) || { max_listings: 4 };
        
        if (!currentUser.seller_verified && activeListing.length >= 4) {
          toast.error('Unverified sellers are limited to 4 listings. Get verified for unlimited listings.');
          navigate(createPageUrl('Dashboard'));
          return;
        }
        
        if (activeListing.length >= userTier.max_listings) {
          toast.error(`You've reached your listing limit (${userTier.max_listings}). Upgrade your tier for more.`);
          navigate(createPageUrl('Dashboard'));
          return;
        }
      } catch (error) {
        api.auth.redirectToLogin(window.location.href);
      }
    };
    loadUser();
  }, [navigate, sellerTiers, adminSettings]);

  const createListingMutation = useMutation({
    mutationFn: (data) => api.entities.Listing.create(data),
    onSuccess: () => {
      toast.success('Listing created successfully!');
      queryClient.invalidateQueries(['listings']);
      navigate(createPageUrl('Dashboard'));
    },
    onError: () => {
      toast.error('Failed to create listing');
    }
  });

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const userTier = sellerTiers.find(t => t.name === (user?.seller_tier || 'basic')) || { max_images_per_listing: 10 };
    const maxImages = user?.seller_verified ? userTier.max_images_per_listing : 10;
    
    if (formData.images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploadingImages(true);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const { file_url } = await api.integrations.Core.UploadFile({ file });
        uploadedUrls.push(file_url);
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      toast.success('Images uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload images');
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    createListingMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: parseInt(formData.stock_quantity),
      currency: 'ZAR',
      province: user?.province,
      city: user?.city,
      exact_location: user?.exact_location,
      status: 'active',
      view_count: 0,
      inquiry_count: 0
    });
  };

  const categories = [
    { value: 'chickens', label: 'Chickens' },
    { value: 'ducks', label: 'Ducks' },
    { value: 'geese', label: 'Geese' },
    { value: 'turkeys', label: 'Turkeys' },
    { value: 'quail', label: 'Quail' },
    { value: 'guinea_fowl', label: 'Guinea Fowl' },
    { value: 'peafowl', label: 'Peafowl' },
    { value: 'pigeons', label: 'Pigeons' },
    { value: 'eggs_table', label: 'Table Eggs' },
    { value: 'eggs_fertile', label: 'Fertile Eggs' },
    { value: 'chicks', label: 'Chicks' },
    { value: 'growers', label: 'Growers' },
    { value: 'layers', label: 'Layers' },
    { value: 'broilers', label: 'Broilers' },
    { value: 'feed', label: 'Feed' },
    { value: 'supplements', label: 'Supplements' },
    { value: 'incubators', label: 'Incubators' },
    { value: 'equipment', label: 'Equipment' },
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Listing</h1>
          <p className="text-gray-600">Share your poultry products with buyers</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 border-0 shadow-lg mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Images</h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {formData.images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {formData.images.length < 10 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#7A9D7A] cursor-pointer flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">Upload</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImages}
                  />
                </label>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {uploadingImages ? 'Uploading...' : `${formData.images.length}/10 images uploaded`}
            </p>
          </Card>

          <Card className="p-6 border-0 shadow-lg mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Details</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Rhode Island Red Hens"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="e.g., Rhode Island Red"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g., 6 months"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="n/a">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="stock">Stock Quantity</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="1"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (ZAR) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="price_type">Price Type</Label>
                  <Select value={formData.price_type} onValueChange={(value) => setFormData({ ...formData, price_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="per_item">Per Item</SelectItem>
                      <SelectItem value="batch">For Entire Batch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your product..."
                  rows={5}
                />
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={createListingMutation.isPending}
              className="flex-1 bg-[#7A9D7A] hover:bg-[#6A8D6A] h-12"
            >
              {createListingMutation.isPending ? 'Creating...' : 'Create Listing'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="px-8 h-12"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}