import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Upload, CheckCircle2, Clock, Loader2, Copy, CreditCard, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { toast } from 'sonner';
import moment from 'moment';

export default function AuctionHousePayment() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState(1);
  const [paymentProof, setPaymentProof] = useState('');
  const [reference, setReference] = useState('');
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const houseId = urlParams.get('houseId');
  const tierId = urlParams.get('tierId');
  const isRenewal = urlParams.get('renewal') === 'true';

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

  const { data: house } = useQuery({
    queryKey: ['auction-house', houseId],
    queryFn: async () => {
      const houses = await api.entities.AuctionHouse.filter({ id: houseId });
      return houses[0];
    },
    enabled: !!houseId
  });

  const { data: tier } = useQuery({
    queryKey: ['auction-house-tier', tierId || house?.tier_id],
    queryFn: async () => {
      const tiers = await api.entities.AuctionHouseTier.filter({ id: tierId || house?.tier_id });
      return tiers[0];
    },
    enabled: !!(tierId || house?.tier_id)
  });

  const { data: bankingInfo } = useQuery({
    queryKey: ['banking-info'],
    queryFn: async () => {
      const info = await api.entities.BankingInfo.filter({ is_active: true });
      return info[0];
    }
  });

  const { data: existingPayment } = useQuery({
    queryKey: ['auction-house-payment', houseId],
    queryFn: async () => {
      const payments = await api.entities.AuctionHousePayment.filter({ auction_house_id: houseId });
      return payments[0];
    },
    enabled: !!houseId
  });

  const submitPaymentMutation = useMutation({
    mutationFn: async () => {
      const periodStart = isRenewal && house?.subscription_end 
        ? moment(house.subscription_end).toISOString()
        : moment().toISOString();
      const periodEnd = moment(periodStart).add(1, 'month').toISOString();

      await api.entities.AuctionHousePayment.create({
        auction_house_id: houseId,
        seller_email: user.email,
        tier_id: tier?.id,
        tier_name: tier?.name,
        amount: tier?.monthly_price || 500,
        payment_type: isRenewal ? 'renewal' : 'initial',
        period_start: periodStart,
        period_end: periodEnd,
        payment_proof_url: paymentProof,
        payment_reference: reference,
        status: 'pending'
      });

      await api.entities.AuctionHouse.update(houseId, {
        status: 'awaiting_verification',
        payment_reminder_sent: false
      });
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
    toast.success('Copied');
  };

  const monthlyFee = tier?.monthly_price || 500;

  if (!user || !house || !tier) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7A9D7A]" />
      </div>
    );
  }

  if (existingPayment) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-16">
          <Card className="p-8 border-0 shadow-lg text-center">
            {existingPayment.status === 'pending' ? (
              <>
                <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Awaiting Verification</h2>
                <p className="text-gray-600 mb-6">Your payment is being reviewed. This usually takes 24-48 hours.</p>
              </>
            ) : existingPayment.status === 'verified' ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Verified!</h2>
                <p className="text-gray-600 mb-6">Your auction house is now active.</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-500 text-2xl">!</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Rejected</h2>
                <p className="text-gray-600 mb-2">{existingPayment.rejection_reason || 'Please contact support.'}</p>
              </>
            )}
            <Link to={createPageUrl('MyAuctionHouse')}>
              <Button className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">View My Auction House</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link to={createPageUrl('Auctions')} className="inline-flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#E07A5F]/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-[#E07A5F]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Auction House Fee</h1>
            <p className="text-gray-600">One-time payment to activate your auction house</p>
          </div>
        </div>

        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-[#7A9D7A] text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < 4 && <div className={`w-16 h-1 ${step > s ? 'bg-[#7A9D7A]' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">{isRenewal ? 'Renewal' : 'Subscription'} Details</h2>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center text-lg mb-2">
                <span>{tier?.name} Plan</span>
                <span className="font-bold text-[#E07A5F]">R{monthlyFee}/month</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• {tier?.max_live_auctions} simultaneous live auction{tier?.max_live_auctions > 1 ? 's' : ''}</p>
                <p>• Up to {tier?.max_items_per_auction} items per auction</p>
                {tier?.featured_placement && <p>• Featured placement</p>}
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800"><strong>Auction House:</strong> {house.name}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-green-800">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {isRenewal ? 'Renewal' : 'Subscription'} period: {moment().format('MMM D, YYYY')} - {moment().add(1, 'month').format('MMM D, YYYY')}
                </span>
              </div>
            </div>
            <Button onClick={() => setStep(2)} className="w-full bg-[#7A9D7A] hover:bg-[#6A8D6A]">Continue</Button>
          </Card>
        )}

        {step === 2 && bankingInfo && (
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Banking Details</h2>
            <div className="space-y-3 bg-gray-50 rounded-lg p-4 mb-6">
              {[
                { label: 'Bank', value: bankingInfo.bank_name },
                { label: 'Account Holder', value: bankingInfo.account_holder },
                { label: 'Account Number', value: bankingInfo.account_number },
                { label: 'Account Type', value: bankingInfo.account_type },
                { label: 'Branch Code', value: bankingInfo.branch_code },
                { label: 'Amount', value: `R${monthlyFee}` },
                { label: 'Reference', value: `AH-${houseId?.slice(-8)}` }
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-gray-600">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{value}</span>
                    <button onClick={() => copyToClipboard(value)} className="text-[#7A9D7A]"><Copy className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={() => setStep(3)} className="w-full bg-[#7A9D7A] hover:bg-[#6A8D6A]">I've Made the Payment</Button>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 border-0 shadow-lg">
            <h2 className="font-semibold text-gray-900 mb-4">Upload Proof</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Payment Reference</label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Enter reference" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Proof of Payment</label>
                {paymentProof ? (
                  <div className="relative">
                    <img src={paymentProof} alt="Proof" className="w-full max-h-64 object-contain rounded-lg border" />
                    <button onClick={() => setPaymentProof('')} className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full">×</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg cursor-pointer hover:border-[#7A9D7A]">
                    {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8 text-gray-400 mb-2" />}
                    <span className="text-sm text-gray-500">Click to upload</span>
                    <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                  </label>
                )}
              </div>
              <Button onClick={() => submitPaymentMutation.mutate()} disabled={!paymentProof || !reference || submitPaymentMutation.isPending} className="w-full bg-[#E07A5F] hover:bg-[#D06A4F]">
                {submitPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Submit
              </Button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-8 border-0 shadow-lg text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Submitted!</h2>
            <p className="text-gray-600 mb-6">Your auction house will be activated once verified (24-48 hours).</p>
            <Link to={createPageUrl('MyAuctionHouse')}>
              <Button className="bg-[#7A9D7A] hover:bg-[#6A8D6A]">View My Auction House</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}