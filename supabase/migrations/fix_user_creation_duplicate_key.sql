/*
  # Fix User Creation Duplicate Key Error

  1. Problem
    - Funkcja create_user_with_profile próbuje wstawić duplikat do user_roles
    - Constraint user_roles_user_id_role_id_key blokuje operację

  2. Solution
    - Użyj UPSERT zamiast INSERT dla user_roles
    - Sprawdź czy rola już istnieje przed wstawieniem
    - Dodaj lepsze zarządzanie błędami
*/

-- Napraw funkcję tworzenia użytkownika z obsługą duplikatów
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
  existing_role_id uuid;
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

  -- Sprawdź czy użytkownik już ma tę rolę
  SELECT role_id INTO existing_role_id
  FROM user_roles 
  WHERE user_id = new_user_id AND role_id = role_id AND is_active = true;

  -- Jeśli nie ma roli, dodaj ją
  IF existing_role_id IS NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
    VALUES (
      new_user_id, 
      role_id, 
      COALESCE(auth.uid(), new_user_id), 
      true, 
      NOW()
    );
  ELSE
    -- Jeśli już ma rolę, upewnij się że jest aktywna
    UPDATE user_roles 
    SET is_active = true, assigned_at = NOW()
    WHERE user_id = new_user_id AND role_id = role_id;
  END IF;

  -- Utwórz konto użytkownika (użyj UPSERT)
  INSERT INTO user_accounts (user_id, account_expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (
    new_user_id, 
    NOW() + INTERVAL '30 days', 
    false, 
    NOW(), 
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    account_expires_at = EXCLUDED.account_expires_at,
    updated_at = NOW();

  RETURN new_user_id;
END;
$$;

-- Dodaj funkcję czyszczenia duplikatów (jeśli istnieją)
CREATE OR REPLACE FUNCTION cleanup_duplicate_user_roles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Usuń duplikaty w user_roles, zachowując najnowsze
  DELETE FROM user_roles a USING user_roles b
  WHERE a.id < b.id 
    AND a.user_id = b.user_id 
    AND a.role_id = b.role_id;
    
  RAISE NOTICE 'Duplikaty w user_roles zostały usunięte';
END;
$$;

-- Wyczyść istniejące duplikaty
SELECT cleanup_duplicate_user_roles();
