/*
  # Add user profile fields

  1. New Columns
    - Add `phone` column to user_profiles table for storing phone numbers
    - Add `company` column to user_profiles table for storing company information
    - Add `avatar_url` column to user_profiles table for storing profile picture URLs

  2. Functions
    - Update `update_user_profile_and_account` function to handle new fields
    - Ensure all profile updates work with the new columns

  3. Security
    - Maintain existing RLS policies
    - Ensure users can only update their own profile data
*/

-- Add new columns to user_profiles table
DO $$
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN phone text;
  END IF;

  -- Add company column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'company'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN company text;
  END IF;

  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Update the update_user_profile_and_account function to handle new fields
CREATE OR REPLACE FUNCTION update_user_profile_and_account(
  target_user_id uuid,
  new_full_name text DEFAULT NULL,
  new_phone text DEFAULT NULL,
  new_company text DEFAULT NULL,
  new_account_expires_at timestamptz DEFAULT NULL,
  new_is_lifetime_access boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user has permission to update this profile
  -- Users can update their own profile, or admins can update any profile
  IF NOT (
    auth.uid() = target_user_id OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.name IN ('Super Administrator', 'Administrator')
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to update this profile';
  END IF;

  -- Update user profile
  UPDATE user_profiles
  SET
    full_name = COALESCE(new_full_name, full_name),
    phone = COALESCE(new_phone, phone),
    company = COALESCE(new_company, company),
    updated_at = now()
  WHERE user_id = target_user_id;

  -- Update account settings if provided
  IF new_account_expires_at IS NOT NULL OR new_is_lifetime_access IS NOT NULL THEN
    UPDATE user_profiles
    SET
      account_expires_at = CASE 
        WHEN new_is_lifetime_access = true THEN NULL
        ELSE COALESCE(new_account_expires_at, account_expires_at)
      END,
      is_lifetime_access = COALESCE(new_is_lifetime_access, is_lifetime_access),
      updated_at = now()
    WHERE user_id = target_user_id;
  END IF;

  -- Log the update
  INSERT INTO audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    'UPDATE',
    'user_profiles',
    target_user_id,
    '{}',
    jsonb_build_object(
      'full_name', new_full_name,
      'phone', new_phone,
      'company', new_company,
      'account_expires_at', new_account_expires_at,
      'is_lifetime_access', new_is_lifetime_access
    ),
    now()
  );
END;
$$;