import { NextRequest, NextResponse } from 'next/server';
import { generateAuthToken, setAuthCookie } from '@/lib/auth';
import { magicLinkStore } from '@/lib/magic-link-store';
import { createClient } from '@supabase/supabase-js';

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
    console.warn('Supabase credentials not configured properly. Using fallback mode.');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

// Use shared store
// const magicLinkStore = (global as any).magicLinkStore || new Map<string, { email: string; createdAt: number; used: boolean }>();

async function isTokenValid(token: string, email: string): Promise<boolean> {
  if (supabase) {
    // First check database for token
    const { data: dbToken, error: dbError } = await supabase
      .from('magic_link_tokens')
      .select('*')
      .eq('token', token)
      .eq('email', email)
      .single();

    if (!dbError && dbToken) {
      // Check if token is already used
      if (dbToken.used) return false;
      
      // Check if token is expired
      const now = new Date();
      const expiresAt = new Date(dbToken.expires_at);
      if (now > expiresAt) return false;
      
      // Mark token as used in database
      await supabase
        .from('magic_link_tokens')
        .update({ used: true })
        .eq('id', dbToken.id);
      
      // Also mark in magic link store
      await magicLinkStore.markAsUsed(token);
      
      return true;
    }
  }

  // Fallback to magic link store
  console.log(`Verifying magic link for email: ${email} token: ${token.substring(0, 10)}...`);
  
  // Debug: Check all tokens in store before getting
  const allTokens = [];
  for (const [key, value] of (magicLinkStore as any).tokens.entries()) {
    allTokens.push({
      token: key,
      email: value.email,
      createdAt: value.createdAt,
      used: value.used,
    });
  }
  console.log(`All tokens in store:`, allTokens);
  
  const stored = await magicLinkStore.get(token);
  
  console.log(`Token lookup result:`, stored);
  
  if (!stored) {
    console.log('Token not found in magic link store:', token);
    return false;
  }
  
  // Check if token matches email
  if (stored.email !== email) {
    console.log('Email mismatch:', stored.email, '!==', email);
    return false;
  }
  
  // Check if token is already used
  if (stored.used) {
    console.log('Token already used');
    return false;
  }
  
  // Check if token is expired (15 minutes)
  const now = Date.now();
  const createdAt = stored.createdAt || (stored.created_at ? new Date(stored.created_at).getTime() : 0);
  const tokenAge = now - createdAt;
  if (tokenAge > 15 * 60 * 1000) {
    console.log('Token expired, age:', Math.floor(tokenAge / 60000), 'minutes');
    return false;
  }
  
  // Mark token as used in magic link store
  await magicLinkStore.markAsUsed(token);
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { token, email } = await request.json();
    
    if (!token || !email) {
      return NextResponse.json(
        { success: false, message: 'Token and email are required' },
        { status: 400 }
      );
    }
    
    console.log('Verifying magic link for email:', email, 'token:', token.substring(0, 10) + '...');
    
    // Verify magic link token (one-time use)
    const isValid = await isTokenValid(token, email);
    console.log('Token validation result:', isValid);
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired magic link' },
        { status: 401 }
      );
    }
    
    // Find or create user
    let existingUser = null;
    if (supabase) {
      const { data } = await supabase
        .from('users')
        .select('id, email, name, current_plan, plan_expires_at, created_at')
        .eq('email', email)
        .single();
      existingUser = data;
    }

    let user;
    if (existingUser) {
      user = existingUser;
    } else if (supabase) {
      // Create new user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          name: email.split('@')[0],
          created_via: 'magic_link',
        },
      });

      if (authError) {
        throw new Error(`Failed to create user: ${authError.message}`);
      }

      // Create user record in our users table
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: email.split('@')[0],
          current_plan: 'free',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        throw new Error(`Failed to create user record: ${userError.message}`);
      }

      user = newUser;
    } else {
      // Fallback mode - create demo user
      user = {
        id: 'demo-user-' + Date.now(),
        email: email,
        name: email.split('@')[0],
        current_plan: 'free',
        plan_expires_at: null,
        created_at: new Date().toISOString(),
      };
    }
    
    // Generate JWT token
    const authToken = generateAuthToken(user);
    
    // Set secure auth cookie
    await setAuthCookie(authToken);
    
    // Send device notification email (implement your email service)
    console.log(`Device notification: New sign-in for ${email}`);
    
    return NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.current_plan || 'free',
        plan_expires_at: user.plan_expires_at,
        created_at: user.created_at,
      },
    });
    
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}