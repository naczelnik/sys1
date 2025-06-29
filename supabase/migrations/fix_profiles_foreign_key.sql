/*
  # Fix Profiles Foreign Key Constraint

  1. Changes
    - Remove foreign key constraint from profiles table
    - Allow profiles to exist independently of auth.users
    - Update user creation function to work without auth dependency

  2. Security
    - Maintain RLS policies
    - Keep proper access controls
*/

-- Usuń foreign key constraint z tabeli profiles
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Aktualizuj funkcję tworzenia użytkownika
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
  IF EXISTS (SELECT 1 FROM profiles WHERE email = user_email) THEN
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
  VALUES (new_user_id, user_full_name, user_email, NOW(), NOW());

  -- Przypisz rolę
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (new_user_id, role_id, auth.uid(), true, NOW());

  -- Utwórz konto użytkownika z domyślnym wygaśnięciem za 30 dni
  INSERT INTO user_accounts (user_id, account_expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (new_user_id, NOW() + INTERVAL '30 days', false, NOW(), NOW());

  RETURN new_user_id;
END;
$$;

-- Aktualizuj funkcję pobierania użytkowników
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
  ORDER BY p.created_at DESC;
END;
$$;

-- Aktualizuj funkcję usuwania użytkownika
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users:delete', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do usuwania użytkowników';
  END IF;

  -- Sprawdź czy można usunąć użytkownika
  IF NOT (SELECT can_delete_user(target_user_id)) THEN
    RAISE EXCEPTION 'Brak uprawnień do usuwania tego użytkownika';
  END IF;

  -- Usuń powiązane dane
  DELETE FROM user_accounts WHERE user_id = target_user_id;
  DELETE FROM user_roles WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;

  RETURN true;
END;
$$;
