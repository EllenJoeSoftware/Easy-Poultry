import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Package, Eye, Edit, Trash2, RotateCcw, CheckCircle, Loader2, 
  MoreVertical, Star, AlertCircle, Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import FeatureListingModal from '../components/listings/FeatureListingModal';

export default function MyListings() {
  const [user, setUser] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [featuringListing, setFeaturingListing] = useState(null);
  const [partialSaleDialog, setPartialSaleDialog] = useState(null);
  const [quantityToSell, setQuantityToSell] = useState(1);
  const queryClient = useQueryClient();

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

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings', user?.email],
    queryFn: () => api.entities.Listing.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user?.email
  });

  const updateListingMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Listing.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-listings']);
      toast.success('Listing updated');
    }
  });

  const deleteListingMutation = useMutation({
    mutationFn: (id) => api.entities.Listing.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['my-listings']);
      toast.success('Listing deleted');
    }
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, data }) => {
      await Promise.all(ids.map(id => api.entities.Listing.update(id, data)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-listings']);
      setSelectedIds([]);
      setShowBulkDialog(false);
      toast.success('Listings updated');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids) => {
      await Promise.all(ids.map(id => api.entities.Listing.delete(id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['my-listings']);
      setSelectedIds([]);
      setShowBulkDialog(false);
      toast.success('Listings deleted');
    }
  });

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(filteredListings.map(l => l.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id, checked) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(i => i !== id));
    }
  };

  const executeBulkAction = () => {
    if (bulkAction === 'delete') {
      bulkDeleteMutation.mutate(selectedIds);
    } else if (bulkAction === 'active' || bulkAction === 'inactive' || bulkAction === 'sold') {
      bulkUpdateMutation.mutate({ ids: selectedIds, data: { status: bulkAction } });
    }
  };

  const handleRelist = (listing) => {
    updateListingMutation.mutate({
      id: listing.id,
      data: { status: 'active', sold_date: null }
    });
  };

  const handlePartialSale = () => {
    const listing = partialSaleDialog;
    const newStock = listing.stock_quantity - quantityToSell;
    
    if (newStock <= 0) {
      // Sell entire listing
      updateListingMutation.mutate({
        id: listing.id,
        data: { status: 'sold', stock_quantity: 0, sold_date: new Date().toISOString() }
      });
    } else {
      // Reduce stock quantity
      updateListingMutation.mutate({
        id: listing.id,
        data: { stock_quantity: newStock }
      });
    }
    
    setPartialSaleDialog(null);
    setQuantityToSell(1);
  };

  const openPartialSaleDialog = (listing) => {
    setPartialSaleDialog(listing);
    setQuantityToSell(Math.min(1, listing.stock_quantity));
  };

  const filteredListings = listings.filter(l => 
    statusFilter === 'all' || l.status === statusFilter
  );

  const statusColors = {
    active: 'bg-green-100 text-green-800',
    sold: 'bg-blue-100 text-blue-800',
    reserved: 'bg-yellow-100 text-yellow-800',
    inactive: 'bg-gray-100 text-gray-800'
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
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">My Listings</h1>
              <p className="text-white/80 mt-1">Manage all your listings in one place</p>
            </div>
            <Link to={createPageUrl('CreateListing')}>
              <Button className="bg-white text-[#7A9D7A] hover:bg-gray-100">
                + New Listing
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Bulk Actions */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <Select value={bulkAction} onValueChange={(val) => { setBulkAction(val); setShowBulkDialog(true); }}>
                <SelectTrigger className="w-40 h-8">
                  <SelectValue placeholder="Bulk action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Mark Active</SelectItem>
                  <SelectItem value="sold">Mark Sold</SelectItem>
                  <SelectItem value="inactive">Mark Inactive</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="ml-auto text-sm text-gray-600">
            {filteredListings.length} listings
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-lg">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No listings found</h3>
            <p className="text-gray-600 mb-4">Create your first listing to start selling</p>
            <Link to={createPageUrl('CreateListing')}>
              <Button className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">Create Listing</Button>
            </Link>
          </Card>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={selectedIds.length === filteredListings.length && filteredListings.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Listing</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Views</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Inquiries</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.includes(listing.id)}
                        onCheckedChange={(checked) => handleSelect(listing.id, checked)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100'}
                          alt={listing.title}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{listing.title}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-500">{listing.breed || listing.category}</p>
                            {listing.stock_quantity > 1 && (
                              <Badge variant="outline" className="text-xs">
                                Stock: {listing.stock_quantity}
                              </Badge>
                            )}
                          </div>
                          {listing.featured && (
                            <Badge className="mt-1 bg-yellow-100 text-yellow-800 text-xs">
                              <Star className="w-3 h-3 mr-1 fill-yellow-500" />Featured
                            </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#E07A5F]">R{listing.price}</td>
                    <td className="px-4 py-3">
                      <Badge className={statusColors[listing.status]}>{listing.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{listing.view_count || 0}</td>
                    <td className="px-4 py-3 text-gray-600">{listing.inquiry_count || 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={createPageUrl('ProductDetail') + `?id=${listing.id}`}>
                          <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Link to={createPageUrl('EditListing') + `?id=${listing.id}`}>
                          <Button variant="ghost" size="sm"><Edit className="w-4 h-4" /></Button>
                        </Link>
                        {listing.status === 'active' && !listing.featured && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFeaturingListing(listing)}
                            className="text-yellow-600"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        {listing.status === 'active' && listing.stock_quantity > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openPartialSaleDialog(listing)}
                            className="text-blue-600"
                            title="Sell partial quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                        {listing.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => updateListingMutation.mutate({ id: listing.id, data: { status: 'sold', sold_date: new Date().toISOString() } })}
                            className="text-green-600"
                            title="Mark all as sold"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {(listing.status === 'sold' || listing.status === 'inactive') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRelist(listing)}
                            className="text-green-600"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteListingMutation.mutate(listing.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Action Confirmation */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Confirm Bulk Action
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            Are you sure you want to {bulkAction === 'delete' ? 'delete' : `mark as ${bulkAction}`} {selectedIds.length} listings?
          </p>
          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>Cancel</Button>
            <Button
              onClick={executeBulkAction}
              disabled={bulkUpdateMutation.isPending || bulkDeleteMutation.isPending}
              className={bulkAction === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#7A9D7A] hover:bg-[#6A8D6A]'}
            >
              {bulkUpdateMutation.isPending || bulkDeleteMutation.isPending ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {featuringListing && (
        <FeatureListingModal
          isOpen={!!featuringListing}
          onClose={() => setFeaturingListing(null)}
          listing={featuringListing}
        />
      )}

      {/* Partial Sale Dialog */}
      <Dialog open={!!partialSaleDialog} onOpenChange={() => setPartialSaleDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell Partial Quantity</DialogTitle>
          </DialogHeader>
          {partialSaleDialog && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">{partialSaleDialog.title}</p>
                <p className="text-sm font-medium">Available: {partialSaleDialog.stock_quantity} items</p>
              </div>
              <div>
                <Label htmlFor="quantity">Quantity to sell</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={partialSaleDialog.stock_quantity}
                  value={quantityToSell}
                  onChange={(e) => setQuantityToSell(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setPartialSaleDialog(null)}>Cancel</Button>
                <Button
                  onClick={handlePartialSale}
                  disabled={updateListingMutation.isPending || quantityToSell < 1 || quantityToSell > partialSaleDialog.stock_quantity}
                  className="bg-[#7A9D7A] hover:bg-[#6A8D6A]"
                >
                  {updateListingMutation.isPending ? 'Processing...' : 'Confirm Sale'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}