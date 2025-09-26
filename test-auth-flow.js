const axios = require('axios');

// Create axios instance with cookie support
const axiosInstance = axios.create({
  withCredentials: true,
  maxRedirects: 0,
  validateStatus: function (status) {
    return status >= 200 && status < 400; // Accept redirects
  }
});

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');
  
  const testEmail = 'test@example.com';
  
  try {
    // Step 1: Generate magic link
    console.log('1️⃣ Generating magic link...');
    const magicLinkResponse = await axiosInstance.post('http://localhost:3000/api/auth/magic-link', {
      email: testEmail
    });
    
    console.log('✅ Magic link generated:', magicLinkResponse.data.message);
    console.log('   Dev link:', magicLinkResponse.data.devLink);
    
    // Step 2: Extract token from dev link
    const devLink = magicLinkResponse.data.devLink;
    const token = devLink.split('token=')[1].split('&')[0]; // Extract just the token part
    
    console.log('\n2️⃣ Verifying magic link token...');
    
    // First verify the magic link token to get the JWT token
    const verifyResponse = await axiosInstance.post('http://localhost:3000/api/auth/verify-magic-link', {
      token: token,
      email: testEmail
    });
    
    if (verifyResponse.data.success) {
      console.log('✅ Magic link verified successfully');
      console.log('   User:', verifyResponse.data.user);
      
      // Extract cookie from response headers
      const setCookieHeader = verifyResponse.headers['set-cookie'];
      let authCookie = '';
      if (setCookieHeader) {
        authCookie = setCookieHeader[0].split(';')[0]; // Get the first cookie
        console.log('   Cookie extracted:', authCookie);
      }
      
      // Step 3: Test user profile with the session
      console.log('\n3️⃣ Testing user profile endpoint...');
      const profileResponse = await axiosInstance.get('http://localhost:3000/api/user/me', {
        headers: {
          'Cookie': authCookie
        }
      });
      
      console.log('✅ User profile retrieved:', {
        email: profileResponse.data.email,
        tier: profileResponse.data.tier,
        claims_remaining: profileResponse.data.claims_remaining
      });
    
    // Step 4: Test user upgrade endpoint
      console.log('\n4️⃣ Testing user upgrade endpoint...');
      const upgradeResponse = await axiosInstance.post('http://localhost:3000/api/user/upgrade', {
        email: verifyResponse.data.user.email,
        name: verifyResponse.data.user.name,
        planType: 'pro'
      }, {
        headers: {
          'Cookie': authCookie
        }
      });
      
      console.log('✅ Upgrade endpoint response:', upgradeResponse.data.message);
    console.log('   Checkout URL:', upgradeResponse.data.checkout_url || upgradeResponse.data.session_id);
      
      console.log('\n🎉 Authentication flow test completed successfully!');
    } else {
      console.log('❌ Magic link verification failed:', verifyResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testAuthFlow();