/*
  # Create subscription requests table

  1. New Tables
    - `subscription_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles.id)
      - `created_at` (timestamp)
      - `status` (text, default 'pending')

  2. Security
    - Enable RLS on `subscription_requests` table
    - Allow admin to manage all requests
    - Allow users to view their own requests
*/

CREATE TABLE IF NOT EXISTS subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE subscription_requests ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own subscription requests" 
  ON subscription_requests 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can manage all subscription requests"
  ON subscription_requests
  USING (
    auth.email() IN ('rishit@example.com', 'rishittandon7@gmail.com')
  );