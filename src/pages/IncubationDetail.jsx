import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, Egg, CheckCircle2, AlertTriangle, Eye, Thermometer, Droplets, Calendar, RotateCw, Plus, X, ImagePlus, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import moment from 'moment';

const candlingSchedule = [
  {
    day: 7,
    title: 'First Candling',
    description: 'Check for blood vessels and embryo development',
    guidance: 'Look for a dark spot (embryo) with visible blood vessels radiating from it. Clear eggs are infertile.',
    imageUrl: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400'
  },
  {
    day: 14,
    title: 'Second Candling',
    description: 'Verify continued growth and check air cell',
    guidance: 'The embryo should fill more space. Air cell at wide end should be visible and growing.',
    imageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400'
  },
  {
    day: 18,
    title: 'Final Candling',
    description: 'Stop turning, increase humidity - lockdown phase',
    guidance: 'Egg should be mostly dark except for the air cell. Do not open incubator after this point.',
    imageUrl: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?w=400'
  }
];

const inputCls = 'w-full bg-cream border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300';

export default function IncubationDetail() {
  const [user, setUser] = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [logFormData, setLogFormData] = useState({
    day_number: '',
    temperature_celsius: 37.5,
    humidity_percent: 55,
    eggs_turned: true,
    candling_performed: false,
    candling_results: '',
    candling_image_url: '',
    eggs_removed: 0,
    notes: ''
  });

  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const incubationId = urlParams.get('id');

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

  const { data: incubation, isLoading } = useQuery({
    queryKey: ['incubation', incubationId],
    queryFn: () => api.entities.EggIncubation.filter({ id: incubationId }),
    enabled: !!user && !!incubationId,
    select: (data) => data[0]
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['incubation-logs', incubationId],
    queryFn: () => api.entities.IncubationLog.filter({ incubation_id: incubationId }, 'day_number'),
    enabled: !!incubationId
  });

  const createLogMutation = useMutation({
    mutationFn: (data) => {
      const day_number = parseInt(data.day_number, 10) || 1;
      const logDate = moment(incubation.incubation_start_date)
        .add(day_number - 1, 'days')
        .format('YYYY-MM-DD');

      return api.entities.IncubationLog.create({
        day_number,
        temperature_celsius: parseFloat(data.temperature_celsius) || 0,
        humidity_percent: parseFloat(data.humidity_percent) || 0,
        eggs_turned: !!data.eggs_turned,
        candling_performed: !!data.candling_performed,
        candling_results: data.candling_results || '',
        candling_image_url: data.candling_image_url || '',
        eggs_removed: parseInt(data.eggs_removed, 10) || 0,
        notes: data.notes || '',
        incubation_id: incubationId,
        batch_name: incubation.batch_name || '',
        log_date: logDate
      });
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong'),
    onSuccess: () => {
      queryClient.invalidateQueries(['incubation-logs']);
      toast.success('Daily log added');
      resetLogForm();
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const { file_url } = await api.integrations.Core.UploadFile({ file });
      setLogFormData({ ...logFormData, candling_image_url: file_url });
      toast.success('Image uploaded');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const resetLogForm = () => {
    setShowLogForm(false);
    setLogFormData({
      day_number: '',
      temperature_celsius: 37.5,
      humidity_percent: 55,
      eggs_turned: true,
      candling_performed: false,
      candling_results: '',
      candling_image_url: '',
      eggs_removed: 0,
      notes: ''
    });
  };

  const handleSubmitLog = () => {
    if (!logFormData.day_number) {
      toast.error('Please enter day number');
      return;
    }
    createLogMutation.mutate(logFormData);
  };

  if (!user || isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  if (!incubation) {
    return (
      <PageShell variant="compact" eyebrow="Farm" title="Incubation not found" breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Incubation', href: createPageUrl('IncubationManagement') }, { label: 'Detail' }]}>
        <EmptyState icon={Egg} title="We couldn't find that incubation batch" subtitle="It may have been removed, or the link is incomplete." action={<Link to={createPageUrl('IncubationManagement')} className="btn-cta px-5 py-2.5 text-sm gap-1.5 inline-flex items-center"><ArrowLeft className="w-4 h-4" /> Back to incubation</Link>} />
      </PageShell>
    );
  }

  const daysElapsed = moment().diff(moment(incubation.incubation_start_date), 'days') + 1;
  const currentDay = Math.min(daysElapsed, incubation.incubation_days);
  const progress = (currentDay / incubation.incubation_days) * 100;
  const daysToHatch = Math.max(0, incubation.incubation_days - currentDay);
  const inLockdown = currentDay >= 18;

  // Check which candling is due
  const nextCandling = candlingSchedule.find(c => c.day >= currentDay);
  const recentCandling = candlingSchedule.filter(c => c.day <= currentDay).pop();

  const sortedLogs = [...logs].sort((a, b) => (b.day_number || 0) - (a.day_number || 0));
  const statusChip = incubation.status === 'hatching'
    ? 'bg-terracotta-500 text-white border-0'
    : incubation.status === 'completed'
      ? 'bg-ink/70 text-cream border-0'
      : 'bg-fresh-50 text-moss-700 border-fresh-200';

  const logFormPanel = (
    <motion.section key="log-form" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="card-premium p-6 mb-5 border-moss-100">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div><p className="eyebrow mb-1">Daily log</p><h3 className="font-display text-xl text-ink">Record today's reading</h3></div>
        <button onClick={resetLogForm} className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/55 hover:bg-cream-deep" aria-label="Close"><X className="w-4 h-4" /></button>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label>Day number *</Label>
            <input type="number" className={inputCls} value={logFormData.day_number} onChange={(e) => setLogFormData({ ...logFormData, day_number: parseInt(e.target.value) || '' })} placeholder={`Current: Day ${currentDay}`} />
          </div>
          <div>
            <Label className="inline-flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-yolk-600" /> Temp (°C)</Label>
            <input type="number" step="0.1" className={inputCls} value={logFormData.temperature_celsius} onChange={(e) => setLogFormData({ ...logFormData, temperature_celsius: parseFloat(e.target.value) })} />
          </div>
          <div>
            <Label className="inline-flex items-center gap-1"><Droplets className="w-3.5 h-3.5 text-moss-700" /> Humidity (%)</Label>
            <input type="number" className={inputCls} value={logFormData.humidity_percent} onChange={(e) => setLogFormData({ ...logFormData, humidity_percent: parseInt(e.target.value) })} />
          </div>
          <div>
            <Label>Eggs removed</Label>
            <input type="number" className={inputCls} value={logFormData.eggs_removed} onChange={(e) => setLogFormData({ ...logFormData, eggs_removed: parseInt(e.target.value) || 0 })} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setLogFormData({ ...logFormData, eggs_turned: !logFormData.eggs_turned })} className={`chip cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 ${logFormData.eggs_turned ? 'bg-fresh-50 text-moss-700 border-fresh-200' : 'bg-cream-deep text-ink/60 border-border'}`}>
            <RotateCw className="w-3.5 h-3.5" /> {logFormData.eggs_turned ? 'Eggs turned' : 'Not turned'}
          </button>
          <button type="button" onClick={() => setLogFormData({ ...logFormData, candling_performed: !logFormData.candling_performed })} className={`chip cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 ${logFormData.candling_performed ? 'bg-yolk-50 text-yolk-700 border-yolk-200' : 'bg-cream-deep text-ink/60 border-border'}`}>
            <Eye className="w-3.5 h-3.5" /> {logFormData.candling_performed ? 'Candling performed' : 'No candling'}
          </button>
        </div>

        {logFormData.candling_performed && (
          <div className="rounded-2xl bg-yolk-50 border border-yolk-200 p-4 space-y-3">
            <textarea
              className={`${inputCls} bg-white`}
              value={logFormData.candling_results}
              onChange={(e) => setLogFormData({ ...logFormData, candling_results: e.target.value })}
              placeholder="Describe what you observed during candling..."
              rows={3}
            />
            <div>
              <Label>Candling photo</Label>
              <label className="mt-1 flex items-center gap-3 rounded-xl bg-white border border-dashed border-yolk-300 px-3 py-2.5 text-sm text-ink/70 cursor-pointer hover:border-yolk-500">
                {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-yolk-600" /> : <ImagePlus className="w-4 h-4 text-yolk-600" />}
                <span>{uploadingImage ? 'Uploading…' : logFormData.candling_image_url ? 'Replace photo' : 'Upload a photo'}</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
              </label>
              {logFormData.candling_image_url && (
                <img src={logFormData.candling_image_url} alt="Preview" className="w-full h-32 object-cover rounded-xl mt-2" />
              )}
            </div>
          </div>
        )}

        <div>
          <Label>Notes</Label>
          <textarea
            className={inputCls}
            value={logFormData.notes}
            onChange={(e) => setLogFormData({ ...logFormData, notes: e.target.value })}
            placeholder="Any observations or concerns..."
            rows={2}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" className="rounded-full" onClick={resetLogForm}>Cancel</Button>
          <Button onClick={handleSubmitLog} disabled={createLogMutation.isPending} className="btn-cta px-5">
            {createLogMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Add log
          </Button>
        </div>
      </div>
    </motion.section>
  );

  return (
    <PageShell
      variant="compact"
      eyebrow="Farm · Incubation"
      title={incubation.batch_name}
      subtitle={(
        <span className="flex flex-wrap items-center gap-2">
          <span className={`chip capitalize ${statusChip}`}>{incubation.status}</span>
          <span className="chip chip-yolk">{incubation.egg_count} eggs</span>
          {incubation.breed && <span className="chip">{incubation.breed}</span>}
          {incubation.incubator_type && <span className="chip bg-cream-deep text-ink/60 border-border">{incubation.incubator_type}</span>}
        </span>
      )}
      breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Incubation', href: createPageUrl('IncubationManagement') }, { label: incubation.batch_name }]}
      action={(
        <div className="flex flex-wrap gap-2">
          <Link to={createPageUrl('IncubationManagement')} className="btn-ghost border border-border bg-white px-4 py-2.5 text-sm gap-1.5 inline-flex items-center"><ArrowLeft className="w-4 h-4" /> All batches</Link>
          <Button onClick={() => setShowLogForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Add daily log</Button>
        </div>
      )}
    >
      {/* Progress hero */}
      <section className="relative overflow-hidden rounded-2xl bg-moss-gradient text-cream p-6 sm:p-8 mb-5">
        <div className="absolute inset-0 grain opacity-50" />
        <div className="relative grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <p className="eyebrow text-cream/70 mb-2">Incubation progress</p>
            <div className="flex items-end gap-3 flex-wrap">
              <p className="font-display font-bold text-5xl sm:text-6xl leading-none">Day {currentDay}</p>
              <p className="text-cream/70 pb-1">of {incubation.incubation_days}</p>
              {inLockdown && <span className="chip bg-terracotta-500 text-white border-0 inline-flex items-center gap-1 mb-1"><Lock className="w-3 h-3" /> Lockdown</span>}
            </div>
            <div className="mt-5">
              <div className="h-3 rounded-full bg-cream/15 overflow-hidden"><div className={`h-full rounded-full transition-all ${inLockdown ? 'bg-terracotta-400' : 'bg-yolk-400'}`} style={{ width: `${progress}%` }} /></div>
              <div className="relative mt-2 h-5 text-[11px] text-cream/70">
                {candlingSchedule.map(c => (
                  <span key={c.day} className="absolute -translate-x-1/2 inline-flex items-center gap-1" style={{ left: `${Math.min(100, (c.day / incubation.incubation_days) * 100)}%` }}>
                    <Eye className={`w-3 h-3 ${c.day <= currentDay ? 'text-yolk-300' : ''}`} />D{c.day}
                  </span>
                ))}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-cream/85">
              <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4 text-cream/60" />Set {moment(incubation.incubation_start_date).format('D MMM YYYY')}</span>
              <span className="inline-flex items-center gap-1.5"><Egg className="w-4 h-4 text-cream/60" />Hatch {moment(incubation.expected_hatch_date).format('D MMM YYYY')}</span>
              <span className="inline-flex items-center gap-1.5 font-semibold">{daysToHatch > 0 ? `${daysToHatch} days to go` : 'Hatching now'}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            <div className="rounded-xl bg-cream/10 border border-cream/15 p-3"><p className="text-[11px] uppercase tracking-wider text-cream/60 inline-flex items-center gap-1"><Thermometer className="w-3 h-3" /> Target temp</p><p className="font-display font-bold text-xl mt-1">{incubation.temperature_celsius}°C</p></div>
            <div className="rounded-xl bg-cream/10 border border-cream/15 p-3"><p className="text-[11px] uppercase tracking-wider text-cream/60 inline-flex items-center gap-1"><Droplets className="w-3 h-3" /> Target humidity</p><p className="font-display font-bold text-xl mt-1">{incubation.humidity_percent}%</p></div>
            <div className="rounded-xl bg-cream/10 border border-cream/15 p-3"><p className="text-[11px] uppercase tracking-wider text-cream/60 inline-flex items-center gap-1"><RotateCw className="w-3 h-3" /> Turning</p><p className="font-display font-bold text-xl mt-1">{incubation.turned_times_per_day}x/day</p></div>
          </div>
        </div>
      </section>

      <AnimatePresence>{showLogForm && logFormPanel}</AnimatePresence>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Candling guide */}
        <aside className="space-y-5">
          {nextCandling && (
            <div className="rounded-2xl bg-yolk-50 border border-yolk-200 p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-yolk-200 flex items-center justify-center text-yolk-600 flex-shrink-0"><Eye className="w-4 h-4" /></div>
              <div>
                <p className="font-semibold text-ink">{nextCandling.day === currentDay ? 'Candle today' : `Next candling: Day ${nextCandling.day}`}</p>
                <p className="text-sm text-ink/65 mt-0.5">{nextCandling.description}</p>
              </div>
            </div>
          )}
          <section className="card-premium p-5">
            <p className="eyebrow mb-1">Guide</p>
            <h3 className="font-display text-xl text-ink mb-4">Candling schedule</h3>
            <ol className="space-y-4">
              {candlingSchedule.map((schedule) => {
                const isPast = schedule.day < currentDay;
                const isCurrent = schedule.day === currentDay;
                const logForDay = logs.find(l => l.day_number === schedule.day && l.candling_performed);
                return (
                  <li key={schedule.day} className={`rounded-xl border p-3 ${isCurrent ? 'border-yolk-300 bg-yolk-50' : 'border-border bg-cream'}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <p className="font-semibold text-ink text-sm">Day {schedule.day} · {schedule.title}</p>
                        <span className={`chip mt-1 ${logForDay ? 'bg-fresh-50 text-moss-700 border-fresh-200' : isPast ? 'bg-ink/70 text-cream border-0' : isCurrent ? 'bg-yolk-50 text-yolk-700 border-yolk-200' : 'bg-cream-deep text-ink/60 border-border'}`}>
                          {logForDay ? 'Logged' : isPast ? 'Past' : isCurrent ? 'Today' : 'Upcoming'}
                        </span>
                      </div>
                      {logForDay && <CheckCircle2 className="w-5 h-5 text-moss-700 flex-shrink-0" />}
                    </div>
                    <img src={schedule.imageUrl} alt={schedule.title} className="w-full h-24 object-cover rounded-lg mb-2" />
                    <p className="text-xs text-ink/65 leading-relaxed">{schedule.guidance}</p>
                  </li>
                );
              })}
            </ol>
          </section>
        </aside>

        {/* Log timeline */}
        <section className="card-premium lg:col-span-2 overflow-hidden">
          <div className="p-6 pb-3 flex items-start justify-between gap-3">
            <div><p className="eyebrow mb-1">Timeline</p><h3 className="font-display text-xl text-ink">Daily logs ({logs.length})</h3></div>
            {!showLogForm && <Button onClick={() => setShowLogForm(true)} className="btn-ghost border border-border bg-white px-4 py-2 text-sm gap-1.5"><Plus className="w-4 h-4" /> Log</Button>}
          </div>
          {logs.length === 0 ? (
            <div className="px-6 pb-6"><EmptyState variant="plain" icon={Egg} title="No logs yet" subtitle="Record temperature, humidity and turning each day to build a complete hatch record." action={<Button onClick={() => setShowLogForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Add first log</Button>} /></div>
          ) : (
            <motion.ol initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }} className="px-6 pb-6 relative">
              <div className="absolute left-[2.35rem] top-2 bottom-6 w-px bg-border" aria-hidden />
              {sortedLogs.map((log) => {
                const candlingDay = candlingSchedule.find(c => c.day === log.day_number);
                const tempOff = log.temperature_celsius != null && Math.abs(log.temperature_celsius - incubation.temperature_celsius) >= 0.5;
                const humOff = log.humidity_percent != null && Math.abs(log.humidity_percent - incubation.humidity_percent) >= 5;
                return (
                  <motion.li key={log.id} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="relative flex gap-4 py-3">
                    <div className={`relative z-10 w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center font-display font-bold text-xs border-2 border-white ${log.candling_performed ? 'bg-yolk-500 text-white' : 'bg-moss-600 text-cream'}`}>{log.day_number}</div>
                    <div className="flex-1 min-w-0 rounded-xl bg-cream p-3.5">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                          <p className="font-semibold text-ink text-sm">Day {log.day_number}</p>
                          <p className="text-xs text-ink/55">{moment(log.log_date).format('ddd, D MMM YYYY')}</p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {log.candling_performed && <span className="chip chip-yolk inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Candled</span>}
                          <span className={`chip inline-flex items-center gap-1 ${log.eggs_turned ? 'bg-fresh-50 text-moss-700 border-fresh-200' : 'bg-terracotta-50 text-terracotta-600 border-terracotta-200'}`}>
                            {log.eggs_turned ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}{log.eggs_turned ? 'Turned' : 'Not turned'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm">
                        <span className={`inline-flex items-center gap-1.5 ${tempOff ? 'text-terracotta-600 font-semibold' : 'text-ink/75'}`}><Thermometer className="w-4 h-4 text-yolk-600" />{log.temperature_celsius}°C</span>
                        <span className={`inline-flex items-center gap-1.5 ${humOff ? 'text-terracotta-600 font-semibold' : 'text-ink/75'}`}><Droplets className="w-4 h-4 text-moss-700" />{log.humidity_percent}%</span>
                        {log.eggs_removed > 0 && <span className="inline-flex items-center gap-1.5 text-terracotta-600"><AlertTriangle className="w-4 h-4" />{log.eggs_removed} eggs removed</span>}
                      </div>
                      {log.candling_performed && (
                        <div className="mt-3 rounded-xl bg-white border border-yolk-200 p-3">
                          {candlingDay && <p className="text-sm font-semibold text-yolk-700 mb-1">{candlingDay.title}</p>}
                          {log.candling_image_url && <img src={log.candling_image_url} alt="Candling" className="w-full h-44 object-cover rounded-lg mb-2" />}
                          {log.candling_results && <p className="text-sm text-ink/75">{log.candling_results}</p>}
                        </div>
                      )}
                      {log.notes && <p className="text-sm text-ink/60 italic mt-2">{log.notes}</p>}
                    </div>
                  </motion.li>
                );
              })}
            </motion.ol>
          )}
        </section>
      </div>
    </PageShell>
  );
}
