import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Upload, X, Loader2, Package, Gavel, Play, Trash2, Edit, Trophy, MessageCircle, Phone } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import moment from 'moment';

export default function ManageAuctionEvent() {
  const [user, setUser] = useState(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [itemForm, setItemForm] = useState({
    title: '', description: '', poultry_type: 'chickens', breed: '', age: '',
    quantity: 1, gender: 'n/a', health_details: '', video_url: '',
    starting_bid: '', reserve_price: '', min_increment: 10
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const eventId = urlParams.get('eventId');

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

  const { data: event } = useQuery({
    queryKey: ['auction-event', eventId],
    queryFn: async () => {
      const events = await api.entities.AuctionEvent.filter({ id: eventId });
      return events[0];
    },
    enabled: !!eventId
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['auction-items', eventId],
    queryFn: () => api.entities.AuctionItem.filter({ auction_event_id: eventId }, 'lot_number'),
    enabled: !!eventId
  });

  const { data: winners = [] } = useQuery({
    queryKey: ['auction-winners', eventId],
    queryFn: async () => {
      const soldItems = items.filter(i => i.winner_email || i.current_bidder);
      const winnerEmails = [...new Set(soldItems.map(i => i.winner_email || i.current_bidder).filter(Boolean))];
      if (winnerEmails.length === 0) return [];
      const users = await api.entities.User.list();
      return users.filter(u => winnerEmails.includes(u.email));
    },
    enabled: items.length > 0
  });

  const getWinnerInfo = (email) => winners.find(w => w.email === email);

  const addItemMutation = useMutation({
    mutationFn: async (data) => {
      await api.entities.AuctionItem.create({
        ...data,
        auction_event_id: eventId,
        auction_house_id: event.auction_house_id,
        lot_number: items.length + 1,
        images,
        status: 'pending'
      });
      await api.entities.AuctionEvent.update(eventId, { total_items: items.length + 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-items']);
      toast.success('Item added');
      resetForm();
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await api.entities.AuctionItem.update(id, { ...data, images });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-items']);
      toast.success('Item updated');
      resetForm();
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => api.entities.AuctionItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-items']);
      toast.success('Item deleted');
    }
  });

  const startAuctionMutation = useMutation({
    mutationFn: async () => {
      await api.entities.AuctionEvent.update(eventId, { status: 'scheduled' });
      for (const item of items) {
        await api.entities.AuctionItem.update(item.id, { status: 'active' });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['auction-event']);
      toast.success('Auction scheduled!');
    }
  });

  const resetForm = () => {
    setShowAddItem(false);
    setEditingItem(null);
    setImages([]);
    setItemForm({
      title: '', description: '', poultry_type: 'chickens', breed: '', age: '',
      quantity: 1, gender: 'n/a', health_details: '', video_url: '',
      starting_bid: '', reserve_price: '', min_increment: 10
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 10) {
      toast.error('Max 10 images');
      return;
    }
    setUploading(true);
    for (const file of files) {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setImages(prev => [...prev, file_url]);
    }
    setUploading(false);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      title: item.title, description: item.description || '', poultry_type: item.poultry_type || 'chickens',
      breed: item.breed || '', age: item.age || '', quantity: item.quantity || 1,
      gender: item.gender || 'n/a', health_details: item.health_details || '', video_url: item.video_url || '',
      starting_bid: item.starting_bid, reserve_price: item.reserve_price || '', min_increment: item.min_increment || 10
    });
    setImages(item.images || []);
    setShowAddItem(true);
  };

  const handleSubmitItem = () => {
    if (!itemForm.title || !itemForm.starting_bid) {
      toast.error('Title and starting bid required');
      return;
    }
    const data = {
      ...itemForm,
      starting_bid: parseFloat(itemForm.starting_bid),
      reserve_price: itemForm.reserve_price ? parseFloat(itemForm.reserve_price) : null,
      min_increment: parseFloat(itemForm.min_increment),
      quantity: parseInt(itemForm.quantity)
    };
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, data });
    } else {
      addItemMutation.mutate(data);
    }
  };

  const poultryTypes = [
    { value: 'chickens', label: 'Chickens' }, { value: 'ducks', label: 'Ducks' },
    { value: 'geese', label: 'Geese' }, { value: 'turkeys', label: 'Turkeys' },
    { value: 'quail', label: 'Quail' }, { value: 'guinea_fowl', label: 'Guinea Fowl' },
    { value: 'peafowl', label: 'Peafowl' }, { value: 'pigeons', label: 'Pigeons' },
    { value: 'eggs', label: 'Eggs' }, { value: 'other', label: 'Other' }
  ];

  if (!user || !event) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" /></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to={createPageUrl('MyAuctionHouse')} className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <Badge className={event.status === 'draft' ? 'bg-gray-500' : event.status === 'scheduled' ? 'bg-blue-500' : 'bg-green-500'}>
                {event.status}
              </Badge>
            </div>
            <p className="text-gray-600">{moment(event.start_time).format('MMM D, h:mm A')} - {moment(event.end_time).format('MMM D, h:mm A')}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => { resetForm(); setShowAddItem(true); }} className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
            {event.status === 'draft' && items.length > 0 && (
              <Button onClick={() => startAuctionMutation.mutate()} disabled={startAuctionMutation.isPending} className="bg-[#E07A5F] hover:bg-[#D06A4F]">
                <Play className="w-4 h-4 mr-2" />
                Schedule Auction
              </Button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No items yet</h3>
            <p className="text-gray-600 mb-6">Add items to your auction</p>
            <Button onClick={() => setShowAddItem(true)} className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden border-0 shadow">
                <div className="aspect-[4/3] bg-gray-100 relative">
                  <img src={item.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'} alt={item.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-bold">Lot {item.lot_number}</div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  {item.breed && <p className="text-sm text-gray-600 mb-2">{item.breed}</p>}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-xl font-bold text-[#E07A5F]">R{item.current_bid || item.starting_bid}</span>
                      {item.bid_count > 0 && <span className="text-sm text-gray-500 ml-2">({item.bid_count} bids)</span>}
                    </div>
                  </div>
                  
                  {/* Winner info */}
                  {(item.winner_email || item.current_bidder) && (event.status === 'ended' || item.status === 'sold') && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                        <Trophy className="w-4 h-4" />
                        Winner
                      </div>
                      <p className="text-sm font-medium text-gray-900">{item.winner_name || item.current_bidder_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-600">{item.winner_email || item.current_bidder}</p>
                      {getWinnerInfo(item.winner_email || item.current_bidder)?.phone && (
                        <a href={`tel:${getWinnerInfo(item.winner_email || item.current_bidder).phone}`} className="flex items-center gap-1 text-sm text-[#7A9D7A] mt-1">
                          <Phone className="w-3 h-3" />
                          {getWinnerInfo(item.winner_email || item.current_bidder).phone}
                        </a>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-[#7A9D7A] text-xs h-7"
                          onClick={() => {
                            const winnerEmail = item.winner_email || item.current_bidder;
                            window.location.href = createPageUrl('Messages') + `?startChat=${winnerEmail}&listingTitle=${encodeURIComponent(item.title)}`;
                          }}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Message
                        </Button>
                        {getWinnerInfo(item.winner_email || item.current_bidder)?.whatsapp && (
                          <a 
                            href={`https://wa.me/${getWinnerInfo(item.winner_email || item.current_bidder).whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi! Regarding your winning bid on "${item.title}" (Lot ${item.lot_number}) for R${item.current_bid || item.final_price}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="text-green-600 text-xs h-7">
                              WhatsApp
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditItem(item)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteItemMutation.mutate(item.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showAddItem} onOpenChange={() => resetForm()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Images</Label>
              <div className="grid grid-cols-5 gap-2 mt-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button>
                  </div>
                ))}
                {images.length < 10 && (
                  <label className="aspect-square rounded border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-[#7A9D7A]">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-gray-400" />}
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label>Title *</Label>
              <Input value={itemForm.title} onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={itemForm.poultry_type} onValueChange={(v) => setItemForm({ ...itemForm, poultry_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {poultryTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Breed</Label>
                <Input value={itemForm.breed} onChange={(e) => setItemForm({ ...itemForm, breed: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Age</Label>
                <Input value={itemForm.age} onChange={(e) => setItemForm({ ...itemForm, age: e.target.value })} />
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={itemForm.quantity} onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })} min="1" />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={itemForm.gender} onValueChange={(v) => setItemForm({ ...itemForm, gender: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                    <SelectItem value="n/a">N/A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Starting Bid (R) *</Label>
                <Input type="number" value={itemForm.starting_bid} onChange={(e) => setItemForm({ ...itemForm, starting_bid: e.target.value })} />
              </div>
              <div>
                <Label>Reserve (R)</Label>
                <Input type="number" value={itemForm.reserve_price} onChange={(e) => setItemForm({ ...itemForm, reserve_price: e.target.value })} />
              </div>
              <div>
                <Label>Min Increment</Label>
                <Input type="number" value={itemForm.min_increment} onChange={(e) => setItemForm({ ...itemForm, min_increment: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button onClick={handleSubmitItem} disabled={addItemMutation.isPending || updateItemMutation.isPending} className="bg-[#E07A5F] hover:bg-[#D06A4F]">
                {(addItemMutation.isPending || updateItemMutation.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingItem ? 'Update' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}