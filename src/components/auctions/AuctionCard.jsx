import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Users, Gavel, ArrowRight, Package } from 'lucide-react';
import moment from 'moment';
import { createPageUrl } from '../../utils';

const POULTRY_LABELS = {
  chickens: 'Chickens', ducks: 'Ducks', geese: 'Geese', turkeys: 'Turkeys',
  quail: 'Quail', guinea_fowl: 'Guinea Fowl', peafowl: 'Peafowl', pigeons: 'Pigeons', other: 'Other'
};

function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const diff = Math.max(0, new Date(target) - now);
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
  return { d, h, m, s, done: diff === 0 };
}

export default function AuctionCard({ auction }) {
  const primaryImage = auction.images?.[0];
  const currentBid = auction.current_bid || auction.starting_bid;
  const hasStarted = moment().isAfter(auction.start_time);
  const hasEnded = moment().isAfter(auction.end_time);
  const live = hasStarted && !hasEnded;
  const cd = useCountdown(hasStarted ? auction.end_time : auction.start_time);
  const pad = (n) => String(n).padStart(2, '0');

  return (
    <motion.article variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="group card-premium overflow-hidden relative flex flex-col">
      <Link to={createPageUrl('AuctionDetail') + `?id=${auction.id}`} className="absolute inset-0 z-10" aria-label={auction.title} />
      <div className="aspect-[4/3] bg-moss-gradient relative overflow-hidden">
        {primaryImage
          ? <img src={primaryImage} alt={auction.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="absolute inset-0 grain opacity-50 flex items-center justify-center"><Package className="w-12 h-12 text-cream/30" /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />
        <div className="absolute top-3 left-3 z-20 flex items-center gap-2">
          {live ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-terracotta-500 text-white text-[11px] font-semibold uppercase tracking-wider shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
            </span>
          ) : hasEnded ? (
            <span className="chip bg-ink/70 text-cream border-0">Ended</span>
          ) : (
            <span className="chip chip-yolk">Upcoming</span>
          )}
          <span className="chip bg-white/90 text-ink border-0">{POULTRY_LABELS[auction.poultry_type] || auction.poultry_type}</span>
        </div>
        {!hasEnded && (
          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-cream">
            <span className="text-[11px] uppercase tracking-wider opacity-80">{hasStarted ? 'Ends in' : 'Starts in'}</span>
            <span className="font-display font-bold text-lg tabular-nums">{cd.d > 0 && `${cd.d}d `}{pad(cd.h)}:{pad(cd.m)}:{pad(cd.s)}</span>
          </div>
        )}
      </div>

      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-display text-lg text-ink leading-snug line-clamp-1 group-hover:text-moss-700 transition-colors">{auction.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-ink/55">
          {auction.breed && <span>{auction.breed}</span>}
          {(auction.city || auction.province) && <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{auction.city}, {auction.province}</span>}
          {auction.quantity > 1 && <span>Qty {auction.quantity}</span>}
        </div>

        <div className="mt-auto pt-4 border-t border-border flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ink/50 font-semibold">{auction.bid_count > 0 ? 'Current bid' : 'Starting bid'}</p>
            <p className="font-display text-2xl font-bold text-terracotta-600 tabular-nums">R{currentBid.toLocaleString()}</p>
          </div>
          <div className="text-right text-xs text-ink/55">
            {auction.bid_count > 0 && <span className="inline-flex items-center gap-1"><Users className="w-3 h-3" />{auction.bid_count} bids</span>}
          </div>
        </div>
        <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-moss-700">
          {live ? <><Gavel className="w-4 h-4" /> Bid now</> : 'View auction'} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </motion.article>
  );
}
