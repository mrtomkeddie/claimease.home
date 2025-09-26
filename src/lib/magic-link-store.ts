// Simple in-memory magic link token store (replace with database in production)
export interface MagicLinkToken {
  email: string;
  createdAt: number;
  used: boolean;
}

// Global store to persist across hot reloads in development
const globalStore = (global as any).magicLinkGlobalStore || new Map<string, MagicLinkToken>();
(global as any).magicLinkGlobalStore = globalStore;

class MagicLinkStore {
  private tokens = globalStore;

  set(token: string, data: MagicLinkToken): void {
    this.tokens.set(token, data);
  }

  get(token: string): MagicLinkToken | undefined {
    return this.tokens.get(token);
  }

  delete(token: string): boolean {
    return this.tokens.delete(token);
  }

  clear(): void {
    this.tokens.clear();
  }

  // Mark token as used
  async markAsUsed(token: string): Promise<void> {
    const tokenData = this.tokens.get(token);
    if (tokenData) {
      tokenData.used = true;
      this.tokens.set(token, tokenData);
    }
  }

  // Clean up expired tokens (optional cleanup method)
  cleanup(): void {
    const now = Date.now();
    const expiredTokens: string[] = [];
    
    for (const [token, data] of this.tokens.entries()) {
      if (now - data.createdAt > 15 * 60 * 1000) { // 15 minutes
        expiredTokens.push(token);
      }
    }
    
    expiredTokens.forEach(token => this.tokens.delete(token));
  }
}

// Singleton instance
export const magicLinkStore = new MagicLinkStore();