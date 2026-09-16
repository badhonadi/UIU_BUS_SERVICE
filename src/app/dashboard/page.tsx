'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketCard } from '@/components/tickets/TicketCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Bus, ShoppingCart, Ticket as TicketIcon, Calendar, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { ROUTE_DATA } from '@/lib/constants';

type RecentTicket = {
  _id: string;
  ticketId: string;
  busNumber: string;
  travelDate: string;
  direction: 'TO_UIU' | 'FROM_UIU';
  boardingStop: string;
  seatNumber: number;
  price: number;
  status: 'CONFIRMED' | 'CANCELLED' | 'USED';
  paymentMethod: string;
  studentName: string;
  studentId: string;
  routeId: {
    routeName: string;
    routeCode: string;
    routeNumber: number;
  };
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcomingTickets() {
      try {
        const res = await fetch('/api/tickets?limit=3');
        if (res.ok) {
          const data = await res.json();
          setTickets(data.tickets || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUpcomingTickets();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#1E3A5F] to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#F37021] mb-3">
            <Sparkles size={12} /> Student Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {session?.user?.name || 'Student'}! 👋
          </h1>
          <p className="mt-2 text-slate-300 text-sm sm:text-base leading-relaxed">
            Need a ride to campus tomorrow? Book your AC bus ticket quickly before the midnight cutoff.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" className="bg-[#F37021] hover:bg-[#E85D0A] text-white font-semibold shadow-lg">
              <Link href="/dashboard/book" className="flex items-center">
                <ShoppingCart className="mr-2" size={18} /> Book Ticket Now
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Link href="/dashboard/routes" className="flex items-center">
                <MapPin className="mr-2" size={18} /> Explore Routes
              </Link>
            </Button>
          </div>
        </div>

        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none hidden lg:block">
          <Bus size={320} />
        </div>
      </div>

      {/* Quick Stats & Upcoming Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Tickets List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <TicketIcon className="text-[#F37021]" size={20} /> Your Recent Tickets
            </h2>
            <Link href="/dashboard/tickets" className="text-xs font-semibold text-[#F37021] hover:underline flex items-center gap-1">
              View All <ArrowRight size={12} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-12" />
          ) : tickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((ticket) => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <EmptyState
                  type="tickets"
                  title="No Tickets Booked Yet"
                  description="You don't have any bus tickets. Click below to book your first ride!"
                  actionLabel="Book a Ticket"
                  actionHref="/dashboard/book"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Info & Routes Overview */}
        <div className="space-y-6">
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-[#F37021]" /> Bus Schedule Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="font-semibold text-slate-800 dark:text-slate-100">Operating Days</p>
                <p className="mt-0.5">Saturday to Wednesday (No service Thu & Fri)</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="font-semibold text-slate-800 dark:text-slate-100">Ticket Deadline</p>
                <p className="mt-0.5">Until 11:59 PM of the day before travel</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="font-semibold text-slate-800 dark:text-slate-100">Fare Rate</p>
                <p className="mt-0.5">Flat ৳100 per ticket for any route</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Bus size={18} className="text-[#1E3A5F] dark:text-sky-300" /> Popular Routes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ROUTE_DATA.slice(0, 3).map((r) => (
                <Link
                  key={r.routeNumber}
                  href="/dashboard/book"
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                >
                  <div>
                    <p className="font-semibold text-xs text-slate-800 dark:text-slate-100">{r.routeName}</p>
                    <p className="text-[11px] text-slate-400">{r.totalSeats} seats total</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-400" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
