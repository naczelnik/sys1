/*
  # Complete Super Administrator System

  1. New Tables
    - `roles` - System roles (super_admin, admin, user, viewer)
    - `permissions` - System permissions
    - `role_permissions` - Role-permission mappings
    - `user_roles` - User role assignments
    - `user_profiles` - Extended user information
    - `user_accounts` - Account management (expiration, lifetime access)

  2. Security
    - Enable RLS on all tables
    - Super Admin bypass policies
    - Role-based access control

  3. Functions
    - User management functions
    - Permission checking
    - Role assignment
    - Account management
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  is_system_role boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, permission_id)
);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES auth.users(id),
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  company text,
  position text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_accounts table
CREATE TABLE IF NOT EXISTS user_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  account_expires_at timestamptz,
  is_lifetime_access boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;

-- Insert system roles
INSERT INTO roles (name, description, is_system_role) VALUES
  ('super_admin', 'Super Administrator with full system access', true),
  ('admin', 'Administrator with limited system access', true),
  ('user', 'Regular user with basic access', true),
  ('viewer', 'Read-only access user', true)
ON CONFLICT (name) DO NOTHING;

-- Insert system permissions
INSERT INTO permissions (name, description, resource, action) VALUES
  ('users.create', 'Create new users', 'users', 'create'),
  ('users.read', 'View user information', 'users', 'read'),
  ('users.update', 'Update user information', 'users', 'update'),
  ('users.delete', 'Delete users', 'users', 'delete'),
  ('users.manage_roles', 'Assign/remove user roles', 'users', 'manage_roles'),
  ('users.impersonate', 'Impersonate other users', 'users', 'impersonate'),
  ('roles.create', 'Create new roles', 'roles', 'create'),
  ('roles.read', 'View roles', 'roles', 'read'),
  ('roles.update', 'Update roles', 'roles', 'update'),
  ('roles.delete', 'Delete roles', 'roles', 'delete'),
  ('permissions.manage', 'Manage permissions', 'permissions', 'manage'),
  ('system.admin', 'Full system administration', 'system', 'admin')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
DO $$
DECLARE
  super_admin_role_id uuid;
  admin_role_id uuid;
  user_role_id uuid;
  viewer_role_id uuid;
  perm_id uuid;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';
  SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';

  -- Super Admin gets ALL permissions
  FOR perm_id IN SELECT id FROM permissions LOOP
    INSERT INTO role_permissions (role_id, permission_id) 
    VALUES (super_admin_role_id, perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- Admin gets most permissions except super admin ones
  FOR perm_id IN SELECT id FROM permissions WHERE name NOT IN ('system.admin', 'roles.create', 'roles.delete', 'permissions.manage') LOOP
    INSERT INTO role_permissions (role_id, permission_id) 
    VALUES (admin_role_id, perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;

  -- User gets basic read permissions
  SELECT id INTO perm_id FROM permissions WHERE name = 'users.read';
  INSERT INTO role_permissions (role_id, permission_id) 
  VALUES (user_role_id, perm_id)
  ON CONFLICT (role_id, permission_id) DO NOTHING;

  -- Viewer gets only read permissions
  FOR perm_id IN SELECT id FROM permissions WHERE action = 'read' LOOP
    INSERT INTO role_permissions (role_id, permission_id) 
    VALUES (viewer_role_id, perm_id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
END $$;

-- Create function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid 
    AND r.name = 'super_admin' 
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_uuid 
    AND r.name IN ('super_admin', 'admin')
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all users with roles
CREATE OR REPLACE FUNCTION get_all_users_with_roles()
RETURNS TABLE (
  id uuid,
  email text,
  full_name text,
  created_at timestamptz,
  user_role text,
  role_description text,
  account_expires_at timestamptz,
  is_lifetime_access boolean,
  days_remaining integer,
  is_expired boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    COALESCE(up.full_name, '') as full_name,
    u.created_at,
    COALESCE(r.name, 'user') as user_role,
    COALESCE(r.description, 'Regular user') as role_description,
    ua.account_expires_at,
    COALESCE(ua.is_lifetime_access, false) as is_lifetime_access,
    CASE 
      WHEN ua.is_lifetime_access = true THEN NULL
      WHEN ua.account_expires_at IS NULL THEN NULL
      ELSE EXTRACT(days FROM ua.account_expires_at - now())::integer
    END as days_remaining,
    CASE 
      WHEN ua.is_lifetime_access = true THEN false
      WHEN ua.account_expires_at IS NULL THEN false
      ELSE ua.account_expires_at < now()
    END as is_expired
  FROM auth.users u
  LEFT JOIN user_profiles up ON u.id = up.user_id
  LEFT JOIN user_accounts ua ON u.id = ua.user_id
  LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
  LEFT JOIN roles r ON ur.role_id = r.id
  ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create user with profile and password
CREATE OR REPLACE FUNCTION create_user_with_profile_and_password(
  user_email text,
  user_password text,
  user_full_name text,
  user_role_name text DEFAULT 'user'
)
RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  role_id uuid;
BEGIN
  -- Create user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO new_user_id;

  -- Create user profile
  INSERT INTO user_profiles (user_id, full_name)
  VALUES (new_user_id, user_full_name);

  -- Create user account
  INSERT INTO user_accounts (user_id, is_lifetime_access, created_by)
  VALUES (new_user_id, false, auth.uid());

  -- Assign role
  SELECT id INTO role_id FROM roles WHERE name = user_role_name;
  IF role_id IS NOT NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (new_user_id, role_id, auth.uid());
  END IF;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update user profile and account
CREATE OR REPLACE FUNCTION update_user_profile_and_account(
  target_user_id uuid,
  new_full_name text DEFAULT NULL,
  new_account_expires_at timestamptz DEFAULT NULL,
  new_is_lifetime_access boolean DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  -- Update profile if provided
  IF new_full_name IS NOT NULL THEN
    UPDATE user_profiles 
    SET full_name = new_full_name, updated_at = now()
    WHERE user_id = target_user_id;
    
    -- Insert if doesn't exist
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (target_user_id, new_full_name)
    ON CONFLICT (user_id) DO UPDATE SET 
      full_name = EXCLUDED.full_name,
      updated_at = now();
  END IF;

  -- Update account if provided
  IF new_account_expires_at IS NOT NULL OR new_is_lifetime_access IS NOT NULL THEN
    UPDATE user_accounts 
    SET 
      account_expires_at = COALESCE(new_account_expires_at, account_expires_at),
      is_lifetime_access = COALESCE(new_is_lifetime_access, is_lifetime_access),
      updated_at = now()
    WHERE user_id = target_user_id;
    
    -- Insert if doesn't exist
    INSERT INTO user_accounts (user_id, account_expires_at, is_lifetime_access, created_by)
    VALUES (target_user_id, new_account_expires_at, COALESCE(new_is_lifetime_access, false), auth.uid())
    ON CONFLICT (user_id) DO UPDATE SET 
      account_expires_at = COALESCE(EXCLUDED.account_expires_at, user_accounts.account_expires_at),
      is_lifetime_access = COALESCE(EXCLUDED.is_lifetime_access, user_accounts.is_lifetime_access),
      updated_at = now();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to change user password
CREATE OR REPLACE FUNCTION admin_change_user_password(
  target_user_id uuid,
  new_password text
)
RETURNS void AS $$
BEGIN
  UPDATE auth.users 
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to delete user
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void AS $$
BEGIN
  -- Delete from auth.users (cascades to other tables)
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user exists
CREATE OR REPLACE FUNCTION check_user_exists(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign role to user
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id uuid,
  role_name text
)
RETURNS void AS $$
DECLARE
  role_id uuid;
BEGIN
  -- Get role ID
  SELECT id INTO role_id FROM roles WHERE name = role_name;
  
  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Role % not found', role_name;
  END IF;

  -- Deactivate current roles
  UPDATE user_roles 
  SET is_active = false 
  WHERE user_id = target_user_id;

  -- Assign new role
  INSERT INTO user_roles (user_id, role_id, assigned_by)
  VALUES (target_user_id, role_id, auth.uid())
  ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_by = auth.uid(),
    assigned_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Super admin can manage all roles"
  ON roles FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view roles"
  ON roles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage all permissions"
  ON permissions FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view permissions"
  ON permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage role permissions"
  ON role_permissions FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Super admin can manage all user roles"
  ON user_roles FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own roles"
  ON user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Super admin can manage all profiles"
  ON user_profiles FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Super admin can manage all accounts"
  ON user_accounts FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

CREATE POLICY "Users can view own account"
  ON user_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_user_id ON user_accounts(user_id);

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_accounts_updated_at
  BEFORE UPDATE ON user_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Assign super admin role to naczelnik@gmail.com
DO $$
DECLARE
  super_admin_user_id uuid;
  super_admin_role_id uuid;
BEGIN
  -- Get user ID for naczelnik@gmail.com
  SELECT id INTO super_admin_user_id FROM auth.users WHERE email = 'naczelnik@gmail.com';
  
  IF super_admin_user_id IS NOT NULL THEN
    -- Get super admin role ID
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
    
    -- Create profile if doesn't exist
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (super_admin_user_id, 'Super Administrator')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create account if doesn't exist
    INSERT INTO user_accounts (user_id, is_lifetime_access, created_by)
    VALUES (super_admin_user_id, true, super_admin_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Assign super admin role
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (super_admin_user_id, super_admin_role_id, super_admin_user_id)
    ON CONFLICT (user_id, role_id) DO UPDATE SET
      is_active = true,
      assigned_at = now();
  END IF;
END $$;
