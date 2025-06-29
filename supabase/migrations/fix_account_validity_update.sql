/*
  # Fix Account Validity Update Issue

  1. Problem
    - Błąd "duplicate key value violates unique constraint user_accounts_user_id_key"
    - Funkcja updateUser próbuje wstawić duplikat zamiast aktualizować

  2. Solution
    - Napraw funkcję updateUser żeby używała UPSERT prawidłowo
    - Dodaj lepsze obsługiwanie konfliktów
    - Błyskawiczne aktualizacje bez błędów
*/

-- Napraw funkcję aktualizacji użytkownika
CREATE OR REPLACE FUNCTION update_user_profile_and_account(
  target_user_id uuid,
  new_full_name text DEFAULT NULL,
  new_account_expires_at timestamptz DEFAULT NULL,
  new_is_lifetime_access boolean DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users:update', auth.uid())
    OR is_super_admin(auth.uid())
    OR auth.uid() = target_user_id
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do aktualizacji użytkownika';
  END IF;

  -- Aktualizuj profil jeśli podano nową nazwę
  IF new_full_name IS NOT NULL THEN
    UPDATE profiles 
    SET 
      full_name = new_full_name,
      updated_at = NOW()
    WHERE id = target_user_id;
  END IF;

  -- Aktualizuj konto użytkownika (UPSERT)
  IF new_account_expires_at IS NOT NULL OR new_is_lifetime_access IS NOT NULL THEN
    INSERT INTO user_accounts (
      user_id, 
      account_expires_at, 
      is_lifetime_access, 
      created_at, 
      updated_at
    )
    VALUES (
      target_user_id,
      CASE 
        WHEN new_is_lifetime_access = true THEN NULL
        ELSE COALESCE(new_account_expires_at, NOW() + INTERVAL '30 days')
      END,
      COALESCE(new_is_lifetime_access, false),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      account_expires_at = CASE 
        WHEN EXCLUDED.is_lifetime_access = true THEN NULL
        ELSE EXCLUDED.account_expires_at
      END,
      is_lifetime_access = EXCLUDED.is_lifetime_access,
      updated_at = NOW();
  END IF;

  RETURN true;
END;
$$;
