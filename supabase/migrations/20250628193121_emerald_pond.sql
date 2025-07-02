/*
  # Add usage tracking table

  1. New Tables
    - `user_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `downloads_used` (integer)
      - `created_at` (timestamp)
      - `last_updated` (timestamp)

  2. Security
    - Enable RLS on `user_usage` table
    - Allow users to read/update their own usage data
    - Create policies for proper access control
*/

-- Create user_usage table
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  downloads_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own usage"
  ON user_usage
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage"
  ON user_usage
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage"
  ON user_usage
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX user_usage_user_id_idx ON user_usage(user_id);

-- Create trigger to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_user_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_usage_last_updated
  BEFORE UPDATE ON user_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_user_usage_timestamp();