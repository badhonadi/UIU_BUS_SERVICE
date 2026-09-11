import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getChatResponse } from '@/lib/gemini';
import { connectToDatabase } from '@/lib/mongodb';
import Route from '@/models/Route';
import Ticket from '@/models/Ticket';

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

    // Get availability context if the message seems to be about availability
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
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const availabilityData = await Promise.all(
          routes.map(async (route) => {
            const booked = await Ticket.countDocuments({
              routeId: route._id,
              travelDate: { $gte: tomorrow, $lt: dayAfter },
              status: { $ne: 'CANCELLED' },
            });
            return `${route.routeName}: ${route.totalSeats - booked}/${route.totalSeats} seats available for tomorrow`;
          })
        );
        availabilityContext = availabilityData.join('\n');
      } catch (e) {
        // silently fail - chatbot can still respond without live data
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
