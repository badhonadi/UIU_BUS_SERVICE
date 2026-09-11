import { GoogleGenerativeAI } from '@google/generative-ai';
import { ROUTE_DATA, TICKET_PRICE } from './constants';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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
- If asked about seat availability, mention that they should check the booking page for real-time availability
- Always be friendly and use emoji occasionally
- If you don't know something, say so honestly
- Guide students to the booking page when appropriate`;

export async function getChatResponse(
  message: string,
  history: { role: string; content: string }[] = [],
  availabilityContext?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    return 'Sorry, I\'m having trouble connecting right now. Please try again in a moment! 🙏';
  }
}
