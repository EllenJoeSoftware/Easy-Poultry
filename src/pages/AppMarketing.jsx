import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bell, Camera, Download, Gauge, MessageCircle, Package, Sparkles, Star, Wifi } from 'lucide-react';
import { LogoMark } from '@/components/icons/EasyPoultryLogo';
import { createPageUrl } from '../utils';

const FEATURES = [
  { icon: Package,      title: 'Manage listings from your pocket',   copy: 'Post birds, eggs, feed and digital guides in seconds. Snap photos with your phone — no laptop needed.' },
  { icon: MessageCircle,title: 'Chat with buyers instantly',          copy: 'Real-time push notifications when a buyer messages, bids, or checks out. Reply in one tap.' },
  { icon: Gauge,        title: 'Your farm at a glance',               copy: 'Track batches, feed stocks, incubations and finances on beautifully designed dashboards built for phones.' },
  { icon: Camera,       title: 'Native camera upload',                copy: 'Upload multiple photos or PDFs straight from your device gallery. Auto-optimised for fast loading.' },
  { icon: Wifi,         title: 'Works offline',                       copy: 'Log feed, egg counts or vaccinations even without signal — everything syncs the moment you\'re back online.' },
  { icon: Bell,         title: 'Auction & payment alerts',            copy: 'Never miss a Tuesday auction, a payout landing in your bank, or a hatching countdown ending.' },
];

const REVIEWS = [
  { name: 'Naledi Ngwenya',       role: 'Boschveld breeder · Bloemfontein', stars: 5,
    text: 'Sold my first batch of pullets in 36 hours. The app makes it feel like everyone is at the farm gate.' },
  { name: 'Sizwe Mahlangu',       role: 'Layer farmer · Mpumalanga',        stars: 5,
    text: 'The feed & egg tracking alone is worth it. I finally know exactly what each batch costs me.' },
  { name: 'Amanda Van der Merwe', role: 'Hatchery owner · Western Cape',    stars: 5,
    text: 'Auction Tuesdays have become my best sales day of the week. Buyers from all 9 provinces bidding live.' },
];

const AppleIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
  </svg>
);
const PlayIcon = (p) => (
  <svg viewBox="0 0 512 512" fill="currentColor" {...p}>
    <path d="M99.6 24.1c-9.7 4.5-16.4 14.3-16.4 24.7v414.4c0 10.4 6.7 20.2 16.4 24.7l231.4-232-231.4-231.8zm266.7 267l-46.5-27L275 309.6l-124.2 71 215.5-125.5zm52.2-101.5L376.6 217l-45.7 26.5 45.7 26.5 42-24.4c17.7-10.3 17.7-35.9 0-46.2l-.1-.3zm-267.5-99.4l124.2 71 44.9-45.6-169.1-97.2v71.8z" />
  </svg>
);

const StoreButton = ({ icon: Icon, top, big, href }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-ink text-cream hover:bg-ink-soft transition-colors shadow-lift">
    <Icon className="w-7 h-7" />
    <div className="text-left"><p className="text-[10px] opacity-70">{top}</p><p className="text-lg font-semibold leading-none">{big}</p></div>
  </a>
);

export default function AppMarketing() {
  return (
    <div className="bg-cream text-ink">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="hero-warm grain absolute inset-0 -z-10" />
        <div className="absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full bg-moss-200/30 blur-3xl -z-10 animate-float" />
        <div className="absolute -bottom-40 -left-40 w-[36rem] h-[36rem] rounded-full bg-terracotta-100/40 blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <div className="chip mb-6"><Sparkles className="w-3.5 h-3.5" />Now on iOS & Android</div>
              <h1 className="h-display text-5xl sm:text-6xl lg:text-7xl text-ink mb-6">
                Your farm.<br />
                <span className="italic text-moss-700">Your marketplace</span>.<br />
                Your <span className="italic text-terracotta-500">phone</span>.
              </h1>
              <p className="text-lg text-ink/70 leading-relaxed max-w-2xl mb-8">
                The full Easy Poultry marketplace, auctions and farm-management toolkit — now in a native app built for South African breeders and buyers on the go.
              </p>
              <div className="flex flex-wrap gap-3 mb-8">
                <StoreButton icon={AppleIcon} top="Download on the" big="App Store" href="#download" />
                <StoreButton icon={PlayIcon}  top="Get it on"      big="Google Play" href="#download" />
              </div>
              <div className="flex items-center gap-6 text-sm text-ink/60">
                <div className="flex items-center gap-1"><Star className="w-4 h-4 text-yolk-400 fill-yolk-300" /><span className="font-semibold text-ink">4.8</span> · 240+ reviews</div>
                <div className="flex items-center gap-1"><Download className="w-4 h-4" /><span className="font-semibold text-ink">3,500+</span> installs</div>
              </div>
            </div>

            {/* Phone mockup */}
            <div className="lg:col-span-5 flex justify-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                className="relative w-64 h-[520px] rounded-[3rem] bg-ink shadow-lift p-3 border-[10px] border-ink"
              >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-ink rounded-full z-10" />
                <div className="w-full h-full rounded-[2.25rem] bg-cream overflow-hidden relative">
                  <div className="absolute inset-0 hero-warm p-5">
                    <div className="flex items-center justify-between mb-6">
                      <LogoMark className="w-10 h-10" />
                      <Bell className="w-5 h-5 text-ink/50" />
                    </div>
                    <p className="eyebrow mb-2">Today's picks</p>
                    <h3 className="font-display text-2xl text-ink leading-tight mb-6">Boschveld hens, ready to lay</h3>
                    {[
                      { emoji: '🐓', tint: 'bg-terracotta-50', label: '42 available', price: 'R 285' },
                      { emoji: '🥚', tint: 'bg-yolk-50',       label: 'Fertile eggs',  price: 'R 18/ea' },
                      { emoji: '🌾', tint: 'bg-cream-deep',    label: 'Layer feed 50kg', price: 'R 449' },
                    ].map((c, i) => (
                      <div key={i} className="card-premium p-4 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl ${c.tint} flex items-center justify-center text-3xl`}>{c.emoji}</div>
                          <div className="flex-1"><p className="text-xs text-ink/55">{c.label}</p><p className="font-display font-bold text-lg text-ink">{c.price}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="eyebrow mb-3">Built for the field</p>
          <h2 className="h-display text-4xl sm:text-5xl text-ink">Everything the web has. Plus more.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}
              className="card-premium p-6"
            >
              <div className="w-11 h-11 rounded-xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700 mb-4">
                <f.icon className="w-5 h-5" strokeWidth={1.75} />
              </div>
              <h3 className="font-display text-xl text-ink mb-2">{f.title}</h3>
              <p className="text-sm text-ink/65 leading-relaxed">{f.copy}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-moss-gradient text-cream py-20 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0 grain opacity-50 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs uppercase tracking-[0.18em] font-semibold text-yolk-300 mb-3">What breeders say</p>
            <h2 className="h-display text-4xl sm:text-5xl text-cream">Loved by farmers across SA.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {REVIEWS.map((r) => (
              <div key={r.name} className="bg-cream/10 backdrop-blur-sm border border-cream/10 rounded-2xl p-6">
                <div className="flex gap-1 mb-4">{[...Array(r.stars)].map((_, i) => <Star key={i} className="w-4 h-4 text-yolk-300 fill-yolk-300" />)}</div>
                <p className="text-cream text-base leading-relaxed mb-6">"{r.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-cream/10">
                  <div className="w-9 h-9 rounded-full bg-terracotta-300 flex items-center justify-center text-cream text-sm font-semibold">{r.name.slice(0,1)}</div>
                  <div><p className="text-sm font-medium text-cream">{r.name}</p><p className="text-xs text-cream/60">{r.role}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DOWNLOAD CTA */}
      <section id="download" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="card-premium p-10 lg:p-14 rounded-3xl bg-cream-gradient relative overflow-hidden">
          <div className="absolute inset-0 grain opacity-30 pointer-events-none" />
          <div className="relative text-center max-w-2xl mx-auto">
            <p className="eyebrow mb-4">Get the app</p>
            <h2 className="h-display text-4xl sm:text-5xl text-ink mb-4">Ready when you are.</h2>
            <p className="text-lg text-ink/70 mb-8">Free to download. Works on iPhone & Android. Same account as the website.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <StoreButton icon={AppleIcon} top="Download on the" big="App Store"   href="https://apps.apple.com/za/app/easy-poultry" />
              <StoreButton icon={PlayIcon}  top="Get it on"       big="Google Play" href="https://play.google.com/store/apps/details?id=za.co.easypoultry.app" />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-ink/50">
              <Link to={createPageUrl('Support')}        className="hover:text-moss-700 link-underline">Support</Link>
              <span>·</span>
              <Link to={createPageUrl('PrivacyPolicy')}  className="hover:text-moss-700 link-underline">Privacy policy</Link>
              <span>·</span>
              <Link to={createPageUrl('TermsOfService')} className="hover:text-moss-700 link-underline">Terms</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
