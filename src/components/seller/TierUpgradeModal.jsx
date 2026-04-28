import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2 } from 'lucide-react';
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
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Upgrade Your Tier</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Current Tier:</strong> {currentTierName.charAt(0).toUpperCase() + currentTierName.slice(1)}
            </p>
          </div>

          {availableTiers.length === 0 ? (
            <p className="text-center text-gray-600">You're already on the highest tier!</p>
          ) : (
            <>
              <RadioGroup value={selectedTier?.id} onValueChange={(value) => setSelectedTier(tiers.find(t => t.id === value))}>
                <div className="grid sm:grid-cols-2 gap-4">
                  {availableTiers.map((tier) => (
                    <Card key={tier.id} className={`p-6 cursor-pointer transition-all ${selectedTier?.id === tier.id ? 'border-2 border-[#7A9D7A] bg-[#7A9D7A]/5' : 'border hover:border-[#7A9D7A]/50'}`}>
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={tier.id} id={tier.id} />
                        <label htmlFor={tier.id} className="flex-1 cursor-pointer">
                          <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                          <p className="text-2xl font-bold text-[#7A9D7A] mt-1">R{tier.price}/mo</p>
                          <div className="mt-3 space-y-1 text-sm text-gray-600">
                            <p>• {tier.max_listings} listings max</p>
                            <p>• {tier.max_images_per_listing} images per listing</p>
                            {tier.can_show_phone && <p>• Phone number visible</p>}
                            {tier.can_feature_listings && <p>• Can feature listings</p>}
                          </div>
                        </label>
                      </div>
                    </Card>
                  ))}
                </div>
              </RadioGroup>

              <div className="flex gap-3">
                <Button
                  onClick={handlePayment}
                  disabled={!selectedTier || processing}
                  className="flex-1 bg-[#7A9D7A] hover:bg-[#6A8D6A] h-12"
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
                <Button onClick={onClose} variant="outline" className="h-12">
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}