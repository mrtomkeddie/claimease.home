import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { generateAuthToken, setAuthCookie } from '@/lib/auth';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Extract user data from metadata
    const userDataString = session.metadata?.userData;
    if (!userDataString) {
      return NextResponse.json({ error: 'No user data found' }, { status: 400 });
    }

    const userData = JSON.parse(userDataString);
    
    // Create user object with additional payment info
    const user = {
      id: generateUserId(),
      name: userData.name,
      email: userData.email,
      timezone: userData.timezone,
      pip_focus: userData.pip_focus || [],
      created_at: userData.created_at,
      tier: userData.tier,
      claims_used: userData.claims_used,
      claims_remaining: userData.claims_remaining,
      stripeCustomerId: session.customer as string,
      stripeSessionId: sessionId,
      paymentStatus: 'completed',
      updated_at: new Date().toISOString()
    };

    // Generate JWT token for domain-wide authentication
    const token = generateAuthToken(user);
    
    // Set the domain-wide cookie
    await setAuthCookie(token);
    
    return NextResponse.json({ 
      success: true, 
      user,
      token,
      message: 'User account created successfully'
    });

  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ error: 'Failed to verify session' }, { status: 500 });
  }
}

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}