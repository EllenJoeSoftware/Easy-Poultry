import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Package, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function FarmFinancials() {
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
    queryKey: ['batches-finance'],
    queryFn: () => api.entities.PoultryBatch.filter({ created_by: user?.email }),
    enabled: !!user
  });

  const { data: eggProduction = [] } = useQuery({
    queryKey: ['egg-production-finance'],
    queryFn: () => api.entities.EggProduction.filter({ created_by: user?.email }),
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  const totalRevenue = batches.reduce((sum, b) => sum + (b.total_revenue || 0), 0);
  const eggRevenue = eggProduction.reduce((sum, e) => sum + (e.revenue || 0), 0);
  const totalFeedCost = batches.reduce((sum, b) => sum + (b.total_feed_cost || 0), 0);
  const totalVaccineCost = batches.reduce((sum, b) => sum + (b.total_vaccine_cost || 0), 0);
  const totalOtherCosts = batches.reduce((sum, b) => sum + (b.total_other_costs || 0), 0);
  const totalCosts = totalFeedCost + totalVaccineCost + totalOtherCosts;
  const netProfit = totalRevenue + eggRevenue - totalCosts;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('FarmDashboard')} className="inline-flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Farm Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-2">Farm Financials</h1>
          <p className="text-white/90">Financial overview and reports</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-0 shadow-lg">
            <DollarSign className="w-8 h-8 text-green-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">R{(totalRevenue + eggRevenue).toFixed(0)}</p>
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-xs text-gray-500 mt-1">Birds + Eggs</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <TrendingDown className="w-8 h-8 text-red-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">R{totalCosts.toFixed(0)}</p>
            <p className="text-sm text-gray-600">Total Costs</p>
            <p className="text-xs text-gray-500 mt-1">All expenses</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <TrendingUp className={`w-8 h-8 mb-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R{netProfit.toFixed(0)}
            </p>
            <p className="text-sm text-gray-600">Net Profit</p>
            <p className="text-xs text-gray-500 mt-1">{netProfit >= 0 ? 'Profitable' : 'Loss'}</p>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <Package className="w-8 h-8 text-orange-600 mb-2" />
            <p className="text-3xl font-bold text-gray-900">R{totalFeedCost.toFixed(0)}</p>
            <p className="text-sm text-gray-600">Feed Costs</p>
            <p className="text-xs text-gray-500 mt-1">{totalCosts > 0 ? ((totalFeedCost / totalCosts) * 100).toFixed(0) : 0}% of total</p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="p-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Feed</span>
                <span className="font-semibold">R{totalFeedCost.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Vaccines</span>
                <span className="font-semibold">R{totalVaccineCost.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Other Expenses</span>
                <span className="font-semibold">R{totalOtherCosts.toFixed(0)}</span>
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Costs</span>
                <span className="font-bold text-gray-900">R{totalCosts.toFixed(0)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-0 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Sources</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Bird Sales</span>
                <span className="font-semibold">R{totalRevenue.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Egg Sales</span>
                <span className="font-semibold">R{eggRevenue.toFixed(0)}</span>
              </div>
              <div className="pt-3 border-t flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Revenue</span>
                <span className="font-bold text-gray-900">R{(totalRevenue + eggRevenue).toFixed(0)}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6 border-0 shadow-lg mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Performance</h3>
          <div className="space-y-4">
            {batches.map(batch => {
              const batchRevenue = (batch.total_revenue || 0);
              const batchCosts = (batch.total_feed_cost || 0) + (batch.total_vaccine_cost || 0) + (batch.total_other_costs || 0);
              const batchProfit = batchRevenue - batchCosts;
              
              return (
                <div key={batch.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900">{batch.batch_name}</h4>
                    <span className={`font-bold ${batchProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R{batchProfit.toFixed(0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Revenue</p>
                      <p className="font-semibold">R{batchRevenue.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Costs</p>
                      <p className="font-semibold">R{batchCosts.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-semibold capitalize">{batch.status}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}