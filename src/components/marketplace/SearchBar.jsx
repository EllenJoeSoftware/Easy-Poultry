import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ value, onChange, onSearch, onFilterClick }) {
  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ink/40" />
        <Input
          type="text"
          placeholder="Search by breed, category, or keyword..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="pl-10 h-12 bg-white border-border focus:border-moss-600 focus:ring-moss-300"
        />
      </div>
      <Button
        onClick={onSearch}
        className="h-12 px-6 btn-cta text-white"
      >
        Search
      </Button>
      <Button
        onClick={onFilterClick}
        variant="outline"
        className="h-12 px-4 border-border"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </Button>
    </div>
  );
}