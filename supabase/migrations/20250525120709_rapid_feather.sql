/*
  # Add traffic analytics tables

  1. New Tables
    - `traffic_analytics`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, references profiles.id)
      - `session_id` (text)
      - `page` (text)
      - `ip_address` (text)
      - `country` (text)
      - `city` (text)
      - `region` (text)
      - `browser` (text)
      - `os` (text)
      - `device` (text)
      - `referrer` (text)
      - `duration` (interval)

  2. Security
    - Enable RLS on traffic_analytics table
    - Allow admins to view all analytics
    - Allow users to view their own analytics
    - Allow anonymous inserts for tracking
*/

-- Create traffic_analytics table
CREATE TABLE IF NOT EXISTS traffic_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES profiles(id),
  session_id TEXT NOT NULL,
  page TEXT NOT NULL,
  ip_address TEXT,
  country TEXT,
  city TEXT,
  region TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  referrer TEXT,
  duration INTERVAL
);

-- Enable Row Level Security
ALTER TABLE traffic_analytics ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Admins can view all traffic analytics" ON traffic_analytics
  USING (
    auth.email() IN ('rishit@example.com', 'rishittandon7@gmail.com')
  );

CREATE POLICY "Users can view their own analytics" ON traffic_analytics
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create traffic analytics"
  ON traffic_analytics
  FOR INSERT
  WITH CHECK (true);

-- Create function to get real-time traffic stats
CREATE OR REPLACE FUNCTION get_realtime_traffic()
RETURNS TABLE (
  page TEXT,
  visitors BIGINT,
  country TEXT,
  city TEXT,
  browser TEXT,
  os TEXT,
  device TEXT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT 
    page,
    COUNT(DISTINCT session_id) as visitors,
    country,
    city,
    browser,
    os,
    device
  FROM traffic_analytics
  WHERE created_at > NOW() - INTERVAL '5 minutes'
  GROUP BY page, country, city, browser, os, device
  ORDER BY visitors DESC;
$$;