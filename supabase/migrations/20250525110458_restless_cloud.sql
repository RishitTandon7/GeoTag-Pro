/*
  # Fix page_views RLS policies

  1. Changes
    - Add insert policy to allow anonymous users to create page views
    - Keep existing select policies intact
    - Ensure proper access control while allowing analytics tracking

  2. Security
    - Allow inserts from any user (authenticated or not) for analytics purposes
    - Maintain existing read restrictions (admin and own records only)
*/

-- Add insert policy for page_views
CREATE POLICY "Anyone can create page views"
  ON page_views
  FOR INSERT
  WITH CHECK (true);