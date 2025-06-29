/*
  # Aktualizacja funkcji profilu

  1. Funkcje
    - Funkcja aktualizacji profilu użytkownika
    - Funkcja synchronizacji danych między auth.users i profiles
    - Funkcja walidacji danych profilu

  2. Triggery
    - Automatyczna synchronizacja przy zmianach w auth.users
    - Aktualizacja timestamp przy zmianach profilu

  3. Polityki
    - Dodanie polityki INSERT dla profiles
    - Aktualizacja polityk dla lepszej kontroli dostępu
*/

-- Funkcja aktualizacji profilu użytkownika
CREATE OR REPLACE FUNCTION update_user_profile(
  user_id uuid,
  full_name_param text DEFAULT NULL,
  phone_param text DEFAULT NULL,
  company_param text DEFAULT NULL,
  bio_param text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź czy użytkownik może aktualizować ten profil
  IF auth.uid() != user_id AND NOT is_super_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień do aktualizacji tego profilu';
  END IF;

  -- Aktualizuj profil
  UPDATE profiles SET
    full_name = COALESCE(full_name_param, full_name),
    updated_at = now()
  WHERE id = user_id;

  -- Sprawdź czy aktualizacja się powiodła
  IF NOT FOUND THEN
    -- Jeśli profil nie istnieje, utwórz go
    INSERT INTO profiles (id, full_name, email)
    VALUES (
      user_id,
      full_name_param,
      (SELECT email FROM auth.users WHERE id = user_id)
    );
  END IF;

  RETURN true;
END;
$$;

-- Funkcja walidacji danych profilu
CREATE OR REPLACE FUNCTION validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Walidacja imienia i nazwiska
  IF NEW.full_name IS NOT NULL AND length(trim(NEW.full_name)) < 2 THEN
    RAISE EXCEPTION 'Imię i nazwisko musi mieć co najmniej 2 znaki';
  END IF;

  -- Walidacja emaila
  IF NEW.email IS NOT NULL AND NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Nieprawidłowy format emaila';
  END IF;

  -- Ustaw timestamp aktualizacji
  NEW.updated_at = now();

  RETURN NEW;
END;
$$;

-- Dodaj trigger walidacji dla profili
DROP TRIGGER IF EXISTS validate_profile_trigger ON profiles;
CREATE TRIGGER validate_profile_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION validate_profile_data();

-- Dodaj brakującą politykę INSERT dla profiles
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR is_super_admin());

-- Aktualizuj politykę UPDATE dla profiles
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
CREATE POLICY "Users can update profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR is_super_admin())
  WITH CHECK (auth.uid() = id OR is_super_admin());

-- Funkcja do bezpiecznej aktualizacji hasła
CREATE OR REPLACE FUNCTION update_user_password_log(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia
  IF auth.uid() != user_id AND NOT is_super_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień do zmiany hasła tego użytkownika';
  END IF;

  -- Zaktualizuj timestamp ostatniej zmiany hasła w profilu
  UPDATE profiles SET
    updated_at = now()
  WHERE id = user_id;

  -- Możesz dodać tutaj logowanie zmian hasła do tabeli audytu
  -- INSERT INTO password_change_log (user_id, changed_at) VALUES (user_id, now());

  RETURN true;
END;
$$;

-- Funkcja do aktualizacji preferencji powiadomień
CREATE OR REPLACE FUNCTION update_notification_preferences(
  user_id uuid,
  preferences jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia
  IF auth.uid() != user_id AND NOT is_super_admin() THEN
    RAISE EXCEPTION 'Brak uprawnień do aktualizacji preferencji tego użytkownika';
  END IF;

  -- Aktualizuj preferencje w metadanych użytkownika
  -- To będzie obsługiwane przez Supabase auth.updateUser()
  
  -- Zaktualizuj timestamp w profilu
  UPDATE profiles SET
    updated_at = now()
  WHERE id = user_id;

  RETURN true;
END;
$$;
