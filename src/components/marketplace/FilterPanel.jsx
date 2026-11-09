import React from 'react';
import { X, RotateCcw } from 'lucide-react';

const categories = [
  { value: 'all', label: 'All Categories' },
  { value: 'chickens', label: 'Chickens' },
  { value: 'ducks', label: 'Ducks' },
  { value: 'geese', label: 'Geese' },
  { value: 'turkeys', label: 'Turkeys' },
  { value: 'quail', label: 'Quail' },
  { value: 'guinea_fowl', label: 'Guinea Fowl' },
  { value: 'peafowl', label: 'Peafowl' },
  { value: 'pigeons', label: 'Pigeons' },
  { value: 'eggs_table', label: 'Table Eggs' },
  { value: 'eggs_fertile', label: 'Fertile Eggs' },
  { value: 'chicks', label: 'Chicks' },
  { value: 'growers', label: 'Growers' },
  { value: 'layers', label: 'Layers' },
  { value: 'broilers', label: 'Broilers' },
  { value: 'feed', label: 'Feed & Supplies' },
  { value: 'supplements', label: 'Supplements' },
  { value: 'incubators', label: 'Incubators' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' }
];

const provinces = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
];

const inputCls = 'w-full bg-cream border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moss-300';

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? 'bg-moss-600 text-cream border-moss-600'
          : 'bg-white text-ink/70 border-border hover:border-moss-300 hover:text-moss-700'
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterPanel({ filters, onChange, onClear, onClose }) {
  const activeCategory = filters.category || 'all';
  const activeProvince = filters.province || 'all';
  const activeCount = [filters.category, filters.province, filters.city, filters.minPrice, filters.maxPrice].filter(Boolean).length;

  return (
    <div className="card-premium p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="eyebrow">Refine</p>
          <h3 className="font-display text-lg text-ink mt-0.5">
            Filters{activeCount > 0 && <span className="ml-2 chip text-[10px] !py-0.5 align-middle">{activeCount}</span>}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-cream-deep text-ink/60"
          aria-label="Close filters"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold text-ink/55 uppercase tracking-[0.14em] mb-2.5">Category</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => (
              <Chip
                key={cat.value}
                active={activeCategory === cat.value}
                onClick={() => onChange({ ...filters, category: cat.value === 'all' ? '' : cat.value })}
              >
                {cat.label}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-ink/55 uppercase tracking-[0.14em] mb-2.5">Price range (R)</p>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
              className={inputCls}
            />
            <span className="text-ink/40 text-sm">to</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-ink/55 uppercase tracking-[0.14em] mb-2.5">Province</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={activeProvince === 'all'} onClick={() => onChange({ ...filters, province: '' })}>
              All Provinces
            </Chip>
            {provinces.map((p) => (
              <Chip key={p} active={activeProvince === p} onClick={() => onChange({ ...filters, province: p })}>
                {p}
              </Chip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-ink/55 uppercase tracking-[0.14em] mb-2.5">City / Town</p>
          <input
            type="text"
            placeholder="Enter city"
            value={filters.city || ''}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className={inputCls}
          />
        </div>

        <div className="pt-2 border-t border-border">
          <button
            type="button"
            onClick={onClear}
            className="btn-ghost border border-border bg-white w-full py-2.5 text-sm inline-flex items-center justify-center gap-1.5 rounded-full"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear all
          </button>
        </div>
      </div>
    </div>
  );
}
