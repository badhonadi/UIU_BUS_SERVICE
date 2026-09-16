import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { DAYS_OFF } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isThursdayOrFriday(date: Date): boolean {
  const day = date.getDay();
  return DAYS_OFF.includes(day);
}

export function isBookingAllowed(travelDate: Date): boolean {
  // Get the start of travel date (midnight)
  const travelDateStart = new Date(travelDate);
  travelDateStart.setHours(0, 0, 0, 0);

  // Cannot book for Thursday or Friday
  if (isThursdayOrFriday(travelDate)) {
    return false;
  }

  // Cannot book for past dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (travelDateStart < today) {
    return false;
  }

  // Cannot book for today (after midnight of that day)
  if (travelDateStart.getTime() === today.getTime()) {
    return false;
  }

  return true;
}

export function isTravelDateExpired(travelDate: Date): boolean {
  const travelDateEnd = new Date(travelDate);
  travelDateEnd.setHours(23, 59, 59, 999);
  return new Date() > travelDateEnd;
}

export function getNextBookableDates(count: number = 14): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentDate = new Date(today);
  currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

  while (dates.length < count) {
    if (!isThursdayOrFriday(currentDate)) {
      dates.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function generateTicketId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RW-${timestamp}-${random}`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-BD', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateShort(date: Date): string {
  return new Intl.DateTimeFormat('en-BD', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function getDayName(date: Date): string {
  return new Intl.DateTimeFormat('en-BD', { weekday: 'long' }).format(new Date(date));
}

export function getBusNumber(routeCode: string, index: number): string {
  const paddedIndex = String(index).padStart(3, '0');
  return `UIU_${routeCode}_${paddedIndex}`;
}
