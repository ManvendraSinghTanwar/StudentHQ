# StudentOS - Deployment Guide

This guide covers everything you need to deploy StudentOS to production on Vercel.

## Prerequisites

Before deploying, ensure you have:
- [ ] GitHub account
- [ ] Vercel account (free tier works great)
- [ ] Supabase project set up
- [ ] Repository pushed to GitHub

## Step 1: Prepare Supabase

### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Enter project name and password
4. Wait for database initialization

### Get API Keys
1. Go to **Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Set Up Database

Run these SQL scripts in the Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. Create uploads table
CREATE TABLE public.uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "uploads_select_own" ON public.uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "uploads_insert_own" ON public.uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "uploads_delete_own" ON public.uploads FOR DELETE USING (auth.uid() = user_id);

-- 3. Create processing_results table
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

ALTER TABLE public.processing_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "results_select_own" ON public.processing_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "results_insert_own" ON public.processing_results FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "results_delete_own" ON public.processing_results FOR DELETE USING (auth.uid() = user_id);

-- 4. Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_own" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- 5. Create subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT UNIQUE NOT NULL,
  auth_key TEXT,
  p256dh_key TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "subscriptions_insert_own" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "subscriptions_delete_own" ON public.subscriptions FOR DELETE USING (auth.uid() = user_id);

-- Create trigger for automatic profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
```

## Step 2: Deploy to Vercel

### Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select "Import Git Repository"
4. Select your StudentOS GitHub repository
5. Click "Import"

### Configure Environment Variables

1. In Vercel project settings, go to **Environment Variables**
2. Add the following:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Make sure variables are set for:
   - [ ] Production
   - [ ] Preview
   - [ ] Development

### Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Get your deployment URL
4. Test the app

## Step 3: Configure Production Settings

### Update Supabase Auth URLs

In Supabase dashboard:

1. Go to **Auth → URL Configuration**
2. Add redirect URLs:
   - Site URL: `https://your-vercel-domain.vercel.app`
   - Redirect URLs:
     - `https://your-vercel-domain.vercel.app/auth/callback`
     - `https://your-vercel-domain.vercel.app/auth/login`
     - `http://localhost:3000/auth/callback` (for local testing)

### Enable Email Verification (Optional)

1. Go to **Auth → Providers**
2. Configure email provider
3. Customize email templates if desired

### Set Up Custom Domain (Optional)

1. In Vercel, go to **Settings → Domains**
2. Add your custom domain
3. Follow DNS configuration steps

## Step 4: Test Production Deployment

### Manual Testing

1. Visit your deployed URL
2. Test sign-up flow
3. Test login flow
4. Navigate through all pages
5. Test PWA installation
6. Check mobile responsiveness

### Browser Testing

Test on:
- [ ] Chrome (Desktop)
- [ ] Chrome (Mobile)
- [ ] Safari (Desktop)
- [ ] Safari (Mobile)
- [ ] Firefox

### Database Testing

1. Sign up as a new user
2. Check Supabase dashboard for new profile
3. Verify data is properly scoped to user

## Step 5: Post-Deployment Checklist

### Security
- [ ] HTTPS is enabled
- [ ] Environment variables are secure
- [ ] No secrets in code
- [ ] RLS policies are active

### Performance
- [ ] Page loads under 3 seconds
- [ ] Lighthouse score > 80
- [ ] Core Web Vitals are good
- [ ] Images are optimized

### Functionality
- [ ] All pages load
- [ ] Navigation works
- [ ] Forms submit properly
- [ ] API routes respond
- [ ] Database queries work

### PWA
- [ ] Manifest loads correctly
- [ ] Service worker registers
- [ ] App installs on mobile
- [ ] Offline fallback works
- [ ] Icons display correctly

### Monitoring
- [ ] Set up error tracking (optional)
- [ ] Configure analytics (optional)
- [ ] Set up logs (optional)

## Troubleshooting

### Build Fails
```bash
# Clear cache and redeploy
# In Vercel: Settings → Redeploy
# Or: Settings → Functions → Clear Cache
```

### Environment Variables Not Working
1. Verify variables are added in Vercel
2. Redeploy after adding/changing variables
3. Check variable names exactly match code

### Database Connection Issues
1. Verify Supabase URL is correct
2. Check Anon Key is correct
3. Verify RLS policies are enabled
4. Check user is authenticated

### Authentication Errors
1. Verify redirect URLs in Supabase
2. Check environment variables
3. Clear browser cookies and try again
4. Check Supabase auth logs

### PWA Not Installing
1. Verify manifest.json is accessible
2. Check HTTPS is enabled
3. Verify icons are correct size
4. Clear browser cache

## Monitoring & Analytics

### Enable Error Tracking (Optional)

With Sentry:
1. Create Sentry account
2. Create Next.js project
3. Add Sentry tokens to environment variables
4. Import Sentry in app

### View Logs

In Vercel dashboard:
1. Go to **Monitoring → Functions**
2. View real-time logs
3. Search by function name or error

## Scaling & Optimization

### Database Scaling
- Supabase handles auto-scaling
- Monitor connections in dashboard
- Upgrade plan if needed

### Edge Caching
- Vercel auto-caches static assets
- Configure cache headers in next.config.js
- Use ISR (Incremental Static Regeneration)

### Performance Optimization
- Enable compression
- Optimize images with next/image
- Code splitting is automatic
- Lazy load non-critical components

## Maintenance

### Regular Tasks
- [ ] Monitor error logs weekly
- [ ] Check Core Web Vitals monthly
- [ ] Update dependencies quarterly
- [ ] Backup database regularly
- [ ] Review security logs

### Updates
```bash
# Check for updates
pnpm update --interactive

# Test locally
pnpm dev

# Deploy to production
git push origin main
```

## Support

### Common Issues

**500 Error**
- Check function logs in Vercel
- Verify database connection
- Check environment variables

**Slow Load Times**
- Check Lighthouse score
- Optimize images
- Enable caching
- Check database queries

**Authentication Issues**
- Verify redirect URLs
- Check Supabase auth logs
- Verify environment variables
- Clear browser cookies

## Next Steps

After deployment:

1. **Add Real AI** - Integrate Claude or GPT
2. **Add File Storage** - Use Vercel Blob or Supabase Storage
3. **Add Email Notifications** - Set up email service
4. **Add Analytics** - Track user behavior
5. **Optimize Performance** - Profile and optimize

## Quick Reference

### Useful URLs
- Vercel: https://vercel.com/dashboard
- Supabase: https://supabase.com/dashboard
- GitHub: https://github.com
- Your App: https://your-domain.vercel.app

### Key Commands
```bash
# Local development
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint and format
pnpm lint
pnpm format
```

### Important Files
- `.env.local` - Local environment variables
- `next.config.mjs` - Next.js configuration
- `app/layout.tsx` - Root layout
- `middleware.ts` - Authentication middleware

---

**Deployment Status**: ✅ Ready for Production

Need help? Check README.md or SUPABASE_SETUP.md for more details.
