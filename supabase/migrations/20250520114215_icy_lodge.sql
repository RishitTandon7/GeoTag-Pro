/*
  # Create payment history table

  1. New Tables
    - `payment_history`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `user_id` (uuid, references profiles.id)
      - `amount` (numeric)
      - `currency` (text)
      - `status` (text)
      - `payment_method` (text)
      - `payment_intent_id` (text, nullable)
      - `description` (text, nullable)

  2. Security
    - Enable RLS on `payment_history` table
    - Allow users to read their own payment history
*/

CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  payment_intent_id TEXT,
  description TEXT
);

-- Enable Row Level Security
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Users can view their own payment history" 
  ON payment_history 
  FOR SELECT 
  USING (auth.uid() = user_id);