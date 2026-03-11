-- Analytics Events Table
-- Stores individual visitor sessions with metadata
CREATE TABLE IF NOT EXISTS analytics_data(
  id BIGSERIAL PRIMARY KEY,
  uid TEXT,  -- User ID (null for anonymous)
  session_id TEXT NOT NULL,  -- Unique session identifier
  visitor_id TEXT NOT NULL,  -- Persistent visitor identifier
  ip_address INET,  -- IP address of visitor
  user_agent_text TEXT,  -- User agent string
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,  -- Duration in milliseconds
  is_bounced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT session_id_not_empty CHECK (session_id != ''),
  CONSTRAINT visitor_id_not_empty CHECK (visitor_id != '')
);

-- Page Views Table
-- Tracks individual page views within sessions
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  uid TEXT,  -- User ID (null for anonymous)
  page_url TEXT NOT NULL,
  page_path TEXT,
  referrer TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  viewed_duration_ms INTEGER,  -- Time spent on this page
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT session_id_not_empty CHECK (session_id != ''),
  CONSTRAINT visitor_id_not_empty CHECK (visitor_id != '')
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_analytics_data_session_id ON analytics_data(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data_visitor_id ON analytics_data(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data_created_at ON analytics_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_data_uid ON analytics_data(uid);

CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_uid ON page_views(uid);

-- View for analytics summary (useful for dashboard aggregations)
CREATE OR REPLACE VIEW analytics_summary AS
SELECT
  DATE_TRUNC('day', ad.created_at) as date,
  COUNT(DISTINCT ad.visitor_id) as unique_visitors,
  COUNT(DISTINCT ad.session_id) as total_sessions,
  COUNT(DISTINCT pv.id) as total_page_views,
  ROUND(AVG(EXTRACT(EPOCH FROM (ad.ended_at - ad.started_at))), 2) as avg_session_duration_seconds,
  ROUND(
    (SUM(CASE WHEN ad.is_bounced THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT ad.session_id), 0)),
    2
  ) as bounce_rate_percent
FROM analytics_data ad
LEFT JOIN page_views pv ON ad.session_id = pv.session_id
WHERE ad.created_at >= NOW() - INTERVAL '90 days'
GROUP BY DATE_TRUNC('day', ad.created_at)
ORDER BY date DESC;

-- Function to get current day analytics
CREATE OR REPLACE FUNCTION get_today_analytics()
RETURNS TABLE (
  unique_visitors BIGINT,
  total_sessions BIGINT,
  total_page_views BIGINT,
  avg_session_duration_seconds NUMERIC,
  bounce_rate_percent NUMERIC
) AS $$
SELECT
  COUNT(DISTINCT ad.visitor_id)::BIGINT,
  COUNT(DISTINCT ad.session_id)::BIGINT,
  COUNT(DISTINCT pv.id)::BIGINT,
  ROUND(AVG(EXTRACT(EPOCH FROM (ad.ended_at - ad.started_at))), 2)::NUMERIC,
  ROUND(
    (SUM(CASE WHEN ad.is_bounced THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT ad.session_id), 0)),
    2
  )::NUMERIC
FROM analytics_data ad
LEFT JOIN page_views pv ON ad.session_id = pv.session_id
WHERE DATE(ad.created_at) = CURRENT_DATE;
$$ LANGUAGE SQL;

-- Function to get 30-day analytics
CREATE OR REPLACE FUNCTION get_monthly_analytics()
RETURNS TABLE (
  unique_visitors BIGINT,
  total_sessions BIGINT,
  total_page_views BIGINT,
  avg_session_duration_seconds NUMERIC,
  bounce_rate_percent NUMERIC
) AS $$
SELECT
  COUNT(DISTINCT ad.visitor_id)::BIGINT,
  COUNT(DISTINCT ad.session_id)::BIGINT,
  COUNT(DISTINCT pv.id)::BIGINT,
  ROUND(AVG(EXTRACT(EPOCH FROM (ad.ended_at - ad.started_at))), 2)::NUMERIC,
  ROUND(
    (SUM(CASE WHEN ad.is_bounced THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(DISTINCT ad.session_id), 0)),
    2
  )::NUMERIC
FROM analytics_data ad
LEFT JOIN page_views pv ON ad.session_id = pv.session_id
WHERE ad.created_at >= NOW() - INTERVAL '30 days';
$$ LANGUAGE SQL;

-- Enable RLS policies (optional but recommended for security)
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert analytics data (from edge function)
CREATE POLICY "Allow service role to insert" ON analytics_data
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to insert" ON page_views
  FOR INSERT WITH CHECK (true);

-- Policy to allow authenticated users and service role to read (for dashboard)
CREATE POLICY "Allow authenticated to read" ON analytics_data
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated to read" ON page_views
  FOR SELECT USING (true);
