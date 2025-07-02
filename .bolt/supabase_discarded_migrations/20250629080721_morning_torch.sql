/*
  # Fix Subscription Approval Issues

  1. Changes
    - Recreate the subscription approval function with better error handling
    - Add debug logs to trace execution flow
    - Ensure profile updates work correctly with type casting
    - Add direct function to manually set subscription status
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS handle_subscription_approval CASCADE;

-- Create an improved version of the function
CREATE OR REPLACE FUNCTION handle_subscription_approval()
RETURNS TRIGGER AS $$
DECLARE
  start_date TIMESTAMPTZ := CURRENT_TIMESTAMP;
  end_date TIMESTAMPTZ;
  updated_rows INTEGER;
  log_message TEXT;
  user_email TEXT;
BEGIN
  -- Get user email for logging
  SELECT email INTO user_email FROM profiles WHERE id = NEW.user_id;

  -- Log the function execution for debugging
  RAISE LOG 'handle_subscription_approval triggered: request_id=%, user_id=%, email=%, status=% -> %', 
           NEW.id, NEW.user_id, user_email, COALESCE(OLD.status, 'NULL'), NEW.status;

  -- If status changed to approved, update the user's subscription
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Calculate subscription dates
    IF NEW.plan_type = 'yearly' OR NEW.amount >= 400 THEN
      end_date := start_date + INTERVAL '1 year';
      RAISE LOG 'Setting yearly subscription for user % (end_date: %)', NEW.user_id, end_date;
    ELSE
      end_date := start_date + INTERVAL '1 month';
      RAISE LOG 'Setting monthly subscription for user % (end_date: %)', NEW.user_id, end_date;
    END IF;
    
    -- Update the user's profile with direct SQL to ensure proper casting
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
      WHERE id = NEW.user_id
      RETURNING id INTO updated_rows;
      
      -- Log the result
      RAISE LOG 'Profile update result for user %: % rows affected', NEW.user_id, COALESCE(updated_rows, 0);
      
      -- Add debug note to subscription request
      UPDATE subscription_requests
      SET notes = 'Profile update processed at ' || NOW() || '. Result: ' || COALESCE(updated_rows, 0) || ' rows affected.'
      WHERE id = NEW.id;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE LOG 'Error updating profile for user %: %', NEW.user_id, SQLERRM;
      -- Add error note to subscription request
      UPDATE subscription_requests
      SET notes = 'Error updating profile: ' || SQLERRM
      WHERE id = NEW.id;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_subscription_request_update ON subscription_requests;

CREATE TRIGGER on_subscription_request_update
  AFTER UPDATE ON subscription_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_subscription_approval();

-- Create a direct function for admins to manually fix subscriptions
CREATE OR REPLACE FUNCTION admin_fix_subscription(
  target_user_id UUID,
  plan_type TEXT DEFAULT 'monthly'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  start_date TIMESTAMPTZ := CURRENT_TIMESTAMP;
  end_date TIMESTAMPTZ;
  updated_rows INTEGER;
  user_email TEXT;
  log_message TEXT;
BEGIN
  -- Get the user's email for logging
  SELECT email INTO user_email FROM profiles WHERE id = target_user_id;
  
  IF user_email IS NULL THEN
    RETURN 'Error: User not found';
  END IF;
  
  -- Calculate end date based on plan type
  IF plan_type = 'yearly' THEN
    end_date := start_date + INTERVAL '1 year';
  ELSE
    end_date := start_date + INTERVAL '1 month';
  END IF;
  
  -- Update the user profile
  UPDATE profiles
  SET 
    subscription_tier = 'premium'::subscription_tier,
    subscription_status = 'active'::subscription_status,
    price_id = plan_type,
    subscription_start_date = start_date,
    subscription_end_date = end_date,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id
  RETURNING id INTO updated_rows;
  
  -- Return success or error message
  IF updated_rows IS NOT NULL AND updated_rows > 0 THEN
    log_message := 'Success: Updated subscription for ' || user_email || ' to premium with status active until ' || end_date::TEXT;
    RAISE LOG '%', log_message;
    RETURN log_message;
  ELSE
    log_message := 'Error: Failed to update profile for ' || user_email;
    RAISE LOG '%', log_message;
    RETURN log_message;
  END IF;
END;
$$;

-- Test the function by running it on an admin user (if it exists)
DO $$
DECLARE
  admin_id UUID;
  result TEXT;
BEGIN
  -- Try to find the admin user
  SELECT id INTO admin_id FROM profiles WHERE email = 'rishit@example.com' LIMIT 1;
  
  -- If admin user exists, run a test
  IF admin_id IS NOT NULL THEN
    SELECT admin_fix_subscription(admin_id, 'monthly') INTO result;
    RAISE NOTICE 'Test result: %', result;
  END IF;
END $$;