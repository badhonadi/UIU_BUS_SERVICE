'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/shared/Logo';
import { Footer } from '@/components/layout/Footer';
import { ROUTE_DATA, TICKET_PRICE } from '@/lib/constants';
import { Bus, MapPin, ArrowRight, Users, CreditCard } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-slate-600">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button className="bg-[#F37021] hover:bg-[#E85D0A] text-white">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/60 via-slate-50 to-slate-50 pt-16 pb-20">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <Badge className="mb-4 bg-orange-100 text-[#F37021] hover:bg-orange-100 px-4 py-1.5 text-sm font-semibold rounded-full border border-orange-200">
            🎓 Official AC Bus Service for UIU Students
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Your Daily Ride to UIU, <br />
            <span className="bg-gradient-to-r from-[#F37021] to-[#E85D0A] bg-clip-text text-transparent">
              One Tap Away
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Convenient daily e-ticketing for all 6 AC bus routes connecting Dhaka to United International University. Safe, punctual, and hassle-free.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto h-13 px-8 text-base bg-[#F37021] hover:bg-[#E85D0A] text-white font-semibold shadow-lg shadow-orange-500/20">
              <Link href="/signup" className="flex items-center">
                Book Your Ticket Now <ArrowRight size={18} className="ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-13 px-8 text-base border-slate-300">
              <Link href="/login">Student Login</Link>
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
            <div className="p-2">
              <div className="text-3xl font-extrabold text-[#F37021]">6</div>
              <div className="text-xs text-slate-500 font-medium uppercase mt-1">Bus Routes</div>
            </div>
            <div className="p-2">
              <div className="text-3xl font-extrabold text-[#1E3A5F]">18</div>
              <div className="text-xs text-slate-500 font-medium uppercase mt-1">AC Buses</div>
            </div>
            <div className="p-2">
              <div className="text-3xl font-extrabold text-[#10B981]">900</div>
              <div className="text-xs text-slate-500 font-medium uppercase mt-1">Seats Daily</div>
            </div>
            <div className="p-2">
              <div className="text-3xl font-extrabold text-slate-800">৳{TICKET_PRICE}</div>
              <div className="text-xs text-slate-500 font-medium uppercase mt-1">Flat Price</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features / How it works */}
      <section className="py-16 bg-white border-y border-slate-100">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-slate-900">How UIU RideWave Works</h2>
            <p className="text-slate-500 mt-2">Simple 3-step booking process for your daily commute</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
              <div className="w-14 h-14 bg-orange-100 text-[#F37021] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users size={28} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-800">1. Sign Up</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Register with your UIU student email and Student ID. Instant account creation.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
              <div className="w-14 h-14 bg-blue-100 text-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bus size={28} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-800">2. Pick Route & Date</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Choose from 6 routes across Dhaka. Book tickets for next-day trips up until 11:59 PM.
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100 text-center">
              <div className="w-14 h-14 bg-green-100 text-[#10B981] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard size={28} />
              </div>
              <h3 className="font-bold text-xl mb-2 text-slate-800">3. Pay & Get Ticket</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Pay ৳100 via bKash, Nagad, Rocket, Bank, or UCAM balance. Get instant QR ticket + PDF download.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Routes List */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <Badge className="bg-[#1E3A5F] text-white mb-2">Bus Fleet</Badge>
              <h2 className="text-3xl font-bold text-slate-900">Available Bus Routes</h2>
            </div>
            <p className="text-slate-500 text-sm max-w-md mt-2 md:mt-0">
              Connecting major Dhaka locations directly to UIU Campus, Madani Avenue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROUTE_DATA.map((route) => (
              <Card key={route.routeNumber} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="font-bold text-xs border-[#F37021] text-[#F37021]">
                      Route-0{route.routeNumber}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-500">{route.totalBuses} Bus ({route.totalSeats} seats)</span>
                  </div>
                  <h3 className="font-bold text-xl text-slate-800 mb-2">{route.routeName}</h3>
                  <div className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                    <MapPin size={14} className="text-slate-400" />
                    <span>{route.stops[0]} → ... → {route.stops[route.stops.length - 1]}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-600">
                    <p className="font-medium text-slate-700 mb-1">Stoppages:</p>
                    <p className="line-clamp-2 text-slate-500">{route.stops.join(', ')}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
