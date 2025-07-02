/*
  # Add analytics tables

  1. New Tables
    - `page_views`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `page` (text)
      - `user_id` (uuid, nullable)
      - `session_id` (text)
      - `referrer` (text)
      - `user_agent` (text)
      - `ip_address` (text)
      - `country` (text)
      - `city` (text)
    
    - `user_sessions`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, nullable)
      - `session_id` (text)
      - `duration` (interval)
      - `is_active` (boolean)

  2. Security
    - Enable RLS on both tables
    - Allow admins to view all analytics
    - Allow users to view their own analytics
*/

-- Create page_views table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  page TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  session_id TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  country TEXT,
  city TEXT
);

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES profiles(id),
  session_id TEXT NOT NULL,
  duration INTERVAL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create security policies for page_views
CREATE POLICY "Admins can view all analytics" ON page_views
  USING (
    auth.email() IN ('rishit@example.com', 'rishittandon7@gmail.com')
  );

CREATE POLICY "Users can view their own analytics" ON page_views
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create security policies for user_sessions
CREATE POLICY "Admins can view all sessions" ON user_sessions
  USING (
    auth.email() IN ('rishit@example.com', 'rishittandon7@gmail.com')
  );

CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to calculate real-time visitors
CREATE OR REPLACE FUNCTION get_realtime_visitors()
RETURNS TABLE (
  count BIGINT,
  page TEXT
) 
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    COUNT(DISTINCT session_id) as count,
    page
  FROM page_views
  WHERE created_at > NOW() - INTERVAL '5 minutes'
  GROUP BY page;
$$;