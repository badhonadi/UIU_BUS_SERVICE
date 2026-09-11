'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, MapPin, Users, Check } from 'lucide-react';
import { ROUTE_COLORS } from '@/lib/constants';

interface RouteCardProps {
  route: {
    _id?: string;
    id?: string;
    routeNumber: number;
    routeName: string;
    routeCode: string;
    stops: string[];
    totalBuses: number;
    seatsPerBus: number;
    totalSeats: number;
    remarks?: string;
  };
  selected?: boolean;
  onSelect?: () => void;
  availableSeats?: number;
}

export function RouteCard({ route, selected, onSelect, availableSeats }: RouteCardProps) {
  const color = ROUTE_COLORS[route.routeCode] || '#F37021';

  return (
    <Card
      onClick={onSelect}
      className={`cursor-pointer transition-all duration-200 hover:shadow-md relative overflow-hidden border-2 ${
        selected ? 'border-[#F37021] bg-orange-50/30 shadow-md' : 'border-slate-100 hover:border-slate-200'
      }`}
    >
      <div
        className="absolute top-0 left-0 w-1.5 h-full"
        style={{ backgroundColor: color }}
      />

      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-semibold text-xs border-slate-300">
                Route-0{route.routeNumber}
              </Badge>
              {availableSeats !== undefined && (
                <Badge
                  className={
                    availableSeats > 20
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : availableSeats > 0
                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }
                >
                  {availableSeats > 0 ? `${availableSeats} seats left` : 'Sold Out'}
                </Badge>
              )}
            </div>
            <h3 className="font-bold text-lg text-slate-800">{route.routeName}</h3>
          </div>

          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center border ${
              selected
                ? 'bg-[#F37021] border-[#F37021] text-white'
                : 'border-slate-300 bg-white'
            }`}
          >
            {selected && <Check size={14} />}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Bus size={14} className="text-[#F37021]" />
            <span>{route.totalBuses} {route.totalBuses === 1 ? 'Bus' : 'Buses'} ({route.totalSeats} seats)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin size={14} className="text-[#1E3A5F]" />
            <span>{route.stops.length} Stoppages</span>
          </div>
        </div>

        {route.remarks && (
          <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
            ℹ️ {route.remarks}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
