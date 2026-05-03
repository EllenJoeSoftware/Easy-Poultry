import React from 'react';
import { motion } from 'framer-motion';
import { PackageOpen } from 'lucide-react';

/**
 * EmptyState — friendly "nothing here yet" panel with optional CTA.
 *
 *   <EmptyState
 *     icon={Package}
 *     title="No active listings"
 *     subtitle="Start selling by creating your first listing."
 *     action={<Link to="/CreateListing"><Button>Create listing</Button></Link>}
 *   />
 */
export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  subtitle,
  action,
  variant = 'card', // 'card' | 'plain'
  className = '',
}) {
  const wrapperBase =
    variant === 'card'
      ? 'card-premium p-10 lg:p-16 text-center'
      : 'py-16 text-center';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.2, 0.7, 0.3, 1] }}
      className={`${wrapperBase} ${className}`}
    >
      <div className="mx-auto w-20 h-20 rounded-2xl bg-moss-50 border border-moss-100 flex items-center justify-center text-moss-700 mb-6">
        <Icon className="w-9 h-9" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-2xl text-ink mb-2">{title}</h3>
      {subtitle && (
        <p className="text-ink/60 max-w-md mx-auto leading-relaxed">{subtitle}</p>
      )}
      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </motion.div>
  );
}
