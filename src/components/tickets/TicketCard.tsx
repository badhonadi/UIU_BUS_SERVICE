'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bus, Calendar, MapPin, ArrowRight, Download, QrCode } from 'lucide-react';
import { formatDateShort, isTravelDateExpired } from '@/lib/utils';
import Link from 'next/link';

interface TicketCardProps {
  ticket: {
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
}

export function TicketCard({ ticket }: TicketCardProps) {
  const isPast = isTravelDateExpired(new Date(ticket.travelDate));

  return (
    <Card className="overflow-hidden border-slate-200 hover:shadow-md transition-shadow">
      <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bus size={18} className="text-[#F37021]" />
          <span className="font-bold text-sm">
            {ticket.routeId?.routeName || 'UIU Route'}
          </span>
        </div>
        <Badge
          className={
            ticket.status === 'CONFIRMED' && !isPast
              ? 'bg-[#10B981] text-white'
              : ticket.status === 'CANCELLED'
              ? 'bg-red-500 text-white'
              : 'bg-slate-600 text-white'
          }
        >
          {ticket.status === 'CONFIRMED' && isPast ? 'EXPIRED' : ticket.status}
        </Badge>
      </div>

      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-slate-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
              {formatDateShort(new Date(ticket.travelDate))}
            </span>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Seat #{ticket.seatNumber}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs mb-4">
          <div>
            <span className="text-slate-400 uppercase font-medium">Student Name</span>
            <p className="font-semibold text-slate-700 dark:text-slate-100 mt-0.5 truncate">{ticket.studentName}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-medium">Student ID</span>
            <p className="font-semibold text-slate-700 dark:text-slate-100 font-mono mt-0.5 truncate">{ticket.studentId}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-medium">Bus No</span>
            <p className="font-semibold text-slate-700 dark:text-slate-100 font-mono mt-0.5">{ticket.busNumber}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-medium">Trip Type</span>
            <p className="font-semibold text-[#F37021] mt-0.5">
              Round Trip
            </p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-medium">Boarding</span>
            <p className="font-semibold text-slate-700 dark:text-slate-100 mt-0.5 truncate">{ticket.boardingStop}</p>
          </div>
          <div>
            <span className="text-slate-400 uppercase font-medium">Ticket ID</span>
            <p className="font-semibold text-slate-700 dark:text-slate-100 font-mono mt-0.5 truncate">{ticket.ticketId}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-[#1E3A5F] dark:text-sky-300">৳{ticket.price}</span>
          <Button size="sm" variant="outline" className="text-xs gap-1 border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
            <Link href={`/dashboard/tickets/${ticket.ticketId}`}>
              View Ticket <ArrowRight size={12} />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
