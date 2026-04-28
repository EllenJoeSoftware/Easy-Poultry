/**
 * Easy Poultry brand mark.
 *
 * Two exports:
 *   - <LogoMark>   — the icon-only mark (use in compact spaces, favicons, app icons)
 *   - <LogoLockup> — the mark + wordmark, for the main nav
 *
 * The mark is a stylised hen silhouette in a rounded square gradient frame
 * with a yolk-coloured "egg" accent dot. Designed to read well at 16px–80px.
 */
import React from 'react';

export const LogoMark = ({
  className = 'w-11 h-11',
  showAccent = true,
  ...rest
}) => (
  <span className={`relative inline-block ${className}`} {...rest}>
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="w-full h-full"
      role="img"
      aria-label="Easy Poultry"
    >
      <defs>
        <linearGradient id="ep-mark-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A5A40" />
          <stop offset="100%" stopColor="#1F3324" />
        </linearGradient>
        <linearGradient id="ep-mark-shine" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* rounded square frame */}
      <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#ep-mark-bg)" />
      {/* subtle top shine */}
      <rect x="0" y="0" width="48" height="22" rx="12" fill="url(#ep-mark-shine)" />

      {/* hen silhouette — designed in 48-grid, single solid path for crispness */}
      <g fill="#FAF7F2">
        {/* comb */}
        <path d="M21.2 9.1c.5-1 1.4-1.1 1.9-.2.5-.9 1.4-.9 1.9 0 .5-.9 1.4-.8 1.7.2.4-.7 1.1-.6 1.4.3.2.7-.1 1.4-.7 1.7-.4-.7-1-.8-1.4-.2-.4-.6-1.1-.6-1.5 0-.4-.6-1.1-.6-1.5 0-.5.6-1.2.6-1.6 0-.2-.6.1-1.2.8-1.8z" />
        {/* head + body */}
        <path d="M28 13c1.5.6 2.6 2.1 2.6 3.9 0 1.4-.7 2.6-1.7 3.4 1.4.7 2.7 1.7 3.6 3 2.6 3.6 2.6 8.8-1.6 12.4-2.7 2.3-7 3.3-10.6 3.3-6.5 0-11-2.6-11-7.6 0-3.6 1.6-7 4.5-9.4 2.4-2 5.5-3.2 8.7-3.4-.6-.7-1-1.7-1-2.7 0-2.4 1.9-4.4 4.4-4.4.5 0 1 .1 1.4.2-.5.7-.7 1.5-.5 2.4z" />
        {/* tail feathers */}
        <path d="M9 26.6c-3.5-1-5.3-4.5-4.7-7.4 1.6 1.6 3.4 2.8 5 3.4-.2 1.3-.3 2.6-.3 4z" />
        <path d="M8 30.5c-3.4 0-5.5-2.4-5.7-4.9 1.7 1 3.6 1.6 5.3 1.7 0 1.1.1 2.2.4 3.2z" />
        <path d="M9.2 33.9c-3 1.1-5.6-.4-6.6-2.8 1.8.5 3.7.5 5.3.1.3 1 .8 1.9 1.3 2.7z" />
      </g>

      {/* eye */}
      <circle cx="29.7" cy="17.5" r="0.9" fill="#1B1B1F" />
      {/* beak */}
      <path d="M31 18l3.3.8-3.3 1z" fill="#F4B860" />
      {/* wattle */}
      <path d="M28.6 19.6c.5 1.1 0 2.4-1 2.9" stroke="#E07A5F" strokeWidth="1.3" fill="none" strokeLinecap="round" />

      {/* legs */}
      <path d="M19 41.5v3.5M19 45h2.4M24 41.5v3.5M24 45h2.4" stroke="#FAF7F2" strokeWidth="1.6" strokeLinecap="round" />
    </svg>

    {/* yolk accent dot */}
    {showAccent && (
      <span
        className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #FFD58A 0%, #F4B860 60%, #D7841E 100%)',
          boxShadow: '0 0 0 2px #FAF7F2, 0 1px 3px rgba(27,27,31,.18)',
        }}
        aria-hidden
      />
    )}
  </span>
);

export const LogoLockup = ({
  size = 'md', // 'sm' | 'md' | 'lg'
  showTagline = true,
  className = '',
}) => {
  const sizes = {
    sm: { mark: 'w-9 h-9',  word: 'text-lg',  tag: 'text-[9px]' },
    md: { mark: 'w-11 h-11', word: 'text-xl',  tag: 'text-[10px]' },
    lg: { mark: 'w-14 h-14', word: 'text-2xl', tag: 'text-[11px]' },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark className={s.mark} />
      <div className="flex flex-col leading-none">
        <span className={`font-display font-bold tracking-tight text-ink ${s.word}`}>
          Easy Poultry
        </span>
        {showTagline && (
          <span className={`uppercase tracking-[0.2em] text-moss-600 font-semibold mt-1 ${s.tag}`}>
            marketplace · farm · auctions
          </span>
        )}
      </div>
    </div>
  );
};

export default LogoMark;
