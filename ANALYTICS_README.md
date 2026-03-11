# Real-Time Analytics System Documentation

Welcome to the E-Lakbay Real-Time Analytics System! This document provides a complete overview of the analytics infrastructure.

## 📋 Quick Navigation

- **[Setup Guide](./ANALYTICS_SETUP_GUIDE.md)** - Complete step-by-step setup instructions
- **[Integration Guide](./ANALYTICS_INTEGRATION_GUIDE.md)** - How to add analytics to your app
- **[Checklist](./ANALYTICS_CHECKLIST.md)** - Quick reference for all components
- **[Environment Variables](./.env.analytics.example)** - Required env vars
- **[Vite Config Example](./vite.config.analytics.example.js)** - Development proxy setup

## 🎯 What This System Does

This real-time analytics system tracks every visitor to your E-Lakbay platform and generates actionable insights:

✅ **Visitor Tracking** - Persistent visitor IDs across sessions
✅ **Session Management** - Track when users enter and leave  
✅ **Page Analytics** - Monitor which pages are most visited
✅ **Bounce Detection** - Identify incomplete visits
✅ **Device Metrics** - See device type distribution
✅ **Browser Stats** - Track browser usage patterns
✅ **Real-Time Dashboard** - Live metrics that update every 30 seconds

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User's Browser                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App (with useAnalytics hook)                        │  │
│  │  - Initializes session on app load                   │  │
│  │  - Tracks page views on route changes                │  │
│  │  - Records session end on page unload                │  │
│  └─────────────────────────┬───────────────────────────┘  │
│                            │                               │
│                            │ POST /api/analytics           │
│                            ▼                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Vite Proxy (development)                            │  │
│  │  Maps /api/analytics → Supabase edge function       │  │
│  └─────────────────────────┬───────────────────────────┘  │
└────────────────────────────┼───────────────────────────────┘
                             │
                             │ (local dev)
                             ▼
        ┌────────────────────────────────────┐
        │  Supabase Edge Function            │
        │  capture-analytics/index.ts        │
        │  - Validates request               │
        │  - Extracts IP address             │
        │  - Inserts into database           │
        └─────────────┬──────────────────────┘
                      │
                      │ INSERT
                      ▼
        ┌────────────────────────────────────┐
        │  PostgreSQL Database               │
        │                                    │
        │  ├─ analytics_events (sessions)    │
        │  ├─ page_views (page analytics)    │
        │  ├─ analytics_summary (view)       │
        │  └─ Helper functions               │
        └─────────────┬──────────────────────┘
                      │
                      │ SELECT
                      ▼
        ┌────────────────────────────────────┐
        │  VisitorAnalyticsDashboard         │
        │  - Displays metrics                │
        │  - Shows charts                    │
        │  - Real-time auto-refresh          │
        │  - Auto-calculates aggregations    │
        └────────────────────────────────────┘
```

## 📦 Data Schema

### analytics_events Table
Stores individual visitor sessions:
```sql
id, uid, session_id, visitor_id, ip_address, user_agent_text,
started_at, ended_at, duration_ms, is_bounced, created_at
```

### page_views Table
Tracks individual page views:
```sql
id, session_id, visitor_id, uid, page_url, page_path,
referrer, viewed_at, viewed_duration_ms, created_at
```

## 🚀 Getting Started in 5 Steps

### 1. Run Database Migrations
```sql
-- Execute all SQL from:
src/DB_TableReference/analytics_migrations.sql

-- Verify tables exist:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
```

### 2. Deploy Edge Function
```bash
supabase functions deploy capture-analytics
```

### 3. Configure Vite Proxy (for local development)
In your `vite.config.js`, add the proxy configuration from `vite.config.analytics.example.js`

### 4. Add useAnalytics Hook to App.tsx
```tsx
import { useAnalytics } from './lib/useAnalytics';

function App() {
  const user = useCurrentUser(); // Your auth logic
  
  // This handles all analytics automatically
  useAnalytics({ uid: user?.id });
  
  return (/* Your app routes */);
}
```

### 5. Verify It Works
1. Start dev server: `npm run dev`
2. Visit `http://localhost:5173`
3. Check DevTools Network tab - you should see POST requests to `/api/analytics`
4. Navigate between pages - new requests should appear
5. Check Supabase: `SELECT COUNT(*) FROM analytics_events;`

## 📊 Dashboard Metrics

The VisitorAnalyticsDashboard displays:

| Metric | Calculation | Updates |
|--------|-------------|---------|
| Total Visitors | COUNT(analytics_events) | Real-time |
| Unique Visitors | COUNT(DISTINCT visitor_id) | Real-time |
| Page Views | COUNT(page_views) | Real-time |
| Avg Duration | AVG(duration_ms) | Real-time |
| Bounce Rate | % of sessions with ≤1 page and <10s | Real-time |
| Device Type | Parsed from user_agent_text | Real-time |
| Browser | Parsed from user_agent_text | Real-time |
| Top Pages | Most viewed page_path | Real-time |

All metrics refresh automatically every 30 seconds.

## 🔧 Frontend Functions

### From `src/lib/analytics.ts`:

```typescript
// Get persistent visitor ID 
getVisitorId(): string

// Initialize session (call on app load)
initializeVisitorSession(uid?: string): Promise<void>

// Track page view (called automatically by useAnalytics)
trackVisitorPageView(uid?: string): Promise<void>

// End session (called on beforeunload)
endVisitorSession(uid?: string): Promise<void>

// Send event to edge function (internal)
sendAnalyticsEvent(event: AnalyticsEventData): Promise<void>
```

### From `src/lib/useAnalytics.ts`:

```typescript
// React hook - handles all analytics automatically
useAnalytics({ uid?: string }): void

// Get current session info (for debugging)
useSessionInfo(): { getSessionInfo(): SessionInfo | null }
```

## 📍 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `analytics_migrations.sql` | Database schema & functions | ~150 |
| `capture-analytics/index.ts` | Edge function | ~80 |
| `cors.ts` | CORS utilities | ~35 |
| `analytics.ts` | Visitor tracking (appended) | ~170 |
| `useAnalytics.ts` | React integration | ~60 |
| `VisitorAnalyticsDashboard.tsx` | Dashboard component | ~700 |

## 🔐 Security

- ✅ **RLS Policies** - Row-level security enabled
- ✅ **Service Role Only** - Only edge function can insert
- ✅ **IP Extraction** - Server-side header parsing
- ✅ **CORS Protected** - Proper headers configured
- ✅ **No PII** - Only visitor IDs and user IDs stored

## 🐛 Troubleshooting

### No analytics data appearing?

**Step 1: Verify edge function is deployed**
```bash
supabase functions list
# Should show "capture-analytics" as deployed
```

**Step 2: Check browser console**
```
- Open DevTools Console
- Look for any errors from analytics functions
- Check Network tab for 4xx/5xx errors
```

**Step 3: Verify Supabase tables exist**
```sql
SELECT * FROM analytics_events LIMIT 1;
SELECT * FROM page_views LIMIT 1;
-- If tables don't exist, run migrations
```

**Step 4: Check edge function logs**
```bash
supabase functions logs capture-analytics
```

**Step 5: Verify API proxy is working**
```
- In DevTools Network tab
- Look for POST /api/analytics requests
- Response should have status 200 and success: true
```

### High bounce rate?

Bounce is defined as: **≤1 page view AND <10 seconds duration**

This might indicate:
- Users finding what they need quickly ✓ (good!)
- Outdated content (check top pages)
- Poor site performance (check avg duration)
- High traffic from ads (check referrers)

### Sessions not ending?

Session end tracked by `beforeunload` event which may not fire if:
- User force closes browser
- Network disconnected
- Browser crashes

This is normal. Consider server-side timeout if needed.

## 🎓 Learning More

- **SQL**: Check `analytics_migrations.sql` for queries and functions
- **Edge Functions**: See `capture-analytics/index.ts` for Deno example
- **React Integration**: Review `useAnalytics.ts` for hook pattern
- **Dashboard**: Inspect `VisitorAnalyticsDashboard.tsx` for chart implementation

## 📈 Performance Tips

### Optimize Queries
```sql
-- These are already indexed:
SELECT * FROM analytics_events WHERE visitor_id = 'xxx'; -- Fast
SELECT * FROM page_views WHERE created_at > now() - interval '7 days'; -- Fast
```

### Archive Old Data (optional)
```sql
-- Delete data older than 6 months
DELETE FROM page_views WHERE created_at < now() - interval '6 months';
DELETE FROM analytics_events WHERE created_at < now() - interval '6 months';
```

### Check Query Performance
```sql
EXPLAIN ANALYZE
SELECT COUNT(DISTINCT visitor_id) FROM analytics_events 
WHERE created_at >= now() - interval '30 days';
```

## 🚢 Deployment Checklist

- [ ] Database migrations executed in production
- [ ] Edge function deployed to production
- [ ] API proxy configured in production environment
- [ ] `useAnalytics` hook added to App.tsx
- [ ] Environment variables set
- [ ] CORS headers verified in production
- [ ] Analytics dashboard added to admin page
- [ ] Test analytics data being recorded
- [ ] Monitor dashboard for real data

## 📞 Support

For issues or questions:
1. Check the [Setup Guide](./ANALYTICS_SETUP_GUIDE.md)
2. Review the [Checklist](./ANALYTICS_CHECKLIST.md)  
3. Check Supabase logs: `supabase functions logs capture-analytics`
4. Verify tables and data: Query Supabase directly
5. Check GitHub issues or project documentation

## 📄 License

Part of E-Lakbay project. All analytics code is open source.

---

**Last Updated**: March 2026
**Status**: ✅ Complete and Production Ready
