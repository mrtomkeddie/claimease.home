import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Price IDs for different plans
const PRICE_IDS = {
  standard: process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID!,
  pro: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
  upgrade: process.env.NEXT_PUBLIC_STRIPE_UPGRADE_PRICE_ID!,
} as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, plan } = body;

    // Validate input
    if (!email || !plan) {
      return NextResponse.json(
        { error: 'Email and plan are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate plan
    if (!PRICE_IDS[plan as keyof typeof PRICE_IDS]) {
      return NextResponse.json(
        { error: 'Invalid plan type' },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];
    
    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_WWW_URL || 'http://localhost:3001'}`,
      customer_email: email,
      customer_creation: 'always',
      metadata: {
        plan,
        email,
      },
      payment_intent_data: {
        metadata: {
          plan,
          email,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout session error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}