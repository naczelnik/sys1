/*
  # Create user_accounts table and fix account expiry system

  1. New Table
    - `user_accounts` - User account management with expiry dates
    - Proper relationships with existing tables
    - RLS policies for security

  2. Functions
    - Fixed account info retrieval functions
    - Profile management functions
    - Account expiry management

  3. Data Migration
    - Migrate existing users to new table structure
    - Set proper expiry dates based on roles
*/

-- Create user_accounts table
CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  role_id uuid REFERENCES user_roles(id) ON DELETE SET NULL,
  account_expires_at timestamptz,
  is_lifetime_access boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own account info"
  ON user_accounts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all accounts"
  ON user_accounts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() 
      AND r.name IN ('super_admin', 'admin')
      AND ur.is_active = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_expires_at ON user_accounts(account_expires_at);
CREATE INDEX IF NOT EXISTS idx_user_accounts_active ON user_accounts(is_active);

-- Create update trigger
CREATE OR REPLACE FUNCTION update_user_accounts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_accounts_updated_at_trigger ON user_accounts;
CREATE TRIGGER update_user_accounts_updated_at_trigger
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW EXECUTE FUNCTION update_user_accounts_updated_at();

-- Migrate existing users to user_accounts table
INSERT INTO user_accounts (user_id, role_id, account_expires_at, is_lifetime_access, is_active)
SELECT 
  p.id as user_id,
  ur.role_id,
  CASE 
    WHEN r.name = 'super_admin' THEN NULL
    WHEN p.account_expires_at IS NOT NULL THEN p.account_expires_at
    ELSE now() + interval '1 year'
  END as account_expires_at,
  CASE 
    WHEN r.name = 'super_admin' THEN true
    ELSE false
  END as is_lifetime_access,
  true as is_active
FROM profiles p
LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.is_active = true
LEFT JOIN roles r ON r.id = ur.role_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_accounts ua WHERE ua.user_id = p.id
)
ON CONFLICT (user_id) DO NOTHING;

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
    COALESCE(r.name, 'user') as user_role,
    COALESCE(r.description, 'Standardowy użytkownik') as role_description,
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
  LEFT JOIN roles r ON r.id = ur.role_id
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
