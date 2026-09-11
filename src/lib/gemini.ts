import { GoogleGenerativeAI } from '@google/generative-ai';
import { ROUTE_DATA, TICKET_PRICE } from './constants';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

function normalizeQuery(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function findRelevantRoutes(message: string) {
  const query = normalizeQuery(message);
  return ROUTE_DATA
    .map((route) => {
      const routeTerms = [route.routeName, route.routeCode, ...route.stops]
        .filter((stop) => stop !== 'UIU')
        .map(normalizeQuery)
        .filter((term) => term.length > 2);
      const matchedTerms = routeTerms.filter((term) => query.includes(term));
      return { route, score: matchedTerms.length ? Math.max(...matchedTerms.map((term) => term.length)) : 0 };
    })
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score)
    .map(({ route }) => route);
}

function getRequestedDateFromContext(availabilityContext: string): Date | null {
  const dateMatch = availabilityContext.match(/for (\d{4}-\d{2}-\d{2})/);
  if (!dateMatch) return null;
  const date = new Date(`${dateMatch[1]}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getLocalChatResponse(message: string, availabilityContext = ''): string {
  const query = message.toLowerCase();
  const matchedRoutes = findRelevantRoutes(message);
  const asksAboutSeats = /seat|available|availability|আসন|সিট|খালি|ফাঁকা|ticket|টিকিট/.test(query);
  const asksForRoute = /route|বাস|bus|যাব|যাওয়া|যেতে|কোন পথে|কোথা থেকে|location|রুট/.test(query);

  if (matchedRoutes.length > 0 && (asksAboutSeats || asksForRoute)) {
    const routeDetails = matchedRoutes.slice(0, 3).map((route) => {
      const stops = route.stops.filter((stop) => stop !== 'UIU').join(' → ');
      return `Route-${route.routeNumber} ${route.routeName}\nBus stands: ${stops}\nCapacity: ${route.totalSeats} seats`;
    }).join('\n\n');
    const relevantAvailability = availabilityContext
      .split('\n')
      .filter((line) => matchedRoutes.some((route) => normalizeQuery(line).includes(normalizeQuery(route.routeName))))
      .join('\n');
    const liveSeats = relevantAvailability ? `\n\nLive availability:\n${relevantAvailability}` : '';
    const requestedDate = getRequestedDateFromContext(relevantAvailability);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateWarning = requestedDate && requestedDate <= today
      ? '\n\nএই তারিখে same-day/past booking করা যাবে না। আগামীকালের জন্য বা তার পরের দিনের জন্য Book Ticket থেকে তারিখ নির্বাচন করুন।'
      : '';
    return `${routeDetails}${liveSeats}${dateWarning}\n\nTicket price ৳${TICKET_PRICE}. No service Thursday and Friday. 🚌`;
  }

  if (asksAboutSeats && availabilityContext) {
    return `Here is the latest available seat information for the next service date:\n${availabilityContext}\n\nFor a specific date, open Book Ticket and select that date to see the exact live seat count. 🚌`;
  }

  if (asksForRoute) {
    return `I can help you choose a UIU bus route. Tell me your starting area, for example “Mirpur 10”, “Dhanmondi”, “Jatrabari”, “Signboard”, “Palashi”, or “Uttara”. I will show the matching bus stands and route. 🚌`;
  }

  return `I can help with UIU transportation: route selection, bus stands, ticket price, seat availability, and booking. Ask something like “Mirpur 10 থেকে UIU কোন bus?”, “Mirpur route-এ কয়টা seat খালি?”, or “Dhanmondi bus কোথা থেকে ছাড়ে?” 🚌`;
}

const SYSTEM_PROMPT = `You are UIU RideWave Assistant — a friendly and helpful AI chatbot for United International University (UIU) bus service.

You help UIU students with:
1. Finding the right bus route based on their location
2. Understanding bus stops and routes
3. Checking seat availability
4. Explaining how to book tickets
5. General transport-related queries

Key Information:
- UIU is located in Bashundhara R/A, Dhaka, Bangladesh
- All tickets cost ৳${TICKET_PRICE} (100 BDT) per trip, any route
- No bus service on Thursday and Friday (UIU weekend)
- Students must book tickets before midnight of the travel date
- Students can book from tomorrow onwards (not same day)

Available Routes:
${ROUTE_DATA.map(r => `Route-${r.routeNumber} (${r.routeName}): ${r.totalBuses} buses, ${r.totalSeats} seats\n  Stops: ${r.stops.join(' → ')}\n  ${r.remarks ? 'Note: ' + r.remarks : ''}`).join('\n\n')}

Bus Numbering Format: UIU_[ROUTE_CODE]_[NUMBER] (e.g., UIU_DMD_001 for Dhanmondi Route Bus 1)

Route Codes: DMD (Dhanmondi), PALASHI (Palashi), MIRPUR (Mirpur), SIGN (Signboard), JBARI (Jatrabari), UTTARA (Uttara)

Rules:
- Be concise and helpful
- You can respond in both Bangla and English
- For a location-specific question, answer only with the route(s) that contain that location. Never add unrelated routes.
- Treat hyphens, spaces, and spelling variants as equivalent, such as "mirpur-11" and "Mirpur 11".
- If a student asks where to board, list the matching bus stand and say which route it belongs to.
- If live availability is provided, answer with the exact route and date from that context; never invent seat counts.
- If asked about seat availability, mention that they should check the booking page for real-time availability
- Always be friendly and use emoji occasionally
- If you don't know something, say so honestly
- Guide students to the booking page when appropriate`;

export async function getChatResponse(
  message: string,
  history: { role: string; content: string }[] = [],
  availabilityContext?: string
): Promise<string> {
  const hasRouteSpecificQuestion = findRelevantRoutes(message).length > 0 &&
    /route|বাস|bus|যাব|যাওয়া|যেতে|কোন পথে|কোথা থেকে|location|রুট|seat|available|ticket|টিকিট|সিট/.test(message.toLowerCase());

  if (hasRouteSpecificQuestion) {
    return getLocalChatResponse(message, availabilityContext);
  }

  if (!process.env.GEMINI_API_KEY) {
    return getLocalChatResponse(message, availabilityContext);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

    const chatHistory = history.map((msg) => ({
      role: msg.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: 'System context: ' + SYSTEM_PROMPT + (availabilityContext ? '\n\nCurrent Availability Info:\n' + availabilityContext : '') }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood! I\'m UIU RideWave Assistant. I\'m ready to help students with bus route information, ticket booking guidance, and any transport-related queries. How can I help you today? 🚌' }],
        },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return getLocalChatResponse(message, availabilityContext);
  }
}
