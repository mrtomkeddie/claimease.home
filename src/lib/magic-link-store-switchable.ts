// Switchable magic link store - supports in-memory, Supabase, and Firebase
import { magicLinkStore as inMemoryStore } from '@/lib/magic-link-store';
import { magicLinkStore as supabaseMagicLinkStore, SupabaseMagicLinkStore } from '@/lib/magic-link-store-supabase';
import { magicLinkStore as firebaseMagicLinkStore, FirebaseMagicLinkStore } from '@/lib/magic-link-store-firebase';

export interface MagicLinkToken {
  email: string;
  created_at?: string;
  createdAt?: number;
  used: boolean;
  expires_at?: string;
}

export interface MagicLinkStore {
  set(token: string, data: { email: string; createdAt: number }): Promise<void>;
  get(token: string): Promise<MagicLinkToken | null>;
  markAsUsed(token: string): Promise<void>;
  delete(token: string): Promise<void>;
  cleanup(): Promise<void>;
}

// Create a wrapper that switches between stores based on environment
class SwitchableMagicLinkStore implements MagicLinkStore {
  private storeType: 'in-memory' | 'supabase' | 'firebase';
  private inMemoryStore = inMemoryStore;
  private supabaseStore: SupabaseMagicLinkStore;
  private firebaseStore: FirebaseMagicLinkStore;

  constructor() {
    // Determine which store to use based on environment variables
    const useFirebase = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID && process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const useSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Priority: Firebase > Supabase > In-memory
    if (useFirebase) {
      this.storeType = 'firebase';
      this.firebaseStore = firebaseMagicLinkStore;
      console.log('Using Firebase magic link store');
    } else if (useSupabase) {
      this.storeType = 'supabase';
      this.supabaseStore = supabaseMagicLinkStore;
      console.log('Using Supabase magic link store');
    } else {
      this.storeType = 'in-memory';
      console.log('Using in-memory magic link store');
    }
  }

  async set(token: string, data: { email: string; createdAt: number }): Promise<void> {
    switch (this.storeType) {
      case 'firebase':
        return this.firebaseStore.set(token, data);
      case 'supabase':
        return this.supabaseStore.set(token, data);
      case 'in-memory':
      default:
        // Convert to in-memory format
        (this.inMemoryStore as any).set(token, { email: data.email, createdAt: data.createdAt, used: false });
    }
  }

  async get(token: string): Promise<MagicLinkToken | null> {
    switch (this.storeType) {
      case 'firebase':
        return this.firebaseStore.get(token);
      case 'supabase':
        return this.supabaseStore.get(token);
      case 'in-memory':
      default:
        const data = (this.inMemoryStore as any).get(token);
        return data ? { ...data, created_at: data.createdAt ? new Date(data.createdAt).toISOString() : undefined } : null;
    }
  }

  async markAsUsed(token: string): Promise<void> {
    switch (this.storeType) {
      case 'firebase':
        return this.firebaseStore.markAsUsed(token);
      case 'supabase':
        return this.supabaseStore.markAsUsed(token);
      case 'in-memory':
      default:
        const data = (this.inMemoryStore as any).get(token);
        if (data) {
          data.used = true;
          (this.inMemoryStore as any).set(token, data);
        }
    }
  }

  async delete(token: string): Promise<void> {
    switch (this.storeType) {
      case 'firebase':
        return this.firebaseStore.delete(token);
      case 'supabase':
        return this.supabaseStore.delete(token);
      case 'in-memory':
      default:
        (this.inMemoryStore as any).delete(token);
    }
  }

  async cleanup(): Promise<void> {
    switch (this.storeType) {
      case 'firebase':
        return this.firebaseStore.cleanup();
      case 'supabase':
        return this.supabaseStore.cleanup();
      case 'in-memory':
      default:
        // In-memory cleanup logic
        const now = Date.now();
        const tokens = (this.inMemoryStore as any).tokens;
        if (tokens) {
          for (const [token, data] of tokens.entries()) {
            if (now - data.createdAt > 15 * 60 * 1000) { // 15 minutes
              tokens.delete(token);
            }
          }
        }
    }
  }
}

// Singleton instance
export const magicLinkStore = new SwitchableMagicLinkStore();