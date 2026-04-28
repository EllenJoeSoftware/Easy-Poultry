import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from './utils';
import {
  Menu, X, LayoutGrid, Plus, Settings, Shield, Package, Star,
  MessageCircle, Gavel, Users, Bird, Trophy, LogOut, ChevronDown,
  Search as SearchIcon, Bell, ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import CliffieChat from './components/chat/CliffieChat';
import NotificationBell from './components/notifications/NotificationBell';
import { LogoMark } from './components/icons/EasyPoultryLogo';

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const isSeller = user?.user_type === 'seller' || user?.user_type === 'both';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  // Hide layout chrome for full-bleed pages
  if (currentPageName === 'Search' || currentPageName === 'Login') {
    return <div>{children}</div>;
  }

  const navigation = [
    { name: 'Marketplace', path: createPageUrl('Marketplace'), icon: LayoutGrid },
    { name: 'Auctions',    path: createPageUrl('Auctions'),    icon: Gavel },
    { name: 'Competitions',path: createPageUrl('Competitions'),icon: Trophy },
  ];

  const userNavigation = user ? [
    { name: 'Dashboard',   path: createPageUrl('Dashboard'),    icon: LayoutGrid },
    { name: 'Messages',    path: createPageUrl('Messages'),     icon: MessageCircle },
    ...(isSeller ? [{ name: 'CRM',          path: createPageUrl('CRM'),           icon: Users }] : []),
    ...(isSeller ? [{ name: 'My Listings',  path: createPageUrl('MyListings'),    icon: Package }] : []),
    ...(isSeller ? [{ name: 'Farm',         path: createPageUrl('FarmDashboard'), icon: Bird }] : []),
    ...(isSeller ? [{ name: 'Finances',     path: createPageUrl('SellerFinances'),icon: ArrowUpRight }] : []),
    ...(isSeller ? [{ name: 'Reviews',      path: createPageUrl('SellerReviews'), icon: Star }] : []),
    ...(user.role === 'admin' ? [{ name: 'Admin', path: createPageUrl('Admin'), icon: Shield }] : []),
    { name: 'Profile',     path: createPageUrl('ProfileSettings'), icon: Settings },
  ] : [];

  return (
    <div className="min-h-screen bg-cream text-ink">
      {/* ========== NAV ========== */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'glass-nav shadow-soft' : 'bg-cream/0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo lockup */}
            <div className="flex items-center gap-10">
              <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
                <div className="transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                  <LogoMark className="w-11 h-11 drop-shadow-sm" />
                </div>
                <div className="hidden sm:flex flex-col leading-none">
                  <span className="font-display text-xl font-bold text-ink tracking-tight">Easy Poultry</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-moss-600 font-semibold mt-1">marketplace · farm · auctions</span>
                </div>
              </Link>

              {/* Primary nav */}
              <div className="hidden lg:flex items-center gap-1">
                {navigation.map((item) => {
                  const active = currentPageName === item.name;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        active
                          ? 'text-moss-700'
                          : 'text-ink/70 hover:text-moss-700'
                      }`}
                    >
                      <span className="relative z-10">{item.name}</span>
                      {active && (
                        <span className="absolute inset-0 rounded-full bg-moss-100/80 -z-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right cluster */}
            <div className="hidden lg:flex items-center gap-2">
              {/* Search shortcut */}
              <Link
                to={createPageUrl('Search')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm text-ink/60 hover:text-ink bg-white/70 border border-border hover:border-moss-200 transition-all"
              >
                <SearchIcon className="w-4 h-4" />
                <span className="hidden xl:inline">Search the marketplace</span>
                <kbd className="hidden xl:inline-flex ml-2 px-1.5 py-0.5 text-[10px] font-mono bg-moss-50 text-moss-700 rounded border border-moss-100">⌘K</kbd>
              </Link>

              {user ? (
                <>
                  {isSeller && (
                    <Link to={createPageUrl('CreateListing')}>
                      <button className="btn-accent px-4 py-2 text-sm gap-1.5">
                        <Plus className="w-4 h-4" />
                        Sell
                      </button>
                    </Link>
                  )}

                  <NotificationBell userEmail={user.email} />

                  {/* User menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen((v) => !v)}
                      className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-white border border-border hover:border-moss-200 transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-moss-gradient flex items-center justify-center text-cream text-xs font-semibold">
                        {(user.full_name || user.email || 'U').slice(0, 1).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-ink/80 hidden xl:inline">
                        {(user.full_name || user.email || 'You').split(' ')[0]}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-ink/40" />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-border shadow-lift overflow-hidden">
                        <div className="p-4 border-b border-border bg-moss-50/50">
                          <p className="font-medium text-ink truncate">{user.full_name || 'Welcome'}</p>
                          <p className="text-xs text-ink/60 truncate">{user.email}</p>
                        </div>
                        <div className="py-2">
                          {userNavigation.map((it) => (
                            <Link
                              key={it.name}
                              to={it.path}
                              className="flex items-center gap-3 px-4 py-2 text-sm text-ink/80 hover:bg-moss-50 hover:text-moss-700 transition-colors"
                            >
                              {it.icon && <it.icon className="w-4 h-4" />}
                              {it.name}
                            </Link>
                          ))}
                        </div>
                        <button
                          onClick={() => logout()}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-terracotta-600 hover:bg-terracotta-50 transition-colors border-t border-border"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/Login" className="btn-ghost px-4 py-2 text-sm">Sign in</Link>
                  <Link to="/Login" className="btn-cta px-5 py-2 text-sm">
                    Get started
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-full bg-white/80 border border-border hover:border-moss-200"
              aria-label="Open menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden glass-nav border-t border-border">
            <div className="px-4 py-4 space-y-1">
              {navigation.map((item) => {
                const active = currentPageName === item.name;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                      active ? 'bg-moss-100 text-moss-700' : 'text-ink/80 hover:bg-moss-50'
                    }`}
                  >
                    {item.icon && <item.icon className="w-5 h-5" />}
                    {item.name}
                  </Link>
                );
              })}

              <div className="rule my-3" />

              {user ? (
                <>
                  {isSeller && (
                    <Link to={createPageUrl('CreateListing')} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-terracotta-700 bg-terracotta-50">
                      <Plus className="w-5 h-5" />
                      Create listing
                    </Link>
                  )}
                  {userNavigation.map((it) => (
                    <Link
                      key={it.name}
                      to={it.path}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-ink/80 hover:bg-moss-50"
                    >
                      {it.icon && <it.icon className="w-5 h-5" />}
                      {it.name}
                    </Link>
                  ))}
                  <button
                    onClick={() => logout()}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-terracotta-700 hover:bg-terracotta-50"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 pt-2">
                  <Link to="/Login" className="btn-ghost w-full py-3 text-base border border-border">Sign in</Link>
                  <Link to="/Login" className="btn-cta w-full py-3 text-base">Get started</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ========== PAGE BODY ========== */}
      <main className="bg-cream">{children}</main>

      <CliffieChat />

      {/* ========== FOOTER ========== */}
      <footer className="relative bg-ink-soft text-cream/90 mt-32 overflow-hidden">
        {/* decorative top wave */}
        <svg className="absolute -top-px left-0 right-0 w-full h-12 text-cream" viewBox="0 0 1440 48" preserveAspectRatio="none" fill="currentColor">
          <path d="M0 0L60 8C120 16 240 32 360 32C480 32 600 16 720 13.3C840 11 960 21 1080 26.7C1200 32 1320 32 1380 32H1440V0H0Z" />
        </svg>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          <div className="grid lg:grid-cols-12 gap-10 mb-14">
            {/* Brand block */}
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-5">
                <LogoMark className="w-10 h-10" showAccent={false} />
                <span className="font-display text-2xl font-bold text-cream">Easy Poultry</span>
              </div>
              <p className="font-display text-2xl leading-snug text-cream/85 max-w-md">
                The complete poultry platform. Connecting farmers, breeders & buyers across South Africa.
              </p>

              {/* Newsletter */}
              <form onSubmit={(e) => e.preventDefault()} className="mt-8 max-w-md">
                <label className="text-xs uppercase tracking-[0.18em] text-cream/60 font-semibold">Weekly market digest</label>
                <div className="mt-3 flex bg-white/5 border border-white/10 rounded-full p-1 backdrop-blur-sm">
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent px-4 py-2 text-sm text-cream placeholder:text-cream/40 focus:outline-none"
                  />
                  <button type="submit" className="px-5 py-2 rounded-full bg-cream text-ink-soft text-sm font-medium hover:bg-yolk-100 transition-colors">
                    Subscribe
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xs uppercase tracking-[0.18em] text-cream/60 font-semibold mb-4">Marketplace</h3>
                <ul className="space-y-3 text-sm text-cream/80">
                  <li><Link to={createPageUrl('Marketplace')} className="link-underline">Browse listings</Link></li>
                  <li><Link to={createPageUrl('Marketplace') + '?category=chickens'} className="link-underline">Chickens</Link></li>
                  <li><Link to={createPageUrl('Marketplace') + '?category=eggs_table'} className="link-underline">Eggs</Link></li>
                  <li><Link to={createPageUrl('Marketplace') + '?category=feed'} className="link-underline">Feed & equipment</Link></li>
                  <li><Link to={createPageUrl('Auctions')} className="link-underline">Auctions</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.18em] text-cream/60 font-semibold mb-4">For sellers</h3>
                <ul className="space-y-3 text-sm text-cream/80">
                  <li><Link to={createPageUrl('CreateListing')} className="link-underline">Sell on Easy Poultry</Link></li>
                  <li><Link to={createPageUrl('FarmDashboard')} className="link-underline">Farm management</Link></li>
                  <li><Link to={createPageUrl('IncubationManagement')} className="link-underline">Incubation</Link></li>
                  <li><Link to={createPageUrl('SellerFinances')} className="link-underline">Finances</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-xs uppercase tracking-[0.18em] text-cream/60 font-semibold mb-4">Support</h3>
                <ul className="space-y-3 text-sm text-cream/80">
                  <li><a href="#" className="link-underline">Help centre</a></li>
                  <li><a href="#" className="link-underline">Safety & trust</a></li>
                  <li><Link to={createPageUrl('TermsOfService')} className="link-underline">Terms</Link></li>
                  <li><Link to={createPageUrl('PrivacyPolicy')} className="link-underline">Privacy</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="rule opacity-30" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-cream/50">
            <p>© {new Date().getFullYear()} Easy Poultry. Crafted with care in South Africa.</p>
            <div className="flex items-center gap-5">
              <a href="#" className="link-underline">Twitter</a>
              <a href="#" className="link-underline">Instagram</a>
              <a href="#" className="link-underline">Facebook</a>
              <a href="#" className="link-underline">WhatsApp</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
