# StudentOS - Supabase Integration Setup Guide

This guide explains the database schema, authentication setup, and API integration for StudentOS.

## Database Schema

### Tables Overview

#### 1. **profiles** (Auto-created via trigger)
Stores user profile information automatically created when a new user signs up.

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies**:
- Users can only view their own profile
- Users can only insert/update their own profile
- Users can only delete their own profile

#### 2. **uploads**
Stores metadata about uploaded files.

```sql
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies**:
- Users can only view their own uploads
- Users can only insert/delete their own uploads

#### 3. **processing_results**
Stores AI processing results with structured JSON data.

```sql
CREATE TABLE public.processing_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_id UUID REFERENCES public.uploads(id) ON DELETE CASCADE,
  result_type TEXT NOT NULL,
  result_data JSONB,
  agent_type TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies**:
- Users can only view their own results
- Users can only insert/delete their own results

**Sample result_data structures**:
```json
// Assignment type
{
  "type": "assignment",
  "title": "Assignment Analysis",
  "deadline": "2 days",
  "studyPlan": ["Review content", "Practice problems", "Mock test"]
}

// Notes type
{
  "type": "notes",
  "title": "Study Notes Summary",
  "keyPoints": ["Point 1", "Point 2", "Point 3"]
}

// Receipt type
{
  "type": "receipt",
  "merchant": "Local Store",
  "amount": "$25.50",
  "category": "Books"
}
```

#### 4. **notifications**
Stores user notifications with read status.

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies**:
- Users can only view their own notifications
- Users can only insert/update/delete their own notifications

#### 5. **subscriptions**
Stores push notification subscriptions.

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  auth_key TEXT,
  p256dh_key TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies**:
- Users can only view their own subscriptions
- Users can only insert/delete their own subscriptions

## Row Level Security (RLS)

All tables have RLS enabled. This means:

1. **Authentication Required**: Every query must be made with an authenticated user session
2. **User Scoping**: Data is automatically filtered to show only the current user's data
3. **Insert/Update Validation**: The user_id is automatically validated against the authenticated user

### Creating Policies

The following policies are created for each table:

```sql
-- Example: profiles table
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);
```

The `auth.uid()` function returns the current authenticated user's ID.

## Authentication Flow

### Sign Up
1. User navigates to `/auth/sign-up`
2. Enters email and password
3. Calls `supabase.auth.signUp()`
4. Redirect email is sent (can be skipped in development)
5. Database trigger automatically creates a `profiles` row
6. User is redirected to sign-up success page

### Login
1. User navigates to `/auth/login`
2. Enters email and password
3. Calls `supabase.auth.signInWithPassword()`
4. Session is established
5. User is redirected to home page (`/`)

### Session Management
- Sessions are stored in browser cookies (via `@supabase/ssr`)
- Middleware refreshes tokens automatically
- Sessions include user ID needed for RLS filtering

## API Route Examples

### Fetch User's Processing Results
```typescript
// app/api/process/route.ts
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  // Get current user (RLS will filter to this user)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS automatically filters to user_id = user.id
  const { data: results } = await supabase
    .from('processing_results')
    .select('*')
    .eq('user_id', user.id)  // Explicit filtering (RLS also applies)
    .order('created_at', { ascending: false })

  return NextResponse.json({ success: true, results })
}
```

### Create a Notification
```typescript
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { title, message, type } = await request.json()

  const { data: notification } = await supabase
    .from('notifications')
    .insert({
      user_id: user.id,  // RLS will validate this
      title,
      message,
      type,
      is_read: false
    })
    .select()

  return NextResponse.json({ success: true, notification })
}
```

## Client Setup

### Creating a Supabase Client (Browser)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
```

### Creating a Supabase Client (Server)
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )
}
```

## Environment Variables

Required variables for Supabase integration:

```env
# Supabase URLs and Keys (from Supabase dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# For development with redirect URLs
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

Get these from your Supabase project:
1. Go to Settings → API
2. Copy the Project URL (NEXT_PUBLIC_SUPABASE_URL)
3. Copy the Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)

## Testing

### Manual Testing

1. **Sign Up Flow**
   ```bash
   # Visit http://localhost:3000/auth/sign-up
   # Enter test email and password
   # Should create user and profile in database
   ```

2. **Login Flow**
   ```bash
   # Visit http://localhost:3000/auth/login
   # Enter credentials
   # Should be redirected to home page
   ```

3. **Database Access**
   ```typescript
   // In browser console
   const supabase = await import('@/lib/supabase/client').then(m => m.createClient())
   const { data } = await supabase.from('profiles').select('*')
   console.log(data)  // Should show only current user's profile
   ```

### Checking Data in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run queries to inspect data:
   ```sql
   -- View all users
   SELECT id, email FROM auth.users;
   
   -- View all profiles
   SELECT * FROM public.profiles;
   
   -- View notifications for a specific user
   SELECT * FROM public.notifications WHERE user_id = 'user-id-here';
   ```

## Troubleshooting

### "Insufficient permissions" Error
- **Cause**: RLS policy blocking the request
- **Solution**: Verify RLS policies are correctly set up and user is authenticated

### "No session" Error
- **Cause**: User is not logged in
- **Solution**: Redirect to login page or check authentication

### Trigger Not Creating Profile
- **Cause**: Trigger failed or not properly configured
- **Solution**: 
  1. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created'`
  2. Check function: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user'`
  3. Check trigger logs for errors

### CORS Issues
- **Cause**: Frontend and backend on different domains
- **Solution**: This is already handled by Supabase SSR library

## Best Practices

### For Queries
1. **Always check user session** before querying
2. **Explicitly pass user_id** in INSERT/UPDATE operations
3. **Use RLS policies** as the primary security layer
4. **Never bypass RLS** for convenience

### For API Routes
1. **Validate authentication** at the start of each route
2. **Use server-side Supabase client** for sensitive operations
3. **Return proper error codes** (401 for auth, 403 for forbidden)
4. **Log errors** for debugging

### For Frontend
1. **Use the browser client** for client-side queries
2. **Handle auth state** in layout or context
3. **Implement loading states** during async operations
4. **Clear cache** on logout

## Migration Guide

If you need to add new tables:

1. Create table in Supabase SQL Editor:
   ```sql
   CREATE TABLE public.new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
     -- other columns
   );
   ```

2. Enable RLS:
   ```sql
   ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;
   ```

3. Add policies:
   ```sql
   CREATE POLICY "new_table_select_own" ON public.new_table 
   FOR SELECT USING (auth.uid() = user_id);
   ```

4. Update TypeScript types and API routes

## References

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase SSR](https://supabase.com/docs/guides/auth/server-side-rendering)
