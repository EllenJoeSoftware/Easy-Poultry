import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Plus, ShoppingCart, TrendingDown, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import moment from 'moment';

export default function FeedManagement() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showUsageForm, setShowUsageForm] = useState(false);
  const [showFeedTypeForm, setShowFeedTypeForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [feedTypeFormData, setFeedTypeFormData] = useState({
    name: '',
    category: 'starter',
    bird_type: 'broilers',
    protein_percentage: '',
    current_stock_kg: 0,
    low_stock_alert_kg: 100,
    cost_per_kg: '',
    description: ''
  });
  const [supplierFormData, setSupplierFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  });
  const [purchaseFormData, setPurchaseFormData] = useState({
    feed_type_id: '',
    supplier_id: '',
    quantity_kg: '',
    cost_per_kg: '',
    purchase_date: moment().format('YYYY-MM-DD'),
    invoice_number: '',
    notes: ''
  });
  const [usageFormData, setUsageFormData] = useState({
    batch_id: '',
    feed_type_id: '',
    quantity_kg: '',
    usage_date: moment().format('YYYY-MM-DD'),
    notes: ''
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

  const { data: feedTypes = [] } = useQuery({
    queryKey: ['feed-types'],
    queryFn: () => api.entities.FeedType.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => api.entities.FeedSupplier.filter({ created_by: user?.email }),
    enabled: !!user
  });

  // Create default feed types if none exist
  useEffect(() => {
    const createDefaults = async () => {
      if (user && feedTypes.length === 0) {
        const defaults = [
          { name: 'Broiler Starter', category: 'starter', bird_type: 'broilers', protein_percentage: 23, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 8.5, description: 'High protein starter feed for broilers (0-2 weeks)' },
          { name: 'Broiler Grower', category: 'grower', bird_type: 'broilers', protein_percentage: 20, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 7.5, description: 'Grower feed for broilers (3-4 weeks)' },
          { name: 'Broiler Finisher', category: 'finisher', bird_type: 'broilers', protein_percentage: 18, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 7, description: 'Finisher feed for broilers (5+ weeks)' },
          { name: 'Layer Starter', category: 'starter', bird_type: 'layers', protein_percentage: 20, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 8, description: 'Starter feed for layer chicks (0-6 weeks)' },
          { name: 'Layer Grower', category: 'grower', bird_type: 'layers', protein_percentage: 16, current_stock_kg: 0, low_stock_alert_kg: 100, cost_per_kg: 7, description: 'Grower feed for layers (7-18 weeks)' },
          { name: 'Layer Mash', category: 'layer_mash', bird_type: 'layers', protein_percentage: 17, current_stock_kg: 0, low_stock_alert_kg: 150, cost_per_kg: 7.5, description: 'Production feed for laying hens' }
        ];
        
        for (const feed of defaults) {
          await api.entities.FeedType.create(feed);
        }
        queryClient.invalidateQueries(['feed-types']);
      }
    };
    createDefaults();
  }, [user, feedTypes.length]);

  const { data: batches = [] } = useQuery({
    queryKey: ['batches-feed'],
    queryFn: () => api.entities.PoultryBatch.filter({ created_by: user?.email, status: 'active' }),
    enabled: !!user
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['feed-purchases'],
    queryFn: () => api.entities.FeedPurchase.filter({ created_by: user?.email }, '-purchase_date', 20),
    enabled: !!user
  });

  const recordPurchaseMutation = useMutation({
    mutationFn: async (data) => {
      const feed = feedTypes.find(f => f.id === data.feed_type_id);
      const supplier = suppliers.find(s => s.id === data.supplier_id);
      const quantity = parseFloat(data.quantity_kg);
      const costPerKg = parseFloat(data.cost_per_kg);
      
      await api.entities.FeedPurchase.create({
        ...data,
        feed_name: feed.name,
        supplier_name: supplier.name,
        quantity_kg: quantity,
        cost_per_kg: costPerKg,
        total_cost: quantity * costPerKg
      });

      // Update feed stock
      await api.entities.FeedType.update(data.feed_type_id, {
        current_stock_kg: (feed.current_stock_kg || 0) + quantity
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-purchases']);
      queryClient.invalidateQueries(['feed-types']);
      toast.success('Purchase recorded');
      resetPurchaseForm();
    }
  });

  const createFeedTypeMutation = useMutation({
    mutationFn: (data) => api.entities.FeedType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-types']);
      toast.success('Feed type added');
      resetFeedTypeForm();
    }
  });

  const createSupplierMutation = useMutation({
    mutationFn: (data) => api.entities.FeedSupplier.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers']);
      toast.success('Supplier added');
      resetSupplierForm();
    }
  });

  const recordUsageMutation = useMutation({
    mutationFn: async (data) => {
      const feed = feedTypes.find(f => f.id === data.feed_type_id);
      const batch = batches.find(b => b.id === data.batch_id);
      const quantity = parseFloat(data.quantity_kg);
      const cost = quantity * (feed.cost_per_kg || 0);

      await api.entities.FeedUsage.create({
        ...data,
        feed_name: feed.name,
        batch_name: batch.batch_name,
        quantity_kg: quantity,
        cost: cost,
        birds_count: batch.current_quantity
      });

      // Update feed stock
      await api.entities.FeedType.update(data.feed_type_id, {
        current_stock_kg: Math.max(0, (feed.current_stock_kg || 0) - quantity)
      });

      // Update batch feed cost
      await api.entities.PoultryBatch.update(data.batch_id, {
        total_feed_cost: (batch.total_feed_cost || 0) + cost
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['feed-types']);
      queryClient.invalidateQueries(['batches-feed']);
      toast.success('Feed usage recorded');
      resetUsageForm();
    }
  });

  const resetPurchaseForm = () => {
    setPurchaseFormData({
      feed_type_id: '',
      supplier_id: '',
      quantity_kg: '',
      cost_per_kg: '',
      purchase_date: moment().format('YYYY-MM-DD'),
      invoice_number: '',
      notes: ''
    });
    setShowPurchaseForm(false);
  };

  const resetUsageForm = () => {
    setUsageFormData({
      batch_id: '',
      feed_type_id: '',
      quantity_kg: '',
      usage_date: moment().format('YYYY-MM-DD'),
      notes: ''
    });
    setShowUsageForm(false);
  };

  const resetFeedTypeForm = () => {
    setFeedTypeFormData({
      name: '',
      category: 'starter',
      bird_type: 'broilers',
      protein_percentage: '',
      current_stock_kg: 0,
      low_stock_alert_kg: 100,
      cost_per_kg: '',
      description: ''
    });
    setShowFeedTypeForm(false);
  };

  const resetSupplierForm = () => {
    setSupplierFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      notes: ''
    });
    setShowSupplierForm(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const lowStockFeeds = feedTypes.filter(f => f.current_stock_kg <= f.low_stock_alert_kg);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('FarmDashboard')} className="inline-flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Farm Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Feed Management</h1>
              <p className="text-white/90">Track feed inventory and usage</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowFeedTypeForm(true)} variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                <Plus className="w-5 h-5 mr-2" />
                Add Feed Type
              </Button>
              <Button onClick={() => setShowSupplierForm(true)} variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                <Plus className="w-5 h-5 mr-2" />
                Add Supplier
              </Button>
              <Button onClick={() => setShowPurchaseForm(true)} className="bg-white text-orange-600 hover:bg-gray-50">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Record Purchase
              </Button>
              <Button onClick={() => setShowUsageForm(true)} variant="outline" className="bg-white/10 border-white text-white hover:bg-white/20">
                <TrendingDown className="w-5 h-5 mr-2" />
                Record Usage
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {lowStockFeeds.length > 0 && (
          <Card className="p-4 mb-6 border-orange-200 bg-orange-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Low Stock Alert</h3>
                {lowStockFeeds.map(feed => (
                  <p key={feed.id} className="text-sm text-orange-800">
                    • {feed.name}: {feed.current_stock_kg}kg (Alert: {feed.low_stock_alert_kg}kg)
                  </p>
                ))}
              </div>
            </div>
          </Card>
        )}

        <Tabs defaultValue="inventory">
          <TabsList>
            <TabsTrigger value="inventory">Feed Inventory ({feedTypes.length})</TabsTrigger>
            <TabsTrigger value="suppliers">Suppliers ({suppliers.length})</TabsTrigger>
            <TabsTrigger value="purchases">Recent Purchases</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-6">
            {feedTypes.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Setting up default feed types...</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedTypes.map(feed => {
                const isLow = feed.current_stock_kg <= feed.low_stock_alert_kg;
                return (
                  <Card key={feed.id} className={`p-6 ${isLow ? 'border-orange-300 bg-orange-50' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{feed.name}</h3>
                        <Badge className="capitalize mt-1">{feed.category}</Badge>
                      </div>
                      <Package className={`w-8 h-8 ${isLow ? 'text-orange-500' : 'text-gray-400'}`} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock:</span>
                        <span className={`font-semibold ${isLow ? 'text-orange-600' : 'text-gray-900'}`}>
                          {feed.current_stock_kg}kg
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Alert Level:</span>
                        <span className="font-semibold">{feed.low_stock_alert_kg}kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Cost/kg:</span>
                        <span className="font-semibold">R{feed.cost_per_kg || 0}</span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            )}
          </TabsContent>

          <TabsContent value="suppliers" className="mt-6">
            {suppliers.length === 0 ? (
              <Card className="p-12 text-center">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No suppliers added yet</p>
                <Button onClick={() => setShowSupplierForm(true)} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Supplier
                </Button>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.map(supplier => (
                  <Card key={supplier.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900">{supplier.name}</h3>
                        {supplier.contact_person && (
                          <p className="text-sm text-gray-600">{supplier.contact_person}</p>
                        )}
                      </div>
                      <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                        {supplier.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {supplier.phone && <p>📞 {supplier.phone}</p>}
                      {supplier.email && <p>📧 {supplier.email}</p>}
                      {supplier.address && <p>📍 {supplier.address}</p>}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases" className="mt-6">
            <div className="space-y-4">
              {purchases.map(purchase => (
                <Card key={purchase.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{purchase.feed_name}</h3>
                      <p className="text-sm text-gray-600">From: {purchase.supplier_name}</p>
                      <div className="grid sm:grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                        <p>Date: {moment(purchase.purchase_date).format('MMM D, YYYY')}</p>
                        <p>Quantity: {purchase.quantity_kg}kg</p>
                        <p>Total: R{purchase.total_cost}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showPurchaseForm} onOpenChange={(open) => !open && resetPurchaseForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Feed Purchase</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordPurchaseMutation.mutate(purchaseFormData); }} className="space-y-4">
            <div>
              <Label>Feed Type *</Label>
              <Select value={purchaseFormData.feed_type_id} onValueChange={(value) => setPurchaseFormData({ ...purchaseFormData, feed_type_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feed" />
                </SelectTrigger>
                <SelectContent>
                  {feedTypes.map(feed => (
                    <SelectItem key={feed.id} value={feed.id}>{feed.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Supplier *</Label>
              <Select value={purchaseFormData.supplier_id} onValueChange={(value) => setPurchaseFormData({ ...purchaseFormData, supplier_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchaseFormData.quantity_kg}
                  onChange={(e) => setPurchaseFormData({ ...purchaseFormData, quantity_kg: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Cost per kg *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={purchaseFormData.cost_per_kg}
                  onChange={(e) => setPurchaseFormData({ ...purchaseFormData, cost_per_kg: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label>Purchase Date</Label>
              <Input
                type="date"
                value={purchaseFormData.purchase_date}
                onChange={(e) => setPurchaseFormData({ ...purchaseFormData, purchase_date: e.target.value })}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetPurchaseForm}>Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Record Purchase</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showUsageForm} onOpenChange={(open) => !open && resetUsageForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Feed Usage</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); recordUsageMutation.mutate(usageFormData); }} className="space-y-4">
            <div>
              <Label>Batch *</Label>
              <Select value={usageFormData.batch_id} onValueChange={(value) => setUsageFormData({ ...usageFormData, batch_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>{batch.batch_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Feed Type *</Label>
              <Select value={usageFormData.feed_type_id} onValueChange={(value) => setUsageFormData({ ...usageFormData, feed_type_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select feed" />
                </SelectTrigger>
                <SelectContent>
                  {feedTypes.map(feed => (
                    <SelectItem key={feed.id} value={feed.id}>{feed.name} ({feed.current_stock_kg}kg)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity (kg) *</Label>
              <Input
                type="number"
                step="0.01"
                value={usageFormData.quantity_kg}
                onChange={(e) => setUsageFormData({ ...usageFormData, quantity_kg: e.target.value })}
                required
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetUsageForm}>Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Record Usage</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showFeedTypeForm} onOpenChange={(open) => !open && resetFeedTypeForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feed Type</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createFeedTypeMutation.mutate(feedTypeFormData); }} className="space-y-4">
            <div>
              <Label>Feed Name *</Label>
              <Input
                value={feedTypeFormData.name}
                onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, name: e.target.value })}
                placeholder="e.g., Premium Broiler Starter"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category *</Label>
                <Select value={feedTypeFormData.category} onValueChange={(value) => setFeedTypeFormData({ ...feedTypeFormData, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="grower">Grower</SelectItem>
                    <SelectItem value="finisher">Finisher</SelectItem>
                    <SelectItem value="layer_mash">Layer Mash</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Bird Type *</Label>
                <Select value={feedTypeFormData.bird_type} onValueChange={(value) => setFeedTypeFormData({ ...feedTypeFormData, bird_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="layers">Layers</SelectItem>
                    <SelectItem value="broilers">Broilers</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Protein %</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={feedTypeFormData.protein_percentage}
                  onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, protein_percentage: e.target.value })}
                  placeholder="e.g., 20"
                />
              </div>

              <div>
                <Label>Cost per kg *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={feedTypeFormData.cost_per_kg}
                  onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, cost_per_kg: e.target.value })}
                  placeholder="e.g., 7.50"
                  required
                />
              </div>
            </div>

            <div>
              <Label>Low Stock Alert (kg)</Label>
              <Input
                type="number"
                value={feedTypeFormData.low_stock_alert_kg}
                onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, low_stock_alert_kg: e.target.value })}
              />
            </div>

            <div>
              <Label>Description</Label>
              <Input
                value={feedTypeFormData.description}
                onChange={(e) => setFeedTypeFormData({ ...feedTypeFormData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetFeedTypeForm}>Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Add Feed Type</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showSupplierForm} onOpenChange={(open) => !open && resetSupplierForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Supplier</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createSupplierMutation.mutate(supplierFormData); }} className="space-y-4">
            <div>
              <Label>Supplier Name *</Label>
              <Input
                value={supplierFormData.name}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                placeholder="e.g., ABC Feed Co."
                required
              />
            </div>

            <div>
              <Label>Contact Person</Label>
              <Input
                value={supplierFormData.contact_person}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, contact_person: e.target.value })}
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={supplierFormData.phone}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                  placeholder="+27 123 456 789"
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={supplierFormData.email}
                  onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                  placeholder="supplier@example.com"
                />
              </div>
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={supplierFormData.address}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, address: e.target.value })}
                placeholder="123 Main Street, City"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={supplierFormData.notes}
                onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={resetSupplierForm}>Cancel</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700">Add Supplier</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}