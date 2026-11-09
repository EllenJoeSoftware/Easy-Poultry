import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';

const BENEFITS = [
  'Verified badge on your profile',
  'Display your contact number to buyers',
  'Increased trust from potential buyers',
  'Priority in search results',
];

export default function VerificationPaymentModal({ isOpen, onClose, currentUser, formData }) {
  const [processing, setProcessing] = useState(false);

  const { data: adminSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const settings = await api.entities.AdminSettings.filter({ setting_key: 'main' });
      return settings[0] || { verification_fee: 0, verification_fee_message: '' };
    }
  });

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const successUrl = `${window.location.origin}${window.location.pathname}?verification_payment_success=true`;
      const cancelUrl = `${window.location.origin}${window.location.pathname}`;

      const response = await api.functions.invoke('createYocoCheckout', {
        amount: adminSettings?.verification_fee || 0,
        currency: 'ZAR',
        metadata: {
          payment_type: 'seller_verification',
          seller_id: currentUser.email,
          ...formData
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

  const verificationFee = adminSettings?.verification_fee || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Shield className="w-5 h-5 text-moss-600" />
            Seller verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-ink/70 leading-relaxed">
            {adminSettings?.verification_fee_message || 'A one-time admin verification fee is required to become a verified seller.'}
          </p>

          <div className="rounded-2xl bg-moss-gradient text-cream p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 grain opacity-50 pointer-events-none" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.18em] font-semibold text-yolk-300 mb-1">One-time fee</p>
              <p className="font-display font-bold text-4xl">R{verificationFee}</p>
            </div>
          </div>

          <div className="rounded-xl bg-cream border border-border p-4">
            <p className="eyebrow mb-2">What you get</p>
            <ul className="space-y-1.5 text-sm text-ink/70">
              {BENEFITS.map(b => <li key={b} className="flex gap-2"><Check className="w-4 h-4 text-moss-600 flex-shrink-0 mt-0.5" />{b}</li>)}
            </ul>
          </div>

          <Button onClick={handlePayment} disabled={verificationFee === 0 || processing} className="w-full btn-cta py-3">
            {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing…</> : 'Pay with Yoco'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
