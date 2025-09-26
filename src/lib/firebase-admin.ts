import { initializeApp, cert, getApps, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Firebase Admin SDK configuration for server-side operations
let app;

if (getApps().length === 0) {
  try {
    // Check if service account is available (production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        
        app = initializeApp({
          credential: cert(serviceAccount),
          databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });
      } catch (parseError) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', parseError);
        console.warn('Falling back to alternative Firebase configuration');
        // Continue to next configuration option
      }
    } 
    // Check if we have individual environment variables (alternative setup)
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      app = initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL
        })
      });
    }
    // Fallback to no credentials (will use application default credentials)
    else {
      console.warn('Firebase Admin SDK: No service account credentials found, using default credentials');
      app = initializeApp();
    }
    
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
} else {
  app = getApp();
}

// Export initialized services
export const adminAuth = app ? getAuth(app) : null;
export const adminFirestore = app ? getFirestore(app) : null;

// Helper function to check if Firebase is properly configured
export const isFirebaseConfigured = (): boolean => {
  return !!(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || 
           (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL));
};

export default app;