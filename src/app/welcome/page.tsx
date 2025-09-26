'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { ClaimEaseLogo } from '@/components/ClaimEaseLogo';

export default function WelcomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      verifyStripeSession();
    } else {
      setLoading(false);
      setError('No session ID provided. Please contact support if you believe this is an error.');
    }
  }, [sessionId]);

  const verifyStripeSession = async () => {
    try {
      const response = await fetch('/api/verify-stripe-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Failed to verify session');
      }

      const data = await response.json();
      
      if (data.success && data.user) {
        setUserData(data.user);
        setLoading(false);
      } else {
        throw new Error('Invalid session or session not found');
      }
    } catch (error) {
      console.error('Session verification failed:', error);
      setError('We couldn\'t verify your payment session. Please check your email for login instructions or contact support.');
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Redirect to dashboard or onboarding
    router.push('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <ClaimEaseLogo />
          </div>
          
          <Card className="text-center">
            <CardHeader className="pb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-foreground">Verification Error</CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {error}
              </p>
              
              <div className="pt-4">
                <Button onClick={() => window.location.href = 'mailto:support@claimease.co.uk'} variant="outline">
                  Contact Support
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <ClaimEaseLogo />
        </div>
        
        <Card className="text-center">
          <CardHeader className="pb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-foreground">Welcome to ClaimEase Pro!</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Thank you for your purchase. Your account has been created and your Pro features are now unlocked.
            </p>
            
            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium text-foreground mb-2">Your Plan Includes:</p>
              <ul className="text-left space-y-1 text-muted-foreground">
                <li>• Enhanced PIP claim creation tools</li>
                <li>• Priority support</li>
                <li>• Advanced form validation</li>
                <li>• Export to multiple formats</li>
              </ul>
            </div>

            {userData?.planType && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Plan:</strong> {userData.planType === 'pro' ? 'Pro Plan' : 'Standard Plan'}
                </p>
              </div>
            )}
            
            <div className="pt-4">
              <Button onClick={handleContinue} className="w-full">
                Continue to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
            
            {sessionId && (
              <p className="text-xs text-muted-foreground">
                Session: {sessionId.slice(0, 8)}...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}