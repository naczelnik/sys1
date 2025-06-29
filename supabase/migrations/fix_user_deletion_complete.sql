/*
  # Kompletna naprawa funkcji usuwania użytkowników

  1. Nowe funkcje
    - `can_delete_user` - Sprawdza czy można usunąć użytkownika
    - `admin_delete_user` - Usuwa użytkownika z wszystkich tabel
    - Poprawione funkcje z lepszym error handling

  2. Zmiany
    - Naprawiono logikę usuwania użytkowników
    - Dodano szczegółowe logowanie
    - Poprawiono sprawdzanie uprawnień

  3. Security
    - Super Administrator może usuwać wszystkich użytkowników
    - Sprawdzanie uprawnień przed każdą operacją
*/

-- Funkcja sprawdzająca czy można usunąć użytkownika
CREATE OR REPLACE FUNCTION can_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  current_user_role text;
  target_user_role text;
BEGIN
  -- Pobierz ID aktualnego użytkownika
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE NOTICE 'Brak zalogowanego użytkownika';
    RETURN false;
  END IF;
  
  -- Nie można usunąć samego siebie
  IF current_user_id = target_user_id THEN
    RAISE NOTICE 'Nie można usunąć samego siebie';
    RETURN false;
  END IF;
  
  -- Sprawdź czy aktualny użytkownik to Super Admin
  IF is_super_admin(current_user_id) THEN
    RAISE NOTICE 'Super Admin może usuwać wszystkich użytkowników';
    RETURN true;
  END IF;
  
  -- Pobierz rolę aktualnego użytkownika
  SELECT r.name INTO current_user_role
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = current_user_id AND ur.is_active = true
  LIMIT 1;
  
  -- Pobierz rolę docelowego użytkownika
  SELECT r.name INTO target_user_role
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = target_user_id AND ur.is_active = true
  LIMIT 1;
  
  RAISE NOTICE 'Current user role: %, Target user role: %', current_user_role, target_user_role;
  
  -- Admin może usuwać tylko zwykłych użytkowników
  IF current_user_role = 'admin' AND target_user_role IN ('user', 'viewer') THEN
    RAISE NOTICE 'Admin może usunąć tego użytkownika';
    RETURN true;
  END IF;
  
  RAISE NOTICE 'Brak uprawnień do usuwania tego użytkownika';
  RETURN false;
END;
$$;

-- Funkcja do usuwania użytkownika
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  user_email text;
  deleted_count integer := 0;
BEGIN
  current_user_id := auth.uid();
  
  RAISE NOTICE 'Rozpoczynam usuwanie użytkownika: %', target_user_id;
  
  -- Pobierz email użytkownika do logowania
  SELECT email INTO user_email FROM profiles WHERE id = target_user_id;
  
  IF user_email IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono użytkownika o ID: %', target_user_id;
  END IF;
  
  RAISE NOTICE 'Usuwam użytkownika: % (%)', user_email, target_user_id;
  
  -- Sprawdź uprawnienia
  IF NOT can_delete_user(target_user_id) THEN
    RAISE EXCEPTION 'Brak uprawnień do usuwania tego użytkownika';
  END IF;
  
  RAISE NOTICE 'Uprawnienia potwierdzone, rozpoczynam usuwanie...';
  
  -- Usuń powiązane dane w odpowiedniej kolejności
  
  -- 1. Usuń alokacje zasobów
  DELETE FROM resource_allocations WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Usunięto % alokacji zasobów', deleted_count;
  
  -- 2. Usuń role użytkownika
  DELETE FROM user_roles WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Usunięto % ról użytkownika', deleted_count;
  
  -- 3. Usuń konto użytkownika
  DELETE FROM user_accounts WHERE user_id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Usunięto % kont użytkownika', deleted_count;
  
  -- 4. Usuń profil użytkownika (ostatni)
  DELETE FROM profiles WHERE id = target_user_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Usunięto % profili użytkownika', deleted_count;
  
  IF deleted_count = 0 THEN
    RAISE EXCEPTION 'Nie udało się usunąć profilu użytkownika';
  END IF;
  
  RAISE NOTICE 'Użytkownik % został pomyślnie usunięty', user_email;
  
  RETURN true;
END;
$$;

-- Funkcja do sprawdzenia czy użytkownik istnieje (pomocnicza)
CREATE OR REPLACE FUNCTION user_exists(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM profiles WHERE id = user_id);
END;
$$;
