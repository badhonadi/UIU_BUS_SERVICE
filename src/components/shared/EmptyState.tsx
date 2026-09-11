'use client';

import { Bus, Ticket, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  type: 'tickets' | 'routes' | 'general';
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ type, title, description, actionLabel, actionHref }: EmptyStateProps) {
  const icons = {
    tickets: Ticket,
    routes: MapPin,
    general: Bus,
  };

  const Icon = icons[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-orange-50 rounded-full p-6 mb-4">
        <Icon size={48} className="text-[#F37021]" />
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-md mb-6">{description}</p>
      {actionLabel && actionHref && (
        <Button className="bg-[#F37021] hover:bg-[#E85D0A]">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      )}
    </div>
  );
}
