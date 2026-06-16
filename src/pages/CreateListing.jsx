import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Upload, X, Loader2, ImagePlus, Sparkles, Eye, MapPin, FileText, Package as PackageIcon, Download, Egg } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import PageShell from '@/components/shell/PageShell';
import { CATEGORY_ICONS, GuideIcon } from '@/components/icons/PoultryIcons';

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
    images: [],
    // ----- Digital product fields -----
    product_type: 'physical', // 'physical' | 'digital'
    digital_files: [],        // [{ url, name, size, type }]
  });
  const [uploadingFile, setUploadingFile] = useState(false);

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

  const handleDigitalFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const oversized = files.find((f) => f.size > 50 * 1024 * 1024);
    if (oversized) {
      toast.error(`"${oversized.name}" is over 50MB. Maximum file size is 50MB.`);
      return;
    }
    if ((formData.digital_files?.length || 0) + files.length > 20) {
      toast.error('Maximum 20 files per listing.');
      return;
    }

    setUploadingFile(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const { file_url } = await api.integrations.Core.UploadFile({ file });
        uploaded.push({
          url: file_url,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
        });
      }
      setFormData((prev) => ({
        ...prev,
        digital_files: [...(prev.digital_files || []), ...uploaded],
      }));
      toast.success(`${uploaded.length} file${uploaded.length === 1 ? '' : 's'} uploaded`);
    } catch (error) {
      toast.error('Failed to upload file(s)');
    } finally {
      setUploadingFile(false);
      // Reset the input so the same file can be re-selected
      e.target.value = '';
    }
  };

  const removeDigitalFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      digital_files: prev.digital_files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const isDigital = formData.product_type === 'digital';

    if (!formData.title || !formData.category || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (isDigital && (!formData.digital_files || formData.digital_files.length === 0)) {
      toast.error('Please upload at least one file before publishing');
      return;
    }

    createListingMutation.mutate({
      ...formData,
      price: parseFloat(formData.price),
      stock_quantity: isDigital ? 9999 : parseInt(formData.stock_quantity),
      currency: 'ZAR',
      province: isDigital ? null : user?.province,
      city: isDigital ? null : user?.city,
      exact_location: isDigital ? null : user?.exact_location,
      status: 'active',
      view_count: 0,
      inquiry_count: 0,
    });
  };

  const physicalCategories = [
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
    { value: 'other', label: 'Other' },
  ];
  const digitalCategories = [
    { value: 'ebook',    label: 'eBook' },
    { value: 'guide',    label: 'Guide / how-to' },
    { value: 'course',   label: 'Online course' },
    { value: 'template', label: 'Template / worksheet' },
    { value: 'other',    label: 'Other digital' },
  ];
  const isDigital = formData.product_type === 'digital';
  const categories = isDigital ? digitalCategories : physicalCategories;

  const formatBytes = (b) => {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const PreviewIcon = formData.category ? CATEGORY_ICONS[formData.category] : null;
  const titleLen = formData.title?.length || 0;
  const descLen = formData.description?.length || 0;
  const completeness = (() => {
    let score = 0;
    if (formData.title) score += 20;
    if (formData.category) score += 20;
    if (formData.price) score += 20;
    if (formData.images.length > 0) score += 20;
    if (formData.description?.length > 30) score += 10;
    if (formData.product_type === 'digital') {
      if (formData.digital_files?.length > 0) score += 10;
    } else {
      if (formData.breed) score += 10;
    }
    return score;
  })();

  return (
    <PageShell
      eyebrow="New listing"
      title="Create a listing"
      subtitle="Share your poultry, eggs, feed or equipment with thousands of buyers."
      breadcrumb={[
        { label: 'Home', href: '/' },
        { label: 'Dashboard', href: createPageUrl('Dashboard') },
        { label: 'New listing' },
      ]}
    >
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        {/* ============ FORM (left, 2 cols) ============ */}
        <div className="lg:col-span-2 space-y-6">
          {/* PRODUCT TYPE TOGGLE */}
          <Card className="card-premium p-6 lg:p-7 border-0 shadow-none">
            <div className="mb-4">
              <h2 className="font-display text-xl text-ink">What are you selling?</h2>
              <p className="text-sm text-ink/55 mt-1">Pick the type — the rest of the form adapts to match.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, product_type: 'physical', category: '' })}
                className={`relative p-5 rounded-2xl text-left border-2 transition-all ${
                  formData.product_type === 'physical'
                    ? 'border-moss-600 bg-moss-50/60 shadow-soft'
                    : 'border-border bg-white hover:border-moss-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  formData.product_type === 'physical' ? 'bg-moss-600 text-cream' : 'bg-cream-deep text-ink/60'
                }`}>
                  <Egg className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <p className="font-display text-lg text-ink">Physical product</p>
                <p className="text-xs text-ink/55 mt-1">Live birds, eggs, feed, equipment</p>
                {formData.product_type === 'physical' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-moss-600 flex items-center justify-center">
                    <svg className="w-3 h-3 text-cream" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6.5l2.5 2.5L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, product_type: 'digital', category: '' })}
                className={`relative p-5 rounded-2xl text-left border-2 transition-all ${
                  formData.product_type === 'digital'
                    ? 'border-terracotta-400 bg-terracotta-50/60 shadow-soft'
                    : 'border-border bg-white hover:border-terracotta-200'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  formData.product_type === 'digital' ? 'bg-terracotta-400 text-white' : 'bg-cream-deep text-ink/60'
                }`}>
                  <GuideIcon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <p className="font-display text-lg text-ink">Digital product</p>
                <p className="text-xs text-ink/55 mt-1">eBooks, guides, courses, templates (PDF)</p>
                {formData.product_type === 'digital' && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-terracotta-400 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6.5l2.5 2.5L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </Card>

          {/* DIGITAL FILES — only when digital */}
          {isDigital && (
            <Card className="card-premium p-6 lg:p-7 border-0 shadow-none">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-xl text-ink">Your files</h2>
                  <p className="text-sm text-ink/55 mt-1">Buyers download all files after payment. Max 20 files, 50 MB each.</p>
                </div>
                <span className="text-xs text-ink/50">{formData.digital_files?.length || 0}/20</span>
              </div>

              {/* List of uploaded files */}
              {formData.digital_files?.length > 0 && (
                <div className="space-y-2 mb-3">
                  {formData.digital_files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-moss-50 border border-moss-100 group">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FileText className="w-5 h-5 text-moss-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-ink truncate text-sm">{file.name}</p>
                        <p className="text-[11px] text-ink/55 mt-0.5">
                          {(file.type?.split('/')[1] || 'file').toUpperCase()} · {formatBytes(file.size)}
                        </p>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-moss-700 hover:underline px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Preview
                      </a>
                      <button
                        type="button"
                        onClick={() => removeDigitalFile(idx)}
                        className="w-7 h-7 rounded-full hover:bg-terracotta-100 flex items-center justify-center text-terracotta-600 transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload dropzone */}
              {(formData.digital_files?.length || 0) < 20 && (
                <label className="block aspect-[6/1] rounded-2xl border-2 border-dashed border-border hover:border-terracotta-300 cursor-pointer bg-cream/50 hover:bg-terracotta-50/40 transition-all">
                  <div className="h-full flex flex-col items-center justify-center text-ink/50 hover:text-terracotta-600 transition-colors">
                    {uploadingFile ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 mb-1" strokeWidth={1.5} />
                        <span className="text-sm font-medium">
                          {formData.digital_files?.length > 0 ? 'Add more files' : 'Click to upload PDF, EPUB, ZIP…'}
                        </span>
                        <span className="text-[11px] mt-1">Select multiple — max 50 MB each</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.epub,.zip,.docx,.xlsx,.mp4,.mp3,application/pdf,application/zip"
                    onChange={handleDigitalFileUpload}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                </label>
              )}
            </Card>
          )}

          {/* PHOTOS */}
          <Card className="card-premium p-6 lg:p-7 border-0 shadow-none">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-display text-xl text-ink">{isDigital ? 'Cover image' : 'Photos'}</h2>
                <p className="text-sm text-ink/55 mt-1">
                  {isDigital
                    ? 'Add at least one preview image. This is what buyers see in the marketplace.'
                    : 'First image is the cover. Drag to reorder later.'}
                </p>
              </div>
              <span className="text-xs text-ink/50">{formData.images.length}/{isDigital ? 4 : 10}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {formData.images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-2xl overflow-hidden bg-cream-deep group ring-1 ring-border">
                  <img src={url} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 chip text-[10px] !py-0.5">Cover</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm hover:bg-white rounded-full flex items-center justify-center shadow-soft opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X className="w-3.5 h-3.5 text-terracotta-600" />
                  </button>
                </div>
              ))}
              {formData.images.length < 10 && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-moss-400 cursor-pointer flex flex-col items-center justify-center bg-cream/50 hover:bg-moss-50/40 text-ink/50 hover:text-moss-700 transition-all">
                  {uploadingImages ? (
                    <Loader2 className="w-7 h-7 animate-spin" />
                  ) : (
                    <>
                      <ImagePlus className="w-7 h-7 mb-1.5" strokeWidth={1.5} />
                      <span className="text-xs font-medium">Add photo</span>
                    </>
                  )}
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
          </Card>

          {/* DETAILS */}
          <Card className="card-premium p-6 lg:p-7 border-0 shadow-none space-y-5">
            <div>
              <h2 className="font-display text-xl text-ink">The basics</h2>
              <p className="text-sm text-ink/55 mt-1">Buyers search for these fields, so be specific.</p>
            </div>

            <div>
              <Label htmlFor="title">Title <span className="text-terracotta-500">*</span></Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Rhode Island Red point-of-lay hens"
                maxLength={80}
                required
                className="mt-1.5"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-ink/40">A clear, searchable title sells faster</span>
                <span className={`text-xs ${titleLen > 70 ? 'text-yolk-600' : 'text-ink/40'}`}>{titleLen}/80</span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category <span className="text-terracotta-500">*</span></Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isDigital && (
                <div>
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="e.g., Boschveld, Koekoek, Potchefstroom Koekoek…"
                    className="mt-1.5"
                  />
                </div>
              )}
              {isDigital && (
                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    value={formData.breed}
                    onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                    placeholder="Author name or shop name"
                    className="mt-1.5"
                  />
                </div>
              )}
            </div>

            {!isDigital && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="e.g., 6 months"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                      <SelectItem value="n/a">N/A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="1"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="price">Price <span className="text-terracotta-500">*</span></Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40 font-medium">R</span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                    required
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="price_type">Pricing</Label>
                <Select value={isDigital ? 'per_item' : formData.price_type} onValueChange={(value) => setFormData({ ...formData, price_type: value })}>
                  <SelectTrigger className="mt-1.5" disabled={isDigital}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {isDigital ? (
                      <SelectItem value="per_item">Per download</SelectItem>
                    ) : (
                      <>
                        <SelectItem value="per_item">Per item</SelectItem>
                        <SelectItem value="batch">Whole batch</SelectItem>
                      </>
                    )}
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
                placeholder="Tell buyers about feeding, vaccinations, lineage, collection details, etc."
                rows={6}
                maxLength={1200}
                className="mt-1.5"
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-ink/40">A great description sells the bird before the buyer even picks up the phone</span>
                <span className="text-xs text-ink/40">{descLen}/1200</span>
              </div>
            </div>
          </Card>

          {/* ACTIONS */}
          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={createListingMutation.isPending}
              className="btn-cta px-7 py-3 text-base flex-1"
            >
              {createListingMutation.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Publishing…</>) : 'Publish listing'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(createPageUrl('Dashboard'))}
              className="px-6 py-3 rounded-full border-border"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* ============ LIVE PREVIEW (right) ============ */}
        <aside className="lg:sticky lg:top-28 self-start">
          <p className="eyebrow mb-3">Live preview</p>

          <div className="card-premium overflow-hidden">
            <div className="aspect-[4/3] bg-cream-deep relative overflow-hidden">
              {formData.images[0] ? (
                <img src={formData.images[0]} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-ink/30">
                  {PreviewIcon ? <PreviewIcon className="w-14 h-14" /> : <ImagePlus className="w-12 h-12" strokeWidth={1.5} />}
                  <p className="mt-2 text-xs">Photos appear here</p>
                </div>
              )}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                {isDigital && (
                  <span className="chip chip-accent">
                    <GuideIcon className="w-3 h-3" />
                    Digital
                  </span>
                )}
                {formData.category && (
                  <span className="chip">
                    {categories.find(c => c.value === formData.category)?.label}
                  </span>
                )}
              </div>
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg text-ink leading-snug line-clamp-2">
                {formData.title || <span className="text-ink/30">Your listing title</span>}
              </h3>
              {formData.breed && (
                <p className="text-sm text-ink/60 mt-1">
                  {isDigital ? `by ${formData.breed}` : formData.breed}
                </p>
              )}
              {!isDigital ? (
                <div className="flex items-center gap-2 text-xs text-ink/50 mt-3">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.city || 'Your city'}{user.province && ', '}{user.province || ''}
                </div>
              ) : formData.digital_file_url ? (
                <div className="flex items-center gap-2 text-xs text-ink/55 mt-3">
                  <FileText className="w-3.5 h-3.5 text-terracotta-500" />
                  {(formData.digital_file_type?.split('/')[1] || 'file').toUpperCase()} · {formatBytes(formData.digital_file_size)}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-ink/40 mt-3 italic">
                  <FileText className="w-3.5 h-3.5" />
                  No file uploaded yet
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-border flex items-baseline justify-between">
                <div>
                  <span className="font-display text-2xl font-bold text-ink">
                    R{formData.price ? Number(formData.price).toLocaleString('en-ZA') : '0'}
                  </span>
                  <span className="text-xs text-ink/40 ml-1">
                    /{isDigital ? 'download' : (formData.price_type === 'batch' ? 'batch' : 'each')}
                  </span>
                </div>
                {!isDigital && formData.stock_quantity > 0 && (
                  <span className="text-xs text-moss-600">{formData.stock_quantity} available</span>
                )}
                {isDigital && formData.digital_files?.length > 0 && (
                  <span className="text-xs text-terracotta-600 inline-flex items-center gap-1">
                    <Download className="w-3 h-3" />
                    {formData.digital_files.length} file{formData.digital_files.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Completeness meter */}
          <div className="mt-5 p-4 rounded-2xl bg-moss-50 border border-moss-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-[0.16em] text-moss-700 font-semibold">Listing strength</span>
              <span className="text-sm font-semibold text-moss-700">{completeness}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white overflow-hidden">
              <div
                className="h-full bg-moss-gradient transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
            <p className="text-xs text-ink/60 mt-3 leading-relaxed">
              {completeness < 60 && 'Add photos, a clear title and price to make your listing stand out.'}
              {completeness >= 60 && completeness < 90 && 'Looking good. Add a description and breed to seal the deal.'}
              {completeness >= 90 && (
                <span className="inline-flex items-center gap-1 text-moss-700 font-medium">
                  <Sparkles className="w-3 h-3" /> This is a top-tier listing.
                </span>
              )}
            </p>
          </div>
        </aside>
      </form>
    </PageShell>
  );
}