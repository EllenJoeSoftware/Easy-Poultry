import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, CheckCircle2, AlertCircle, Loader2, Syringe, Bird, Wallet, CalendarClock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import moment from 'moment';

const listVariants = { show: { transition: { staggerChildren: 0.05 } } };
const rowVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };
const tabCls = 'rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream';

export default function VaccinationManagement() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    batch_id: '',
    vaccine_id: '',
    vaccination_date: moment().format('YYYY-MM-DD'),
    birds_vaccinated: '',
    cost: '',
    administered_by: '',
    notes: '',
    status: 'completed'
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

  const { data: batches = [] } = useQuery({
    queryKey: ['batches-vac'],
    queryFn: () => api.entities.PoultryBatch.filter({ created_by: user?.email, status: 'active' }),
    enabled: !!user
  });

  const { data: vaccines = [] } = useQuery({
    queryKey: ['vaccines'],
    queryFn: () => api.entities.VaccineType.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const { data: events = [] } = useQuery({
    queryKey: ['vaccination-events'],
    queryFn: () => api.entities.VaccinationEvent.filter({ created_by: user?.email }, '-vaccination_date'),
    enabled: !!user
  });

  const createEventMutation = useMutation({
    mutationFn: async (data) => {
      const batch = batches.find(b => b.id === data.batch_id);
      const vaccine = vaccines.find(v => v.id === data.vaccine_id);
      const batchAgeDays = moment().diff(moment(batch.date_acquired), 'days');
      
      await api.entities.VaccinationEvent.create({
        ...data,
        batch_name: batch.batch_name,
        vaccine_name: vaccine.name,
        batch_age_days: batchAgeDays,
        birds_vaccinated: parseInt(data.birds_vaccinated),
        cost: parseFloat(data.cost || 0)
      });

      // Update batch vaccine cost
      if (data.cost) {
        await api.entities.PoultryBatch.update(data.batch_id, {
          total_vaccine_cost: (batch.total_vaccine_cost || 0) + parseFloat(data.cost)
        });
      }
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['vaccination-events']);
      queryClient.invalidateQueries(['batches-vac']);
      toast.success('Vaccination recorded');
      resetForm();
    }
  });

  const resetForm = () => {
    setEventFormData({
      batch_id: '',
      vaccine_id: '',
      vaccination_date: moment().format('YYYY-MM-DD'),
      birds_vaccinated: '',
      cost: '',
      administered_by: '',
      notes: '',
      status: 'completed'
    });
    setShowEventForm(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!eventFormData.batch_id || !eventFormData.vaccine_id) {
      toast.error('Please select batch and vaccine');
      return;
    }
    createEventMutation.mutate(eventFormData);
  };

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const completedEvents = events.filter(e => e.status === 'completed');
  const scheduledEvents = events.filter(e => e.status === 'scheduled');
  const overdueEvents = scheduledEvents.filter(e => e.due_date && moment(e.due_date).isBefore(moment(), 'day'));
  const upcomingEvents = scheduledEvents.filter(e => e.due_date && !moment(e.due_date).isBefore(moment(), 'day') && moment(e.due_date).diff(moment(), 'days') <= 14);
  const birdsCovered = completedEvents.reduce((s, e) => s + (e.birds_vaccinated || 0), 0);
  const totalCost = completedEvents.reduce((s, e) => s + (e.cost || 0), 0);

  return (
    <PageShell
      variant="compact"
      eyebrow="Farm"
      title="Vaccinations"
      subtitle="Keep every batch protected — log vaccinations and see what is due next."
      breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Vaccinations' }]}
      action={<Button onClick={() => setShowEventForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Record vaccination</Button>}
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Syringe} label="Vaccinations logged" value={completedEvents.length} tint="moss" />
        <StatCard icon={Bird} label="Birds covered" value={birdsCovered.toLocaleString()} deltaLabel="across all records" tint="sage" />
        <StatCard icon={CalendarClock} label="Scheduled" value={scheduledEvents.length} deltaLabel={overdueEvents.length ? `${overdueEvents.length} overdue` : 'none overdue'} tint={overdueEvents.length ? 'terracotta' : 'yolk'} />
        <StatCard icon={Wallet} label="Vaccine spend" value={`R${Math.round(totalCost).toLocaleString()}`} tint="yolk" />
      </div>

      {(overdueEvents.length > 0 || upcomingEvents.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {overdueEvents.length > 0 && (
            <div className="rounded-2xl bg-terracotta-50 border border-terracotta-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-terracotta-200 flex items-center justify-center text-terracotta-600"><AlertCircle className="w-5 h-5" /></div>
                <div><p className="eyebrow text-terracotta-600">Overdue</p><p className="font-display text-lg text-ink leading-snug">{overdueEvents.length} vaccination{overdueEvents.length === 1 ? '' : 's'} past due</p></div>
              </div>
              <ul className="space-y-1.5">
                {overdueEvents.slice(0, 4).map(ev => (
                  <li key={ev.id} className="flex items-center justify-between text-sm bg-white/70 rounded-xl px-3 py-2">
                    <span className="font-medium text-ink truncate">{ev.vaccine_name}<span className="text-ink/50 font-normal"> · {ev.batch_name}</span></span>
                    <span className="text-terracotta-600 font-semibold flex-shrink-0">{moment(ev.due_date).fromNow()}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {upcomingEvents.length > 0 && (
            <div className="rounded-2xl bg-yolk-50 border border-yolk-200 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-yolk-200 flex items-center justify-center text-yolk-600"><CalendarClock className="w-5 h-5" /></div>
                <div><p className="eyebrow text-yolk-700">Coming up</p><p className="font-display text-lg text-ink leading-snug">{upcomingEvents.length} due in the next 14 days</p></div>
              </div>
              <ul className="space-y-1.5">
                {upcomingEvents.slice(0, 4).map(ev => (
                  <li key={ev.id} className="flex items-center justify-between text-sm bg-white/70 rounded-xl px-3 py-2">
                    <span className="font-medium text-ink truncate">{ev.vaccine_name}<span className="text-ink/50 font-normal"> · {ev.batch_name}</span></span>
                    <span className="text-yolk-700 font-semibold flex-shrink-0">{moment(ev.due_date).format('D MMM')}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="completed" className="space-y-6">
        <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex">
          <TabsTrigger value="completed" className={tabCls}>Completed ({completedEvents.length})</TabsTrigger>
          <TabsTrigger value="scheduled" className={tabCls}>Scheduled ({scheduledEvents.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="completed">
          {completedEvents.length === 0 ? (
            <EmptyState icon={Syringe} title="No vaccination records yet" subtitle="Log each vaccination as you do it and the history for every batch builds up here." action={<Button onClick={() => setShowEventForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Record vaccination</Button>} />
          ) : (
            <section className="card-premium p-6">
              <motion.ol initial="hidden" animate="show" variants={listVariants} className="relative">
                <div className="absolute left-[1.1rem] top-3 bottom-3 w-px bg-border" aria-hidden />
                {completedEvents.map((event, idx) => {
                  const prev = completedEvents[idx - 1];
                  const showMonth = !prev || moment(prev.vaccination_date).format('YYYY-MM') !== moment(event.vaccination_date).format('YYYY-MM');
                  return (
                    <React.Fragment key={event.id}>
                      {showMonth && <li className="relative pl-12 pt-1 pb-2 first:pt-0"><span className="eyebrow">{moment(event.vaccination_date).format('MMMM YYYY')}</span></li>}
                      <motion.li variants={rowVariants} className="relative flex gap-4 pb-4 last:pb-0">
                        <div className="relative z-10 w-9 h-9 rounded-full bg-moss-600 text-cream flex items-center justify-center flex-shrink-0 border-2 border-white"><CheckCircle2 className="w-4 h-4" /></div>
                        <div className="flex-1 min-w-0 rounded-xl bg-cream p-3.5 hover:bg-cream-deep/60 transition-colors">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div className="min-w-0">
                              <p className="font-semibold text-ink leading-snug">{event.vaccine_name}</p>
                              <p className="text-xs text-ink/55 mt-0.5">{moment(event.vaccination_date).format('ddd, D MMM YYYY')} · <span className="text-moss-700 font-medium">{event.batch_name}</span></p>
                            </div>
                            {event.cost > 0 && <span className="font-semibold text-ink tabular-nums text-sm">R{Number(event.cost).toLocaleString()}</span>}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            <span className="chip inline-flex items-center gap-1"><Bird className="w-3 h-3" />{event.birds_vaccinated} birds</span>
                            <span className="chip bg-cream-deep text-ink/60 border-border">Day {event.batch_age_days}</span>
                            {event.administered_by && <span className="chip bg-cream-deep text-ink/60 border-border inline-flex items-center gap-1"><User className="w-3 h-3" />{event.administered_by}</span>}
                          </div>
                          {event.notes && <p className="text-sm text-ink/60 italic mt-2">{event.notes}</p>}
                        </div>
                      </motion.li>
                    </React.Fragment>
                  );
                })}
              </motion.ol>
            </section>
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          {scheduledEvents.length === 0 ? (
            <EmptyState icon={Calendar} title="No scheduled vaccinations" subtitle="Scheduled doses with a due date will appear here with overdue and upcoming reminders." />
          ) : (
            <section className="card-premium overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2.5 bg-cream text-[11px] uppercase tracking-wider text-ink/50 font-semibold">
                <span className="col-span-5">Vaccine</span><span className="col-span-3">Batch</span><span className="col-span-2">Due</span><span className="col-span-2 text-right">Status</span>
              </div>
              <motion.ul initial="hidden" animate="show" variants={listVariants} className="divide-y divide-border">
                {scheduledEvents.map(event => {
                  const overdue = event.due_date && moment(event.due_date).isBefore(moment(), 'day');
                  return (
                    <motion.li key={event.id} variants={rowVariants} className="px-6 py-3 grid grid-cols-2 md:grid-cols-12 gap-1 md:gap-3 md:items-center hover:bg-cream/70">
                      <div className="col-span-2 md:col-span-5 min-w-0 flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-terracotta-50 text-terracotta-600' : 'bg-yolk-50 text-yolk-600'}`}><AlertCircle className="w-4 h-4" /></div>
                        <div className="min-w-0"><p className="font-medium text-ink truncate">{event.vaccine_name}</p><p className="md:hidden text-xs text-ink/55">{event.batch_name}</p></div>
                      </div>
                      <p className="hidden md:block md:col-span-3 text-sm text-ink/70 truncate">{event.batch_name}</p>
                      <p className="md:col-span-2 text-sm text-ink/60">{event.due_date ? moment(event.due_date).format('D MMM YYYY') : '—'}</p>
                      <p className="md:col-span-2 md:text-right"><span className={`chip ${overdue ? 'bg-terracotta-50 text-terracotta-600 border-terracotta-200' : 'bg-yolk-50 text-yolk-700 border-yolk-200'}`}>{overdue ? 'Overdue' : 'Scheduled'}</span></p>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </section>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showEventForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Record vaccination</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Batch *</Label>
              <Select value={eventFormData.batch_id} onValueChange={(value) => setEventFormData({ ...eventFormData, batch_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch" />
                </SelectTrigger>
                <SelectContent>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>
                      {batch.batch_name} ({batch.current_quantity} birds)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Vaccine *</Label>
              <Select value={eventFormData.vaccine_id} onValueChange={(value) => setEventFormData({ ...eventFormData, vaccine_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vaccine" />
                </SelectTrigger>
                <SelectContent>
                  {vaccines.map(vaccine => (
                    <SelectItem key={vaccine.id} value={vaccine.id}>
                      {vaccine.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {vaccines.length === 0 && <p className="text-xs text-ink/55 mt-1">No vaccine types set up yet.</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={eventFormData.vaccination_date}
                  onChange={(e) => setEventFormData({ ...eventFormData, vaccination_date: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Birds Vaccinated *</Label>
                <Input
                  type="number"
                  value={eventFormData.birds_vaccinated}
                  onChange={(e) => setEventFormData({ ...eventFormData, birds_vaccinated: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cost (R)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={eventFormData.cost}
                  onChange={(e) => setEventFormData({ ...eventFormData, cost: e.target.value })}
                />
              </div>
              <div>
                <Label>Administered By</Label>
                <Input
                  value={eventFormData.administered_by}
                  onChange={(e) => setEventFormData({ ...eventFormData, administered_by: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={eventFormData.notes}
                onChange={(e) => setEventFormData({ ...eventFormData, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={resetForm}>Cancel</Button>
              <Button type="submit" disabled={createEventMutation.isPending} className="btn-cta px-5">Record</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
