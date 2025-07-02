/*
  # Create another admin user (Queen)

  1. Changes
    - Creates another admin user with email koushani.nath@queen.com
    - Sets password to queen123
    - Handles duplicate key constraints safely
*/

-- Function to safely create or update the queen admin user
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- First check if user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'koushani.nath@queen.com';

  -- If user doesn't exist, create it
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      last_sign_in_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'koushani.nath@queen.com',
      crypt('queen123', gen_salt('bf')), -- Password: queen123
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      '',
      '',
      NOW()
    )
    RETURNING id INTO v_user_id;
  END IF;

  -- Now safely update or insert the profile
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'koushani.nath@queen.com',
    'Koushani Nath',
    'queenkoushani',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'Koushani Nath',
    username = 'queenkoushani',
    updated_at = NOW();
END $$;