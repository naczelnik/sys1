/*
  # Fix User Creation Performance Issue

  1. Problem
    - Funkcja create_user_with_profile się zawiesza
    - Brak błyskawicznego dodawania użytkowników
    - Niepotrzebne sprawdzenia powodują opóźnienia

  2. Solution
    - Uproszczona, szybka funkcja
    - Usunięcie niepotrzebnych sprawdzeń
    - Błyskawiczne dodawanie z natychmiastowym zwrotem
*/

-- Szybka, uproszczona funkcja tworzenia użytkownika
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
  target_role_id uuid;
BEGIN
  -- Sprawdź uprawnienia (szybko)
  IF NOT (
    SELECT has_permission('users:create', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do tworzenia użytkowników';
  END IF;

  -- Sprawdź czy email już istnieje (szybko)
  IF EXISTS (SELECT 1 FROM profiles WHERE email = lower(trim(user_email))) THEN
    RAISE EXCEPTION 'Użytkownik z tym adresem email już istnieje';
  END IF;

  -- Pobierz ID roli (szybko)
  SELECT id INTO target_role_id FROM roles WHERE name = user_role_name;
  
  IF target_role_id IS NULL THEN
    RAISE EXCEPTION 'Nieznana rola: %', user_role_name;
  END IF;

  -- Generuj nowe ID
  new_user_id := gen_random_uuid();

  -- Utwórz profil (błyskawicznie)
  INSERT INTO profiles (id, full_name, email, created_at, updated_at)
  VALUES (
    new_user_id, 
    user_full_name, 
    lower(trim(user_email)), 
    NOW(), 
    NOW()
  );

  -- Dodaj rolę (bez sprawdzania duplikatów - po prostu dodaj)
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
  VALUES (
    new_user_id, 
    target_role_id, 
    COALESCE(auth.uid(), new_user_id), 
    true, 
    NOW()
  )
  ON CONFLICT (user_id, role_id) DO UPDATE SET
    is_active = true,
    assigned_at = NOW();

  -- Utwórz konto (błyskawicznie)
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

  -- Zwróć ID natychmiast
  RETURN new_user_id;
END;
$$;

-- Dodaj funkcję do wysyłania zaproszeń (placeholder - nie blokuje procesu)
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
  -- Placeholder - w przyszłości można dodać wysyłanie emaili
  -- Na razie po prostu zwracamy true żeby nie blokować
  RETURN true;
END;
$$;
