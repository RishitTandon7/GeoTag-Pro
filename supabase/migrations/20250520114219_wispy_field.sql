/*
  # Create friend codes table

  1. New Tables
    - `friend_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique)
      - `created_at` (timestamp)
      - `is_active` (boolean)
      - `redeemed_by` (uuid, references profiles.id)
      - `redeemed_at` (timestamp)

  2. Security
    - Enable RLS on `friend_codes` table
    - Allow users to check if a code is valid
*/

CREATE TABLE IF NOT EXISTS friend_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  redeemed_by UUID REFERENCES profiles(id),
  redeemed_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE friend_codes ENABLE ROW LEVEL SECURITY;

-- Create security policies
CREATE POLICY "Anyone can check if a friend code is valid" 
  ON friend_codes 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can redeem a friend code"
  ON friend_codes
  FOR UPDATE
  USING (
    is_active = true AND 
    redeemed_by IS NULL
  );