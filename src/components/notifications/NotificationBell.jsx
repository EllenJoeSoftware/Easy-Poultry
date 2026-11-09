import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Bell, MessageCircle, Star, Shield, DollarSign, Package, CheckCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import moment from 'moment';
import { toast } from 'sonner';

export default function NotificationBell({ userEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => api.entities.Notification.filter({ user_email: userEmail }, '-created_date', 20),
    enabled: !!userEmail,
    refetchInterval: 30000
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsReadMutation = useMutation({
    mutationFn: (id) => api.entities.Notification.update(id, { read: true }),
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => api.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries(['notifications']),
    onError: (e) => toast.error(e?.message || 'Something went wrong')
  });

  const getIcon = (type) => {
    switch (type) {
      case 'inquiry': return { Icon: MessageCircle, cls: 'bg-moss-50 text-moss-700' };
      case 'review': return { Icon: Star, cls: 'bg-yolk-50 text-yolk-600' };
      case 'verification': return { Icon: Shield, cls: 'bg-fresh-50 text-moss-700' };
      case 'payment': return { Icon: DollarSign, cls: 'bg-terracotta-50 text-terracotta-600' };
      case 'listing': return { Icon: Package, cls: 'bg-moss-50 text-moss-700' };
      default: return { Icon: Bell, cls: 'bg-cream-deep text-ink/60' };
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-full flex items-center justify-center text-ink/70 hover:text-moss-700 hover:bg-cream-deep transition-colors"
        aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-yolk-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-yolk-500 ring-2 ring-white" />
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] card-premium z-50 overflow-hidden">
            <div className="px-4 py-3.5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base text-ink">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="chip chip-yolk text-[10px] !py-0.5">{unreadCount > 9 ? '9+' : unreadCount} new</span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="text-xs text-moss-700 hover:text-moss-800 font-medium inline-flex items-center gap-1 disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-ink/55">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-cream-deep flex items-center justify-center">
                    <Bell className="w-5 h-5 text-ink/30" />
                  </div>
                  <p className="text-sm font-medium text-ink/70">You're all caught up</p>
                  <p className="text-xs text-ink/45 mt-0.5">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const { Icon, cls } = getIcon(notification.type);
                  return (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 border-b border-border last:border-b-0 hover:bg-cream cursor-pointer transition-colors ${!notification.read ? 'bg-yolk-50/40' : ''}`}
                      onClick={() => {
                        if (!notification.read) markAsReadMutation.mutate(notification.id);
                        if (notification.link) window.location.href = notification.link;
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cls}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm leading-snug ${!notification.read ? 'font-semibold' : 'font-medium'} text-ink`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-ink/60 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[11px] text-ink/40 mt-1">
                            {moment(notification.created_date).fromNow()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-yolk-500 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link
              to={createPageUrl('Notifications')}
              className="block px-4 py-3 text-center text-sm font-medium text-moss-700 hover:bg-cream border-t border-border transition-colors"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
