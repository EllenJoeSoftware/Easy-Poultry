import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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

export default function FilterPanel({ filters, onChange, onClear, onClose }) {
  return (
    <Card className="p-6 border-0 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        <button
          onClick={onClose}
          className="lg:hidden p-1 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Category</Label>
          <Select
            value={filters.category || 'all'}
            onValueChange={(value) => onChange({ ...filters, category: value === 'all' ? '' : value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Price Range</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              placeholder="Min"
              value={filters.minPrice || ''}
              onChange={(e) => onChange({ ...filters, minPrice: e.target.value })}
              className="h-10"
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              placeholder="Max"
              value={filters.maxPrice || ''}
              onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
              className="h-10"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">Province/State</Label>
          <Select
            value={filters.province || 'all'}
            onValueChange={(value) => onChange({ ...filters, province: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Provinces</SelectItem>
              <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
              <SelectItem value="Free State">Free State</SelectItem>
              <SelectItem value="Gauteng">Gauteng</SelectItem>
              <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
              <SelectItem value="Limpopo">Limpopo</SelectItem>
              <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
              <SelectItem value="Northern Cape">Northern Cape</SelectItem>
              <SelectItem value="North West">North West</SelectItem>
              <SelectItem value="Western Cape">Western Cape</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700 mb-2 block">City/Town</Label>
          <Input
            type="text"
            placeholder="Enter city"
            value={filters.city || ''}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className="h-10"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={onClear}
            variant="outline"
            className="flex-1"
          >
            Clear All
          </Button>
        </div>
      </div>
    </Card>
  );
}