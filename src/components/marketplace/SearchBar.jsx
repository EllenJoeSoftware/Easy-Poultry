import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ value, onChange, onSearch, onFilterClick }) {
  return (
    <div className="flex gap-2">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by breed, category, or keyword..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="pl-10 h-12 bg-white border-gray-200 focus:border-[#7A9D7A] focus:ring-[#7A9D7A]"
        />
      </div>
      <Button
        onClick={onSearch}
        className="h-12 px-6 bg-[#7A9D7A] hover:bg-[#6A8D6A] text-white"
      >
        Search
      </Button>
      <Button
        onClick={onFilterClick}
        variant="outline"
        className="h-12 px-4 border-gray-200"
      >
        <SlidersHorizontal className="w-5 h-5" />
      </Button>
    </div>
  );
}