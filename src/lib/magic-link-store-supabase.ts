// Supabase-based magic link token store for production use
import { supabase } from '@/lib/supabaseClient';

export interface MagicLinkToken {
  email: string;
  created_at: string;
  used: boolean;
  expires_at: string;
}

export interface MagicLinkStore {
  set(token: string, data: { email: string; createdAt: number }): Promise<void>;
  get(token: string): Promise<MagicLinkToken | null>;
  markAsUsed(token: string): Promise<void>;
  delete(token: string): Promise<void>;
  cleanup(): Promise<void>;
}

export class SupabaseMagicLinkStore implements MagicLinkStore {
  private tableName = 'magic_link_tokens';

  async set(token: string, data: { email: string; createdAt: number }): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Check your environment variables.');
    }
    
    const expiresAt = new Date(data.createdAt + 15 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from(this.tableName)
      .insert({
        token,
        email: data.email,
        created_at: new Date(data.createdAt).toISOString(),
        expires_at: expiresAt,
        used: false
      });

    if (error) {
      console.error('Error storing magic link token:', error);
      throw new Error('Failed to store magic link token');
    }
  }

  async get(token: string): Promise<MagicLinkToken | null> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Check your environment variables.');
    }
    
    const { data, error } = await supabase
      .from(this.tableName)
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      console.error('Error retrieving magic link token:', error);
      return null;
    }

    return data as MagicLinkToken;
  }

  async markAsUsed(token: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Check your environment variables.');
    }
    
    const { error } = await supabase
      .from(this.tableName)
      .update({ used: true })
      .eq('token', token);

    if (error) {
      console.error('Error marking token as used:', error);
      throw new Error('Failed to mark token as used');
    }
  }

  async delete(token: string): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Check your environment variables.');
    }
    
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq('token', token);

    if (error) {
      console.error('Error deleting magic link token:', error);
      throw new Error('Failed to delete magic link token');
    }
  }

  async cleanup(): Promise<void> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Check your environment variables.');
    }
    
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) {
      console.error('Error cleaning up expired tokens:', error);
      throw new Error('Failed to clean up expired tokens');
    }
  }
}

// Singleton instance
export const magicLinkStore = new SupabaseMagicLinkStore();