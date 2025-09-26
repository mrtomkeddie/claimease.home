import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Product configuration - moved from stripe.ts to avoid client-side imports
const STRIPE_PRODUCTS = {
  STANDARD: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_STANDARD_PRICE_ID!,
    name: 'ClaimEase Standard',
    price: 49,
    currency: 'GBP',
    features: [
      'One full PIP claim',
      'Export answers (PDF/Word)',
      'Free appeal support'
    ]
  },
  PRO: {
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!,
    name: 'ClaimEase Pro',
    price: 79,
    currency: 'GBP',
    features: [
      'Unlimited PIP claims',
      'Upload medical documents',
      'Free appeal support for every claim'
    ]
  }
} as const;

export async function POST(request: NextRequest) {
  try {
    let priceId, planType, customerEmail, userData;
    
    try {
      const body = await request.json();
      priceId = body.priceId;
      planType = body.planType;
      customerEmail = body.customerEmail;
      userData = body.userData;
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    // Validate the plan type
    if (!planType || !STRIPE_PRODUCTS[planType as keyof typeof STRIPE_PRODUCTS]) {
      return NextResponse.json(
        { error: 'Invalid or missing plan type' },
        { status: 400 }
      );
    }

    const product = STRIPE_PRODUCTS[planType as keyof typeof STRIPE_PRODUCTS];

    // Create Checkout Sessions from body params
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId || product.priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SUCCESS_URL || 'http://localhost:3000/success'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: process.env.NEXT_PUBLIC_CANCEL_URL || 'http://localhost:3000',
      customer_email: customerEmail,
      customer_creation: 'always',
      metadata: {
        planType,
        productName: product.name,
        userData: JSON.stringify(userData || {}),
      },
      payment_intent_data: {
        metadata: {
          planType,
          productName: product.name,
          userData: JSON.stringify(userData || {}),
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}