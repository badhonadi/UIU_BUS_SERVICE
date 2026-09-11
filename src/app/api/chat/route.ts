import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getChatResponse } from '@/lib/gemini';
import { connectToDatabase } from '@/lib/mongodb';
import Route from '@/models/Route';
import Ticket from '@/models/Ticket';
import { ROUTE_DATA } from '@/lib/constants';

function getRequestedTravelDate(message: string): Date {
  const dateMatch = message.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
  const dayOnlyMatch = message.match(/\b(\d{1,2})\s*(?:tarikh|তারিখ|date)\b/i);
  const requestedDate = new Date();

  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const yearValue = Number(dateMatch[3]);
    const year = yearValue < 100 ? 2000 + yearValue : yearValue;
    return new Date(year, month - 1, day);
  }

  if (dayOnlyMatch) {
    requestedDate.setDate(Number(dayOnlyMatch[1]));
    requestedDate.setHours(0, 0, 0, 0);
    return requestedDate;
  }

  requestedDate.setDate(requestedDate.getDate() + 1);
  requestedDate.setHours(0, 0, 0, 0);
  return requestedDate;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Add date-aware availability context for seat and booking questions.
    let availabilityContext = '';
    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes('seat') ||
      lowerMessage.includes('available') ||
      lowerMessage.includes('book') ||
      lowerMessage.includes('ticket') ||
      lowerMessage.includes('আসন') ||
      lowerMessage.includes('সিট')
    ) {
      try {
        await connectToDatabase();
        const routes = await Route.find({ isActive: true });
        const travelDate = getRequestedTravelDate(message);
        const dayAfter = new Date(travelDate);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const availabilityData = await Promise.all(
          routes.map(async (route) => {
            const booked = await Ticket.countDocuments({
              routeId: route._id,
              travelDate: { $gte: travelDate, $lt: dayAfter },
              status: { $ne: 'CANCELLED' },
            });
            return `${route.routeName}: ${route.totalSeats - booked}/${route.totalSeats} seats available for ${travelDate.toISOString().slice(0, 10)}`;
          })
        );
        availabilityContext = availabilityData.join('\n');
      } catch {
        availabilityContext = ROUTE_DATA
          .map((route) => `${route.routeName}: ${route.totalSeats} total seats; live booking count is unavailable right now`)
          .join('\n');
      }
    }

    const response = await getChatResponse(message, history || [], availabilityContext);

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
