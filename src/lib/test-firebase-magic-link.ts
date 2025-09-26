import { magicLinkStore } from '@/lib/magic-link-store-switchable';

export async function testFirebaseMagicLink() {
  console.log('🧪 Testing Firebase Magic Link Integration...');
  
  try {
    // Test 1: Store a magic link token
    const testToken = 'test-token-' + Date.now();
    const testEmail = 'test@example.com';
    const testTimestamp = Date.now();
    
    console.log('📤 Storing magic link token...');
    await magicLinkStore.set(testToken, {
      email: testEmail,
      createdAt: testTimestamp
    });
    console.log('✅ Magic link token stored successfully');
    
    // Test 2: Retrieve the stored token
    console.log('📥 Retrieving magic link token...');
    const retrievedToken = await magicLinkStore.get(testToken);
    console.log('✅ Retrieved token:', retrievedToken);
    
    if (!retrievedToken) {
      throw new Error('Token not found after storing');
    }
    
    if (retrievedToken.email !== testEmail) {
      throw new Error('Email mismatch in retrieved token');
    }
    
    // Test 3: Mark token as used
    console.log('🔖 Marking token as used...');
    await magicLinkStore.markAsUsed(testToken);
    
    const usedToken = await magicLinkStore.get(testToken);
    console.log('✅ Token after marking as used:', usedToken);
    
    if (!usedToken?.used) {
      throw new Error('Token was not marked as used');
    }
    
    // Test 4: Delete the token
    console.log('🗑️ Deleting token...');
    await magicLinkStore.delete(testToken);
    
    const deletedToken = await magicLinkStore.get(testToken);
    if (deletedToken) {
      throw new Error('Token still exists after deletion');
    }
    console.log('✅ Token deleted successfully');
    
    // Test 5: Cleanup function
    console.log('🧹 Testing cleanup function...');
    await magicLinkStore.cleanup();
    console.log('✅ Cleanup completed');
    
    console.log('🎉 All Firebase magic link tests passed!');
    return { success: true, message: 'Firebase magic link integration working correctly' };
    
  } catch (error) {
    console.error('❌ Firebase magic link test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  testFirebaseMagicLink().then(result => {
    console.log('Test result:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}