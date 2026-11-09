import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutGrid, Package, MessageCircle, Bell, Users, Star, ArrowUpRight, Wallet,
  Bird, Egg, Wheat, Syringe, DollarSign, Shield, Settings, Gavel, Store,
  ChevronLeft, ChevronRight, Menu, X, LogOut, ExternalLink, Plus, Layers,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { LogoMark } from '@/components/icons/EasyPoultryLogo';
import NotificationBell from '@/components/notifications/NotificationBell';
import { createPageUrl } from '@/utils';

/**
 * AppShell — SaaS layout for every logged-in module.
 * Collapsible sidebar on desktop, slide-in drawer on mobile, sticky top bar
 * with breadcrumb/page title, notifications and the user menu.
 *
 * Public pages keep using the horizontal-nav Layout; this shell is mounted by
 * Layout.jsx only for pages listed in APP_PAGES.
 */

export const APP_PAGES = new Set([
  'Dashboard', 'MyOrders', 'Messages', 'Notifications',
  'MyListings', 'SellerListings', 'CreateListing', 'EditListing', 'CRM', 'SellerReviews', 'SellerFinances', 'Payouts',
  'FarmDashboard', 'BatchManagement', 'BatchDetail', 'IncubationManagement', 'IncubationDetail',
  'FeedManagement', 'VaccinationManagement', 'FarmFinancials', 'FarmTeam',
  'MyAuctions', 'MyAuctionHouse', 'CreateAuction', 'CreateAuctionEvent', 'CreateAuctionHouse', 'ManageAuctionEvent', 'SubmitEntry',
  'Admin', 'AdminDashboard', 'AdminPayouts',
  'ProfileSettings', 'Onboarding',
]);

const PAGE_TITLES = {
  Dashboard: 'Overview', MyOrders: 'My orders', Messages: 'Messages', Notifications: 'Notifications',
  MyListings: 'My listings', SellerListings: 'My listings', CreateListing: 'New listing', EditListing: 'Edit listing',
  CRM: 'Customers', SellerReviews: 'Reviews', SellerFinances: 'Finances', Payouts: 'Payouts',
  FarmDashboard: 'Farm overview', BatchManagement: 'Batches', BatchDetail: 'Batch', IncubationManagement: 'Incubation',
  IncubationDetail: 'Incubation', FeedManagement: 'Feed', VaccinationManagement: 'Vaccinations', FarmFinancials: 'Farm financials',
  FarmTeam: 'Team', MyAuctions: 'My auctions', MyAuctionHouse: 'Auction house', CreateAuction: 'New auction',
  CreateAuctionEvent: 'New auction event', CreateAuctionHouse: 'New auction house', ManageAuctionEvent: 'Manage event',
  SubmitEntry: 'Competition entry', Admin: 'Administration', AdminDashboard: 'Administration', AdminPayouts: 'Payout requests',
  ProfileSettings: 'Account settings', Onboarding: 'Welcome',
};

export default function AppShell({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ep.sidebar') === '1');
  const [drawer, setDrawer] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => { setDrawer(false); setUserMenu(false); }, [location.pathname]);
  useEffect(() => { localStorage.setItem('ep.sidebar', collapsed ? '1' : '0'); }, [collapsed]);

  const isSeller = user?.user_type === 'seller' || user?.user_type === 'both';
  const isAdmin = user?.role === 'admin';

  const groups = [
    { label: 'Overview', items: [
      { name: 'Dashboard', page: 'Dashboard', icon: LayoutGrid },
      { name: 'My orders', page: 'MyOrders', icon: Package },
      { name: 'Messages', page: 'Messages', icon: MessageCircle },
      { name: 'Notifications', page: 'Notifications', icon: Bell },
    ]},
    ...(isSeller ? [{ label: 'Sell', items: [
      { name: 'My listings', page: 'MyListings', icon: Layers },
      { name: 'New listing', page: 'CreateListing', icon: Plus },
      { name: 'Customers', page: 'CRM', icon: Users },
      { name: 'Reviews', page: 'SellerReviews', icon: Star },
      { name: 'Finances', page: 'SellerFinances', icon: ArrowUpRight },
      { name: 'Payouts', page: 'Payouts', icon: Wallet },
    ]}] : []),
    ...(isSeller ? [{ label: 'Farm', items: [
      { name: 'Farm overview', page: 'FarmDashboard', icon: Bird },
      { name: 'Batches', page: 'BatchManagement', icon: Layers },
      { name: 'Incubation', page: 'IncubationManagement', icon: Egg },
      { name: 'Feed', page: 'FeedManagement', icon: Wheat },
      { name: 'Vaccinations', page: 'VaccinationManagement', icon: Syringe },
      { name: 'Financials', page: 'FarmFinancials', icon: DollarSign },
      { name: 'Team', page: 'FarmTeam', icon: Users },
    ]}] : []),
    ...(isSeller ? [{ label: 'Auctions', items: [
      { name: 'My auctions', page: 'MyAuctions', icon: Gavel },
      { name: 'Auction house', page: 'MyAuctionHouse', icon: Store },
    ]}] : []),
    ...(isAdmin ? [{ label: 'Admin', items: [
      { name: 'Administration', page: 'Admin', icon: Shield },
      { name: 'Payout requests', page: 'AdminPayouts', icon: Wallet },
    ]}] : []),
    { label: 'Account', items: [
      { name: 'Settings', page: 'ProfileSettings', icon: Settings },
    ]},
  ];

  const isActive = (page) => currentPageName === page ||
    (page === 'MyListings' && currentPageName === 'SellerListings') ||
    (page === 'BatchManagement' && currentPageName === 'BatchDetail') ||
    (page === 'IncubationManagement' && currentPageName === 'IncubationDetail') ||
    (page === 'Admin' && currentPageName === 'AdminDashboard');

  const title = PAGE_TITLES[currentPageName] || currentPageName;
  const section = groups.find(g => g.items.some(i => isActive(i.page)))?.label;

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={`flex flex-col h-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border
        ${mobile ? 'w-72' : collapsed ? 'w-[72px]' : 'w-64'} transition-[width] duration-200`}
    >
      {/* Brand */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-sidebar-border ${collapsed && !mobile ? 'justify-center' : ''}`}>
        <Link to={createPageUrl('Home')} className="flex items-center gap-3 min-w-0">
          <LogoMark className="w-9 h-9 flex-shrink-0" showAccent={false} />
          {(!collapsed || mobile) && (
            <span className="font-display font-bold text-base tracking-tight truncate">Easy Poultry</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {groups.map((g) => (
          <div key={g.label}>
            {(!collapsed || mobile) && (
              <p className="px-3 mb-1.5 text-[10px] uppercase tracking-[0.18em] font-semibold text-sidebar-foreground/45">{g.label}</p>
            )}
            <ul className="space-y-0.5">
              {g.items.map((it) => {
                const active = isActive(it.page);
                return (
                  <li key={it.page}>
                    <Link
                      to={createPageUrl(it.page)}
                      title={collapsed && !mobile ? it.name : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors
                        ${collapsed && !mobile ? 'justify-center' : ''}
                        ${active
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium shadow-sm'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'}`}
                    >
                      <it.icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={1.75} />
                      {(!collapsed || mobile) && <span className="truncate">{it.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: back to marketplace + collapse */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <Link
          to={createPageUrl('Marketplace')}
          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors ${collapsed && !mobile ? 'justify-center' : ''}`}
          title="Back to marketplace"
        >
          <ExternalLink className="w-[18px] h-[18px]" strokeWidth={1.75} />
          {(!collapsed || mobile) && <span>Marketplace</span>}
        </Link>
        {!mobile && (
          <button
            onClick={() => setCollapsed(v => !v)}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent transition-colors ${collapsed ? 'justify-center' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <ChevronLeft className="w-[18px] h-[18px]" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-cream text-ink flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="relative h-full shadow-lift">
            <Sidebar mobile />
            <button onClick={() => setDrawer(false)} className="absolute top-4 -right-12 w-10 h-10 rounded-full bg-white text-ink flex items-center justify-center shadow-lift" aria-label="Close menu">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-40 h-16 glass-nav flex items-center gap-3 px-4 sm:px-6">
          <button onClick={() => setDrawer(true)} className="lg:hidden w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            <nav className="text-[11px] text-ink/50 flex items-center gap-1.5">
              <Link to={createPageUrl('Dashboard')} className="hover:text-moss-700">App</Link>
              {section && <><ChevronRight className="w-3 h-3" /><span>{section}</span></>}
              <ChevronRight className="w-3 h-3" /><span className="text-ink/80 font-medium truncate">{title}</span>
            </nav>
          </div>

          {isSeller && (
            <Link to={createPageUrl('CreateListing')} className="hidden sm:inline-flex btn-accent px-4 py-2 text-sm gap-1.5">
              <Plus className="w-4 h-4" /> Sell
            </Link>
          )}
          {user?.email && <NotificationBell userEmail={user.email} />}

          <div className="relative">
            <button onClick={() => setUserMenu(v => !v)} className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-white border border-border hover:border-moss-200">
              <div className="w-8 h-8 rounded-full bg-moss-gradient text-cream text-xs font-semibold flex items-center justify-center">
                {(user?.full_name || user?.email || 'U').slice(0, 1).toUpperCase()}
              </div>
              <span className="hidden md:inline text-sm font-medium text-ink/80 max-w-[10rem] truncate">{(user?.full_name || user?.email || '').split(' ')[0]}</span>
            </button>
            {userMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-border shadow-lift overflow-hidden">
                <div className="p-3 border-b border-border bg-moss-50/50">
                  <p className="text-sm font-medium text-ink truncate">{user?.full_name || 'Account'}</p>
                  <p className="text-xs text-ink/60 truncate">{user?.email}</p>
                </div>
                <Link to={createPageUrl('ProfileSettings')} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-moss-50"><Settings className="w-4 h-4" />Settings</Link>
                <Link to={createPageUrl('Marketplace')} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-moss-50"><Store className="w-4 h-4" />Marketplace</Link>
                <button onClick={() => logout()} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-terracotta-600 hover:bg-terracotta-50 border-t border-border"><LogOut className="w-4 h-4" />Sign out</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
