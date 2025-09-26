# Supabase Magic Link Setup Guide

This guide will help you set up Supabase for persistent magic link token storage in production.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com) if you haven't already
2. **Project**: Create a new Supabase project or use an existing one
3. **Environment Variables**: Make sure you have these in your `.env.local` file:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Step 1: Set up the Database Table

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Copy and paste the SQL from `supabase/migrations/20240101000000_create_magic_link_tokens.sql`
4. Click **Run** to execute the SQL and create the table

## Step 2: Verify Table Creation

After running the SQL, you should have a `magic_link_tokens` table with these columns:
- `id` (UUID, primary key)
- `token` (Text, unique)
- `email` (Text)
- `created_at` (Timestamp with timezone)
- `expires_at` (Timestamp with timezone)
- `used` (Boolean, default false)

## Step 3: Test the Setup

### Development Mode (In-Memory)
The system will automatically use in-memory storage in development:

```bash
npm run dev
```

### Production Mode (Supabase)
When you deploy to production with the Supabase environment variables set, it will automatically use Supabase storage.

## Step 4: Optional - Set up Automatic Cleanup

You can set up a cron job or scheduled function to clean up expired tokens:

1. In your Supabase dashboard, go to **Database** > **Functions**
2. Create a new function that calls `cleanup_expired_magic_link_tokens()`
3. Set up a cron job to run this function daily

## Benefits of Using Supabase

1. **Persistence**: Tokens survive server restarts
2. **Scalability**: Works across multiple server instances
3. **Security**: Database-level security and RLS policies
4. **Analytics**: Track magic link usage patterns
5. **Cleanup**: Automatic cleanup of expired tokens

## Monitoring

You can monitor your magic link usage in the Supabase dashboard:
- Go to **Table Editor** > **magic_link_tokens**
- View token creation and usage patterns
- Check for any suspicious activity

## Troubleshooting

If you encounter issues:

1. **Check Environment Variables**: Ensure Supabase credentials are correct
2. **Table Permissions**: Verify RLS policies are properly configured
3. **Network Issues**: Check if your server can reach Supabase
4. **Database Connection**: Monitor connection limits and performance

## Migration from In-Memory

The switch is seamless - just set the environment variables and the system will automatically use Supabase. No code changes needed!