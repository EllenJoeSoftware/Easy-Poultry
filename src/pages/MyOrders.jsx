import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Download, FileText, Loader2, Package, ExternalLink, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import EmptyState from '@/components/shell/EmptyState';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '../utils';

const STATUS = {
  paid:      { label: 'Paid',      tint: 'bg-moss-50 text-moss-700 border-moss-100',           icon: CheckCircle2 },
  pending:   { label: 'Pending',   tint: 'bg-yolk-50 text-yolk-600 border-yolk-100',           icon: Clock },
  failed:    { label: 'Failed',    tint: 'bg-terracotta-50 text-terracotta-600 border-terracotta-100', icon: XCircle },
  cancelled: { label: 'Cancelled', tint: 'bg-cream-deep text-ink/60 border-yolk-100',          icon: XCircle },
};

export default function MyOrders() {
  const [user, setUser] = useState(null);
  useEffect(() => {
    api.auth.me().then(setUser).catch(() => api.auth.redirectToLogin(window.location.href));
  }, []);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders', user?.uid || user?.id],
    queryFn: () => api.entities.Order.filter({ buyer_uid: user?.uid || user?.id }, '-created_date'),
    enabled: !!user,
  });

  return (
    <PageShell
      eyebrow="Your account"
      title="Your orders"
      subtitle="Every purchase, payment status, and download in one place."
      breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Dashboard', href: createPageUrl('Dashboard') }, { label: 'My orders' }]}
    >
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-moss-600" /></div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders yet"
          subtitle="Browse the marketplace, find something you like, and your purchases will show up here."
          action={<Link to={createPageUrl('Marketplace')}><button className="btn-cta px-5 py-2.5 text-sm">Browse marketplace</button></Link>}
        />
      ) : (
        <div className="space-y-3">
          {orders.map((o) => <OrderRow key={o.id} order={o} />)}
        </div>
      )}
    </PageShell>
  );
}

function OrderRow({ order }) {
  const s = STATUS[order.status] || STATUS.pending;
  const Icon = s.icon;
  const files = order.digital_files?.length ? order.digital_files :
    (order.digital_file_url ? [{ url: order.digital_file_url, name: order.digital_file_name }] : []);
  const isDigital = order.product_type === 'digital';
  const date = order.created_date ? new Date(order.created_date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="card-premium p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row gap-4">
        <Link to={createPageUrl('ProductDetail') + `?id=${order.listing_id}`} className="flex-shrink-0">
          <img
            src={order.listing_image || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200'}
            alt={order.listing_title}
            className="w-full sm:w-24 h-24 rounded-xl object-cover bg-cream-deep"
          />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <Link to={createPageUrl('ProductDetail') + `?id=${order.listing_id}`}>
                <h3 className="font-display text-lg text-ink truncate hover:text-moss-700">{order.listing_title || 'Listing'}</h3>
              </Link>
              <p className="text-xs text-ink/55 mt-1">
                {date} · Order #{order.id?.slice(0, 8)}
                {isDigital && ' · Digital'}
              </p>
            </div>
            <Badge className={`gap-1 ${s.tint} border`}>
              <Icon className="w-3 h-3" />
              {s.label}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-display font-bold text-ink">R{order.amount?.toLocaleString('en-ZA')}</span>
            {order.quantity > 1 && <span className="text-ink/55">× {order.quantity}</span>}
          </div>

          {/* Digital download buttons */}
          {order.status === 'paid' && isDigital && files.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={f.name || true}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-moss-50 hover:bg-moss-100 text-moss-700 text-xs font-medium border border-moss-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {f.name || `File ${i + 1}`}
                </a>
              ))}
            </div>
          )}

          {/* Retry pay if not paid */}
          {order.status !== 'paid' && (
            <div className="mt-3">
              <Link
                to={createPageUrl('ProductDetail') + `?id=${order.listing_id}`}
                className="inline-flex items-center gap-1 text-xs text-moss-700 hover:underline"
              >
                Open listing
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
