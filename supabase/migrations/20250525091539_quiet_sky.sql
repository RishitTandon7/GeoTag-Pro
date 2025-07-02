/*
  # Create deployment tables

  1. New Tables
    - `deployments`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `status` (text)
      - `environment` (text)
      - `version` (text)
      - `commit_hash` (text)
      - `deployed_by` (uuid, references profiles.id)
      - `deploy_url` (text)
      - `build_logs` (text)
      - `error_logs` (text)

  2. Security
    - Enable RLS on `deployments` table
    - Allow admin users to manage deployments
    - Allow all users to view deployments
*/

-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'deployed', 'failed')),
  environment TEXT NOT NULL CHECK (environment IN ('production', 'staging', 'development')),
  version TEXT NOT NULL,
  commit_hash TEXT,
  deployed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  deploy_url TEXT,
  build_logs TEXT,
  error_logs TEXT
);

-- Enable Row Level Security
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Anyone can view deployments" 
  ON deployments 
  FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can manage deployments"
  ON deployments
  USING (
    auth.email() IN ('rishit@example.com', 'rishittandon7@gmail.com')
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_deployments_updated_at
  BEFORE UPDATE ON deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();