import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, Egg, CheckCircle, AlertTriangle, Eye, Upload, Thermometer, Droplets, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
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
      const logDate = moment(incubation.incubation_start_date)
        .add(data.day_number - 1, 'days')
        .format('YYYY-MM-DD');
      
      return api.entities.IncubationLog.create({
        ...data,
        incubation_id: incubationId,
        log_date: logDate
      });
    },
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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  if (!incubation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Incubation batch not found</p>
      </div>
    );
  }

  const daysElapsed = moment().diff(moment(incubation.incubation_start_date), 'days') + 1;
  const currentDay = Math.min(daysElapsed, incubation.incubation_days);
  const progress = (currentDay / incubation.incubation_days) * 100;

  // Check which candling is due
  const nextCandling = candlingSchedule.find(c => c.day >= currentDay);
  const recentCandling = candlingSchedule.filter(c => c.day <= currentDay).pop();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('IncubationManagement')} className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Incubation Management
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{incubation.batch_name}</h1>
              <p className="text-white/90">Day {currentDay} of {incubation.incubation_days}</p>
            </div>
            <Button
              onClick={() => setShowLogForm(true)}
              className="bg-white text-orange-600 hover:bg-gray-50"
            >
              Add Daily Log
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Overview */}
        <Card className="p-6 mb-8 border-0 shadow-lg">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Incubation Progress</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Current Day</span>
                  <span className="font-semibold">Day {currentDay}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-orange-600 h-3 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-orange-600" />
                    <span className="text-sm">Target: {incubation.temperature_celsius}°C</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Target: {incubation.humidity_percent}%</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Batch Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Eggs Count</span>
                  <span className="font-semibold">{incubation.egg_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Breed</span>
                  <span className="font-semibold">{incubation.breed || 'Mixed'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Started</span>
                  <span className="font-semibold">{moment(incubation.incubation_start_date).format('MMM DD, YYYY')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expected Hatch</span>
                  <span className="font-semibold">{moment(incubation.expected_hatch_date).format('MMM DD, YYYY')}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Candling Schedule & Guidance */}
        <Card className="p-6 mb-8 border-0 shadow-lg">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-orange-600" />
            Candling Schedule & Guide
          </h3>
          {nextCandling && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-900">Next Candling: Day {nextCandling.day}</h4>
                  <p className="text-sm text-orange-800 mt-1">{nextCandling.description}</p>
                </div>
              </div>
            </div>
          )}
          <div className="grid md:grid-cols-3 gap-4">
            {candlingSchedule.map((schedule) => {
              const isPast = schedule.day < currentDay;
              const isCurrent = schedule.day === currentDay;
              const logForDay = logs.find(l => l.day_number === schedule.day && l.candling_performed);

              return (
                <Card key={schedule.day} className={`p-4 ${isCurrent ? 'border-2 border-orange-500' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">Day {schedule.day}</h4>
                      <Badge variant={isPast ? 'default' : 'outline'} className="mt-1">
                        {isPast ? 'Past' : isCurrent ? 'Today' : 'Upcoming'}
                      </Badge>
                    </div>
                    {logForDay && <CheckCircle className="w-5 h-5 text-green-600" />}
                  </div>
                  <img
                    src={schedule.imageUrl}
                    alt={schedule.title}
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <h5 className="font-medium text-sm text-gray-900 mb-1">{schedule.title}</h5>
                  <p className="text-xs text-gray-600 mb-2">{schedule.guidance}</p>
                </Card>
              );
            })}
          </div>
        </Card>

        {/* Daily Logs */}
        <Card className="border-0 shadow-lg">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Daily Logs</h3>
          </div>
          <div className="p-6">
            {logs.length === 0 ? (
              <div className="text-center py-12">
                <Egg className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No logs yet. Start tracking daily!</p>
                <Button onClick={() => setShowLogForm(true)} className="bg-orange-600 hover:bg-orange-700">
                  Add First Log
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {logs.map((log) => {
                  const candlingDay = candlingSchedule.find(c => c.day === log.day_number);
                  
                  return (
                    <Card key={log.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">Day {log.day_number}</h4>
                          <p className="text-sm text-gray-600">{moment(log.log_date).format('MMM DD, YYYY')}</p>
                        </div>
                        {log.candling_performed && (
                          <Badge className="bg-orange-600">
                            <Eye className="w-3 h-3 mr-1" />
                            Candled
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm">
                          <Thermometer className="w-4 h-4 text-orange-600" />
                          <span>{log.temperature_celsius}°C</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Droplets className="w-4 h-4 text-blue-600" />
                          <span>{log.humidity_percent}%</span>
                        </div>
                        <div className="text-sm">
                          {log.eggs_turned ? (
                            <CheckCircle className="w-4 h-4 text-green-600 inline mr-1" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-orange-600 inline mr-1" />
                          )}
                          <span>{log.eggs_turned ? 'Turned' : 'Not turned'}</span>
                        </div>
                      </div>

                      {log.candling_performed && (
                        <div className="bg-orange-50 rounded-lg p-3 mb-3">
                          {candlingDay && (
                            <p className="text-sm font-medium text-orange-900 mb-2">{candlingDay.title}</p>
                          )}
                          {log.candling_image_url && (
                            <img
                              src={log.candling_image_url}
                              alt="Candling"
                              className="w-full h-48 object-cover rounded-lg mb-2"
                            />
                          )}
                          {log.candling_results && (
                            <p className="text-sm text-gray-700">{log.candling_results}</p>
                          )}
                        </div>
                      )}

                      {log.eggs_removed > 0 && (
                        <div className="flex items-center gap-2 text-sm text-red-600 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span>{log.eggs_removed} eggs removed</span>
                        </div>
                      )}

                      {log.notes && (
                        <p className="text-sm text-gray-600 italic">{log.notes}</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Add Log Dialog */}
      <Dialog open={showLogForm} onOpenChange={(open) => !open && resetLogForm()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Daily Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Day Number *</label>
                <Input
                  type="number"
                  value={logFormData.day_number}
                  onChange={(e) => setLogFormData({ ...logFormData, day_number: parseInt(e.target.value) || '' })}
                  placeholder={`Current: Day ${currentDay}`}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Eggs Removed</label>
                <Input
                  type="number"
                  value={logFormData.eggs_removed}
                  onChange={(e) => setLogFormData({ ...logFormData, eggs_removed: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Temperature (°C)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={logFormData.temperature_celsius}
                  onChange={(e) => setLogFormData({ ...logFormData, temperature_celsius: parseFloat(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Humidity (%)</label>
                <Input
                  type="number"
                  value={logFormData.humidity_percent}
                  onChange={(e) => setLogFormData({ ...logFormData, humidity_percent: parseInt(e.target.value) })}
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={logFormData.eggs_turned}
                    onChange={(e) => setLogFormData({ ...logFormData, eggs_turned: e.target.checked })}
                    className="w-4 h-4 text-orange-600"
                  />
                  <span className="text-sm font-medium">Eggs Turned</span>
                </label>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={logFormData.candling_performed}
                  onChange={(e) => setLogFormData({ ...logFormData, candling_performed: e.target.checked })}
                  className="w-4 h-4 text-orange-600"
                />
                <span className="text-sm font-medium">Candling Performed</span>
              </label>

              {logFormData.candling_performed && (
                <>
                  <Textarea
                    value={logFormData.candling_results}
                    onChange={(e) => setLogFormData({ ...logFormData, candling_results: e.target.value })}
                    placeholder="Describe what you observed during candling..."
                    rows={3}
                    className="mb-2"
                  />
                  <div>
                    <label className="text-sm font-medium mb-1 block">Upload Candling Photo</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                    </div>
                    {logFormData.candling_image_url && (
                      <img
                        src={logFormData.candling_image_url}
                        alt="Preview"
                        className="w-full h-32 object-cover rounded-lg mt-2"
                      />
                    )}
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={logFormData.notes}
                onChange={(e) => setLogFormData({ ...logFormData, notes: e.target.value })}
                placeholder="Any observations or concerns..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetLogForm}>Cancel</Button>
              <Button
                onClick={handleSubmitLog}
                disabled={createLogMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Add Log
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}