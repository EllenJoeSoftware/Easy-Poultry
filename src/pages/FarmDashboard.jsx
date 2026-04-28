import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Package, Zap, DollarSign, Egg, AlertTriangle, Bird, ShoppingCart, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import moment from 'moment';

export default function FarmDashboard() {
  const [user, setUser] = useState(null);

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
    queryKey: ['farm-batches'],
    queryFn: () => api.entities.PoultryBatch.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['farm-alerts'],
    queryFn: () => api.entities.FarmAlert.filter({ created_by: user?.email, is_resolved: false }),
    enabled: !!user
  });

  const { data: feedTypes = [] } = useQuery({
    queryKey: ['feed-types'],
    queryFn: () => api.entities.FeedType.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const { data: eggProduction = [] } = useQuery({
    queryKey: ['egg-production-recent'],
    queryFn: async () => {
      const last7Days = moment().subtract(7, 'days').format('YYYY-MM-DD');
      const all = await api.entities.EggProduction.filter({ created_by: user?.email }, '-production_date');
      return all.filter(e => e.production_date >= last7Days);
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const activeBatches = batches.filter(b => b.status === 'active');
  const totalBirds = activeBatches.reduce((sum, b) => sum + b.current_quantity, 0);
  const layerBatches = activeBatches.filter(b => b.bird_type === 'layers');
  const broilerBatches = activeBatches.filter(b => b.bird_type === 'broilers');
  
  const totalRevenue = batches.reduce((sum, b) => sum + (b.total_revenue || 0), 0);
  const totalCosts = batches.reduce((sum, b) => sum + (b.total_feed_cost || 0) + (b.total_vaccine_cost || 0) + (b.total_other_costs || 0), 0);
  const profit = totalRevenue - totalCosts;

  const totalEggsWeek = eggProduction.reduce((sum, e) => sum + e.eggs_collected, 0);
  
  const lowStockFeeds = feedTypes.filter(f => f.current_stock_kg <= f.low_stock_alert_kg);
  const urgentAlerts = alerts.filter(a => a.priority === 'urgent' || a.priority === 'high');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-[#7A9D7A] to-[#6A8D6A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🐔 Farm Management Dashboard</h1>
              <p className="text-white/90">Overview of your poultry farm operations</p>
            </div>
            <Link to={createPageUrl('BatchManagement')}>
              <Button className="bg-white text-[#7A9D7A] hover:bg-gray-50">
                <Plus className="w-5 h-5 mr-2" />
                New Batch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {urgentAlerts.length > 0 && (
          <Card className="p-4 mb-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Urgent Alerts ({urgentAlerts.length})</h3>
                <div className="space-y-1">
                  {urgentAlerts.slice(0, 3).map(alert => (
                    <p key={alert.id} className="text-sm text-red-800">• {alert.message}</p>
                  ))}
                </div>
                <Link to={createPageUrl('FarmAlerts')}>
                  <Button size="sm" variant="outline" className="mt-2 text-red-700 border-red-300">
                    View All Alerts
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Key Metrics */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-lg">
            <Bird className="w-8 h-8 text-[#7A9D7A] mb-2" />
            <p className="text-3xl font-bold text-gray-900">{totalBirds}</p>
            <p className="text-sm text-gray-600">Total Birds</p>
            <p className="text-xs text-gray-500 mt-1">{activeBatches.length} active batches</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <Egg className="w-8 h-8 text-[#E07A5F] mb-2" />
            <p className="text-3xl font-bold text-gray-900">{totalEggsWeek}</p>
            <p className="text-sm text-gray-600">Eggs (7 days)</p>
            <p className="text-xs text-gray-500 mt-1">{layerBatches.length} layer batches</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <DollarSign className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">R{profit.toFixed(0)}</p>
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className="text-xs text-gray-500 mt-1">Revenue: R{totalRevenue.toFixed(0)}</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <Package className="w-8 h-8 text-blue-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">{feedTypes.length}</p>
            <p className="text-sm text-gray-600">Feed Types</p>
            {lowStockFeeds.length > 0 && (
              <Badge variant="destructive" className="mt-1">{lowStockFeeds.length} Low Stock</Badge>
            )}
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Batch Management', path: 'BatchManagement', icon: Bird, color: 'from-green-500 to-emerald-600' },
            { label: 'Egg Incubation', path: 'IncubationManagement', icon: Egg, color: 'from-orange-500 to-amber-600' },
            { label: 'Feed Management', path: 'FeedManagement', icon: Package, color: 'from-amber-500 to-yellow-600' },
            { label: 'Vaccinations', path: 'VaccinationManagement', icon: Zap, color: 'from-blue-500 to-indigo-600' },
            { label: 'Financial Reports', path: 'FarmFinancials', icon: DollarSign, color: 'from-purple-500 to-pink-600' },
          ].map((action) => (
            <Link key={action.path} to={createPageUrl(action.path)}>
              <Card className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className={`bg-gradient-to-br ${action.color} p-4 text-white`}>
                  <action.icon className="w-8 h-8 opacity-90" />
                </div>
                <div className="p-4 bg-white">
                  <h3 className="font-semibold text-gray-900">{action.label}</h3>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Active Batches Overview */}
        <Card className="border-0 shadow-lg mb-8">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Active Batches</h3>
              <Link to={createPageUrl('BatchManagement')}>
                <Button variant="outline" size="sm">View All</Button>
              </Link>
            </div>
          </div>
          <div className="p-6">
            {activeBatches.length === 0 ? (
              <div className="text-center py-12">
                <Bird className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No active batches yet</p>
                <Link to={createPageUrl('BatchManagement')}>
                  <Button className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Batch
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeBatches.slice(0, 6).map(batch => (
                  <Card key={batch.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{batch.batch_name}</h4>
                        <Badge variant="outline" className="mt-1">{batch.bird_type}</Badge>
                      </div>
                      <Bird className="w-5 h-5 text-[#7A9D7A]" />
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Birds: {batch.current_quantity}</p>
                      <p>Age: {batch.age_in_weeks} weeks</p>
                      <p>Breed: {batch.breed}</p>
                    </div>
                    <Link to={createPageUrl('BatchDetail') + `?id=${batch.id}`}>
                      <Button variant="outline" size="sm" className="w-full mt-3">View Details</Button>
                    </Link>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Layer Batches Summary */}
        {layerBatches.length > 0 && (
          <Card className="border-0 shadow-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Layers Performance</h3>
            </div>
            <div className="p-6">
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Layers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {layerBatches.reduce((sum, b) => sum + b.current_quantity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Eggs This Week</p>
                  <p className="text-2xl font-bold text-[#E07A5F]">{totalEggsWeek}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Avg Production Rate</p>
                  <p className="text-2xl font-bold text-[#7A9D7A]">
                    {eggProduction.length > 0 
                      ? (eggProduction.reduce((sum, e) => sum + (e.production_rate || 0), 0) / eggProduction.length).toFixed(1)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}