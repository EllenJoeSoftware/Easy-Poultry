import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * PageShell — reusable wrapper for every internal page.
 *
 *   <PageShell
 *     eyebrow="Marketplace"
 *     title="Browse listings"
 *     subtitle="Live birds, eggs, feed and equipment from verified sellers."
 *     breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Marketplace' }]}
 *     action={<Button>Sell something</Button>}
 *     variant="hero"   // 'hero' | 'compact'
 *   >
 *     {children}
 *   </PageShell>
 *
 * Gives every page a consistent header, breadcrumb, max-width, padding,
 * and a smooth fade/slide-in animation.
 */
export default function PageShell({
  eyebrow,
  title,
  subtitle,
  breadcrumb,
  action,
  variant = 'hero',
  className = '',
  children,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32, ease: [0.2, 0.7, 0.3, 1] }}
      className={`min-h-[80vh] bg-cream ${className}`}
    >
      {/* Header band */}
      <header className={variant === 'hero' ? 'bg-cream-gradient border-b border-border' : 'bg-cream'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 lg:pt-14 lg:pb-12">
          {/* Breadcrumb */}
          {breadcrumb && breadcrumb.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-ink/50">
              {breadcrumb.map((b, i) => {
                const last = i === breadcrumb.length - 1;
                return (
                  <React.Fragment key={i}>
                    {b.href && !last ? (
                      <Link to={b.href} className="hover:text-moss-700 transition-colors">
                        {b.label}
                      </Link>
                    ) : (
                      <span className={last ? 'text-ink/80 font-medium' : ''}>{b.label}</span>
                    )}
                    {!last && <ChevronRight className="w-3 h-3 opacity-50" />}
                  </React.Fragment>
                );
              })}
            </nav>
          )}

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="max-w-3xl">
              {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
              {title && (
                <h1 className="h-display text-4xl sm:text-5xl text-ink leading-tight">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-3 text-base sm:text-lg text-ink/65 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {children}
      </div>
    </motion.div>
  );
}

/** Section wrapper — for sub-areas inside a page. */
export function Section({ title, eyebrow, action, children, className = '' }) {
  return (
    <section className={`mb-12 ${className}`}>
      {(title || action) && (
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
            {title && <h2 className="font-display text-2xl text-ink">{title}</h2>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
