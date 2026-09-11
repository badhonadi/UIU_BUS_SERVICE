'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { isBookingAllowed, cn } from '@/lib/utils';

interface DatePickerProps {
  selectedDate?: Date;
  onSelectDate: (date: Date) => void;
}

export function DatePicker({ selectedDate, onSelectDate }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const disabledDays = (date: Date) => {
    return !isBookingAllowed(date);
  };

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-12 border-slate-200',
                !selectedDate && 'text-muted-foreground'
              )}
            />
          }
        >
            <CalendarIcon className="mr-2 h-4 w-4 text-[#F37021]" />
            {selectedDate ? (
              format(selectedDate, 'EEEE, MMMM d, yyyy')
            ) : (
              <span>Select travel date...</span>
            )}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date && isBookingAllowed(date)) {
                onSelectDate(date);
                setOpen(false);
              }
            }}
            disabled={disabledDays}
          />
        </PopoverContent>
      </Popover>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Booking Policy:</span> Tickets are sold for next-day trips onward. No bus service on <strong>Thursday & Friday</strong>. Booking deadline is <strong>11:59 PM</strong> of the previous day.
        </div>
      </div>
    </div>
  );
}
