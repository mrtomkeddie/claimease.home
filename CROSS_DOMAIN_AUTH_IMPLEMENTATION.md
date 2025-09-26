# Cross-Domain JWT Authentication Implementation

## Overview
This implementation enables seamless auto-login from www.claimease.co.uk (landing page) to app.claimease.co.uk (actual app) using JWT domain-wide cookies.

## How It Works

### 1. Landing Page (www.claimease.co.uk)
- User completes payment on landing page
- JWT token is generated and stored in domain-wide cookie (`.claimease.co.uk`)
- User is redirected to app.claimease.co.uk with JWT token in URL parameter

### 2. App Domain (app.claimease.co.uk)
- App receives JWT token via URL parameter
- App verifies token with landing page API
- App sets its own authentication session
- App redirects user to dashboard/account page

## Implementation Steps for app.claimease.co.uk

### 1. Install Dependencies
```bash
npm install jsonwebtoken
```

### 2. Create JWT Verification Function
Create a utility to verify tokens from the landing page:

```typescript
// app/lib/auth/verifyLandingToken.ts
export async function verifyLandingToken(token: string) {
  try {
    const response = await fetch(`https://www.claimease.co.uk/api/auth/verify-token?token=${token}`);
    const data = await response.json();
    
    if (data.success) {
      return data.user; // { id, email, name, tier }
    }
    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}
```

### 3. Create Auth Callback Page
Create a page to handle the authentication callback:

```typescript
// app/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyLandingToken } from '@/lib/auth/verifyLandingToken';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      router.push('/login');
      return;
    }

    verifyLandingToken(token).then(user => {
      if (user) {
        // Create session in your app
        // This depends on your app's authentication system
        
        // Example for NextAuth:
        // signIn('credentials', { token, redirect: false })
        
        // Example for custom auth:
        // await createUserSession(user);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        // Token invalid, redirect to login
        router.push('/login?error=invalid_token');
      }
    });
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Completing sign-in...</p>
      </div>
    </div>
  );
}
```

### 4. Environment Variables
Add to your `.env` file:
```bash
# Landing page domain
LANDING_PAGE_URL=https://www.claimease.co.uk

# Your app domain
NEXT_PUBLIC_APP_URL=https://app.claimease.co.uk
```

### 5. CORS Configuration
Ensure your landing page API allows requests from the app domain:

```typescript
// In your landing page API routes (www.claimease.co.uk)
const allowedOrigins = ['https://app.claimease.co.uk'];

export async function GET(request: NextRequest) {
  // Add CORS headers
  const origin = request.headers.get('origin');
  const headers = new Headers();
  
  if (origin && allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }
  
  headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers });
  }
  
  // Your existing API logic...
}
```

### 6. Session Management
Implement your app's session creation logic:

```typescript
// app/lib/auth/createSession.ts
export async function createUserSession(user: any) {
  // This depends on your app's authentication system
  // Examples:
  
  // For NextAuth:
  // await signIn('credentials', { userId: user.id, redirect: false });
  
  // For custom JWT:
  // const appToken = generateAppToken(user);
  // cookies().set('app_auth', appToken);
  
  // For database sessions:
  // const sessionId = await createDatabaseSession(user.id);
  // cookies().set('session_id', sessionId);
  
  return true;
}
```

## Security Considerations

### 1. Token Security
- JWT tokens expire after 30 days
- Tokens are signed with a secret key
- Use HTTPS for all communications

### 2. Domain Security
- Domain-wide cookies work across subdomains
- Ensure both domains use HTTPS
- Validate all token verifications

### 3. Rate Limiting
- Implement rate limiting on the token verification endpoint
- Monitor for suspicious authentication attempts

## Testing the Flow

### 1. Complete Purchase Flow
1. Go to www.claimease.co.uk
2. Complete the onboarding and payment process
3. You should be redirected to app.claimease.co.uk/auth/callback?token=...

### 2. Verify Auto-Login
1. Check that you're automatically logged in on app.claimease.co.uk
2. Verify your user data is correctly populated
3. Check that you can access protected routes

### 3. Error Handling
1. Test with invalid tokens
2. Test with expired tokens
3. Test network failures

## Monitoring

### 1. Analytics
Track successful auto-logins:
```typescript
// In your auth callback
analytics.track('Auto Login Success', {
  userId: user.id,
  landingPage: 'www.claimease.co.uk',
  timestamp: new Date().toISOString()
});
```

### 2. Error Logging
Log authentication failures:
```typescript
// In your auth callback
catch (error) {
  console.error('Auto login failed:', error);
  // Send to your error tracking service
  errorTracker.captureException(error);
}
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure CORS headers are properly set
   - Check domain whitelist

2. **Token Verification Failures**
   - Verify JWT secret keys match
   - Check token expiration
   - Ensure HTTPS is used

3. **Cookie Issues**
   - Domain-wide cookies require proper domain configuration
   - Check cookie settings in browser dev tools

4. **Redirect Loops**
   - Ensure proper error handling
   - Check authentication state before redirecting

### Debug Steps
1. Check browser network tab for API calls
2. Verify JWT token in URL parameters
3. Test token verification endpoint directly
4. Check server logs for errors

## Production Checklist

- [ ] HTTPS enabled on both domains
- [ ] Environment variables configured
- [ ] CORS properly configured
- [ ] Error handling implemented
- [ ] Analytics tracking added
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Monitoring alerts set up
- [ ] User session management tested
- [ ] Cross-domain authentication verified