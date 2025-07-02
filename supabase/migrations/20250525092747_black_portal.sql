/*
  # Create admin user

  1. Changes
    - Creates admin user if not exists
    - Updates admin profile if exists
    - Handles duplicate key constraints safely
*/

-- Function to safely create or update admin user
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- First check if user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'rishit@example.com';

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
      'rishit@example.com',
      crypt('admin123', gen_salt('bf')), -- Password: admin123
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
    created_at,
    updated_at
  )
  VALUES (
    v_user_id,
    'rishit@example.com',
    'Rishit Tandon',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'Rishit Tandon',
    updated_at = NOW();
END $$;