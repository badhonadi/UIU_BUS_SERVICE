import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { memoryDb } from '@/lib/memory-db';

export const dynamic = 'force-dynamic';
const useMemoryDb = process.env.NODE_ENV !== 'production' && !process.env.MONGODB_URI;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await params;

    if (useMemoryDb) {
      const ticket = await memoryDb.getTicketById(ticketId, session.user.id);
      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      return NextResponse.json({
        ticket: {
          ...ticket,
          studentName: session.user.name,
          studentId: session.user.studentId,
        },
      });
    }

    await connectToDatabase();

    const ticket = await Ticket.findOne({
      ticketId,
      userId: session.user.id,
    }).populate('routeId', 'routeName routeCode routeNumber stops remarks');

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ticket: {
        ...ticket.toObject(),
        studentName: session.user.name,
        studentId: session.user.studentId,
      },
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketId } = await params;
    const body = await request.json();

    if (useMemoryDb) {
      const ticket = await memoryDb.getTicketById(ticketId, session.user.id);
      if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      if (ticket.status === 'CANCELLED') return NextResponse.json({ error: 'Ticket is already cancelled' }, { status: 400 });
      if (ticket.status === 'USED') return NextResponse.json({ error: 'Cannot cancel a used ticket' }, { status: 400 });
      if (body.action === 'cancel') {
        const cancelledTicket = await memoryDb.cancelTicket(ticketId, session.user.id);
        return NextResponse.json({ message: 'Ticket cancelled successfully', ticket: cancelledTicket });
      }
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await connectToDatabase();

    const ticket = await Ticket.findOne({
      ticketId,
      userId: session.user.id,
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    if (ticket.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Ticket is already cancelled' },
        { status: 400 }
      );
    }

    if (ticket.status === 'USED') {
      return NextResponse.json(
        { error: 'Cannot cancel a used ticket' },
        { status: 400 }
      );
    }

    // Check if travel date has passed
    const now = new Date();
    const travelDate = new Date(ticket.travelDate);
    travelDate.setHours(0, 0, 0, 0);
    if (travelDate <= now) {
      return NextResponse.json(
        { error: 'Cannot cancel ticket for a past or current date' },
        { status: 400 }
      );
    }

    if (body.action === 'cancel') {
      ticket.status = 'CANCELLED';
      ticket.paymentStatus = 'REFUNDED';
      await ticket.save();

      return NextResponse.json({
        message: 'Ticket cancelled successfully',
        ticket,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
