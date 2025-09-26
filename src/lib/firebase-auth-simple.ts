import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { auth } from './firebase-client';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  tier: 'free' | 'premium';
  claimCount: number;
  planExpiresAt?: string;
  createdAt: string;
}

// Client-side authentication functions
export const registerWithEmail = async (email: string, password: string, name: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user document in your database (you can customize this)
    const userData: AuthUser = {
      id: user.uid,
      email: user.email!,
      name: name,
      tier: 'free',
      claimCount: 0,
      createdAt: new Date().toISOString()
    };
    
    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get user data from your database (you can customize this)
    const userData: AuthUser = {
      id: user.uid,
      email: user.email!,
      name: user.displayName || '',
      tier: 'free',
      claimCount: 0,
      createdAt: user.metadata.creationTime || new Date().toISOString()
    };
    
    return { success: true, user: userData };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

export const logout = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
};

// Listen for auth state changes
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Simple token verification (client-side only)
export const getCurrentUser = () => {
  return auth.currentUser;
};