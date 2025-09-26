import { NextRequest, NextResponse } from 'next/server';
import { magicLinkStore } from '@/lib/magic-link-store';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json({
        error: 'Token is required',
        store: 'magic-link-store',
      });
    }

    // Check if token exists in store
    const stored = await magicLinkStore.get(token);
    
    // Debug: Check all tokens in store
    const allTokens = [];
    for (const [key, value] of (magicLinkStore as any).tokens.entries()) {
      allTokens.push({
        token: key,
        email: value.email,
        createdAt: value.createdAt,
        used: value.used,
      });
    }
    
    if (!stored) {
      return NextResponse.json({
        found: false,
        message: 'Token not found in store',
        store: 'magic-link-store',
        allTokensInStore: allTokens,
        requestedToken: token,
      });
    }

    // Check token details
    const now = Date.now();
    const createdAt = stored.createdAt || (stored.created_at ? new Date(stored.created_at).getTime() : 0);
    const tokenAge = now - createdAt;
    const isExpired = tokenAge > 15 * 60 * 1000;
    const isUsed = stored.used;

    return NextResponse.json({
      found: true,
      token: {
        email: stored.email,
        createdAt: new Date(createdAt).toISOString(),
        ageMinutes: Math.floor(tokenAge / 60000),
        isExpired,
        isUsed,
        expiresAt: new Date(createdAt + 15 * 60 * 1000).toISOString(),
        timeRemaining: isExpired ? 0 : 15 * 60 * 1000 - tokenAge,
      },
      store: 'magic-link-store',
    });

  } catch (error) {
    console.error('Debug token check error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message,
      store: 'magic-link-store',
    }, { status: 500 });
  }
}