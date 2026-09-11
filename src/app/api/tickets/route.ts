import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import Route from '@/models/Route';
import Bus from '@/models/Bus';
import { memoryDb } from '@/lib/memory-db';
import { bookingSchema } from '@/lib/validations';
import { isBookingAllowed, generateTicketId, getBusNumber } from '@/lib/utils';
import { generateQRCode } from '@/lib/ticket-generator';
import { TICKET_PRICE } from '@/lib/constants';

export const dynamic = 'force-dynamic';
const useMemoryDb = process.env.NODE_ENV !== 'production' && !process.env.MONGODB_URI;

async function getMongoConnection() {
  const conn = await connectToDatabase();
  if (!conn?.connection || conn.connection.readyState !== 1) {
    throw new Error('Ticket storage is unavailable. Please configure MONGODB_URI and try again.');
  }
  return conn;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    if (useMemoryDb) {
      const tickets = await memoryDb.getUserTickets(session.user.id, status || 'ALL');
      return NextResponse.json({
        tickets: tickets.map((ticket) => ({
          ...ticket,
          studentName: session.user.name,
          studentId: session.user.studentId,
        })),
      });
    }

    await getMongoConnection();
    const query: Record<string, string> = { userId: session.user.id };
    if (status && status !== 'ALL') query.status = status;

    const tickets = await Ticket.find(query)
      .populate('routeId', 'routeName routeCode routeNumber stops')
      .sort({ travelDate: -1 });
    return NextResponse.json({
      tickets: tickets.map((ticket) => ({
        ...ticket.toObject(),
        studentName: session.user.name,
        studentId: session.user.studentId,
      })),
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch tickets' },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const validationResult = bookingSchema.safeParse(await request.json());
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error.issues[0].message }, { status: 400 });
    }

    const { routeId, travelDate, direction, boardingStop, paymentMethod, seatNumber: chosenSeat } = validationResult.data;
    if (!isBookingAllowed(new Date(travelDate))) {
      return NextResponse.json(
        { error: 'Booking is not allowed for this date. Please check if the date is valid (not Thursday/Friday, not past, and not today).' },
        { status: 400 }
      );
    }

    if (useMemoryDb) {
      const route = await memoryDb.getRouteById(routeId);
      if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });

      const dateStart = new Date(travelDate);
      dateStart.setHours(0, 0, 0, 0);
      const bookedCount = await memoryDb.countBookedSeats(route._id, dateStart);
      if (bookedCount >= route.totalSeats) {
        return NextResponse.json({ error: 'No seats available for this route on the selected date' }, { status: 400 });
      }

      // Determine seat number: use chosen seat or auto-assign next available
      let seatNumber: number;
      if (chosenSeat) {
        // Validate the chosen seat is still free
        const isAlreadyBooked = await memoryDb.isSeatBooked(route._id, dateStart, chosenSeat);
        if (isAlreadyBooked) {
          return NextResponse.json(
            { error: `Seat #${String(chosenSeat).padStart(2, '0')} was just booked by someone else. Please choose another seat.` },
            { status: 409 }
          );
        }
        seatNumber = chosenSeat;
      } else {
        // Auto-assign: first available seat number not in bookedSeatNumbers
        const bookedNums = await memoryDb.getBookedSeatNumbers(route._id, dateStart);
        seatNumber = 1;
        while (bookedNums.includes(seatNumber)) seatNumber++;
      }

      const busNumber = getBusNumber(route.routeCode, Math.max(1, Math.ceil(seatNumber / 50)));
      const ticketId = generateTicketId();
      const qrCode = await generateQRCode({
        ticketId,
        studentName: session.user.name,
        studentId: session.user.studentId,
        routeName: route.routeName,
        routeCode: route.routeCode,
        busNumber,
        travelDate,
        direction,
        boardingStop,
        seatNumber,
        price: TICKET_PRICE,
        purchasedAt: new Date().toISOString(),
      });
      const ticket = await memoryDb.createTicket({
        ticketId,
        userId: session.user.id,
        routeId: route._id,
        busNumber,
        travelDate: dateStart,
        direction,
        boardingStop,
        seatNumber,
        price: TICKET_PRICE,
        status: 'CONFIRMED',
        paymentMethod,
        paymentStatus: 'PAID',
        qrCode,
        purchasedAt: new Date(),
      });

      return NextResponse.json(
        {
          message: 'Ticket booked successfully!',
          ticket: {
            ...ticket,
            routeName: route.routeName,
            routeCode: route.routeCode,
            studentName: session.user.name,
            studentId: session.user.studentId,
          },
        },
        { status: 201 }
      );
    }

    await getMongoConnection();
    const route = await Route.findById(routeId);
    if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 });

    const dateStart = new Date(travelDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateStart);
    dateEnd.setDate(dateEnd.getDate() + 1);
    const bookedCount = await Ticket.countDocuments({
      routeId: route._id,
      travelDate: { $gte: dateStart, $lt: dateEnd },
      status: { $ne: 'CANCELLED' },
    });
    if (bookedCount >= route.totalSeats) {
      return NextResponse.json({ error: 'No seats available for this route on the selected date' }, { status: 400 });
    }

    let seatNumber: number;
    if (chosenSeat) {
      // Check the chosen seat is not already taken
      const conflict = await Ticket.findOne({
        routeId: route._id,
        travelDate: { $gte: dateStart, $lt: dateEnd },
        seatNumber: chosenSeat,
        status: { $ne: 'CANCELLED' },
      });
      if (conflict) {
        return NextResponse.json(
          { error: `Seat #${String(chosenSeat).padStart(2, '0')} was just booked by someone else. Please choose another seat.` },
          { status: 409 }
        );
      }
      seatNumber = chosenSeat;
    } else {
      // Auto-assign: first gap in 1-50 not already booked
      const bookedSeatsData = await Ticket.find({
        routeId: route._id,
        travelDate: { $gte: dateStart, $lt: dateEnd },
        status: { $ne: 'CANCELLED' },
      }).select('seatNumber');
      const bookedNums = bookedSeatsData.map((t: any) => t.seatNumber);
      seatNumber = 1;
      while (bookedNums.includes(seatNumber)) seatNumber++;
    }

    const busIndex = Math.ceil(seatNumber / 50);
    const buses = await Bus.find({ routeId: route._id, isActive: true }).sort({ busNumber: 1 });
    const busNumber = buses[Math.min(busIndex - 1, buses.length - 1)]?.busNumber || getBusNumber(route.routeCode, 1);
    const ticketId = generateTicketId();
    const qrCode = await generateQRCode({
      ticketId,
      studentName: session.user.name,
      studentId: session.user.studentId,
      routeName: route.routeName,
      routeCode: route.routeCode,
      busNumber,
      travelDate,
      direction,
      boardingStop,
      seatNumber,
      price: TICKET_PRICE,
      purchasedAt: new Date().toISOString(),
    });

    const ticket = await Ticket.create({
      ticketId,
      userId: session.user.id,
      routeId: route._id,
      busNumber,
      travelDate: dateStart,
      direction,
      boardingStop,
      seatNumber,
      price: TICKET_PRICE,
      status: 'CONFIRMED',
      paymentMethod,
      paymentStatus: 'PAID',
      qrCode,
      purchasedAt: new Date(),
    });

    return NextResponse.json(
      {
        message: 'Ticket booked successfully!',
        ticket: {
          ...ticket.toObject(),
          routeName: route.routeName,
          routeCode: route.routeCode,
          studentName: session.user.name,
          studentId: session.user.studentId,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Booking error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to book ticket. Please try again.' },
      { status: 503 }
    );
  }
}
