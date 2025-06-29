/*
  # Fix User Creation - Auth Admin Functions

  1. New Functions
    - `create_user_with_profile` - Bezpieczne tworzenie użytkowników bez admin.createUser
    - `setup_new_user_profile` - Konfiguracja profilu nowego użytkownika

  2. Security
    - Funkcje dostępne tylko dla super_admin i admin
    - Bezpieczne tworzenie użytkowników bez wymagania admin API
*/

-- Funkcja do tworzenia użytkownika z profilem (bez admin.createUser)
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

-- Funkcja do konfiguracji profilu po rejestracji przez auth.users
CREATE OR REPLACE FUNCTION setup_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Pobierz ID domyślnej roli 'user'
  SELECT id INTO default_role_id
  FROM roles
  WHERE name = 'user';

  -- Utwórz profil
  INSERT INTO profiles (id, email, updated_at)
  VALUES (NEW.id, NEW.email, NOW());

  -- Przypisz domyślną rolę
  INSERT INTO user_roles (user_id, role_id, is_active, assigned_at)
  VALUES (NEW.id, default_role_id, true, NOW());

  -- Utwórz konto z domyślnym wygaśnięciem
  INSERT INTO user_accounts (user_id, account_expires_at, is_lifetime_access, created_at, updated_at)
  VALUES (NEW.id, NOW() + INTERVAL '30 days', false, NOW(), NOW());

  RETURN NEW;
END;
$$;

-- Trigger dla automatycznego tworzenia profilu po rejestracji
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION setup_new_user_profile();

-- Funkcja do wysyłania zaproszenia email (placeholder)
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
  -- Tutaj można dodać logikę wysyłania emaila z zaproszeniem
  -- Na razie zwracamy true jako placeholder
  
  RAISE NOTICE 'Zaproszenie wysłane do: % (%) z hasłem: %', user_full_name, user_email, temp_password;
  
  RETURN true;
END;
$$;
