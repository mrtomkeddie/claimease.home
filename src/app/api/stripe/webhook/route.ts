import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { headers } from 'next/headers';

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
    console.warn('Supabase credentials not configured properly. Webhook will not update database.');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

// Helper function to verify Stripe webhook signature
async function verifyStripeWebhook(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');
  
  if (!signature) {
    throw new Error('No signature provided');
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  
  return { event, body };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const { event, body } = await verifyStripeWebhook(request);
    
    console.log('Received Stripe webhook:', event.type);
    console.log('Event data:', JSON.stringify(event.data.object, null, 2));

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Check if this is an upgrade session
        if (session.metadata?.upgrade === 'true') {
          const userId = session.metadata.userId;
          const userEmail = session.metadata.userEmail;
          const planType = session.metadata.planType;
          const previousPlan = session.metadata.previousPlan;
          
          console.log('Processing upgrade for user:', userId, 'to plan:', planType);
          
          // Calculate plan expiration (30 days from now)
          const planExpiresAt = new Date();
          planExpiresAt.setDate(planExpiresAt.getDate() + 30);
          
          // Update user plan in database
          if (supabase) {
            const { data: updatedUser, error: updateError } = await supabase
              .from('users')
              .update({
                current_plan: planType,
                plan_expires_at: planExpiresAt.toISOString(),
                stripe_customer_id: session.customer as string,
                updated_at: new Date().toISOString(),
              })
              .eq('id', userId)
              .select()
              .single();

            if (updateError) {
              console.error('Error updating user plan:', updateError);
              throw new Error('Failed to update user plan');
            }
          } else {
            console.log('Supabase not available. User plan update skipped in development mode.');
          }

          // Log the upgrade
          console.log('User plan upgraded successfully:', {
            userId: userId,
            email: userEmail,
            fromPlan: previousPlan,
            toPlan: planType,
            expiresAt: planExpiresAt,
            sessionId: session.id,
          });

          // Create a payment record
          if (supabase) {
            const { error: paymentError } = await supabase
              .from('payments')
              .insert({
                user_id: userId,
                stripe_session_id: session.id,
                stripe_customer_id: session.customer as string,
                amount: session.amount_total,
                currency: session.currency,
                status: 'completed',
                plan_type: planType,
                metadata: session.metadata,
                created_at: new Date().toISOString(),
              });

            if (paymentError) {
              console.error('Error creating payment record:', paymentError);
              // Don't throw here as the user upgrade was successful
            }
          }
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session expired:', session.id);
        // Handle expired sessions if needed
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent succeeded:', paymentIntent.id);
        // Additional payment success handling if needed
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment intent failed:', paymentIntent.id);
        // Handle failed payments if needed
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}