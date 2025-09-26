'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function TestAuthFlow() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLink, setMagicLink] = useState('');
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const generateMagicLink = async () => {
    if (!email) {
      setError('Please enter an email');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      console.log('Generating magic link for:', email);
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
          setSuccess('Magic link generated! Check your email or use the dev link below.');
          const link = data.devLink || data.magicLink || data.link || '';
          setMagicLink(link);
          console.log('Magic link set:', link);
          console.log('Full response data:', data);
          
          if (!link) {
            console.warn('No magic link found in response. Available fields:', Object.keys(data));
            setDebugInfo(`Response keys: ${Object.keys(data).join(', ')}`);
          } else {
            setDebugInfo('');
          }
        } else {
          setError(data.message || data.error || 'Failed to generate magic link');
        }
    } catch (err) {
      console.error('Magic link error:', err);
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testUserProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/me', {
        method: 'GET',
        credentials: 'include', // Important for cookies
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        setSuccess('User profile retrieved successfully!');
      } else {
        setError(data.error || 'Failed to get user profile');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const testUserUpgrade = async () => {
    if (!user) {
      setError('Please get user profile first');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          email: user.email,
          name: user.email.split('@')[0],
          planType: 'pro'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Upgrade initiated! Checkout URL: ' + (data.checkout_url || data.session_id));
        if (data.checkout_url && !data.checkout_url.includes('demo')) {
          window.open(data.checkout_url, '_blank');
        }
      } else {
        setError(data.error || 'Failed to initiate upgrade');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Authentication Flow Test</h1>
          <p className="text-gray-600">Test the complete magic link authentication flow</p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {debugInfo && (
          <Alert variant="default" className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">Debug: {debugInfo}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Step 1: Generate Magic Link</CardTitle>
            <CardDescription>Enter your email to generate a magic link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={generateMagicLink} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Link'}
              </Button>
            </div>

            {magicLink && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <p className="text-sm font-medium mb-2">Development Link:</p>
                <div className="flex gap-2">
                  <code className="flex-1 text-xs bg-gray-900 text-green-400 p-2 rounded border overflow-x-auto">
                    {magicLink}
                  </code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(magicLink)}>
                    Copy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => window.open(magicLink, '_blank')}>
                    Open
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Test User Profile</CardTitle>
            <CardDescription>After clicking the magic link, test accessing your profile</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testUserProfile} disabled={loading}>
              {loading ? 'Testing...' : 'Get User Profile'}
            </Button>

            {user && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">User Profile:</h3>
                <pre className="text-sm text-green-800 overflow-x-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 3: Test User Upgrade</CardTitle>
            <CardDescription>Test the Stripe upgrade flow (demo mode)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testUserUpgrade} disabled={loading || !user}>
              {loading ? 'Upgrading...' : 'Test Upgrade to Pro'}
            </Button>
          </CardContent>
        </Card>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Enter your email and generate a magic link</li>
            <li>2. Click the development link or check your email</li>
            <li>3. After authentication, test your user profile</li>
            <li>4. Test the upgrade flow (uses demo mode)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}