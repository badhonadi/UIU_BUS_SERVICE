'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ArrowLeft, Download, XCircle, Bus } from 'lucide-react';
import { format } from 'date-fns';

export default function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function fetchTicket() {
      try {
        const res = await fetch(`/api/tickets/${resolvedParams.ticketId}`);
        if (res.ok) {
          const data = await res.json();
          setTicket(data.ticket);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTicket();
  }, [resolvedParams.ticketId]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this ticket? Refund will be processed.')) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/tickets/${resolvedParams.ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (res.ok) {
        const data = await res.json();
        setTicket(data.ticket);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to cancel ticket');
      }
    } catch (err) {
      alert('Failed to cancel ticket');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!ticket) return;

    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();

    try {
      const backgroundResponse = await fetch('/bus-background.png');
      const backgroundBlob = await backgroundResponse.blob();
      const backgroundDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(backgroundBlob);
      });
      pdf.setGState(pdf.GState({ opacity: 0.12 }));
      pdf.addImage(backgroundDataUrl, 'PNG', 25, 84, 160, 120);
      pdf.setGState(pdf.GState({ opacity: 1 }));
    } catch (error) {
      console.error('Could not load ticket background image:', error);
    }

    pdf.setFillColor(243, 112, 33);
    pdf.rect(0, 0, pageWidth, 42, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('UIU RideWave', pageWidth / 2, 17, { align: 'center' });
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('United International University - Official E-Ticket', pageWidth / 2, 25, { align: 'center' });

    pdf.setTextColor(30, 58, 95);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(ticket.routeId?.routeName || 'UIU Route', pageWidth / 2, 58, { align: 'center' });
    pdf.setTextColor(243, 112, 33);
    pdf.setFontSize(11);
    pdf.text(ticket.direction === 'TO_UIU' ? 'Towards UIU Campus' : 'Return from UIU Campus', pageWidth / 2, 66, { align: 'center' });
    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(10);
    pdf.text(`Ticket ID: ${ticket.ticketId}`, pageWidth / 2, 75, { align: 'center' });

    pdf.setDrawColor(226, 232, 240);
    pdf.line(20, 82, pageWidth - 20, 82);
    pdf.setFontSize(10);
    const details = [
      ['Student Name', ticket.studentName],
      ['Student ID', ticket.studentId],
      ['Travel Date', format(new Date(ticket.travelDate), 'EEE, MMM d, yyyy')],
      ['Seat Number', `Seat #${ticket.seatNumber}`],
      ['Bus Number', ticket.busNumber],
      ['Boarding Stop', ticket.boardingStop],
      ['Fare Paid', `BDT ${ticket.price} (${ticket.paymentMethod})`],
      ['Status', ticket.paymentStatus],
    ];
    details.forEach(([label, value], index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = column === 0 ? 25 : 115;
      const y = 94 + row * 18;
      pdf.setTextColor(148, 163, 184);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.text(label.toUpperCase(), x, y);
      pdf.setTextColor(30, 41, 59);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text(String(value), x, y + 6);
    });

    if (ticket.qrCode) {
      pdf.addImage(ticket.qrCode, 'PNG', pageWidth / 2 - 32, 178, 64, 64);
      pdf.setTextColor(148, 163, 184);
      pdf.setFontSize(9);
      pdf.text('Scan this QR code upon boarding the bus', pageWidth / 2, 248, { align: 'center' });
    }

    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(9);
    pdf.text('This ticket is valid only for the specified date and route.', pageWidth / 2, 270, { align: 'center' });
    pdf.save(`UIU-RideWave-${ticket.ticketId}.pdf`);
  };

  if (loading) return <LoadingSpinner size="lg" className="py-24" />;

  if (!ticket) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-2xl font-bold">Ticket Not Found</h2>
        <Button onClick={() => router.push('/dashboard/tickets')} className="mt-4 bg-[#F37021]">
          Back to My Tickets
        </Button>
      </div>
    );
  }

  const isPast = new Date(ticket.travelDate) < new Date();

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/dashboard/tickets')} className="gap-2">
          <ArrowLeft size={16} /> Back to Tickets
        </Button>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} size="sm" className="gap-1 border-slate-300">
            <Download size={14} /> Download PDF
          </Button>
        </div>
      </div>

      {/* Printable Ticket Card */}
      <Card
        className="relative border-0 shadow-2xl overflow-hidden rounded-3xl bg-white bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bus-background.png')",
          backgroundSize: '80% auto',
        }}
      >
        <div className="absolute inset-0 bg-white/90" aria-hidden="true" />
        <div className="bg-gradient-to-r from-[#F37021] to-[#E85D0A] text-white p-6 text-center relative">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Bus size={24} />
            <span className="font-black text-2xl tracking-tight">UIU RideWave</span>
          </div>
          <p className="text-xs opacity-90">United International University • Official E-Ticket</p>

          <div className="absolute top-4 right-4">
            <Badge className={ticket.status === 'CONFIRMED' && !isPast ? 'bg-[#10B981] text-white' : 'bg-red-500 text-white'}>
              {ticket.status}
            </Badge>
          </div>
        </div>

        <CardContent className="relative p-8 space-y-6">
          <div className="text-center border-b pb-4">
            <h2 className="text-2xl font-extrabold text-[#1E3A5F]">{ticket.routeId?.routeName || 'UIU Route'}</h2>
            <p className="text-sm font-semibold text-[#F37021] mt-0.5">
              {ticket.direction === 'TO_UIU' ? 'Towards UIU Campus' : 'Return from UIU Campus'}
            </p>
            <div className="mt-2 inline-block bg-slate-100 px-4 py-1 rounded-full text-xs font-mono font-bold text-slate-700">
              Ticket ID: {ticket.ticketId}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-xl bg-orange-50 border border-orange-100 p-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Student Name</span>
              <p className="font-bold text-slate-800 truncate">{ticket.studentName}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Student ID</span>
              <p className="font-bold text-slate-800 font-mono truncate">{ticket.studentId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Travel Date</span>
              <p className="font-bold text-slate-800">{format(new Date(ticket.travelDate), 'EEE, MMM d, yyyy')}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Seat Number</span>
              <p className="font-bold text-[#F37021] text-lg">Seat #{ticket.seatNumber}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Bus Number</span>
              <p className="font-mono font-bold text-slate-800">{ticket.busNumber}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Boarding Stop</span>
              <p className="font-bold text-slate-800 truncate">{ticket.boardingStop}</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Fare Paid</span>
              <p className="font-bold text-[#10B981]">৳{ticket.price} BDT ({ticket.paymentMethod})</p>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase">Status</span>
              <p className="font-bold text-slate-800">{ticket.paymentStatus}</p>
            </div>
          </div>

          {/* QR Code Section */}
          {ticket.qrCode && (
            <div className="border-t pt-6 text-center space-y-2">
              <img src={ticket.qrCode} alt="QR Code" className="w-48 h-48 mx-auto border-2 border-slate-100 p-2 rounded-2xl" />
              <p className="text-xs text-slate-400">Scan this QR code upon boarding the bus</p>
            </div>
          )}

          {/* Cancel button if applicable */}
          {ticket.status === 'CONFIRMED' && !isPast && (
            <div className="border-t pt-6 flex justify-center">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={cancelling}
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs"
              >
                <XCircle size={14} className="mr-1.5" />
                {cancelling ? 'Cancelling...' : 'Cancel Ticket & Refund'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
