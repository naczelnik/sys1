/*
  # Naprawa systemu aktualizacji profilu

  1. Nowe kolumny w tabeli profiles
    - phone (telefon użytkownika)
    - company (firma użytkownika) 
    - bio (opis użytkownika)
    - user_metadata (dodatkowe dane JSON)

  2. Funkcje
    - Bezpieczna aktualizacja profilu z walidacją
    - Synchronizacja danych między auth.users i profiles

  3. Polityki
    - Aktualizacja polityk RLS dla nowych kolumn
    - Zapewnienie szybkiego dostępu do danych
*/

-- Dodaj brakujące kolumny do tabeli profiles
DO $$
BEGIN
  -- Dodaj kolumnę phone jeśli nie istnieje
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  -- Dodaj kolumnę company jeśli nie istnieje
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'company'
  ) THEN
    ALTER TABLE profiles ADD COLUMN company text;
  END IF;

  -- Dodaj kolumnę bio jeśli nie istnieje
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text;
  END IF;

  -- Dodaj kolumnę user_metadata jeśli nie istnieje
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_metadata'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_metadata jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Funkcja do szybkiej aktualizacji profilu
CREATE OR REPLACE FUNCTION update_profile_data(
  profile_id uuid,
  full_name_param text DEFAULT NULL,
  phone_param text DEFAULT NULL,
  company_param text DEFAULT NULL,
  bio_param text DEFAULT NULL,
  metadata_param jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_profile profiles%ROWTYPE;
BEGIN
  -- Sprawdź uprawnienia
  IF auth.uid() != profile_id AND NOT is_super_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień do aktualizacji tego profilu';
  END IF;

  -- Wykonaj aktualizację z RETURNING
  UPDATE profiles SET
    full_name = COALESCE(full_name_param, full_name),
    phone = COALESCE(phone_param, phone),
    company = COALESCE(company_param, company),
    bio = COALESCE(bio_param, bio),
    user_metadata = COALESCE(metadata_param, user_metadata),
    updated_at = now()
  WHERE id = profile_id
  RETURNING * INTO updated_profile;

  -- Jeśli profil nie istnieje, utwórz go
  IF NOT FOUND THEN
    INSERT INTO profiles (
      id, 
      email, 
      full_name, 
      phone, 
      company, 
      bio, 
      user_metadata,
      created_at,
      updated_at
    )
    VALUES (
      profile_id,
      (SELECT email FROM auth.users WHERE id = profile_id),
      full_name_param,
      phone_param,
      company_param,
      bio_param,
      COALESCE(metadata_param, '{}'::jsonb),
      now(),
      now()
    )
    RETURNING * INTO updated_profile;
  END IF;

  -- Zwróć zaktualizowany profil jako JSON
  RETURN row_to_json(updated_profile);
END;
$$;

-- Funkcja do pobierania pełnych danych profilu
CREATE OR REPLACE FUNCTION get_profile_data(profile_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_data profiles%ROWTYPE;
BEGIN
  -- Sprawdź uprawnienia
  IF auth.uid() != profile_id AND NOT is_super_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień do odczytu tego profilu';
  END IF;

  -- Pobierz dane profilu
  SELECT * INTO profile_data
  FROM profiles
  WHERE id = profile_id;

  -- Jeśli profil nie istnieje, utwórz podstawowy
  IF NOT FOUND THEN
    INSERT INTO profiles (
      id,
      email,
      full_name,
      created_at,
      updated_at
    )
    VALUES (
      profile_id,
      (SELECT email FROM auth.users WHERE id = profile_id),
      (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = profile_id),
      now(),
      now()
    )
    RETURNING * INTO profile_data;
  END IF;

  RETURN row_to_json(profile_data);
END;
$$;

-- Trigger do automatycznej synchronizacji z auth.users
CREATE OR REPLACE FUNCTION sync_profile_with_auth()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Synchronizuj zmiany z auth.users jeśli to możliwe
  IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
    -- Aktualizuj metadane w auth.users (może się nie udać, ale nie blokujemy)
    BEGIN
      UPDATE auth.users SET
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
                           jsonb_build_object('full_name', NEW.full_name)
      WHERE id = NEW.id;
    EXCEPTION WHEN OTHERS THEN
      -- Ignoruj błędy synchronizacji z auth.users
      NULL;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Dodaj trigger synchronizacji
DROP TRIGGER IF EXISTS sync_profile_trigger ON profiles;
CREATE TRIGGER sync_profile_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION sync_profile_with_auth();

-- Aktualizuj polityki RLS dla nowych kolumn
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_super_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_super_admin())
  WITH CHECK (auth.uid() = id OR is_super_admin());

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR is_super_admin());

-- Indeksy dla szybszych zapytań
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_company ON profiles(company) WHERE company IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

-- Funkcja do walidacji numeru telefonu
CREATE OR REPLACE FUNCTION validate_phone_number(phone_number text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- Podstawowa walidacja numeru telefonu
  IF phone_number IS NULL OR length(trim(phone_number)) = 0 THEN
    RETURN true; -- Pusty numer jest OK
  END IF;

  -- Sprawdź czy zawiera tylko dozwolone znaki
  IF phone_number !~ '^[\+]?[0-9\s\-\(\)]{7,20}$' THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Trigger walidacji danych profilu
CREATE OR REPLACE FUNCTION validate_profile_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Walidacja numeru telefonu
  IF NOT validate_phone_number(NEW.phone) THEN
    RAISE EXCEPTION 'Nieprawidłowy format numeru telefonu';
  END IF;

  -- Walidacja długości pól
  IF NEW.full_name IS NOT NULL AND length(trim(NEW.full_name)) > 100 THEN
    RAISE EXCEPTION 'Imię i nazwisko nie może być dłuższe niż 100 znaków';
  END IF;

  IF NEW.company IS NOT NULL AND length(trim(NEW.company)) > 100 THEN
    RAISE EXCEPTION 'Nazwa firmy nie może być dłuższa niż 100 znaków';
  END IF;

  IF NEW.bio IS NOT NULL AND length(trim(NEW.bio)) > 500 THEN
    RAISE EXCEPTION 'Bio nie może być dłuższe niż 500 znaków';
  END IF;

  -- Ustaw timestamp aktualizacji
  NEW.updated_at = now();

  RETURN NEW;
END;
$$;

-- Dodaj trigger walidacji
DROP TRIGGER IF EXISTS validate_profile_update_trigger ON profiles;
CREATE TRIGGER validate_profile_update_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_update();
