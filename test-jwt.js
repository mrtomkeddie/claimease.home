const jwt = require('jsonwebtoken');

const JWT_SECRET = 'claimease-super-secret-jwt-key-change-in-production-2024';

const payload = {
  userId: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  tier: 'premium',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
};

const token = jwt.sign(payload, JWT_SECRET);
console.log('Generated JWT token:');
console.log(token);

// Verify the token
const decoded = jwt.verify(token, JWT_SECRET);
console.log('\nDecoded token:');
console.log(JSON.stringify(decoded, null, 2));