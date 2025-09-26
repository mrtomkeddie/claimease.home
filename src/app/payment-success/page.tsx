'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, setUser } = useUser();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your upgrade...');

  useEffect(() => {
    const upgradeStatus = searchParams.get('upgrade');
    const sessionId = searchParams.get('session_id');

    if (upgradeStatus === 'success' && sessionId) {
      // Wait a moment for the webhook to process
      setTimeout(async () => {
        try {
          // Refresh user data
          const response = await fetch('/api/user/me', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            setStatus('success');
            setMessage('Your account has been upgraded successfully!');
          } else {
            throw new Error('Failed to refresh user data');
          }
        } catch (error) {
          console.error('Error refreshing user data:', error);
          setStatus('error');
          setMessage('Payment successful, but there was an issue updating your account. Please refresh the page or contact support.');
        }
      }, 2000); // Wait 2 seconds for webhook processing
    } else if (upgradeStatus === 'cancelled') {
      setStatus('error');
      setMessage('Your upgrade was cancelled. You can try again anytime.');
    } else {
      setStatus('error');
      setMessage('Invalid payment status.');
    }
  }, [searchParams, setUser]);

  const handleGoToAccount = () => {
    router.push('/account');
  };

  const handleTryAgain = () => {
    router.push('/account');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              </div>
              <CardTitle>Processing Upgrade</CardTitle>
              <CardDescription>Please wait while we process your payment...</CardDescription>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle>Upgrade Successful!</CardTitle>
              <CardDescription>Your account has been upgraded to Pro</CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <CardTitle>Payment Status</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-gray-600">{message}</p>
          
          {status === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Pro Plan Benefits:</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Unlimited claims processing</li>
                <li>• Priority support</li>
                <li>• Advanced analytics</li>
                <li>• Custom integrations</li>
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            {status === 'error' && (
              <Button
                onClick={handleTryAgain}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
            )}
            <Button
              onClick={handleGoToAccount}
              className="flex-1"
            >
              Go to Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}