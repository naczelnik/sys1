/*
  # Create user profiles table and complete user management system

  1. New Tables
    - `user_profiles` - User profile information
      - `user_id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `phone` (text)
      - `company` (text)
      - `avatar_url` (text)
      - `account_expires_at` (timestamptz)
      - `is_lifetime_access` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `roles` - System roles
    - `user_roles` - User role assignments
    - `audit_logs` - Audit trail

  2. Functions
    - `get_all_users_with_roles` - Get users with role information
    - `update_user_profile_and_account` - Update user profile
    - `create_user_with_profile_and_password` - Create new user
    - `admin_delete_user` - Delete user (admin only)
    - `admin_change_user_password` - Change user password
    - `check_user_exists` - Check if user exists
    - `can_delete_user` - Check delete permissions
    - `is_super_admin` - Check super admin status
    - `is_admin` - Check admin status

  3. Security
    - Enable RLS on all tables
    - Proper permission checks
    - Audit logging
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  permissions jsonb DEFAULT '{}',
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  phone text,
  company text,
  avatar_url text,
  account_expires_at timestamptz,
  is_lifetime_access boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id, is_active)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Insert default roles
INSERT INTO roles (name, description, is_system_role) VALUES
('Super Administrator', 'Full system access with all permissions', true),
('Administrator', 'Administrative access with user management', true),
('User', 'Standard user access', true)
ON CONFLICT (name) DO NOTHING;

-- Create RLS policies
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can read roles"
  ON roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read user roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role_id uuid;
BEGIN
  -- Create user profile
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  -- Assign default User role
  SELECT id INTO user_role_id FROM roles WHERE name = 'User' LIMIT 1;
  
  IF user_role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
    VALUES (NEW.id, user_role_id, NEW.id, true);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get all users with roles
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  phone text,
  company text,
  avatar_url text,
  created_at timestamptz,
  user_role text,
  role_description text,
  account_expires_at timestamptz,
  is_lifetime_access boolean,
  days_remaining integer,
  is_expired boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    up.full_name,
    up.phone,
    up.company,
    up.avatar_url,
    au.created_at,
    COALESCE(r.name, 'User') as user_role,
    COALESCE(r.description, 'Standard user access') as role_description,
    up.account_expires_at,
    COALESCE(up.is_lifetime_access, false) as is_lifetime_access,
    CASE 
      WHEN up.is_lifetime_access = true THEN NULL
      WHEN up.account_expires_at IS NULL THEN NULL
      ELSE EXTRACT(DAY FROM up.account_expires_at - now())::integer
    END as days_remaining,
    CASE 
      WHEN up.is_lifetime_access = true THEN false
      WHEN up.account_expires_at IS NULL THEN false
      ELSE up.account_expires_at < now()
    END as is_expired
  FROM auth.users au
  LEFT JOIN user_profiles up ON au.id = up.user_id
  LEFT JOIN user_roles ur ON au.id = ur.user_id AND ur.is_active = true
  LEFT JOIN roles r ON ur.role_id = r.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Function to update user profile and account
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

-- Function to check if user exists
CREATE OR REPLACE FUNCTION check_user_exists(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = user_email
  );
END;
$$;

-- Function to check if user can be deleted
CREATE OR REPLACE FUNCTION can_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
    AND r.name IN ('Super Administrator', 'Administrator')
  ) THEN
    RETURN false;
  END IF;
  
  -- Cannot delete yourself
  IF auth.uid() = target_user_id THEN
    RETURN false;
  END IF;
  
  -- Cannot delete super admin (unless you are super admin)
  IF EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = target_user_id
    AND ur.is_active = true
    AND r.name = 'Super Administrator'
  ) THEN
    RETURN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND r.name = 'Super Administrator'
    );
  END IF;
  
  RETURN true;
END;
$$;

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND r.name = 'Super Administrator'
  );
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = true
    AND r.name IN ('Super Administrator', 'Administrator')
  );
END;
$$;

-- Function to create user with profile and password
CREATE OR REPLACE FUNCTION create_user_with_profile_and_password(
  user_email text,
  user_password text,
  user_full_name text,
  user_role_name text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  role_id uuid;
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
    AND r.name IN ('Super Administrator', 'Administrator')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to create users';
  END IF;

  -- Get role ID
  SELECT id INTO role_id FROM roles WHERE name = user_role_name;
  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Invalid role: %', user_role_name;
  END IF;

  -- Create user in auth.users (this is a simplified version)
  -- In real implementation, you'd use Supabase Admin API
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data
  ) VALUES (
    gen_random_uuid(),
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    jsonb_build_object('full_name', user_full_name)
  ) RETURNING id INTO new_user_id;

  -- Create profile
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (new_user_id, user_full_name);

  -- Assign role
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
  VALUES (new_user_id, role_id, auth.uid(), true);

  RETURN new_user_id;
END;
$$;

-- Function to delete user (admin only)
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check permissions
  IF NOT can_delete_user(target_user_id) THEN
    RAISE EXCEPTION 'Cannot delete this user';
  END IF;

  -- Delete user (cascade will handle related records)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$;

-- Function to change user password (admin only)
CREATE OR REPLACE FUNCTION admin_change_user_password(
  target_user_id uuid,
  new_password text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid()
    AND ur.is_active = true
    AND r.name IN ('Super Administrator', 'Administrator')
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to change passwords';
  END IF;

  -- Update password
  UPDATE auth.users 
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;
END;
$$;