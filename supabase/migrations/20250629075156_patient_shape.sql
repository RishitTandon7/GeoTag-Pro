/*
  # Add subscription approval trigger

  1. New Features:
    - Connect the handle_subscription_approval function to the subscription_requests table
    - Add trigger to automatically update user profiles when subscriptions are approved
    - Fix issue where user profile wasn't being updated to premium status

  2. Changes:
    - Add AFTER UPDATE trigger on subscription_requests table
*/

-- Create the trigger that calls our existing handle_subscription_approval function
CREATE TRIGGER on_subscription_request_update
  AFTER UPDATE ON subscription_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_approval();

-- Log that the trigger was created
DO $$
BEGIN
  RAISE NOTICE 'Subscription approval trigger created';
END $$;