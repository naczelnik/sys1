/*
  # User Management Functions

  1. New Functions
    - `get_all_users_with_roles` - Pobiera wszystkich użytkowników z rolami i informacjami o kontach
    - `admin_create_user` - Funkcja do tworzenia użytkowników przez administratorów
    - `admin_update_user_role` - Funkcja do zmiany ról użytkowników

  2. Security
    - Funkcje dostępne tylko dla super_admin i admin
    - Sprawdzanie uprawnień przed wykonaniem operacji
*/

-- Funkcja do pobierania wszystkich użytkowników z rolami
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
    au.id,
    au.email::text,
    p.full_name,
    au.created_at,
    COALESCE(r.name, 'user') as user_role,
    COALESCE(r.description, 'Standardowy użytkownik') as role_description,
    ua.expires_at as account_expires_at,
    COALESCE(ua.is_lifetime_access, false) as is_lifetime_access,
    CASE 
      WHEN ua.is_lifetime_access = true THEN NULL
      WHEN ua.expires_at IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(days FROM (ua.expires_at - NOW()))::integer)
    END as days_remaining,
    CASE 
      WHEN ua.is_lifetime_access = true THEN false
      WHEN ua.expires_at IS NULL THEN false
      ELSE ua.expires_at < NOW()
    END as is_expired
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  LEFT JOIN user_roles ur ON ur.user_id = au.id AND ur.is_active = true
  LEFT JOIN roles r ON r.id = ur.role_id
  LEFT JOIN user_accounts ua ON ua.user_id = au.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Funkcja do tworzenia użytkownika przez administratora
CREATE OR REPLACE FUNCTION admin_create_user(
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
  role_id uuid;
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users:create', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do tworzenia użytkowników';
  END IF;

  -- Pobierz ID roli
  SELECT id INTO role_id
  FROM roles
  WHERE name = user_role_name;

  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Nieznana rola: %', user_role_name;
  END IF;

  -- Utwórz profil użytkownika
  INSERT INTO profiles (id, full_name, email)
  VALUES (gen_random_uuid(), user_full_name, user_email)
  RETURNING id INTO new_user_id;

  -- Przypisz rolę
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
  VALUES (new_user_id, role_id, auth.uid(), true);

  -- Utwórz konto użytkownika z domyślnym wygaśnięciem za 30 dni
  INSERT INTO user_accounts (user_id, expires_at, is_lifetime_access)
  VALUES (new_user_id, NOW() + INTERVAL '30 days', false);

  RETURN new_user_id;
END;
$$;

-- Funkcja do aktualizacji roli użytkownika
CREATE OR REPLACE FUNCTION admin_update_user_role(
  target_user_id uuid,
  new_role_name text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  role_id uuid;
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users:update', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do zmiany ról użytkowników';
  END IF;

  -- Pobierz ID roli
  SELECT id INTO role_id
  FROM roles
  WHERE name = new_role_name;

  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Nieznana rola: %', new_role_name;
  END IF;

  -- Dezaktywuj obecne role
  UPDATE user_roles
  SET is_active = false
  WHERE user_id = target_user_id;

  -- Dodaj nową rolę
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
  VALUES (target_user_id, role_id, auth.uid(), true)
  ON CONFLICT (user_id, role_id) 
  DO UPDATE SET is_active = true, assigned_by = auth.uid(), assigned_at = NOW();

  RETURN true;
END;
$$;
