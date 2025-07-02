/*
  # Add INSERT policy for subscription requests

  1. Security Changes
    - Add policy to allow users to insert their own subscription requests
    - Users can only create requests where user_id matches their authenticated user ID

  This fixes the RLS policy violation when users try to submit payment verification requests.
*/

-- Add policy to allow users to create their own subscription requests
CREATE POLICY "Users can create their own subscription requests"
  ON subscription_requests
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);