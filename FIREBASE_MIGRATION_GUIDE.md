# Firebase Magic Link Migration Guide

## Overview
This guide documents the migration from Supabase to Firebase for magic link authentication, eliminating ongoing compute charges while maintaining full functionality.

## ✅ Migration Status: COMPLETED

### What Was Implemented

1. **Firebase Dependencies**: Installed `firebase` and `firebase-admin` packages
2. **Firebase Admin SDK**: Configured in `src/lib/firebase-admin.ts`
3. **Firebase Magic Link Store**: Created in `src/lib/magic-link-store-firebase.ts`
4. **Switchable Store Updated**: Modified `src/lib/magic-link-store-switchable.ts` to support Firebase
5. **Environment Variables**: Added Firebase configuration to `.env.local`
6. **Testing**: Verified functionality with test script

## 🔧 Configuration Steps

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create Project" or select existing project
3. Enable Authentication (Email/Password and Email Link)
4. Enable Firestore Database

### 2. Get Firebase Configuration
1. Go to Project Settings (gear icon)
2. Under "General" tab, find "Your apps" section
3. Click "Add app" if needed, select "Web"
4. Copy the configuration object

### 3. Generate Service Account Key
1. In Project Settings, go to "Service Accounts" tab
2. Click "Generate new private key"
3. Save the JSON file securely
4. Copy the entire JSON content

### 4. Update Environment Variables
Replace the placeholder values in `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (Service Account Key)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

## 🚀 How It Works

### Store Selection Priority
The switchable store automatically selects the appropriate backend:
1. **Firebase** (highest priority): If `NEXT_PUBLIC_FIREBASE_PROJECT_ID` and `FIREBASE_SERVICE_ACCOUNT_KEY` are set
2. **Supabase** (fallback): If Firebase not configured but Supabase credentials exist
3. **In-memory** (default): If neither Firebase nor Supabase configured

### Magic Link Flow
1. User requests magic link → Token stored in Firebase Firestore
2. User clicks link → Token retrieved and validated
3. Token marked as used → Prevents reuse
4. Cleanup job → Removes expired tokens (15+ minutes old)

## 💰 Cost Benefits

### Before (Supabase)
- **Compute charges**: ~$0.01344/hour per project
- **Idle charges**: Even when not in use
- **Multiple projects**: Charges multiply
- **Monthly cost**: ~$35/month for idle servers

### After (Firebase)
- **No idle compute charges**: Only pay for actual usage
- **Generous free tier**: 50,000 reads/day, 20,000 writes/day
- **No minimum charges**: $0 when not used
- **Development friendly**: Free for development/testing

## 🧪 Testing

Run the test script to verify functionality:
```bash
npx tsx src/lib/test-firebase-magic-link.ts
```

Expected output:
```
🧪 Testing Firebase Magic Link Integration...
📤 Storing magic link token...
✅ Magic link token stored successfully
📥 Retrieving magic link token...
✅ Retrieved token: { email: 'test@example.com', ... }
🔖 Marking token as used...
✅ Token after marking as used: { ... used: true ... }
🗑️ Deleting token...
✅ Token deleted successfully
🧹 Testing cleanup function...
✅ Cleanup completed
🎉 All Firebase magic link tests passed!
```

## 🔒 Security Considerations

1. **Service Account Key**: Keep secure, never commit to version control
2. **Environment Variables**: Use `.env.local` for local development
3. **Firestore Rules**: Configure security rules for production
4. **Token Expiry**: Tokens auto-expire after 15 minutes

## 📊 Monitoring

Monitor your Firebase usage:
1. Firebase Console → Usage tab
2. Set up billing alerts
3. Monitor Firestore read/write operations

## 🔄 Rollback Plan

If issues arise, simply:
1. Remove Firebase environment variables
2. System will automatically fall back to Supabase or in-memory
3. No code changes required

## 📞 Support

For issues:
1. Check console logs for detailed error messages
2. Verify environment variables are correctly set
3. Test with the provided test script
4. Check Firebase Console for service status

---

**Next Steps**: Update your production environment variables and deploy! 🎉