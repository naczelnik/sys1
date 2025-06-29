/*
  # Funkcje zarządzania hasłami użytkowników

  1. Nowe funkcje
    - `create_user_with_profile_and_password` - Tworzenie użytkownika z hasłem
    - `admin_change_user_password` - Zmiana hasła użytkownika przez administratora

  2. Security
    - Funkcje dostępne tylko dla administratorów
    - Bezpieczne zarządzanie hasłami
*/

-- Funkcja do tworzenia użytkownika z profilem i hasłem
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
  auth_user_data jsonb;
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users.manage', auth.uid())
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

  -- Wygeneruj UUID dla nowego użytkownika
  new_user_id := gen_random_uuid();

  -- Utwórz użytkownika w auth.users (jeśli mamy dostęp)
  BEGIN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      user_email,
      crypt(user_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', user_full_name),
      false,
      'authenticated'
    );
  EXCEPTION WHEN OTHERS THEN
    -- Jeśli nie można dodać do auth.users, kontynuuj z profilem
    RAISE NOTICE 'Could not create auth user, creating profile only';
  END;

  -- Utwórz profil użytkownika
  INSERT INTO profiles (id, full_name, email)
  VALUES (new_user_id, user_full_name, user_email)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;

  -- Przypisz rolę
  INSERT INTO user_roles (user_id, role_id, assigned_by, is_active)
  VALUES (new_user_id, role_id, auth.uid(), true)
  ON CONFLICT (user_id, role_id) 
  DO UPDATE SET is_active = true, assigned_by = auth.uid(), assigned_at = NOW();

  -- Utwórz konto użytkownika z domyślnym wygaśnięciem za 30 dni
  INSERT INTO user_accounts (user_id, expires_at, is_lifetime_access)
  VALUES (new_user_id, NOW() + INTERVAL '30 days', false)
  ON CONFLICT (user_id) DO UPDATE SET
    expires_at = EXCLUDED.expires_at,
    is_lifetime_access = EXCLUDED.is_lifetime_access;

  RETURN new_user_id;
END;
$$;

-- Funkcja do zmiany hasła użytkownika przez administratora
CREATE OR REPLACE FUNCTION admin_change_user_password(
  target_user_id uuid,
  new_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia
  IF NOT (
    SELECT has_permission('users.manage', auth.uid())
    OR is_super_admin(auth.uid())
  ) THEN
    RAISE EXCEPTION 'Brak uprawnień do zmiany haseł użytkowników';
  END IF;

  -- Sprawdź czy hasło ma odpowiednią długość
  IF LENGTH(new_password) < 6 THEN
    RAISE EXCEPTION 'Hasło musi mieć co najmniej 6 znaków';
  END IF;

  -- Zmień hasło w auth.users (jeśli użytkownik istnieje)
  BEGIN
    UPDATE auth.users 
    SET 
      encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
    WHERE id = target_user_id;
    
    -- Sprawdź czy użytkownik został znaleziony
    IF NOT FOUND THEN
      RAISE NOTICE 'User not found in auth.users, password change skipped';
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not update password in auth.users: %', SQLERRM;
  END;

  -- Zapisz informację o zmianie hasła w logach (opcjonalnie)
  INSERT INTO user_activity_logs (user_id, action, performed_by, created_at)
  VALUES (target_user_id, 'password_changed', auth.uid(), NOW())
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- Tabela logów aktywności użytkowników (jeśli nie istnieje)
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  performed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT NOW(),
  details jsonb
);

-- Indeks dla wydajności
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at);
