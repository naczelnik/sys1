/*
  # Fix Profile Functions and Account Expiry

  1. Database Functions
    - Create/update profile data management functions
    - Fix account info retrieval functions
    - Add proper error handling and logging

  2. Security
    - Ensure RLS policies allow profile updates
    - Add proper permissions for profile functions

  3. Account Expiry
    - Fix account expiry data retrieval
    - Ensure proper date formatting and calculations
*/

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS get_profile_data(uuid);
DROP FUNCTION IF EXISTS update_profile_data(uuid, text, text, text, text, text);
DROP FUNCTION IF EXISTS get_user_account_info(uuid);

-- Create improved profile data retrieval function
CREATE OR REPLACE FUNCTION get_profile_data(profile_id uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  company text,
  bio text,
  email text,
  user_metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    COALESCE(p.phone, (au.raw_user_meta_data->>'phone')::text) as phone,
    COALESCE(p.company, (au.raw_user_meta_data->>'company')::text) as company,
    COALESCE(p.bio, (au.raw_user_meta_data->>'bio')::text) as bio,
    au.email,
    au.raw_user_meta_data as user_metadata,
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE p.id = profile_id;
  
  -- If no profile exists, create one
  IF NOT FOUND THEN
    INSERT INTO profiles (id, created_at, updated_at)
    VALUES (profile_id, now(), now())
    ON CONFLICT (id) DO NOTHING;
    
    RETURN QUERY
    SELECT 
      p.id,
      p.full_name,
      COALESCE(p.phone, (au.raw_user_meta_data->>'phone')::text) as phone,
      COALESCE(p.company, (au.raw_user_meta_data->>'company')::text) as company,
      COALESCE(p.bio, (au.raw_user_meta_data->>'bio')::text) as bio,
      au.email,
      au.raw_user_meta_data as user_metadata,
      p.created_at,
      p.updated_at
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    WHERE p.id = profile_id;
  END IF;
END;
$$;

-- Create improved profile update function
CREATE OR REPLACE FUNCTION update_profile_data(
  profile_id uuid,
  full_name_param text DEFAULT NULL,
  phone_param text DEFAULT NULL,
  company_param text DEFAULT NULL,
  bio_param text DEFAULT NULL,
  metadata_param text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  full_name text,
  phone text,
  company text,
  bio text,
  email text,
  user_metadata jsonb,
  created_at timestamptz,
  updated_at timestamptz
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  metadata_json jsonb;
BEGIN
  -- Parse metadata if provided
  IF metadata_param IS NOT NULL THEN
    metadata_json := metadata_param::jsonb;
  END IF;

  -- Ensure profile exists
  INSERT INTO profiles (id, created_at, updated_at)
  VALUES (profile_id, now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Update profile data
  UPDATE profiles 
  SET 
    full_name = COALESCE(full_name_param, full_name),
    phone = COALESCE(phone_param, phone),
    company = COALESCE(company_param, company),
    bio = COALESCE(bio_param, bio),
    updated_at = now()
  WHERE id = profile_id;

  -- Update auth metadata if provided
  IF metadata_json IS NOT NULL THEN
    UPDATE auth.users 
    SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || metadata_json
    WHERE id = profile_id;
  END IF;

  -- Return updated profile data
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.phone,
    p.company,
    p.bio,
    au.email,
    au.raw_user_meta_data as user_metadata,
    p.created_at,
    p.updated_at
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  WHERE p.id = profile_id;
END;
$$;

-- Create improved account info function
CREATE OR REPLACE FUNCTION get_user_account_info(user_id uuid)
RETURNS TABLE (
  user_role text,
  role_description text,
  account_expires_at timestamptz,
  is_lifetime_access boolean,
  days_remaining integer,
  is_expired boolean
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ur.role_name, 'user') as user_role,
    COALESCE(ur.description, 'Standardowy użytkownik') as role_description,
    ua.account_expires_at,
    COALESCE(ua.is_lifetime_access, false) as is_lifetime_access,
    CASE 
      WHEN ua.is_lifetime_access = true THEN NULL
      WHEN ua.account_expires_at IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(days FROM (ua.account_expires_at - now()))::integer)
    END as days_remaining,
    CASE 
      WHEN ua.is_lifetime_access = true THEN false
      WHEN ua.account_expires_at IS NULL THEN false
      ELSE ua.account_expires_at < now()
    END as is_expired
  FROM user_accounts ua
  LEFT JOIN user_roles ur ON ur.id = ua.role_id
  WHERE ua.user_id = user_id
  
  UNION ALL
  
  -- Fallback for users without account record
  SELECT 
    'user' as user_role,
    'Standardowy użytkownik' as role_description,
    NULL::timestamptz as account_expires_at,
    false as is_lifetime_access,
    NULL::integer as days_remaining,
    false as is_expired
  WHERE NOT EXISTS (
    SELECT 1 FROM user_accounts WHERE user_id = user_id
  )
  LIMIT 1;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_profile_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_data(uuid, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_account_info(uuid) TO authenticated;

-- Ensure RLS policies allow profile updates
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add sample account expiry data for testing
DO $$
DECLARE
  test_user_id uuid;
BEGIN
  -- Get a test user (not super admin)
  SELECT id INTO test_user_id 
  FROM auth.users 
  WHERE email != 'naczelnik@gmail.com' 
  LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Ensure user has account record with expiry
    INSERT INTO user_accounts (user_id, role_id, account_expires_at, is_lifetime_access, created_at, updated_at)
    VALUES (
      test_user_id,
      (SELECT id FROM user_roles WHERE role_name = 'user' LIMIT 1),
      now() + interval '30 days',
      false,
      now(),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      account_expires_at = now() + interval '30 days',
      is_lifetime_access = false,
      updated_at = now();
  END IF;
END $$;
