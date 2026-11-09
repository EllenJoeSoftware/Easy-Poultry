import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Loader2, Users, Mail, Shield, User as UserIcon } from 'lucide-react';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

const ROLES = {
  admin:   { label: 'Admin',   tint: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100', desc: 'Full access — invite, remove, edit everything' },
  manager: { label: 'Manager', tint: 'bg-moss-50 text-moss-700 border-moss-100',                   desc: 'Manage listings, batches, feed, sales' },
  worker:  { label: 'Worker',  tint: 'bg-cream-deep text-ink/60 border-yolk-100',                  desc: 'Log daily activity (feed, eggs, vaccinations)' },
  viewer:  { label: 'Viewer',  tint: 'bg-yolk-50 text-yolk-600 border-yolk-100',                   desc: 'Read-only access to the farm dashboard' },
};

export default function FarmTeam() {
  const [user, setUser] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('worker');
  const [inviteName, setInviteName] = useState('');
  const qc = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => api.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['farm-members', user?.email],
    queryFn: () => api.entities.FarmMember.filter({ farm_owner_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const addMut = useMutation({
    mutationFn: (data) => api.entities.FarmMember.create(data),
    onSuccess: () => {
      toast.success(`Invited ${inviteEmail}`);
      qc.invalidateQueries(['farm-members']);
      setShowAdd(false); setInviteEmail(''); setInviteName(''); setInviteRole('worker');
    },
    onError: (e) => toast.error(e?.message || 'Could not add member'),
  });
  const removeMut = useMutation({
    mutationFn: (id) => api.entities.FarmMember.delete(id),
    onSuccess: () => { toast.success('Member removed'); qc.invalidateQueries(['farm-members']); },
    onError: (e) => toast.error(e?.message || 'Could not remove'),
  });
  const roleMut = useMutation({
    mutationFn: ({ id, role }) => api.entities.FarmMember.update(id, { role }),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries(['farm-members']); },
    onError: (e) => toast.error(e?.message || 'Could not update'),
  });

  const handleAdd = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) return toast.error('Enter a valid email');
    if (email === user?.email) return toast.error("You're already the farm owner");
    if (members.some(m => m.member_email?.toLowerCase() === email)) return toast.error('Already on the team');
    addMut.mutate({
      farm_owner_email: user.email, member_email: email,
      member_name: inviteName.trim() || email.split('@')[0],
      role: inviteRole, status: 'active', invited_by: user.email,
    });
  };

  return (
    <PageShell
      eyebrow="Farm"
      title="Team & staff access"
      subtitle="Give farm workers, managers and family members their own login to help run the farm."
      breadcrumb={[{ label: 'Farm', href: createPageUrl('FarmDashboard') }, { label: 'Team' }]}
      action={<Button onClick={() => setShowAdd(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><UserPlus className="w-4 h-4" />Invite member</Button>}
      variant="compact"
    >
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-moss-600" /></div>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="No team members yet"
          subtitle="Invite the people who help you run the farm. Each member signs in with their own email and gets access based on the role you assign."
          action={<Button onClick={() => setShowAdd(true)} className="btn-cta px-5 py-2.5 text-sm gap-1.5"><UserPlus className="w-4 h-4" />Invite first member</Button>} />
      ) : (
        <div className="card-premium overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-cream-deep text-xs uppercase tracking-wider text-ink/55">
              <tr><th className="text-left p-4">Member</th><th className="text-left p-4">Role</th><th className="text-left p-4">Added</th><th className="p-4"></th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((m) => {
                const r = ROLES[m.role] || ROLES.viewer;
                return (
                  <tr key={m.id} className="hover:bg-cream-deep/40">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-moss-gradient text-cream text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {(m.member_name || m.member_email || '?').slice(0, 1).toUpperCase()}
                        </div>
                        <div className="min-w-0"><p className="font-medium text-ink truncate">{m.member_name || '—'}</p><p className="text-xs text-ink/55 truncate">{m.member_email}</p></div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Select value={m.role} onValueChange={(v) => roleMut.mutate({ id: m.id, role: v })}>
                        <SelectTrigger className={`h-8 w-auto text-xs gap-1 border ${r.tint}`}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(ROLES).map(([k, v]) => (
                            <SelectItem key={k} value={k}><div><p className="font-medium">{v.label}</p><p className="text-xs text-ink/55">{v.desc}</p></div></SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4 text-xs text-ink/55">{m.created_date ? new Date(m.created_date).toLocaleDateString('en-ZA') : '—'}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => { if (confirm(`Remove ${m.member_email} from your team?`)) removeMut.mutate(m.id); }}
                        className="w-8 h-8 rounded-full hover:bg-terracotta-50 text-terracotta-600 flex items-center justify-center" aria-label="Remove">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 card-premium p-6 bg-moss-50/60 border-moss-100">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-moss-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-ink mb-1">How team access works</p>
            <p className="text-sm text-ink/70 leading-relaxed">Invited members sign up with the same email you invited. Once signed in they see your farm's dashboard, batches and finances based on their role. Change roles or remove members any time.</p>
          </div>
        </div>
      </div>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader><DialogTitle className="font-display text-2xl">Invite team member</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Email <span className="text-terracotta-500">*</span></Label>
              <div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="worker@example.com" className="pl-10" /></div></div>
            <div><Label>Name (optional)</Label>
              <div className="relative mt-1.5"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Their full name" className="pl-10" /></div></div>
            <div><Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLES).map(([k, v]) => (
                    <SelectItem key={k} value={k}><div><p className="font-medium">{v.label}</p><p className="text-xs text-ink/55">{v.desc}</p></div></SelectItem>
                  ))}
                </SelectContent>
              </Select></div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAdd} disabled={addMut.isPending} className="btn-cta flex-1 py-2.5">{addMut.isPending ? 'Adding…' : 'Send invite'}</Button>
              <Button variant="outline" onClick={() => setShowAdd(false)} className="rounded-full">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
