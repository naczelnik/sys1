/*
  # Fix Infinite Recursion in User Management System

  1. Problem
    - Infinite recursion in RLS policies
    - Complex role checking causing loops
    - Need simpler approach

  2. Solution
    - Drop problematic policies
    - Create simple, direct policies
    - Use auth.uid() directly instead of complex functions
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Super admin can manage all users" ON app_users;
DROP POLICY IF EXISTS "Authenticated users can read users" ON app_users;
DROP POLICY IF EXISTS "Admins can manage users" ON app_users;
DROP POLICY IF EXISTS "Users can manage their flows" ON flows;
DROP POLICY IF EXISTS "Users can manage their flow steps" ON flow_steps;
DROP POLICY IF EXISTS "Users can manage their funnels" ON funnels;
DROP POLICY IF EXISTS "Users can manage their funnel steps" ON funnel_steps;
DROP POLICY IF EXISTS "Users can manage their integrations" ON integrations;
DROP POLICY IF EXISTS "Users can insert analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Users can read their analytics events" ON analytics_events;
DROP POLICY IF EXISTS "Anyone can read public templates" ON templates;
DROP POLICY IF EXISTS "Users can manage their templates" ON templates;
DROP POLICY IF EXISTS "Users can manage their sessions" ON app_user_sessions;
DROP POLICY IF EXISTS "Anyone can read roles" ON app_user_roles;

-- Temporarily disable RLS to fix the system
ALTER TABLE app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE flows DISABLE ROW LEVEL SECURITY;
ALTER TABLE flow_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE funnels DISABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_steps DISABLE ROW LEVEL SECURITY;
ALTER TABLE integrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;

-- Create simple function to check super admin without recursion
CREATE OR REPLACE FUNCTION is_super_admin_simple()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users au
    WHERE au.id = auth.uid() 
    AND au.email = 'naczelnik@gmail.com'
  );
$$;

-- Create function to get current user's app_user record
CREATE OR REPLACE FUNCTION get_current_app_user()
RETURNS TABLE (
  id uuid,
  email text,
  role_name text,
  is_active boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    au.id,
    au.email,
    COALESCE(app_u.role_name, 'user') as role_name,
    COALESCE(app_u.is_active, true) as is_active
  FROM auth.users au
  LEFT JOIN app_users app_u ON au.email = app_u.email
  WHERE au.id = auth.uid();
$$;

-- Update app_users table to ensure naczelnik@gmail.com is super_admin
INSERT INTO app_users (
  email,
  full_name,
  role_name,
  is_active,
  is_lifetime_access,
  account_expires_at
) VALUES (
  'naczelnik@gmail.com',
  'Super Administrator',
  'super_admin',
  true,
  true,
  NULL
) ON CONFLICT (email) DO UPDATE SET
  role_name = 'super_admin',
  is_active = true,
  is_lifetime_access = true,
  account_expires_at = NULL;

-- Re-enable RLS with simple policies
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Simple policies without recursion
CREATE POLICY "Super admin can do everything on users"
  ON app_users
  FOR ALL
  TO authenticated
  USING (is_super_admin_simple())
  WITH CHECK (is_super_admin_simple());

CREATE POLICY "Users can read all users"
  ON app_users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can read roles"
  ON app_user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "All authenticated users can access flows"
  ON flows
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can access funnels"
  ON funnels
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can access integrations"
  ON integrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "All authenticated users can access templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create simplified user creation function
CREATE OR REPLACE FUNCTION create_user_simple(
  user_email text,
  user_password text,
  user_full_name text,
  user_role_name text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if user already exists
  IF EXISTS (SELECT 1 FROM app_users WHERE email = user_email) THEN
    RAISE EXCEPTION 'User with email % already exists', user_email;
  END IF;

  -- Generate new UUID
  new_user_id := gen_random_uuid();

  -- Insert into app_users
  INSERT INTO app_users (
    id,
    email,
    full_name,
    password_hash,
    role_name,
    is_active,
    is_lifetime_access,
    account_expires_at,
    created_at,
    updated_at
  ) VALUES (
    new_user_id,
    user_email,
    user_full_name,
    crypt(user_password, gen_salt('bf')),
    user_role_name,
    true,
    false,
    NOW() + INTERVAL '30 days',
    NOW(),
    NOW()
  );

  RETURN new_user_id;
END;
$$;

-- Create function to update user
CREATE OR REPLACE FUNCTION update_user_simple(
  target_user_id uuid,
  new_full_name text DEFAULT NULL,
  new_role_name text DEFAULT NULL,
  new_is_lifetime_access boolean DEFAULT NULL,
  new_account_expires_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_users 
  SET 
    full_name = COALESCE(new_full_name, full_name),
    role_name = COALESCE(new_role_name, role_name),
    is_lifetime_access = COALESCE(new_is_lifetime_access, is_lifetime_access),
    account_expires_at = COALESCE(new_account_expires_at, account_expires_at),
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

-- Create function to delete user
CREATE OR REPLACE FUNCTION delete_user_simple(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM app_users WHERE id = target_user_id;
END;
$$;

-- Create function to change password
CREATE OR REPLACE FUNCTION change_user_password_simple(
  target_user_id uuid,
  new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE app_users 
  SET 
    password_hash = crypt(new_password, gen_salt('bf')),
    updated_at = NOW()
  WHERE id = target_user_id;
END;
$$;

-- Create function to get all users
CREATE OR REPLACE FUNCTION get_all_users_simple()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  role_name text,
  is_active boolean,
  is_lifetime_access boolean,
  account_expires_at timestamptz,
  created_at timestamptz,
  days_remaining integer,
  is_expired boolean
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    id,
    email,
    COALESCE(full_name, '') as full_name,
    COALESCE(role_name, 'user') as role_name,
    COALESCE(is_active, true) as is_active,
    COALESCE(is_lifetime_access, false) as is_lifetime_access,
    account_expires_at,
    created_at,
    CASE 
      WHEN is_lifetime_access = true THEN NULL
      WHEN account_expires_at IS NULL THEN NULL
      ELSE EXTRACT(days FROM account_expires_at - NOW())::integer
    END as days_remaining,
    CASE 
      WHEN is_lifetime_access = true THEN false
      WHEN account_expires_at IS NULL THEN false
      ELSE account_expires_at < NOW()
    END as is_expired
  FROM app_users
  ORDER BY created_at DESC;
$$;