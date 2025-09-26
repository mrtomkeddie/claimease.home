'use client';

import { useState } from 'react';

export default function TestTokenValidity() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testToken = async () => {
    if (!email || !token) {
      alert('Please enter both email and token');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/verify-magic-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, email }),
      });

      const data = await response.json();
      setResult({
        status: response.status,
        statusText: response.statusText,
        data: data,
      });
    } catch (error) {
      setResult({
        status: 'error',
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTokenInStore = async () => {
    try {
      const response = await fetch('/api/debug/check-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      setResult({
        status: 'debug',
        debug: data,
      });
    } catch (error) {
      setResult({
        status: 'debug-error',
        error: error.message,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Magic Link Token Validity</h1>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter email used for magic link"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Token:
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
              placeholder="Enter the token from the magic link URL"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={testToken}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Token'}
            </button>
            
            <button
              onClick={checkTokenInStore}
              disabled={!token}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Check Token Store
            </button>
          </div>
        </div>

        {result && (
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Result:</h2>
            <div className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto">
              <pre className="text-sm">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
        
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="text-sm text-yellow-700 space-y-1">
            <li>1. Generate a magic link on the test page</li>
            <li>2. Copy the token from the magic link URL (the long string after "token=")</li>
            <li>3. Paste the token and email here</li>
            <li>4. Click "Test Token" to see why it's failing</li>
          </ol>
        </div>
      </div>
    </div>
  );
}