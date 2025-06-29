/*
  # Czyszczenie duplikatów funkcji

  1. Usuwanie wszystkich konfliktowych funkcji
    - Usuń wszystkie wersje can_delete_user
    - Usuń wszystkie wersje admin_delete_user
    - Usuń inne konfliktowe funkcje

  2. Odtworzenie czystych funkcji
    - Jedna wersja can_delete_user
    - Jedna wersja admin_delete_user
    - Poprawne sygnatury funkcji

  3. Naprawa
    - Rozwiązanie konfliktów PostgreSQL
    - Przywrócenie funkcjonalności usuwania
*/

-- Usuń wszystkie wersje konfliktowych funkcji
DROP FUNCTION IF EXISTS can_delete_user(uuid);
DROP FUNCTION IF EXISTS can_delete_user(uuid, uuid);
DROP FUNCTION IF EXISTS admin_delete_user(uuid);
DROP FUNCTION IF EXISTS admin_delete_user(uuid, uuid);

-- Usuń inne potencjalnie konfliktowe funkcje
DROP FUNCTION IF EXISTS get_user_account_info(uuid);
DROP FUNCTION IF EXISTS get_profile_data(uuid);
DROP FUNCTION IF EXISTS create_user_with_profile(text, text, text);
DROP FUNCTION IF EXISTS create_user_with_profile_and_password(text, text, text, text);
DROP FUNCTION IF EXISTS update_profile_data(uuid, text, text);

-- Odtwórz funkcję sprawdzania uprawnień do usuwania
CREATE OR REPLACE FUNCTION can_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  -- Pobierz ID aktualnego użytkownika
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Nie można usunąć samego siebie
  IF current_user_id = target_user_id THEN
    RETURN false;
  END IF;
  
  -- Sprawdź czy aktualny użytkownik to Super Admin
  IF is_super_admin(current_user_id) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Odtwórz funkcję usuwania użytkownika
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
BEGIN
  current_user_id := auth.uid();
  
  -- Sprawdź uprawnienia
  IF NOT can_delete_user(target_user_id) THEN
    RAISE EXCEPTION 'Brak uprawnień do usuwania tego użytkownika';
  END IF;
  
  -- Pobierz email użytkownika
  SELECT email INTO user_email FROM profiles WHERE id = target_user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono użytkownika';
  END IF;
  
  -- Usuń powiązane dane w odpowiedniej kolejności
  DELETE FROM resource_allocations WHERE user_id = target_user_id;
  DELETE FROM user_roles WHERE user_id = target_user_id;
  DELETE FROM user_accounts WHERE user_id = target_user_id;
  DELETE FROM profiles WHERE id = target_user_id;
  
  RETURN true;
END;
$$;

-- Odtwórz funkcję pobierania informacji o koncie
CREATE OR REPLACE FUNCTION get_user_account_info(user_uuid uuid)
RETURNS TABLE (
  user_id uuid,
  account_expires_at timestamptz,
  is_lifetime_access boolean,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ua.user_id,
    ua.account_expires_at,
    COALESCE(ua.is_lifetime_access, false) as is_lifetime_access,
    ua.updated_at
  FROM user_accounts ua
  WHERE ua.user_id = user_uuid;
END;
$$;

-- Odtwórz funkcję pobierania danych profilu
CREATE OR REPLACE FUNCTION get_profile_data(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  full_name text,
  email text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email,
    p.created_at,
    p.updated_at
  FROM profiles p
  WHERE p.id = user_uuid;
END;
$$;
