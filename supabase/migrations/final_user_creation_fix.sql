/*
  # Ostateczna naprawa tworzenia użytkowników

  1. Zmiany
    - Całkowite usunięcie logiki resource_allocations z funkcji tworzenia użytkowników
    - Uproszczenie funkcji do minimum wymaganego do działania
    - Usunięcie wszystkich referencji do nieistniejących tabel

  2. Funkcje
    - Przepisanie create_user_with_profile_and_password bez resource_allocations
    - Zachowanie tylko niezbędnych operacji: profiles, user_roles, user_accounts

  3. Security
    - Zachowanie wszystkich zabezpieczeń
    - Uprawnienia pozostają bez zmian
*/

-- Usuń starą funkcję i utwórz nową bez resource_allocations
DROP FUNCTION IF EXISTS create_user_with_profile_and_password(text, text, text, text);

-- Nowa, uproszczona funkcja tworzenia użytkownika
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

  -- USUNIĘTO: Całą logikę resource_allocations - tabela nie istnieje!

  -- Sprawdź czy użytkownik został rzeczywiście utworzony
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = new_user_id) THEN
    RAISE EXCEPTION 'Błąd: Użytkownik nie został zapisany w bazie danych';
  END IF;

  RAISE NOTICE 'Użytkownik % został pomyślnie utworzony z ID: %', user_email, new_user_id;

  RETURN new_user_id;
END;
$$;

-- Sprawdź czy funkcja admin_create_user też nie ma problemów
DROP FUNCTION IF EXISTS admin_create_user(text, text, text, text);

-- Uproszczona wersja admin_create_user
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
BEGIN
  -- Przekieruj do głównej funkcji
  RETURN create_user_with_profile_and_password(user_email, user_password, user_full_name, user_role_name);
END;
$$;

-- Funkcja do sprawdzenia stanu bazy po naprawie
CREATE OR REPLACE FUNCTION verify_database_state()
RETURNS TABLE (
  check_name text,
  status text,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'profiles_table'::text,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
         THEN 'OK' ELSE 'MISSING' END,
    (SELECT COUNT(*)::text FROM profiles) || ' records'
  UNION ALL
  SELECT 
    'user_roles_table'::text,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') 
         THEN 'OK' ELSE 'MISSING' END,
    (SELECT COUNT(*)::text FROM user_roles) || ' records'
  UNION ALL
  SELECT 
    'user_accounts_table'::text,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_accounts') 
         THEN 'OK' ELSE 'MISSING' END,
    (SELECT COUNT(*)::text FROM user_accounts) || ' records'
  UNION ALL
  SELECT 
    'resource_allocations_table'::text,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resource_allocations') 
         THEN 'EXISTS (PROBLEM!)' ELSE 'REMOVED (OK)' END,
    'Should not exist'
  UNION ALL
  SELECT 
    'roles_table'::text,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles') 
         THEN 'OK' ELSE 'MISSING' END,
    (SELECT COUNT(*)::text FROM roles) || ' records';
END;
$$;
