/*
  # Fix profile save functionality

  1. Functions
    - `upsert_user_profile` - Create or update user profile
    - `ensure_user_profile_exists` - Ensure profile exists for current user

  2. Changes
    - Modified profile update to handle missing profiles
    - Added automatic profile creation
*/

-- Function to ensure user profile exists
CREATE OR REPLACE FUNCTION ensure_user_profile_exists(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert profile if it doesn't exist
  INSERT INTO user_profiles (user_id, full_name, created_at, updated_at)
  VALUES (target_user_id, '', now(), now())
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Function to upsert (insert or update) user profile
CREATE OR REPLACE FUNCTION upsert_user_profile(
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

  -- Ensure profile exists first
  PERFORM ensure_user_profile_exists(target_user_id);

  -- Update user profile
  UPDATE user_profiles
  SET
    full_name = COALESCE(new_full_name, full_name),
    phone = COALESCE(new_phone, phone),
    company = COALESCE(new_company, company),
    account_expires_at = CASE 
      WHEN new_is_lifetime_access = true THEN NULL
      ELSE COALESCE(new_account_expires_at, account_expires_at)
    END,
    is_lifetime_access = COALESCE(new_is_lifetime_access, is_lifetime_access),
    updated_at = now()
  WHERE user_id = target_user_id;

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
    'UPSERT',
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

-- Update the existing function to use upsert
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
  -- Use the upsert function
  PERFORM upsert_user_profile(
    target_user_id,
    new_full_name,
    new_phone,
    new_company,
    new_account_expires_at,
    new_is_lifetime_access
  );
END;
$$;

-- Function to create profile for current user if missing
CREATE OR REPLACE FUNCTION create_missing_profile_for_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  user_role_id uuid;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get user email
  SELECT email INTO user_email FROM auth.users WHERE id = current_user_id;

  -- Ensure profile exists
  PERFORM ensure_user_profile_exists(current_user_id);

  -- Ensure user has a role
  IF NOT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = current_user_id AND is_active = true
  ) THEN
    -- Assign default User role
    SELECT id INTO user_role_id FROM roles WHERE name = 'User' LIMIT 1;
    
    IF user_role_id IS NOT NULL THEN
      INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
      VALUES (current_user_id, user_role_id, current_user_id, true);
    END IF;
  END IF;
END;
$$;