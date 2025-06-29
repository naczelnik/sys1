/*
  # Naprawa zapisu użytkowników do bazy danych

  1. Nowe funkcje
    - `create_user_with_profile_and_password` - Poprawiona funkcja tworzenia użytkowników
    - `get_all_users_with_roles` - Poprawiona funkcja pobierania użytkowników

  2. Zmiany
    - Naprawiono zapis użytkowników do bazy danych
    - Dodano proper error handling
    - Upewniono się że wszystkie tabele są prawidłowo wypełniane

  3. Security
    - Zachowano wszystkie zabezpieczenia
    - Dodano dodatkowe sprawdzenia integralności danych
*/

-- Napraw funkcję tworzenia użytkownika z hasłem
CREATE OR REPLACE FUNCTION create_user_with_profile_and_password(
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
  current_user_id uuid;
BEGIN
  -- Pobierz ID aktualnego użytkownika
  current_user_id := auth.uid();
  
  -- Sprawdź uprawnienia
  IF NOT (
    has_permission('users:create', current_user_id)
    OR is_super_admin(current_user_id)
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do tworzenia użytkowników';
  END IF;

  -- Wyczyść i sprawdź email
  user_email := lower(trim(user_email));
  
  IF user_email = '' OR user_email IS NULL THEN
    RAISE EXCEPTION 'Email jest wymagany';
  END IF;

  -- Sprawdź czy email już istnieje w profiles
  IF EXISTS (SELECT 1 FROM profiles WHERE email = user_email) THEN
    RAISE EXCEPTION 'Użytkownik z tym emailem już istnieje w systemie';
  END IF;

  -- Sprawdź czy email już istnieje w auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = user_email) THEN
    RAISE EXCEPTION 'Użytkownik z tym emailem już istnieje w auth.users';
  END IF;

  -- Pobierz ID roli
  SELECT id INTO role_id
  FROM roles
  WHERE name = user_role_name;

  IF role_id IS NULL THEN
    RAISE EXCEPTION 'Nieznana rola: %', user_role_name;
  END IF;

  -- Wygeneruj nowe ID użytkownika
  new_user_id := gen_random_uuid();

  RAISE NOTICE 'Tworzę użytkownika: ID=%, Email=%, Name=%, Role=%', new_user_id, user_email, user_full_name, user_role_name;

  -- Utwórz profil użytkownika
  INSERT INTO profiles (id, full_name, email, created_at, updated_at)
  VALUES (new_user_id, user_full_name, user_email, NOW(), NOW());

  RAISE NOTICE 'Profil utworzony dla: %', user_email;

  -- Przypisz rolę użytkownikowi
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (new_user_id, role_id, COALESCE(current_user_id, new_user_id), true, NOW());

  RAISE NOTICE 'Rola przypisana: % dla %', user_role_name, user_email;

  -- Utwórz konto użytkownika z domyślnym wygaśnięciem za 30 dni
  INSERT INTO user_accounts (user_id, expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (new_user_id, NOW() + INTERVAL '30 days', false, NOW(), NOW());

  RAISE NOTICE 'Konto utworzone dla: %', user_email;

  -- Ustaw podstawowe alokacje zasobów
  INSERT INTO resource_allocations (user_id, resource_type, resource_limit, allocated_by, allocated_at)
  VALUES 
    (new_user_id, 'flows', 10, COALESCE(current_user_id, new_user_id), NOW()),
    (new_user_id, 'funnels', 5, COALESCE(current_user_id, new_user_id), NOW()),
    (new_user_id, 'integrations', 3, COALESCE(current_user_id, new_user_id), NOW()),
    (new_user_id, 'templates', 10, COALESCE(current_user_id, new_user_id), NOW()),
    (new_user_id, 'users', 0, COALESCE(current_user_id, new_user_id), NOW()),
    (new_user_id, 'storage', 1000, COALESCE(current_user_id, new_user_id), NOW());

  RAISE NOTICE 'Alokacje zasobów utworzone dla: %', user_email;

  -- Sprawdź czy użytkownik został rzeczywiście utworzony
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = new_user_id) THEN
    RAISE EXCEPTION 'Błąd: Użytkownik nie został zapisany w bazie danych';
  END IF;

  RAISE NOTICE 'Użytkownik % został pomyślnie utworzony z ID: %', user_email, new_user_id;

  RETURN new_user_id;
END;
$$;

-- Upewnij się że funkcja pobierania użytkowników działa prawidłowo
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
    has_permission('users:read', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do przeglądania użytkowników';
  END IF;

  RAISE NOTICE 'Pobieranie użytkowników dla: %', auth.uid();

  RETURN QUERY
  SELECT 
    p.id,
    p.email::text,
    p.full_name,
    p.created_at,
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
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.is_active = true
  LEFT JOIN roles r ON r.id = ur.role_id
  LEFT JOIN user_accounts ua ON ua.user_id = p.id
  WHERE p.email IS NOT NULL
  ORDER BY p.created_at DESC;
END;
$$;

-- Funkcja do sprawdzenia czy użytkownik istnieje
CREATE OR REPLACE FUNCTION check_user_exists(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = lower(trim(user_email))
  );
END;
$$;

-- Funkcja do debugowania - sprawdź stan bazy danych
CREATE OR REPLACE FUNCTION debug_database_state()
RETURNS TABLE (
  table_name text,
  record_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 'profiles'::text, COUNT(*) FROM profiles
  UNION ALL
  SELECT 'user_roles'::text, COUNT(*) FROM user_roles
  UNION ALL
  SELECT 'user_accounts'::text, COUNT(*) FROM user_accounts
  UNION ALL
  SELECT 'resource_allocations'::text, COUNT(*) FROM resource_allocations
  UNION ALL
  SELECT 'roles'::text, COUNT(*) FROM roles;
END;
$$;
