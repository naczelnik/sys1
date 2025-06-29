/*
  # System ważności konta z rolami

  1. Aktualizacja tabeli profiles
    - Dodanie pola account_expires_at
    - Domyślny roczny dostęp dla nowych użytkowników
    - Dożywotni dostęp dla Super Admin

  2. Funkcje
    - Automatyczne ustawianie daty ważności przy rejestracji
    - Funkcja sprawdzania ważności konta
    - Funkcja przedłużania ważności przez administratora

  3. Triggery
    - Automatyczne ustawianie ważności dla nowych użytkowników
    - Aktualizacja przy zmianach ról

  4. Polityki
    - Kontrola dostępu do zarządzania ważnością konta
*/

-- Dodaj pole account_expires_at do tabeli profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'account_expires_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN account_expires_at timestamptz;
  END IF;
END $$;

-- Funkcja do ustawiania domyślnej ważności konta (1 rok)
CREATE OR REPLACE FUNCTION set_default_account_expiration()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Jeśli to nowy profil i nie ma ustawionej daty ważności
  IF NEW.account_expires_at IS NULL THEN
    -- Super Admin ma dożywotni dostęp (NULL = bez ograniczeń)
    IF EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = NEW.id 
      AND r.name = 'super_admin' 
      AND ur.is_active = true
    ) THEN
      NEW.account_expires_at = NULL;
    ELSE
      -- Standardowi użytkownicy mają roczny dostęp
      NEW.account_expires_at = now() + interval '1 year';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Dodaj trigger dla automatycznego ustawiania ważności
DROP TRIGGER IF EXISTS set_account_expiration_trigger ON profiles;
CREATE TRIGGER set_account_expiration_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_default_account_expiration();

-- Funkcja do sprawdzania czy konto jest aktywne
CREATE OR REPLACE FUNCTION is_account_active(user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  expires_at timestamptz;
BEGIN
  -- Pobierz datę ważności konta
  SELECT account_expires_at INTO expires_at
  FROM profiles
  WHERE id = user_id;

  -- NULL oznacza dożywotni dostęp
  IF expires_at IS NULL THEN
    RETURN true;
  END IF;

  -- Sprawdź czy konto nie wygasło
  RETURN expires_at > now();
END;
$$;

-- Funkcja do przedłużania ważności konta (tylko dla administratorów)
CREATE OR REPLACE FUNCTION extend_account_expiration(
  target_user_id uuid,
  new_expiration timestamptz DEFAULT NULL,
  is_lifetime boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Sprawdź uprawnienia (tylko Super Admin lub Admin)
  IF NOT (is_super_admin() OR has_permission('users.manage_roles')) THEN
    RAISE EXCEPTION 'Brak uprawnień do zarządzania ważnością kont';
  END IF;

  -- Ustaw nową datę ważności
  IF is_lifetime THEN
    -- Dożywotni dostęp
    UPDATE profiles SET
      account_expires_at = NULL,
      updated_at = now()
    WHERE id = target_user_id;
  ELSIF new_expiration IS NOT NULL THEN
    -- Konkretna data
    UPDATE profiles SET
      account_expires_at = new_expiration,
      updated_at = now()
    WHERE id = target_user_id;
  ELSE
    -- Przedłuż o rok od teraz
    UPDATE profiles SET
      account_expires_at = now() + interval '1 year',
      updated_at = now()
    WHERE id = target_user_id;
  END IF;

  RETURN true;
END;
$$;

-- Funkcja do pobierania informacji o roli i ważności konta
CREATE OR REPLACE FUNCTION get_user_account_info(user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
  user_role text,
  role_description text,
  account_expires_at timestamptz,
  is_lifetime_access boolean,
  days_remaining integer,
  is_expired boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(r.name, 'user') as user_role,
    COALESCE(r.description, 'Standardowy użytkownik') as role_description,
    p.account_expires_at,
    (p.account_expires_at IS NULL) as is_lifetime_access,
    CASE 
      WHEN p.account_expires_at IS NULL THEN NULL
      ELSE GREATEST(0, EXTRACT(days FROM (p.account_expires_at - now()))::integer)
    END as days_remaining,
    CASE 
      WHEN p.account_expires_at IS NULL THEN false
      ELSE p.account_expires_at <= now()
    END as is_expired
  FROM profiles p
  LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.is_active = true
  LEFT JOIN roles r ON r.id = ur.role_id
  WHERE p.id = user_id
  ORDER BY r.name = 'super_admin' DESC, r.name = 'admin' DESC
  LIMIT 1;
END;
$$;

-- Ustaw domyślną ważność dla istniejących użytkowników
UPDATE profiles SET
  account_expires_at = CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = profiles.id 
      AND r.name = 'super_admin' 
      AND ur.is_active = true
    ) THEN NULL  -- Super Admin ma dożywotni dostęp
    ELSE now() + interval '1 year'  -- Inni mają roczny dostęp
  END
WHERE account_expires_at IS NULL;

-- Dodaj indeks dla wydajności
CREATE INDEX IF NOT EXISTS idx_profiles_account_expires_at ON profiles(account_expires_at);

-- Funkcja do automatycznego przypisywania roli 'user' nowym użytkownikom
CREATE OR REPLACE FUNCTION assign_default_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role_id uuid;
BEGIN
  -- Pobierz ID roli 'user'
  SELECT id INTO user_role_id FROM roles WHERE name = 'user';
  
  -- Przypisz rolę 'user' jeśli użytkownik nie ma żadnej roli
  IF NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = NEW.id
  ) THEN
    INSERT INTO user_roles (user_id, role_id, is_active)
    VALUES (NEW.id, user_role_id, true);
  END IF;

  RETURN NEW;
END;
$$;

-- Dodaj trigger dla automatycznego przypisywania roli
DROP TRIGGER IF EXISTS assign_default_role_trigger ON profiles;
CREATE TRIGGER assign_default_role_trigger
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_default_user_role();
