import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function FeatureListingModal({ listing, isOpen, onClose }) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: pricingPlans = [] } = useQuery({
    queryKey: ['feature-pricing'],
    queryFn: () => api.entities.FeaturePricing.filter({ is_active: true }),
    enabled: isOpen
  });

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    setProcessing(true);
    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?feature_payment_success=true&listing_id=${listing.id}`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}`;

      const response = await api.functions.invoke('createYocoCheckout', {
        amount: selectedPlan.price,
        currency: 'ZAR',
        metadata: {
          payment_type: 'feature_listing',
          listing_id: listing.id,
          seller_id: listing.created_by,
          duration_days: selectedPlan.duration_days,
          plan_name: selectedPlan.name
        },
        successUrl,
        cancelUrl,
        failureUrl: cancelUrl
      });

      if (response.data.redirectUrl) {
        window.location.href = response.data.redirectUrl;
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Failed to initiate payment');
      setProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl rounded-2xl">
        <DialogHeader>
          <p className="eyebrow">Promote</p>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <Star className="w-5 h-5 text-yolk-500 fill-yolk-500" />
            Feature your listing
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-4 bg-yolk-50 border-yolk-200 rounded-2xl shadow-none">
            <div className="flex items-center gap-3">
              <img
                src={listing?.images?.[0] || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=100'}
                alt={listing?.title}
                className="w-16 h-16 rounded-xl object-cover ring-1 ring-yolk-200"
              />
              <div className="min-w-0">
                <h4 className="font-display text-ink truncate">{listing?.title}</h4>
                <p className="text-sm text-ink/65">R{listing?.price}</p>
              </div>
            </div>
          </Card>

          <div>
            <h3 className="font-display text-lg text-ink mb-3">Select promotion duration</h3>
            {pricingPlans.length === 0 ? (
              <p className="text-ink/65 text-sm">No pricing plans available. Contact admin.</p>
            ) : (
              <RadioGroup value={selectedPlan?.id} onValueChange={(id) => {
                const plan = pricingPlans.find(p => p.id === id);
                setSelectedPlan(plan);
              }}>
                <div className="grid gap-3">
                  {pricingPlans.map((plan) => (
                    <label key={plan.id} htmlFor={plan.id} className="cursor-pointer">
                      <Card className={`p-4 rounded-2xl transition-all shadow-none ${selectedPlan?.id === plan.id ? 'border-moss-600 border-2 bg-moss-50/60' : 'border-border hover:border-moss-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={plan.id} id={plan.id} />
                            <div>
                              <p className="font-semibold text-ink">{plan.name}</p>
                              <p className="text-sm text-ink/60">{plan.duration_days} days featured</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-display text-2xl font-bold text-moss-700">R{plan.price}</p>
                          </div>
                        </div>
                      </Card>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            )}
          </div>

          {selectedPlan && (
            <div className="bg-moss-50 border border-moss-100 rounded-2xl p-4">
              <h4 className="font-semibold text-ink mb-2">What you get</h4>
              <ul className="space-y-1.5 text-sm text-ink/75">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-moss-600" /> Top position in search results</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-moss-600" /> Featured badge on your listing</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-moss-600" /> Increased visibility to buyers</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-moss-600" /> Priority placement for {selectedPlan.duration_days} days</li>
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handlePayment}
              disabled={!selectedPlan || processing}
              className="flex-1 btn-cta h-12"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay with Yoco'
              )}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="px-8 h-12 rounded-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}