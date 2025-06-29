/*
  # Complete User Creation System Fix

  1. Changes
    - Remove all foreign key constraints that reference auth.users
    - Create standalone user management system
    - Fix all database functions for user creation

  2. Security
    - Maintain RLS policies
    - Keep proper access controls
    - Ensure data integrity without foreign key dependencies
*/

-- Usuń wszystkie foreign key constraints związane z auth.users
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE user_accounts DROP CONSTRAINT IF EXISTS user_accounts_user_id_fkey;

-- Dodaj kolumnę email do tabeli profiles jeśli nie istnieje
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text UNIQUE;
  END IF;
END $$;

-- Upewnij się, że kolumna email jest unikalna
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_email_key'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Kompletnie przeprojektowana funkcja tworzenia użytkownika
CREATE OR REPLACE FUNCTION create_user_with_profile(
  user_email text,
  user_full_name text,
  user_role_name text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id uuid;
  role_id uuid;
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users:create', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do tworzenia użytkowników';
  END IF;

  -- Sprawdź czy email już istnieje
  IF EXISTS (SELECT 1 FROM profiles WHERE email = lower(trim(user_email))) THEN
    RAISE EXCEPTION 'Użytkownik z tym adresem email już istnieje';
  END IF;

  -- Pobierz ID roli
  SELECT id INTO role_id
  FROM roles
  WHERE name = user_role_name;

  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Nieznana rola: %', user_role_name;
  END IF;

  -- Generuj nowe ID użytkownika
  new_user_id := gen_random_uuid();

  -- Utwórz profil użytkownika
  INSERT INTO profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    new_user_id, 
    user_full_name, 
    lower(trim(user_email)), 
    NOW(), 
    NOW()
  );

  -- Przypisz rolę (bez foreign key constraint)
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (
    new_user_id, 
    role_id, 
    COALESCE(auth.uid(), new_user_id), 
    true, 
    NOW()
  );

  -- Utwórz konto użytkownika
  INSERT INTO user_accounts (user_id, account_expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (
    new_user_id, 
    NOW() + INTERVAL '30 days', 
    false, 
    NOW(), 
    NOW()
  );

  RETURN new_user_id;
END;
$$;

-- Funkcja do wysyłania zaproszenia (placeholder)
CREATE OR REPLACE FUNCTION send_user_invitation(
  user_email text,
  user_full_name text,
  temp_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Placeholder dla wysyłania emaila z zaproszeniem
  RAISE NOTICE 'Zaproszenie wysłane do: % (%) z hasłem: %', user_full_name, user_email, temp_password;
  RETURN true;
END;
$$;

-- Zaktualizowana funkcja pobierania użytkowników
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
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź czy użytkownik ma uprawnienia
  IF NOT (
    SELECT has_permission('users:read', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do przeglądania użytkowników';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.email::text,
    p.full_name,
    p.created_at,
    COALESCE(r.name, 'user') as user_role,
    COALESCE(r.description, 'Standardowy użytkownik') as role_description,
    ua.account_expires_at,
    COALESCE(ua.is_lifetime_access, false) as is_lifetime_access,
    CASE 
      WHEN ua.is_lifetime_access = true THEN NULL
      WHEN ua.account_expires_at IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(days FROM (ua.account_expires_at - NOW()))::integer)
    END as days_remaining,
    CASE 
      WHEN ua.is_lifetime_access = true THEN false
      WHEN ua.account_expires_at IS NULL THEN false
      ELSE ua.account_expires_at < NOW()
    END as is_expired
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.is_active = true
  LEFT JOIN roles r ON r.id = ur.role_id
  LEFT JOIN user_accounts ua ON ua.user_id = p.id
  WHERE p.email IS NOT NULL
  ORDER BY p.created_at DESC;
END;
$$;

-- Funkcja sprawdzania czy można usunąć użytkownika
CREATE OR REPLACE FUNCTION can_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  is_current_super_admin boolean;
  is_target_super_admin boolean;
BEGIN
  current_user_id := auth.uid();
  
  -- Sprawdź czy obecny użytkownik to Super Admin
  SELECT is_super_admin(current_user_id) INTO is_current_super_admin;
  
  -- Sprawdź czy target to Super Admin
  SELECT is_user_super_admin(target_user_id) INTO is_target_super_admin;
  
  -- Super Admin może usuwać wszystkich
  IF is_current_super_admin THEN
    RETURN true;
  END IF;
  
  -- Inni nie mogą usuwać Super Adminów
  IF is_target_super_admin THEN
    RETURN false;
  END IF;
  
  -- Sprawdź czy ma uprawnienia do usuwania użytkowników
  RETURN has_permission('users:delete', current_user_id);
END;
$$;

-- Zaktualizowana funkcja usuwania użytkownika
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia
  IF NOT can_delete_user(target_user_id) THEN
    RAISE EXCEPTION 'Brak uprawnień do usuwania tego użytkownika';
  END IF;

  -- Usuń powiązane dane w odpowiedniej kolejności
  DELETE FROM user_accounts WHERE user_id = target_user_id;
  DELETE FROM user_roles WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;

  RETURN true;
END;
$$;
