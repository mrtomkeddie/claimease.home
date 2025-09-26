import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateAuthToken, setAuthCookie } from '@/lib/auth';
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

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Find user
    let user;
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, name, current_plan, password_hash, created_at, plan_expires_at')
        .eq('email', email)
        .single();
        
      if (error || !data) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
      user = data;
    } else {
      // Fallback for development - simulate user
      user = {
        id: 'dev-user-id',
        email,
        name: email.split('@')[0],
        current_plan: 'free',
        password_hash: '-hash', // This won't match
        created_at: new Date().toISOString(),
      };
    }
    
    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    
    // Generate auth token and set cookie
    const token = generateAuthToken(user);
    await setAuthCookie(token);
    
    // Return user data in same format as magic link auth
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.current_plan || 'free',
        plan_expires_at: user.plan_expires_at,
        created_at: user.created_at || new Date().toISOString(),
      },
    });
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
