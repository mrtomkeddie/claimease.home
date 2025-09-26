'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { registerWithEmail, loginWithEmail, logout } from '@/lib/firebase-auth-simple';

export default function TestEmailAuth() {
  const { user, setUser } = useUser();
  const router = useRouter();
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  // Test user data
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!@#',
    name: 'Test User'
  };

  const testRegistration = async () => {
    setIsTesting(true);
    setTestResult('Testing registration...');
    
    try {
      const result = await registerWithEmail(testUser.email, testUser.password, testUser.name);
      
      if (result.success) {
        setTestResult('✅ Registration successful! User created.');
        
        // Set user in context
        setUser(result.user);
        setTestResult(prev => prev + '\n✅ User set in context successfully!');
        
        // Test login with same credentials
        setTimeout(() => testLogin(), 2000);
      } else {
        setTestResult(`❌ Registration failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Registration test error:', error);
      setTestResult(`❌ Registration error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testLogin = async () => {
    setIsTesting(true);
    setTestResult(prev => prev + '\n\nTesting login...');
    
    try {
      const result = await loginWithEmail(testUser.email, testUser.password);
      
      if (result.success) {
        setTestResult(prev => prev + '\n✅ Login successful! User authenticated.');
        
        // Verify user data matches registration
        if (result.user.email === testUser.email && result.user.name === testUser.name) {
          setTestResult(prev => prev + '\n✅ User data consistent between register and login!');
        } else {
          setTestResult(prev => prev + '\n⚠️  User data mismatch detected');
        }
        
        setTestResult(prev => prev + '\n\n🎉 All tests passed! Authentication system is working correctly.');
      } else {
        setTestResult(prev => prev + `\n❌ Login failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Login test error:', error);
      setTestResult(prev => prev + `\n❌ Login error: ${error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const testCurrentUser = () => {
    if (user) {
      setTestResult(`Current user in context:\n${JSON.stringify(user, null, 2)}`);
    } else {
      setTestResult('No user currently logged in');
    }
  };

  const clearUser = async () => {
    await logout();
    setUser(null);
    setTestResult('User logged out and cleared from context');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Email Authentication Test</h1>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Test Registration & Login</h2>
              <p className="text-gray-600 mb-4">
                This will test creating a new user and then logging in with the same credentials.
              </p>
              
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Test User:</p>
                <p className="text-sm text-gray-600">Email: {testUser.email}</p>
                <p className="text-sm text-gray-600">Password: {testUser.password}</p>
                <p className="text-sm text-gray-600">Name: {testUser.name}</p>
              </div>
              
              <button
                onClick={testRegistration}
                disabled={isTesting}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
              >
                {isTesting ? 'Testing...' : 'Run Registration Test'}
              </button>
              
              <button
                onClick={testLogin}
                disabled={isTesting}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
              >
                {isTesting ? 'Testing...' : 'Test Login Only'}
              </button>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Current User Status</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Status: {user ? '✅ Logged In' : '❌ Not Logged In'}
                </p>
                {user && (
                  <div className="text-sm text-gray-700">
                    <p>Name: {user.name}</p>
                    <p>Email: {user.email}</p>
                    <p>Tier: {user.tier}</p>
                  </div>
                )}
              </div>
              
              <button
                onClick={testCurrentUser}
                className="w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors mb-4"
              >
                Show Full User Data
              </button>
              
              <button
                onClick={clearUser}
                className="w-full bg-red-600 text-white py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Logout & Clear User
              </button>
            </div>
          </div>
          
          {testResult && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Test Results:</h3>
              <pre className="text-sm text-blue-700 whitespace-pre-wrap">{testResult}</pre>
            </div>
          )}
          
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Manual Testing Instructions:</h3>
            <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>Click "Run Registration Test" to create a test user</li>
              <li>The system will automatically test login after successful registration</li>
              <li>Check the "Current User Status" section to verify the user is logged in</li>
              <li>Click "Show Full User Data" to see complete user information</li>
              <li>Click "Logout & Clear User" to test logout functionality</li>
              <li>Try logging in again with the same credentials using "Test Login Only"</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}