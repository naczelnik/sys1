/*
  # Fix Super Administrator Account Creation

  1. Account Creation Fix
    - Remove direct auth.users insertion (not allowed)
    - Create function to assign super admin role to existing user
    - Set up proper role assignment system

  2. Super Admin Assignment
    - Function to promote user to super admin
    - Automatic resource allocation
    - Proper role management
*/

-- Drop the problematic function if it exists
DROP FUNCTION IF EXISTS create_super_admin_account();

-- Create function to assign super admin role to existing user
CREATE OR REPLACE FUNCTION assign_super_admin_role(user_email text)
RETURNS void AS $$
DECLARE
  target_user_id uuid;
  super_admin_role_id uuid;
BEGIN
  -- Get user ID by email
  SELECT id INTO target_user_id FROM auth.users WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please register first.', user_email;
  END IF;

  -- Get super admin role ID
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
  
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found';
  END IF;

  -- Assign super admin role
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
  VALUES (target_user_id, super_admin_role_id, target_user_id, true)
  ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_at = now();

  -- Set unlimited resource allocations for super admin
  INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by)
  VALUES 
    (target_user_id, 'flows', -1, target_user_id),
    (target_user_id, 'funnels', -1, target_user_id),
    (target_user_id, 'integrations', -1, target_user_id),
    (target_user_id, 'templates', -1, target_user_id),
    (target_user_id, 'users', -1, target_user_id),
    (target_user_id, 'storage', -1, target_user_id)
  ON CONFLICT (user_id, resource_type) DO UPDATE SET
    resource_limit = -1,
    allocated_by = target_user_id,
    allocated_at = now();

  RAISE NOTICE 'Super Admin role assigned to user: % (ID: %)', user_email, target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if super admin exists
CREATE OR REPLACE FUNCTION check_super_admin_exists()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'super_admin' 
    AND ur.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to list all super admins
CREATE OR REPLACE FUNCTION list_super_admins()
RETURNS TABLE (
  user_id uuid,
  email text,
  full_name text,
  assigned_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown') as full_name,
    ur.assigned_at
  FROM auth.users au
  JOIN user_roles ur ON au.id = ur.user_id
  JOIN roles r ON ur.role_id = r.id
  WHERE r.name = 'super_admin' 
  AND ur.is_active = true
  AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ORDER BY ur.assigned_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
