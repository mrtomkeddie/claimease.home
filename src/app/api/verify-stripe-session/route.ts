import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    let sessionId;
    
    try {
      const body = await request.json();
      sessionId = body.sessionId;
    } catch (jsonError) {
      // If JSON parsing fails, try to get from URL search params
      const searchParams = request.nextUrl.searchParams;
      sessionId = searchParams.get('sessionId');
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if payment was successful
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Extract user data from session metadata
    const metadata = session.metadata;
    if (!metadata) {
      return NextResponse.json(
        { error: 'No user data found in session' },
        { status: 400 }
      );
    }

    // Parse user data from metadata
    let userData;
    try {
      userData = {
        email: metadata.email || '',
        name: metadata.name || '',
        plan: metadata.plan || 'basic',
        priceId: metadata.priceId || '',
        userId: metadata.userId || session.customer?.toString() || sessionId,
      };
    } catch (parseError) {
      console.error('Error parsing metadata:', parseError);
      return NextResponse.json(
        { error: 'Invalid user data format' },
        { status: 400 }
      );
    }

    // Return user and session information
    return NextResponse.json({
      success: true,
      user: userData,
      session: {
        id: session.id,
        paymentStatus: session.payment_status,
        amountTotal: session.amount_total,
        currency: session.currency,
        customer: session.customer,
      },
    });

  } catch (error) {
    console.error('Stripe session verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}