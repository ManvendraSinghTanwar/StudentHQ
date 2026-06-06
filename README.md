# StudentOS - AI-Powered Personal Assistant PWA

A production-quality Progressive Web App (PWA) built for the iQOO Hackathon. StudentOS is an AI-powered assistant platform for students to upload content and receive instant insights powered by specialized AI agents.

## Features

### Core Functionality
- **Home Dashboard**: Quick access to all features with smart quick-action buttons for screenshots, photos, receipts, notes, and voice input
- **AI Processing**: Real-time processing animation showing the AI workflow pipeline with rotating agent visualization
- **Results Dashboard**: Display of processed results with support for 5 different content types (assignments, notes, receipts, job postings, meal plans)
- **Notifications Center**: Full notification management with filtering, read/unread status, and push notification support
- **Study Dashboard**: Overview cards showing upcoming deadlines, study tasks, expense tracking, and AI-generated recommendations

### PWA Features
- **Installable**: One-click installation on Android and iOS
- **Offline Support**: Service worker with offline fallback page
- **Progressive Enhancement**: Works seamlessly across all devices and network conditions
- **Push Notifications**: Real-time notification delivery and subscription management
- **Adaptive Icons**: Maskable icons that adapt to different device shapes

### Design System
- **Glassmorphism UI**: Modern glass effect with backdrop blur and transparency
- **Dark Mode Optimized**: Eye-friendly dark theme perfect for long study sessions
- **Smooth Animations**: Framer Motion-powered transitions and micro-interactions
- **Responsive Layout**: Mobile-first design with proper touch targets (48px minimum)
- **Color Palette**: Soothing dark navy background with cyan accent and purple primary

## Tech Stack

### Frontend
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 with custom glassmorphism utilities
- **Animations**: Framer Motion for smooth transitions
- **State Management**: React Context API

### Backend & Database
- **Authentication**: Supabase Auth with email/password
- **Database**: Supabase PostgreSQL with Row Level Security (RLS)
- **API Routes**: Next.js API routes for backend logic
- **File Storage**: Ready for Vercel Blob or Supabase Storage integration

### PWA
- **Service Worker**: next-pwa for offline support
- **Web Manifest**: Adaptive icons and installation metadata
- **Notifications**: Web Push API with subscription management

## Database Schema

### Tables
- **profiles**: User profile information with auto-creation via trigger
- **uploads**: Stores uploaded files with metadata
- **processing_results**: AI processing results stored as JSON
- **notifications**: User notifications with read status
- **subscriptions**: Push notification subscriptions

### Security
- Row Level Security (RLS) enabled on all tables
- User data scoped to authenticated user ID
- Automatic profile creation on user signup via database trigger

## Getting Started

### Prerequisites
- Node.js 18+ (Recommended 20+)
- Supabase project with environment variables configured

### Environment Variables
Required Supabase variables (automatically set up if Supabase integration is connected):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start development server**
   ```bash
   pnpm dev
   ```

3. **Open in browser**
   Navigate to `http://localhost:3000`

4. **Test Authentication** (optional)
   - Visit `/auth/sign-up` to create a new account
   - Or `/auth/login` to sign in
   - Demo credentials: `demo@studentos.app` / `demo123456`

## Deployment

### Vercel (Recommended)
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables from Supabase
4. Deploy with one click

### Environment Setup
Ensure these environment variables are configured in your Vercel project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## API Routes

### Processing
- `POST /api/process` - Process uploaded content with AI agents
- `POST /api/upload` - Handle file uploads

### Dashboard
- `GET /api/dashboard` - Fetch dashboard data (deadlines, tasks, etc.)

### Notifications
- `GET /api/notifications` - Fetch user notifications
- `POST /api/notifications` - Create new notification
- `PATCH /api/notifications/:id` - Mark notification read or update fields
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `POST /api/notifications/unsubscribe` - Unsubscribe from push notifications

### Student Data
- `POST /api/agent-result` - Receive n8n results with `x-studenthq-secret`
- `POST /api/ingest` - Forward PWA payloads to n8n `/studenthq/ingest`
- `GET /api/assignments?studentId=x`
- `GET /api/study-plans?studentId=x`
- `GET /api/study-materials?studentId=x`
- `GET /api/deadlines?studentId=x`
- `GET /api/content-drafts?studentId=x`
- `GET /api/health-logs?studentId=x`
- `PATCH /api/assignments/:id` - Update assignment status or fields

### Environment Variables
Add these server-side values for the new n8n flow:
- `SUPABASE_SERVICE_ROLE_KEY`
- `STUDENTHQ_SECRET`
- `N8N_BASE_URL` or `N8N_INGEST_URL`

## File Structure

```
app/
  auth/                          # Authentication pages
    login/page.tsx
    sign-up/page.tsx
    callback/route.ts           # OAuth callback
  api/                          # API routes
    process/route.ts
    upload/route.ts
    dashboard/route.ts
    notifications/route.ts
  dashboard/page.tsx
  processing/page.tsx
  results/page.tsx
  notifications/page.tsx
  layout.tsx
  page.tsx                       # Home page

components/
  agents/                        # AI agent components
  cards/                         # Card components
  layout/                        # Layout components
  loaders/                       # Loading animations
  notifications/                 # Notification components
  results/                       # Result display components

contexts/                        # React Context providers
  AppContext.tsx
  NotificationContext.tsx

lib/
  supabase/                      # Supabase client setup
  mock-data.ts
  notifications.ts

public/
  manifest.json
  icons/                         # PWA icons
  offline.html
```

## Key Features Implementation

### Glassmorphism Design
Custom CSS utilities for glass effect:
```css
.glass {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
}
```

### Framer Motion Animations
Page transitions, button hover effects, and smooth state changes powered by Framer Motion.

### PWA Installation
Automatic detection and prompting for PWA installation with service worker offline support.

### Real-time Notifications
Push notification subscriptions and in-app notification management with Supabase integration.

## Future Enhancements

- [ ] Real AI integration (Claude, GPT, or specialized models)
- [ ] Actual file storage with Vercel Blob
- [ ] Email verification for auth
- [ ] OAuth (Google, GitHub) authentication
- [ ] Image recognition for uploaded content
- [ ] Real-time collaboration features
- [ ] Premium subscription tiers
- [ ] Analytics and insights dashboard
- [ ] Dark/light mode toggle
- [ ] Internationalization (i18n)

## Troubleshooting

### Authentication Issues
If you encounter auth errors:
1. Verify Supabase environment variables are set
2. Check that RLS policies are enabled on all tables
3. Ensure the user exists in the auth.users table
4. Check browser console for specific error messages

### PWA Not Installing
- Ensure manifest.json is properly configured
- Check that HTTPS is used (or localhost for dev)
- Service worker must be registered in layout.tsx
- Clear browser cache and try again

### Database Errors
- Verify RLS policies allow the operation
- Check that user_id is properly scoped
- Ensure the user session is active
- Review Supabase logs for specific errors

## Contributing

This is a hackathon submission showcasing modern PWA development with Next.js and Supabase. Feel free to fork and extend!

## License

MIT License - Feel free to use this code for learning and projects.

## Contact & Support

Built for the iQOO Hackathon. For questions or issues, please check the deployment settings and ensure all environment variables are properly configured.

---

**Status**: Production-ready PWA with Supabase integration ✨
