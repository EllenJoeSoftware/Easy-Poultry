import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { Bell, Check, MessageCircle, Star, Shield, DollarSign, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import moment from 'moment';

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
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => api.entities.Notification.update(n.id, { read: true })));
    },
    onSuccess: () => queryClient.invalidateQueries(['notifications'])
  });

  const getIcon = (type) => {
    switch (type) {
      case 'inquiry': return <MessageCircle className="w-4 h-4 text-moss-600" />;
      case 'review': return <Star className="w-4 h-4 text-yolk-500" />;
      case 'verification': return <Shield className="w-4 h-4 text-fresh-600" />;
      case 'payment': return <DollarSign className="w-4 h-4 text-terracotta-600" />;
      case 'listing': return <Package className="w-4 h-4 text-moss-600" />;
      default: return <Bell className="w-4 h-4 text-ink/55" />;
    }
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-terracotta-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50 overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-ink">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAllReadMutation.mutate()}
                  className="text-xs text-moss-600"
                >
                  Mark all read
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-ink/55">
                  <Bell className="w-8 h-8 mx-auto mb-2 text-ink/25" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b hover:bg-cream cursor-pointer ${!notification.read ? 'bg-moss-50/40' : ''}`}
                    onClick={() => {
                      if (!notification.read) markAsReadMutation.mutate(notification.id);
                      if (notification.link) window.location.href = notification.link;
                      setIsOpen(false);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.read ? 'font-semibold' : ''} text-ink`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-ink/65 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-ink/40 mt-1">
                          {moment(notification.created_date).fromNow()}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 rounded-full bg-moss-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link
              to={createPageUrl('Notifications')}
              className="block p-3 text-center text-sm text-moss-600 hover:bg-cream border-t"
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