import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

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
    console.warn('Supabase credentials not configured properly. User profile will use fallback mode.');
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error);
}

function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get('claimease_auth')?.value;
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'demo-secret-key-for-development-only') as any;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from auth token
    const tokenUser = getUserFromToken(request);
    if (!tokenUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch fresh user data from database
    let user = null;
    if (supabase) {
      const { data, error: userError } = await supabase
        .from('users')
        .select('id, email, name, current_plan, plan_expires_at, created_at, updated_at')
        .eq('email', tokenUser.email)
        .single();

      if (userError) {
        console.error('Error fetching user:', userError);
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      user = data;
    } else {
      // Fallback mode - create mock user data
      user = {
        id: 'demo-user-' + Date.now(),
        email: tokenUser.email,
        name: tokenUser.name || 'Demo User',
        current_plan: 'free',
        plan_expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    // Calculate claims remaining based on plan
    const calculateClaimsRemaining = () => {
      if (user.current_plan === 'pro') {
        return 999999; // Unlimited for Pro users
      }
      return Math.max(0, 3 - 0); // Standard users get 3 claims (assuming 0 used for now)
    };

    // Return fresh user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      tier: user.current_plan || 'free',
      plan_expires_at: user.plan_expires_at,
      created_at: user.created_at,
      claims_remaining: calculateClaimsRemaining(),
    };

    return NextResponse.json(userData);

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}