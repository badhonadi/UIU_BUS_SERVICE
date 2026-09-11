import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { paymentMethod, amount, ticketId } = body;

    if (!paymentMethod || !amount || !ticketId) {
      return NextResponse.json(
        { error: 'Payment method, amount, and ticket ID are required' },
        { status: 400 }
      );
    }

    // Simulate payment processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulated payment response
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      transaction: {
        id: transactionId,
        method: paymentMethod,
        amount,
        currency: 'BDT',
        status: 'COMPLETED',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Payment error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}
