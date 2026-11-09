import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2, Clock, Loader2, Copy, CreditCard, Landmark, FileCheck, AlertCircle, X, Gavel } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createPageUrl } from '../utils';

const STEPS = [
  { n: 1, label: 'Fee', icon: CreditCard },
  { n: 2, label: 'Bank details', icon: Landmark },
  { n: 3, label: 'Proof', icon: Upload },
  { n: 4, label: 'Done', icon: FileCheck },
];

function Stepper({ step }) {
  return (
    <ol className="card-premium p-3 sm:p-4 mb-6 grid grid-cols-4 gap-2">
      {STEPS.map(({ n, label, icon: Icon }) => {
        const done = step > n, on = step === n;
        return (
          <li key={n} className="flex flex-col items-center text-center gap-1.5">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition-colors ${done ? 'bg-moss-600 border-moss-600 text-cream' : on ? 'bg-moss-50 border-moss-300 text-moss-700' : 'bg-cream border-border text-ink/40'}`}>
              {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
            </div>
            <span className={`text-[11px] font-medium ${on || done ? 'text-ink' : 'text-ink/45'}`}>{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

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
    },
    onError: (e) => toast.error(e?.message || 'Something went wrong')
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
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  const crumbs = [{ label: 'My auctions', href: createPageUrl('MyAuctions') }, { label: 'Verification fee' }];

  // If already paid
  if (existingPayment) {
    const s = existingPayment.status;
    return (
      <PageShell variant="compact" eyebrow="Sell" title="Auction verification fee" subtitle={auction.title} breadcrumb={crumbs}>
        <div className="max-w-2xl">
          <EmptyState
            icon={s === 'pending' ? Clock : s === 'verified' ? CheckCircle2 : AlertCircle}
            title={s === 'pending' ? 'Awaiting verification' : s === 'verified' ? 'Payment verified' : 'Payment rejected'}
            subtitle={s === 'pending' ? 'Your payment is being reviewed by our admin team. This usually takes 24-48 hours.'
              : s === 'verified' ? 'Your auction is now active and visible to bidders.'
              : (existingPayment.rejection_reason || 'Please contact support.')}
            action={<Link to={createPageUrl('Auctions')}><Button className="btn-cta px-5 py-2.5 text-sm">View auctions</Button></Link>} />
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell variant="compact" eyebrow="Sell" title="Auction verification fee"
      subtitle="Complete the once-off fee to activate your auction."
      breadcrumb={crumbs}>
      <div className="max-w-2xl">
        <Stepper step={step} />

        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {step === 1 && (
            <div className="card-premium overflow-hidden">
              <div className="bg-moss-gradient text-cream p-6 relative overflow-hidden">
                <div className="absolute inset-0 grain opacity-50" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider opacity-80">Verification fee</p>
                    <p className="font-display text-4xl font-bold tabular-nums mt-1">R{auctionFee}</p>
                  </div>
                  <CreditCard className="w-8 h-8 opacity-70" />
                </div>
                <p className="relative text-xs opacity-80 mt-2">Covers auction hosting and verification services.</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-xl bg-cream border border-border p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700 flex-shrink-0"><Gavel className="w-4 h-4" /></div>
                  <div className="min-w-0">
                    <p className="text-xs text-ink/50">Auction</p>
                    <p className="font-medium text-ink truncate">{auction.title}</p>
                  </div>
                </div>
                <Button onClick={() => setStep(2)} className="w-full btn-cta py-3">Continue to payment</Button>
              </div>
            </div>
          )}

          {step === 2 && bankingInfo && (
            <div className="card-premium p-6">
              <h2 className="font-display text-xl text-ink mb-1">Banking details</h2>
              <p className="text-sm text-ink/60 mb-5">Make an EFT payment to the account below and use the reference exactly as shown.</p>
              <dl className="rounded-xl border border-border divide-y divide-border mb-6 overflow-hidden">
                {[
                  { label: 'Bank', value: bankingInfo.bank_name },
                  { label: 'Account holder', value: bankingInfo.account_holder },
                  { label: 'Account number', value: bankingInfo.account_number },
                  { label: 'Account type', value: bankingInfo.account_type },
                  { label: 'Branch code', value: bankingInfo.branch_code },
                  { label: 'Amount', value: `R${auctionFee}` },
                  { label: 'Reference', value: `AUC-${auctionId?.slice(-8)}` }
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between gap-3 px-4 py-3 bg-white hover:bg-cream/60">
                    <dt className="text-sm text-ink/60">{label}</dt>
                    <dd className="flex items-center gap-2">
                      <span className="font-medium text-ink text-sm tabular-nums">{value}</span>
                      <button type="button" onClick={() => copyToClipboard(value)} aria-label={`Copy ${label}`}
                        className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-ink/45 hover:bg-moss-50 hover:text-moss-700"><Copy className="w-3.5 h-3.5" /></button>
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="rounded-full sm:w-auto" onClick={() => setStep(1)}>Back</Button>
                <Button onClick={() => setStep(3)} className="flex-1 btn-cta py-3">I've made the payment</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card-premium p-6">
              <h2 className="font-display text-xl text-ink mb-1">Upload proof of payment</h2>
              <p className="text-sm text-ink/60 mb-5">A screenshot or PDF of your EFT confirmation.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-ink/75 mb-1.5">Payment reference</label>
                  <Input className="rounded-xl" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Enter your payment reference" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink/75 mb-1.5">Proof of payment</label>
                  {paymentProof ? (
                    <div className="relative rounded-xl border border-border bg-cream p-2">
                      <img src={paymentProof} alt="Proof" className="w-full max-h-64 object-contain rounded-lg" />
                      <button type="button" onClick={() => setPaymentProof('')} aria-label="Remove proof"
                        className="absolute top-3 right-3 w-8 h-8 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full flex items-center justify-center shadow-sm"><X className="w-4 h-4" /></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-border bg-cream rounded-xl cursor-pointer hover:border-moss-400 hover:bg-moss-50/40 transition-colors">
                      {uploading ? <Loader2 className="w-8 h-8 animate-spin text-moss-600" /> : (
                        <>
                          <Upload className="w-8 h-8 text-ink/40 mb-2" />
                          <span className="text-sm text-ink/55">Click to upload proof</span>
                          <span className="text-xs text-ink/40 mt-0.5">PNG, JPG or PDF</span>
                        </>
                      )}
                      <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                    </label>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button variant="outline" className="rounded-full sm:w-auto" onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={() => submitPaymentMutation.mutate()} disabled={!paymentProof || !reference || submitPaymentMutation.isPending}
                    className="flex-1 btn-cta py-3 gap-2">
                    {submitPaymentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                    Submit for verification
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <EmptyState icon={CheckCircle2} title="Payment submitted"
              subtitle="Your auction will be activated once an admin verifies your payment. This usually takes 24-48 hours."
              action={<Link to={createPageUrl('MyAuctions')}><Button className="btn-cta px-5 py-2.5 text-sm">View my auctions</Button></Link>} />
          )}
        </motion.div>
      </div>
    </PageShell>
  );
}
