'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthChange } from '@/lib/firebase-auth-simple';
import { UserTier, UserTierType, CLAIM_LIMITS } from '@/lib/constants';

export interface User {
  id?: string;
  name: string;
  email: string;
  timezone: string;
  pip_focus: string[];
  created_at: string;
  tier: UserTierType;
  claims_used: number;
  claims_remaining: number;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  canCreateClaim: () => boolean;
  incrementClaimCount: () => void;
  getRemainingClaims: () => number;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Convert Firebase user to your app user format
        const appUser: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
          timezone: 'UTC',
          pip_focus: [],
          created_at: firebaseUser.metadata.creationTime || new Date().toISOString(),
          tier: UserTier.FREE_CLAIMS,
          claims_used: 0,
          claims_remaining: CLAIM_LIMITS[UserTier.FREE_CLAIMS]
        };
        setUser(appUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const canCreateClaim = (): boolean => {
    if (!user) return false;
    if (user.tier === UserTier.UNLIMITED_CLAIMS) return true;
    return user.claims_used < CLAIM_LIMITS[user.tier];
  };

  const incrementClaimCount = (): void => {
    if (!user) return;
    setUser({
      ...user,
      claims_used: user.claims_used + 1,
      claims_remaining: user.tier === UserTier.UNLIMITED_CLAIMS 
        ? -1 
        : Math.max(0, CLAIM_LIMITS[user.tier] - (user.claims_used + 1))
    });
  };

  const getRemainingClaims = (): number => {
    if (!user) return 0;
    if (user.tier === UserTier.UNLIMITED_CLAIMS) return -1;
    return Math.max(0, CLAIM_LIMITS[user.tier] - user.claims_used);
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      canCreateClaim, 
      incrementClaimCount, 
      getRemainingClaims,
      loading
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}