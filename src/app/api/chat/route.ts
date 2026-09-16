import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getChatResponse } from '@/lib/gemini';
import { connectToDatabase } from '@/lib/mongodb';
import Route from '@/models/Route';
import Ticket from '@/models/Ticket';
import ChatMessage from '@/models/ChatMessage';
import { memoryDb } from '@/lib/memory-db';
import { ROUTE_DATA } from '@/lib/constants';

function toAsciiDigits(str: string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return str.replace(/[০-৯]/g, (d) => bnDigits.indexOf(d).toString());
}
interface ParsedDateInfo {
  travelDate: Date;
  dateString: string;
  dayOfWeek: string;
  isWeekend: boolean; // Thursday (4) or Friday (5) in JS
  isPastOrToday: boolean;
}

function extractTravelDateInfo(message: string): ParsedDateInfo {
  const text = toAsciiDigits(message.toLowerCase());

  const now = new Date();
  const dhakaFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const [yearStr, monthStr, dayStr] = dhakaFormatter.format(now).split('-');
  const curYear = parseInt(yearStr, 10);
  const curMonth = parseInt(monthStr, 10) - 1; // 0-indexed
  const curDay = parseInt(dayStr, 10);

  const startOfTodayDhaka = new Date(curYear, curMonth, curDay);
  let targetDate: Date;

  // 1. Explicit ISO date: YYYY-MM-DD
  const isoMatch = text.match(/\b(20\d\d)[-\/](\d{1,2})[-\/](\d{1,2})\b/);
  // 2. Day-Month-Year: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = text.match(/\b(\d{1,2})[-\/](\d{1,2})[-\/](20\d\d|\d{2})\b/);

  if (isoMatch) {
    targetDate = new Date(
      parseInt(isoMatch[1], 10),
      parseInt(isoMatch[2], 10) - 1,
      parseInt(isoMatch[3], 10)
    );
  } else if (dmyMatch) {
    const y = parseInt(dmyMatch[3], 10);
    const yr = y < 100 ? 2000 + y : y;
    targetDate = new Date(yr, parseInt(dmyMatch[2], 10) - 1, parseInt(dmyMatch[1], 10));
  } else if (/\b(today|aj|ajke|আজ|আজকে)\b/.test(text)) {
    targetDate = new Date(curYear, curMonth, curDay);
  } else if (/\b(tomorrow|kalke|kal|কাল|কালকে|আগামীকাল)\b/.test(text)) {
    targetDate = new Date(curYear, curMonth, curDay + 1);
  } else if (/\b(day after tomorrow|porso|পরশু)\b/.test(text)) {
    targetDate = new Date(curYear, curMonth, curDay + 2);
  } else {
    // 3. Match day of month e.g. "18 tarikh", "১৮ তারিখ", "18th", "18 date"
    const dayMatch = text.match(
      /\b(\d{1,2})\s*(?:st|nd|rd|th)?\s*(?:tarikh|তারিখ|date|sep|september|oct|october|nov|dec|jan|feb|mar|apr|may|jun|jul|aug)?\b/
    );
    if (dayMatch) {
      const d = parseInt(dayMatch[1], 10);
      if (d >= 1 && d <= 31) {
        let targetMonth = curMonth;
        let targetYear = curYear;
        if (d < curDay && !text.includes('last') && !text.includes('aager')) {
          targetMonth += 1;
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear += 1;
          }
        }
        targetDate = new Date(targetYear, targetMonth, d);
      } else {
        targetDate = new Date(curYear, curMonth, curDay + 1);
      }
    } else {
      // Default to tomorrow
      targetDate = new Date(curYear, curMonth, curDay + 1);
    }
  }

  targetDate.setHours(0, 0, 0, 0);

  const dayIndex = targetDate.getDay(); // 0=Sun, 1=Mon, ..., 4=Thu, 5=Fri, 6=Sat
  const dayNames = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  const dayOfWeek = dayNames[dayIndex];
  const isWeekend = dayIndex === 4 || dayIndex === 5; // Thursday or Friday

  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;

  const isPastOrToday = targetDate.getTime() <= startOfTodayDhaka.getTime();

  return {
    travelDate: targetDate,
    dateString,
    dayOfWeek,
    isWeekend,
    isPastOrToday,
  };
}

async function fetchLiveRouteAvailability(dateInfo: ParsedDateInfo): Promise<string> {
  const { travelDate, dateString, dayOfWeek, isWeekend, isPastOrToday } = dateInfo;

  let availabilityLines: string[] = [];

  const startOfDay = new Date(travelDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  let usedMongo = false;

  try {
    const conn = await connectToDatabase();
    if (conn && conn.connection && conn.connection.readyState === 1) {
      const routes = await Route.find({ isActive: true }).sort({ routeNumber: 1 });
      if (routes && routes.length > 0) {
        usedMongo = true;
        for (const route of routes) {
          const booked = await Ticket.countDocuments({
            routeId: route._id,
            travelDate: { $gte: startOfDay, $lt: endOfDay },
            status: { $ne: 'CANCELLED' },
          });
          const available = Math.max(0, route.totalSeats - booked);
          availabilityLines.push(
            `- Route-${route.routeNumber} (${route.routeName}): ${available} seats available out of ${route.totalSeats} total (${booked} booked)`
          );
        }
      }
    }
  } catch (err) {
    console.warn('MongoDB query failed, falling back to memoryDb:', err);
  }

  if (!usedMongo) {
    try {
      const routes = await memoryDb.getRoutes();
      for (const route of routes) {
        const booked = await memoryDb.countBookedSeats(route._id, startOfDay);
        const available = Math.max(0, route.totalSeats - booked);
        availabilityLines.push(
          `- Route-${route.routeNumber} (${route.routeName}): ${available} seats available out of ${route.totalSeats} total (${booked} booked)`
        );
      }
    } catch {
      for (const r of ROUTE_DATA) {
        availabilityLines.push(
          `- Route-${r.routeNumber} (${r.routeName}): ${r.totalSeats} total seats`
        );
      }
    }
  }

  const header = `Query Date: ${dateString} (${dayOfWeek})\nUIU Weekend (No service): ${
    isWeekend ? 'YES (Thursday & Friday - UIU bus service is CLOSED)' : 'NO (Service runs normally)'
  }\nBooking Allowed for this date: ${
    isPastOrToday ? 'NO (Past/same-day booking is not permitted; book for tomorrow onwards)' : isWeekend ? 'NO (Weekend)' : 'YES'
  }`;

  return `${header}\n\nLive Route Capacity & Availability on ${dateString}:\n${availabilityLines.join('\n')}`;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || undefined;
    const userId = session?.user?.id || undefined;

    if (!userId && !sessionId) {
      return NextResponse.json({ messages: [] });
    }

    let isMongo = false;
    try {
      const conn = await connectToDatabase();
      if (conn && conn.connection && conn.connection.readyState === 1) {
        isMongo = true;
        const query: Record<string, unknown> = {};
        if (userId && sessionId) {
          query.$or = [{ userId }, { sessionId }];
        } else if (userId) {
          query.userId = userId;
        } else if (sessionId) {
          query.sessionId = sessionId;
        }

        const messages = await ChatMessage.find(query)
          .sort({ createdAt: 1 })
          .limit(100)
          .lean();

        return NextResponse.json({
          messages: messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
        });
      }
    } catch (err) {
      console.warn('Failed to fetch chat messages from MongoDB, checking memoryDb:', err);
    }

    if (!isMongo) {
      const msgs = await memoryDb.getChatMessages(userId, sessionId, 100);
      return NextResponse.json({
        messages: msgs.map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
      });
    }

    return NextResponse.json({ messages: [] });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { message, history, sessionId } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const lowerMessage = message.toLowerCase();
    const parsedDate = extractTravelDateInfo(message);

    // Build context data for Gemini
    let contextData = await fetchLiveRouteAvailability(parsedDate);

    // Identify if user is asking about a specific route
    const routeKeywords: Record<string, string> = {
      mirpur: 'Route-3 (Mirpur – UIU)',
      মিরপুর: 'Route-3 (Mirpur – UIU)',
      dhanmondi: 'Route-1 (Dhanmondi – UIU)',
      ধানমন্ডি: 'Route-1 (Dhanmondi – UIU)',
      palashi: 'Route-2 (Palashi – UIU)',
      পলাশী: 'Route-2 (Palashi – UIU)',
      signboard: 'Route-4 (Signboard – UIU)',
      সাইনবোর্ড: 'Route-4 (Signboard – UIU)',
      jatrabari: 'Route-5 (Jatrabari – UIU)',
      যাত্রাবাড়ী: 'Route-5 (Jatrabari – UIU)',
      uttara: 'Route-6 (Uttara – UIU)',
      উত্তরা: 'Route-6 (Uttara – UIU)',
    };

    let targetRouteHint = '';
    for (const [kw, rName] of Object.entries(routeKeywords)) {
      if (lowerMessage.includes(kw)) {
        targetRouteHint = `\nTarget Route Asked by User: ${rName}. CRITICAL: Answer ONLY for this route! Do not mention other routes unless asked.`;
        break;
      }
    }
    if (targetRouteHint) {
      contextData = `${targetRouteHint}\n\n${contextData}`;
    }

    // If user is authenticated and asking about their own tickets
    if (
      session?.user?.id &&
      (lowerMessage.includes('my ticket') ||
        lowerMessage.includes('amar ticket') ||
        lowerMessage.includes('amar booking') ||
        lowerMessage.includes('আমার টিকিট') ||
        lowerMessage.includes('আমার সিট'))
    ) {
      try {
        await connectToDatabase();
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        let userTickets = await Ticket.find({
          userId: session.user.id,
          status: 'CONFIRMED',
          travelDate: { $gte: startOfToday },
        })
          .populate('routeId', 'routeName routeNumber routeCode')
          .sort({ travelDate: 1 });

        if (userTickets.length > 0) {
          const ticketSummary = userTickets
            .map(
              (t: any) =>
                `Ticket ID: ${t.ticketId}, Route: ${t.routeId?.routeName || t.routeId}, Bus: ${t.busNumber}, Seat #${t.seatNumber}, Travel Date: ${t.travelDate.toISOString().slice(0, 10)}, Boarding Stop: ${t.boardingStop}`
            )
            .join('\n');
          contextData += `\n\nStudent's Upcoming Booked Tickets:\n${ticketSummary}`;
        } else {
          contextData += `\n\nStudent (${session.user.name}) has NO upcoming confirmed tickets at the moment.`;
        }
      } catch (err) {
        console.warn('Could not fetch user tickets for chat context:', err);
      }
    }

    if (session?.user?.name) {
      contextData += `\n\nStudent Name: ${session.user.name}`;
    }

    const response = await getChatResponse(message, history || [], contextData);

    // Persist user query and AI response in Database
    try {
      const conn = await connectToDatabase();
      if (conn && conn.connection && conn.connection.readyState === 1) {
        await ChatMessage.insertMany([
          {
            userId: session?.user?.id || undefined,
            sessionId: sessionId || undefined,
            role: 'user',
            content: message,
          },
          {
            userId: session?.user?.id || undefined,
            sessionId: sessionId || undefined,
            role: 'model',
            content: response,
          },
        ]);
      } else {
        await memoryDb.saveChatMessage({
          userId: session?.user?.id || undefined,
          sessionId: sessionId || undefined,
          role: 'user',
          content: message,
        });
        await memoryDb.saveChatMessage({
          userId: session?.user?.id || undefined,
          sessionId: sessionId || undefined,
          role: 'model',
          content: response,
        });
      }
    } catch (saveErr) {
      console.warn('Could not persist chat message to Mongo, saving to memoryDb:', saveErr);
      try {
        await memoryDb.saveChatMessage({
          userId: session?.user?.id || undefined,
          sessionId: sessionId || undefined,
          role: 'user',
          content: message,
        });
        await memoryDb.saveChatMessage({
          userId: session?.user?.id || undefined,
          sessionId: sessionId || undefined,
          role: 'model',
          content: response,
        });
      } catch (memErr) {
        console.error('Error saving chat message to memoryDb:', memErr);
      }
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId') || undefined;
    const userId = session?.user?.id || undefined;

    try {
      const conn = await connectToDatabase();
      if (conn && conn.connection && conn.connection.readyState === 1) {
        const query: Record<string, unknown> = {};
        if (userId && sessionId) {
          query.$or = [{ userId }, { sessionId }];
        } else if (userId) {
          query.userId = userId;
        } else if (sessionId) {
          query.sessionId = sessionId;
        }
        if (Object.keys(query).length > 0) {
          await ChatMessage.deleteMany(query);
        }
      }
    } catch (err) {
      console.warn('MongoDB chat delete error:', err);
    }

    await memoryDb.clearChatMessages(userId, sessionId);
    return NextResponse.json({ message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    return NextResponse.json({ error: 'Failed to clear chat' }, { status: 500 });
  }
}

