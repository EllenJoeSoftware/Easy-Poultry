import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bird, ArrowLeft, Calendar, DollarSign, Egg, Zap, Package, TrendingDown, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import moment from 'moment';

export default function BatchDetail() {
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const batchId = urlParams.get('id');
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

  const { data: batch, isLoading } = useQuery({
    queryKey: ['batch-detail', batchId],
    queryFn: async () => {
      const batches = await api.entities.PoultryBatch.filter({ id: batchId });
      return batches[0] || null;
    },
    enabled: !!user && !!batchId
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ['batch-vaccinations', batchId],
    queryFn: () => api.entities.VaccinationEvent.filter({ batch_id: batchId }, '-vaccination_date'),
    enabled: !!batchId
  });

  const { data: feedUsage = [] } = useQuery({
    queryKey: ['batch-feed', batchId],
    queryFn: () => api.entities.FeedUsage.filter({ batch_id: batchId }, '-usage_date', 20),
    enabled: !!batchId
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['batch-expenses', batchId],
    queryFn: () => api.entities.BatchExpense.filter({ batch_id: batchId }, '-expense_date', 20),
    enabled: !!batchId
  });

  const { data: eggProduction = [] } = useQuery({
    queryKey: ['batch-eggs', batchId],
    queryFn: () => api.entities.EggProduction.filter({ batch_id: batchId }, '-production_date', 20),
    enabled: !!batchId && batch?.bird_type === 'layers'
  });

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-ink/65 mb-4">Batch not found</p>
          <Link to={createPageUrl('BatchManagement')}>
            <Button className="btn-cta">Back to Batches</Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalRevenue = (batch.total_revenue || 0);
  const totalCosts = (batch.total_feed_cost || 0) + (batch.total_vaccine_cost || 0) + (batch.total_other_costs || 0);
  const netProfit = totalRevenue - totalCosts;

  return (
    <div className="min-h-[80vh] bg-cream">
      <div className="bg-moss-gradient text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to={createPageUrl('BatchManagement')} className="inline-flex items-center text-white/90 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batch Management
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold mb-2">{batch.batch_name}</h1>
              <div className="flex items-center gap-3">
                <Badge className="bg-white/20 text-white capitalize">{batch.bird_type}</Badge>
                <Badge className="bg-white/20 text-white capitalize">{batch.status}</Badge>
              </div>
            </div>
            <Bird className="w-16 h-16 text-white/20" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 card-premium">
            <Bird className="w-8 h-8 text-moss-600 mb-2" />
            <p className="text-3xl font-bold text-ink">{batch.current_quantity}</p>
            <p className="text-sm text-ink/65">Current Birds</p>
            <p className="text-xs text-ink/55 mt-1">Initial: {batch.initial_quantity}</p>
          </Card>

          <Card className="p-6 card-premium">
            <Calendar className="w-8 h-8 text-moss-700 mb-2" />
            <p className="text-3xl font-bold text-ink">{batch.age_in_weeks}</p>
            <p className="text-sm text-ink/65">Age (weeks)</p>
            <p className="text-xs text-ink/55 mt-1">Since {moment(batch.date_acquired).format('MMM D, YYYY')}</p>
          </Card>

          <Card className="p-6 card-premium">
            <DollarSign className="w-8 h-8 text-moss-700 mb-2" />
            <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-moss-700' : 'text-terracotta-600'}`}>
              R{netProfit.toFixed(0)}
            </p>
            <p className="text-sm text-ink/65">Net Profit</p>
            <p className="text-xs text-ink/55 mt-1">Revenue: R{totalRevenue.toFixed(0)}</p>
          </Card>

          <Card className="p-6 card-premium">
            <TrendingDown className="w-8 h-8 text-terracotta-600 mb-2" />
            <p className="text-3xl font-bold text-ink">R{totalCosts.toFixed(0)}</p>
            <p className="text-sm text-ink/65">Total Costs</p>
            <p className="text-xs text-ink/55 mt-1">All expenses</p>
          </Card>
        </div>

        {/* Batch Info */}
        <Card className="p-6 card-premium mb-8">
          <h3 className="font-display text-lg font-semibold text-ink mb-4">Batch Information</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-ink/65">Batch Number</p>
              <p className="font-semibold text-ink">{batch.batch_number}</p>
            </div>
            <div>
              <p className="text-sm text-ink/65">Breed</p>
              <p className="font-semibold text-ink">{batch.breed || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-ink/65">Housing Location</p>
              <p className="font-semibold text-ink">{batch.housing_location || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-ink/65">Available Birds</p>
              <p className="font-semibold text-ink">{batch.available_quantity}</p>
            </div>
            <div>
              <p className="text-sm text-ink/65">Sold Count</p>
              <p className="font-semibold text-ink">{batch.sold_count || 0}</p>
            </div>
            <div>
              <p className="text-sm text-ink/65">Mortality</p>
              <p className="font-semibold text-terracotta-600">{batch.mortality_count || 0}</p>
            </div>
            {batch.expected_harvest_date && (
              <div>
                <p className="text-sm text-ink/65">Expected Harvest</p>
                <p className="font-semibold text-ink">{moment(batch.expected_harvest_date).format('MMM D, YYYY')}</p>
              </div>
            )}
          </div>
          {batch.notes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-ink/65 mb-1">Notes</p>
              <p className="text-ink">{batch.notes}</p>
            </div>
          )}
        </Card>

        <Tabs defaultValue="vaccinations">
          <TabsList>
            <TabsTrigger value="vaccinations">
              <Zap className="w-4 h-4 mr-2" />
              Vaccinations ({vaccinations.length})
            </TabsTrigger>
            <TabsTrigger value="feed">
              <Package className="w-4 h-4 mr-2" />
              Feed Usage ({feedUsage.length})
            </TabsTrigger>
            {batch.bird_type === 'layers' && (
              <TabsTrigger value="eggs">
                <Egg className="w-4 h-4 mr-2" />
                Egg Production ({eggProduction.length})
              </TabsTrigger>
            )}
            <TabsTrigger value="expenses">
              <DollarSign className="w-4 h-4 mr-2" />
              Expenses ({expenses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vaccinations" className="mt-6">
            {vaccinations.length === 0 ? (
              <Card className="p-12 text-center">
                <Zap className="w-16 h-16 text-ink/25 mx-auto mb-4" />
                <p className="text-ink/65">No vaccinations recorded</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {vaccinations.map(vac => (
                  <Card key={vac.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-ink">{vac.vaccine_name}</h4>
                        <p className="text-sm text-ink/65">
                          {moment(vac.vaccination_date).format('MMM D, YYYY')} • {vac.birds_vaccinated} birds • Age: {vac.batch_age_days} days
                        </p>
                        {vac.cost > 0 && <p className="text-sm text-ink/65">Cost: R{vac.cost}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed" className="mt-6">
            {feedUsage.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="w-16 h-16 text-ink/25 mx-auto mb-4" />
                <p className="text-ink/65">No feed usage recorded</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {feedUsage.map(usage => (
                  <Card key={usage.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-ink">{usage.feed_name}</h4>
                        <p className="text-sm text-ink/65">
                          {moment(usage.usage_date).format('MMM D, YYYY')} • {usage.quantity_kg}kg • R{usage.cost}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {batch.bird_type === 'layers' && (
            <TabsContent value="eggs" className="mt-6">
              {eggProduction.length === 0 ? (
                <Card className="p-12 text-center">
                  <Egg className="w-16 h-16 text-ink/25 mx-auto mb-4" />
                  <p className="text-ink/65">No egg production recorded</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {eggProduction.map(prod => (
                    <Card key={prod.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-ink">{prod.eggs_collected} eggs</h4>
                          <p className="text-sm text-ink/65">
                            {moment(prod.production_date).format('MMM D, YYYY')} • Rate: {prod.production_rate}%
                          </p>
                          {prod.revenue > 0 && <p className="text-sm text-moss-700">Revenue: R{prod.revenue}</p>}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="expenses" className="mt-6">
            {expenses.length === 0 ? (
              <Card className="p-12 text-center">
                <DollarSign className="w-16 h-16 text-ink/25 mx-auto mb-4" />
                <p className="text-ink/65">No expenses recorded</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {expenses.map(expense => (
                  <Card key={expense.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-ink capitalize">{expense.expense_type.replace('_', ' ')}</h4>
                        <p className="text-sm text-ink/65">
                          {moment(expense.expense_date).format('MMM D, YYYY')} • R{expense.amount}
                        </p>
                        {expense.description && <p className="text-sm text-ink/65">{expense.description}</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}