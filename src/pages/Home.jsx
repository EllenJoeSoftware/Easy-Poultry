import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Sparkles, TrendingUp, Shield, MessageCircle,
  Star, Search, Award, MapPin, Quote, CheckCircle2,
} from 'lucide-react';
import { api } from '@/api/client';
import ListingCard from '../components/marketplace/ListingCard';
import WinnerBanner from '../components/competitions/WinnerBanner';
import { createPageUrl } from '../utils';

// Inline emoji illustrations for poultry categories — no external images.
const CategoryArt = ({ name }) => {
  const c = {
    chickens: '🐔', ducks: '🦆', turkeys: '🦃', quail: '🐦',
    eggs_table: '🥚', chicks: '🐥', feed: '🌾', equipment: '🧰',
  };
  return <span className="text-4xl" aria-hidden>{c[name] || '🐓'}</span>;
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const user = await api.auth.me();
        if (!user.user_type || !user.contact_number || !user.province || !user.city) {
          navigate(createPageUrl('Onboarding'));
        }
      } catch (_) { /* not logged in */ }
    };
    checkOnboarding();
  }, [navigate]);

  const { data: featuredListings = [] } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: () => api.entities.Listing.filter({ status: 'active' }, '-created_date', 8),
  });

  const handleSearch = () => {
    navigate(createPageUrl('Marketplace') + `?search=${encodeURIComponent(searchQuery)}`);
  };

  const categories = [
    { name: 'Chickens',  value: 'chickens',   tint: 'bg-moss-50',       border: 'border-moss-100' },
    { name: 'Ducks',     value: 'ducks',      tint: 'bg-cream-deep',    border: 'border-yolk-100' },
    { name: 'Turkeys',   value: 'turkeys',    tint: 'bg-terracotta-50', border: 'border-terracotta-100' },
    { name: 'Quail',     value: 'quail',      tint: 'bg-moss-50',       border: 'border-moss-100' },
    { name: 'Eggs',      value: 'eggs_table', tint: 'bg-yolk-50',       border: 'border-yolk-100' },
    { name: 'Chicks',    value: 'chicks',     tint: 'bg-cream-deep',    border: 'border-yolk-100' },
    { name: 'Feed',      value: 'feed',       tint: 'bg-moss-50',       border: 'border-moss-100' },
    { name: 'Equipment', value: 'equipment',  tint: 'bg-terracotta-50', border: 'border-terracotta-100' },
  ];

  return (
    <div className="bg-cream text-ink">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        <div className="hero-warm grain absolute inset-0 -z-10" />
        <div className="absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-moss-200/30 blur-3xl -z-10 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-terracotta-100/40 blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 reveal">
              <div className="chip mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                South Africa's poultry community
              </div>
              <h1 className="h-display text-5xl sm:text-6xl lg:text-7xl text-ink mb-6">
                Where serious <span className="italic text-moss-700">poultry</span><br />
                people <span className="italic text-terracotta-500">trade</span>.
              </h1>
              <p className="text-lg text-ink/70 leading-relaxed max-w-2xl mb-8">
                Buy and sell live birds, eggs, feed and equipment. Run live auctions, enter competitions, and manage your farm — all in one place trusted by thousands of South African breeders.
              </p>

              <div className="bg-white rounded-2xl shadow-soft p-2 max-w-2xl border border-border">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex items-center flex-1 px-4">
                    <Search className="w-5 h-5 text-ink/40 mr-3" />
                    <input
                      type="text"
                      placeholder="Try 'Boschveld hens' or 'broiler feed'…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="flex-1 py-3 bg-transparent focus:outline-none text-base placeholder:text-ink/40"
                    />
                  </div>
                  <button onClick={handleSearch} className="btn-cta px-6 py-3 text-sm gap-1.5">
                    Browse marketplace
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-6 text-sm text-ink/60">
                <div className="flex -space-x-2">
                  {['bg-terracotta-300','bg-moss-400','bg-yolk-300','bg-sage','bg-moss-500'].map((c, i) => (
                    <div key={i} className={`w-8 h-8 rounded-full ${c} ring-2 ring-cream`} />
                  ))}
                </div>
                <p><span className="font-semibold text-ink">4,200+</span> sellers active this month</p>
              </div>
            </div>

            <div className="lg:col-span-5 reveal" style={{ animationDelay: '0.15s' }}>
              <div className="relative">
                <div className="card-premium p-7 rounded-3xl">
                  <div className="flex items-center justify-between mb-5">
                    <div className="chip chip-yolk">
                      <Award className="w-3.5 h-3.5" />
                      Today's pick
                    </div>
                    <span className="text-xs text-ink/40">Live now</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-terracotta-50 flex items-center justify-center text-5xl">🐓</div>
                    <div className="flex-1">
                      <h3 className="font-display text-2xl text-ink leading-tight">Boschveld hens, point-of-lay</h3>
                      <p className="text-sm text-ink/60 mt-1">Free range · Eastern Cape</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="font-display font-bold text-2xl text-moss-700">R 285</span>
                        <span className="text-sm text-ink/40 line-through">R 320</span>
                        <span className="chip chip-accent text-[10px] !py-0.5">-11%</span>
                      </div>
                    </div>
                  </div>
                  <div className="rule my-6" />
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div><p className="text-xs text-ink/50">In stock</p><p className="font-display text-xl text-ink mt-1">42</p></div>
                    <div><p className="text-xs text-ink/50">Reviews</p><p className="font-display text-xl text-ink mt-1">4.9</p></div>
                    <div><p className="text-xs text-ink/50">Sold</p><p className="font-display text-xl text-ink mt-1">128</p></div>
                  </div>
                </div>

                <div className="absolute -top-5 -left-5 card-premium px-4 py-3 rounded-2xl flex items-center gap-2.5 animate-float">
                  <CheckCircle2 className="w-5 h-5 text-moss-600" />
                  <div>
                    <p className="text-xs text-ink/60 leading-none">Verified</p>
                    <p className="text-sm font-medium leading-none mt-1">Premium seller</p>
                  </div>
                </div>
                <div className="absolute -bottom-5 -right-5 card-premium px-4 py-3 rounded-2xl flex items-center gap-2.5 animate-float" style={{ animationDelay: '1.5s' }}>
                  <Star className="w-5 h-5 text-yolk-400 fill-yolk-300" />
                  <div>
                    <p className="text-xs text-ink/60 leading-none">Auctions</p>
                    <p className="text-sm font-medium leading-none mt-1">12 live now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST MARQUEE ============ */}
      <section className="bg-ink-soft text-cream/80 py-5 overflow-hidden">
        <div className="marquee">
          <div className="marquee-track">
            {[
              "🥇 Aliwal North Poultry Show 2026 — entries open",
              "Free shipping on equipment over R 2 500",
              "🐣 Day-old chicks delivered nationwide",
              "New: live auction Tuesdays @ 19:00 SAST",
              "R 12M+ in transactions facilitated",
              "4 200+ verified breeders & farms",
              "🥇 Aliwal North Poultry Show 2026 — entries open",
              "Free shipping on equipment over R 2 500",
              "🐣 Day-old chicks delivered nationwide",
              "New: live auction Tuesdays @ 19:00 SAST",
              "R 12M+ in transactions facilitated",
              "4 200+ verified breeders & farms",
            ].map((t, i) => (
              <span key={i} className="text-sm font-medium whitespace-nowrap">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="eyebrow mb-3">Browse the marketplace</p>
            <h2 className="h-display text-4xl sm:text-5xl text-ink">Pick your category.</h2>
          </div>
          <Link to={createPageUrl('Marketplace')} className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-moss-700 link-underline">
            View all categories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 lg:gap-5">
          {categories.map((cat, i) => (
            <Link
              key={cat.value}
              to={createPageUrl('Marketplace') + `?category=${cat.value}`}
              className={`group relative overflow-hidden rounded-3xl ${cat.tint} ${cat.border} border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-ink" />
              </div>
              <div className="aspect-square flex flex-col justify-between">
                <CategoryArt name={cat.value} />
                <div>
                  <h3 className="font-display text-2xl text-ink leading-tight">{cat.name}</h3>
                  <p className="text-xs text-ink/50 mt-1">Browse listings</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <WinnerBanner />

      {/* ============ FEATURED LISTINGS ============ */}
      <section className="bg-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="eyebrow mb-3">Just listed</p>
              <h2 className="h-display text-4xl sm:text-5xl text-ink">Featured listings.</h2>
              <p className="text-ink/60 mt-3 max-w-md">Fresh additions from trusted sellers across South Africa.</p>
            </div>
            <Link to={createPageUrl('Marketplace')} className="hidden sm:inline-block">
              <button className="btn-cta px-5 py-2.5 text-sm">View all <ArrowRight className="w-4 h-4 ml-1" /></button>
            </Link>
          </div>

          {featuredListings.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="card-premium aspect-[3/4] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
            </div>
          )}
        </div>
      </section>

      {/* ============ WHY EASY POULTRY ============ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="eyebrow mb-3">Why Easy Poultry</p>
          <h2 className="h-display text-4xl sm:text-5xl text-ink">Built for serious breeders.</h2>
          <p className="text-ink/60 mt-4">Three things we do differently from a generic classifieds site.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: MapPin, title: 'Local & verified',
              copy: 'Every seller is location-tagged and KYC-verified. Filter by province, city, or distance — buy from people you can actually visit.',
              stat: '94%', statLabel: 'verified within 30km',
              tint: 'bg-moss-50', ring: 'border-moss-100', iconColor: 'text-moss-700',
            },
            {
              icon: Shield, title: 'Safe transactions',
              copy: 'Yoco-secured payments, escrow on auctions over R 5 000, and dispute mediation. Your money is protected end-to-end.',
              stat: 'R 12M+', statLabel: 'safely transacted',
              tint: 'bg-terracotta-50', ring: 'border-terracotta-100', iconColor: 'text-terracotta-600',
            },
            {
              icon: TrendingUp, title: 'Tools that pay for themselves',
              copy: 'Track your batches, feed costs, vaccinations and incubation right inside your account. Most farms see a 12% margin lift in their first season.',
              stat: '+12%', statLabel: 'avg margin lift',
              tint: 'bg-yolk-50', ring: 'border-yolk-100', iconColor: 'text-yolk-600',
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`card-premium p-7 lg:p-8 ${f.tint} ${f.ring}`}
            >
              <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-sm ${f.iconColor}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display text-2xl text-ink mb-3">{f.title}</h3>
              <p className="text-ink/70 leading-relaxed mb-6">{f.copy}</p>
              <div className="flex items-baseline gap-2 pt-4 border-t border-ink/5">
                <span className="font-display text-3xl font-bold text-ink">{f.stat}</span>
                <span className="text-sm text-ink/50">{f.statLabel}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ============ TESTIMONIAL ============ */}
      <section className="bg-moss-gradient text-cream py-20 lg:py-28 overflow-hidden relative">
        <div className="absolute inset-0 grain pointer-events-none opacity-50" />
        <div className="absolute -top-40 right-0 w-[40rem] h-[40rem] rounded-full bg-terracotta-400/20 blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <Quote className="w-12 h-12 text-yolk-300 mx-auto mb-8" />
          <blockquote className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight mb-10 text-cream">
            "I sold my first batch of Boschveld pullets 36 hours after listing. Six months in, Easy Poultry is now <span className="italic text-yolk-300">half my income</span>."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-full bg-terracotta-300 flex items-center justify-center text-cream text-lg font-semibold">N</div>
            <div className="text-left">
              <p className="font-medium text-cream">Naledi Ngwenya</p>
              <p className="text-sm text-cream/60">Indigenous breeder · Bloemfontein</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="card-premium p-10 lg:p-14 rounded-3xl bg-cream-gradient relative overflow-hidden">
          <div className="absolute inset-0 grain pointer-events-none opacity-30" />
          <div className="relative grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="eyebrow mb-4">Ready to sell?</p>
              <h2 className="h-display text-4xl sm:text-5xl text-ink mb-5">List your first batch in <span className="italic text-moss-700">three minutes</span>.</h2>
              <p className="text-ink/70 text-lg leading-relaxed">
                Free to list. Free to message buyers. We only take a small fee on auctions and featured placements — and you keep 100% of direct sales.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Link to={createPageUrl('CreateListing')}>
                <button className="btn-cta px-7 py-4 text-base w-full sm:w-auto">
                  Create your first listing
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
              <a href={api.agents.getWhatsAppConnectURL('cliffie')} target="_blank" rel="noopener noreferrer">
                <button className="px-7 py-4 text-base rounded-full bg-white border border-border hover:border-moss-300 transition-all w-full sm:w-auto inline-flex items-center justify-center gap-2 font-medium text-ink">
                  <MessageCircle className="w-5 h-5 text-moss-600" />
                  Chat with Cliffie
                </button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
