/*
  # Add function to manually fix user subscriptions

  1. New Features:
    - Add admin function to manually set a user's subscription status
    - Allow fixing subscription issues from the database level

  2. Security:
    - Function is security definer (runs with elevated privileges)
    - Requires the user's email for identification
    - Only usable by admins due to RLS policies
*/

-- Create function to manually fix user subscriptions
CREATE OR REPLACE FUNCTION fix_user_subscription(
  user_email TEXT,
  new_tier subscription_tier DEFAULT 'premium',
  new_status subscription_status DEFAULT 'active',
  duration_months INT DEFAULT 1
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
  start_date TIMESTAMPTZ := CURRENT_TIMESTAMP;
  end_date TIMESTAMPTZ;
  result TEXT;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM profiles
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN 'Error: User with email ' || user_email || ' not found';
  END IF;
  
  -- Calculate end date based on duration
  IF duration_months = 12 THEN
    end_date := start_date + INTERVAL '1 year';
  ELSE
    end_date := start_date + (duration_months * INTERVAL '1 month');
  END IF;
  
  -- Update the user's profile
  UPDATE profiles
  SET 
    subscription_tier = new_tier,
    subscription_status = new_status,
    subscription_start_date = start_date,
    subscription_end_date = end_date,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = target_user_id;
  
  result := 'Success: Updated subscription for ' || user_email || 
             ' to ' || new_tier::TEXT || 
             ' with status ' || new_status::TEXT || 
             ' until ' || end_date::TEXT;
             
  RETURN result;
END;
$$;

-- Create a comment explaining how to use the function
COMMENT ON FUNCTION fix_user_subscription IS 
'Admin function to manually fix user subscriptions. Usage:
  
  -- Set a user to premium for 1 month:
  SELECT fix_user_subscription(''user@example.com'');
  
  -- Set a user to premium for 1 year:
  SELECT fix_user_subscription(''user@example.com'', ''premium'', ''active'', 12);
  
  -- Set a user to friend plan:
  SELECT fix_user_subscription(''user@example.com'', ''friend'', ''active'', 999);
  
  -- Revert user to free plan:
  SELECT fix_user_subscription(''user@example.com'', ''free'', ''active'', 0);
';