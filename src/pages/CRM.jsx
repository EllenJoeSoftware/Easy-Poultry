import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton } from '@/components/shell/SkeletonCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Users, Plus, Search, Filter, Phone, Mail, Building2, MapPin, DollarSign, Calendar, Loader2, Edit, Trash2, Clock, TrendingUp, Target, Award, AlertCircle, CheckCircle2, X, MoreHorizontal, ChevronDown, MessageSquarePlus } from 'lucide-react';
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
  const [expandedId, setExpandedId] = useState(null);

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

  const friendlyError = (err) => {
    const code = err?.code || '';
    if (code.includes('permission-denied'))
      return 'Permission denied. Check your Firestore security rules for the Prospect collection.';
    if (code.includes('failed-precondition'))
      return 'Missing Firestore index. Open the browser console for the auto-create link, or deploy firestore.indexes.json.';
    if (code.includes('unavailable') || code.includes('network'))
      return 'Network error. Check your connection and try again.';
    return err?.message || 'Could not save prospect. Please try again.';
  };

  const createProspectMutation = useMutation({
    mutationFn: (data) => api.entities.Prospect.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      toast.success('Prospect added successfully');
      resetForm();
    },
    onError: (err) => {
      console.error('[CRM] create failed:', err);
      toast.error(friendlyError(err));
    },
  });

  const updateProspectMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.Prospect.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      toast.success('Prospect updated');
      resetForm();
    },
    onError: (err) => {
      console.error('[CRM] update failed:', err);
      toast.error(friendlyError(err));
    },
  });

  const deleteProspectMutation = useMutation({
    mutationFn: (id) => api.entities.Prospect.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['prospects']);
      toast.success('Prospect deleted');
    },
    onError: (err) => {
      console.error('[CRM] delete failed:', err);
      toast.error(friendlyError(err));
    },
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
    new_lead: { label: 'New Lead', chip: 'bg-moss-50 text-moss-700 border-moss-100', icon: Target },
    contacted: { label: 'Contacted', chip: 'bg-moss-50 text-moss-700 border-moss-100', icon: Phone },
    qualified: { label: 'Qualified', chip: 'bg-fresh-50 text-moss-700 border-fresh-200', icon: CheckCircle2 },
    proposal: { label: 'Proposal', chip: 'bg-yolk-50 text-yolk-700 border-yolk-200', icon: TrendingUp },
    negotiation: { label: 'Negotiation', chip: 'bg-yolk-50 text-yolk-700 border-yolk-200', icon: DollarSign },
    won: { label: 'Won', chip: 'bg-moss-800 text-cream border-moss-800', icon: Award },
    lost: { label: 'Lost', chip: 'bg-cream-deep text-ink/60 border-border', icon: AlertCircle }
  };

  const priorityColors = {
    low: 'bg-cream-deep text-ink/70 border-border',
    medium: 'bg-moss-50 text-moss-800 border-moss-100',
    high: 'bg-yolk-50 text-yolk-700 border-yolk-200',
    urgent: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100'
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  const userTier = sellerTiers.find(t => t.name === (user?.seller_tier || 'basic'));
  const maxProspects = userTier?.max_prospects || 50;
  const statusCounts = prospects.reduce((acc, p) => { acc[p.status] = (acc[p.status] || 0) + 1; return acc; }, {});
  const cols = 'md:grid-cols-[minmax(0,1.8fr)_minmax(0,1.3fr)_120px_100px_130px_44px]';
  const tabCls = 'rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream';
  const hasFilters = !!searchQuery || statusFilter !== 'all' || priorityFilter !== 'all';

  return (
    <PageShell
      variant="compact"
      eyebrow="Sell"
      title="Customers"
      subtitle={`Manage prospects and follow-ups. ${prospects.length} of ${maxProspects} prospects used on your ${(user?.seller_tier || 'basic')} tier.`}
      action={
        <Button onClick={() => setShowForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5">
          <Plus className="w-4 h-4" /> Add prospect
        </Button>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Users} label="Total prospects" value={stats.total} deltaLabel={`${stats.new_leads} new leads`} tint="moss" />
            <StatCard icon={CheckCircle2} label="Qualified" value={stats.qualified} deltaLabel={`${stats.won} won`} tint="sage" />
            <StatCard icon={DollarSign} label="Pipeline value" value={`R${stats.total_value.toLocaleString()}`} tint="yolk" />
            <StatCard icon={Clock} label="Overdue follow-ups" value={stats.overdue} tint="terracotta" />
          </>
        )}
      </div>

      <Tabs defaultValue="list" className="space-y-5">
        <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
          <TabsTrigger value="list" className={tabCls}>List</TabsTrigger>
          <TabsTrigger value="pipeline" className={tabCls}>Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Toolbar */}
          <div className="card-premium p-3 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[['all', 'All'], ...Object.entries(statusConfig).map(([k, v]) => [k, v.label])].map(([value, label]) => {
                const on = statusFilter === value;
                const n = value === 'all' ? prospects.length : (statusCounts[value] || 0);
                return (
                  <button key={value} onClick={() => setStatusFilter(value)}
                    className={`whitespace-nowrap px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${on ? 'bg-moss-600 text-cream' : 'text-ink/65 hover:bg-moss-50 hover:text-moss-700'}`}>
                    {label} <span className={`ml-1 text-xs ${on ? 'text-cream/70' : 'text-ink/40'}`}>{n}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2 lg:ml-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input
                  placeholder="Search prospects…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-cream border border-border rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300"
                />
                {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-cream-deep flex items-center justify-center" aria-label="Clear search"><X className="w-3.5 h-3.5 text-ink/50" /></button>}
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36 rounded-xl bg-cream border-border">
                  <Filter className="w-3.5 h-3.5 mr-1.5 text-ink/45" />
                  <SelectValue placeholder="Priority" />
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
          </div>

          {/* Prospects List */}
          {isLoading ? (
            <div className="card-premium divide-y divide-border">{[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 animate-pulse"><div className="w-10 h-10 rounded-full bg-cream-deep" /><div className="flex-1 space-y-2"><div className="h-4 bg-cream-deep rounded w-1/3" /><div className="h-3 bg-cream-deep rounded w-1/5" /></div></div>
            ))}</div>
          ) : filteredProspects.length === 0 ? (
            <EmptyState icon={Users}
              title={hasFilters ? 'No prospects match' : 'No prospects yet'}
              subtitle={hasFilters ? 'Try a different filter or search term.' : 'Start building your customer pipeline.'}
              action={!hasFilters && (
                <Button onClick={() => setShowForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5">
                  <Plus className="w-4 h-4" /> Add first prospect
                </Button>
              )} />
          ) : (
            <div className="card-premium overflow-hidden">
              <div className={`hidden md:grid ${cols} items-center gap-4 px-5 py-3 bg-cream border-b border-border text-[11px] uppercase tracking-wider font-semibold text-ink/50`}>
                <span>Prospect</span><span>Contact</span><span>Status</span><span>Value</span><span>Follow-up</span><span />
              </div>
              <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.04 } } }} className="divide-y divide-border">
                {filteredProspects.map((prospect) => {
                  const cfg = statusConfig[prospect.status] || statusConfig.new_lead;
                  const StatusIcon = cfg.icon || Target;
                  const isOverdue = prospect.next_follow_up && new Date(prospect.next_follow_up) < new Date();
                  const open = expandedId === prospect.id;
                  const initials = (prospect.full_name || '?').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase();

                  return (
                    <motion.li key={prospect.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className={`${open ? 'bg-moss-50/30' : 'hover:bg-cream/70'} transition-colors`}>
                      <div className={`grid grid-cols-1 ${cols} gap-2 md:gap-4 md:items-center px-4 md:px-5 py-3.5`}>
                        <button type="button" onClick={() => setExpandedId(open ? null : prospect.id)} className="flex items-center gap-3 min-w-0 text-left">
                          <div className="w-10 h-10 rounded-full bg-moss-gradient text-cream text-xs font-semibold flex items-center justify-center flex-shrink-0">{initials}</div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{prospect.full_name}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-ink/55">
                              {prospect.company && <span className="inline-flex items-center gap-1 truncate"><Building2 className="w-3 h-3" />{prospect.company}</span>}
                              <span className={`capitalize inline-flex px-2 py-0.5 rounded-full border text-[10px] font-medium ${priorityColors[prospect.priority] || priorityColors.medium}`}>{prospect.priority}</span>
                              <span className={`md:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${cfg.chip}`}><StatusIcon className="w-2.5 h-2.5" />{cfg.label}</span>
                            </div>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-ink/40 ml-auto md:hidden transition-transform ${open ? 'rotate-180' : ''}`} />
                        </button>

                        <div className="min-w-0 text-xs text-ink/65 space-y-0.5">
                          {prospect.email && <a href={`mailto:${prospect.email}`} className="flex items-center gap-1.5 hover:text-moss-700 truncate"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{prospect.email}</a>}
                          {prospect.phone && <a href={`tel:${prospect.phone}`} className="flex items-center gap-1.5 hover:text-moss-700"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{prospect.phone}</a>}
                          {!prospect.email && !prospect.phone && <span className="text-ink/40">No contact details</span>}
                        </div>

                        <span className={`hidden md:inline-flex items-center gap-1 w-fit px-2.5 py-1 rounded-full border text-[11px] font-medium ${cfg.chip}`}><StatusIcon className="w-3 h-3" />{cfg.label}</span>

                        <span className="hidden md:block font-display font-bold text-ink tabular-nums">{prospect.estimated_value > 0 ? `R${prospect.estimated_value.toLocaleString()}` : <span className="text-ink/35 font-normal">—</span>}</span>

                        <div className="flex md:block items-center gap-2 text-xs">
                          <span className="md:hidden text-[10px] uppercase tracking-wider font-semibold text-ink/40">Follow-up</span>
                          {prospect.next_follow_up ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${isOverdue ? 'bg-terracotta-50 text-terracotta-700' : 'bg-cream text-ink/65'}`}>
                              <Calendar className="w-3 h-3" />{moment(prospect.next_follow_up).format('MMM D, h:mm A')}{isOverdue && ' · overdue'}
                            </span>
                          ) : <span className="text-ink/40">—</span>}
                          {prospect.estimated_value > 0 && <span className="md:hidden ml-auto font-display font-bold text-ink">R{prospect.estimated_value.toLocaleString()}</span>}
                        </div>

                        <div className="flex items-center md:justify-end gap-1">
                          <button type="button" onClick={() => setExpandedId(open ? null : prospect.id)} className="hidden md:inline-flex w-8 h-8 rounded-lg items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Toggle details">
                            <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700" aria-label="Prospect actions"><MoreHorizontal className="w-4 h-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl w-52">
                              <DropdownMenuItem onSelect={() => handleEdit(prospect)} className="gap-2"><Edit className="w-4 h-4" /> Edit prospect</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => { setExpandedId(prospect.id); setShowInteractionForm(prospect.id); }} className="gap-2"><MessageSquarePlus className="w-4 h-4" /> Log interaction</DropdownMenuItem>
                              {prospect.email && <DropdownMenuItem asChild><a href={`mailto:${prospect.email}`} className="gap-2"><Mail className="w-4 h-4" /> Email</a></DropdownMenuItem>}
                              {prospect.phone && <DropdownMenuItem asChild><a href={`tel:${prospect.phone}`} className="gap-2"><Phone className="w-4 h-4" /> Call</a></DropdownMenuItem>}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onSelect={() => deleteProspectMutation.mutate(prospect.id)} className="gap-2 text-terracotta-600 focus:text-terracotta-600"><Trash2 className="w-4 h-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {open && (
                        <div className="px-4 md:px-5 pb-5 md:pl-[4.75rem]">
                          <div className="rounded-2xl border border-border bg-white p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                              <div className="rounded-xl bg-cream px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wider text-ink/45">Location</p>
                                <p className="text-ink flex items-center gap-1.5 mt-0.5"><MapPin className="w-3.5 h-3.5 text-ink/45" />{[prospect.city, prospect.province].filter(Boolean).join(', ') || '—'}</p>
                              </div>
                              <div className="rounded-xl bg-cream px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wider text-ink/45">Source</p>
                                <p className="text-ink capitalize mt-0.5">{prospect.source?.replace('_', ' ') || '—'}</p>
                              </div>
                              <div className="rounded-xl bg-cream px-3 py-2">
                                <p className="text-[11px] uppercase tracking-wider text-ink/45">Interest</p>
                                <p className="text-ink mt-0.5 line-clamp-2">{prospect.interest || '—'}</p>
                              </div>
                            </div>
                            {prospect.notes && <p className="text-sm text-ink/70 leading-relaxed">{prospect.notes}</p>}

                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-ink">Recent interactions</p>
                                {showInteractionForm !== prospect.id && (
                                  <Button variant="outline" size="sm" className="rounded-full h-8 text-xs gap-1" onClick={() => setShowInteractionForm(prospect.id)}>
                                    <Plus className="w-3.5 h-3.5" /> Log interaction
                                  </Button>
                                )}
                              </div>
                              {prospect.interactions && prospect.interactions.length > 0 ? (
                                <ol className="relative border-l border-border ml-1.5 space-y-3">
                                  {prospect.interactions.slice(-3).reverse().map((interaction, idx) => (
                                    <li key={idx} className="pl-4 relative">
                                      <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-moss-600 border-2 border-white" />
                                      <p className="text-xs text-ink/55"><span className="font-medium text-ink capitalize">{interaction.type}</span> · {moment(interaction.date).format('MMM D, h:mm A')}</p>
                                      <p className="text-sm text-ink/75 mt-0.5">{interaction.notes}</p>
                                    </li>
                                  ))}
                                </ol>
                              ) : showInteractionForm !== prospect.id && <p className="text-xs text-ink/45">No interactions logged yet.</p>}
                            </div>

                            {showInteractionForm === prospect.id && (
                              <div className="p-4 bg-cream rounded-xl border border-border space-y-3">
                                <Select value={newInteraction.type} onValueChange={(val) => setNewInteraction({ ...newInteraction, type: val })}>
                                  <SelectTrigger className="rounded-xl bg-white">
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
                                  className="rounded-xl bg-white"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" className="btn-cta px-4" onClick={() => handleAddInteraction(prospect)}>Save</Button>
                                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowInteractionForm(null)}>Cancel</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.li>
                  );
                })}
              </motion.ul>
              <div className="px-5 py-3 bg-cream border-t border-border text-xs text-ink/50">{filteredProspects.length} of {prospects.length} prospects</div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipeline">
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 snap-x">
            {pipelineView.map((stage) => {
              const StageIcon = stage.icon;
              const value = stage.prospects.reduce((s, p) => s + (p.estimated_value || 0), 0);
              return (
                <div key={stage.status} className="card-premium p-3 w-64 flex-shrink-0 snap-start">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg border ${stage.chip}`}><StageIcon className="w-3.5 h-3.5" /></span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm text-ink">{stage.label}</h3>
                      <p className="text-[11px] text-ink/50">{stage.prospects.length} · R{value.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="space-y-2 min-h-[4rem]">
                    {stage.prospects.length === 0 && <div className="rounded-xl border border-dashed border-border p-3 text-center text-xs text-ink/40">Empty</div>}
                    {stage.prospects.map((prospect) => (
                      <button
                        type="button"
                        key={prospect.id}
                        className="w-full text-left p-3 bg-cream border border-border rounded-xl hover:border-moss-300 hover:bg-white transition-colors"
                        onClick={() => handleEdit(prospect)}
                      >
                        <p className="font-medium text-sm text-ink truncate">{prospect.full_name}</p>
                        {prospect.company && <p className="text-xs text-ink/55 truncate">{prospect.company}</p>}
                        <div className="flex items-center justify-between mt-1.5">
                          <span className={`capitalize inline-flex px-2 py-0.5 rounded-full border text-[10px] font-medium ${priorityColors[prospect.priority] || priorityColors.medium}`}>{prospect.priority}</span>
                          {prospect.estimated_value > 0 && <span className="text-xs font-display font-bold text-ink">R{prospect.estimated_value.toLocaleString()}</span>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Form */}
      <Dialog open={showForm} onOpenChange={resetForm}>
        <DialogContent className="rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingProspect ? 'Edit prospect' : 'Add new prospect'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Full Name *</Label>
                <Input className="mt-1.5 rounded-xl"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input className="mt-1.5 rounded-xl"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <Input className="mt-1.5 rounded-xl"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+27 12 345 6789"
                />
              </div>
              <div>
                <Label>Company</Label>
                <Input className="mt-1.5 rounded-xl"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Province</Label>
                <Input className="mt-1.5 rounded-xl"
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  placeholder="Gauteng"
                />
              </div>
              <div>
                <Label>City</Label>
                <Input className="mt-1.5 rounded-xl"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Johannesburg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger className="mt-1.5 rounded-xl">
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
                  <SelectTrigger className="mt-1.5 rounded-xl">
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
                  <SelectTrigger className="mt-1.5 rounded-xl">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Interest/Need</Label>
                <Input className="mt-1.5 rounded-xl"
                  value={formData.interest}
                  onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                  placeholder="e.g., Chickens for farm"
                />
              </div>
              <div>
                <Label>Estimated Value (R)</Label>
                <Input className="mt-1.5 rounded-xl"
                  type="number"
                  value={formData.estimated_value}
                  onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <Label>Next Follow-up</Label>
              <Input className="mt-1.5 rounded-xl"
                type="datetime-local"
                value={formData.next_follow_up ? formData.next_follow_up.slice(0, 16) : ''}
                onChange={(e) => setFormData({ ...formData, next_follow_up: new Date(e.target.value).toISOString() })}
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea className="mt-1.5 rounded-xl"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this prospect..."
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" className="rounded-full" onClick={resetForm}>Cancel</Button>
            <Button onClick={handleSave} disabled={createProspectMutation.isPending || updateProspectMutation.isPending} className="btn-cta px-5">
              {(createProspectMutation.isPending || updateProspectMutation.isPending) ? 'Saving…' : `${editingProspect ? 'Update' : 'Add'} prospect`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
