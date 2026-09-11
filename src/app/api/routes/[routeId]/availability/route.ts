import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Route from '@/models/Route';
import Ticket from '@/models/Ticket';
import { memoryDb } from '@/lib/memory-db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const { routeId } = await params;
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const travelDate = new Date(dateStr);
    travelDate.setHours(0, 0, 0, 0);

    let isMongo = false;
    let route: any = null;
    let bookedTickets = 0;

    try {
      const conn = await connectToDatabase();
      if (conn && conn.connection && conn.connection.readyState === 1) {
        route = await Route.findById(routeId);
        if (route) {
          isMongo = true;
          const nextDay = new Date(travelDate);
          nextDay.setDate(nextDay.getDate() + 1);

          bookedTickets = await Ticket.countDocuments({
            routeId: route._id,
            travelDate: { $gte: travelDate, $lt: nextDay },
            status: { $ne: 'CANCELLED' },
          });
        }
      }
    } catch (err) {
      console.warn('MongoDB availability check failed, falling back to memory DB:', err);
    }

    if (!isMongo) {
      route = await memoryDb.getRouteById(routeId);
      if (!route) {
        return NextResponse.json(
          { error: 'Route not found' },
          { status: 404 }
        );
      }
      bookedTickets = await memoryDb.countBookedSeats(route._id, travelDate);
    }

    if (!route) {
      return NextResponse.json(
        { error: 'Route not found' },
        { status: 404 }
      );
    }

    const totalSeats = route.totalSeats || 50;
    const availableSeats = totalSeats - bookedTickets;

    // Get booked seat numbers for the seat map
    let bookedSeatNumbers: number[] = [];
    if (!isMongo) {
      bookedSeatNumbers = await memoryDb.getBookedSeatNumbers(route._id, travelDate);
    } else {
      const nextDay = new Date(travelDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const { default: Ticket } = await import('@/models/Ticket');
      const bookedTicketsData = await Ticket.find({
        routeId: route._id,
        travelDate: { $gte: travelDate, $lt: nextDay },
        status: { $ne: 'CANCELLED' },
      }).select('seatNumber');
      bookedSeatNumbers = bookedTicketsData.map((t: any) => t.seatNumber);
    }

    return NextResponse.json({
      routeId: route._id,
      routeName: route.routeName,
      totalSeats,
      bookedSeats: bookedTickets,
      availableSeats: Math.max(0, availableSeats),
      isAvailable: availableSeats > 0,
      date: dateStr,
      bookedSeatNumbers,
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
