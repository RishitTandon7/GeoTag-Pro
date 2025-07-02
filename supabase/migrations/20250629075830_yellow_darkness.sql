/*
  # Fix Subscription Request Issues

  1. Changes
    - Improves the handle_subscription_approval function to properly update user profiles
    - Adds debug logging to track subscription approval process
    - Ensures the function runs with proper security context

  2. Security
    - Maintains existing security model
    - Function runs with SECURITY DEFINER to ensure it has proper permissions
*/

-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS handle_subscription_approval CASCADE;

-- Re-create the function with improved implementation
CREATE OR REPLACE FUNCTION handle_subscription_approval()
RETURNS TRIGGER AS $$
DECLARE
  start_date TIMESTAMPTZ;
  end_date TIMESTAMPTZ;
  log_message TEXT;
BEGIN
  -- Log the function execution for debugging
  RAISE NOTICE 'handle_subscription_approval triggered for subscription request % (status: % -> %)', 
               NEW.id, 
               COALESCE(OLD.status, 'NULL'), 
               NEW.status;

  -- If status changed to approved, update the user's subscription
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Calculate subscription dates
    start_date := CURRENT_TIMESTAMP;
    
    -- Set end date based on plan type
    IF NEW.plan_type = 'yearly' OR NEW.amount >= 400 THEN
      end_date := start_date + INTERVAL '1 year';
      log_message := 'Setting yearly subscription';
    ELSE
      end_date := start_date + INTERVAL '1 month';
      log_message := 'Setting monthly subscription';
    END IF;
    
    RAISE NOTICE 'Approving subscription: %', log_message;
    RAISE NOTICE 'User ID: %, Period: % to %', NEW.user_id, start_date, end_date;
    
    -- Update the user's profile with transaction logging
    BEGIN
      UPDATE profiles
      SET 
        subscription_tier = 'premium'::subscription_tier,
        subscription_status = 'active'::subscription_status,
        subscription_id = NEW.transaction_id,
        price_id = CASE WHEN NEW.plan_type = 'yearly' OR NEW.amount >= 400 THEN 'yearly' ELSE 'monthly' END,
        subscription_start_date = start_date,
        subscription_end_date = end_date,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = NEW.user_id;
      
      -- Check if the update was successful
      IF FOUND THEN
        RAISE NOTICE 'Profile updated successfully for user %', NEW.user_id;
      ELSE
        RAISE NOTICE 'No profile found for user %', NEW.user_id;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error updating profile: %', SQLERRM;
    END;
  END IF;
  
  -- If status changed to rejected and it was previously approved, reset the subscription
  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    RAISE NOTICE 'Reverting subscription for user %', NEW.user_id;
    
    UPDATE profiles
    SET 
      subscription_tier = 'free'::subscription_tier,
      subscription_status = 'canceled'::subscription_status,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger if it was dropped
DROP TRIGGER IF EXISTS on_subscription_request_update ON subscription_requests;

-- Re-create the trigger
CREATE TRIGGER on_subscription_request_update
  AFTER UPDATE ON subscription_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_approval();

-- Ensure users can insert their own subscription requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'subscription_requests' 
    AND policyname = 'Users can create their own subscription requests'
  ) THEN
    CREATE POLICY "Users can create their own subscription requests"
      ON subscription_requests
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;