import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#7A9D7A]" />
            Seller Verification
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-[#7A9D7A]/10 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              {adminSettings?.verification_fee_message || 'A one-time admin verification fee is required to become a verified seller.'}
            </p>
          </div>

          <div className="text-center py-4">
            <p className="text-sm text-gray-500 mb-1">Verification Fee</p>
            <p className="text-3xl font-bold text-[#E07A5F]">R{verificationFee}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-medium">Benefits of verification:</p>
            <ul className="space-y-1 text-gray-600">
              <li>• Verified badge on your profile</li>
              <li>• Display your contact number to buyers</li>
              <li>• Increased trust from potential buyers</li>
              <li>• Priority in search results</li>
            </ul>
          </div>

          <Button
            onClick={handlePayment}
            disabled={verificationFee === 0 || processing}
            className="w-full bg-[#7A9D7A] hover:bg-[#6A8D6A]"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}