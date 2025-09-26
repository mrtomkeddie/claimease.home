import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Initialize Supabase client for service role (admin access)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    // Store webhook event for reliability and debugging
    const { data: webhookEvent, error: webhookError } = await supabase
      .from('webhook_events')
      .insert({
        event_type: event.type,
        stripe_event_id: event.id,
        payload: event.data.object,
        status: 'processing',
      })
      .select()
      .single();

    if (webhookError) {
      console.error('Failed to store webhook event:', webhookError);
      // Continue processing even if storage fails
    }

    let result;
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        result = await handleSuccessfulPayment(session, event.id);
        break;

      case 'checkout.session.async_payment_succeeded':
        const asyncSession = event.data.object as Stripe.Checkout.Session;
        result = await handleSuccessfulPayment(asyncSession, event.id);
        break;

      case 'checkout.session.async_payment_failed':
        const failedSession = event.data.object as Stripe.Checkout.Session;
        result = await handleFailedPayment(failedSession, event.id);
        break;

      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        result = await handlePaymentIntentSucceeded(paymentIntent, event.id);
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        result = await handlePaymentFailure(failedPayment, event.id);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        result = await handleSubscriptionPayment(invoice, event.id);
        break;

      case 'customer.subscription.created':
        const subscription = event.data.object as Stripe.Subscription;
        result = await handleSubscriptionCreated(subscription, event.id);
        break;

      case 'customer.subscription.updated':
        const updatedSubscription = event.data.object as Stripe.Subscription;
        result = await handleSubscriptionUpdated(updatedSubscription, event.id);
        break;

      case 'customer.subscription.deleted':
        const deletedSubscription = event.data.object as Stripe.Subscription;
        result = await handleSubscriptionDeleted(deletedSubscription, event.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
        result = { success: true, message: 'Event type not handled' };
    }

    // Update webhook event status
    if (webhookEvent) {
      await supabase
        .from('webhook_events')
        .update({
          status: result.success ? 'completed' : 'failed',
          processed_at: new Date().toISOString(),
          last_error: result.error || null,
        })
        .eq('id', webhookEvent.id);
    }

    return NextResponse.json({ received: true, result });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Update webhook event as failed
    if (event?.id) {
      await supabase
        .from('webhook_events')
        .update({
          status: 'failed',
          last_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('stripe_event_id', event.id);
    }

    // Still return 200 to prevent Stripe from retrying indefinitely
    return NextResponse.json({ 
      received: true, 
      error: 'Webhook processing encountered an error but was acknowledged' 
    }, { status: 200 });
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session, eventId: string) {
  try {
    const userEmail = session.customer_email || session.metadata?.email;
    const customerId = session.customer as string;
    const planType = session.metadata?.planType;
    const priceId = session.line_items?.data[0]?.price?.id;

    if (!userEmail || !customerId || !planType || !priceId) {
      throw new Error('Missing required session data');
    }

    // Find or create user
    let user = await findOrCreateUser(userEmail, session.metadata?.name, customerId);

    // Create checkout session record
    const { data: checkoutSession, error: sessionError } = await supabase
      .from('stripe_checkout_sessions')
      .insert({
        user_id: user.id,
        stripe_session_id: session.id,
        stripe_price_id: priceId,
        plan_type: planType,
        status: 'completed',
        user_email: userEmail,
        user_name: session.metadata?.name || user.name,
        completed_at: new Date().toISOString(),
        expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        payment_intent_id: session.payment_intent as string,
        metadata: {
          event_id: eventId,
          original_metadata: session.metadata,
        },
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create checkout session: ${sessionError.message}`);
    }

    // Update user plan
    const planExpiresAt = calculatePlanExpiration(planType);
    const { error: userError } = await supabase
      .from('users')
      .update({
        current_plan: planType,
        plan_expires_at: planExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (userError) {
      throw new Error(`Failed to update user plan: ${userError.message}`);
    }

    // Record plan change history
    await supabase.from('user_plan_history').insert({
      user_id: user.id,
      previous_plan: user.current_plan || 'free',
      new_plan: planType,
      change_reason: 'purchase',
      stripe_session_id: session.id,
      effective_at: new Date().toISOString(),
    });

    console.log('Payment processed successfully:', {
      userId: user.id,
      customerId: customerId,
      plan: planType,
      sessionId: session.id,
    });

    return { success: true, message: 'Payment processed successfully' };

  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
}

async function handleFailedPayment(session: Stripe.Checkout.Session, eventId: string) {
  try {
    // Update checkout session status to failed
    if (session.id) {
      await supabase
        .from('stripe_checkout_sessions')
        .update({
          status: 'failed',
          metadata: {
            failure_reason: 'async_payment_failed',
            event_id: eventId,
          },
        })
        .eq('stripe_session_id', session.id);
    }

    console.log('Async payment failed for session:', session.id);
    return { success: true, message: 'Failed payment handled' };
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, eventId: string) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  return { success: true, message: 'Payment intent processed' };
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent, eventId: string) {
  try {
    console.log('Payment failed:', paymentIntent.id);
    
    // Log payment failure for investigation
    return { 
      success: true, 
      message: 'Payment failure logged',
      error: `Payment intent ${paymentIntent.id} failed with status: ${paymentIntent.status}`
    };
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice, eventId: string) {
  try {
    console.log('Subscription payment succeeded:', invoice.id);
    
    if (invoice.subscription) {
      // Handle subscription renewal
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      
      // Update user plan expiration if needed
      if (invoice.customer) {
        const { data: user } = await supabase
          .from('users')
          .select('id, current_plan')
          .eq('stripe_customer_id', invoice.customer)
          .single();

        if (user) {
          const newExpiration = calculatePlanExpiration(user.current_plan);
          await supabase
            .from('users')
            .update({ plan_expires_at: newExpiration })
            .eq('id', user.id);
        }
      }
    }

    return { success: true, message: 'Subscription payment processed' };
  } catch (error) {
    console.error('Error handling subscription payment:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription, eventId: string) {
  console.log('Subscription created:', subscription.id);
  return { success: true, message: 'Subscription created' };
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription, eventId: string) {
  console.log('Subscription updated:', subscription.id);
  return { success: true, message: 'Subscription updated' };
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription, eventId: string) {
  try {
    console.log('Subscription deleted:', subscription.id);
    
    // Update user plan to free when subscription is deleted
    if (subscription.customer) {
      const { data: user } = await supabase
        .from('users')
        .select('id, current_plan')
        .eq('stripe_customer_id', subscription.customer)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({ 
            current_plan: 'free',
            plan_expires_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        // Record plan change
        await supabase.from('user_plan_history').insert({
          user_id: user.id,
          previous_plan: user.current_plan,
          new_plan: 'free',
          change_reason: 'expiration',
          effective_at: new Date().toISOString(),
        });
      }
    }

    return { success: true, message: 'Subscription deletion processed' };
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
}

// Helper functions

async function findOrCreateUser(email: string, name?: string, customerId?: string) {
  // Try to find existing user
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (existingUser) {
    // Update stripe customer ID if provided
    if (customerId && !existingUser.stripe_customer_id) {
      await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', existingUser.id);
      
      existingUser.stripe_customer_id = customerId;
    }
    return existingUser;
  }

  // Create new user via Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      name: name || email.split('@')[0],
      stripe_customer_id: customerId,
    },
  });

  if (authError) {
    throw new Error(`Failed to create user: ${authError.message}`);
  }

  return {
    id: authData.user.id,
    email: authData.user.email!,
    name: name || email.split('@')[0],
    stripe_customer_id: customerId,
    current_plan: 'free',
    created_at: new Date().toISOString(),
  };
}

function calculatePlanExpiration(planType: string): string {
  const now = new Date();
  const expirationDate = new Date(now);
  
  switch (planType) {
    case 'standard':
      expirationDate.setFullYear(now.getFullYear() + 1); // 1 year
      break;
    case 'pro':
      expirationDate.setFullYear(now.getFullYear() + 1); // 1 year
      break;
    default:
      expirationDate.setMonth(now.getMonth() + 1); // 1 month default
  }
  
  return expirationDate.toISOString();
}