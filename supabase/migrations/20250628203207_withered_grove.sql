/*
  # Create user_usage table

  1. New Tables
    - `user_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `downloads_used` (integer)
      - `created_at` (timestamp)
      - `last_updated` (timestamp)

  2. Security
    - Enable RLS on `user_usage` table
    - Allow users to manage their own usage
    - Create trigger for timestamp updates
*/

-- Create user_usage table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  downloads_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'user_usage' AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create security policies only if they don't exist
DO $$
BEGIN
  -- Check and create "Users can view their own usage" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_usage' 
    AND policyname = 'Users can view their own usage'
  ) THEN
    CREATE POLICY "Users can view their own usage"
      ON user_usage
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Check and create "Users can update their own usage" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_usage' 
    AND policyname = 'Users can update their own usage'
  ) THEN
    CREATE POLICY "Users can update their own usage"
      ON user_usage
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- Check and create "Users can insert their own usage" policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_usage' 
    AND policyname = 'Users can insert their own usage'
  ) THEN
    CREATE POLICY "Users can insert their own usage"
      ON user_usage
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Create index if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'user_usage' 
    AND indexname = 'user_usage_user_id_idx'
  ) THEN
    CREATE INDEX user_usage_user_id_idx ON user_usage(user_id);
  END IF;
END $$;

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_user_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_usage_last_updated'
  ) THEN
    CREATE TRIGGER update_user_usage_last_updated
      BEFORE UPDATE ON user_usage
      FOR EACH ROW
      EXECUTE FUNCTION update_user_usage_timestamp();
  END IF;
END $$;