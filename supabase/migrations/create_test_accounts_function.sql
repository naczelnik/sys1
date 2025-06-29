/*
  # Create Test Accounts Function

  1. Function Creation
    - Safe function to create test accounts
    - Handles existing accounts gracefully
    - Uses proper Supabase auth methods

  2. Test Accounts
    - demo@funnelflow.app (Demo User)
    - funnelflow.test@gmail.com (Test User)
*/

-- Create function to safely create test accounts
CREATE OR REPLACE FUNCTION create_test_accounts()
RETURNS void AS $$
DECLARE
  demo_user_id uuid;
  test_user_id uuid;
BEGIN
  -- Check and create demo account
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@funnelflow.app';
  
  IF demo_user_id IS NULL THEN
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
      'demo@funnelflow.app',
      crypt('demo123456', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Demo User"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO demo_user_id;
    
    RAISE NOTICE 'Created demo account: demo@funnelflow.app';
  ELSE
    RAISE NOTICE 'Demo account already exists: demo@funnelflow.app';
  END IF;

  -- Check and create test account
  SELECT id INTO test_user_id FROM auth.users WHERE email = 'funnelflow.test@gmail.com';
  
  IF test_user_id IS NULL THEN
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
      'funnelflow.test@gmail.com',
      crypt('FunnelFlow2024!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Test User"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO test_user_id;
    
    RAISE NOTICE 'Created test account: funnelflow.test@gmail.com';
  ELSE
    RAISE NOTICE 'Test account already exists: funnelflow.test@gmail.com';
  END IF;

  RAISE NOTICE 'Test accounts setup completed successfully';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function to create test accounts
SELECT create_test_accounts();

-- Drop the function after use for security
DROP FUNCTION create_test_accounts();
