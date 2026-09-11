'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';

interface StopSelectorProps {
  stops: string[];
  selectedStop?: string;
  onSelectStop: (stop: string) => void;
  direction: 'TO_UIU' | 'FROM_UIU';
}

export function StopSelector({ stops, selectedStop, onSelectStop, direction }: StopSelectorProps) {
  // Filter out UIU if direction is TO_UIU (since destination is UIU), or show all valid boarding stops
  const boardingStops = direction === 'TO_UIU' ? stops.filter((s) => s !== 'UIU') : ['UIU'];

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <Label className="text-base font-semibold text-slate-800">
        {direction === 'TO_UIU' ? 'Select Boarding Stop' : 'Boarding Location'}
      </Label>
      <Select value={selectedStop} onValueChange={(val) => onSelectStop(val || '')}>
        <SelectTrigger className="h-16 border-slate-300 bg-white px-4 text-base shadow-sm">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-[#1E3A5F]" />
            <SelectValue placeholder="Choose a stoppage..." />
          </div>
        </SelectTrigger>
        <SelectContent>
          {boardingStops.map((stop) => (
            <SelectItem key={stop} value={stop} className="py-3 text-base">
              {stop}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
