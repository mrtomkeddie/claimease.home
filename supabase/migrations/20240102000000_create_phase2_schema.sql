-- Phase 2 Database Schema Migration
-- Creates tables for users, stripe sessions, claims, and user plans

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE,
  
  -- User status and preferences
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Stripe customer information
  stripe_customer_id TEXT UNIQUE,
  
  -- Current plan information
  current_plan TEXT DEFAULT 'free' CHECK (current_plan IN ('free', 'standard', 'pro')),
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Stripe checkout sessions table
CREATE TABLE IF NOT EXISTS public.stripe_checkout_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Stripe session data
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('standard', 'pro')),
  
  -- Session status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'failed')),
  
  -- User data at time of purchase
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Stripe webhook data
  payment_intent_id TEXT,
  subscription_id TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User claims table
CREATE TABLE IF NOT EXISTS public.user_claims (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Claim information
  claim_title TEXT,
  claim_data JSONB DEFAULT '{}'::jsonb,
  
  -- Claim status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'submitted')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Export information
  exported_at TIMESTAMP WITH TIME ZONE,
  export_format TEXT CHECK (export_format IN ('pdf', 'word', 'both')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- User plan history table (for tracking upgrades/downgrades)
CREATE TABLE IF NOT EXISTS public.user_plan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Plan change information
  previous_plan TEXT NOT NULL,
  new_plan TEXT NOT NULL,
  change_reason TEXT CHECK (change_reason IN ('purchase', 'upgrade', 'downgrade', 'admin', 'expiration')),
  
  -- Stripe information
  stripe_session_id TEXT REFERENCES public.stripe_checkout_sessions(stripe_session_id),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  effective_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Webhook events table (for tracking and retrying webhooks)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Webhook information
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  
  -- Event data
  payload JSONB NOT NULL,
  
  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retry')),
  
  -- Processing information
  processed_at TIMESTAMP WITH TIME ZONE,
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON public.users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_current_plan ON public.users(current_plan);
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at ON public.users(plan_expires_at);

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_user_id ON public.stripe_checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_stripe_session_id ON public.stripe_checkout_sessions(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_status ON public.stripe_checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_sessions_created_at ON public.stripe_checkout_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_user_claims_user_id ON public.user_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_user_claims_status ON public.user_claims(status);
CREATE INDEX IF NOT EXISTS idx_user_claims_created_at ON public.user_claims(created_at);

CREATE INDEX IF NOT EXISTS idx_user_plan_history_user_id ON public.user_plan_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plan_history_created_at ON public.user_plan_history(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON public.webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON public.webhook_events(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_checkout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Stripe checkout sessions policies
CREATE POLICY "Users can view their own sessions" ON public.stripe_checkout_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all sessions" ON public.stripe_checkout_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User claims policies
CREATE POLICY "Users can manage their own claims" ON public.user_claims
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all claims" ON public.user_claims
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- User plan history policies
CREATE POLICY "Users can view their own plan history" ON public.user_plan_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all plan history" ON public.user_plan_history
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Webhook events policies
CREATE POLICY "Service role can manage webhook events" ON public.webhook_events
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Functions for user management
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'User'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on auth.user creation
CREATE OR REPLACE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_user_profile();

-- Function to update user last login
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET last_login_at = NOW()
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active plan
CREATE OR REPLACE FUNCTION public.user_has_active_plan(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = p_user_id
    AND is_active = TRUE
    AND (plan_expires_at IS NULL OR plan_expires_at > NOW())
    AND current_plan != 'free'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.stripe_checkout_sessions IS 'Stripe checkout session tracking';
COMMENT ON TABLE public.user_claims IS 'User PIP claims and applications';
COMMENT ON TABLE public.user_plan_history IS 'History of user plan changes';
COMMENT ON TABLE public.webhook_events IS 'Stripe webhook event tracking for reliability';