import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Loader2, Plus, Thermometer, Droplets, RotateCw, Calendar, TrendingUp, Egg, MoreHorizontal, Eye, Edit, CheckCircle2, Sparkles, LayoutGrid } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { StatSkeleton } from '@/components/shell/SkeletonCard';
import { createPageUrl } from '../utils';
import { fetchForUserAndFarms, farmStamp } from '@/lib/farm';
import { toast } from 'sonner';
import moment from 'moment';

export default function IncubationManagement() {
  const [user, setUser] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingIncubation, setEditingIncubation] = useState(null);
  const [formData, setFormData] = useState({
    batch_name: '',
    egg_count: '',
    breed: '',
    incubation_start_date: moment().format('YYYY-MM-DD'),
    incubation_days: 21,
    temperature_celsius: 37.5,
    humidity_percent: 55,
    turned_times_per_day: 3,
    incubator_type: '',
    notes: ''
  });

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

  const { data: incubations = [], isLoading } = useQuery({
    queryKey: ['incubations', user?.email],
    queryFn: () => fetchForUserAndFarms(api.entities.EggIncubation, user, 'incubation_start_date'),
    enabled: !!user
  });

  // Coerce form strings to the Firestore schema (numbers, derived dates, no undefined)
  const normalize = (data, existing) => {
    const num = (v, d = 0) => { const n = parseFloat(v); return Number.isFinite(n) ? n : d; };
    const int = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
    const egg_count = int(data.egg_count, existing?.egg_count || 0);
    const incubation_days = int(data.incubation_days, existing?.incubation_days || 21);
    const incubation_start_date = data.incubation_start_date || existing?.incubation_start_date || moment().format('YYYY-MM-DD');
    const eggs_hatched = int(data.eggs_hatched, existing?.eggs_hatched || 0);
    const eggs_infertile = int(data.eggs_infertile, existing?.eggs_infertile || 0);
    const eggs_dead_in_shell = int(data.eggs_dead_in_shell, existing?.eggs_dead_in_shell || 0);
    const out = {
      batch_name: (data.batch_name || '').trim(),
      breed: data.breed || '',
      egg_count,
      incubation_start_date,
      incubation_days,
      expected_hatch_date: moment(incubation_start_date).add(incubation_days, 'days').format('YYYY-MM-DD'),
      temperature_celsius: num(data.temperature_celsius, 37.5),
      humidity_percent: num(data.humidity_percent, 55),
      turned_times_per_day: int(data.turned_times_per_day, 3),
      incubator_type: data.incubator_type || '',
      notes: data.notes || '',
      eggs_hatched,
      eggs_infertile,
      eggs_dead_in_shell,
      hatch_rate_percent: egg_count > 0 ? (eggs_hatched / egg_count) * 100 : 0,
      status: data.status || existing?.status || 'active',
    };
    if (data.actual_hatch_date) out.actual_hatch_date = data.actual_hatch_date;
    else if (out.status === 'completed') out.actual_hatch_date = existing?.actual_hatch_date || moment().format('YYYY-MM-DD');
    return out;
  };

  const createMutation = useMutation({
    mutationFn: async (data) => api.entities.EggIncubation.create({ ...normalize(data), ...(await farmStamp(user)), status: 'active' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['incubations']);
      toast.success('Incubation batch created successfully');
      resetForm();
    },
    onError: (e) => {
      console.error('[incubation.create]', e);
      toast.error(
        e?.code === 'permission-denied'
          ? 'Permission denied — check Firestore rules for EggIncubation'
          : (e?.message || 'Could not save incubation')
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.EggIncubation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incubations']);
      toast.success('Incubation batch updated');
      resetForm();
    },
    onError: (e) => {
      console.error('[incubation.update]', e);
      toast.error(e?.message || 'Update failed');
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingIncubation(null);
    setFormData({
      batch_name: '',
      egg_count: '',
      breed: '',
      incubation_start_date: moment().format('YYYY-MM-DD'),
      incubation_days: 21,
      temperature_celsius: 37.5,
      humidity_percent: 55,
      turned_times_per_day: 3,
      incubator_type: '',
      notes: ''
    });
  };

  const handleSubmit = () => {
    if (!formData.batch_name || !formData.egg_count) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingIncubation) {
      updateMutation.mutate({ id: editingIncubation.id, data: normalize(formData, editingIncubation) });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (incubation) => {
    setEditingIncubation(incubation);
    setFormData({
      batch_name: incubation.batch_name,
      egg_count: incubation.egg_count,
      breed: incubation.breed || '',
      incubation_start_date: incubation.incubation_start_date,
      incubation_days: incubation.incubation_days,
      temperature_celsius: incubation.temperature_celsius,
      humidity_percent: incubation.humidity_percent,
      turned_times_per_day: incubation.turned_times_per_day,
      incubator_type: incubation.incubator_type || '',
      notes: incubation.notes || '',
      eggs_hatched: incubation.eggs_hatched || 0,
      eggs_infertile: incubation.eggs_infertile || 0,
      eggs_dead_in_shell: incubation.eggs_dead_in_shell || 0,
      status: incubation.status,
      actual_hatch_date: incubation.actual_hatch_date || ''
    });
    setShowForm(true);
  };

  const calculateDaysRemaining = (expectedDate) => {
    return moment(expectedDate).diff(moment(), 'days');
  };

  const activeIncubations = incubations.filter(i => i.status === 'active' || i.status === 'hatching');
  const completedIncubations = incubations.filter(i => i.status === 'completed');

  const totalEggsIncubating = activeIncubations.reduce((sum, i) => sum + i.egg_count, 0);
  const avgHatchRate = completedIncubations.length > 0
    ? completedIncubations.reduce((sum, i) => sum + (i.hatch_rate_percent || 0), 0) / completedIncubations.length
    : 0;

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const statusChip = (status) => status === 'hatching'
    ? 'bg-terracotta-500 text-white border-0'
    : status === 'completed'
      ? 'bg-ink/70 text-cream border-0'
      : status === 'failed'
        ? 'bg-cream-deep text-ink/60 border-border'
        : 'bg-fresh-50 text-moss-700 border-fresh-200';

  const inputCls = 'w-full bg-cream border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300';

  const IncubationCard = ({ incubation }) => {
    const daysRemaining = calculateDaysRemaining(incubation.expected_hatch_date);
    const daysElapsed = moment().diff(moment(incubation.incubation_start_date), 'days');
    const progress = Math.min((daysElapsed / incubation.incubation_days) * 100, 100);
    const lockdown = incubation.incubation_days - daysElapsed <= 3;
    return (
      <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="card-premium p-5 flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display text-lg text-ink leading-snug truncate">{incubation.batch_name}</h3>
              <span className={`chip capitalize ${statusChip(incubation.status)}`}>
                {incubation.status === 'hatching' && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5" />}
                {incubation.status}
              </span>
            </div>
            <p className="text-xs text-ink/55 mt-0.5">{incubation.egg_count} eggs{incubation.breed ? ` · ${incubation.breed}` : ''}{incubation.incubator_type ? ` · ${incubation.incubator_type}` : ''}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-moss-50 hover:text-moss-700 flex-shrink-0" aria-label="Incubation actions"><MoreHorizontal className="w-4 h-4" /></button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-56">
              <DropdownMenuItem asChild><Link to={createPageUrl('IncubationDetail') + `?id=${incubation.id}`} className="gap-2"><Eye className="w-4 h-4" /> View details &amp; candling</Link></DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleEdit(incubation)} className="gap-2"><Edit className="w-4 h-4" /> Update batch</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleEdit(incubation)} className="gap-2"><Sparkles className="w-4 h-4 text-yolk-500" /> Record hatch results</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-ink/55 mb-1">
            <span>Day {Math.max(0, daysElapsed)} of {incubation.incubation_days}</span>
            <span className={daysRemaining <= 3 ? 'text-terracotta-600 font-semibold' : ''}>{daysRemaining > 0 ? `${daysRemaining} days to hatch` : 'Hatching soon!'}</span>
          </div>
          <div className="h-2 rounded-full bg-cream-deep overflow-hidden"><div className={`h-full rounded-full transition-all ${lockdown ? 'bg-terracotta-500' : 'bg-yolk-500'}`} style={{ width: `${progress}%` }} /></div>
          <div className="flex justify-between text-[11px] text-ink/50 mt-1">
            <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3" />Set {moment(incubation.incubation_start_date).format('D MMM')}</span>
            <span className="inline-flex items-center gap-1"><Egg className="w-3 h-3" />Hatch {moment(incubation.expected_hatch_date).format('D MMM')}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-xl bg-cream p-2.5 text-center"><Thermometer className="w-3.5 h-3.5 text-yolk-600 mx-auto mb-1" /><p className="font-display font-bold text-sm text-ink leading-none">{incubation.temperature_celsius}°C</p></div>
          <div className="rounded-xl bg-cream p-2.5 text-center"><Droplets className="w-3.5 h-3.5 text-moss-700 mx-auto mb-1" /><p className="font-display font-bold text-sm text-ink leading-none">{incubation.humidity_percent}%</p></div>
          <div className="rounded-xl bg-cream p-2.5 text-center"><RotateCw className="w-3.5 h-3.5 text-ink/50 mx-auto mb-1" /><p className="font-display font-bold text-sm text-ink leading-none">{incubation.turned_times_per_day}x/day</p></div>
        </div>

        {(incubation.egg_sources?.length > 0 || incubation.tray_placement?.length > 0) && (
          <div className="mt-4 space-y-2">
            {incubation.egg_sources?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {incubation.egg_sources.map((src, i) => (
                  <span key={i} className="chip !py-0.5 !px-2 text-[10px]" title={src.breed}>{src.batch_name || 'Batch'} · {src.egg_count}</span>
                ))}
              </div>
            )}
            {incubation.tray_placement?.length > 0 && (
              <p className="text-[11px] text-ink/55 inline-flex items-center gap-1"><LayoutGrid className="w-3 h-3" />
                {incubation.tray_placement.map(t => `R${t.row}C${t.column} T${t.tray} (${t.eggs})`).join(' · ')}
              </p>
            )}
          </div>
        )}

        <div className="mt-auto pt-4 flex gap-2">
          <Link to={createPageUrl('IncubationDetail') + `?id=${incubation.id}`} className="btn-ghost flex-1 justify-center border border-border bg-white py-2 text-sm">Details</Link>
          <button onClick={() => handleEdit(incubation)} className="btn-cta flex-1 justify-center py-2 text-sm">Update</button>
        </div>
      </motion.article>
    );
  };

  return (
    <PageShell
      variant="compact"
      eyebrow="Farm"
      title="Incubation"
      subtitle="Track every setting from egg to chick — day progress, candling checkpoints and hatch results."
      breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Incubation' }]}
      action={<Button onClick={() => setShowForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> New incubation</Button>}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {isLoading ? [...Array(4)].map((_, i) => <StatSkeleton key={i} />) : (
          <>
            <StatCard icon={Egg} label="Active settings" value={activeIncubations.length} tint="yolk" />
            <StatCard icon={Egg} label="Eggs incubating" value={totalEggsIncubating.toLocaleString()} tint="moss" />
            <StatCard icon={TrendingUp} label="Avg hatch rate" value={`${avgHatchRate.toFixed(1)}%`} deltaLabel="completed batches" tint="sage" />
            <StatCard icon={CheckCircle2} label="Completed" value={completedIncubations.length} tint="moss" />
          </>
        )}
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
          <TabsTrigger value="active" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Active ({activeIncubations.length})</TabsTrigger>
          <TabsTrigger value="completed" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Completed ({completedIncubations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{[...Array(3)].map((_, i) => <div key={i} className="card-premium h-72 animate-pulse" />)}</div>
          ) : activeIncubations.length === 0 ? (
            <EmptyState icon={Egg} title="No active incubations" subtitle="Set your first batch of eggs and we will track the days to hatch, candling checkpoints and results." action={<Button onClick={() => setShowForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Start incubation</Button>} />
          ) : (
            <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeIncubations.map(incubation => <IncubationCard key={incubation.id} incubation={incubation} />)}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedIncubations.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="No completed incubations" subtitle="Once a batch hatches and you record results, it will be kept here with its hatch rate." />
          ) : (
            <section className="card-premium overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2.5 bg-cream text-[11px] uppercase tracking-wider text-ink/50 font-semibold">
                <span className="col-span-4">Batch</span><span className="col-span-2">Set</span><span className="col-span-2">Hatched</span><span className="col-span-2">Eggs</span><span className="col-span-2 text-right">Hatch rate</span>
              </div>
              <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="divide-y divide-border">
                {completedIncubations.map(incubation => (
                  <motion.li key={incubation.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="px-6 py-3 grid grid-cols-2 md:grid-cols-12 gap-1 md:gap-3 md:items-center hover:bg-cream/70">
                    <div className="col-span-2 md:col-span-4 min-w-0">
                      <Link to={createPageUrl('IncubationDetail') + `?id=${incubation.id}`} className="font-medium text-ink hover:text-moss-700 truncate block">{incubation.batch_name}</Link>
                      <p className="text-xs text-ink/55">{incubation.breed || 'Mixed'}</p>
                    </div>
                    <p className="md:col-span-2 text-xs md:text-sm text-ink/60"><span className="md:hidden text-ink/40">Set </span>{moment(incubation.incubation_start_date).format('D MMM YYYY')}</p>
                    <p className="md:col-span-2 text-xs md:text-sm text-ink/60 text-right md:text-left"><span className="md:hidden text-ink/40">Hatched </span>{incubation.actual_hatch_date ? moment(incubation.actual_hatch_date).format('D MMM YYYY') : '—'}</p>
                    <p className="md:col-span-2 text-sm text-ink/70"><span className="font-semibold text-moss-700">{incubation.eggs_hatched || 0}</span> of {incubation.egg_count}</p>
                    <p className="md:col-span-2 text-right font-display font-bold text-ink tabular-nums">{(incubation.hatch_rate_percent || 0).toFixed(1)}%</p>
                  </motion.li>
                ))}
              </motion.ul>
            </section>
          )}
        </TabsContent>
      </Tabs>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editingIncubation ? 'Update incubation' : 'New incubation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Batch Name *</Label>
                <Input
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  placeholder="e.g., Spring 2024 Batch"
                />
              </div>
              <div>
                <Label>Number of Eggs *</Label>
                <Input
                  type="number"
                  value={formData.egg_count}
                  onChange={(e) => setFormData({ ...formData, egg_count: parseInt(e.target.value) || '' })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Breed</Label>
                <Input
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="e.g., Rhode Island Red"
                />
              </div>
              <div>
                <Label>Incubator Type</Label>
                <Input
                  value={formData.incubator_type}
                  onChange={(e) => setFormData({ ...formData, incubator_type: e.target.value })}
                  placeholder="e.g., Automatic turner"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.incubation_start_date}
                  onChange={(e) => setFormData({ ...formData, incubation_start_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Incubation Days</Label>
                <Input
                  type="number"
                  value={formData.incubation_days}
                  onChange={(e) => setFormData({ ...formData, incubation_days: parseInt(e.target.value) || 21 })}
                />
                <p className="text-xs text-ink/55 mt-1">Expected hatch {moment(formData.incubation_start_date).add(formData.incubation_days, 'days').format('D MMM YYYY')}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-cream border border-border p-4">
              <p className="eyebrow mb-3">Incubator settings</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="inline-flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-yolk-600" /> Temp (°C)</Label>
                  <input
                    type="number"
                    step="0.1"
                    className={inputCls}
                    value={formData.temperature_celsius}
                    onChange={(e) => setFormData({ ...formData, temperature_celsius: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="inline-flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-moss-700" /> Humidity (%)</Label>
                  <input
                    type="number"
                    className={inputCls}
                    value={formData.humidity_percent}
                    onChange={(e) => setFormData({ ...formData, humidity_percent: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label className="inline-flex items-center gap-1"><RotateCw className="w-3.5 h-3.5 text-ink/50" /> Turns/day</Label>
                  <input
                    type="number"
                    className={inputCls}
                    value={formData.turned_times_per_day}
                    onChange={(e) => setFormData({ ...formData, turned_times_per_day: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            {editingIncubation && (
              <div className="rounded-2xl bg-yolk-50 border border-yolk-200 p-4 space-y-4">
                <p className="eyebrow text-yolk-700">Hatch results</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Hatched</Label>
                    <input
                      type="number"
                      className={inputCls}
                      value={formData.eggs_hatched || 0}
                      onChange={(e) => {
                        const hatched = parseInt(e.target.value) || 0;
                        const infertile = formData.eggs_infertile || 0;
                        const dead = formData.eggs_dead_in_shell || 0;
                        const hatchRate = editingIncubation.egg_count > 0
                          ? (hatched / editingIncubation.egg_count) * 100
                          : 0;
                        setFormData({
                          ...formData,
                          eggs_hatched: hatched,
                          hatch_rate_percent: hatchRate
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label>Infertile</Label>
                    <input
                      type="number"
                      className={inputCls}
                      value={formData.eggs_infertile || 0}
                      onChange={(e) => setFormData({ ...formData, eggs_infertile: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <Label>Dead in Shell</Label>
                    <input
                      type="number"
                      className={inputCls}
                      value={formData.eggs_dead_in_shell || 0}
                      onChange={(e) => setFormData({ ...formData, eggs_dead_in_shell: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="bg-white rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="hatching">Hatching</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Actual Hatch Date</Label>
                    <input
                      type="date"
                      className={inputCls}
                      value={formData.actual_hatch_date || ''}
                      onChange={(e) => setFormData({ ...formData, actual_hatch_date: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="rounded-full" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="btn-cta px-5"
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {editingIncubation ? 'Update' : 'Create'} batch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
