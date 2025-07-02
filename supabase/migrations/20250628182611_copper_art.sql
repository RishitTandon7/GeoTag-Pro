/*
  # Fix user registration function to handle username field

  1. Updates
    - Update existing handle_new_user function to properly handle username field
    - Extract username and full_name from user metadata
    - Generate fallback username if not provided
    - Handle all required fields for profiles table

  2. Security
    - Uses existing trigger permissions
    - Does not modify auth.users table directly
*/

-- Update the existing trigger function to handle username field
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_value TEXT;
  full_name_value TEXT;
BEGIN
  -- Extract username from metadata with fallback
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    -- Generate a fallback username from email if not provided
    LOWER(SPLIT_PART(NEW.email, '@', 1)) || '_' || FLOOR(RANDOM() * 10000)::TEXT
  );
  
  -- Extract full_name from metadata
  full_name_value := NEW.raw_user_meta_data->>'full_name';
  
  -- Insert the profile record with all required fields
  INSERT INTO public.profiles (
    id,
    email,
    username,
    full_name,
    subscription_tier,
    subscription_status,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    username_value,
    full_name_value,
    'free',
    'active',
    NOW(),
    NOW()
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise it with more context
    RAISE EXCEPTION 'Error creating profile for user % (email: %): %', NEW.id, NEW.email, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;