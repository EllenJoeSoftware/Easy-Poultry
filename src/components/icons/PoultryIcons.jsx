/**
 * Easy Poultry — custom icon library.
 *
 * Hand-crafted line-art SVG icons for each marketplace category and the
 * brand mark. All icons follow the same design system as lucide-react:
 *
 *   - 24x24 viewBox
 *   - stroke="currentColor", fill="none"
 *   - strokeWidth={1.6}, linecap="round", linejoin="round"
 *
 * This means they inherit text-foo colours from Tailwind classes and pair
 * perfectly with any Lucide icons used elsewhere.
 *
 * Usage:
 *   import { ChickenIcon } from '@/components/icons/PoultryIcons';
 *   <ChickenIcon className="w-8 h-8 text-moss-700" />
 */
import React from 'react';

const baseProps = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

/* ============================================================
   CHICKEN  —  proud hen with comb, wattle, single visible eye
   ============================================================ */
export const ChickenIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    {/* comb */}
    <path d="M9.5 4.2c.4-.6.9-.7 1.2-.2.4-.6.9-.6 1.2 0 .4-.6.9-.5 1.1.1.3-.5.7-.4.9.2v1.7" />
    {/* head + body */}
    <path d="M13.9 6c.5.4.9 1.1.9 1.9 0 .9-.5 1.6-1.2 2.1.7.4 1.5 1 2 1.7 1.3 1.7 1.7 4.4-.4 6.4-1.5 1.4-3.8 2.1-5.7 2.1-3.5 0-5.7-1.7-5.7-4.4 0-2 .8-3.8 2.4-5 .7-.6 1.7-1.2 2.7-1.5" />
    {/* beak */}
    <path d="M15.5 7.4l1.6.4-1.6.6" />
    {/* wattle */}
    <path d="M14 8.7c.2.5 0 1.1-.4 1.4" />
    {/* eye */}
    <circle cx="13.7" cy="7.3" r="0.4" fill="currentColor" stroke="none" />
    {/* legs */}
    <path d="M9 19.8v1.7M9 21.5h1.4M12.3 19.8v1.7M12.3 21.5h1.4" />
    {/* tail feathers */}
    <path d="M4.5 12.5c-1.8-.6-2.7-2.4-2.5-3.8M4 14c-1.6 0-2.7-1.1-3-2.4M4.4 15.7c-1.4.5-2.6-.2-3.2-1.4" />
  </svg>
);

/* ============================================================
   DUCK  —  rounded body, signature flat bill, water line hint
   ============================================================ */
export const DuckIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    {/* head */}
    <circle cx="16.5" cy="8" r="2.4" />
    {/* eye */}
    <circle cx="17.2" cy="7.6" r="0.4" fill="currentColor" stroke="none" />
    {/* bill */}
    <path d="M18.7 8.3l3.1.4-3.1 1.1z" />
    {/* body — wide oval */}
    <path d="M15 10.2c-3.5 0-6.7 1.6-7.9 4.6-.5 1.4-.4 2.6.5 3.4.9.8 2.4.9 3.7.9h6.8c1.5 0 2.7-.4 3.4-1.2.7-.8.7-1.9.3-2.9-.6-1.3-1.7-2.4-3.2-3.1" />
    {/* wing detail */}
    <path d="M11 14c1.4 1.7 3.5 2.2 5.2 1.6" />
    {/* water ripples */}
    <path d="M3 20.5c1-.5 2-.5 3 0M8 20.5c1-.5 2-.5 3 0M14 20.5c1-.5 2-.5 3 0" />
  </svg>
);

/* ============================================================
   TURKEY  —  fan tail, snood
   ============================================================ */
export const TurkeyIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    {/* fan tail — three layered arcs */}
    <path d="M21 11c0-4.4-4-8-9-8s-9 3.6-9 8" />
    <path d="M18.5 11c0-3-2.9-5.5-6.5-5.5S5.5 8 5.5 11" />
    <path d="M16.2 11c0-1.8-1.9-3.3-4.2-3.3s-4.2 1.5-4.2 3.3" />
    {/* fan rays */}
    <path d="M12 3v8M7 4.5l2 6.3M17 4.5l-2 6.3M3.7 7.7l4.2 4.7M20.3 7.7l-4.2 4.7" />
    {/* body */}
    <ellipse cx="12" cy="15" rx="3.2" ry="3" />
    {/* head + snood */}
    <path d="M12 12v-1M11.4 11.4l-.4-.8" />
    {/* legs */}
    <path d="M10.5 18v2M10.5 20h1.4M13.5 18v2M13.5 20h1.4" />
  </svg>
);

/* ============================================================
   QUAIL  —  small round body with trademark forward crest
   ============================================================ */
export const QuailIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    {/* crest — angled forward */}
    <path d="M14.2 5.8c-.1-1 .2-2 .8-2.6.2.7-.1 1.4-.5 1.8.6-.2 1.2-.1 1.6.3-.4.5-.9.7-1.4.7" />
    {/* head */}
    <circle cx="14.5" cy="8" r="2" />
    {/* eye */}
    <circle cx="15" cy="7.7" r="0.4" fill="currentColor" stroke="none" />
    {/* beak */}
    <path d="M16.3 8.3l1 .3-1 .4" />
    {/* body — plump teardrop */}
    <path d="M13.2 9.8c-3 0-6 1.6-7 4.4-.5 1.4-.2 2.7.7 3.5.9.7 2.2.8 3.4.8h4.3c1.4 0 2.7-.3 3.4-1.1.7-.8.6-2 .1-3-.6-1.4-1.9-2.5-3.4-3.2" />
    {/* speckle markings */}
    <circle cx="9" cy="13.5" r="0.3" fill="currentColor" stroke="none" />
    <circle cx="11.5" cy="14.5" r="0.3" fill="currentColor" stroke="none" />
    <circle cx="13.5" cy="13" r="0.3" fill="currentColor" stroke="none" />
    {/* legs */}
    <path d="M9.5 18.5v1.5M9.5 20h1M12.5 18.5v1.5M12.5 20h1" />
  </svg>
);

/* ============================================================
   EGG  —  classic egg silhouette with soft highlight
   ============================================================ */
export const EggIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    <path d="M12 3c3.5 0 6.5 5 6.5 9.5S15.5 21 12 21s-6.5-3.5-6.5-8.5S8.5 3 12 3z" />
    {/* highlight */}
    <path d="M9.5 7.5c-.7 1.2-1 2.4-1 3.5" opacity="0.55" />
  </svg>
);

/* ============================================================
   CHICK  —  fluffy round chick, tiny wing & beak
   ============================================================ */
export const ChickIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    {/* fluffy outline */}
    <path d="M6.5 13.5C5 12 5 9.5 6.5 8s4-1.5 5.5 0c.4-1.5 1.6-2.5 3.2-2.5 2.2 0 3.8 1.7 3.8 3.8 0 .8-.2 1.5-.5 2 1 .8 1.5 2 1.5 3.4 0 2.6-2.2 4.8-4.8 4.8H10c-2.6 0-4.8-2.2-4.8-4.8 0-.4 0-.8.1-1.2" />
    {/* eye */}
    <circle cx="14" cy="10" r="0.5" fill="currentColor" stroke="none" />
    {/* beak */}
    <path d="M16 11l1.4.4-1.4.5" />
    {/* tiny wing */}
    <path d="M11 14c.6 1.2 2 1.8 3.3 1.5" />
    {/* feet */}
    <path d="M10 19v1.4M10 20.4h.9M14 19v1.4M14 20.4h.9" />
  </svg>
);

/* ============================================================
   FEED  —  bowl + grain pellets + wheat sprig
   ============================================================ */
export const FeedIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    {/* wheat sprig */}
    <path d="M12 3v8" />
    <path d="M12 5c1-.5 1.8-.3 2 .5-.8.5-1.6.4-2-.5z" />
    <path d="M12 5c-1-.5-1.8-.3-2 .5.8.5 1.6.4 2-.5z" />
    <path d="M12 7c1-.5 1.8-.3 2 .5-.8.5-1.6.4-2-.5z" />
    <path d="M12 7c-1-.5-1.8-.3-2 .5.8.5 1.6.4 2-.5z" />
    <path d="M12 9c1-.5 1.8-.3 2 .5-.8.5-1.6.4-2-.5z" />
    <path d="M12 9c-1-.5-1.8-.3-2 .5.8.5 1.6.4 2-.5z" />
    {/* bowl rim */}
    <path d="M3 13h18" />
    {/* bowl body */}
    <path d="M4 13c0 4 3.6 7 8 7s8-3 8-7" />
    {/* pellets inside */}
    <circle cx="9" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="15" r="0.6" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15.5" r="0.6" fill="currentColor" stroke="none" />
  </svg>
);

/* ============================================================
   EQUIPMENT  —  incubator with door & temp gauge
   ============================================================ */
export const EquipmentIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    {/* incubator box */}
    <rect x="3" y="6" width="18" height="14" rx="2" />
    {/* viewing window */}
    <rect x="6" y="9" width="10" height="6" rx="1" />
    {/* eggs inside */}
    <ellipse cx="9" cy="12" rx="0.9" ry="1.2" />
    <ellipse cx="11" cy="12" rx="0.9" ry="1.2" />
    <ellipse cx="13" cy="12" rx="0.9" ry="1.2" />
    {/* temp gauge */}
    <circle cx="18.5" cy="11" r="1.2" />
    <path d="M18.5 10.4v.6l.4.4" />
    {/* control buttons */}
    <circle cx="8" cy="17.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="11" cy="17.5" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="14" cy="17.5" r="0.5" fill="currentColor" stroke="none" />
    {/* feet */}
    <path d="M5 20v1.5M19 20v1.5" />
  </svg>
);

/* ============================================================
   GOOSE  —  long arched neck (bonus icon for 'geese' category)
   ============================================================ */
export const GooseIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    {/* long curved neck */}
    <path d="M18 4c-1 1-1.4 2.4-1 3.6.4 1.2-.2 2.4-1.5 3-1.4.6-2.6 1.4-3.5 2.4" />
    {/* head */}
    <circle cx="18.5" cy="3.5" r="1.4" />
    <circle cx="18.7" cy="3.2" r="0.3" fill="currentColor" stroke="none" />
    {/* bill */}
    <path d="M19.8 3.7l1.7.3-1.7.6" />
    {/* body */}
    <ellipse cx="9" cy="15" rx="6" ry="3.6" />
    {/* wing */}
    <path d="M5 14c2 1.6 5 1.6 7 0" />
    {/* feet */}
    <path d="M6 18.5v1.5M6 20h1M11 18.5v1.5M11 20h1" />
  </svg>
);

/* ============================================================
   PIGEON  —  curved breast, neck collar
   ============================================================ */
export const PigeonIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    <path d="M14.5 4c-1 0-2 .8-2 2.2 0 .8.4 1.5 1 1.9-1.5.5-3 1.5-4 2.8-1.6 2.1-1.5 4.6.4 6.2 1.6 1.4 4.3 1.9 6.3 1.4 2.6-.6 4.5-2.5 4.5-4.7 0-1.6-1-3.1-2.8-3.8" />
    {/* head — sphere */}
    <circle cx="14.5" cy="6.2" r="1.2" />
    <circle cx="14.8" cy="5.9" r="0.3" fill="currentColor" stroke="none" />
    {/* beak */}
    <path d="M15.6 6.4l1.2.3-1.2.5" />
    {/* neck collar */}
    <path d="M13.5 8.5c.3.6 1 1 1.7 1" />
    {/* legs */}
    <path d="M10 18v2M13 18v2" />
    {/* tail */}
    <path d="M3 13l-1 2 2.5-.5" />
  </svg>
);

/* ============================================================
   GUIDE / DIGITAL — for ebooks, courses, templates (PDFs)
   ============================================================ */
export const GuideIcon = ({ className = '', ...rest }) => (
  <svg {...baseProps} className={className} {...rest}>
    {/* document outline */}
    <path d="M5 3h9l5 5v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
    {/* folded corner */}
    <path d="M14 3v5h5" />
    {/* lines of text */}
    <path d="M7 13h10M7 16h10M7 19h6" />
    {/* small star ('premium content') */}
    <path d="M9 8l.6 1.3L11 10l-1.4.7L9 12l-.6-1.3L7 10l1.4-.7z" fill="currentColor" stroke="none" />
  </svg>
);

/* ============================================================
   CATEGORY MAP — convenience export for the marketplace
   ============================================================ */
export const CATEGORY_ICONS = {
  chickens: ChickenIcon,
  ducks: DuckIcon,
  geese: GooseIcon,
  turkeys: TurkeyIcon,
  quail: QuailIcon,
  guinea_fowl: ChickenIcon,
  peafowl: TurkeyIcon,
  pigeons: PigeonIcon,
  eggs_table: EggIcon,
  eggs_fertile: EggIcon,
  chicks: ChickIcon,
  growers: ChickenIcon,
  layers: ChickenIcon,
  broilers: ChickenIcon,
  feed: FeedIcon,
  supplements: FeedIcon,
  incubators: EquipmentIcon,
  equipment: EquipmentIcon,
  // digital products
  ebook: GuideIcon,
  guide: GuideIcon,
  course: GuideIcon,
  template: GuideIcon,
  other: ChickenIcon,
};

export default {
  ChickenIcon, DuckIcon, TurkeyIcon, QuailIcon,
  EggIcon, ChickIcon, FeedIcon, EquipmentIcon,
  GooseIcon, PigeonIcon, GuideIcon, CATEGORY_ICONS,
};
