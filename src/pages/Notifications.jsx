import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, MessageCircle, Star, Shield, Wallet, Package, Loader2, Check, Trash2, ArrowUpRight, CheckCheck } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { Button } from '@/components/ui/button';

const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'inquiry', label: 'Inquiries' },
  { value: 'review', label: 'Reviews' },
  { value: 'payment', label: 'Payments' },
  { value: 'listing', label: 'Listings' },
  { value: 'verification', label: 'Verification' },
];

const ICONS = {
  inquiry:      { Icon: MessageCircle, cls: 'bg-moss-50 text-moss-700 border-moss-100' },
  review:       { Icon: Star,          cls: 'bg-yolk-50 text-yolk-600 border-yolk-100' },
  verification: { Icon: Shield,        cls: 'bg-fresh-50 text-moss-700 border-fresh-200' },
  payment:      { Icon: Wallet,        cls: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100' },
  listing:      { Icon: Package,       cls: 'bg-moss-50 text-moss-700 border-moss-100' },
  default:      { Icon: Bell,          cls: 'bg-cream-deep text-ink/60 border-border' },
};

const groupLabel = (d) => {
  const m = moment(d);
  if (m.isSame(moment(), 'day')) return 'Today';
  if (m.isSame(moment().subtract(1, 'day'), 'day')) return 'Yesterday';
  if (m.isAfter(moment().subtract(7, 'days'))) return 'This week';
  return 'Earlier';
};

export default function Notifications() {
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState('all');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    api.auth.me().then(setUser).catch(() => api.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all-notifications', user?.email],
    queryFn: () => api.entities.Notification.filter({ user_email: user?.email }, '-created_date'),
    enabled: !!user?.email,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
  };

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.entities.Notification.update(id, { read: true }),
    onSuccess: invalidate,
  });
  const markAllReadMutation = useMutation({
    mutationFn: async () => { await Promise.all(notifications.filter(n => !n.read).map(n => api.entities.Notification.update(n.id, { read: true }))); },
    onSuccess: () => { invalidate(); toast.success('All notifications marked as read'); },
    onError: (e) => toast.error(e?.message || 'Could not update notifications'),
  });
  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => api.entities.Notification.delete(id),
    onSuccess: () => { invalidate(); toast.success('Notification removed'); },
    onError: (e) => toast.error(e?.message || 'Could not delete notification'),
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const filtered = notifications.filter(n => (filter === 'all' || n.type === filter) && (!onlyUnread || !n.read));

  const groups = useMemo(() => {
    const order = ['Today', 'Yesterday', 'This week', 'Earlier'];
    const map = filtered.reduce((acc, n) => { const k = groupLabel(n.created_date); (acc[k] ||= []).push(n); return acc; }, {});
    return order.filter(k => map[k]).map(k => [k, map[k]]);
  }, [filtered]);

  const open = (n) => {
    if (!n.read) markAsReadMutation.mutate(n.id);
    if (n.link) window.location.href = n.link;
  };

  if (!user) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;

  return (
    <PageShell
      variant="compact"
      eyebrow="Inbox"
      title="Notifications"
      subtitle={unreadCount > 0 ? `${unreadCount} unread · stay on top of inquiries, payments and reviews.` : 'You are all caught up.'}
      action={unreadCount > 0 && (
        <Button onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending} className="btn-ghost border border-border bg-white px-4 py-2.5 text-sm gap-1.5">
          <CheckCheck className="w-4 h-4" /> Mark all read
        </Button>
      )}
    >
      <div className="max-w-3xl">
        {/* Filters */}
        <div className="card-premium p-2 mb-6 flex flex-wrap items-center gap-1">
          {TYPES.map(t => {
            const on = filter === t.value;
            const n = t.value === 'all' ? notifications.length : notifications.filter(x => x.type === t.value).length;
            if (t.value !== 'all' && n === 0) return null;
            return (
              <button key={t.value} onClick={() => setFilter(t.value)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${on ? 'bg-moss-600 text-cream' : 'text-ink/65 hover:bg-moss-50 hover:text-moss-700'}`}>
                {t.label} <span className={`ml-1 text-xs ${on ? 'text-cream/70' : 'text-ink/40'}`}>{n}</span>
              </button>
            );
          })}
          <label className="ml-auto inline-flex items-center gap-2 px-3 py-2 text-sm text-ink/65 cursor-pointer select-none">
            <input type="checkbox" checked={onlyUnread} onChange={e => setOnlyUnread(e.target.checked)} className="accent-[#174D35] w-4 h-4 rounded" />
            Unread only
          </label>
        </div>

        {isLoading ? (
          <div className="card-premium divide-y divide-border">{[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 animate-pulse"><div className="w-11 h-11 rounded-xl bg-cream-deep" /><div className="flex-1 space-y-2"><div className="h-4 bg-cream-deep rounded w-1/2" /><div className="h-3 bg-cream-deep rounded w-3/4" /></div></div>
          ))}</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Bell} title={onlyUnread ? 'No unread notifications' : 'No notifications'} subtitle="Activity on your listings, orders and auctions will show up here." />
        ) : (
          <div className="space-y-6">
            {groups.map(([label, items]) => (
              <section key={label}>
                <p className="eyebrow mb-2 px-1">{label}</p>
                <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.03 } } }} className="card-premium divide-y divide-border overflow-hidden">
                  {items.map(n => {
                    const { Icon, cls } = ICONS[n.type] || ICONS.default;
                    return (
                      <motion.li key={n.id} variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                        onClick={() => open(n)}
                        className={`group relative flex gap-4 p-4 cursor-pointer transition-colors ${n.read ? 'hover:bg-cream/70' : 'bg-moss-50/40 hover:bg-moss-50/70'}`}>
                        {!n.read && <span className="absolute left-0 top-0 bottom-0 w-1 bg-moss-600" />}
                        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${cls}`}><Icon className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <p className={`flex-1 leading-snug ${n.read ? 'text-ink/80' : 'text-ink font-semibold'}`}>{n.title}</p>
                            <span className="text-xs text-ink/45 whitespace-nowrap">{moment(n.created_date).fromNow()}</span>
                          </div>
                          {n.message && <p className="text-sm text-ink/60 mt-1 line-clamp-2">{n.message}</p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="chip !py-0 !px-2 text-[10px] capitalize">{n.type || 'general'}</span>
                            {n.link && <span className="text-xs text-moss-700 inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">Open <ArrowUpRight className="w-3 h-3" /></span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!n.read && (
                            <button onClick={(e) => { e.stopPropagation(); markAsReadMutation.mutate(n.id); }} title="Mark read"
                              className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/50 hover:bg-moss-50 hover:text-moss-700"><Check className="w-4 h-4" /></button>
                          )}
                          <button onClick={(e) => { e.stopPropagation(); deleteNotificationMutation.mutate(n.id); }} title="Delete"
                            className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-ink/50 hover:bg-terracotta-50 hover:text-terracotta-600"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </motion.li>
                    );
                  })}
                </motion.ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
