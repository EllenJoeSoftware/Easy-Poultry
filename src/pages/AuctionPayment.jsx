import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Upload, CheckCircle2, Clock, Loader2, Copy, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';

export default function AuctionPayment() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [paymentProof, setPaymentProof] = useState('');
  const [reference, setReference] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const auctionId = urlParams.get('auctionId');

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

  const { data: auction } = useQuery({
    queryKey: ['auction', auctionId],
    queryFn: async () => {
      const auctions = await api.entities.Auction.filter({ id: auctionId });
      return auctions[0];
    },
    enabled: !!auctionId
  });

  const { data: adminSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const settings = await api.entities.AdminSettings.filter({ setting_key: 'main' });
      return settings[0] || { auction_fee: 50 };
    }
  });

  const { data: bankingInfo } = useQuery({
    queryKey: ['banking-info'],
    queryFn: async () => {
      const info = await api.entities.BankingInfo.filter({ is_active: true });
      return info[0];
    }
  });

  const { data: existingPayment } = useQuery({
    queryKey: ['auction-payment', auctionId],
    queryFn: async () => {
      const payments = await api.entities.AuctionPayment.filter({ auction_id: auctionId });
      return payments[0];
    },
    enabled: !!auctionId
  });

  const submitPaymentMutation = useMutation({
    mutationFn: async () => {
      const payment = await api.entities.AuctionPayment.create({
        auction_id: auctionId,
        seller_email: user.email,
        amount: adminSettings?.auction_fee || 50,
        payment_proof_url: paymentProof,
        payment_reference: reference,
        status: 'pending'
      });

      await api.entities.Auction.update(auctionId, {
        status: 'awaiting_verification'
      });

      return payment;
    },
    onSuccess: () => {
      toast.success('Payment submitted! Awaiting admin verification.');
      setStep(4);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await api.integrations.Core.UploadFile({ file });
    setPaymentProof(file_url);
    setUploading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const auctionFee = adminSettings?.auction_fee || 50;

  if (!user || !auction) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-moss-600" />
      </div>
    );
  }

  // If already paid
  if (existingPayment) {
    return (
      <div className="min-h-[80vh] bg-cream">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="p-8 card-premium text-center">
            {existingPayment.status === 'pending' ? (
              <>
                <Clock className="w-16 h-16 text-yolk-500 mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold text-ink mb-2">Awaiting Verification</h2>
                <p className="text-ink/65 mb-6">Your payment is being reviewed by our admin team. This usually takes 24-48 hours.</p>
              </>
            ) : existingPayment.status === 'verified' ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-fresh-600 mx-auto mb-4" />
                <h2 className="font-display text-2xl font-bold text-ink mb-2">Payment Verified!</h2>
                <p className="text-ink/65 mb-6">Your auction is now active.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-terracotta-500 text-2xl">!</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-ink mb-2">Payment Rejected</h2>
                <p className="text-ink/65 mb-2">{existingPayment.rejection_reason || 'Please contact support.'}</p>
              </>
            )}
            <Link to={createPageUrl('Auctions')}>
              <Button className="btn-cta">View Auctions</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] bg-cream">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link to={createPageUrl('Auctions')} className="inline-flex items-center text-ink/65 hover:text-ink">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Auctions
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-terracotta-500/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-terracotta-600" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Auction Verification Fee</h1>
            <p className="text-ink/65">Complete payment to activate your auction</p>
          </div>
        </div>

        {/* Steps Progress */}
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-moss-600 text-white' : 'bg-cream-deep text-ink/55'}`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 4 && <div className={`w-16 h-1 ${step > s ? 'bg-moss-600' : 'bg-cream-deep'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="p-6 card-premium">
            <h2 className="font-semibold text-ink mb-4">Auction Fee Details</h2>
            <div className="bg-cream rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center text-lg">
                <span>Auction Verification Fee</span>
                <span className="font-bold text-terracotta-600">R{auctionFee}</span>
              </div>
              <p className="text-sm text-ink/55 mt-2">This fee covers auction hosting and verification services.</p>
            </div>
            <div className="bg-moss-50 border border-moss-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-moss-800">
                <strong>Auction:</strong> {auction.title}
              </p>
            </div>
            <Button onClick={() => setStep(2)} className="w-full btn-cta">
              Continue to Payment
            </Button>
          </Card>
        )}

        {step === 2 && bankingInfo && (
          <Card className="p-6 card-premium">
            <h2 className="font-semibold text-ink mb-4">Banking Details</h2>
            <p className="text-ink/65 mb-4">Please make an EFT payment to the following account:</p>
            <div className="space-y-3 bg-cream rounded-lg p-4 mb-6">
              {[
                { label: 'Bank', value: bankingInfo.bank_name },
                { label: 'Account Holder', value: bankingInfo.account_holder },
                { label: 'Account Number', value: bankingInfo.account_number },
                { label: 'Account Type', value: bankingInfo.account_type },
                { label: 'Branch Code', value: bankingInfo.branch_code },
                { label: 'Amount', value: `R${auctionFee}` },
                { label: 'Reference', value: `AUC-${auctionId?.slice(-8)}` }
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-ink/65">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{value}</span>
                    <button onClick={() => copyToClipboard(value)} className="text-moss-600 hover:text-moss-700">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setStep(3)} className="w-full btn-cta">
              I've Made the Payment
            </Button>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 card-premium">
            <h2 className="font-semibold text-ink mb-4">Upload Proof of Payment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink/75 mb-2">Payment Reference</label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Enter your payment reference"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink/75 mb-2">Proof of Payment</label>
                {paymentProof ? (
                  <div className="relative">
                    <img src={paymentProof} alt="Proof" className="w-full max-h-64 object-contain rounded-lg border" />
                    <button
                      onClick={() => setPaymentProof('')}
                      className="absolute top-2 right-2 w-8 h-8 bg-terracotta-500 text-white rounded-full flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-moss-600">
                    {uploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-ink/40" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-ink/40 mb-2" />
                        <span className="text-sm text-ink/55">Click to upload proof</span>
                      </>
                    )}
                    <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>
              <Button
                onClick={() => submitPaymentMutation.mutate()}
                disabled={!paymentProof || !reference || submitPaymentMutation.isPending}
                className="w-full bg-terracotta-500 hover:bg-terracotta-600 text-white"
              >
                {submitPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit for Verification
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-8 card-premium text-center">
            <CheckCircle2 className="w-16 h-16 text-fresh-600 mx-auto mb-4" />
            <h2 className="font-display text-2xl font-bold text-ink mb-2">Payment Submitted!</h2>
            <p className="text-ink/65 mb-6">Your auction will be activated once an admin verifies your payment. This usually takes 24-48 hours.</p>
            <Link to={createPageUrl('MyAuctions')}>
              <Button className="btn-cta">View My Auctions</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}