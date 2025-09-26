import { NextRequest, NextResponse } from 'next/server';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if this is a registration request (has name field)
    const isRegistration = !!name;

    try {
      if (isRegistration) {
        // Register new user
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update user profile with name
        if (name) {
          await updateProfile(result.user, { displayName: name });
        }

        return NextResponse.json({
          success: true,
          user: {
            id: result.user.uid,
            email: result.user.email,
            name: name || '',
            tier: 'free',
            claimCount: 0,
            created_at: result.user.metadata.creationTime
          }
        });
      } else {
        // Login existing user
        const result = await signInWithEmailAndPassword(auth, email, password);
        
        return NextResponse.json({
          success: true,
          user: {
            id: result.user.uid,
            email: result.user.email,
            name: result.user.displayName || '',
            tier: 'free',
            claimCount: 0,
            created_at: result.user.metadata.creationTime
          }
        });
      }
    } catch (firebaseError: any) {
      // Handle Firebase specific errors
      let errorMessage = 'Authentication failed';
      
      switch (firebaseError.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email already in use';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password authentication is not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        case 'auth/user-disabled':
          errorMessage = 'User account is disabled';
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password';
          break;
        default:
          errorMessage = firebaseError.message || 'Authentication failed';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}