import React, { useEffect, useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Wallet, Clock, CheckCircle2, XCircle, ArrowDownToLine, Banknote } from 'lucide-react';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import StatCard from '@/components/shell/StatCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

const PLATFORM_FEE_PCT = 0.05; // 5% — must match Cloud Function constant

const STATUS = {
  requested: { label: 'Requested', tint: 'bg-yolk-50 text-yolk-600 border-yolk-100',                     icon: Clock },
  approved:  { label: 'Approved',  tint: 'bg-moss-50 text-moss-700 border-moss-100',                     icon: CheckCircle2 },
  paid:      { label: 'Paid out',  tint: 'bg-moss-100 text-moss-800 border-moss-200',                    icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  tint: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100',   icon: XCircle },
};

export default function Payouts() {
  const [user, setUser] = useState(null);
  const [showRequest, setShowRequest] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const qc = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => api.auth.redirectToLogin(window.location.href));
  }, []);

  // Available balance = sum of paid orders for this seller minus fee minus all prior payouts
  const { data: paidOrders = [] } = useQuery({
    queryKey: ['seller-paid-orders', user?.email],
    queryFn: () => api.entities.Order.filter({ seller_email: user?.email, status: 'paid' }),
    enabled: !!user?.email,
  });
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['my-payouts', user?.email],
    queryFn: () => api.entities.PayoutRequest.filter({ seller_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const { gross, fees, paidOut, pending, available } = useMemo(() => {
    const grossR = paidOrders.reduce((s, o) => s + (o.amount || 0), 0);
    const feesR = grossR * PLATFORM_FEE_PCT;
    const paidOutR = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);
    const pendingR = payouts.filter(p => ['requested', 'approved'].includes(p.status)).reduce((s, p) => s + (p.amount || 0), 0);
    return {
      gross: grossR, fees: feesR, paidOut: paidOutR, pending: pendingR,
      available: Math.max(0, grossR - feesR - paidOutR - pendingR),
    };
  }, [paidOrders, payouts]);

  const requestMut = useMutation({
    mutationFn: (data) => api.functions.invoke('requestPayout', data),
    onSuccess: () => {
      toast.success('Payout requested — admin will process within 2 business days.');
      qc.invalidateQueries(['my-payouts']);
      setShowRequest(false);
      setRequestAmount(''); setBankName(''); setAccountName(''); setAccountNumber(''); setBranchCode('');
    },
    onError: (e) => toast.error(e?.message || 'Could not request payout'),
  });

  const fmt = (n) => `R${(n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}`;

  return (
    <PageShell
      eyebrow="Finances"
      title="Payouts"
      subtitle="Withdraw money from your sales to your bank account. We take a small platform fee."
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Payouts' }]}
      action={
        <Button
          onClick={() => setShowRequest(true)}
          disabled={available <= 0}
          className="btn-cta px-5 py-2.5 text-sm gap-1.5"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Request payout
        </Button>
      }
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Wallet}    label="Available"   value={fmt(available)} tint="moss"        deltaLabel="ready to withdraw" />
        <StatCard icon={Clock}     label="Pending"     value={fmt(pending)}   tint="yolk"        deltaLabel="awaiting payment" />
        <StatCard icon={CheckCircle2} label="Paid out" value={fmt(paidOut)}    tint="sage"        deltaLabel="historic total" />
        <StatCard icon={Banknote}  label="Gross sales" value={fmt(gross)}     tint="terracotta"  deltaLabel={`fee ${fmt(fees)} (5%)`} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-moss-600" /></div>
      ) : payouts.length === 0 ? (
        <EmptyState
          icon={ArrowDownToLine}
          title="No payouts yet"
          subtitle="Once you have available balance, click 'Request payout' to withdraw it to your bank account."
        />
      ) : (
        <div className="card-premium overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep text-xs uppercase tracking-wider text-ink/55">
              <tr>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Bank</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Admin notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payouts.map((p) => {
                const s = STATUS[p.status] || STATUS.requested;
                const Icon = s.icon;
                return (
                  <tr key={p.id} className="hover:bg-cream-deep/40">
                    <td className="p-4 text-ink/75">{p.created_date ? new Date(p.created_date).toLocaleDateString('en-ZA') : '—'}</td>
                    <td className="p-4 font-display font-bold text-ink">{fmt(p.amount)}</td>
                    <td className="p-4 text-ink/65 text-xs">
                      <div>{p.bank_name}</div>
                      <div className="text-ink/45">{p.account_number?.slice(-4)?.padStart(p.account_number?.length || 0, '•')}</div>
                    </td>
                    <td className="p-4"><Badge className={`gap-1 ${s.tint} border`}><Icon className="w-3 h-3" />{s.label}</Badge></td>
                    <td className="p-4 text-ink/55 text-xs max-w-xs">{p.admin_notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Request payout dialog */}
      <Dialog open={showRequest} onOpenChange={setShowRequest}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Request payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-moss-50 border border-moss-100 text-sm">
              Available to withdraw: <span className="font-bold text-moss-700">{fmt(available)}</span>
            </div>
            <div>
              <Label>Amount (R)</Label>
              <Input type="number" step="0.01" min="50" max={available}
                value={requestAmount} onChange={(e) => setRequestAmount(e.target.value)} placeholder="0.00" />
              <p className="text-[11px] text-ink/55 mt-1">Minimum R50. Maximum {fmt(available)}.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Bank</Label><Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="FNB / Capitec / ABSA…" /></div>
              <div><Label>Branch code</Label><Input value={branchCode} onChange={(e) => setBranchCode(e.target.value)} placeholder="250655" /></div>
            </div>
            <div><Label>Account holder</Label><Input value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Full name" /></div>
            <div><Label>Account number</Label><Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0000000000" /></div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => {
                  const amt = parseFloat(requestAmount);
                  if (!amt || amt < 50)             return toast.error('Minimum payout is R50');
                  if (amt > available)              return toast.error(`Available balance is only ${fmt(available)}`);
                  if (!bankName || !accountName || !accountNumber) return toast.error('Fill in all bank details');
                  requestMut.mutate({ amount: amt, bank_name: bankName, account_name: accountName, account_number: accountNumber, branch_code: branchCode });
                }}
                disabled={requestMut.isPending}
                className="btn-cta flex-1 py-2.5"
              >
                {requestMut.isPending ? 'Submitting…' : 'Submit request'}
              </Button>
              <Button variant="outline" className="rounded-full" onClick={() => setShowRequest(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
