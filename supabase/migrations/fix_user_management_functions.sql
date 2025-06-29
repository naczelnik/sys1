/*
  # Fix User Management Functions - Column Name Correction

  1. Fixed Functions
    - `get_all_users_with_roles` - Poprawiona nazwa kolumny z expires_at na account_expires_at
    - Dodano lepsze obsługiwanie błędów

  2. Security
    - Zachowane wszystkie sprawdzenia uprawnień
*/

-- Poprawiona funkcja do pobierania wszystkich użytkowników z rolami
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
  FROM auth.users au
  LEFT JOIN profiles p ON p.id = au.id
  LEFT JOIN user_roles ur ON ur.user_id = au.id AND ur.is_active = true
  LEFT JOIN roles r ON r.id = ur.role_id
  LEFT JOIN user_accounts ua ON ua.user_id = au.id
  ORDER BY au.created_at DESC;
END;
$$;

-- Poprawiona funkcja do tworzenia użytkownika przez administratora
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

  -- Generuj nowe ID użytkownika
  new_user_id := gen_random_uuid();

  -- Utwórz profil użytkownika
  INSERT INTO profiles (id, full_name, email, updated_at)
  VALUES (new_user_id, user_full_name, user_email, NOW());

  -- Przypisz rolę
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (new_user_id, role_id, auth.uid(), true, NOW());

  -- Utwórz konto użytkownika z domyślnym wygaśnięciem za 30 dni
  INSERT INTO user_accounts (user_id, account_expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (new_user_id, NOW() + INTERVAL '30 days', false, NOW(), NOW());

  RETURN new_user_id;
END;
$$;
