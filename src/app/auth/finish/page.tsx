'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';

export default function MagicLinkFinish() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useUser();
  const [status, setStatus] = useState('Processing your sign-in...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    
    if (!token || !email) {
      setError('Invalid magic link');
      setStatus('Invalid magic link');
      return;
    }

    // Verify the magic link token
    fetch('/api/auth/verify-magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token, email }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Set user in context with data from magic link auth
          const userData = {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            tier: data.user.tier || 'free',
            plan_expires_at: data.user.plan_expires_at,
            created_at: data.user.created_at || new Date().toISOString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            pip_focus: ['mobility', 'daily_living'], // Default focus areas
            claims_used: 0,
            claims_remaining: data.user.tier === 'unlimited_claims' ? -1 : 
                             data.user.tier === 'single_claim' ? 1 : 
                             data.user.tier === 'standard' ? 2 : 
                             data.user.tier === 'pro' ? 5 : 1,
          };
          
          setUser(userData);
          setStatus('Sign-in successful! Redirecting...');
          setTimeout(() => {
            router.push('/account');
          }, 1500);
        } else {
          setError(data.message || 'Sign-in failed');
          setStatus(`Sign-in failed: ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Magic link verification error:', error);
        setError('Sign-in failed. Please try again.');
        setStatus('Sign-in failed. Please try again.');
      });
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        {!error ? (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        ) : (
          <div className="text-red-500 text-4xl mb-4">✗</div>
        )}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {error ? 'Sign-in Failed' : 'Signing You In'}
        </h1>
        <p className="text-gray-600 mb-4">{status}</p>
        {error && (
          <button
            onClick={() => router.push('/login')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}