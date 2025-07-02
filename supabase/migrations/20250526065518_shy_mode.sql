/*
  # Create payment proofs storage and enhance subscription requests

  1. New Features:
    - Add storage for payment screenshots
    - Enhance subscription_requests table with more fields
    - Create a function to manage subscription approvals

  2. Changes:
    - Add storage bucket for payment proofs
    - Add screenshot_url field to subscription_requests
    - Add plan_type field to subscription_requests
*/

-- Create a bucket for payment screenshots if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'payment-proofs'
  ) THEN
    -- Simple version without the problematic cors_origins column
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('payment-proofs', 'Payment Proofs', true);
    
    -- Update MIME types and file size limit separately if they exist
    -- This avoids the problematic cors_origins column
    BEGIN
      ALTER TABLE storage.buckets 
      ADD COLUMN IF NOT EXISTS allowed_mime_types TEXT[];
      
      UPDATE storage.buckets 
      SET allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg']
      WHERE id = 'payment-proofs';
    EXCEPTION
      WHEN OTHERS THEN
        -- If column already exists or can't be added, just continue
        NULL;
    END;
    
    BEGIN
      ALTER TABLE storage.buckets 
      ADD COLUMN IF NOT EXISTS file_size_limit BIGINT;
      
      UPDATE storage.buckets 
      SET file_size_limit = 5242880 -- 5MB
      WHERE id = 'payment-proofs';
    EXCEPTION
      WHEN OTHERS THEN
        -- If column already exists or can't be added, just continue
        NULL;
    END;
  END IF;
END $$;

-- Add RLS policy for the bucket
CREATE POLICY "Users can upload their own payment proofs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = 'payment-screenshots');

CREATE POLICY "Users can view their own payment proofs"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add column for transaction_screenshot_url to subscription_requests if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_requests' AND column_name = 'screenshot_url'
  ) THEN
    ALTER TABLE subscription_requests ADD COLUMN screenshot_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_requests' AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE subscription_requests ADD COLUMN plan_type TEXT DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'yearly'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscription_requests' AND column_name = 'notes'
  ) THEN
    ALTER TABLE subscription_requests ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Create function to handle subscription approval
CREATE OR REPLACE FUNCTION handle_subscription_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed to approved, update the user's subscription
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Calculate subscription dates
    DECLARE
      start_date TIMESTAMPTZ := CURRENT_TIMESTAMP;
      end_date TIMESTAMPTZ;
    BEGIN
      -- Set end date based on plan type
      IF NEW.plan_type = 'yearly' OR NEW.amount >= 400 THEN
        end_date := start_date + INTERVAL '1 year';
      ELSE
        end_date := start_date + INTERVAL '1 month';
      END IF;
      
      -- Update the user's profile
      UPDATE profiles
      SET 
        subscription_tier = 'premium',
        subscription_status = 'active',
        subscription_id = NEW.transaction_id,
        price_id = CASE WHEN NEW.plan_type = 'yearly' OR NEW.amount >= 400 THEN 'yearly' ELSE 'monthly' END,
        subscription_start_date = start_date,
        subscription_end_date = end_date
      WHERE id = NEW.user_id;
    END;
  END IF;
  
  -- If status changed to rejected and it was previously approved, reset the subscription
  IF NEW.status = 'rejected' AND OLD.status = 'approved' THEN
    UPDATE profiles
    SET 
      subscription_tier = 'free',
      subscription_status = 'canceled'
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;