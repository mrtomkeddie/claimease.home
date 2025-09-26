'use client';

import { useState } from 'react';

export default function SimpleAuthTest() {
  const [email, setEmail] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generateMagicLink = async () => {
    if (!email) {
      setError('Please enter an email');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setResponse({ status: res.status, data });
      
      if (!res.ok) {
        setError(`HTTP ${res.status}: ${data.message || data.error}`);
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Auth Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Generate Magic Link</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={generateMagicLink}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {error && <div className="text-red-500 mb-4">{error}</div>}
        </div>

        {response && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Response</h2>
            <div className="mb-4">
              <strong>Status:</strong> {response.status}
            </div>
            <div className="mb-4">
              <strong>Response Data:</strong>
              <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded text-sm overflow-x-auto">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
            
            {response.data?.devLink && (
              <div className="mb-4 p-4 bg-green-50 rounded">
                <strong>Magic Link Found!</strong>
                <div className="mt-2 text-sm break-all bg-gray-900 text-green-400 p-2 rounded border overflow-x-auto">
                  {response.data.devLink}
                </div>
                <button
                  onClick={() => window.open(response.data.devLink, '_blank')}
                  className="mt-2 px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                >
                  Open Link
                </button>
              </div>
            )}
            
            {!response.data?.devLink && response.status === 200 && (
              <div className="mb-4 p-4 bg-yellow-50 rounded">
                <strong>⚠️ No devLink found in response</strong>
                <div className="text-sm mt-1">
                  Available keys: {Object.keys(response.data).join(', ')}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}