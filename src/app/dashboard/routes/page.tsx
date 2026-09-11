'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin } from 'lucide-react';
import { ROUTE_DATA, ROUTE_COLORS } from '@/lib/constants';
import { RouteMap } from '@/components/routes/RouteMap';
import Link from 'next/link';

export default function RoutesPage() {
  const [selectedRoute, setSelectedRoute] = useState<number>(1);

  const activeRoute = ROUTE_DATA.find((r) => r.routeNumber === selectedRoute) || ROUTE_DATA[0];
  const boardingStops: readonly string[] = activeRoute.stops.filter((stop) => stop !== 'UIU');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">UIU Bus Routes Explorer</h1>
        <p className="text-slate-500 text-sm mt-1">Explore all 6 official AC bus routes, stoppages, and schedules</p>
      </div>

      {/* Route Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ROUTE_DATA.map((r) => (
          <Button
            key={r.routeNumber}
            onClick={() => setSelectedRoute(r.routeNumber)}
            variant={selectedRoute === r.routeNumber ? 'default' : 'outline'}
            className={`h-16 flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              selectedRoute === r.routeNumber
                ? 'bg-[#F37021] hover:bg-[#E85D0A] text-white shadow-md'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold uppercase">Route-0{r.routeNumber}</span>
            <span className="text-[11px] font-medium truncate max-w-full">{r.routeName.split(' – ')[0]}</span>
          </Button>
        ))}
      </div>

      {/* Selected Route Detail & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Route Info */}
        <Card className="lg:col-span-1 border-slate-200 p-0 shadow-sm">
          <CardHeader className="min-h-[132px] justify-center bg-slate-900 px-5 py-8 text-white rounded-t-xl">
            <Badge className="w-fit bg-[#F37021] text-white font-bold mb-2">Route-0{activeRoute.routeNumber}</Badge>
            <CardTitle className="text-2xl">{activeRoute.routeName}</CardTitle>
            <CardDescription className="text-slate-300 text-xs">
              {activeRoute.totalBuses} AC Buses • {activeRoute.totalSeats} Total Capacity
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-[#F37021]" /> Bus Stands ({boardingStops.length})
              </h4>
              <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-orange-200">
                {boardingStops.map((stop, idx) => (
                  <div key={idx} className="relative flex items-center gap-2 text-xs font-medium text-slate-700">
                    <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-[#F37021] border-2 border-white" />
                    <span>{stop}</span>
                  </div>
                ))}
              </div>
            </div>

            {activeRoute.remarks && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800">
                <p className="font-semibold mb-1">Route Remarks:</p>
                <p>{activeRoute.remarks}</p>
              </div>
            )}

            <Button className="w-full bg-[#F37021] hover:bg-[#E85D0A] text-white font-semibold h-12">
              <Link href="/dashboard/book" className="flex items-center justify-center">
                Book Ticket for Route-0{activeRoute.routeNumber} <ArrowRight size={16} className="ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Embedded Map Section */}
        <Card className="lg:col-span-2 h-[640px] border-slate-200 p-0 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="min-h-[64px] border-b bg-slate-50 px-5 py-4">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Interactive Route Map</span>
              <Badge variant="outline" className="text-xs">Google Maps</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 p-0">
            <RouteMap
              routeName={activeRoute.routeName}
              stops={activeRoute.stops}
              routeColor={ROUTE_COLORS[activeRoute.routeCode] || '#F37021'}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
