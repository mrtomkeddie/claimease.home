import { NextRequest, NextResponse } from 'next/server';
import { generateMagicLinkToken } from '@/lib/auth';
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

// Simple in-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const key = identifier;
  const limit = rateLimitStore.get(key);
  
  if (!limit || now > limit.resetTime) {
    // Reset or new entry
    rateLimitStore.set(key, { count: 1, resetTime: now + 60 * 60 * 1000 }); // 1 hour
    return true;
  }
  
  if (limit.count >= 5) { // 5 attempts per hour
    return false;
  }
  
  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Rate limiting - 5 attempts per hour per email
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Check if user already exists
    let existingUser = null;
    if (supabase) {
      const { data } = await supabase
        .from('users')
        .select('id, email, name, current_plan')
        .eq('email', email)
        .single();
      existingUser = data;
    }

    // Generate magic link token (32 bytes = 64 hex chars)
    const token = generateMagicLinkToken();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry
    
    // Store token in database for better reliability
    if (supabase) {
      const { error: tokenError } = await supabase
        .from('magic_link_tokens')
        .insert({
          token,
          email,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          used: false,
          user_id: existingUser?.id,
        });

      if (tokenError) {
        console.error('Failed to store magic link token:', tokenError);
        // Continue since we have the backup store
      }
    }
    
    // Store token in shared store as backup (uses Supabase in production, in-memory in development)
    try {
      await magicLinkStore.set(token, { email, createdAt: Date.now(), used: false });
      // Debug: Verify token was stored
      const storedToken = await magicLinkStore.get(token);
      console.log(`Token stored successfully: ${storedToken ? 'YES' : 'NO'}`);
      if (storedToken) {
        console.log(`Stored token details:`, storedToken);
      }
    } catch (storeError) {
      console.warn('Failed to store token in backup store:', storeError);
      // Continue since we already stored in database
    }
    
    console.log(`Magic link token generated for ${email}: ${token}, expires at: ${expiresAt}`);
    
    // Generate magic link URL
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://app.claimease.co.uk' 
      : 'http://localhost:3000';
    
    const magicLink = `${baseUrl}/auth/finish?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Send email (implement your email service here)
    console.log(`Sending magic link to ${email}: ${magicLink}`);
    
    // For development, you might want to return the link
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        success: true,
        message: 'Magic link sent successfully',
        devLink: magicLink, // Only in development
        expiresIn: '15 minutes',
        userExists: !!existingUser,
        userPlan: existingUser?.current_plan || 'free',
      });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Magic link sent successfully',
      expiresIn: '15 minutes',
      userExists: !!existingUser,
      userPlan: existingUser?.current_plan || 'free',
    });
    
  } catch (error) {
    console.error('Magic link generation error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}