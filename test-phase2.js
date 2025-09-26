// Test script for Phase 2 implementation
// This script tests the magic link authentication and user upgrade functionality

const testPhase2 = async () => {
  console.log('🧪 Testing Phase 2 Implementation...\n');

  // Test 1: Magic Link Generation
  console.log('1️⃣ Testing Magic Link Generation...');
  try {
    const response = await fetch('http://localhost:3000/api/auth/magic-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User'
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Magic link generated successfully');
      console.log('   - Token:', data.token ? 'Present' : 'Missing');
      console.log('   - Dev Link:', data.devLink ? 'Present' : 'Missing');
      console.log('   - User Exists:', data.userExists);
      console.log('   - User Plan:', data.userPlan);
    } else {
      console.log('❌ Magic link generation failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Magic link generation error:', error.message);
  }

  // Test 2: User Upgrade Endpoint
  console.log('\n2️⃣ Testing User Upgrade Endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/user/upgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        name: 'Test User',
        planType: 'pro'
      }),
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Upgrade endpoint accessible');
      console.log('   - Success:', data.success);
      console.log('   - Checkout URL:', data.checkout_url ? 'Present' : 'Missing');
      console.log('   - Session ID:', data.session_id);
    } else {
      console.log('❌ Upgrade endpoint failed:', data.error);
      console.log('   - Status:', response.status);
      console.log('   - This is expected if user doesn\'t exist in database');
    }
  } catch (error) {
    console.log('❌ Upgrade endpoint error:', error.message);
  }

  // Test 3: User Profile Endpoint
  console.log('\n3️⃣ Testing User Profile Endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/user/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User profile endpoint accessible');
      console.log('   - User Data:', data);
    } else {
      console.log('❌ User profile endpoint failed:', data.error);
      console.log('   - Status:', response.status);
      console.log('   - This is expected without authentication');
    }
  } catch (error) {
    console.log('❌ User profile endpoint error:', error.message);
  }

  // Test 4: Stripe Webhook Endpoint
  console.log('\n4️⃣ Testing Stripe Webhook Endpoint...');
  try {
    const response = await fetch('http://localhost:3000/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'test'
      }),
    });

    const data = await response.json();
    
    if (response.status === 400) {
      console.log('✅ Stripe webhook endpoint accessible (signature validation working)');
      console.log('   - Error:', data.error);
      console.log('   - This is expected without proper webhook signature');
    } else {
      console.log('❌ Unexpected webhook response:', data);
    }
  } catch (error) {
    console.log('❌ Stripe webhook endpoint error:', error.message);
  }

  console.log('\n🎉 Phase 2 Testing Complete!');
  console.log('\nNext Steps:');
  console.log('1. Test magic link authentication flow in browser');
  console.log('2. Test user upgrade flow with Stripe integration');
  console.log('3. Configure Stripe webhook endpoint in Stripe dashboard');
  console.log('4. Set up environment variables for production');
};

// Run the tests
testPhase2().catch(console.error);