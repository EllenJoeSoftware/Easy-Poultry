import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Store } from 'lucide-react';
import { api } from '@/api/client';
import PageShell from '@/components/shell/PageShell';
import { ReviewList } from '../components/reviews/SellerReviews';
import { createPageUrl } from '../utils';

export default function SellerReviews() {
  const [user, setUser] = useState(null);

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

  if (!user) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-moss-600" /></div>;
  }

  return (
    <PageShell
      variant="compact"
      eyebrow="Sell"
      title="My reviews"
      subtitle="See what buyers are saying about you and reply to every review — a quick, friendly response builds trust with the next buyer."
      breadcrumb={[{ label: 'Dashboard', href: createPageUrl('Dashboard') }, { label: 'Reviews' }]}
      action={
        <Link to={createPageUrl('SellerListings') + `?email=${encodeURIComponent(user.email)}`} className="btn-ghost px-5 py-2.5 text-sm gap-1.5 border border-border bg-white">
          <Store className="w-4 h-4" /> View public profile
        </Link>
      }
    >
      <div className="max-w-4xl">
        <ReviewList sellerEmail={user.email} isOwner={true} />
      </div>
    </PageShell>
  );
}
