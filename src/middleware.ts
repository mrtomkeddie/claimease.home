import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

// Protected routes that require authentication
const protectedRoutes = ['/account', '/account/settings'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isProtectedRoute) {
    // Check for auth cookie
    const cookieHeader = request.headers.get('cookie');
    const hasAuthCookie = cookieHeader?.includes('claimease_auth=');
    
    if (!hasAuthCookie) {
      // No auth cookie, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Verify the JWT token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.slice(7)
      : cookieHeader?.split('claimease_auth=')[1]?.split(';')[0];
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    const decoded = verifyAuthToken(token);
    if (!decoded) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    // Add user info to headers for use in pages
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', decoded.userId);
    requestHeaders.set('x-user-email', decoded.email);
    requestHeaders.set('x-user-name', decoded.name);
    requestHeaders.set('x-user-tier', decoded.tier);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};