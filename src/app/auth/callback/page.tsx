'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('No authentication token provided');
      return;
    }

    // In a real implementation, this would be on app.claimease.co.uk
    // For now, we'll just verify the token and redirect
    fetch(`/api/auth/verify-token?token=${token}`)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setStatus('Authentication successful! Redirecting...');
          setTimeout(() => {
            router.push('/account');
          }, 1500);
        } else {
          setStatus(`Authentication failed: ${data.message}`);
        }
      })
      .catch(error => {
        console.error('Auth callback error:', error);
        setStatus('Authentication failed. Please try again.');
      });
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Authenticating</h1>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}