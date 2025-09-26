import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

// Security: Require JWT_SECRET environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-for-development-only';
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required for production security');
}

const COOKIE_NAME = 'claimease_auth';
const SESSION_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds
const REFRESH_THRESHOLD = 7 * 24 * 60 * 60; // Refresh if less than 7 days left

export interface AuthToken {
  userId: string;
  email: string;
  name: string;
  tier: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface MagicLinkToken {
  email: string;
  token: string;
  used: boolean;
  createdAt: Date;
  expiresAt: Date;
}

export function generateAuthToken(user: any, sessionId?: string): string {
  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    tier: user.tier,
    sessionId: sessionId || randomBytes(16).toString('hex'),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_EXPIRY,
  };

  return jwt.sign(payload, JWT_SECRET);
}

export function generateMagicLinkToken(): string {
  return randomBytes(32).toString('hex');
}

export function verifyAuthToken(token: string): AuthToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthToken;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY,
    domain: process.env.NODE_ENV === 'production' ? 'app.claimease.co.uk' : undefined,
  });
}

export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(COOKIE_NAME);
  return cookie?.value || null;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  
  cookieStore.set(COOKIE_NAME, '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    domain: process.env.NODE_ENV === 'production' ? 'app.claimease.co.uk' : undefined,
  });
}

// Check if token needs refresh (sliding window)
export function shouldRefreshToken(token: AuthToken): boolean {
  const now = Math.floor(Date.now() / 1000);
  const timeUntilExpiry = token.exp - now;
  return timeUntilExpiry < REFRESH_THRESHOLD;
}

// Simple password utilities (use bcrypt in production)
export async function hashPassword(password: string): Promise<string> {
  // Simple hash for development - in production use bcrypt
  const salt = randomBytes(16).toString('hex');
  const hash = require('crypto').pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [salt, hash] = hashedPassword.split(':');
  if (!salt || !hash) return false;
  
  const verifyHash = require('crypto').pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('hex');
  return hash === verifyHash;
}

export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character' };
  }
  
  return { valid: true };
}