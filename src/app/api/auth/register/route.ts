import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, validatePassword, generateAuthToken, setAuthCookie } from '@/lib/auth';
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
    const { email, password, name } = await request.json();
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
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
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    if (supabase) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();
        
      if (existingUser) {
        return NextResponse.json(
          { error: 'User already exists with this email' },
          { status: 409 }
        );
      }
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    let user;
    if (supabase) {
      const { data, error } = await supabase
        .from('users')
        .insert({
          email,
          name: name || email.split('@')[0],
          password_hash: hashedPassword,
          current_plan: 'free',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
        
      if (error) {
        console.error('Failed to create user:', error);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
      user = data;
    } else {
      // Fallback for development
      user = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name: name || email.split('@')[0],
        current_plan: 'free',
        created_at: new Date().toISOString(),
      };
    }
    
    // Generate auth token and set cookie
    const token = generateAuthToken(user);
    await setAuthCookie(token);
    
    // Return user data in same format as magic link auth
    return NextResponse.json({
      success: true,
      message: 'Registration successful',
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
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
