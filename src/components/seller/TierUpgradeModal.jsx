import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Check, Crown } from 'lucide-react';
import { toast } from 'sonner';

export default function TierUpgradeModal({ isOpen, onClose, currentUser }) {
  const [selectedTier, setSelectedTier] = useState(null);
  const [processing, setProcessing] = useState(false);

  const { data: tiers = [] } = useQuery({
    queryKey: ['seller-tiers-upgrade'],
    queryFn: () => api.entities.SellerTier.list(),
    enabled: isOpen
  });

  const handlePayment = async () => {
    if (!selectedTier) {
      toast.error('Please select a tier');
      return;
    }

    setProcessing(true);
    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?tier_upgrade_success=true`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}`;

      const response = await api.functions.invoke('createYocoCheckout', {
        amount: selectedTier.price,
        currency: 'ZAR',
        metadata: {
          payment_type: 'tier_upgrade',
          seller_id: currentUser.email,
          from_tier: currentUser.seller_tier || 'basic',
          to_tier: selectedTier.name
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

  const currentTierName = currentUser?.seller_tier || 'basic';
  const availableTiers = tiers.filter(t => t.name !== currentTierName);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2"><Crown className="w-5 h-5 text-yolk-500" />Upgrade your tier</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="rounded-xl bg-cream border border-border px-4 py-3 text-sm text-ink/70 flex items-center justify-between">
            <span>Current tier</span>
            <span className="chip capitalize">{currentTierName}</span>
          </div>

          {availableTiers.length === 0 ? (
            <p className="text-center text-ink/65 py-6">You're already on the highest tier!</p>
          ) : (
            <>
              <RadioGroup value={selectedTier?.id} onValueChange={(value) => setSelectedTier(tiers.find(t => t.id === value))}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableTiers.map((tier) => {
                    const on = selectedTier?.id === tier.id;
                    return (
                      <label key={tier.id} htmlFor={tier.id}
                        className={`card-premium p-5 cursor-pointer transition-all block ${on ? 'ring-2 ring-moss-600 bg-moss-50/40' : 'hover:border-moss-300'}`}>
                        <div className="flex items-start gap-3">
                          <RadioGroupItem value={tier.id} id={tier.id} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <h3 className="font-display text-lg text-ink capitalize">{tier.name}</h3>
                              <p className="font-display font-bold text-xl text-moss-700">R{tier.price}<span className="text-xs font-normal text-ink/50">/mo</span></p>
                            </div>
                            <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
                              <li className="flex gap-2"><Check className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />{tier.max_listings} listings max</li>
                              <li className="flex gap-2"><Check className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />{tier.max_images_per_listing} images per listing</li>
                              {tier.can_show_phone && <li className="flex gap-2"><Check className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />Phone number visible</li>}
                              {tier.can_feature_listings && <li className="flex gap-2"><Check className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />Can feature listings</li>}
                            </ul>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </RadioGroup>

              <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
                <Button onClick={onClose} variant="outline" className="rounded-full">Cancel</Button>
                <Button onClick={handlePayment} disabled={!selectedTier || processing} className="btn-cta px-6 py-2.5">
                  {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : selectedTier ? `Pay R${selectedTier.price} with Yoco` : 'Pay with Yoco'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
