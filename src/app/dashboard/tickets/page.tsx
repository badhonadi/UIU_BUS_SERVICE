'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { TicketCard } from '@/components/tickets/TicketCard';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const { status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }

    async function fetchTickets() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/tickets?status=${filter}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Unable to load your tickets.');
          setTickets([]);
        } else {
          setTickets(data.tickets || []);
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load your tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, [filter, status]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">My Bus Tickets</h1>
        <p className="text-slate-500 text-sm mt-1">View and manage all your UIU RideWave ticket bookings</p>
      </div>

      <Tabs defaultValue="ALL" onValueChange={setFilter} className="w-full">
        <TabsList className="bg-white border border-slate-200 p-1 h-12 rounded-xl">
          <TabsTrigger value="ALL" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white font-semibold">
            All Tickets
          </TabsTrigger>
          <TabsTrigger value="UPCOMING" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white font-semibold">
            Active / Upcoming
          </TabsTrigger>
          <TabsTrigger value="CANCELLED" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white font-semibold">
            Cancelled
          </TabsTrigger>
          <TabsTrigger value="PAST" className="data-[state=active]:bg-[#F37021] data-[state=active]:text-white font-semibold">
            Past Trips
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading || status === 'loading' ? (
            <LoadingSpinner size="lg" className="py-16" />
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center text-red-700">
              <p className="font-semibold">Unable to load tickets</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : tickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8">
              <EmptyState
                type="tickets"
                title="No Tickets Found"
                description="You don't have any tickets under this category."
                actionLabel="Book a Ticket"
                actionHref="/dashboard/book"
              />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
