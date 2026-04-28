import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Thermometer, Droplets, RotateCw, Calendar, TrendingUp, Egg, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
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
    queryKey: ['incubations'],
    queryFn: () => api.entities.EggIncubation.filter({ created_by: user?.email }, '-incubation_start_date'),
    enabled: !!user
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      const expectedHatchDate = moment(data.incubation_start_date)
        .add(data.incubation_days, 'days')
        .format('YYYY-MM-DD');
      
      return api.entities.EggIncubation.create({
        ...data,
        expected_hatch_date: expectedHatchDate
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['incubations']);
      toast.success('Incubation batch created successfully');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.entities.EggIncubation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['incubations']);
      toast.success('Incubation batch updated');
      resetForm();
    }
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
      updateMutation.mutate({ id: editingIncubation.id, data: formData });
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <Link to={createPageUrl('FarmDashboard')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Farm Dashboard
              </Link>
              <h1 className="text-3xl font-bold mb-2">🥚 Egg Incubation Management</h1>
              <p className="text-white/90">Track and manage your egg incubation batches</p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-white text-orange-600 hover:bg-gray-50"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Incubation
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-lg">
            <Egg className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{activeIncubations.length}</p>
            <p className="text-sm text-gray-600">Active Batches</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <Egg className="w-8 h-8 text-amber-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{totalEggsIncubating}</p>
            <p className="text-sm text-gray-600">Eggs Incubating</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{avgHatchRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Avg Hatch Rate</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <Egg className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{completedIncubations.length}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </Card>
        </div>

        {/* Active Incubations */}
        <Card className="border-0 shadow-lg mb-8">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Active Incubations</h3>
          </div>
          <div className="p-6">
            {activeIncubations.length === 0 ? (
              <div className="text-center py-12">
                <Egg className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No active incubations</p>
                <Button onClick={() => setShowForm(true)} className="bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Start First Incubation
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeIncubations.map(incubation => {
                  const daysRemaining = calculateDaysRemaining(incubation.expected_hatch_date);
                  const daysElapsed = moment().diff(moment(incubation.incubation_start_date), 'days');
                  const progress = Math.min((daysElapsed / incubation.incubation_days) * 100, 100);

                  return (
                    <Card key={incubation.id} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{incubation.batch_name}</h4>
                          <Badge variant={incubation.status === 'hatching' ? 'default' : 'secondary'} className="mt-1">
                            {incubation.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm mb-3">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Egg className="w-4 h-4" />
                          <span>{incubation.egg_count} eggs</span>
                        </div>
                        {incubation.breed && (
                          <p className="text-gray-600">Breed: {incubation.breed}</p>
                        )}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>Started: {moment(incubation.incubation_start_date).format('MMM DD, YYYY')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span className={daysRemaining <= 3 ? 'text-orange-600 font-semibold' : ''}>
                            {daysRemaining > 0 ? `${daysRemaining} days to hatch` : 'Hatching soon!'}
                          </span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Day {daysElapsed}</span>
                          <span>{progress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          <span>{incubation.temperature_celsius}°C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Droplets className="w-3 h-3" />
                          <span>{incubation.humidity_percent}%</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <RotateCw className="w-3 h-3" />
                          <span>{incubation.turned_times_per_day}x/day</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Link to={createPageUrl('IncubationDetail') + `?id=${incubation.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                        <Button
                          onClick={() => handleEdit(incubation)}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          Update
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* Completed Incubations */}
        {completedIncubations.length > 0 && (
          <Card className="border-0 shadow-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Completed Incubations</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {completedIncubations.map(incubation => (
                  <Card key={incubation.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">{incubation.batch_name}</h4>
                        <p className="text-sm text-gray-600">{incubation.breed}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">
                          {incubation.eggs_hatched} hatched
                        </p>
                        <p className="text-sm text-gray-600">
                          {incubation.hatch_rate_percent?.toFixed(1)}% success rate
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingIncubation ? 'Update' : 'New'} Incubation Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Batch Name *</label>
                <Input
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  placeholder="e.g., Spring 2024 Batch"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Number of Eggs *</label>
                <Input
                  type="number"
                  value={formData.egg_count}
                  onChange={(e) => setFormData({ ...formData, egg_count: parseInt(e.target.value) || '' })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Breed</label>
                <Input
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="e.g., Rhode Island Red"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Incubator Type</label>
                <Input
                  value={formData.incubator_type}
                  onChange={(e) => setFormData({ ...formData, incubator_type: e.target.value })}
                  placeholder="e.g., Automatic turner"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Start Date</label>
                <Input
                  type="date"
                  value={formData.incubation_start_date}
                  onChange={(e) => setFormData({ ...formData, incubation_start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Incubation Days</label>
                <Input
                  type="number"
                  value={formData.incubation_days}
                  onChange={(e) => setFormData({ ...formData, incubation_days: parseInt(e.target.value) || 21 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Temperature (°C)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.temperature_celsius}
                  onChange={(e) => setFormData({ ...formData, temperature_celsius: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Humidity (%)</label>
                <Input
                  type="number"
                  value={formData.humidity_percent}
                  onChange={(e) => setFormData({ ...formData, humidity_percent: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Turns/Day</label>
                <Input
                  type="number"
                  value={formData.turned_times_per_day}
                  onChange={(e) => setFormData({ ...formData, turned_times_per_day: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {editingIncubation && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Hatched</label>
                    <Input
                      type="number"
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
                    <label className="text-sm font-medium mb-1 block">Infertile</label>
                    <Input
                      type="number"
                      value={formData.eggs_infertile || 0}
                      onChange={(e) => setFormData({ ...formData, eggs_infertile: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Dead in Shell</label>
                    <Input
                      type="number"
                      value={formData.eggs_dead_in_shell || 0}
                      onChange={(e) => setFormData({ ...formData, eggs_dead_in_shell: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Status</label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger>
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
                    <label className="text-sm font-medium mb-1 block">Actual Hatch Date</label>
                    <Input
                      type="date"
                      value={formData.actual_hatch_date || ''}
                      onChange={(e) => setFormData({ ...formData, actual_hatch_date: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {editingIncubation ? 'Update' : 'Create'} Batch
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}