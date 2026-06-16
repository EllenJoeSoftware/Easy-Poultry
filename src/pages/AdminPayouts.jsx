import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Wallet, CheckCircle2, XCircle, Clock, ShieldAlert } from 'lucide-react';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

const STATUS = {
  requested: { label: 'Requested', tint: 'bg-yolk-50 text-yolk-600 border-yolk-100', icon: Clock },
  approved:  { label: 'Approved',  tint: 'bg-moss-50 text-moss-700 border-moss-100', icon: CheckCircle2 },
  paid:      { label: 'Paid',      tint: 'bg-moss-100 text-moss-800 border-moss-200', icon: CheckCircle2 },
  rejected:  { label: 'Rejected',  tint: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100', icon: XCircle },
};

export default function AdminPayouts() {
  const [user, setUser] = useState(null);
  const qc = useQueryClient();
  useEffect(() => { api.auth.me().then(setUser).catch(() => {}); }, []);

  const { data: all = [], isLoading } = useQuery({
    queryKey: ['admin-payouts'],
    queryFn: () => api.entities.PayoutRequest.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const actionMut = useMutation({
    mutationFn: ({ name, payload }) => api.functions.invoke(name, payload),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries(['admin-payouts']); },
    onError: (e) => toast.error(e?.message || 'Failed'),
  });

  if (user && user.role !== 'admin') {
    return (
      <PageShell title="Admin only" subtitle="You need admin privileges to view this page.">
        <EmptyState icon={ShieldAlert} title="Access denied" subtitle="Only platform admins can view & process payouts." />
      </PageShell>
    );
  }

  const fmt = (n) => `R${(n || 0).toLocaleString('en-ZA', { maximumFractionDigits: 2 })}`;
  const buckets = {
    requested: all.filter(p => p.status === 'requested'),
    approved:  all.filter(p => p.status === 'approved'),
    history:   all.filter(p => p.status === 'paid' || p.status === 'rejected'),
  };

  const renderTable = (rows, withActions = true) => (
    rows.length === 0 ? (
      <EmptyState icon={Wallet} title="No payouts in this bucket" />
    ) : (
      <div className="card-premium overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream-deep text-xs uppercase tracking-wider text-ink/55">
            <tr>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Seller</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Bank details</th>
              <th className="text-left p-3">Status</th>
              {withActions && <th className="text-left p-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => {
              const s = STATUS[p.status] || STATUS.requested;
              const Icon = s.icon;
              return (
                <tr key={p.id}>
                  <td className="p-3 text-ink/75">{p.created_date ? new Date(p.created_date).toLocaleDateString('en-ZA') : '—'}</td>
                  <td className="p-3 text-ink/75 text-xs">{p.seller_email}</td>
                  <td className="p-3 font-display font-bold text-ink">{fmt(p.amount)}</td>
                  <td className="p-3 text-xs text-ink/70">
                    <div>{p.bank_name} · {p.branch_code}</div>
                    <div>{p.account_name}</div>
                    <div className="font-mono">{p.account_number}</div>
                  </td>
                  <td className="p-3"><Badge className={`gap-1 ${s.tint} border`}><Icon className="w-3 h-3" />{s.label}</Badge></td>
                  {withActions && (
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {p.status === 'requested' && (
                          <>
                            <Button size="sm" onClick={() => actionMut.mutate({ name: 'approvePayout', payload: { payoutId: p.id } })} className="btn-cta px-3 py-1 text-xs">Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              const notes = window.prompt('Rejection reason?');
                              if (notes !== null) actionMut.mutate({ name: 'rejectPayout', payload: { payoutId: p.id, notes } });
                            }} className="rounded-full text-xs">Reject</Button>
                          </>
                        )}
                        {p.status === 'approved' && (
                          <Button size="sm" onClick={() => {
                            const ref = window.prompt('Bank reference / proof of payment ref?') || '';
                            actionMut.mutate({ name: 'markPayoutPaid', payload: { payoutId: p.id, notes: `Paid ref: ${ref}` } });
                          }} className="btn-cta px-3 py-1 text-xs">Mark paid</Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )
  );

  return (
    <PageShell
      eyebrow="Admin"
      title="Payouts"
      subtitle="Review and process seller payout requests."
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Admin', href: createPageUrl('Admin') }, { label: 'Payouts' }]}
    >
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-moss-600" /></div>
      ) : (
        <Tabs defaultValue="requested">
          <TabsList className="bg-white border border-border rounded-full p-1 h-auto inline-flex mb-6">
            <TabsTrigger value="requested" className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">New ({buckets.requested.length})</TabsTrigger>
            <TabsTrigger value="approved"  className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">Approved ({buckets.approved.length})</TabsTrigger>
            <TabsTrigger value="history"   className="rounded-full px-4 py-2 data-[state=active]:bg-moss-600 data-[state=active]:text-cream">History ({buckets.history.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="requested">{renderTable(buckets.requested)}</TabsContent>
          <TabsContent value="approved">{renderTable(buckets.approved)}</TabsContent>
          <TabsContent value="history">{renderTable(buckets.history, false)}</TabsContent>
        </Tabs>
      )}
    </PageShell>
  );
}
