import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ value, onChange, onSearch, onFilterClick }) {
  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40 pointer-events-none" />
        <input
          type="text"
          placeholder="Search by breed, category, or keyword…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="w-full h-12 pl-11 pr-4 rounded-full bg-white border border-border text-sm text-ink placeholder:text-ink/40 shadow-soft focus:outline-none focus:ring-2 focus:ring-moss-300 focus:border-moss-400 transition"
        />
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="btn-cta h-12 px-6 text-sm hidden sm:inline-flex items-center"
      >
        Search
      </button>
      <button
        type="button"
        onClick={onSearch}
        className="btn-cta h-12 w-12 sm:hidden inline-flex items-center justify-center !px-0"
        aria-label="Search"
      >
        <Search className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={onFilterClick}
        className="h-12 w-12 rounded-full border border-border bg-white hover:bg-cream-deep text-ink/70 hover:text-moss-700 inline-flex items-center justify-center transition-colors"
        aria-label="Filters"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </button>
    </div>
  );
}
