import React from 'react';

/** Skeleton placeholder matching the ListingCard aspect ratio. */
export function ListingSkeleton() {
  return (
    <div className="card-premium overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-cream-deep" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-cream-deep rounded w-3/4" />
        <div className="h-3 bg-cream-deep rounded w-1/2" />
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <div className="h-6 bg-cream-deep rounded w-20" />
          <div className="h-3 bg-cream-deep rounded w-12" />
        </div>
      </div>
    </div>
  );
}

/** Generic content skeleton (lines). */
export function LineSkeleton({ rows = 3, className = '' }) {
  return (
    <div className={`space-y-2.5 animate-pulse ${className}`}>
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className="h-3 bg-cream-deep rounded"
          style={{ width: `${85 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

/** Stat card skeleton. */
export function StatSkeleton() {
  return (
    <div className="card-premium p-6 animate-pulse">
      <div className="flex items-start justify-between mb-5">
        <div className="w-11 h-11 rounded-xl bg-cream-deep" />
        <div className="h-5 w-14 bg-cream-deep rounded-full" />
      </div>
      <div className="h-3 w-20 bg-cream-deep rounded" />
      <div className="h-7 w-24 bg-cream-deep rounded mt-2" />
    </div>
  );
}
