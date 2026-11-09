import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Plus, Calendar, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import PageShell from '@/components/shell/PageShell';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';
import moment from 'moment';

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  const completedEvents = events.filter(e => e.status === 'completed');
  const scheduledEvents = events.filter(e => e.status === 'scheduled');

  return (
    <PageShell
      variant="compact"
      eyebrow="Farm"
      title="Vaccinations"
      subtitle="Keep every batch protected — log vaccinations and see what is due next."
      breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Vaccinations' }]}
      action={<Button onClick={() => setShowEventForm(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><Plus className="w-4 h-4" /> Record vaccination</Button>}
    >
      <div>
        <Tabs defaultValue="completed">
          <TabsList>
            <TabsTrigger value="completed">Completed ({completedEvents.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="mt-6">
            {completedEvents.length === 0 ? (
              <Card className="p-12 text-center">
                <Zap className="w-16 h-16 text-ink/25 mx-auto mb-4" />
                <p className="text-ink/65">No vaccination records yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedEvents.map(event => (
                  <Card key={event.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CheckCircle2 className="w-5 h-5 text-moss-700" />
                          <h3 className="font-semibold text-ink">{event.vaccine_name}</h3>
                          <Badge variant="outline">{event.batch_name}</Badge>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-4 text-sm text-ink/65">
                          <p>Date: {moment(event.vaccination_date).format('MMM D, YYYY')}</p>
                          <p>Birds: {event.birds_vaccinated}</p>
                          <p>Age: {event.batch_age_days} days</p>
                          {event.cost > 0 && <p>Cost: R{event.cost}</p>}
                          {event.administered_by && <p>By: {event.administered_by}</p>}
                        </div>
                        {event.notes && (
                          <p className="text-sm text-ink/65 mt-2">{event.notes}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            {scheduledEvents.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 text-ink/25 mx-auto mb-4" />
                <p className="text-ink/65">No scheduled vaccinations</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {scheduledEvents.map(event => (
                  <Card key={event.id} className="p-6">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-yolk-500" />
                      <div>
                        <h3 className="font-semibold">{event.vaccine_name}</h3>
                        <p className="text-sm text-ink/65">
                          Due: {moment(event.due_date).format('MMM D, YYYY')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showEventForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Vaccination</DialogTitle>
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
              <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              <Button type="submit" className="bg-moss-600 hover:bg-moss-700">Record</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
