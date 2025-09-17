'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
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
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

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
      getRemainingClaims 
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