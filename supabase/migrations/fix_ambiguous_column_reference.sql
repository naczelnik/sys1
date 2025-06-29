/*
  # Fix Ambiguous Column Reference Error

  1. Problem
    - Błąd "column reference role_id is ambiguous"
    - Konflikt między nazwą zmiennej a nazwą kolumny

  2. Solution
    - Zmień nazwę zmiennej z role_id na target_role_id
    - Użyj aliasów tabel dla jednoznaczności
    - Popraw wszystkie odwołania w funkcji
*/

-- Napraw funkcję z jednoznacznymi nazwami zmiennych
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
  existing_role_check uuid;
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
  SELECT r.id INTO target_role_id
  FROM roles r
  WHERE r.name = user_role_name;

  IF target_role_id IS NULL THEN
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

  -- Sprawdź czy użytkownik już ma tę rolę (z jednoznacznymi odwołaniami)
  SELECT ur.role_id INTO existing_role_check
  FROM user_roles ur 
  WHERE ur.user_id = new_user_id 
    AND ur.role_id = target_role_id 
    AND ur.is_active = true;

  -- Jeśli nie ma roli, dodaj ją
  IF existing_role_check IS NULL THEN
    INSERT INTO user_roles (user_id, role_id, assigned_by, is_active, assigned_at)
    VALUES (
      new_user_id, 
      target_role_id, 
      COALESCE(auth.uid(), new_user_id), 
      true, 
      NOW()
    );
  ELSE
    -- Jeśli już ma rolę, upewnij się że jest aktywna
    UPDATE user_roles 
    SET is_active = true, assigned_at = NOW()
    WHERE user_id = new_user_id AND role_id = target_role_id;
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
