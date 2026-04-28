import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Search, Filter, Phone, Mail, Building2, MapPin, DollarSign, Calendar, Loader2, Edit, Trash2, Clock, TrendingUp, Target, Award, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function CRM() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingProspect, setEditingProspect] = useState(null);
  const [showInteractionForm, setShowInteractionForm] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    province: '',
    city: '',
    status: 'new_lead',
    source: 'marketplace',
    interest: '',
    estimated_value: '',
    priority: 'medium',
    notes: '',
    next_follow_up: '',
    tags: []
  });
  const [newInteraction, setNewInteraction] = useState({ type: 'call', notes: '' });

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

  const { data: prospects = [], isLoading } = useQuery({
    queryKey: ['prospects'],
    queryFn: () => api.entities.Prospect.filter({ created_by: user?.email }, '-created_date'),
    enabled: !!user
  });

  const { data: sellerTiers = [] } = useQuery({
    queryKey: ['seller-tiers-crm'],
    queryFn: () => api.entities.SellerTier.list(),
    enabled: !!user
  });

  const createProspectMutation = useMutation({
    mutationFn: (data) => api.entities.Prospect.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      toast.success('Prospect added successfully');
      resetForm();
    }
  });

  const updateProspectMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Prospect.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      toast.success('Prospect updated');
      resetForm();
    }
  });

  const deleteProspectMutation = useMutation({
    mutationFn: (id) => api.entities.Prospect.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      toast.success('Prospect deleted');
    }
  });

  const resetForm = () => {
    setFormData({
      full_name: '', email: '', phone: '', company: '', province: '', city: '',
      status: 'new_lead', source: 'marketplace', interest: '', estimated_value: '',
      priority: 'medium', notes: '', next_follow_up: '', tags: []
    });
    setEditingProspect(null);
    setShowForm(false);
  };

  const handleEdit = (prospect) => {
    setEditingProspect(prospect);
    setFormData({
      full_name: prospect.full_name || '',
      email: prospect.email || '',
      phone: prospect.phone || '',
      company: prospect.company || '',
      province: prospect.province || '',
      city: prospect.city || '',
      status: prospect.status || 'new_lead',
      source: prospect.source || 'marketplace',
      interest: prospect.interest || '',
      estimated_value: prospect.estimated_value || '',
      priority: prospect.priority || 'medium',
      notes: prospect.notes || '',
      next_follow_up: prospect.next_follow_up || '',
      tags: prospect.tags || []
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.full_name) {
      toast.error('Please enter prospect name');
      return;
    }

    // Check tier limits when adding new prospect
    if (!editingProspect) {
      const userTier = sellerTiers.find(t => t.name === (user?.seller_tier || 'basic'));
      const maxProspects = userTier?.max_prospects || 50;
      
      if (prospects.length >= maxProspects) {
        toast.error(`You've reached your prospect limit (${maxProspects}). Upgrade your tier for more.`);
        return;
      }
    }

    const data = {
      ...formData,
      estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value) : 0
    };

    if (editingProspect) {
      updateProspectMutation.mutate({ id: editingProspect.id, data });
    } else {
      createProspectMutation.mutate(data);
    }
  };

  const handleAddInteraction = (prospect) => {
    if (!newInteraction.notes.trim()) {
      toast.error('Please add interaction notes');
      return;
    }

    const interactions = prospect.interactions || [];
    interactions.push({
      date: new Date().toISOString(),
      type: newInteraction.type,
      notes: newInteraction.notes
    });

    updateProspectMutation.mutate({
      id: prospect.id,
      data: { interactions }
    });

    setNewInteraction({ type: 'call', notes: '' });
    setShowInteractionForm(null);
  };

  const filteredProspects = prospects.filter(p => {
    const matchesSearch = !searchQuery || 
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || p.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const statusConfig = {
    new_lead: { label: 'New Lead', color: 'bg-blue-500', icon: Target },
    contacted: { label: 'Contacted', color: 'bg-purple-500', icon: Phone },
    qualified: { label: 'Qualified', color: 'bg-cyan-500', icon: CheckCircle2 },
    proposal: { label: 'Proposal', color: 'bg-yellow-500', icon: TrendingUp },
    negotiation: { label: 'Negotiation', color: 'bg-orange-500', icon: DollarSign },
    won: { label: 'Won', color: 'bg-green-500', icon: Award },
    lost: { label: 'Lost', color: 'bg-gray-500', icon: AlertCircle }
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  // Stats
  const stats = {
    total: prospects.length,
    new_leads: prospects.filter(p => p.status === 'new_lead').length,
    qualified: prospects.filter(p => p.status === 'qualified').length,
    won: prospects.filter(p => p.status === 'won').length,
    total_value: prospects.filter(p => p.status !== 'lost').reduce((sum, p) => sum + (p.estimated_value || 0), 0),
    overdue: prospects.filter(p => p.next_follow_up && new Date(p.next_follow_up) < new Date()).length
  };

  const pipelineView = Object.entries(statusConfig).map(([status, config]) => ({
    status,
    ...config,
    prospects: prospects.filter(p => p.status === status)
  }));

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Customer Relationship Management</h1>
              <p className="text-white/90">
                Manage prospects and customer relationships
                {(() => {
                  const userTier = sellerTiers.find(t => t.name === (user?.seller_tier || 'basic'));
                  const maxProspects = userTier?.max_prospects || 50;
                  return ` (${prospects.length}/${maxProspects})`;
                })()}
              </p>
            </div>
            <Button onClick={() => setShowForm(true)} className="bg-white text-[#7A9D7A] hover:bg-gray-50">
              <Plus className="w-5 h-5 mr-2" />
              Add Prospect
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card className="p-4 border-0 shadow">
            <Users className="w-6 h-6 text-[#7A9D7A] mb-2" />
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-gray-600">Total Prospects</p>
          </Card>
          <Card className="p-4 border-0 shadow">
            <Target className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{stats.new_leads}</p>
            <p className="text-sm text-gray-600">New Leads</p>
          </Card>
          <Card className="p-4 border-0 shadow">
            <CheckCircle2 className="w-6 h-6 text-cyan-500 mb-2" />
            <p className="text-2xl font-bold">{stats.qualified}</p>
            <p className="text-sm text-gray-600">Qualified</p>
          </Card>
          <Card className="p-4 border-0 shadow">
            <Award className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{stats.won}</p>
            <p className="text-sm text-gray-600">Won Deals</p>
          </Card>
          <Card className="p-4 border-0 shadow">
            <DollarSign className="w-6 h-6 text-[#E07A5F] mb-2" />
            <p className="text-2xl font-bold">R{stats.total_value.toLocaleString()}</p>
            <p className="text-sm text-gray-600">Pipeline Value</p>
          </Card>
          <Card className="p-4 border-0 shadow">
            <Clock className="w-6 h-6 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{stats.overdue}</p>
            <p className="text-sm text-gray-600">Overdue Follow-ups</p>
          </Card>
        </div>

        <Tabs defaultValue="list" className="space-y-6">
          <TabsList>
            <TabsTrigger value="list">List View</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {/* Filters */}
            <Card className="p-4 mb-6 border-0 shadow">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search prospects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(statusConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Prospects List */}
            {filteredProspects.length === 0 ? (
              <Card className="p-12 text-center border-0 shadow">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No prospects yet</h3>
                <p className="text-gray-600 mb-6">Start building your customer pipeline</p>
                <Button onClick={() => setShowForm(true)} className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
                  <Plus className="w-5 h-5 mr-2" />
                  Add First Prospect
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredProspects.map((prospect) => {
                  const StatusIcon = statusConfig[prospect.status]?.icon || Target;
                  const isOverdue = prospect.next_follow_up && new Date(prospect.next_follow_up) < new Date();
                  
                  return (
                    <Card key={prospect.id} className="p-6 border-0 shadow hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{prospect.full_name}</h3>
                            <Badge className={statusConfig[prospect.status]?.color || 'bg-gray-500'}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusConfig[prospect.status]?.label}
                            </Badge>
                            <Badge className={priorityColors[prospect.priority]}>
                              {prospect.priority}
                            </Badge>
                          </div>
                          {prospect.company && (
                            <p className="text-gray-600 flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              {prospect.company}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(prospect)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => deleteProspectMutation.mutate(prospect.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        {prospect.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${prospect.email}`} className="hover:text-[#7A9D7A]">
                              {prospect.email}
                            </a>
                          </div>
                        )}
                        {prospect.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="w-4 h-4" />
                            <a href={`tel:${prospect.phone}`} className="hover:text-[#7A9D7A]">
                              {prospect.phone}
                            </a>
                          </div>
                        )}
                        {(prospect.city || prospect.province) && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            {[prospect.city, prospect.province].filter(Boolean).join(', ')}
                          </div>
                        )}
                        {prospect.estimated_value > 0 && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            R{prospect.estimated_value.toLocaleString()}
                          </div>
                        )}
                      </div>

                      {prospect.interest && (
                        <p className="text-sm text-gray-600 mb-4">
                          <strong>Interest:</strong> {prospect.interest}
                        </p>
                      )}

                      {prospect.next_follow_up && (
                        <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                          isOverdue ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          <Calendar className="w-4 h-4" />
                          <span>
                            Follow-up: {moment(prospect.next_follow_up).format('MMM D, YYYY h:mm A')}
                            {isOverdue && ' (Overdue)'}
                          </span>
                        </div>
                      )}

                      {prospect.interactions && prospect.interactions.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium text-gray-700 mb-2">Recent Interactions:</p>
                          <div className="space-y-2">
                            {prospect.interactions.slice(-3).reverse().map((interaction, idx) => (
                              <div key={idx} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                <span className="font-medium capitalize">{interaction.type}</span> - {moment(interaction.date).format('MMM D, h:mm A')}
                                <p className="text-xs mt-1">{interaction.notes}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowInteractionForm(prospect.id)}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Interaction
                        </Button>
                      </div>

                      {showInteractionForm === prospect.id && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                          <Select value={newInteraction.type} onValueChange={(val) => setNewInteraction({ ...newInteraction, type: val })}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="call">Phone Call</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="meeting">Meeting</SelectItem>
                              <SelectItem value="note">Note</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea
                            placeholder="Interaction notes..."
                            value={newInteraction.notes}
                            onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })}
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleAddInteraction(prospect)}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setShowInteractionForm(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pipeline">
            <div className="grid lg:grid-cols-7 gap-4">
              {pipelineView.map((stage) => {
                const StageIcon = stage.icon;
                return (
                  <Card key={stage.status} className="p-4 border-0 shadow">
                    <div className="flex items-center gap-2 mb-4">
                      <StageIcon className="w-5 h-5" />
                      <div>
                        <h3 className="font-semibold text-sm">{stage.label}</h3>
                        <p className="text-xs text-gray-500">{stage.prospects.length} prospects</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {stage.prospects.map((prospect) => (
                        <div
                          key={prospect.id}
                          className="p-3 bg-white border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => handleEdit(prospect)}
                        >
                          <p className="font-medium text-sm mb-1">{prospect.full_name}</p>
                          {prospect.company && <p className="text-xs text-gray-600">{prospect.company}</p>}
                          {prospect.estimated_value > 0 && (
                            <p className="text-xs text-[#E07A5F] font-medium mt-1">
                              R{prospect.estimated_value.toLocaleString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Form */}
      <Dialog open={showForm} onOpenChange={resetForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProspect ? 'Edit Prospect' : 'Add New Prospect'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+27 12 345 6789"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Province</Label>
                <Input
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Gauteng"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Johannesburg"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, val]) => (
                      <SelectItem key={key} value={key}>{val.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Source</Label>
                <Select value={formData.source} onValueChange={(val) => setFormData({ ...formData, source: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="marketplace">Marketplace</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Interest/Need</Label>
                <Input
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  placeholder="e.g., Chickens for farm"
                />
              </div>
              <div>
                <Label>Estimated Value (R)</Label>
                <Input
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Next Follow-up</Label>
              <Input
                type="datetime-local"
                value={formData.next_follow_up ? formData.next_follow_up.slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, next_follow_up: new Date(e.target.value).toISOString() })}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this prospect..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
              {editingProspect ? 'Update' : 'Add'} Prospect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}