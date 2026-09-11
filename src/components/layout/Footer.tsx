'use client';

import { Logo } from '@/components/shared/Logo';
import { Bus, Mail, Phone, MapPin } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-[#1E3A5F] text-white mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white/10 rounded-xl p-2">
                <Bus size={24} className="text-[#F37021]" />
              </div>
              <div>
                <h3 className="font-bold text-xl">RideWave</h3>
                <p className="text-xs text-white/60">UIU Bus Service</p>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              Your daily ride, one tap away. Book AC bus tickets for all UIU routes across Dhaka.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-[#F37021]">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard/book" className="text-white/70 hover:text-white transition-colors">Book a Ticket</Link></li>
              <li><Link href="/dashboard/routes" className="text-white/70 hover:text-white transition-colors">View Routes</Link></li>
              <li><Link href="/dashboard/tickets" className="text-white/70 hover:text-white transition-colors">My Tickets</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-[#F37021]">Contact</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-white/70">
                <MapPin size={14} />
                United City, Madani Avenue, Badda, Dhaka 1212
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Phone size={14} />
                +880-2-4896-4479
              </li>
              <li className="flex items-center gap-2 text-white/70">
                <Mail size={14} />
                transport@uiu.ac.bd
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 text-center">
          <p className="text-sm text-white/50">
            © {new Date().getFullYear()} UIU RideWave. United International University. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
