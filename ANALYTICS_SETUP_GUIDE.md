# Real-Time Analytics System Setup Guide

## Overview

This guide walks through setting up the real-time analytics system that tracks visitor sessions, page views, and generates metrics for the VisitorAnalyticsDashboard.

## Features

✅ **Real-time visitor tracking** - Tracks IP address, user agent, session ID, and visitor ID
✅ **Session management** - Persistent visitor IDs and session tracking with start/end times
✅ **Page view tracking** - Records each page view with URL, duration, and referrer
✅ **Bounce rate calculation** - Identifies bounce sessions (≤1 page view, <10s duration)
✅ **Device & browser detection** - Tracks device types and browsers from user agent
✅ **Automatic metrics** - Generates unique visitors, page views, avg duration, bounce rate

## System Architecture

### Database Schema

#### `analytics_events` Table
Stores individual visitor sessions:
- `id` - Primary key
- `uid` - User ID (null for anonymous visitors)
- `session_id` - Unique session identifier (persistent per visit)
- `visitor_id` - Persistent visitor identifier (stored in localStorage)
- `ip_address` - Visitor's IP address (captured server-side)
- `user_agent_text` - Browser user agent string
- `started_at` - Session start timestamp
- `ended_at` - Session end timestamp
- `duration_ms` - Total session duration in milliseconds
- `is_bounced` - Boolean flag for bounce sessions
- `created_at` - Record creation timestamp

#### `page_views` Table
Tracks individual page views within sessions:
- `id` - Primary key
- `session_id` - Links to analytics_events
- `visitor_id` - Persistent visitor identifier
- `uid` - User ID (null for anonymous)
- `page_url` - Full page URL
- `page_path` - URL path only
- `referrer` - HTTP referrer
- `viewed_at` - When the page was viewed
- `viewed_duration_ms` - Time spent on page
- `created_at` - Record creation timestamp

### Edge Function: `/capture-analytics`

Located at: `supabase/functions/capture-analytics/index.ts`

**Endpoint**: `POST /api/analytics`

**Request Body**:
```json
{
  "sessionId": "string",           // Required: session identifier
  "visitorId": "string",           // Required: persistent visitor ID
  "uid": "string|null",            // Optional: authenticated user ID
  "pageUrl": "string",             // Optional: full URL
  "pagePath": "string",            // Optional: URL path
  "userAgent": "string",           // Optional: browser user agent
  "referrer": "string",            // Optional: HTTP referrer
  "eventType": "page_view|session_start|session_end",  // Required
  "startedAt": "ISO string",       // Optional: session start time
  "endedAt": "ISO string",         // Optional: session end time
  "viewedDurationMs": "number",    // Optional: duration in ms
  "isBounced": "boolean"           // Optional: whether it was a bounce
}
```

**Response**:
```json
{
  "success": true,
  "data": { "success": true },
  "message": "Page view recorded"
}
```

## Frontend Implementation

### 1. Analytics Library Functions

**File**: `src/lib/analytics.ts`

Key functions:

```typescript
// Initialize visitor session (call on app load)
initializeVisitorSession(uid?: string | null): Promise<void>

// Track page view (call on route change)
trackVisitorPageView(uid?: string | null): Promise<void>

// End visitor session (call on page unload)
endVisitorSession(uid?: string | null): Promise<void>

// Get or create persistent visitor ID
getVisitorId(): string
```

### 2. useAnalytics Hook

**File**: `src/lib/useAnalytics.ts`

Simple React hook that handles the analytics lifecycle:

```typescript
import { useAnalytics } from './lib/useAnalytics';

function App() {
  const user = useAuthUser(); // Your auth hook
  
  // This hook handles:
  // - Session initialization on mount
  // - Page view tracking on route changes
  // - Session cleanup on page unload
  useAnalytics({ uid: user?.id });
  
  return (/* Your app */);
}
```

### 3. Integration Steps

1. **Add useAnalytics to your App.tsx or root component**:
   ```tsx
   import { useAnalytics } from './lib/useAnalytics';
   
   function App() {
     useAnalytics({ uid: currentUser?.id });
     return (/* Your app */);
   }
   ```

2. **Ensure you have React Router** for page tracking
   (The hook uses `useLocation` from react-router-dom)

## Supabase Setup

### 1. Run Database Migrations

Execute the SQL migrations from:
`src/DB_TableReference/analytics_migrations.sql`

This creates:
- `analytics_events` table
- `page_views` table
- Indexes for performance
- RLS policies for security
- Helper views and functions

### 2. Deploy Edge Function

Deploy the edge function:
```bash
supabase functions deploy capture-analytics
```

### 3. Configure CORS

The edge function includes CORS configuration. Make sure your frontend's domain is allowed:

**For local development**:
```
http://localhost:5173
```

**For production**:
```
https://yourdomain.com
```

## API Configuration

The analytics functions send data to `/api/analytics` by default.

You need to configure a proxy that forwards to your Supabase edge function.

### Option A: Vite Proxy (Development)

Add to `vite.config.js`:
```javascript
export default {
  server: {
    proxy: {
      '/api/analytics': {
        target: 'https://your-project.supabase.co/functions/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/analytics/, '/capture-analytics'),
        headers: {
          'Authorization': 'Bearer YOUR_SERVICE_ROLE_KEY'
        }
      }
    }
  }
}
```

### Option B: Vercel Edge Middleware (Production)

Update your Vercel deployment to proxy `/api/analytics` requests to your Supabase function.

## Dashboard Component

The `VisitorAnalyticsDashboard` component displays real-time metrics:

- **Total Visitors** - Count of analytics_events records
- **Unique Visitors** - Count of distinct visitor_ids  
- **Page Views** - Count of page_views records
- **Avg Session Duration** - Average time from started_at to ended_at
- **Bounce Rate** - % of sessions with is_bounced = true

Charts and visualizations:
- Daily visits trend line
- Device type distribution (pie chart)
- Browser usage breakdown
- Top visited pages
- Top visited destinations
- Top rated products

## Testing

### Manual Testing

1. Visit your site in a browser
2. Check localStorage for `elakbay-visitor-id`
3. Open browser DevTools → Network tab
4. Look for POST requests to `/api/analytics`
5. Each page navigation should trigger request
6. Page unload should trigger session_end event

### Verify Data in Supabase

```sql
-- Check recent sessions
SELECT * FROM analytics_events ORDER BY created_at DESC LIMIT 10;

-- Check page views
SELECT * FROM page_views ORDER BY created_at DESC LIMIT 10;

-- Check daily analytics summary
SELECT * FROM analytics_summary ORDER BY date DESC LIMIT 7;

-- Run analytics functions
SELECT * FROM get_today_analytics();
SELECT * FROM get_monthly_analytics();
```

## Troubleshooting

### No analytics data appearing?

1. **Check if edge function is deployed**:
   ```bash
   supabase functions list
   ```

2. **Check browser console** for errors in analytics tracking

3. **Verify CORS headers** in Network tab - requests should have proper CORS response

4. **Check Supabase logs**:
   ```bash
   supabase functions logs capture-analytics
   ```

5. **Verify environment variables** in Supabase:
   - `SUPABASE_URL` should be set
   - `SUPABASE_SERVICE_ROLE_KEY` should be set

### High bounce rate?

Bounce rate is calculated as: sessions with ≤1 page view AND <10 second duration

This might be normal if users are:
- Finding what they need quickly
- Closing the browser tab immediately
- Using the site for lookups only

### Sessions not ending?

Session end is triggered by `beforeunload` event. This may not fire if users:
- Lose internet connection
- Force close browser
- Session timeout on server

Consider adding server-side session timeout logic if needed.

## Performance Considerations

### Indexes

The system creates indexes on frequently queried columns:
- `analytics_events.session_id`
- `analytics_events.visitor_id`
- `analytics_events.created_at`
- `page_views.session_id`
- `page_views.created_at`

### Data Retention

Consider archiving or deleting old analytics data:
```sql
-- Delete analytics older than 6 months
DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '6 months';
DELETE FROM analytics_events WHERE created_at < NOW() - INTERVAL '6 months';
```

### Query Performance

Use the provided views and functions for aggregated data:
- `analytics_summary` - Daily rollup data
- `get_today_analytics()` - Today's metrics
- `get_monthly_analytics()` - Last 30 days metrics

## Security Notes

✅ **RLS Policies enabled** - Only service role can insert
✅ **IP address captured** - Server-side via headers
✅ **No PII stored** - Only anon visitor IDs and user IDs
✅ **Session isolation** - Each session tracked separately

## Next Steps

1. ✅ Run SQL migrations in Supabase
2. ✅ Deploy capture-analytics edge function
3. ✅ Add useAnalytics hook to App.tsx
4. ✅ Configure API proxy for `/api/analytics`
5. ✅ Add VisitorAnalyticsDashboard to admin page
6. Monitor analytics data in dashboard
7. Set up alerts for anomalies (if needed)
8. Schedule data archival (if handling high volume)
