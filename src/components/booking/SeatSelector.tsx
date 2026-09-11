'use client';

import React, { useState } from 'react';
import { Armchair, Check, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SeatSelectorProps {
  bookedSeatNumbers: number[];
  selectedSeat: number | null;
  onSelectSeat: (seatNumber: number) => void;
}

interface SeatItem {
  number: number;
  label: string;
  zone: 1 | 2 | 3;
  isReservedPriority: boolean;
  positionLabel: string;
}

// Build 50 seats:
// Front row:
//   - Left: Driver
//   - Middle: Engine
//   - Right: 2 seats (Seat#01, Seat#02)
// Behind front row: 12 rows of 2*2 formation (48 seats: Seat#03 to Seat#50)
// Total = 50 seats!
const FRONT_SEATS: SeatItem[] = [
  {
    number: 1,
    label: 'Seat#01',
    zone: 1,
    isReservedPriority: true,
    positionLabel: 'Front Right (Aisle)',
  },
  {
    number: 2,
    label: 'Seat#02',
    zone: 1,
    isReservedPriority: true,
    positionLabel: 'Front Right (Window)',
  },
];

interface SeatRow {
  rowNumber: number;
  zone: 1 | 2 | 3;
  leftSeats: [SeatItem, SeatItem]; // [Window, Aisle]
  rightSeats: [SeatItem, SeatItem]; // [Aisle, Window]
}

const ROWS: SeatRow[] = Array.from({ length: 12 }, (_, i) => {
  const rowNum = i + 1;
  const startNum = 3 + i * 4;
  // Zone determination matching the uploaded diagram:
  // Zone 1: Front rows (rows 1-2, seats 3-10) -> Priority (women, children, disabled)
  // Zone 2: Middle rows (rows 3-7, seats 11-30) -> General
  // Zone 3: Rear rows (rows 8-12, seats 31-50) -> Rear
  const zone: 1 | 2 | 3 = rowNum <= 2 ? 1 : rowNum <= 7 ? 2 : 3;
  const isPriority = zone === 1;

  const leftWindow: SeatItem = {
    number: startNum,
    label: `Seat#${String(startNum).padStart(2, '0')}`,
    zone,
    isReservedPriority: isPriority,
    positionLabel: `Row ${rowNum} Left (Window)`,
  };
  const leftAisle: SeatItem = {
    number: startNum + 1,
    label: `Seat#${String(startNum + 1).padStart(2, '0')}`,
    zone,
    isReservedPriority: isPriority,
    positionLabel: `Row ${rowNum} Left (Aisle)`,
  };
  const rightAisle: SeatItem = {
    number: startNum + 2,
    label: `Seat#${String(startNum + 2).padStart(2, '0')}`,
    zone,
    isReservedPriority: isPriority,
    positionLabel: `Row ${rowNum} Right (Aisle)`,
  };
  const rightWindow: SeatItem = {
    number: startNum + 3,
    label: `Seat#${String(startNum + 3).padStart(2, '0')}`,
    zone,
    isReservedPriority: isPriority,
    positionLabel: `Row ${rowNum} Right (Window)`,
  };

  return {
    rowNumber: rowNum,
    zone,
    leftSeats: [leftWindow, leftAisle],
    rightSeats: [rightAisle, rightWindow],
  };
});

export function SeatSelector({
  bookedSeatNumbers,
  selectedSeat,
  onSelectSeat,
}: SeatSelectorProps) {
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [lastAttemptedBookedSeat, setLastAttemptedBookedSeat] = useState<number | null>(null);

  const isBooked = (seatNum: number) => bookedSeatNumbers.includes(seatNum);

  const handleSeatClick = (seat: SeatItem) => {
    if (isBooked(seat.number)) {
      setLastAttemptedBookedSeat(seat.number);
      setTimeout(() => setLastAttemptedBookedSeat(null), 3500);
      return;
    }
    setLastAttemptedBookedSeat(null);
    onSelectSeat(seat.number);
  };

  const renderSeat = (seat: SeatItem, compact = false) => {
    const booked = isBooked(seat.number);
    const selected = selectedSeat === seat.number;
    const isHovered = hoveredSeat === seat.number;

    return (
      <div
        key={seat.number}
        className="relative group flex flex-col items-center"
        onMouseEnter={() => setHoveredSeat(seat.number)}
        onMouseLeave={() => setHoveredSeat(null)}
      >
        <button
          type="button"
          disabled={booked}
          onClick={() => handleSeatClick(seat)}
          aria-label={booked ? `${seat.label} is booked` : `Select ${seat.label}`}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-xl border font-bold transition-all select-none',
            compact ? 'w-11 h-11 text-xs' : 'w-12 h-12 text-xs md:w-14 md:h-14 md:text-sm',
            booked && [
              'bg-slate-200/90 border-slate-300 text-slate-400 cursor-not-allowed',
              'filter blur-[0.8px] opacity-75',
            ],
            selected && !booked && [
              'bg-[#F37021] border-[#d4580f] text-white shadow-lg shadow-[#F37021]/30 scale-105 z-10',
              'ring-2 ring-[#F37021] ring-offset-2',
            ],
            !selected && !booked && [
              'bg-emerald-50/90 border-emerald-300 text-emerald-900',
              'hover:bg-emerald-100 hover:border-emerald-500 hover:scale-105 active:scale-95 shadow-sm',
            ]
          )}
        >
          {/* Priority yellow circle dot (matching uploaded picture) */}
          {seat.isReservedPriority && !booked && (
            <span
              title="Reserved priority seat"
              className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 ring-1 ring-white"
            />
          )}

          {/* Seat Icon / Number */}
          {booked ? (
            <Lock className="w-3.5 h-3.5 text-slate-500" />
          ) : selected ? (
            <Check className="w-4 h-4 text-white stroke-[3]" />
          ) : (
            <Armchair className="w-4 h-4 text-emerald-700 opacity-60 mb-0.5" />
          )}

          <span className="leading-none text-[11px] md:text-xs">
            {String(seat.number).padStart(2, '0')}
          </span>
        </button>

        {/* Hover / Click Tooltip */}
        {booked ? (
          <div
            className={cn(
              'absolute -top-9 z-30 pointer-events-none transition-all duration-150',
              isHovered || lastAttemptedBookedSeat === seat.number
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-95'
            )}
          >
            <div className="bg-red-600 text-white font-extrabold text-[10px] tracking-wider px-2 py-1 rounded shadow-lg uppercase whitespace-nowrap flex items-center gap-1 border border-red-700">
              <Lock className="w-2.5 h-2.5" />
              BOOKED
            </div>
          </div>
        ) : (
          <div
            className={cn(
              'absolute -top-8 z-30 pointer-events-none transition-all duration-150',
              isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
            )}
          >
            <div className="bg-slate-900 text-white font-semibold text-[10px] px-2 py-0.5 rounded shadow whitespace-nowrap">
              {seat.label}
              {seat.isReservedPriority ? ' • Priority' : ''}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Legend & Layout Toggle */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Legend Title */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Seat Map</span>
            <span className="text-xs text-slate-400">• Total 50 Seats</span>
          </div>

          {/* View Mode Toggle: Vertical vs Horizontal */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm text-xs">
            <button
              type="button"
              onClick={() => setViewMode('vertical')}
              className={cn(
                'px-3 py-1 rounded-md font-medium transition-all',
                viewMode === 'vertical'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              ↕ Walk-In View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('horizontal')}
              className={cn(
                'px-3 py-1 rounded-md font-medium transition-all',
                viewMode === 'horizontal'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              ↔ Diagram View
            </button>
          </div>
        </div>

        {/* Legend items */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-700 pt-1 border-t border-slate-200/60">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 border border-amber-500" />
            <span className="text-slate-600">Reserved (Women/Disabled)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-emerald-50 border border-emerald-400" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-[#F37021] text-white flex items-center justify-center text-[9px] font-bold">✓</div>
            <span className="font-semibold text-slate-900">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300 filter blur-[0.6px] flex items-center justify-center text-[8px] font-bold text-red-600">
              <Lock className="w-2.5 h-2.5 text-slate-500" />
            </div>
            <span className="text-slate-500">Booked (Hover to see BOOKED)</span>
          </div>
        </div>

        {/* Zone description matching user image */}
        <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-500 border-t border-dashed border-slate-200">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300" />
            <span>Zone 1: Front & Priority</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-100 border border-emerald-300" />
            <span>Zone 2: General Passenger</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-rose-100 border border-rose-300" />
            <span>Zone 3: Rear Passenger</span>
          </div>
        </div>
      </div>

      {/* Booked Seat Warning Banner when user tries clicking a booked seat */}
      {lastAttemptedBookedSeat !== null && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg flex items-center justify-between text-xs text-red-700 animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>
              <strong>Seat#{String(lastAttemptedBookedSeat).padStart(2, '0')}</strong> is already{' '}
              <strong className="text-red-800 uppercase tracking-wide">BOOKED</strong>. Please select an available green seat.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLastAttemptedBookedSeat(null)}
            className="text-red-600 font-bold ml-2 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Selected Seat Feedback Pill */}
      {selectedSeat && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs md:text-sm text-orange-950">
            <Check className="w-4 h-4 text-[#F37021] font-bold" />
            <span>You selected:</span>
            <span className="font-extrabold text-[#F37021] text-sm md:text-base">
              Seat#{String(selectedSeat).padStart(2, '0')}
            </span>
          </div>
          <span className="text-[11px] text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-md font-medium">
            {selectedSeat <= 2
              ? 'Front Row (Right)'
              : `Row ${Math.ceil((selectedSeat - 2) / 4)}`}
          </span>
        </div>
      )}

      {/* VIEW 1: VERTICAL BUS (Walk-in View)
          Driver on LEFT, Engine in MIDDLE, 2 Seats on RIGHT */}
      {viewMode === 'vertical' && (
        <div className="relative mx-auto max-w-md bg-white border-2 border-slate-300 rounded-[38px] p-4 md:p-6 shadow-xl">
          {/* Front Windshield / Headlights */}
          <div className="relative -mx-2 -mt-2 mb-4 bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-[30px] p-3 text-center text-white border-b-4 border-slate-700 shadow-inner">
            <div className="flex items-center justify-between px-3 text-[10px] text-slate-300">
              <span className="w-2.5 h-1.5 rounded-full bg-amber-300 shadow-sm shadow-amber-300" />
              <span className="font-bold tracking-widest uppercase">UIU Shuttle Bus • Front</span>
              <span className="w-2.5 h-1.5 rounded-full bg-amber-300 shadow-sm shadow-amber-300" />
            </div>
            <div className="mt-1 h-1 w-20 mx-auto bg-slate-600 rounded-full" />
          </div>

          {/* FRONT CABIN ROW:
              - Left: Driver seat
              - Middle: Engine box
              - Right: 2 passenger seats (Seat#01, Seat#02) + Entrance door */}
          <div className="bg-slate-100/90 rounded-2xl p-3 mb-4 border border-slate-200">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Driver & Engine Cabin</span>
              <span className="text-slate-500 font-semibold">Entrance Side →</span>
            </div>

            <div className="grid grid-cols-5 items-center gap-2">
              {/* DRIVER (LEFT SIDE) */}
              <div className="col-span-1 flex flex-col items-center justify-center">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 flex flex-col items-center justify-center shadow-md">
                  <span className="text-base leading-none">🛞</span>
                  <span className="text-[9px] font-bold tracking-tight text-white mt-1">Driver</span>
                </div>
              </div>

              {/* ENGINE (IN THE MIDDLE) */}
              <div className="col-span-2 flex flex-col items-center justify-center">
                <div className="w-full h-12 md:h-14 rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-slate-200 border border-slate-600 flex flex-col items-center justify-center px-1 shadow-inner">
                  <div className="flex items-center gap-1 text-[10px] font-extrabold tracking-wider uppercase text-amber-300">
                    <span>⚙️</span>
                    <span>ENGINE</span>
                  </div>
                  <div className="w-3/4 flex flex-col gap-0.5 mt-1">
                    <span className="h-0.5 bg-slate-600 rounded-full" />
                    <span className="h-0.5 bg-slate-600 rounded-full" />
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: 2 PASSENGER SEATS (Seat#01, Seat#02) */}
              <div className="col-span-2 flex items-center justify-end gap-2">
                {FRONT_SEATS.map((seat) => renderSeat(seat))}
              </div>
            </div>

            {/* Entrance Door Label */}
            <div className="mt-2 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
              <span className="text-[10px] text-slate-400">Zone 1 (Priority)</span>
              <div className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                <span>🚪</span>
                <span>Bus Entrance Door</span>
                <span>⬆</span>
              </div>
            </div>
          </div>

          {/* AISLE DIRECTION HEADER */}
          <div className="grid grid-cols-5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 text-center">
            <span className="col-span-2">← Left (Window & Aisle)</span>
            <span className="col-span-1 text-slate-400">Aisle</span>
            <span className="col-span-2">Right (Aisle & Window) →</span>
          </div>

          {/* MAIN 2*2 ROWS (48 SEATS: Seat#03 to Seat#50) */}
          <div className="space-y-2">
            {ROWS.map((row) => {
              const zoneBg =
                row.zone === 1
                  ? 'bg-slate-50 border-slate-200/70'
                  : row.zone === 2
                  ? 'bg-emerald-50/40 border-emerald-200/50'
                  : 'bg-rose-50/40 border-rose-200/50';

              return (
                <div
                  key={row.rowNumber}
                  className={cn(
                    'rounded-xl p-1.5 border transition-colors',
                    zoneBg
                  )}
                >
                  <div className="grid grid-cols-5 items-center gap-2">
                    {/* Left 2 seats */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      {renderSeat(row.leftSeats[0])}
                      {renderSeat(row.leftSeats[1])}
                    </div>

                    {/* Center Aisle with row number */}
                    <div className="col-span-1 flex flex-col items-center justify-center">
                      <span className="w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-400 text-[10px] font-bold flex items-center justify-center shadow-2xs">
                        {row.rowNumber}
                      </span>
                    </div>

                    {/* Right 2 seats */}
                    <div className="col-span-2 flex items-center justify-center gap-2">
                      {renderSeat(row.rightSeats[0])}
                      {renderSeat(row.rightSeats[1])}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* BUS REAR */}
          <div className="mt-4 -mx-2 -mb-2 bg-slate-800 text-slate-300 rounded-b-[30px] p-2 text-center text-[10px] font-semibold border-t-2 border-slate-700 flex items-center justify-between px-4">
            <span className="w-2.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
            <span>Rear of Bus • Back Wall</span>
            <span className="w-2.5 h-1.5 rounded-full bg-red-500 shadow-sm shadow-red-500" />
          </div>
        </div>
      )}

      {/* VIEW 2: HORIZONTAL BUS (Diagram View)
          Matches uploaded picture orientation */}
      {viewMode === 'horizontal' && (
        <div className="w-full overflow-x-auto pb-4">
          <div className="min-w-[820px] bg-white border-2 border-slate-300 rounded-[28px] p-4 shadow-xl">
            <div className="flex items-stretch gap-2">
              {/* BUS FRONT (LEFT END) */}
              <div className="w-24 bg-slate-800 text-white rounded-l-2xl p-2 flex flex-col justify-between items-center text-center shrink-0 border-r-2 border-slate-700">
                <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase">FRONT</span>
                <div className="text-xl">🚌</div>
                <div className="text-[9px] text-slate-400 leading-tight">UIU Bus</div>
              </div>

              {/* ZONE 1 (CABIN & FRONT ROWS) */}
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-2.5 shrink-0 flex flex-col justify-between">
                <div className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wide mb-1 flex items-center justify-between">
                  <span>Zone 1: Front / Priority</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>

                <div className="flex gap-3">
                  {/* Column 0: Driver (top/left), Engine (mid), 2 Seats + Entrance (bottom/right) */}
                  <div className="flex flex-col justify-between gap-2">
                    {/* Top: Driver */}
                    <div className="w-12 h-12 rounded-xl bg-slate-800 text-amber-400 border border-slate-700 flex flex-col items-center justify-center shadow">
                      <span className="text-sm">🛞</span>
                      <span className="text-[8px] font-bold text-white">Driver</span>
                    </div>

                    {/* Middle: Engine */}
                    <div className="w-12 h-10 rounded-lg bg-slate-700 text-amber-300 border border-slate-600 flex flex-col items-center justify-center shadow-inner">
                      <span className="text-[9px] font-extrabold uppercase">Engine</span>
                    </div>

                    {/* Bottom: 2 Seats + Entrance */}
                    <div className="flex flex-col gap-1 items-center">
                      <div className="flex gap-1">
                        {renderSeat(FRONT_SEATS[0], true)}
                        {renderSeat(FRONT_SEATS[1], true)}
                      </div>
                      <div className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        ⬆ Entrance
                      </div>
                    </div>
                  </div>

                  {/* Rows 1 & 2 in Zone 1 */}
                  {ROWS.slice(0, 2).map((row) => (
                    <div key={row.rowNumber} className="flex flex-col justify-between gap-1">
                      {/* Top 2 seats */}
                      <div className="flex flex-col gap-1">
                        {renderSeat(row.leftSeats[0], true)}
                        {renderSeat(row.leftSeats[1], true)}
                      </div>

                      {/* Middle: Aisle */}
                      <div className="h-6 flex items-center justify-center text-[10px] text-slate-400 font-bold">
                        R{row.rowNumber}
                      </div>

                      {/* Bottom 2 seats */}
                      <div className="flex flex-col gap-1">
                        {renderSeat(row.rightSeats[0], true)}
                        {renderSeat(row.rightSeats[1], true)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ZONE 2 (MIDDLE ROWS: 3 to 7) */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-2.5 shrink-0 flex flex-col justify-between">
                <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide mb-1 flex items-center justify-between">
                  <span>Zone 2: General</span>
                  <span className="text-[9px] font-normal text-emerald-600">Rows 3–7</span>
                </div>

                <div className="flex gap-2.5">
                  {ROWS.slice(2, 7).map((row) => (
                    <div key={row.rowNumber} className="flex flex-col justify-between gap-1">
                      <div className="flex flex-col gap-1">
                        {renderSeat(row.leftSeats[0], true)}
                        {renderSeat(row.leftSeats[1], true)}
                      </div>

                      <div className="h-6 flex items-center justify-center text-[10px] text-emerald-700/60 font-bold">
                        R{row.rowNumber}
                      </div>

                      <div className="flex flex-col gap-1">
                        {renderSeat(row.rightSeats[0], true)}
                        {renderSeat(row.rightSeats[1], true)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ZONE 3 (REAR ROWS: 8 to 12) */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-2.5 shrink-0 flex flex-col justify-between">
                <div className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wide mb-1 flex items-center justify-between">
                  <span>Zone 3: Rear</span>
                  <span className="text-[9px] font-normal text-rose-600">Rows 8–12</span>
                </div>

                <div className="flex gap-2.5">
                  {ROWS.slice(7, 12).map((row) => (
                    <div key={row.rowNumber} className="flex flex-col justify-between gap-1">
                      <div className="flex flex-col gap-1">
                        {renderSeat(row.leftSeats[0], true)}
                        {renderSeat(row.leftSeats[1], true)}
                      </div>

                      <div className="h-6 flex items-center justify-center text-[10px] text-rose-700/60 font-bold">
                        R{row.rowNumber}
                      </div>

                      <div className="flex flex-col gap-1">
                        {renderSeat(row.rightSeats[0], true)}
                        {renderSeat(row.rightSeats[1], true)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BUS REAR (RIGHT END) */}
              <div className="w-12 bg-slate-800 text-white rounded-r-2xl p-2 flex flex-col justify-between items-center text-center shrink-0 border-l-2 border-slate-700">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[9px] font-bold uppercase tracking-widest -rotate-90">REAR</span>
                <span className="w-2 h-2 rounded-full bg-red-500" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
