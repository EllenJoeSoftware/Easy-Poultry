import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/api/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function YocoCheckoutButton({ 
  amount, 
  currency = 'ZAR',
  metadata = {},
  successUrl,
  cancelUrl,
  failureUrl,
  buttonText = 'Pay Now',
  className = '',
  onSuccess,
  onError
}) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await api.functions.invoke('createYocoCheckout', {
        amount,
        currency,
        metadata,
        successUrl,
        cancelUrl,
        failureUrl
      });

      if (response.data.redirectUrl) {
        // Redirect to Yoco checkout page
        window.location.href = response.data.redirectUrl;
      } else {
        throw new Error('No redirect URL received');
      }

      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to initiate payment. Please try again.');
      setLoading(false);
      
      if (onError) {
        onError(error);
      }
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={loading || !amount || amount <= 0}
      className={className}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          {buttonText} {amount > 0 && `- R${amount.toFixed(2)}`}
        </>
      )}
    </Button>
  );
}