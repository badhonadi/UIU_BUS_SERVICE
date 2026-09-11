'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RouteCard } from '@/components/booking/RouteCard';
import { DatePicker } from '@/components/booking/DatePicker';
import { StopSelector } from '@/components/booking/StopSelector';
import { SeatSelector } from '@/components/booking/SeatSelector';
import { PaymentForm } from '@/components/booking/PaymentForm';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ArrowLeft, ArrowRight, Check, Loader2, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { TICKET_PRICE } from '@/lib/constants';

export default function BookTicketPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);

  // Form states
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [travelDate, setTravelDate] = useState<Date | undefined>(undefined);
  const [direction, setDirection] = useState<'TO_UIU' | 'FROM_UIU'>('TO_UIU');
  const [boardingStop, setBoardingStop] = useState<string>('');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('BKASH');

  // Availability state
  const [availability, setAvailability] = useState<any | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Booking result state
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [bookedTicket, setBookedTicket] = useState<any | null>(null);

  // Fetch routes
  useEffect(() => {
    async function fetchRoutes() {
      try {
        const res = await fetch('/api/routes');
        if (res.ok) {
          const data = await res.json();
          setRoutes(data.routes || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRoutes(false);
      }
    }
    fetchRoutes();
  }, []);

  // Check availability when route and date are selected
  useEffect(() => {
    if (selectedRoute && travelDate) {
      async function checkSeats() {
        setCheckingAvailability(true);
        try {
          const dateStr = format(travelDate!, 'yyyy-MM-dd');
          const res = await fetch(`/api/routes/${selectedRoute._id}/availability?date=${dateStr}`);
          if (res.ok) {
            const data = await res.json();
            setAvailability(data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setCheckingAvailability(false);
        }
      }
      checkSeats();
    }
  }, [selectedRoute, travelDate]);

  const handleBooking = async () => {
    if (!selectedRoute || !travelDate || !boardingStop || !paymentMethod) return;

    setIsProcessing(true);
    setError('');

    try {
      // 1. Process simulated payment
      const payRes = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          amount: TICKET_PRICE,
          ticketId: `REQ-${Date.now()}`,
        }),
      });

      if (!payRes.ok) {
        throw new Error('Payment processing failed. Please try again.');
      }

      // 2. Create Ticket
      const dateStr = format(travelDate, 'yyyy-MM-dd');
      const ticketRes = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: selectedRoute._id,
          travelDate: dateStr,
          direction,
          boardingStop,
          paymentMethod,
          ...(selectedSeat ? { seatNumber: selectedSeat } : {}),
        }),
      });

      const ticketData = await ticketRes.json();

      if (!ticketRes.ok) {
        setError(ticketData.error || 'Failed to book ticket');
        return;
      }

      setBookedTicket(ticketData.ticket);
      setStep(5); // Success step
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 5 && bookedTicket) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card
          className="relative border-0 shadow-2xl overflow-hidden text-center bg-white bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/bus-background.png')",
            backgroundSize: '80% auto',
          }}
        >
          <div className="absolute inset-0 z-0 bg-white/90" aria-hidden="true" />
          <div className="relative z-10 bg-gradient-to-r from-[#10B981] to-emerald-600 text-white p-8">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check size={36} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold">Ticket Booked Successfully! 🎉</h1>
            <p className="text-white/80 text-sm mt-1">Ticket ID: {bookedTicket.ticketId}</p>
          </div>
          <CardContent className="relative z-10 p-8 space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border text-left space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Route</span>
                <span className="font-bold text-slate-800">{bookedTicket.routeName}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Travel Date</span>
                <span className="font-bold text-slate-800">{bookedTicket.travelDate ? format(new Date(bookedTicket.travelDate), 'EEE, MMM d, yyyy') : ''}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Bus Number</span>
                <span className="font-mono font-bold text-slate-800">{bookedTicket.busNumber}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Seat Number</span>
                <span className="font-bold text-[#F37021]">Seat #{bookedTicket.seatNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Boarding Stop</span>
                <span className="font-bold text-slate-800">{bookedTicket.boardingStop}</span>
              </div>
            </div>

            {bookedTicket.qrCode && (
              <div className="text-center space-y-2">
                <img src={bookedTicket.qrCode} alt="QR Code" className="w-44 h-44 mx-auto border p-2 rounded-xl" />
                <p className="text-xs text-slate-400">Show this QR code to the bus helper during boarding</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={() => router.push(`/dashboard/tickets/${bookedTicket.ticketId}`)}
                className="flex-1 bg-[#F37021] hover:bg-[#E85D0A] h-12 text-white font-semibold"
              >
                View Full Ticket & PDF
              </Button>
              <Button
                onClick={() => {
                  setStep(1);
                  setSelectedRoute(null);
                  setTravelDate(undefined);
                  setBookedTicket(null);
                  setBoardingStop('');
                  setSelectedSeat(null);
                  setAvailability(null);
                }}
                variant="outline"
                className="h-12 border-slate-300"
              >
                Book Another Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Book Bus Ticket</h1>
        <p className="text-slate-500 text-sm mt-1">Select your route, date, and payment method</p>
      </div>

      {/* Stepper Progress */}
      <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        {[
          { num: 1, label: 'Select Route' },
          { num: 2, label: 'Date & Direction' },
          { num: 3, label: 'Stop & Seat' },
          { num: 4, label: 'Payment' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step === s.num
                  ? 'bg-[#F37021] text-white shadow-md'
                  : step > s.num
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {step > s.num ? <Check size={14} /> : s.num}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? 'text-slate-900' : 'text-slate-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Step 1: Select Route */}
      {step === 1 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">Step 1: Choose Bus Route</CardTitle>
            <CardDescription>Select your starting area or target route</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingRoutes ? (
              <LoadingSpinner size="lg" className="py-12" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {routes.map((route) => (
                  <RouteCard
                    key={route._id}
                    route={route}
                    selected={selectedRoute?._id === route._id}
                    onSelect={() => setSelectedRoute(route)}
                  />
                ))}
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <Button
                disabled={!selectedRoute}
                onClick={() => setStep(2)}
                className="bg-[#F37021] hover:bg-[#E85D0A] h-11 px-6 text-white font-semibold"
              >
                Next Step <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Date & Direction */}
      {step === 2 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">Step 2: Travel Date & Direction</CardTitle>
            <CardDescription>Selected Route: <span className="font-bold text-[#F37021]">{selectedRoute?.routeName}</span></CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Trip Direction</label>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  type="button"
                  variant={direction === 'TO_UIU' ? 'default' : 'outline'}
                  onClick={() => setDirection('TO_UIU')}
                  className={`h-14 font-bold text-sm ${
                    direction === 'TO_UIU' ? 'bg-[#1E3A5F] hover:bg-slate-800 text-white' : 'border-slate-300'
                  }`}
                >
                  🚌 Towards UIU Campus
                </Button>
                <Button
                  type="button"
                  variant={direction === 'FROM_UIU' ? 'default' : 'outline'}
                  onClick={() => setDirection('FROM_UIU')}
                  className={`h-14 font-bold text-sm ${
                    direction === 'FROM_UIU' ? 'bg-[#1E3A5F] hover:bg-slate-800 text-white' : 'border-slate-300'
                  }`}
                >
                  🏠 Return from UIU
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Select Travel Date</label>
              <DatePicker selectedDate={travelDate} onSelectDate={setTravelDate} />
            </div>

            {checkingAvailability && (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                <Loader2 size={14} className="animate-spin text-[#F37021]" /> Checking seat availability...
              </div>
            )}

            {availability && (
              <div className={`p-4 rounded-xl border text-sm font-medium ${
                availability.availableSeats > 0 ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {availability.availableSeats > 0
                  ? `Seats Available! ${availability.availableSeats} of ${availability.totalSeats} seats remaining for ${availability.date}.`
                  : `No tickets available for this route on ${availability.date}. Please select another date.`}
              </div>
            )}

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="h-11 border-slate-300">
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button
                disabled={!travelDate || (availability && availability.availableSeats <= 0)}
                onClick={() => setStep(3)}
                className="bg-[#F37021] hover:bg-[#E85D0A] h-11 px-6 text-white font-semibold"
              >
                Next Step <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Boarding Stop & Seat Selection */}
      {step === 3 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">Step 3: Boarding Stop & Seat</CardTitle>
            <CardDescription>
              Choose where you board and pick your seat on the bus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Boarding stop */}
            <StopSelector
              stops={selectedRoute?.stops || []}
              selectedStop={boardingStop}
              onSelectStop={setBoardingStop}
              direction={direction}
            />

            {/* Divider */}
            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                🪑 Choose Your Seat
                <span className="text-xs font-normal text-slate-400">
                  ({availability ? `${availability.availableSeats} of ${availability.totalSeats} available` : '50 seats'})
                </span>
              </p>
              <SeatSelector
                bookedSeatNumbers={availability?.bookedSeatNumbers ?? []}
                selectedSeat={selectedSeat}
                onSelectSeat={setSelectedSeat}
              />
            </div>

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="h-11 border-slate-300">
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button
                disabled={!boardingStop || !selectedSeat}
                onClick={() => setStep(4)}
                className="bg-[#F37021] hover:bg-[#E85D0A] h-11 px-6 text-white font-semibold"
              >
                Proceed to Payment <ArrowRight size={16} className="ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Payment */}
      {step === 4 && (
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl">Step 4: Payment & Confirmation</CardTitle>
            <CardDescription>Review trip details and complete payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="bg-slate-50 p-5 rounded-2xl border text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Route</span>
                <span className="font-bold text-slate-800">{selectedRoute?.routeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Travel Date</span>
                <span className="font-bold text-slate-800">{travelDate ? format(travelDate, 'EEE, MMM d, yyyy') : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Boarding Stop</span>
                <span className="font-bold text-slate-800">{boardingStop}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Seat Number</span>
                <span className="font-bold text-[#F37021]">
                  {selectedSeat ? `Seat#${String(selectedSeat).padStart(2, '0')}` : '—'}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="font-bold text-slate-800">Total Price</span>
                <span className="font-bold text-[#F37021] text-base">৳{TICKET_PRICE} BDT</span>
              </div>
            </div>

            <PaymentForm selectedMethod={paymentMethod} onSelectMethod={setPaymentMethod} />

            <div className="pt-4 flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="h-11 border-slate-300">
                <ArrowLeft size={16} className="mr-2" /> Back
              </Button>
              <Button
                disabled={isProcessing}
                onClick={handleBooking}
                className="bg-[#10B981] hover:bg-emerald-600 h-12 px-8 text-white font-bold text-base shadow-lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin mr-2" /> Processing Payment...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={18} className="mr-2" /> Pay ৳{TICKET_PRICE} & Book Ticket
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
