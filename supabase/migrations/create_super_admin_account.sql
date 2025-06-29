/*
  # Create Super Administrator Account

  1. Account Creation
    - Create Super Admin user: Artur Ścibisz (naczelnik@gmail.com)
    - Assign Super Admin role
    - Set unlimited resource allocations

  2. Security
    - Bypass email confirmation for admin account
    - Set secure password as requested
*/

-- Create Super Admin account function
CREATE OR REPLACE FUNCTION create_super_admin_account()
RETURNS void AS $$
DECLARE
  admin_user_id uuid;
  super_admin_role_id uuid;
BEGIN
  -- Get super admin role ID
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
  
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super admin role not found';
  END IF;

  -- Check if admin user already exists
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'naczelnik@gmail.com';
  
  IF admin_user_id IS NULL THEN
    -- Create the admin user directly in auth.users
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
      'naczelnik@gmail.com',
      crypt('naczelnik@gmail.com', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"full_name": "Artur Ścibisz", "role": "super_admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_user_id;
    
    RAISE NOTICE 'Created Super Admin user with ID: %', admin_user_id;
  ELSE
    RAISE NOTICE 'Super Admin user already exists with ID: %', admin_user_id;
  END IF;

  -- Assign super admin role
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
  VALUES (admin_user_id, super_admin_role_id, admin_user_id, true)
  ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_at = now();

  -- Set unlimited resource allocations for super admin
  INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by)
  VALUES 
    (admin_user_id, 'flows', -1, admin_user_id),
    (admin_user_id, 'funnels', -1, admin_user_id),
    (admin_user_id, 'integrations', -1, admin_user_id),
    (admin_user_id, 'templates', -1, admin_user_id),
    (admin_user_id, 'users', -1, admin_user_id),
    (admin_user_id, 'storage', -1, admin_user_id)
  ON CONFLICT (user_id, resource_type) DO UPDATE SET
    resource_limit = -1,
    allocated_by = admin_user_id,
    allocated_at = now();

  RAISE NOTICE 'Super Admin account setup completed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create the account
SELECT create_super_admin_account();

-- Drop the function after use for security
DROP FUNCTION create_super_admin_account();
