import { adminFirestore } from '@/lib/firebase-admin';
import { MagicLinkStore, MagicLinkToken } from '@/lib/magic-link-store-switchable';

export class FirebaseMagicLinkStore implements MagicLinkStore {
  private collection = 'magic_link_tokens';

  async set(token: string, data: { email: string; createdAt: number }): Promise<void> {
    try {
      const tokenData: MagicLinkToken = {
        email: data.email,
        createdAt: data.createdAt,
        used: false,
        created_at: new Date(data.createdAt).toISOString()
      };

      await adminFirestore
        .collection(this.collection)
        .doc(token)
        .set(tokenData);

      console.log(`Firebase magic link stored for ${data.email}`);
    } catch (error) {
      console.error('Error storing magic link in Firebase:', error);
      throw new Error('Failed to store magic link');
    }
  }

  async get(token: string): Promise<MagicLinkToken | null> {
    try {
      const doc = await adminFirestore
        .collection(this.collection)
        .doc(token)
        .get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data() as MagicLinkToken;
      return data;
    } catch (error) {
      console.error('Error retrieving magic link from Firebase:', error);
      return null;
    }
  }

  async markAsUsed(token: string): Promise<void> {
    try {
      await adminFirestore
        .collection(this.collection)
        .doc(token)
        .update({ used: true });

      console.log(`Firebase magic link marked as used: ${token}`);
    } catch (error) {
      console.error('Error marking magic link as used in Firebase:', error);
      throw new Error('Failed to mark magic link as used');
    }
  }

  async delete(token: string): Promise<void> {
    try {
      await adminFirestore
        .collection(this.collection)
        .doc(token)
        .delete();

      console.log(`Firebase magic link deleted: ${token}`);
    } catch (error) {
      console.error('Error deleting magic link from Firebase:', error);
      throw new Error('Failed to delete magic link');
    }
  }

  async cleanup(): Promise<void> {
    try {
      const fifteenMinutesAgo = Date.now() - (15 * 60 * 1000);
      
      const snapshot = await adminFirestore
        .collection(this.collection)
        .where('createdAt', '<', fifteenMinutesAgo)
        .get();

      const batch = adminFirestore.batch();
      let deletedCount = 0;

      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
        deletedCount++;
      });

      if (deletedCount > 0) {
        await batch.commit();
        console.log(`Firebase cleanup completed: ${deletedCount} expired tokens deleted`);
      } else {
        console.log('Firebase cleanup completed: no expired tokens found');
      }
    } catch (error) {
      console.error('Error during Firebase cleanup:', error);
      // Don't throw error for cleanup failures
    }
  }
}

// Singleton instance
export const magicLinkStore = new FirebaseMagicLinkStore();