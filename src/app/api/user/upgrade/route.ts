import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Supabase client for service role (admin access)
let supabase: ReturnType<typeof createClient> | null = null;

try {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (supabaseUrl && supabaseServiceKey && 
      supabaseUrl !== 'https://your-project.supabase.co' && 
      supabaseServiceKey !== 'your-service-role-key') {
    supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
      },
    });
  } else {
    console.warn('Supabase credentials not configured properly. User upgrade will use fallback mode.');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, planType } = await request.json();

    // Validate input
    if (!email || !name || !planType) {
      return NextResponse.json(
        { error: 'Email, name, and plan type are required' },
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

    // Validate plan type
    const validPlans = ['standard', 'pro'];
    if (!validPlans.includes(planType)) {
      return NextResponse.json(
        { error: 'Invalid plan type. Must be standard or pro' },
        { status: 400 }
      );
    }

    // Find existing user
    let existingUser = null;
    if (supabase) {
      const { data, error: userError } = await supabase
        .from('users')
        .select('id, email, name, current_plan, stripe_customer_id')
        .eq('email', email)
        .single();

      if (userError) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      existingUser = data;
    } else {
      // Fallback mode - create a mock user for testing
      existingUser = {
        id: 'demo-user-' + Date.now(),
        email: email,
        name: name,
        current_plan: 'free',
        stripe_customer_id: null
      };
    }

    // Check if user is already on the requested plan
    if (existingUser.current_plan === planType) {
      return NextResponse.json(
        { error: 'User is already on this plan' },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let customerId = existingUser.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email,
        name: name,
        metadata: {
          userId: existingUser.id,
          planType: planType,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      if (supabase) {
        await supabase
          .from('users')
          .update({ stripe_customer_id: customerId })
          .eq('id', existingUser.id);
      }
    }

    // Get price ID for the plan
    const priceId = planType === 'pro' 
      ? (process.env.STRIPE_PRO_PRICE_ID || 'price_demo_pro_123') 
      : (process.env.STRIPE_STANDARD_PRICE_ID || 'price_demo_standard_123');

    if (!priceId || priceId.includes('demo')) {
      // Development fallback - return mock checkout URL
      return NextResponse.json({
        success: true,
        checkout_url: 'https://checkout.stripe.com/pay/demo-session-id',
        session_id: 'demo-session-id',
        message: 'Upgrade session created successfully (demo mode)',
      });
    }

    // Create Stripe checkout session for upgrade
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NODE_ENV === 'production' ? 'https://app.claimease.co.uk' : 'http://localhost:3000'}/account?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NODE_ENV === 'production' ? 'https://app.claimease.co.uk' : 'http://localhost:3000'}/account?upgrade=cancelled`,
      metadata: {
        userId: existingUser.id,
        userEmail: email,
        userName: name,
        planType: planType,
        upgrade: 'true',
        previousPlan: existingUser.current_plan,
      },
    });

    // Log the upgrade attempt
    console.log('Upgrade session created:', {
      userId: existingUser.id,
      email: email,
      fromPlan: existingUser.current_plan,
      toPlan: planType,
      sessionId: session.id,
      customerId: customerId,
    });

    return NextResponse.json({
      success: true,
      checkout_url: session.url,
      session_id: session.id,
      message: 'Upgrade session created successfully',
    });

  } catch (error) {
    console.error('Upgrade session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}