import React from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

/**
 * StatCard — clean dashboard metric.
 *
 *   <StatCard
 *     icon={Eye}
 *     label="Total views"
 *     value="1,284"
 *     delta="+12.4%"        // positive number => green ↑
 *     deltaLabel="vs last week"
 *     tint="moss"           // 'moss' | 'terracotta' | 'yolk' | 'sage'
 *   />
 */
const tints = {
  moss:       { bg: 'bg-moss-50',       icon: 'text-moss-700',       border: 'border-moss-100' },
  terracotta: { bg: 'bg-terracotta-50', icon: 'text-terracotta-600', border: 'border-terracotta-100' },
  yolk:       { bg: 'bg-yolk-50',       icon: 'text-yolk-600',       border: 'border-yolk-100' },
  sage:       { bg: 'bg-cream-deep',    icon: 'text-ink-soft',       border: 'border-yolk-100' },
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaLabel,
  tint = 'moss',
  className = '',
}) {
  const t = tints[tint] || tints.moss;
  const numericDelta = typeof delta === 'string' ? parseFloat(delta.replace(/[^\d.\-]/g, '')) : delta;
  const trend =
    numericDelta > 0 ? 'up' : numericDelta < 0 ? 'down' : 'flat';

  return (
    <div className={`card-premium p-6 ${className}`}>
      <div className="flex items-start justify-between mb-5">
        {Icon && (
          <div className={`w-11 h-11 rounded-xl ${t.bg} ${t.border} border flex items-center justify-center ${t.icon}`}>
            <Icon className="w-5 h-5" strokeWidth={1.75} />
          </div>
        )}
        {delta != null && (
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend === 'up'   ? 'bg-moss-50 text-moss-700' :
              trend === 'down' ? 'bg-terracotta-50 text-terracotta-600' :
                                 'bg-cream-deep text-ink/60'
            }`}
          >
            {trend === 'up'   && <ArrowUpRight className="w-3 h-3" />}
            {trend === 'down' && <ArrowDownRight className="w-3 h-3" />}
            {trend === 'flat' && <Minus className="w-3 h-3" />}
            {delta}
          </span>
        )}
      </div>
      <p className="text-xs uppercase tracking-[0.16em] text-ink/50 font-semibold">{label}</p>
      <p className="font-display text-3xl font-bold text-ink mt-1">{value}</p>
      {deltaLabel && <p className="text-xs text-ink/50 mt-1">{deltaLabel}</p>}
    </div>
  );
}
